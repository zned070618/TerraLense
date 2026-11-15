import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { icon } from "./ui.js";

const texturePromises = new Map();
function texture(file, color = false) {
  if (!texturePromises.has(file))
    texturePromises.set(
      file,
      new THREE.TextureLoader().loadAsync(`./assets/${file}`).then((result) => {
        if (color) result.colorSpace = THREE.SRGBColorSpace;
        result.anisotropy = 4;
        return result;
      }),
    );
  return texturePromises.get(file);
}
export function latLngVector(lat, lng, radius = 2) {
  const phi = THREE.MathUtils.degToRad(lat),
    theta = THREE.MathUtils.degToRad(lng);
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.cos(theta),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(theta),
  );
}
export function vectorLatLng(point) {
  return {
    lat: THREE.MathUtils.radToDeg(
      Math.asin(THREE.MathUtils.clamp(point.y / point.length(), -1, 1)),
    ),
    lng: THREE.MathUtils.radToDeg(Math.atan2(-point.z, point.x)),
  };
}

export async function createEarthGlobe({
  canvas,
  location,
  onSelect,
  pauseButton,
  resetButton,
  loading,
  fallback,
  cinematic = false,
}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.copy(
      latLngVector(location.lat, location.lng, cinematic ? 9.2 : 7.3),
    );
    scene.add(camera);
    const sun = new THREE.DirectionalLight(0xd8f3ff, 2.2);
    sun.position.set(-3, 3, 5);
    camera.add(sun);
    scene.add(new THREE.AmbientLight(0x9ebfd6, 1.1));
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 4.8;
    controls.maxDistance = 12;
    controls.autoRotateSpeed = 0.4;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.65;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let paused = reduced.matches,
      lastInteraction = -Infinity,
      focusTarget = cinematic
        ? latLngVector(location.lat, location.lng, 7.3)
        : null,
      selected = { ...location };
    const updatePause = () => {
      pauseButton.setAttribute("aria-pressed", String(paused));
      pauseButton.setAttribute(
        "aria-label",
        paused ? "Resume automatic rotation" : "Pause automatic rotation",
      );
      pauseButton.title = paused
        ? "Resume automatic rotation"
        : "Pause automatic rotation";
      pauseButton.innerHTML = icon(paused ? "play" : "pause");
    };
    pauseButton.addEventListener("click", () => {
      paused = !paused;
      updatePause();
    });
    updatePause();
    reduced.addEventListener("change", () => {
      if (reduced.matches) {
        paused = true;
        updatePause();
      }
    });
    const geometry = new THREE.SphereGeometry(2, 72, 48);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 12,
      specular: 0x324b63,
    });
    const earth = new THREE.Mesh(geometry, earthMaterial);
    scene.add(earth);
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.06, 64, 40),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader:
          "varying vec3 vNormal; varying vec3 vPosition; void main(){ vec4 world = modelMatrix * vec4(position,1.0); vPosition=world.xyz; vNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*world; }",
        fragmentShader:
          "varying vec3 vNormal; varying vec3 vPosition; void main(){float rim=pow(1.0-max(dot(normalize(cameraPosition-vPosition),normalize(vNormal)),0.0),4.0);gl_FragColor=vec4(0.12,0.58,0.85,rim*0.42);}",
      }),
    );
    scene.add(atmosphere);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x91ffe5 }),
    );
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.052, 0.066, 48),
      new THREE.MeshBasicMaterial({
        color: 0x64eed3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    scene.add(marker, halo);
    function setMarker(lat, lng) {
      marker.position.copy(latLngVector(lat, lng, 2.025));
      halo.position.copy(latLngVector(lat, lng, 2.029));
      halo.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        marker.position.clone().normalize(),
      );
    }
    setMarker(location.lat, location.lng);
    function focus(lat, lng, moveCamera = true) {
      selected = { lat, lng };
      setMarker(lat, lng);
      if (moveCamera) {
        focusTarget = latLngVector(
          lat,
          lng,
          Math.max(6, camera.position.length()),
        );
        lastInteraction = performance.now();
      }
    }
    resetButton.addEventListener("click", () => {
      focusTarget = latLngVector(selected.lat, selected.lng, 7.3);
      lastInteraction = performance.now();
    });
    controls.addEventListener("start", () => {
      lastInteraction = performance.now();
      focusTarget = null;
    });
    controls.addEventListener("end", () => {
      lastInteraction = performance.now();
    });
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let down;
    canvas.addEventListener("pointerdown", (event) => {
      down = { x: event.clientX, y: event.clientY, at: performance.now() };
    });
    canvas.addEventListener("pointerup", (event) => {
      if (
        !down ||
        event.button !== 0 ||
        Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5 ||
        performance.now() - down.at > 700
      )
        return;
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(earth)[0];
      if (hit) {
        const coords = vectorLatLng(earth.worldToLocal(hit.point.clone()));
        onSelect(coords);
      }
      down = null;
    });
    canvas.addEventListener("keydown", (event) => {
      if (event.key === " ") {
        event.preventDefault();
        paused = !paused;
        updatePause();
      }
      if (event.key === "Home") {
        event.preventDefault();
        resetButton.click();
      }
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-"].includes(
          event.key,
        )
      ) {
        event.preventDefault();
        lastInteraction = performance.now();
        const spherical = new THREE.Spherical().setFromVector3(camera.position);
        if (event.key === "ArrowLeft") spherical.theta -= 0.1;
        if (event.key === "ArrowRight") spherical.theta += 0.1;
        if (event.key === "ArrowUp")
          spherical.phi = Math.max(0.1, spherical.phi - 0.1);
        if (event.key === "ArrowDown")
          spherical.phi = Math.min(Math.PI - 0.1, spherical.phi + 0.1);
        if (event.key === "+")
          spherical.radius = Math.max(4.8, spherical.radius - 0.4);
        if (event.key === "-")
          spherical.radius = Math.min(12, spherical.radius + 0.4);
        camera.position.setFromSpherical(spherical);
        controls.update();
      }
    });
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    });
    observer.observe(canvas);
    let visible = true;
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "100px" },
    );
    visibility.observe(canvas);
    let lastFrame = 0;
    function animate(now) {
      requestAnimationFrame(animate);
      if (!visible || document.hidden || now - lastFrame < 30) return;
      lastFrame = now;
      if (focusTarget) {
        camera.position.lerp(focusTarget, reduced.matches ? 1 : 0.09);
        if (camera.position.distanceTo(focusTarget) < 0.005) focusTarget = null;
      }
      controls.autoRotate =
        !paused &&
        !reduced.matches &&
        !focusTarget &&
        now - lastInteraction > 7000;
      controls.update();
      if (!reduced.matches) {
        halo.scale.setScalar(1 + 0.22 * Math.sin(now * 0.002));
        halo.material.opacity = 0.6 + 0.2 * Math.sin(now * 0.002);
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      if (fallback) fallback.hidden = false;
    });
    // The main surface is required. Detail layers may fail without disabling selection.
    earthMaterial.map = await texture("earth-day.jpg", true);
    earthMaterial.needsUpdate = true;
    const optional = await Promise.allSettled([
      texture("earth-normal.jpg"),
      texture("earth-specular.jpg"),
      texture("earth-clouds.png", true),
    ]);
    if (optional[0].status === "fulfilled") {
      earthMaterial.normalMap = optional[0].value;
      earthMaterial.normalScale.set(0.45, 0.45);
    }
    if (optional[1].status === "fulfilled")
      earthMaterial.specularMap = optional[1].value;
    if (optional[2].status === "fulfilled") {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(2.013, 64, 40),
        new THREE.MeshPhongMaterial({
          map: optional[2].value,
          transparent: true,
          opacity: 0.27,
          depthWrite: false,
        }),
      );
      scene.add(clouds);
    }
    earthMaterial.needsUpdate = true;
    if (loading) loading.hidden = true;
    canvas.dataset.ready = "true";
    return {
      focus,
      resize: () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width && rect.height) {
          renderer.setSize(rect.width, rect.height, false);
          camera.aspect = rect.width / rect.height;
          camera.updateProjectionMatrix();
        }
      },
    };
  } catch (error) {
    if (loading) loading.hidden = true;
    if (fallback) fallback.hidden = false;
    console.warn("TerraLens globe unavailable:", error.message);
    return null;
  }
}
