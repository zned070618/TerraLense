export function renderDataExport() {
  const mountPoint = document.querySelector("#dataExportMount");
  if (!mountPoint) {
    throw new Error("reports mount point not found");
  }

  mountPoint.outerHTML = `
    <section class="section" id="reports" data-nav="Data Export">
      <div class="report-panel glass">
        <div class="export-emblem"><i data-icon="download"></i></div>
        <div>
          <p class="eyebrow">05 / TAKE YOUR FINDINGS FURTHER</p>
          <h2>Your research. Ready to share.</h2>
          <p>
            Download all five parameters with NASA units and source
            references, save your chart, or print an investigation report.
          </p>
          <span id="exportMeta" class="micro-label"
            >FETCH A DATASET TO ENABLE EXPORTS</span
          >
        </div>
        <div class="export-actions">
          <button class="btn primary" id="downloadCsv" disabled>
            <i data-icon="download"></i>Download CSV</button
          ><button class="btn secondary" id="printReport" disabled>
            <i data-icon="print"></i>Print report
          </button>
        </div>
      </div>
    </section>
  `;
}
