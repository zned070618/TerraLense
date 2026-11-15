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
            Download all five climate parameters as a CSV file or save a
            detailed, data-driven investigation report as a PDF.
          </p>
          <span id="exportMeta" class="micro-label"
            >FETCH A DATASET TO ENABLE EXPORTS</span
          >
        </div>
        <div class="export-actions">
          <button class="btn primary" id="downloadReport" disabled>
            <i data-icon="download"></i>Download
          </button>
        </div>
      </div>
    </section>
    <dialog class="export-dialog" id="exportFormatDialog" aria-labelledby="exportDialogTitle">
      <form method="dialog">
        <p class="eyebrow">EXPORT YOUR INVESTIGATION</p>
        <h2 id="exportDialogTitle">Choose a file format</h2>
        <p class="export-dialog-copy">Select how you want to save this NASA climate dataset and its findings.</p>
        <div class="export-format-options">
          <button class="export-format-option" id="downloadCsv" type="button">
            <span class="export-format-icon"><i data-icon="download"></i></span>
            <span><strong>CSV file</strong><small>All five parameters and monthly observations</small></span>
            <i data-icon="arrow-right"></i>
          </button>
          <button class="export-format-option" id="downloadPdf" type="button">
            <span class="export-format-icon"><i data-icon="print"></i></span>
            <span><strong>PDF report</strong><small>Findings, summaries, and charts · Save as PDF</small></span>
            <i data-icon="arrow-right"></i>
          </button>
        </div>
        <div class="export-dialog-footer">
          <span>PDF opens your browser’s save or print dialog.</span>
          <button class="btn quiet small" id="cancelExport" type="submit">Cancel</button>
        </div>
      </form>
    </dialog>
  `;
}
