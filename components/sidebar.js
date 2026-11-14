export function renderSidebar() {
  const mountPoint = document.querySelector("#sidebarMount");
  if (!mountPoint) {
    throw new Error("Sidebar mount point not found");
  }

  mountPoint.outerHTML = `
    <aside class="sidebar" id="sidebar" aria-label="Main navigation">
      <a class="sidebar-brand" href="#explore"
        ><img
          src="./assets/terralens-logo.png"
          alt="TerraLens. See a brighter Earth."
          width="200"
          height="133"
      /></a>
      <div class="nav-caption">EARTH INTELLIGENCE</div>
      <nav id="sideNav">
        <a href="#explore" class="active" aria-current="location"
          ><i data-icon="overview"></i><span>Overview</span></a
        >
        <a href="#investigate"
          ><i data-icon="globe"></i><span>Earth Explorer</span></a
        >
        <a href="#history"
          ><i data-icon="chart"></i><span>Historical Climate</span></a
        >
        <a href="#analytics"
          ><i data-icon="layers"></i><span>Climate Analytics</span></a
        >
        <a href="#insights"
          ><i data-icon="spark"></i><span>Data Insights</span></a
        >
        <a href="#reports"
          ><i data-icon="download"></i><span>Data Export</span></a
        >
        <a href="#sources"
          ><i data-icon="info"></i><span>About TerraLens</span></a
        >
      </nav>
      <div class="sidebar-bottom">
        <div class="mission-card">
          <span class="status-dot"></span> NASA Space Apps Challenge<strong
            >One planet. A clearer perspective.</strong
          >
          <p>Built for curiosity.<br />Grounded in NASA data.</p>
        </div>
        <button
          class="icon-button collapse-button"
          id="collapseSidebar"
          aria-label="Collapse sidebar"
          aria-expanded="true"
          title="Collapse sidebar"
        >
          <i data-icon="collapse"></i><span>Collapse sidebar</span>
        </button>
      </div>
    </aside>
    <div class="nav-scrim" id="navScrim" hidden></div>
  `;
}