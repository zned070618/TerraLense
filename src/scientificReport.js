import { createAssistantAnswer } from "./assistant.js";
import { analyzeSeries } from "./analysis.js";
import {
  annualSeries,
  climateInsights,
  filterDataset,
  rainfallDistribution,
  weightedMean,
  MONTHS,
} from "./climateData.js";

export function buildScientificReportHtml(context) {
  const { dataset, analysis, startYear, endYear } = context;
  const location = context.location || {};
  const locationName = htmlText(location.name || "Selected point");
  const region = [location.province, location.region, location.country]
    .filter(Boolean)
    .map(htmlText)
    .join(", ");
  const variable = context.variable;
  const variableId = variable.id;
  const variableName = htmlText(
    variable.label || variable.shortName || variable.id,
  );
  const units = htmlText(variable.units || "NASA units");
  const resolution = context.resolution || "monthly";
  const filtered = filterDataset(dataset, startYear, endYear);
  const selected = filtered.series[variableId];
  const display = resolution === "yearly" ? annualSeries(selected) : selected;
  const observations = display.observations;
  const valid = observations.filter((item) => Number.isFinite(item.value));
  const annual = annualSeries(selected);
  const completeYears = annual.observations.filter((item) =>
    Number.isFinite(item.value),
  );
  const annualExtremes = [...completeYears].sort((a, b) => a.value - b.value);
  const lowYear = annualExtremes[0];
  const highYear = annualExtremes.at(-1);
  const annualRange =
    lowYear && highYear
      ? `Across complete years, ${variableName} ranged from ${format(lowYear.value)} ${htmlText(annual.units)} in ${lowYear.year} to ${format(highYear.value)} ${htmlText(annual.units)} in ${highYear.year}.`
      : "No complete years are available for annual high/low comparisons.";
  const trendText =
    analysis.slope == null
      ? "Insufficient data are available for a trend estimate at this time scale."
      : `The Theil-Sen slope is ${format(analysis.slope, 4)} ${units}/year. The Mann-Kendall result ${analysis.significant ? "meets" : "does not meet"} the 0.05 threshold (p = ${format(analysis.pValue, 4)}).`;
  const coverage = observations.length
    ? `${valid.length} / ${observations.length} ${resolution} observations (${format((valid.length / observations.length) * 100, 1)}%)`
    : "No observations available";
  const retrieved = htmlText(new Date(dataset.retrievedAt).toLocaleString());
  const generated = htmlText(new Date().toLocaleString());
  const sourceUrl = htmlText(dataset.sourceUrl);
  const activeSummary = htmlText(createAssistantAnswer("trend", context));

  const [warmCool, rainfallExtremes, temperatureTrend, rainfallCycle, solarExtremes, humidityExtremes] = climateInsights(filtered);
  const findingsFor = (items) => items.map(findingCard).join("");
  const parameters = Object.values(filtered.series);
  const parameterNames = htmlText(
    parameters
      .map((series) => `${series.parameterInfo.label} (${series.parameter})`)
      .join("; "),
  );
  const metadata = [
    ["Study location", `${location.name || "Selected point"}${region ? `, ${region}` : ""}`],
    ["Coordinates", `${format(dataset.latitude, 4)} deg latitude; ${format(dataset.longitude, 4)} deg longitude`],
    ["Study period", `${startYear} to ${endYear}`],
    ["Source temporal resolution", "Monthly observations"],
    ["Selected chart scale", `${resolution} observations`],
    ["Selected parameter", `${variable.label || variable.shortName} (${variable.id})`],
    ["Data source", "NASA POWER Monthly Point API"],
    ["Retrieved", new Date(dataset.retrievedAt).toLocaleString()],
  ]
    .map(
      ([label, value]) =>
        `<tr><th scope="row">${htmlText(label)}</th><td>${htmlText(value)}</td></tr>`,
    )
    .join("");
  const parameterRows = parameters
    .map(parameterSummaryRow)
    .join("");
  const distribution = rainfallDistribution(
    filtered.series.PRECTOTCORR,
    "months",
  );
  const pageFooter = cssString(
    `TERRALENS | ${location.name || "Selected point"} | ${startYear}-${endYear} | Generated ${new Date().toLocaleDateString()}`,
  );
  const chartSvg = lineChartSvg(
    observations,
    units,
    variableName,
    analysis,
  );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>TerraLens Climate Investigation Report - ${locationName}</title>
  <style>
    @page {
      size: letter;
      margin: 20mm 17mm 19mm;
      @top-left { content: "TERRALENS / CLIMATE INTELLIGENCE"; color: #496474; font: 700 8pt Arial, sans-serif; letter-spacing: 1pt; }
      @top-right { content: "CLIMATE INVESTIGATION REPORT"; color: #708692; font: 8pt Arial, sans-serif; }
      @bottom-left { content: "${pageFooter}"; color: #708692; font: 8pt Arial, sans-serif; }
      @bottom-right { content: "PAGE " counter(page); color: #496474; font: 700 8pt Arial, sans-serif; }
    }
    @page:first {
      margin: 0;
      @top-left { content: ""; }
      @top-right { content: ""; }
      @bottom-left { content: ""; }
      @bottom-right { content: ""; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #253541; font: 10pt/1.48 Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1,h2,h3,h4,p { margin-top: 0; }
    h1,h2,h3,h4 { color: #102d46; }
    h1 { font-size: 30pt; line-height: 1.13; letter-spacing: .1pt; margin: 5mm 0 4mm; }
    h2 { font-size: 17pt; line-height: 1.2; margin: 0 0 4mm; padding-bottom: 2mm; border-bottom: 1px solid #d4e1e6; }
    h3 { font-size: 12pt; line-height: 1.25; margin: 0 0 2mm; }
    p { margin-bottom: 3mm; }
    a { color: #086d80; text-decoration: underline; overflow-wrap: anywhere; }
    .cover { position: relative; width: 215.9mm; height: 279.4mm; overflow: hidden; padding: 25mm 24mm 22mm; display: flex; flex-direction: column; justify-content: space-between; color: #f7fbfd; background: #102b43; break-after: page; page-break-after: always; }
    .cover:before { content: ""; position: absolute; width: 146mm; height: 146mm; right: -42mm; top: 42mm; border: 1px solid #76c7cf45; border-radius: 50%; box-shadow: 0 0 0 15mm #ffffff04, 0 0 0 32mm #ffffff03; }
    .cover:after { content: ""; position: absolute; width: 165mm; height: 62mm; right: -8mm; top: 83mm; border: 1px solid #8ccbd337; border-radius: 50%; transform: rotate(-24deg); }
    .cover-top,.cover-main,.cover-bottom { position: relative; z-index: 1; }
    .cover-brand { display: flex; align-items: center; gap: 4mm; color: #fff; font-weight: 700; letter-spacing: 2pt; font-size: 13pt; }
    .brand-mark { width: 10mm; height: 10mm; border: 1px solid #6bc8cb; border-radius: 50%; display: grid; place-items: center; color: #7de0d6; font-size: 13pt; }
    .cover-brand small { display: block; margin-top: 1mm; color: #a8c3cf; font-size: 7.5pt; letter-spacing: 1.4pt; font-weight: 400; }
    .cover-rule { width: 24mm; height: 1mm; margin: 19mm 0 9mm; background: #51b7b2; }
    .cover-kicker { margin-bottom: 4mm; color: #85d6d0; font-size: 9pt; font-weight: 700; letter-spacing: 2pt; }
    .cover h1 { max-width: 150mm; margin-bottom: 5mm; color: #fff; font-size: 30pt; letter-spacing: 1.2pt; }
    .cover-subtitle { max-width: 135mm; color: #cad9df; font-size: 14pt; line-height: 1.5; }
    .cover-earth { width: 120mm; height: auto; margin: 5mm 0 0 10mm; }
    .earth-outline { fill: #173d58; stroke: #69c8cc; stroke-width: 1.2; }
    .earth-grid { fill: none; stroke: #7bc9cf; stroke-width: .8; opacity: .5; }
    .earth-orbit { fill: none; stroke: #80c9cb; stroke-width: 1; opacity: .65; }
    .cover-details { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm 12mm; max-width: 155mm; padding-top: 7mm; border-top: 1px solid #8bb9c44a; }
    .cover-details span { display: block; color: #91aeba; font-size: 7.5pt; font-weight: 700; letter-spacing: 1.2pt; text-transform: uppercase; }
    .cover-details strong { display: block; margin-top: 1mm; color: #f4fafb; font-size: 11pt; font-weight: 500; }
    .cover-bottom { display: flex; justify-content: space-between; align-items: end; color: #96aeb8; font-size: 8pt; }
    .cover-bottom strong { color: #cce0e4; font-weight: 500; }
    .page-section { margin: 0 0 7mm; break-inside: auto; }
    .page-start { break-before: page; page-break-before: always; }
    .section-index { margin-bottom: 1mm; color: #13818c; font-size: 8pt; font-weight: 700; letter-spacing: 1.3pt; text-transform: uppercase; }
    .lead { color: #465d69; font-size: 11pt; line-height: 1.55; }
    .metadata-table,.parameter-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .metadata-table { font-size: 9.5pt; }
    .metadata-table th,.metadata-table td { padding: 2.4mm 3mm; border-bottom: 1px solid #dce5e9; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    .metadata-table th { width: 34%; color: #405b6b; background: #f1f5f6; font-weight: 700; }
    .summary-grid,.metric-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 3mm; margin: 4mm 0; }
    .summary-card,.metric-card { min-width: 0; padding: 3.5mm; border: 1px solid #d9e3e7; background: #fff; break-inside: avoid; }
    .summary-card { border-left: 2px solid #3b9da1; }
    .summary-card h3 { font-size: 10pt; }
    .summary-card p { margin: 0; color: #4b606c; font-size: 9pt; }
    .metric-card small { display: block; color: #577280; font-size: 7.5pt; font-weight: 700; letter-spacing: .8pt; text-transform: uppercase; }
    .metric-card strong { display: block; margin: 1mm 0; color: #0e5667; font-size: 17pt; line-height: 1.25; overflow-wrap: anywhere; }
    .metric-card span { color: #627984; font-size: 8pt; }
    .subsection { margin: 5mm 0; break-inside: avoid; }
    .subsection h3 { padding-left: 3mm; border-left: 2px solid #36989b; }
    .finding-list { margin: 0; padding: 0; list-style: none; }
    .finding { margin: 2mm 0; padding: 3mm 3.5mm; border: 1px solid #e0e8eb; background: #fafcfc; break-inside: avoid; }
    .finding-label { display: block; margin-bottom: 1mm; color: #187784; font-size: 7pt; font-weight: 700; letter-spacing: .8pt; text-transform: uppercase; }
    .finding h4 { margin: 0 0 1mm; font-size: 10pt; }
    .finding p { margin: 0; color: #465c68; font-size: 9pt; }
    .interpretation-box { padding: 4mm; border: 1px solid #cadde1; border-left: 3px solid #278f93; background: #f3f8f8; break-inside: avoid; }
    .interpretation-box p:last-child { margin-bottom: 0; }
    .note { color: #566d78; font-size: 8.5pt; }
    .charts { display: grid; grid-template-columns: minmax(0,1.55fr) minmax(65mm,1fr); gap: 4mm; align-items: start; }
    .chart-panel { min-width: 0; padding: 3.5mm; border: 1px solid #d9e3e7; break-inside: avoid; page-break-inside: avoid; }
    .chart-panel h3 { min-height: 8mm; margin-bottom: 1mm; }
    .chart-subtitle,.chart-caption { color: #5e747f; font-size: 8pt; }
    .chart-subtitle { margin-bottom: 2mm; }
    .chart-caption { margin: 2mm 0 0; }
    .line-chart { display: block; width: 100%; height: auto; }
    .line-chart text,.share-chart text { font-family: Arial, sans-serif; fill: #405a68; font-size: 10px; }
    .line-chart .grid { stroke: #dfe7ea; stroke-width: 1; }
    .line-chart .series { fill: none; stroke: #137d8c; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .line-chart .trend { fill: none; stroke: #c27c30; stroke-width: 1.7; stroke-dasharray: 6 4; }
    .line-chart .point { fill: #137d8c; stroke: #fff; stroke-width: 1.5; }
    .chart-legend { display: flex; gap: 5mm; margin-top: 1mm; color: #506a77; font-size: 8pt; }
    .legend-line { display: inline-block; width: 7mm; margin: 0 1mm 1mm 0; border-top: 2px solid #137d8c; vertical-align: middle; }
    .legend-trend { display: inline-block; width: 7mm; margin: 0 1mm 1mm 0; border-top: 1.5px dashed #c27c30; vertical-align: middle; }
    .share-wrap { display: flex; align-items: center; gap: 2mm; }
    .share-chart { display: block; width: 46%; height: auto; flex: none; }
    .share-legend { columns: 2; column-gap: 2mm; flex: 1; margin: 0; padding: 0; list-style: none; font-size: 7pt; }
    .share-legend li { display: flex; align-items: center; gap: 1mm; margin: 1mm 0; white-space: nowrap; break-inside: avoid; }
    .swatch { display: inline-block; width: 2mm; height: 2mm; flex: none; }
    .parameter-table { font-size: 7.5pt; }
    .parameter-table thead { display: table-header-group; }
    .parameter-table th { color: #fff; background: #183950; font-size: 7pt; letter-spacing: .3pt; text-align: left; }
    .parameter-table th,.parameter-table td { padding: 2.5mm 2mm; vertical-align: top; overflow-wrap: anywhere; border-bottom: 1px solid #d8e2e6; }
    .parameter-table tbody tr:nth-child(even) { background: #f2f6f7; }
    .parameter-table tr { break-inside: avoid; page-break-inside: avoid; }
    .parameter-table th:nth-child(1) { width: 21%; }
    .parameter-table th:nth-child(2) { width: 17%; }
    .parameter-table th:nth-child(3) { width: 13%; }
    .parameter-table th:nth-child(4) { width: 17%; }
    .parameter-table th:nth-child(5) { width: 10%; }
    .parameter-table th:nth-child(6) { width: 22%; }
    .muted { color: #637983; }
    .method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
    .method-block { padding: 3.5mm; border: 1px solid #dce5e8; break-inside: avoid; }
    .method-block h3 { font-size: 10pt; }
    .method-block p,.method-block li { color: #465c68; font-size: 8.5pt; }
    .method-block p:last-child { margin-bottom: 0; }
    .method-block ul { margin: 0; padding-left: 5mm; }
    .reference-url { display: block; margin-top: 1mm; font-size: 8pt; overflow-wrap: anywhere; }
    .report-endnote { margin-top: 5mm; padding-top: 3mm; border-top: 1px solid #d5e1e5; color: #5e737e; font-size: 8pt; }
    @media screen { body { max-width: 216mm; margin: 0 auto; padding: 15mm; background: #eef2f3; } .cover { margin: -15mm -15mm 14mm; } .page-section { margin-bottom: 14mm; padding: 5mm; background: #fff; box-shadow: 0 1mm 4mm #1b354012; } }
    @media print { body { background: #fff; } .cover { margin: 0; } .page-section { margin-bottom: 0; padding: 0; background: #fff; box-shadow: none; } .summary-card,.metric-card,.finding,.chart-panel,.method-block,.interpretation-box { break-inside: avoid; page-break-inside: avoid; } }
    @media screen and (max-width: 700px) { .charts,.method-grid { grid-template-columns: 1fr; } .summary-grid,.metric-grid { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body>
  <header class="cover">
    <div class="cover-top"><div class="cover-brand"><span class="brand-mark">T</span><span>TERRALENS<small>CLIMATE INTELLIGENCE</small></span></div></div>
    <div class="cover-main"><div class="cover-rule"></div><p class="cover-kicker">SCIENTIFIC CLIMATE ASSESSMENT</p><h1>CLIMATE<br>INVESTIGATION REPORT</h1><p class="cover-subtitle">Historical Climate Patterns and Environmental Trend Analysis</p>
      <svg class="cover-earth" viewBox="0 0 560 280" role="img" aria-label="Stylized Earth observation graphic"><circle class="earth-outline" cx="260" cy="140" r="105"/><ellipse class="earth-grid" cx="260" cy="140" rx="47" ry="105"/><ellipse class="earth-grid" cx="260" cy="140" rx="88" ry="105"/><ellipse class="earth-grid" cx="260" cy="140" rx="105" ry="34"/><ellipse class="earth-grid" cx="260" cy="140" rx="105" ry="72"/><path class="earth-orbit" d="M92 164 C182 22 381 14 477 108"/><path class="earth-orbit" d="M114 204 C225 278 394 252 472 175"/></svg>
    </div>
      <div class="cover-bottom"><div class="cover-details"><div><span>Study location</span><strong>${locationName}${region ? `, ${region}` : ""}</strong></div><div><span>Study coordinates</span><strong>${format(dataset.latitude, 4)} deg latitude; ${format(dataset.longitude, 4)} deg longitude</strong></div><div><span>Study period</span><strong>${startYear} to ${endYear}</strong></div><div><span>Data source</span><strong>NASA POWER Monthly Point API</strong></div><div><span>Report generated</span><strong>${generated}</strong></div></div><p>HISTORICAL OBSERVATIONS<br><strong>NOT A FORECAST</strong></p></div>
  </header>
  <main>
    <section class="page-section" id="executive-summary"><p class="section-index">01 / REPORT SUMMARY</p><h2>Executive Summary</h2><p class="lead">This report summarizes NASA POWER monthly climate observations for ${locationName} over ${startYear} to ${endYear}. It covers ${parameters.length} parameters: ${parameterNames}. The findings describe the selected historical record and are not forecasts.</p><p>${activeSummary}</p><div class="summary-grid">${[warmCool, rainfallExtremes, temperatureTrend, rainfallCycle].map(summaryCard).join("")}</div><h3>Study Overview</h3><table class="metadata-table"><tbody>${metadata}</tbody></table></section>
    <section class="page-section page-start" id="key-indicators"><p class="section-index">02 / SELECTED PARAMETER</p><h2>Key Climate Indicators</h2><p class="note">Indicators describe ${variableName} at the selected ${htmlText(resolution)} scale. Annual extremes and annual trend estimates are reported separately.</p><div class="metric-grid"><div class="metric-card"><small>Mean of displayed values</small><strong>${format(analysis.mean)} ${units}</strong><span>${valid.length} valid ${htmlText(resolution)} observations</span></div><div class="metric-card"><small>Observed range</small><strong>${format(analysis.min)} to ${format(analysis.max)}</strong><span>${units}</span></div><div class="metric-card"><small>Data coverage</small><strong>${htmlText(coverage)}</strong><span>Missing observations are excluded, not zero-filled.</span></div><div class="metric-card"><small>Estimated trend</small><strong>${format(analysis.slope, 4)} ${units}/year</strong><span>${analysis.pValue == null ? "Insufficient observations for test" : `Mann-Kendall p = ${format(analysis.pValue, 4)}`}</span></div></div><h3>Scientific Interpretation</h3><div class="interpretation-box"><p><strong>Trend estimate and test.</strong> ${htmlText(trendText)}</p><p><strong>Complete-year range.</strong> ${htmlText(annualRange)}</p><p><strong>Interpretation.</strong> ${htmlText(analysis.interpretation || "Insufficient data for reliable trend assessment.")}</p><p class="note"><strong>Limitations.</strong> ${htmlText(analysis.caveat)} Historical observations are not forecasts; correlation does not establish causation.</p></div><p class="note">The Mann-Kendall threshold is a statistical decision rule used by TerraLens. It does not establish the cause or practical importance of a trend.</p></section>
    <section class="page-section page-start" id="historical-analysis"><p class="section-index">03 / HISTORICAL ANALYSIS</p><h2>Climate Patterns and Historical Analysis</h2><p class="note">Annual extrema use complete years from the selected study period. Monthly rainfall patterns use available calendar-month observations.</p><div class="subsection"><h3>A. Temperature Analysis</h3><ul class="finding-list">${findingsFor([warmCool, temperatureTrend])}</ul></div><div class="subsection"><h3>B. Precipitation Analysis</h3><ul class="finding-list">${findingsFor([rainfallExtremes, rainfallCycle])}</ul></div><div class="subsection"><h3>C. Solar Radiation Analysis</h3><ul class="finding-list">${findingsFor([solarExtremes])}</ul></div><div class="subsection"><h3>D. Relative Humidity Analysis</h3><ul class="finding-list">${findingsFor([humidityExtremes])}</ul></div></section>
    <section class="page-section page-start" id="visual-evidence"><p class="section-index">04 / VISUAL EVIDENCE</p><h2>Climate Charts</h2><p class="note">Charts use the same filtered NASA POWER observations as the report statistics.</p><div class="charts"><figure class="chart-panel"><h3>${variableName} through time</h3><p class="chart-subtitle">${htmlText(resolution)} scale; units: ${units}</p>${chartSvg}<div class="chart-legend"><span><i class="legend-line"></i>NASA observations</span>${Number.isFinite(analysis.slope) ? '<span><i class="legend-trend"></i>Theil-Sen fit</span>' : ""}</div><figcaption class="chart-caption">Gaps indicate missing observations. The dashed line shows the fitted trend when available. This gridded point product is not a station record.</figcaption></figure><figure class="chart-panel"><h3>Precipitation by calendar month</h3><p class="chart-subtitle">Contribution to total precipitation across complete years.</p>${rainfallShareSvg(distribution)}<figcaption class="chart-caption">${distribution.completeYears} complete years included. Calendar-month shares do not define local wet and dry seasons.</figcaption></figure></div></section>
    <section class="page-section page-start" id="parameter-overview"><p class="section-index">05 / NASA POWER PARAMETERS</p><h2>Comprehensive Parameter Overview</h2><p class="note">Summary statistics for all five parameters at this location and study period.</p><table class="parameter-table"><thead><tr><th>Parameter</th><th>Mean / annual total</th><th>Monthly coverage</th><th>Annual trend</th><th>Mann-Kendall p</th><th>Statistical interpretation</th></tr></thead><tbody>${parameterRows}</tbody></table><p class="table-note">Precipitation means are annual totals averaged across complete years. Other means are weighted by calendar-day coverage. Annual trends use complete annual values; p-values are not measures of effect size.</p></section>
    <section class="page-section page-start" id="methodology"><p class="section-index">06 / TECHNICAL NOTES</p><h2>Data, Methodology, and Limitations</h2><div class="method-grid"><article class="method-block"><h3>Data Source</h3><p>NASA POWER Monthly Point API. The source provides gridded model and assimilation products; values are not direct station measurements.</p><p>Parameters analyzed: ${parameterNames}.</p></article><article class="method-block"><h3>Data Collection</h3><p>The dataset covers ${locationName} at ${format(dataset.latitude, 4)} deg latitude and ${format(dataset.longitude, 4)} deg longitude from ${startYear} through ${endYear}. Source temporal resolution is monthly.</p><p>Retrieved ${retrieved}.</p></article><article class="method-block"><h3>Statistical Methods</h3><ul><li>Theil-Sen slope estimator for trend magnitude.</li><li>Mann-Kendall test for monotonic trend evidence.</li><li>Annual statistics require twelve valid monthly observations.</li><li>Precipitation daily rates are integrated over calendar days; annual means for other parameters use calendar-day weighting.</li></ul></article><article class="method-block"><h3>Data Limitations</h3><ul><li>Missing observations are excluded and are never zero-filled.</li><li>Monthly seasonality and serial correlation can affect trend significance.</li><li>A non-significant test does not prove no change; significance does not establish causality.</li><li>Historical observations describe the selected record and are not predictions.</li></ul></article></div><h3 style="margin-top:7mm">References and Data Source</h3><div class="method-block"><p><strong>${htmlText(variable.source || "NASA POWER Monthly Point API")}</strong></p><a class="reference-url" href="${sourceUrl}">${sourceUrl}</a><p class="note">The original source URL and NASA POWER parameter identifiers are preserved.</p></div><p class="report-endnote">TerraLens calculates numerical summaries from server-retrieved NASA POWER data. Explanatory language describes historical evidence only.</p></section>
  </main>
  <script>window.addEventListener('load',()=>window.print())</script>
</body>
</html>`;
}

export function openPrintableReport(context) {
  const report = window.open("", "_blank");
  if (!report)
    throw new Error("Allow pop-ups for TerraLens to open the PDF report.");
  report.opener = null;
  report.document.write(buildScientificReportHtml(context));
  report.document.close();
}

function findingCard(item) {
  if (!item) return "";
  return `<li class="finding"><span class="finding-label">${htmlText(item.kind)}</span><h4>${htmlText(item.title)}</h4><p>${htmlText(item.text)}</p></li>`;
}

function summaryCard(item) {
  if (!item) return "";
  return `<article class="summary-card"><h3>${htmlText(item.title)}</h3><p>${htmlText(item.text)}</p></article>`;
}

function cssString(value) {
  return String(value ?? "").replace(/[\\"\n\r]/g, " ").replace(/[<>]/g, "").trim();
}

function parameterSummaryRow(series) {
  const valid = series.observations.filter((item) => Number.isFinite(item.value));
  const annual = annualSeries(series);
  const complete = annual.observations.filter((item) => Number.isFinite(item.value));
  const trend = analyzeSeries(annual.observations, { ...series.parameterInfo, units: annual.units }, "yearly");
  const isRain = series.parameter === "PRECTOTCORR";
  const meanValue = isRain
    ? complete.length ? complete.reduce((sum, item) => sum + item.value, 0) / complete.length : null
    : weightedMean(series.observations);
  const meanLabel = isRain ? "mean annual total" : "day-weighted mean";
  const meanUnits = isRain ? annual.units : series.parameterInfo.units;
  const interpretation = Number.isFinite(trend.slope)
    ? trend.significant ? "Meets the 0.05 threshold; this does not establish causation." : "Does not meet the 0.05 threshold."
    : "Insufficient complete years for a trend test.";
  return `<tr><td><strong>${htmlText(series.parameterInfo.label)}</strong><br><span class="muted">${htmlText(series.parameter)}</span></td><td>${format(meanValue)} ${htmlText(meanUnits)}<br><span class="muted">${meanLabel}${isRain ? `; ${complete.length} complete years` : ""}</span></td><td>${valid.length} / ${series.observations.length} months</td><td>${Number.isFinite(trend.slope) ? `${trend.slope > 0 ? "+" : ""}${format(trend.slope, 4)} ${htmlText(annual.units)}/year` : "Not available"}</td><td>${Number.isFinite(trend.pValue) ? format(trend.pValue, 4) : "Not available"}</td><td>${interpretation}</td></tr>`;
}

function lineChartSvg(observations, units, label, analysis) {
  const width = 760;
  const height = 250;
  const left = 64;
  const right = 18;
  const top = 14;
  const bottom = 36;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const valid = observations.filter((item) => Number.isFinite(item.value));
  if (!valid.length)
    return '<p class="muted">No valid observations are available for the selected series.</p>';
  const trendValues =
    Number.isFinite(analysis.slope) && Number.isFinite(analysis.intercept)
      ? observations
          .filter((item) => Number.isFinite(item.yearDecimal))
          .map((item) => analysis.intercept + analysis.slope * item.yearDecimal)
      : [];
  const values = [...valid.map((item) => item.value), ...trendValues];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    const padding = Math.abs(min) * 0.08 || 1;
    min -= padding;
    max += padding;
  }
  const x = (index) =>
    left +
    (observations.length < 2 ? 0.5 : index / (observations.length - 1)) *
      plotWidth;
  const y = (value) => top + ((max - value) / (max - min)) * plotHeight;
  const grids = Array.from({ length: 5 }, (_, index) => {
    const value = max - ((max - min) * index) / 4;
    const yy = top + (plotHeight * index) / 4;
    return `<line class="grid" x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}"/><text x="${left - 7}" y="${yy + 3}" text-anchor="end">${htmlText(format(value, 2))}</text>`;
  }).join("");
  const segments = [];
  let segment = [];
  observations.forEach((item, index) => {
    if (!Number.isFinite(item.value)) {
      if (segment.length) segments.push(segment);
      segment = [];
      return;
    }
    segment.push(`${x(index).toFixed(2)},${y(item.value).toFixed(2)}`);
  });
  if (segment.length) segments.push(segment);
  const paths = segments
    .map((points) => `<polyline class="series" points="${points.join(" ")}"/>`)
    .join("");
  const trendPath =
    trendValues.length > 1
      ? `<line class="trend" x1="${x(0)}" y1="${y(trendValues[0])}" x2="${x(observations.length - 1)}" y2="${y(trendValues.at(-1))}"/>`
      : "";
  const ticks = [
    ...new Set([
      0,
      Math.floor((observations.length - 1) / 2),
      observations.length - 1,
    ]),
  ]
    .map((index) => {
      const item = observations[index];
      return `<text x="${x(index)}" y="${height - 10}" text-anchor="middle">${htmlText(item?.date || "")}</text>`;
    })
    .join("");
  const dots =
    valid.length <= 30
      ? valid
          .map((item) => {
            const index = observations.indexOf(item);
            return `<circle class="point" cx="${x(index)}" cy="${y(item.value)}" r="3"/>`;
          })
          .join("")
      : "";
  return `<svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${htmlText(label)} time series in ${htmlText(units)}"><title>${htmlText(label)} over time</title>${grids}<line class="grid" x1="${left}" y1="${top + plotHeight}" x2="${width - right}" y2="${top + plotHeight}"/>${paths}${trendPath}${dots}${ticks}<text x="${width - right}" y="${height - 10}" text-anchor="end">${htmlText(units)}</text></svg>`;
}

function rainfallShareSvg(distribution) {
  if (!distribution.completeYears || !distribution.total)
    return '<p class="muted">A rainfall share chart needs at least one complete year with valid rainfall data.</p>';
  const colors = [
    "#177e89", "#239da0", "#49b6a5", "#87c98c", "#b6cf72", "#d7c85f",
    "#e4aa54", "#df8751", "#d87565", "#ba6e83", "#8b709b", "#5c7eaa",
  ];
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const rings = distribution.values
    .map((item, index) => {
      const length = (item.value / distribution.total) * circumference;
      const circle = `<circle cx="75" cy="75" r="${radius}" fill="none" stroke="${colors[index]}" stroke-width="22" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="-${offset}"/>`;
      offset += length;
      return circle;
    })
    .join("");
  const legend = distribution.values
    .map((item, index) => {
      const percent = (item.value / distribution.total) * 100;
      return `<li><i class="swatch" style="background:${colors[index]}"></i>${MONTHS[index]} ${format(percent, 0)}%</li>`;
    })
    .join("");
  return `<div class="share-wrap"><svg class="share-chart" viewBox="0 0 150 150" role="img" aria-label="Rainfall contribution by calendar month"><title>Rainfall share by calendar month</title><circle cx="75" cy="75" r="${radius}" fill="none" stroke="#edf2f3" stroke-width="22"/>${rings}<text x="75" y="72" text-anchor="middle" style="font-size:10px">${distribution.completeYears} complete</text><text x="75" y="86" text-anchor="middle" style="font-size:9px">years</text></svg><ul class="share-legend">${legend}</ul></div>`;
}

function htmlText(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

function format(value, digits = 3) {
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
    : "not available";
}
