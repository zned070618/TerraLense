export function renderTopbar() {
  const mountPoint = document.querySelector("#topbarMount");
  if (!mountPoint) {
    throw new Error("Topbar mount point not found");
  }

  mountPoint.outerHTML = `
    <header class="topbar">
      <div class="header-left">
        <button
          class="icon-button"
          id="mobileMenu"
          aria-controls="sidebar"
          aria-expanded="false"
          aria-label="Open navigation"
        >
          <i data-icon="menu"></i></button
        ><a class="compact-brand" href="#explore" aria-label="TerraLens home"
          ><span class="logo-crop"
            ><img src="./assets/terralense-logo.png" alt="" /></span></a
        ><span class="breadcrumb"
          >Workspace <span>/</span>
          <strong id="activeSection">Overview</strong></span
        >
      </div>
      <div class="header-right">
        <span class="source-badge"
          ><span class="status-dot"></span> NASA POWER</span
        ><span class="header-divider"></span
        ><a href="#sources" class="mission-link"
          >SPACE APPS <span>2026</span><i data-icon="arrow-up-right"></i
        ></a>
      </div>
    </header>
  `;
}