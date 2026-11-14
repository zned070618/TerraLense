export function renderOverview() {
  const mountPoint = document.querySelector("#overviewMount");
  if (!mountPoint) {
    throw new Error("Overview mount point not found");
  }

  mountPoint.outerHTML = `
    <section class="hero section" id="explore" data-nav="Overview">
      <div class="hero-copy">
        <p class="eyebrow">
          <span class="status-dot"></span> A NEW PERSPECTIVE ON OUR PLANET
        </p>
        <h1>A clearer view.<br /><span>A brighter Earth.</span></h1>
        <p class="hero-text">
          Explore the world. Reveal the patterns.<br />Turn NASA climate data
          into a deeper understanding of our changing planet.
        </p>
        <div class="hero-actions">
          <a class="btn primary" href="#investigate"
            ><i data-icon="globe"></i>Explore the Earth<i
              data-icon="arrow-right"
            ></i></a
          ><a class="btn secondary" href="#history"
            ><i data-icon="chart"></i>View climate data</a
          >
        </div>
        <div class="hero-proof">
          <span><i data-icon="check"></i>Real NASA data</span
          ><span><i data-icon="layers"></i>5 climate parameters</span
          ><span><i data-icon="globe"></i>Global coverage</span>
        </div>
        <img
          class="landing-logo"
          src="./assets/terralense-logo.png"
          alt="TerraLens — See a brighter Earth"
          width="180"
          height="120"
        />
      </div>
      <div class="earth-stage" id="heroGlobe">
        <div class="globe-hud">
          <span><span class="status-dot"></span> EARTH EXPLORER</span
          ><span class="hud-tag">3D / INTERACTIVE</span>
        </div>
        <div class="globe-loading" id="globeLoading">
          <img src="./assets/terralense-logo.png" alt="TerraLens" /><span
            class="spinner"
          ></span
          ><span>Preparing your perspective...</span>
        </div>
        <canvas
          id="earthCanvas"
          tabindex="0"
          aria-label="Interactive Earth. Drag to rotate, scroll to zoom, click to select a location. Use coordinate controls for keyboard selection."
        ></canvas>
        <div class="globe-fallback" id="globeFallback" hidden>
          3D Earth is unavailable.
          <a href="#investigate">Explore with the 2D map.</a>
        </div>
        <div class="globe-bottom">
          <div>
            <span class="micro-label">SELECTED COORDINATES</span
            ><strong id="heroCoords">14.5995&deg; N, 120.9842&deg; E</strong
            ><span class="globe-hint"
              >Drag to orbit &middot; Scroll to zoom &middot; Click to
              select</span
            >
          </div>
          <div class="globe-buttons">
            <button
              class="icon-button"
              id="pauseGlobe"
              title="Pause automatic rotation"
              aria-label="Pause automatic rotation"
              aria-pressed="false"
            >
              <i data-icon="pause"></i></button
            ><button
              class="icon-button"
              id="resetGlobe"
              title="Reset globe view"
              aria-label="Reset globe view"
            >
              <i data-icon="reset"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
    <div class="context-strip">
      <div>
        <i data-icon="pin"></i
        ><span
          >Selected location<strong id="statusLocation"
            >Metro Manila</strong
          ></span
        >
      </div>
      <div>
        <i data-icon="calendar"></i
        ><span
          >Historical period<strong id="statusPeriod">2001–2025</strong></span
        >
      </div>
      <div>
        <i data-icon="layers"></i
        ><span
          >Active parameter<strong id="statusVariable"
            >Temperature</strong
          ></span
        >
      </div>
      <div class="data-status">
        <span class="status-dot muted-dot" id="dataStatusDot"></span
        ><span id="dataStatus">Ready to explore</span>
      </div>
    </div>
  `;
}