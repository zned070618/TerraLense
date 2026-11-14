export function renderClimateAnalytics() {
  const mountPoint = document.querySelector("#climateAnalyticsMount");
  if (!mountPoint) {
    throw new Error("analytics mount point not found");
  }

  mountPoint.outerHTML = `
    <section class="section" id="analytics" data-nav="Climate Analytics">
      <div class="section-heading">
        <div>
          <p class="eyebrow">03 / CLIMATE ANALYTICS</p>
          <h2>A different lens on the same planet.</h2>
          <p>
            Compare seasonal patterns and investigate shifts between
            historical periods.
          </p>
        </div>
      </div>
      <div class="analytics-grid">
        <div class="chart-panel glass">
          <div class="panel-title">
            <div>
              <p class="eyebrow">ANNUAL CYCLE</p>
              <h3>Climate through the calendar</h3>
            </div>
            <i data-icon="calendar"></i>
          </div>
          <p class="limitation" id="seasonalNote">
            Monthly climatology will appear after a successful fetch.
          </p>
          <div
            id="seasonalChart"
            class="echart small-chart"
            role="img"
            aria-label="Average climate by calendar month"
          ></div>
        </div>
        <div class="period-panel glass">
          <p class="eyebrow">PERIOD COMPARISON</p>
          <h3>Compare two period means</h3>
          <p class="limitation">
            Compare the active parameter at the current time scale.
          </p>
          <div class="period-controls">
            <label
              >Period A start<input
                id="periodAStart"
                type="number"
                min="1981"
                max="2025"
                value="2001" /></label
            ><label
              >Period A end<input
                id="periodAEnd"
                type="number"
                min="1981"
                max="2025"
                value="2010" /></label
            ><label
              >Period B start<input
                id="periodBStart"
                type="number"
                min="1981"
                max="2025"
                value="2016" /></label
            ><label
              >Period B end<input
                id="periodBEnd"
                type="number"
                min="1981"
                max="2025"
                value="2025"
            /></label>
          </div>
          <p id="periodResult">Load data to compare period averages.</p>
        </div>
      </div>
      <div id="compare" class="regional-panel glass">
        <div class="panel-title">
          <div>
            <p class="eyebrow">REGIONAL COMPARISON</p>
            <h3 id="compareTitle">Compare trends across locations</h3>
          </div>
          <button class="btn secondary" id="runCompare">
            <i data-icon="layers"></i>Compare locations
          </button>
        </div>
        <div id="compareChecks" class="check-list"></div>
        <div id="compareLoading" class="notice" role="status" hidden>
          <span class="spinner"></span>Fetching comparable NASA POWER data...
        </div>
        <div id="compareOutput">
          <p class="limitation">
            Select at least three locations to compare the same parameter,
            historical period, and trend method.
          </p>
        </div>
      </div>
    </section>
  `;
}
