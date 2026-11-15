import { createAssistantAnswer } from "./assistant.js";
import { analyzeSeries } from "./analysis.js";
import {
  annualSeries,
  climateInsights,
  filterDataset,
  rainfallDistribution,
  rainfallMonths,
  weightedMean,
  MONTHS,
} from "./climateData.js";

export function buildCsv(context) {
  const { dataset } = context;
  const rows = [
    ["TerraLens export"],
    ["latitude", dataset.latitude],
    ["longitude", dataset.longitude],
    [
      "source",
      "NASA POWER monthly point API; original monthly values and metadata units",
    ],
    ["retrieved_at", dataset.retrievedAt],
    [],
    [
      "latitude",
      "longitude",
      "date",
      "parameter",
      "value",
      "units",
      "source_url",
    ],
    ...Object.values(dataset.series).flatMap((series) =>
      series.observations.map((item) => [
        dataset.latitude,
        dataset.longitude,
        item.date,
        series.parameter,
        item.value ?? "",
        series.parameterInfo.units,
        dataset.sourceUrl,
      ]),
    ),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function openPrintableReport(context) {
  const { startYear, endYear, analysis, dataset } = context;
  const locationName = htmlText(context.location?.name || "Selected point");
  const variable = context.variable;
  const variableName = htmlText(variable.label || variable.shortName || variable.id);
  const variableId = htmlText(variable.id);
  const units = htmlText(variable.units || "NASA units");
  const resolution = context.resolution || "monthly";
  const filtered = filterDataset(dataset, startYear, endYear);
  const series = filtered.series[variable.id];
  const display = resolution === "yearly" ? annualSeries(series) : series;
  const observations = display.observations;
  const valid = observations.filter((item) => Number.isFinite(item.value));
  const annual = annualSeries(series);
  const completeYears = annual.observations.filter((item) =>
    Number.isFinite(item.value),
  );
  const annualTrend = analyzeSeries(
    annual.observations,
    { ...series.parameterInfo, units: annual.units },
    "yearly",
  );
  const sortedYears = [...completeYears].sort((a, b) => a.value - b.value);
  const selectedTrend = analysis.slope == null
    ? "Insufficient data for a trend estimate at this time scale."
    : `The Theil-Sen slope is ${format(analysis.slope, 4)} ${units}/year. The evidence ${analysis.significant ? "meets" : "does not meet"} the 0.05 Mann-Kendall threshold.`;
  const chartSvg = lineChartSvg(
    observations,
    units,
    variableName,
    analysis,
  );
  const distribution = rainfallDistribution(
    filtered.series.PRECTOTCORR,
    "months",
  );
  const shareSvg = rainfallShareSvg(distribution);
  const parameterRows = Object.values(filtered.series)
    .map((item) => parameterSummaryRow(item))
    .join("");
  const insightCards = climateInsights(filtered)
    .map(
      (item) => `<article class="finding"><span>${htmlText(item.kind)}</span><h3>${htmlText(item.title)}</h3><p>${htmlText(item.text)}</p></article>`,
    )
    .join("");
  const source = htmlText(dataset.sourceUrl);
  const chartType = htmlText(context.chartType || "line");
  const retrieved = htmlText(new Date(dataset.retrievedAt).toLocaleString());
  const expected = observations.length;
  const coverage = expected
    ? `${valid.length} / ${expected} ${resolution} observations (${format((valid.length / expected) * 100, 1)}%)`
    : "No observations available";
  const highYear = sortedYears.at(-1);
  const lowYear = sortedYears[0];
  const annualRange =
    lowYear && highYear
      ? `Complete-year range for ${variableName}: ${format(lowYear.value)} ${htmlText(annual.units)} in ${lowYear.year} to ${format(highYear.value)} ${htmlText(annual.units)} in ${highYear.year}.`
      : "No complete years are available for annual high/low comparisons.";
  const activeSummary = createAssistantAnswer("trend", context);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TerraLens Climate Report — ${locationName}</title><style>
    @page{size:letter;margin:14mm}*{box-sizing:border-box}body{font:12px/1.55 Arial,Helvetica,sans-serif;margin:0;color:#172a38;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1,h2,h3,p{margin-top:0}h1{font-size:29px;line-height:1.12;margin:4px 0 7px;letter-spacing:-.03em}h2{font-size:16px;margin:0 0 10px;color:#153447}h3{font-size:13px;margin:5px 0;color:#153447}.cover{padding:25px 28px;background:linear-gradient(115deg,#071725,#12394a);color:#f2fbff;border-radius:12px;margin-bottom:15px}.brand{font-size:9px;letter-spacing:.2em;color:#78e2d8;font-weight:bold}.subtitle{color:#bad0db;margin:0}.meta-grid,.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.meta,.metric,.panel,.finding{border:1px solid #d6e1e6;border-radius:8px;padding:11px;background:#fff}.meta small,.metric small{display:block;text-transform:uppercase;font-size:8px;letter-spacing:.11em;color:#66808d;font-weight:bold;margin-bottom:3px}.meta strong{font-size:11px}.metric strong{display:block;font-size:17px;color:#114b5b;line-height:1.25}.metric span{font-size:9px;color:#68808d}.section{margin:17px 0}.section-note{color:#647986;font-size:10px;margin:-4px 0 9px}.panel{padding:13px;margin:10px 0}.charts{display:grid;grid-template-columns:1.55fr 1fr;gap:10px;align-items:stretch}.chart-panel{border:1px solid #d6e1e6;border-radius:8px;padding:12px;break-inside:avoid}.chart-panel h2{margin-bottom:2px}.chart-caption{font-size:9px;color:#617986;margin:4px 0 0}.line-chart{width:100%;height:auto;display:block}.line-chart text,.share-chart text{font-family:Arial,sans-serif;fill:#607987;font-size:10px}.line-chart .grid{stroke:#e3ebee;stroke-width:1}.line-chart .series{fill:none;stroke:#16889a;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.line-chart .trend{fill:none;stroke:#d68b36;stroke-width:1.6;stroke-dasharray:6 4}.line-chart .point{fill:#16889a;stroke:#fff;stroke-width:1.5}.share-wrap{display:flex;align-items:center;gap:8px}.share-chart{width:150px;max-width:45%;height:auto;flex:none}.share-legend{list-style:none;padding:0;margin:0;columns:2;column-gap:10px;flex:1;font-size:8px}.share-legend li{break-inside:avoid;display:flex;align-items:center;gap:4px;margin:2px 0;white-space:nowrap}.swatch{width:7px;height:7px;border-radius:2px;display:inline-block;flex:none}.table-wrap{overflow:visible}table{width:100%;border-collapse:collapse;font-size:9px}th{text-align:left;background:#edf4f6;color:#31505f;font-size:8px;text-transform:uppercase;letter-spacing:.06em}th,td{padding:6px 7px;border-bottom:1px solid #e1e9ec;vertical-align:top}td:last-child,th:last-child{text-align:right}.findings{display:grid;grid-template-columns:1fr 1fr;gap:8px}.finding{break-inside:avoid;padding:10px}.finding>span{font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:#168594;font-weight:bold}.finding p{margin:0;font-size:10px;color:#415967}.interpretation{border-left:3px solid #2ba89f;background:#eff8f7;padding:11px 13px}.interpretation p:last-child{margin-bottom:0}.caveat{color:#566e7c}.source{font-size:9px;color:#526b79;overflow-wrap:anywhere}.footer{border-top:1px solid #d6e1e6;margin-top:20px;padding-top:8px;color:#6b818d;font-size:8px;display:flex;justify-content:space-between;gap:12px}.muted{color:#71848d}@media print{body{font-size:11px}.cover,.panel,.chart-panel,.finding{break-inside:avoid}.section{break-inside:auto}.charts{grid-template-columns:1.45fr 1fr}.footer{position:static}}@media(max-width:720px){body{padding:12px}.meta-grid,.metric-grid{grid-template-columns:1fr 1fr}.charts{grid-template-columns:1fr}.share-wrap{justify-content:flex-start}}
  </style></head><body>
    <header class="cover"><div class="brand">TERRALENS / CLIMATE INTELLIGENCE</div><h1>Climate investigation report</h1><p class="subtitle">Data-derived findings for ${locationName}; historical observations are not forecasts.</p></header>
    <div class="meta-grid"><div class="meta"><small>Location</small><strong>${locationName}</strong><br>${format(dataset.latitude, 4)}°, ${format(dataset.longitude, 4)}°</div><div class="meta"><small>Study period</small><strong>${startYear}–${endYear}</strong><br>${htmlText(resolution)} observations</div><div class="meta"><small>Selected view</small><strong>${variableName} (${variableId})</strong><br>${units} · ${chartType} chart</div><div class="meta"><small>Retrieved</small><strong>${retrieved}</strong><br>NASA POWER monthly point data</div></div>
    <section class="section"><h2>At a glance</h2><p class="section-note">Statistics below describe the selected parameter and time scale shown in TerraLens.</p><div class="metric-grid"><div class="metric"><small>Mean of displayed values</small><strong>${format(analysis.mean)} ${units}</strong><span>${valid.length} valid ${resolution} values</span></div><div class="metric"><small>Observed range</small><strong>${format(analysis.min)} – ${format(analysis.max)}</strong><span>${units}</span></div><div class="metric"><small>Data coverage</small><strong>${coverage}</strong><span>Missing values are excluded, not treated as zero</span></div><div class="metric"><small>Estimated trend</small><strong>${format(analysis.slope, 4)} ${units}/year</strong><span>${analysis.pValue == null ? "Insufficient observations for significance test" : `Mann-Kendall p = ${format(analysis.pValue, 4)}`}</span></div></div><div class="interpretation"><strong>Interpretation</strong><p>${htmlText(selectedTrend)}</p><p>${htmlText(annualRange)}</p><p class="caveat">${htmlText(analysis.caveat)}</p></div></section>
    <section class="section"><h2>Climate patterns in this dataset</h2><p class="section-note">Calculated from the selected location and report period. Annual comparisons use complete years only.</p><div class="findings">${insightCards}</div></section>
    <section class="section"><h2>Visual evidence</h2><p class="section-note">The timeline uses the selected parameter. The ring summarizes calendar-month contributions to precipitation across complete years.</p><div class="charts"><article class="chart-panel"><h2>${variableName} through time</h2><p class="section-note">${htmlText(resolution)} scale · ${units}${analysis.slope == null ? "" : " · dashed line shows the fitted Theil-Sen trend"}</p>${chartSvg}<p class="chart-caption">Gaps indicate missing observations. This is a point-based NASA POWER series, not a station record.</p></article><article class="chart-panel"><h2>Rainfall by calendar month</h2>${shareSvg}<p class="chart-caption">${distribution.completeYears} complete years included · shares are contributions to total rainfall, not local wet/dry-season definitions.</p></article></div></section>
    <section class="section"><h2>Parameter overview</h2><p class="section-note">All five NASA POWER parameters for this location and period.</p><div class="panel table-wrap"><table><thead><tr><th>Parameter</th><th>Mean / annual total</th><th>Monthly coverage</th><th>Annual trend</th></tr></thead><tbody>${parameterRows}</tbody></table></div><p class="chart-caption">Precipitation is integrated over calendar days. Other means are weighted by calendar-day coverage. Annual trend estimates exclude incomplete years.</p></section>
    <section class="section"><h2>Data, methods, and limitations</h2><div class="panel"><p>${htmlText(activeSummary)}</p><p>NASA POWER is a gridded model and assimilation product; values are not direct station measurements. Missing months are omitted rather than zero-filled. Annual statistics require twelve valid months. Seasonal cycles and serial correlation may affect trend significance. A non-significant trend is not evidence of no change, and a significant trend does not establish causation.</p><p class="source"><strong>Source:</strong> ${htmlText(variable.source || "NASA POWER climate parameter")}. <a href="${source}">NASA POWER monthly point API</a><br>${source}</p></div></section>
    <footer class="footer"><span>TerraLens · NASA POWER climate evidence</span><span>Generated ${htmlText(new Date().toLocaleString())}</span></footer>
    <script>window.addEventListener('load',()=>window.print())</script>
  </body></html>`;
  const report = window.open("", "_blank");
  if (!report)
    throw new Error(
      "Allow pop-ups for TerraLens to open the printable report.",
    );
  if (report) {
    report.opener = null;
    report.document.write(html);
    report.document.close();
  }
}

function parameterSummaryRow(series) {
  const valid = series.observations.filter((item) => Number.isFinite(item.value));
  const annual = annualSeries(series);
  const complete = annual.observations.filter((item) =>
    Number.isFinite(item.value),
  );
  const trend = analyzeSeries(
    annual.observations,
    { ...series.parameterInfo, units: annual.units },
    "yearly",
  );
  const isRain = series.parameter === "PRECTOTCORR";
  const meanValue = isRain
    ? complete.length
      ? complete.reduce((sum, item) => sum + item.value, 0) / complete.length
      : null
    : weightedMean(series.observations);
  const meanLabel = isRain ? "mean annual total" : "day-weighted mean";
  const meanUnits = isRain ? annual.units : series.parameterInfo.units;
  const trendLabel = Number.isFinite(trend.slope)
    ? `${trend.slope > 0 ? "+" : ""}${format(trend.slope, 4)} ${htmlText(annual.units)}/yr · p ${format(trend.pValue, 3)}`
    : "Insufficient complete years";
  return `<tr><td><strong>${htmlText(series.parameterInfo.label)}</strong><br><span class="muted">${htmlText(series.parameter)}</span></td><td>${format(meanValue)} ${htmlText(meanUnits)}<br><span class="muted">${meanLabel}${isRain ? ` · ${complete.length} complete years` : ""}</span></td><td>${valid.length} / ${series.observations.length} months</td><td>${trendLabel}${Number.isFinite(trend.slope) ? `<br><span class="muted">${trend.significant ? "meets" : "does not meet"} 0.05 threshold</span>` : ""}</td></tr>`;
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
  let min = Math.min(...valid.map((item) => item.value));
  let max = Math.max(...valid.map((item) => item.value));
  if (min === max) {
    const padding = Math.abs(min) * 0.08 || 1;
    min -= padding;
    max += padding;
  }
  const x = (index) =>
    left + (observations.length < 2 ? 0.5 : index / (observations.length - 1)) * plotWidth;
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
    Number.isFinite(analysis.slope) && Number.isFinite(analysis.intercept)
      ? `<line class="trend" x1="${x(0)}" y1="${y(analysis.intercept + analysis.slope * (observations[0]?.yearDecimal ?? 0))}" x2="${x(observations.length - 1)}" y2="${y(analysis.intercept + analysis.slope * (observations.at(-1)?.yearDecimal ?? 0))}"/>`
      : "";
  const ticks = [...new Set([0, Math.floor((observations.length - 1) / 2), observations.length - 1])]
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
  const colors = ["#177e89", "#239da0", "#49b6a5", "#87c98c", "#b6cf72", "#d7c85f", "#e4aa54", "#df8751", "#d87565", "#ba6e83", "#8b709b", "#5c7eaa"];
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

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function format(value, digits = 3) {
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
    : "not available";
}
