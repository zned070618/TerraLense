export function renderHistoricalClimate() {
  const mountPoint = document.querySelector("#historicalClimateMount");
  if (!mountPoint) {
    throw new Error("history mount point not found");
  }

  mountPoint.outerHTML = `
    <section class="section" id="history" data-nav="Historical Climate">
      <div class="section-heading">
        <div>
          <p class="eyebrow">02 / HISTORICAL CLIMATE</p>
          <h2>Every pattern tells a story.</h2>
          <p>
            Explore the evidence across months, years, and climate parameters.
          </p>
        </div>
        <a class="text-link" href="#reports"
          >Export dataset <i data-icon="arrow-up-right"></i
        ></a>
      </div>
      <div class="chart-panel glass" id="historyPanel" aria-busy="false">
        <div class="panel-title">
          <div>
            <p class="eyebrow">HISTORICAL SERIES</p>
            <h3 id="chartTitle">Your climate investigation</h3>
          </div>
          <div class="panel-actions">
            <button
              class="btn secondary small"
              id="askChartAi"
              type="button"
              disabled
              title="Ask TerraLens AI about this graph"
            >
              <i data-icon="spark"></i>Ask AI
            </button>
            <button
              class="icon-button"
              id="chartFullscreen"
              aria-label="Open chart fullscreen"
              title="Fullscreen chart"
            >
              <i data-icon="expand"></i></button
            ><button
              class="icon-button"
              id="chartPng"
              aria-label="Download chart PNG"
              title="Download chart PNG"
              disabled
            >
              <i data-icon="image"></i>
            </button>
          </div>
        </div>
        <div class="chart-controls">
          <label>Parameter<select id="chartParameter"></select></label
          ><label
            >Visualization<select id="chartType">
              <option value="line">Line chart</option>
              <option value="bar">Bar chart</option>
              <option value="area">Area chart</option>
              <option value="heatmap">Monthly heatmap</option>
              <option value="donut">Rainfall donut</option>
              <option value="pie">Rainfall pie</option>
              <option value="combined">Temperature + rainfall</option>
            </select></label
          ><label
            >Time scale<select id="resolutionSelect">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select></label
          ><label id="distributionControl" hidden
            >Rainfall groups<select id="distributionGroup">
              <option value="months">Calendar months</option>
              <option value="seasons">DJF / MAM / JJA / SON</option>
            </select></label
          ><label
            >From<input
              id="filterStart"
              type="number"
              min="1981"
              placeholder="Year" /></label
          ><label
            >To<input
              id="filterEnd"
              type="number"
              min="1981"
              placeholder="Year" /></label
          ><button class="btn secondary small" id="applyChartFilter">
            Apply</button
          ><button
            class="icon-button"
            id="resetChartFilter"
            title="Reset chart year filter"
            aria-label="Reset chart year filter"
          >
            <i data-icon="reset"></i>
          </button>
        </div>
        <div id="filterError" class="notice error" role="alert" hidden></div>
        <div class="chart-legend">
          <label
            ><input id="showSeries" type="checkbox" checked /><span
              class="legend-series"
            ></span
            >NASA observations</label
          ><label id="trendLegend"
            ><input id="showTrend" type="checkbox" checked /><span
              class="legend-trend"
            ></span
            >Theil-Sen trend</label
          ><span class="chart-hint"
            >Hover for values · Drag the time slider to zoom</span
          >
        </div>
        <div id="loadingState" class="notice loading" role="status" hidden>
          <img src="./assets/terralens-logo.png" alt="" />
          <div>
            <span class="spinner"></span>Retrieving your climate history from
            NASA POWER...
          </div>
          <div class="chart-skeleton" aria-hidden="true"></div>
        </div>
        <div id="errorState" class="notice error" role="alert" hidden></div>
        <div class="chart-empty" id="chartEmpty">
          <span class="empty-orbit"><i data-icon="chart"></i></span>
          <h3>A world of data, waiting to be explored.</h3>
          <p>
            Select a location and year range, then retrieve its climate
            history.
          </p>
          <button class="btn secondary" id="loadDataTop">
            <i data-icon="download"></i>Fetch NASA data
          </button>
        </div>
        <div
          id="timeChart"
          class="echart"
          role="img"
          aria-label="Historical climate chart"
          hidden
        ></div>
        <div class="chart-footer">
          <p id="dataCoverage">
            Real historical NASA POWER data. No simulated readings.
          </p>
          <span id="retrievedAt">Awaiting first request</span>
        </div>
      </div>
      <div
        class="summary-grid"
        id="summaryGrid"
        aria-label="Trend statistics"
      ></div>
    </section>
  `;
}
