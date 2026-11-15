import assert from "node:assert/strict";
import test from "node:test";
import { POWER_PARAMETERS } from "../src/nasaPower.js";
import { buildScientificReportHtml } from "../src/scientificReport.js";
import { reportContext } from "./reportFixture.js";

test("scientific report is dynamic and includes the formal report sections and source", () => {
  const html = buildScientificReportHtml(reportContext());
  for (const expected of [
    "CLIMATE INVESTIGATION REPORT",
    "Test Field Station",
    "12.3456 deg latitude",
    "2020 to 2022",
    "Executive Summary",
    "Study Overview",
    "Key Climate Indicators",
    "Scientific Interpretation",
    "Temperature Analysis",
    "Precipitation Analysis",
    "Solar Radiation Analysis",
    "Relative Humidity Analysis",
    "Climate Charts",
    "Comprehensive Parameter Overview",
    "Mann-Kendall p",
    "Theil-Sen",
    "Data, Methodology, and Limitations",
    "NASA POWER Monthly Point API",
    "counter(page)",
  ])
    assert.ok(html.includes(expected), `report should include ${expected}`);
  for (const parameter of Object.keys(POWER_PARAMETERS))
    assert.ok(html.includes(parameter), `report should include ${parameter}`);
  assert.ok(html.includes("https://power.larc.nasa.gov/api/temporal/monthly/point"));
  assert.ok(!html.includes("Tacloban City"));
  assert.ok(!html.includes("undefined"));
});
