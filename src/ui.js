const paths = {
  overview:
    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
  chart: '<path d="M4 3v17h17M7 14l4-5 4 3 5-7"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-9 10 9 5 9-5M3 18l9 5 9-5"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4M18 4h4"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.5"/>',
  collapse: '<path d="m14 7-5 5 5 5M4 4v16"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  "arrow-up-right": '<path d="M6 18 18 6M6 6h12v12"/>',
  "arrow-right": '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2"/>',
  sliders:
    '<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16M15 5v16"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-7 5 7"/>',
  print: '<path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6v-7ZM17 12h1"/>',
  temperature:
    '<path d="M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0ZM12 8v9"/><circle cx="12" cy="18" r="1.5"/>',
  rain: '<path d="M5 14a4 4 0 1 1 1-8 6 6 0 0 1 11 1 3.5 3.5 0 1 1 1 7M8 17l-1 4M13 17l-1 4M18 17l-1 4"/>',
  humidity:
    '<path d="M12 2s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="m9 17 6-6M9 12h.01M15 17h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  wind: '<path d="M3 8h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h5a3 3 0 1 1-3 3"/>',
};
export function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((node) => {
    node.outerHTML = icon(node.dataset.icon);
  });
}
let toastTimer;
export function toast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.hidden = true;
  }, 4500);
}
export function initNavigation() {
  hydrateIcons();
  const button = document.querySelector("#mobileMenu"),
    scrim = document.querySelector("#navScrim");
  const close = () => {
    document.body.classList.remove("mobile-nav-open");
    button.setAttribute("aria-expanded", "false");
    scrim.hidden = true;
  };
  button.addEventListener("click", () => {
    const open = !document.body.classList.contains("mobile-nav-open");
    document.body.classList.toggle("mobile-nav-open", open);
    button.setAttribute("aria-expanded", String(open));
    scrim.hidden = !open;
  });
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  document
    .querySelector("#collapseSidebar")
    .addEventListener("click", (event) => {
      const collapsed = document.body.classList.toggle("sidebar-collapsed");
      event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
      event.currentTarget.setAttribute(
        "aria-label",
        collapsed ? "Expand sidebar" : "Collapse sidebar",
      );
      document.querySelectorAll("#sideNav a").forEach((link) => {
        link.title = link.textContent.trim();
      });
    });
  const links = [...document.querySelectorAll("#sideNav a")];
  links.forEach((link) => link.addEventListener("click", close));
  const sections = [...document.querySelectorAll("section[data-nav]")];
  const updateActiveSection = () => {
    const activationLine = window.innerHeight * 0.3;
    const atPageBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 1;
    let activeSection = atPageBottom
      ? sections[sections.length - 1]
      : sections[0];
    if (!atPageBottom) {
      for (const section of sections) {
        if (section.getBoundingClientRect().top > activationLine) break;
        activeSection = section;
      }
    }
    if (!activeSection) return;

    links.forEach((link) => {
      const active = link.hash === `#${activeSection.id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    document.querySelector("#activeSection").textContent =
      activeSection.dataset.nav;
  };
  let updateScheduled = false;
  const scheduleActiveSectionUpdate = () => {
    if (updateScheduled) return;
    updateScheduled = true;
    requestAnimationFrame(() => {
      updateScheduled = false;
      updateActiveSection();
    });
  };
  window.addEventListener("scroll", scheduleActiveSectionUpdate, {
    passive: true,
  });
  window.addEventListener("resize", scheduleActiveSectionUpdate);
  window.addEventListener("hashchange", scheduleActiveSectionUpdate);
  updateActiveSection();
}
