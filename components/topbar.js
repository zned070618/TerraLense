export function renderTopbar() {
  const mountPoint = document.querySelector("#topbarMount");
  if (!mountPoint) {
    throw new Error("Topbar mount point not found");
  }

  mountPoint.outerHTML = `
    <header class="topbar" id="siteHeader">
      <a class="landing-brand" href="#home" data-home aria-label="TerraLens home">
        <img src="./assets/terralens-logo.png" alt="TerraLens" width="118" height="78" />
        <span>EARTH INTELLIGENCE</span>
      </a>
      <div class="header-left app-header-left">
        <button
          class="icon-button"
          id="mobileMenu"
          aria-controls="applicationNav"
          aria-expanded="false"
          aria-label="Open navigation"
        >
          <i data-icon="menu"></i></button
        ><a class="compact-brand" href="#home" data-home aria-label="TerraLens home"
          ><span class="logo-crop"
            ><img src="./assets/terralens-logo.png" alt="" /></span></a
        ><span class="breadcrumb">Workspace <span>/</span>
          <strong id="activeSection">Earth Explorer</strong></span>
      </div>
      <nav class="application-nav" id="applicationNav" aria-label="Application navigation">
        <a href="#home" data-home>Home</a>
        <a href="#investigate" data-section="investigate">Explore</a>
        <a href="#history" data-section="history">Climate Data</a>
        <a href="#analytics" data-section="analytics">Regional Analysis</a>
        <a href="#insights" data-section="insights">Data Insights</a>
        <a href="#reports" data-section="reports">Data Export</a>
        <a href="#sources" data-section="sources">About</a>
      </nav>
      <div class="header-right">
        <span class="source-badge"
          ><span class="status-dot"></span> NASA POWER</span
        ><span class="header-divider"></span
        ><a href="#insights" class="mission-link"
          >SPACE APPS <span>2026</span><i data-icon="arrow-up-right"></i
        ></a>
      </div>
    </header>
  `;
}
