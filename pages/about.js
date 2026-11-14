export function renderAbout() {
  const mountPoint = document.querySelector("#aboutMount");
  if (!mountPoint) {
    throw new Error("sources mount point not found");
  }

  mountPoint.outerHTML = `
    <section class="section sources" id="sources" data-nav="About TerraLens">
      <div class="about-brand">
        <img
          src="./assets/terralens-logo.png"
          alt="TerraLens — See a brighter Earth"
          width="180"
          height="120"
        />
        <p>
          A clearer perspective on our changing planet.<br />Created for NASA
          Space Apps Challenge 2026.
        </p>
      </div>
      <div>
        <p class="eyebrow">OPEN DATA. OPEN POSSIBILITIES.</p>
        <h2>Grounded in science.<br />Built for discovery.</h2>
        <p id="sourceNote">
          TerraLens retrieves monthly point data from NASA POWER using
          community AG. Meteorological products are
          model/assimilation-derived, not direct station measurements. Point
          values represent gridded products, not province boundaries. Missing
          values remain gaps.
        </p>
        <p>
          Annual means are weighted by calendar days. Rainfall rates are
          integrated into totals. Statistical trends describe history and do
          not predict future conditions.
        </p>
        <div class="source-links">
          <a
            href="https://power.larc.nasa.gov/docs/services/api/temporal/monthly/"
            target="_blank"
            rel="noreferrer"
            >NASA POWER documentation<i data-icon="arrow-up-right"></i></a
          ><a
            href="https://power.larc.nasa.gov/parameters/"
            target="_blank"
            rel="noreferrer"
            >Parameter dictionary<i data-icon="arrow-up-right"></i></a
          ><a
            href="https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets"
            target="_blank"
            rel="noreferrer"
            >Earth texture assets<i data-icon="arrow-up-right"></i
          ></a>
        </div>
        <p class="asset-credit">
          Earth imagery via Three.js planet texture examples. Globe imagery is
          illustrative; climate readings come exclusively from NASA POWER.
        </p>
      </div>
    </section>
  `;
}
