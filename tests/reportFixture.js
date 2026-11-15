import { analyzeSeries } from "../src/analysis.js";
import { POWER_PARAMETERS } from "../src/nasaPower.js";

export function reportContext() {
  const series = Object.fromEntries(
    Object.values(POWER_PARAMETERS).map((parameter, index) => {
      const observations = [];
      for (let year = 2020; year <= 2022; year++)
        for (let month = 1; month <= 12; month++)
          observations.push({
            year,
            month,
            date: `${year}-${String(month).padStart(2, "0")}`,
            yearDecimal: year + (month - 0.5) / 12,
            value: 10 + index + year - 2020 + month / 10,
          });
      return [
        parameter.id,
        {
          parameter: parameter.id,
          parameterInfo: {
            ...parameter,
            units: parameter.id === "PRECTOTCORR" ? "mm/day" : "unit",
          },
          observations,
          validCount: observations.length,
          missingCount: 0,
        },
      ];
    }),
  );
  const dataset = {
    latitude: 12.3456,
    longitude: 123.4567,
    startYear: 2020,
    endYear: 2022,
    retrievedAt: "2026-11-15T00:00:00.000Z",
    sourceUrl:
      "https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M%2CPRECTOTCORR",
    series,
    ...series.T2M,
  };
  const variable = { ...series.T2M.parameterInfo };
  return {
    dataset,
    location: { name: "Test Field Station", province: "North District" },
    variable,
    startYear: 2020,
    endYear: 2022,
    resolution: "monthly",
    chartType: "line",
    analysis: analyzeSeries(series.T2M.observations, variable),
  };
}
