export function renderEarthExplorer() {
  const mountPoint = document.querySelector("#earthExplorerMount");
  if (!mountPoint) {
    throw new Error("investigate mount point not found");
  }

  mountPoint.outerHTML = `
    <section
      class="section workstation"
      id="investigate"
      data-nav="Earth Explorer"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">01 / EARTH EXPLORER</p>
          <h2>Your next discovery starts here.</h2>
          <p>Choose a point on Earth and a moment in its climate history.</p>
        </div>
        <span class="section-tag"
          ><i data-icon="pin"></i> POINT-BASED OBSERVATIONS</span
        >
      </div>
      <div class="workspace">
        <aside
          class="control-panel glass"
          aria-label="Investigation controls"
        >
          <div class="control-title">
            <i data-icon="sliders"></i>
            <h3>Define your investigation</h3>
          </div>
          <label>Quick location<select id="locationSelect"></select></label>
          <div class="coord-grid">
            <label
              >Latitude<input
                id="latInput"
                type="number"
                step="0.0001"
                min="-90"
                max="90" /></label
            ><label
              >Longitude<input
                id="lngInput"
                type="number"
                step="0.0001"
                min="-180"
                max="180"
            /></label>
          </div>
          <label
            >Climate parameter<select id="variableSelect"></select
          ></label>
          <div class="coord-grid">
            <label
              >Start year<input
                id="startYear"
                type="number"
                min="1981"
                max="2025"
                value="2001" /></label
            ><label
              >End year<input
                id="endYear"
                type="number"
                min="1981"
                max="2025"
                value="2025"
            /></label>
          </div>
          <button class="btn primary" id="loadData" type="button">
            <i data-icon="download"></i>Fetch NASA POWER<i
              data-icon="arrow-right"
            ></i></button
          ><button class="btn quiet" id="resetSelection" type="button">
            <i data-icon="reset"></i>Reset Philippines View
          </button>
          <div class="metadata">
            <span class="micro-label">SELECTED POINT</span>
            <p id="coordReadout">14.5995, 120.9842</p>
            <p id="apiReadout">NASA POWER monthly point · community AG</p>
          </div>
        </aside>
        <div class="map-shell glass">
          <div class="explorer-toolbar">
            <div class="segmented" aria-label="Explorer view">
              <button id="showMap" class="selected" aria-pressed="true">
                <i data-icon="map"></i>2D Map</button
              ><button id="showGlobe" aria-pressed="false">
                <i data-icon="globe"></i>3D Globe
              </button>
            </div>
            <span><span class="status-dot"></span> Select anywhere</span>
          </div>
          <div class="explorer-viewport">
            <div
              id="map"
              role="application"
              aria-label="Map location selector"
            ></div>
            <div id="explorerGlobe" hidden>
              <canvas
                id="explorerCanvas"
                tabindex="0"
                aria-label="3D location selector. Drag to rotate, scroll to zoom, click to select."
              ></canvas>
              <div class="explorer-globe-actions">
                <button
                  id="pauseExplorerGlobe"
                  class="icon-button"
                  aria-label="Pause globe rotation"
                  title="Pause globe rotation"
                  aria-pressed="false"
                >
                  <i data-icon="pause"></i></button
                ><button
                  id="resetExplorerGlobe"
                  class="icon-button"
                  aria-label="Reset globe"
                  title="Reset globe"
                >
                  <i data-icon="reset"></i>
                </button>
              </div>
              <p id="explorerGlobeError" class="notice error" hidden>
                3D is unavailable. Switch to the 2D map to select a location.
              </p>
            </div>
            <div class="map-note">
              <i data-icon="pin"></i
              ><span id="explorerHint"
                >Click the map to select a location. Fetch when you are
                ready.</span
              >
            </div>
          </div>
        </div>
      </div>
      <div
        id="selectionNotice"
        class="notice stale"
        role="status"
        hidden
      ></div>
      <div class="metric-heading">
        <h3>A snapshot of your climate</h3>
        <span id="snapshotMeta">Your NASA data will appear here</span>
      </div>
      <div
        class="climate-grid"
        id="climateGrid"
        aria-label="Climate overview"
      ></div>
    </section>
  `;
}
