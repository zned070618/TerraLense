import * as echarts from "echarts/core";
import { LineChart, BarChart, PieChart, HeatmapChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  TitleComponent,
  AriaComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  annualSeries,
  rainfallMonths,
  monthlyClimatology,
  rainfallDistribution,
  MONTHS,
} from "./climateData.js";
import { toast } from "./ui.js";

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  TitleComponent,
  AriaComponent,
  CanvasRenderer,
]);
const palette = [
  "#56d5dd",
  "#6de3ae",
  "#6c9fe8",
  "#c4a4ef",
  "#e8bc79",
  "#82b9cf",
  "#9cc990",
  "#ea9c98",
  "#89a5df",
  "#95d9b7",
  "#dbbe96",
  "#64a9b0",
];
const labels = {
  color: "#a7bacb",
  fontSize: 14,
  fontFamily: "DM Sans, sans-serif",
};
function axis(name = "") {
  return {
    type: "value",
    name,
    nameTextStyle: { ...labels, padding: [0, 0, 5, 0] },
    axisLabel: labels,
    splitLine: {
      lineStyle: { color: "rgba(132,174,199,.09)", type: "dashed" },
    },
    axisLine: { show: false },
    axisTick: { show: false },
    scale: true,
  };
}
function base() {
  return {
    animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    animationDuration: 450,
    backgroundColor: "#0c1725",
    color: palette,
    textStyle: { fontFamily: "DM Sans, sans-serif", color: "#a7c2d3" },
    aria: { enabled: true },
    tooltip: {
      trigger: "axis",
      renderMode: "richText",
      confine: true,
      backgroundColor: "#132a3b",
      borderColor: "#315569",
      textStyle: { color: "#d7eaf2", fontSize: 15 },
      axisPointer: { lineStyle: { color: "#4e7a8f" } },
    },
    grid: { top: 42, left: 65, right: 30, bottom: 74 },
    legend: {
      top: 0,
      right: 10,
      textStyle: labels,
      itemWidth: 14,
      itemHeight: 7,
      inactiveColor: "#355066",
    },
  };
}
function timeline(observations) {
  return {
    xAxis: {
      type: "category",
      data: observations.map((item) => item.date),
      boundaryGap: false,
      axisLabel: { ...labels, hideOverlap: true },
      axisLine: { lineStyle: { color: "#244055" } },
      axisTick: { show: false },
    },
    dataZoom: [
      { type: "inside", zoomOnMouseWheel: "ctrl", moveOnMouseWheel: false },
      {
        type: "slider",
        height: 16,
        bottom: 15,
        borderColor: "#294052",
        backgroundColor: "#0b1826",
        fillerColor: "#51dbe614",
        handleStyle: { color: "#316f80", borderColor: "#61b9c7" },
        textStyle: { ...labels, fontSize: 12 },
        dataBackground: {
          lineStyle: { color: "#38657b" },
          areaStyle: { color: "#173a4b" },
        },
        selectedDataBackground: {
          lineStyle: { color: "#61c2ce" },
          areaStyle: { color: "#246276" },
        },
      },
    ],
  };
}
export function createAnalyticsCharts() {
  const mainElement = document.querySelector("#timeChart"),
    seasonalElement = document.querySelector("#seasonalChart");
  let main,
    seasonal = echarts.init(seasonalElement, null, {
      renderer: "canvas",
      devicePixelRatio: Math.min(devicePixelRatio, 2),
    });
  seasonal.setOption({
    ...base(),
    title: {
      text: "Your annual cycle will appear here",
      left: "center",
      top: "center",
      textStyle: { fontSize: 15, color: "#a7bacb", fontWeight: 400 },
    },
    series: [],
  });
  const observer = new ResizeObserver(() => {
    main?.resize();
    seasonal.resize();
  });
  observer.observe(mainElement);
  observer.observe(seasonalElement);
  document.addEventListener("fullscreenchange", () =>
    setTimeout(() => main?.resize(), 80),
  );
  document
    .querySelector("#chartFullscreen")
    .addEventListener("click", async () => {
      const panel = document.querySelector("#historyPanel");
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (panel.classList.contains("chart-expanded")) {
        panel.classList.remove("chart-expanded");
        main?.resize();
        return;
      }
      try {
        if (!panel.requestFullscreen) throw Error("Fullscreen unavailable");
        await panel.requestFullscreen();
      } catch {
        panel.classList.add("chart-expanded");
        main?.resize();
      }
    });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document
        .querySelector("#historyPanel")
        .classList.remove("chart-expanded");
      main?.resize();
    }
  });
  document.querySelector("#chartPng").addEventListener("click", () => {
    if (!main) return;
    const a = document.createElement("a");
    a.download = `terralens-${mainElement.dataset.mode}-chart.png`;
    a.href = main.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#0c1725",
    });
    a.click();
    toast("Chart exported as PNG.");
  });
  function render({
    dataset,
    parameter,
    resolution,
    type,
    observations,
    parameterInfo,
    analysis,
    showSeries,
    showTrend,
    grouping = "months",
  }) {
    mainElement.hidden = false;
    if (!main)
      main = echarts.init(mainElement, null, {
        renderer: "canvas",
        devicePixelRatio: Math.min(devicePixelRatio, 2),
      });
    mainElement.dataset.mode = type;
    let option = base(),
      note = "";
    const valid = observations.filter((item) => Number.isFinite(item.value));
    if (type === "donut" || type === "pie") {
      const distribution = rainfallDistribution(
        dataset.series.PRECTOTCORR,
        grouping,
      );
      note = `Rainfall shares use ${distribution.completeYears} complete years. ${grouping === "seasons" ? "DJF / MAM / JJA / SON are calendar groups, not local wet/dry seasons." : "Each slice is a calendar month's contribution to the total."} Incomplete years are excluded.`;
      option.tooltip.trigger = "item";
      option.legend = {
        ...option.legend,
        type: "scroll",
        top: "bottom",
        left: "center",
        right: "center",
        bottom: 4,
      };
      option.series =
        showSeries && distribution.total > 0
          ? [
              {
                type: "pie",
                name: "Rainfall share (mm)",
                radius: type === "donut" ? ["43%", "67%"] : "67%",
                center: ["50%", "45%"],
                avoidLabelOverlap: true,
                padAngle: 1.5,
                itemStyle: {
                  borderColor: "#0c1725",
                  borderWidth: 3,
                  borderRadius: 3,
                },
                label: {
                  color: "#8daabc",
                  fontSize: 14,
                  formatter: "{b}: {d}%",
                },
                labelLine: { lineStyle: { color: "#355a70" } },
                data: distribution.values,
                tooltip: {
                  valueFormatter: (value) =>
                    `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} mm`,
                },
              },
            ]
          : [];
      if (!distribution.total)
        option.title = {
          text: "No complete rainfall years available",
          left: "center",
          top: "center",
          textStyle: { fontSize: 14, color: "#a7bacb", fontWeight: 400 },
        };
    } else if (type === "heatmap") {
      const series = dataset.series[parameter];
      const years = Array.from(
        { length: dataset.endYear - dataset.startYear + 1 },
        (_, i) => String(dataset.startYear + i),
      );
      const data = series.observations
        .filter((item) => Number.isFinite(item.value))
        .map((item) => [
          item.month - 1,
          item.year - dataset.startYear,
          item.value,
        ]);
      const values = data.map((item) => item[2]),
        min = values.length ? Math.min(...values) : 0,
        max = values.length ? Math.max(...values) : 1;
      option.grid = { top: 18, left: 55, right: 20, bottom: 70 };
      option.legend.show = false;
      option.xAxis = {
        type: "category",
        data: MONTHS,
        axisLabel: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        splitArea: { show: true, areaStyle: { color: ["#0e1c2a", "#0e1c2a"] } },
      };
      option.yAxis = {
        type: "category",
        data: years,
        axisLabel: { ...labels, interval: "auto" },
        axisLine: { show: false },
        axisTick: { show: false },
      };
      option.visualMap = {
        min,
        max: max === min ? max + 1 : max,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 2,
        itemHeight: 170,
        itemWidth: 9,
        textStyle: labels,
        inRange: {
          color: ["#153b59", "#276b89", "#4db7b7", "#8ee2bf", "#e8ca85"],
        },
        formatter: (value) => Number(value).toFixed(1),
      };
      option.tooltip.trigger = "item";
      option.tooltip.formatter = (item) =>
        `${years[item.value[1]]}-${String(item.value[0] + 1).padStart(2, "0")}: ${Number(item.value[2]).toFixed(2)} ${series.parameterInfo.units}`;
      option.series = showSeries
        ? [
            {
              name: series.parameterInfo.shortName,
              type: "heatmap",
              data,
              itemStyle: { borderWidth: 2, borderColor: "#0c1725" },
              emphasis: {
                itemStyle: { borderColor: "#d0f4ed", borderWidth: 2 },
              },
            },
          ]
        : [];
      note = `Monthly ${series.parameterInfo.shortName.toLowerCase()} in ${series.parameterInfo.units}. Color shows relative values within this period, not climatological anomalies. Missing observations are blank.`;
    } else if (type === "combined") {
      const temperature = dataset.series.T2M,
        rainfall = dataset.series.PRECTOTCORR;
      const temp =
        resolution === "yearly"
          ? annualSeries(temperature).observations
          : temperature.observations;
      const rain =
        resolution === "yearly"
          ? annualSeries(rainfall).observations
          : rainfallMonths(rainfall);
      const rainUnits = resolution === "yearly" ? "mm/year" : "mm/month";
      Object.assign(option, timeline(temp));
      option.grid.right = 72;
      option.grid.left = 65;
      option.yAxis = [
        axis(temperature.parameterInfo.units),
        { ...axis(rainUnits), splitLine: { show: false }, scale: false },
      ];
      option.series = showSeries
        ? [
            {
              name: `Temperature (${temperature.parameterInfo.units})`,
              type: "line",
              yAxisIndex: 0,
              data: temp.map((item) => item.value),
              showSymbol: temp.length < 40,
              symbolSize: 5,
              lineStyle: { width: 2 },
              connectNulls: false,
              z: 3,
            },
            {
              name: `Rainfall (${rainUnits})`,
              type: "bar",
              yAxisIndex: 1,
              data: rain.map((item) => item.value),
              itemStyle: { color: "#59a9c480", borderRadius: [2, 2, 0, 0] },
              barMaxWidth: 28,
            },
          ]
        : [];
      note =
        "Temperature and rainfall have separate, labeled axes. Monthly rainfall rates are integrated over calendar days. Alignment does not establish causation.";
    } else {
      Object.assign(option, timeline(observations));
      option.yAxis = axis(parameterInfo.units);
      const name = `${parameterInfo.shortName} (${parameterInfo.units})`;
      option.series = showSeries
        ? [
            {
              name,
              type: type === "bar" ? "bar" : "line",
              data: observations.map((item) => item.value),
              connectNulls: false,
              showSymbol: valid.length < 70,
              symbolSize: 5,
              lineStyle: { width: 2 },
              itemStyle: {
                color: palette[0],
                borderRadius: type === "bar" ? [3, 3, 0, 0] : undefined,
              },
              barMaxWidth: 28,
              areaStyle:
                type === "area"
                  ? {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: "#51dbe649" },
                        { offset: 1, color: "#51dbe602" },
                      ]),
                    }
                  : undefined,
              emphasis: { focus: "series" },
              tooltip: {
                valueFormatter: (value) =>
                  value == null
                    ? "Missing"
                    : `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${parameterInfo.units}`,
              },
            },
          ]
        : [];
      if (showTrend && Number.isFinite(analysis.slope))
        option.series.push({
          name: "Theil-Sen trend",
          type: "line",
          data: observations.map((item) =>
            Number.isFinite(item.value)
              ? analysis.intercept + analysis.slope * item.yearDecimal
              : null,
          ),
          connectNulls: false,
          showSymbol: false,
          lineStyle: { color: "#e8bc79", width: 1.5, type: "dashed" },
          itemStyle: { color: "#e8bc79" },
          silent: true,
        });
      if (!valid.length)
        option.title = {
          text: "No valid observations in this view",
          left: "center",
          top: "center",
          textStyle: { fontSize: 14, color: "#a7bacb", fontWeight: 400 },
        };
      note =
        resolution === "yearly"
          ? "Complete years only. Annual rainfall totals; all other parameters use day-weighted annual means."
          : "Monthly mean values in original NASA metadata units. Missing observations remain gaps.";
    }
    main.setOption(option, { notMerge: true });
    main.resize();
    const source = dataset.series[parameter];
    const rain = parameter === "PRECTOTCORR";
    const cycle = monthlyClimatology(
      rain ? rainfallMonths(source) : source.observations,
    );
    const units = rain ? "mm/month" : source.parameterInfo.units;
    const seasonalOption = base();
    seasonalOption.grid = { top: 30, left: 65, right: 20, bottom: 35 };
    seasonalOption.legend = { show: false };
    seasonalOption.xAxis = {
      type: "category",
      data: MONTHS,
      axisLabel: labels,
      axisLine: { lineStyle: { color: "#244055" } },
      axisTick: { show: false },
    };
    seasonalOption.yAxis = axis(units);
    seasonalOption.series = [
      {
        name: `Mean ${source.parameterInfo.shortName.toLowerCase()} (${units})`,
        type: "bar",
        barMaxWidth: 23,
        data: cycle.map((item) => item.value),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#63d9d8" },
            { offset: 1, color: "#225a70" },
          ]),
          borderRadius: [3, 3, 0, 0],
        },
      },
    ];
    seasonal.setOption(seasonalOption, { notMerge: true });
    seasonal.resize();
    document.querySelector("#seasonalNote").textContent =
      `Mean of available ${rain ? "monthly rainfall totals" : "monthly observations"} by calendar month (${units}), ${dataset.startYear}-${dataset.endYear}. Coverage may differ by month.`;
    document.querySelector("#chartPng").disabled = false;
    return note;
  }
  return {
    render,
    resize: () => {
      main?.resize();
      seasonal.resize();
    },
  };
}
