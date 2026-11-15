import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LOCATIONS, DEFAULT_LOCATION } from "./src/locations.js";
import {
  POWER_PARAMETERS,
  fetchMonthlyPowerData,
  selectPowerParameter,
  aggregateYearly,
  validatePowerRequest,
} from "./src/nasaPower.js";
import { analyzeSeries, comparePeriods } from "./src/analysis.js";
import { fetchVerifiedPowerData } from "./src/assistantClient.js";
import { createAssistantChat } from "./src/assistantChat.js";
import { buildCsv } from "./src/report.js";
import { openPrintableReport } from "./src/scientificReport.js";

import { createAnalyticsCharts } from "./src/analyticsCharts.js";
import { initNavigation, icon, toast } from "./src/ui.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderTopbar } from "./components/topbar.js";
import { renderOverview } from "./pages/overview.js";
import { renderEarthExplorer } from "./pages/earth-explorer.js";
import { renderHistoricalClimate } from "./pages/historical-climate.js";
import { renderClimateAnalytics } from "./pages/climate-analytics.js";
import { renderDataInsights } from "./pages/data-insights.js";
import { renderDataExport } from "./pages/data-export.js";
import { renderAbout } from "./pages/about.js";
import {
  climateMetrics,
  climateInsights,
  filterDataset,
} from "./src/climateData.js";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const state = {
  location: DEFAULT_LOCATION,
  variable: "T2M",
  startYear: 2001,
  endYear: 2025,
  dataset: null,
  analysis: null,
  resolution: "monthly",
  view: null,
  loadedLocation: null,
  filterStart: null,
  filterEnd: null,
  filtered: null,
  verifiedDatasetId: null,
};

const $ = (selector) => document.querySelector(selector);
const setText = (selector, value) => {
  const element = $(selector);
  if (element) element.textContent = value;
};

let map;
let marker;
const globes = [];
let explorerGlobePromise;
let charts;
let assistantChat;
const globeFocus = (lat, lng) =>
  globes.forEach((globe) => globe.focus(lat, lng));

function format(value, digits = 2) {
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
    : "n/a";
}

function syncStatus() {
  const parameter = POWER_PARAMETERS[state.variable];
  setText("#statusLocation", state.location.name);
  setText("#statusVariable", parameter.shortName);
  setText("#statusPeriod", `${state.startYear}-${state.endYear}`);
  setText(
    "#coordReadout",
    `${state.location.lat.toFixed(4)}, ${state.location.lng.toFixed(4)}`,
  );
  setText(
    "#apiReadout",
    `NASA POWER monthly point · ${state.variable} · community AG`,
  );
  $("#latInput").value = state.location.lat.toFixed(4);
  $("#lngInput").value = state.location.lng.toFixed(4);
  setText(
    "#heroCoords",
    `${Math.abs(state.location.lat).toFixed(4)}\u00b0 ${state.location.lat < 0 ? "S" : "N"}, ${Math.abs(state.location.lng).toFixed(4)}\u00b0 ${state.location.lng < 0 ? "W" : "E"}`,
  );
  updateSelectionNotice();
}

function setLocation(location, moveMap = false) {
  state.location = location;
  $("#locationSearch").value = location.displayName || location.name || "Custom map point";
  marker?.setLatLng([location.lat, location.lng]);
  if (moveMap && map) {
    if (
      $("#map").hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      map.setView([location.lat, location.lng], location.zoom || 8);
    else
      map.flyTo([location.lat, location.lng], location.zoom || 8, {
        duration: 0.8,
      });
  }
  globeFocus?.(location.lat, location.lng);
  syncStatus();
}

function initLocationSearch() {
  const input = $("#locationSearch");
  const list = $("#locationSuggestions");
  let debounceTimer;
  let controller;
  let results = [];
  let activeIndex = -1;
  input.value = "";

  const close = () => {
    clearTimeout(debounceTimer);
    controller?.abort();
    results = [];
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  };
  const showMessage = (message) => {
    activeIndex = -1;
    input.removeAttribute("aria-activedescendant");
    list.replaceChildren();
    const item = document.createElement("li");
    item.className = "location-suggestion-message";
    item.setAttribute("role", "presentation");
    item.textContent = message;
    list.append(item);
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };
  const selectResult = (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const properties = feature.properties;
    const displayName = [
      properties.name,
      properties.city,
      properties.state,
      properties.country,
    ].filter((part, index, parts) => part && parts.indexOf(part) === index).join(", ");
    const placeType = properties.osm_value || properties.type;
    const zoom = ({ continent: 3, country: 5, state: 7, province: 7, county: 9, city: 11, town: 12, village: 13 })[placeType] || 12;
    controller?.abort();
    setLocation({
      id: "custom",
      name: displayName || "Selected place",
      displayName: displayName || "Selected place",
      province: properties.state || properties.country || "User-selected",
      lat,
      lng,
      zoom,
    }, true);
    close();
  };
  const renderResults = (features) => {
    results = features;
    activeIndex = -1;
    input.removeAttribute("aria-activedescendant");
    list.replaceChildren();
    if (!features.length) {
      showMessage("No places found. Try a nearby city or region.");
      return;
    }
    features.forEach((feature, index) => {
      const properties = feature.properties;
      const item = document.createElement("li");
      item.id = `location-suggestion-${index}`;
      item.className = "location-suggestion";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", "false");
      item.textContent = [properties.name, properties.city, properties.state, properties.country]
        .filter((part, partIndex, parts) => part && parts.indexOf(part) === partIndex)
        .join(", ");
      item.addEventListener("mousedown", (event) => event.preventDefault());
      item.addEventListener("click", () => selectResult(feature));
      list.append(item);
    });
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };
  const search = () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    controller?.abort();
    results = [];
    if (query.length < 2) {
      results = [];
      showMessage("Type at least 2 characters to search places.");
      return;
    }
    showMessage("Searching places near the map view…");
    debounceTimer = setTimeout(async () => {
      const center = map?.getCenter();
      controller = new AbortController();
      const params = new URLSearchParams({ q: query, limit: "6" });
      if (center) {
        params.set("lat", String(center.lat));
        params.set("lon", String(center.lng));
        params.set("zoom", String(map.getZoom()));
      }
      try {
        const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Place search failed (${response.status})`);
        const data = await response.json();
        if (input.value.trim() === query) renderResults(data.features || []);
      } catch (error) {
        if (error.name !== "AbortError" && input.value.trim() === query)
          showMessage("Place search is unavailable. Try again shortly.");
      }
    }, 250);
  };

  input.addEventListener("input", search);
  input.addEventListener("keydown", (event) => {
    const options = [...list.querySelectorAll('[role="option"]')];
    if (event.key === "Escape") {
      close();
    } else if (options.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      activeIndex = activeIndex < 0
        ? direction > 0 ? 0 : options.length - 1
        : (activeIndex + direction + options.length) % options.length;
      options.forEach((option, index) => {
        option.classList.toggle("active", index === activeIndex);
        option.setAttribute("aria-selected", String(index === activeIndex));
      });
      input.setAttribute("aria-activedescendant", options[activeIndex].id);
    } else if (event.key === "Enter" && !list.hidden && results.length) {
      event.preventDefault();
      selectResult(results[activeIndex < 0 ? 0 : activeIndex]);
    }
  });
  input.addEventListener("blur", () => setTimeout(close, 150));
}

function initSelectors() {
  $("#variableSelect").replaceChildren();
  for (const info of Object.values(POWER_PARAMETERS)) {
    $("#variableSelect").add(
      new Option(`${info.shortName} / ${info.id}`, info.id),
    );
    $("#chartParameter").add(new Option(info.shortName, info.id));
  }
  document
    .querySelectorAll('input[max="2025"]')
    .forEach((input) => (input.max = new Date().getUTCFullYear() - 1));
  initLocationSearch();
  ["variableSelect", "chartParameter"].forEach((id) =>
    $("#" + id).addEventListener("change", (event) => {
      state.variable = event.target.value;
      $("#variableSelect").value = $("#chartParameter").value = state.variable;
      if (["pie", "donut", "combined"].includes($("#chartType").value))
        $("#chartType").value = "line";
      syncStatus();
      if (state.dataset) {
        state.dataset = selectPowerParameter(state.dataset, state.variable);
        renderInvestigation();
      }
    }),
  );
  ["latInput", "lngInput"].forEach((id) => {
    $(`#${id}`).addEventListener("change", () => {
      const lat = Number($("#latInput").value);
      const lng = Number($("#lngInput").value);
      if (
        $("#latInput").value.trim() &&
        $("#lngInput").value.trim() &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        setLocation(
          {
            id: "custom",
            name: "Custom point",
            province: "User-selected",
            lat,
            lng,
            zoom: map?.getZoom() || 8,
          },
          true,
        );
      }
    });
  });
}

function initMap() {
  map = L.map("map", {
    center: [state.location.lat, state.location.lng],
    zoom: state.location.zoom,
    zoomControl: true,
  });
  const tiles = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors",
    },
  );
  const mapStatus = element(
    "span",
    "map-status",
    "Loading OpenStreetMap imagery...",
  );
  mapStatus.id = "mapStatus";
  mapStatus.setAttribute("role", "status");
  $(".explorer-viewport").append(mapStatus);
  let tileFailed = false;
  tiles.on("loading", () => {
    tileFailed = false;
    mapStatus.hidden = false;
    mapStatus.textContent = "Loading OpenStreetMap imagery...";
  });
  tiles.on("tileerror", () => {
    tileFailed = true;
    mapStatus.hidden = false;
    mapStatus.textContent =
      "Some map tiles are unavailable. Point selection still works.";
  });
  tiles.on("load", () => {
    if (!tileFailed) mapStatus.hidden = true;
  });
  tiles.addTo(map);
  marker = L.circleMarker([state.location.lat, state.location.lng], {
    radius: 9,
    color: "#7be7ff",
    fillColor: "#ffe08a",
    fillOpacity: 0.9,
    weight: 2,
  }).addTo(map);
  map.on("click", (event) => {
    setLocation({
      id: "custom",
      name: "Custom point",
      province: "User-selected",
      lat: event.latlng.lat,
      lng: ((((event.latlng.lng + 180) % 360) + 360) % 360) - 180,
      zoom: map.getZoom(),
    });
  });
}

function validateYears() {
  const start = Number($("#startYear").value);
  const end = Number($("#endYear").value);
  validatePowerRequest({
    latitude: state.location.lat,
    longitude: state.location.lng,
    startYear: start,
    endYear: end,
  });
  state.startYear = start;
  state.endYear = end;
}

async function loadInvestigation() {
  if ($("#loadData").disabled) return;
  $("#errorState").hidden = true;
  try {
    const latText = $("#latInput").value.trim(),
      lngText = $("#lngInput").value.trim();
    const latitude = latText ? Number(latText) : NaN,
      longitude = lngText ? Number(lngText) : NaN;
    validatePowerRequest({
      latitude,
      longitude,
      startYear: Number($("#startYear").value),
      endYear: Number($("#endYear").value),
    });
    if (
      Math.abs(latitude - state.location.lat) > 0.00005 ||
      Math.abs(longitude - state.location.lng) > 0.00005
    ) {
      setLocation(
        {
          id: "custom",
          name: "Custom point",
          lat: latitude,
          lng: longitude,
          zoom: map.getZoom(),
        },
        true,
      );
    }
    validateYears();
    syncStatus();
    $("#loadingState").hidden = false;
    $("#loadData").disabled = $("#loadDataTop").disabled = true;
    $("#historyPanel").setAttribute("aria-busy", "true");
    $("#loadData").innerHTML =
      '<span class="spinner" aria-hidden="true"></span>Fetching NASA data...';
    $("#climateGrid").setAttribute("aria-busy", "true");
    const location = { ...state.location };
    const verified = await fetchVerifiedPowerData({
      latitude: location.lat,
      longitude: location.lng,
      startYear: state.startYear,
      endYear: state.endYear,
      parameter: state.variable,
    });
    const dataset = verified.dataset;
    state.verifiedDatasetId = verified.datasetId;
    state.dataset = selectPowerParameter(dataset, state.variable);
    state.loadedLocation = location;
    state.filterStart = dataset.startYear;
    state.filterEnd = dataset.endYear;
    $("#filterStart").value = dataset.startYear;
    $("#filterEnd").value = dataset.endYear;
    ["filterStart", "filterEnd"].forEach((id) => {
      $("#" + id).min = dataset.startYear;
      $("#" + id).max = dataset.endYear;
    });
    $("#filterError").hidden = true;
    $("#loadingState").hidden = true;
    $("#historyPanel").setAttribute("aria-busy", "false");
    $("#loadData").innerHTML =
      icon("download") + "Fetch NASA POWER" + icon("arrow-right");
    $("#climateGrid").setAttribute("aria-busy", "false");
    renderInvestigation();
    toast("NASA climate history loaded. Explore your charts and insights.");
  } catch (error) {
    $("#errorState").textContent = error.message;
    $("#errorState").hidden = false;
    toast(error.message);
  } finally {
    $("#loadingState").hidden = true;
    $("#loadData").disabled = $("#loadDataTop").disabled = false;
    $("#historyPanel").setAttribute("aria-busy", "false");
    $("#loadData").innerHTML =
      icon("download") + "Fetch NASA POWER" + icon("arrow-right");
    $("#climateGrid").setAttribute("aria-busy", "false");
  }
}

function renderInvestigation() {
  const dataset = state.dataset;
  state.filtered = filterDataset(
    dataset,
    state.filterStart ?? dataset.startYear,
    state.filterEnd ?? dataset.endYear,
  );
  const monthly = dataset.parameterInfo;
  const source = state.filtered.series[state.variable];
  const view =
    state.resolution === "yearly"
      ? aggregateYearly(source.observations, monthly)
      : { observations: source.observations, units: monthly.units };
  state.view = { ...view, parameterInfo: { ...monthly, units: view.units } };
  state.analysis = analyzeSeries(
    view.observations,
    state.view.parameterInfo,
    state.resolution,
  );
  const special = $("#chartType").value;
  setText(
    "#chartTitle",
    state.loadedLocation.name +
      " / " +
      (special === "combined"
        ? "Temperature and rainfall"
        : ["pie", "donut"].includes(special)
          ? "Rainfall distribution"
          : monthly.label + " (" + view.units + ")"),
  );
  setText(
    "#retrievedAt",
    "Retrieved " + new Date(dataset.retrievedAt).toLocaleString(),
  );
  $("#chartEmpty").hidden = true;
  $("#timeChart").hidden = false;
  ["downloadReport", "chartPng"].forEach(
    (id) => ($("#" + id).disabled = false),
  );
  setText(
    "#exportMeta",
    dataset.latitude.toFixed(4) +
      ", " +
      dataset.longitude.toFixed(4) +
      " / " +
      dataset.startYear +
      "-" +
      dataset.endYear +
      " / ALL FIVE PARAMETERS",
  );
  setText(
    "#snapshotMeta",
    dataset.latitude.toFixed(4) +
      ", " +
      dataset.longitude.toFixed(4) +
      " / " +
      dataset.startYear +
      "-" +
      dataset.endYear,
  );
  renderSummaryCards();
  renderClimateOverview();
  renderInsights();
  renderChart();
  renderPeriodComparison();
  updateSelectionNotice();
  assistantChat?.setContext({
    datasetId: state.verifiedDatasetId,
    dataset: state.dataset,
    chart: {
      type: $("#chartType").value,
      parameter: state.variable,
      resolution: state.resolution,
      startYear: state.filtered.startYear,
      endYear: state.filtered.endYear,
      grouping: $("#distributionGroup").value,
    },
  });
  updateSelectionNotice();
}

function renderSummaryCards() {
  const parameter = state.view.parameterInfo;
  const a = state.analysis;
  const observations = state.filtered.series[state.variable].observations;
  const d = {
    startYear: state.filtered.startYear,
    endYear: state.filtered.endYear,
    missingCount: observations.filter((item) => !Number.isFinite(item.value))
      .length,
  };
  const cards = [
    [
      "Valid observations",
      a.validCount,
      `${a.firstDate || "n/a"} to ${a.lastDate || "n/a"}`,
    ],
    [
      state.resolution === "yearly" ? "Annual mean" : "Monthly mean",
      `${format(a.mean)} ${parameter.units}`,
      `Min ${format(a.min)} · Max ${format(a.max)}`,
    ],
    [
      "Trend slope",
      a.slope == null
        ? "Insufficient data"
        : `${format(a.slope, 4)} ${parameter.units}/year`,
      "Theil-Sen estimator",
    ],
    [
      "Estimated change",
      a.totalChange == null
        ? "n/a"
        : `${format(a.totalChange, 3)} ${parameter.units}`,
      `${d.startYear}-${d.endYear}`,
    ],
    [
      "Mann-Kendall",
      a.pValue == null ? "Insufficient data" : `p=${format(a.pValue, 4)}`,
      a.significant ? "Significant at 0.05" : "Not significant at 0.05",
    ],
    [
      "Missing values",
      d.missingCount,
      "Invalid values omitted, not zero-filled",
    ],
  ];
  $("#summaryGrid").replaceChildren(
    ...cards.map(([label, value, detail]) => {
      const article = document.createElement("article");
      article.className = "summary-card glass";
      for (const [tag, text] of [
        ["span", label],
        ["strong", value],
        ["p", detail],
      ]) {
        const element = document.createElement(tag);
        element.textContent = text;
        article.append(element);
      }
      return article;
    }),
  );
}

function renderChart() {
  const type = $("#chartType").value;
  const special = ["pie", "donut", "heatmap", "combined"].includes(type);
  $("#trendLegend").hidden = special;
  $("#distributionControl").hidden = !["pie", "donut"].includes(type);
  $("#resolutionSelect").disabled = ["pie", "donut", "heatmap"].includes(type);
  if (!state.view) return;
  const note = charts.render({
    dataset: state.filtered,
    parameter: state.variable,
    resolution: state.resolution,
    type,
    observations: state.view.observations,
    parameterInfo: state.view.parameterInfo,
    analysis: state.analysis,
    showSeries: $("#showSeries").checked,
    showTrend: $("#showTrend").checked,
    grouping: $("#distributionGroup").value,
  });
  setText(
    "#dataCoverage",
    state.dataset.latitude.toFixed(4) +
      ", " +
      state.dataset.longitude.toFixed(4) +
      " / " +
      state.filtered.startYear +
      "-" +
      state.filtered.endYear +
      ". " +
      note +
      (state.dataset.messages.length
        ? " NASA: " + state.dataset.messages.join(" ")
        : ""),
  );
}

function renderPeriodComparison() {
  if (!state.dataset) return;
  const parameter = state.view.parameterInfo;
  const result = comparePeriods(state.view.observations, {
    aStart: Number($("#periodAStart").value),
    aEnd: Number($("#periodAEnd").value),
    bStart: Number($("#periodBStart").value),
    bEnd: Number($("#periodBEnd").value),
  });
  setText(
    "#periodResult",
    result.ok
      ? `Period A mean: ${format(result.aMean)} ${parameter.units} (${result.aCount} observations). Period B mean: ${format(result.bMean)} ${parameter.units} (${result.bCount} observations). Difference: ${format(result.difference)} ${parameter.units}. This is a period-average comparison, not a formal trend-difference test.`
      : result.message,
  );
}

function initComparison() {
  $("#compareChecks").innerHTML = LOCATIONS.slice(0, 8)
    .map(
      (location, index) =>
        `<label class="check-item"><input type="checkbox" data-compare value="${location.id}" ${index < 3 ? "checked" : ""} /> ${location.name}</label>`,
    )
    .join("");
  $("#runCompare").addEventListener("click", runComparison);
}

async function runComparison() {
  const ids = [...document.querySelectorAll("[data-compare]:checked")].map(
    (input) => input.value,
  );
  if (ids.length < 3) {
    $("#compareOutput").innerHTML =
      `<div class="notice error">Choose at least three locations.</div>`;
    return;
  }
  $("#compareLoading").hidden = false;
  $("#runCompare").disabled = true;
  try {
    validateYears();
    const parameterId = $("#variableSelect").value;
    const results = [];
    for (const id of ids) {
      const location = LOCATIONS.find((item) => item.id === id);
      const dataset = await fetchMonthlyPowerData({
        latitude: location.lat,
        longitude: location.lng,
        startYear: state.startYear,
        endYear: state.endYear,
        parameter: parameterId,
      });
      results.push({
        location,
        analysis: analyzeSeries(dataset.observations, dataset.parameterInfo),
        parameterInfo: dataset.parameterInfo,
      });
    }
    renderComparison(results, parameterId);
  } catch (error) {
    $("#compareOutput").textContent = error.message;
  } finally {
    $("#compareLoading").hidden = true;
    $("#runCompare").disabled = false;
  }
}

function renderComparison(results, parameterId) {
  const parameter = results[0].parameterInfo;
  setText(
    "#compareTitle",
    `${parameter.shortName} slopes · ${state.startYear}-${state.endYear}`,
  );
  const max = Math.max(
    ...results.map((row) => Math.abs(row.analysis.slope || 0)),
    0.001,
  );
  $("#compareOutput").innerHTML = `
    <div class="slope-list">
      ${results
        .map((row) => {
          const slope = row.analysis.slope;
          const width = Number.isFinite(slope)
            ? Math.max(4, (Math.abs(slope) / max) * 100)
            : 0;
          return `<button class="slope-row" type="button" data-jump="${row.location.id}">
            <span>${row.location.name}</span><span class="bar"><i style="width:${width}%"></i></span>
            <strong>${Number.isFinite(slope) ? `${format(slope, 4)} ${parameter.units}/yr` : "Insufficient"}</strong>
            <em>${row.analysis.pValue == null ? "No test" : row.analysis.significant ? "p<0.05" : "not significant"}</em>
          </button>`;
        })
        .join("")}
    </div>
    <p class="limitation">Avoid reading this as "most affected" unless the basis is explicitly defined. This MVP does not formally compare trend differences.</p>
  `;
  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const location = LOCATIONS.find(
        (item) => item.id === button.dataset.jump,
      );
      if (location) setLocation(location, true);
      $("#investigate").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function assistantContext() {
  return {
    location: state.loadedLocation || state.location,
    variable: state.view?.parameterInfo || POWER_PARAMETERS[state.variable],
    startYear: state.filtered?.startYear ?? state.startYear,
    endYear: state.filtered?.endYear ?? state.endYear,
    resolution: state.resolution,
    chartType: $("#chartType").value,
    dataset: state.dataset,
    analysis: state.analysis,
  };
}

function initControls() {
  $("#chartType").addEventListener("change", () => {
    const type = $("#chartType").value;
    if (["pie", "donut", "combined"].includes(type)) {
      state.variable = type === "combined" ? "T2M" : "PRECTOTCORR";
      $("#variableSelect").value = $("#chartParameter").value = state.variable;
      if (state.dataset)
        state.dataset = selectPowerParameter(state.dataset, state.variable);
      syncStatus();
    }
    if (type === "heatmap") {
      state.resolution = "monthly";
      $("#resolutionSelect").value = "monthly";
    }
    if (state.dataset) renderInvestigation();
    else renderChart();
  });
  $("#distributionGroup").addEventListener("change", renderChart);
  $("#applyChartFilter").addEventListener("click", applyChartFilter);
  $("#resetChartFilter").addEventListener("click", () => {
    if (!state.dataset) return toast("Fetch a dataset before filtering.");
    $("#filterStart").value = state.dataset.startYear;
    $("#filterEnd").value = state.dataset.endYear;
    applyChartFilter();
  });
  $("#showMap").addEventListener("click", () => setExplorerMode("map"));
  $("#showGlobe").addEventListener("click", () => setExplorerMode("globe"));
  $("#resolutionSelect").addEventListener("change", (event) => {
    state.resolution = event.target.value;
    if (state.dataset) renderInvestigation();
  });
  ["showSeries", "showTrend"].forEach((id) =>
    $("#" + id).addEventListener("change", renderChart),
  );
  $("#loadData").addEventListener("click", loadInvestigation);
  $("#loadDataTop").addEventListener("click", loadInvestigation);
  $("#resetSelection").addEventListener("click", () =>
    setLocation(DEFAULT_LOCATION, true),
  );
  ["startYear", "endYear"].forEach((id) =>
    $(`#${id}`).addEventListener("change", () => {
      state.startYear = Number($("#startYear").value);
      state.endYear = Number($("#endYear").value);
      syncStatus();
    }),
  );
  ["periodAStart", "periodAEnd", "periodBStart", "periodBEnd"].forEach((id) =>
    $(`#${id}`).addEventListener("change", renderPeriodComparison),
  );
  const exportDialog = $("#exportFormatDialog");
  $("#downloadReport").addEventListener("click", () => {
    if (!state.dataset || !state.analysis)
      return alert("Load NASA POWER data before exporting a report.");
    exportDialog.showModal();
  });
  $("#downloadPdf").addEventListener("click", () => {
    exportDialog.close();
    if (!state.dataset || !state.analysis)
      return alert("Load NASA POWER data before exporting a report.");
    try {
      openPrintableReport(assistantContext());
    } catch (error) {
      toast(error.message);
    }
  });
  $("#downloadCsv").addEventListener("click", () => {
    exportDialog.close();
    if (!state.dataset)
      return alert("Load NASA POWER data before exporting CSV.");
    const blob = new Blob([buildCsv(assistantContext())], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `terralens-${state.dataset.latitude}-${state.dataset.longitude}-${state.dataset.startYear}-${state.dataset.endYear}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("NASA dataset exported as CSV.");
  });
}

function updateSelectionNotice() {
  if (!state.dataset) return;
  const dataset = state.dataset;
  const stale =
    Math.abs(dataset.latitude - state.location.lat) > 0.0001 ||
    Math.abs(dataset.longitude - state.location.lng) > 0.0001 ||
    dataset.startYear !== state.startYear ||
    dataset.endYear !== state.endYear;
  $("#selectionNotice").hidden = !stale;
  assistantChat?.setStale(stale);
  setText(
    "#selectionNotice",
    "Selection changed. Charts, insights, and exports still show the loaded point (" +
      dataset.latitude.toFixed(4) +
      ", " +
      dataset.longitude.toFixed(4) +
      "), " +
      dataset.startYear +
      "-" +
      dataset.endYear +
      ". Fetch NASA POWER to update them.",
  );
  setText(
    "#dataStatus",
    stale ? "Selection changed / fetch to update" : "NASA data loaded",
  );
  $("#dataStatusDot").classList.toggle("muted-dot", stale);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
const metricStyles = {
  T2M: ["temperature", "#e9b779"],
  PRECTOTCORR: ["rain", "#65b9e5"],
  RH2M: ["humidity", "#76d9b4"],
  ALLSKY_SFC_SW_DWN: ["sun", "#d5c27b"],
  WS2M: ["wind", "#b9a6dc"],
};
function renderClimateOverview() {
  const metrics = state.dataset
    ? climateMetrics(state.dataset)
    : Object.values(POWER_PARAMETERS).map((info) => ({
        id: info.id,
        name:
          info.id === "PRECTOTCORR"
            ? "Total precipitation"
            : "Average " + info.shortName.toLowerCase(),
        value: null,
        units: "",
        note: "Awaiting NASA data",
        trend: "",
        observations: [],
      }));
  $("#climateGrid").replaceChildren(
    ...metrics.map((metric) => {
      const card = element("article", "climate-card glass");
      card.style.setProperty("--accent", metricStyles[metric.id][1]);
      const symbol = element("span", "metric-icon");
      symbol.innerHTML = icon(metricStyles[metric.id][0]);
      const value = element(
        "strong",
        Number.isFinite(metric.value) ? "" : "metric-placeholder",
        Number.isFinite(metric.value) ? format(metric.value, 1) : "--",
      );
      value.append(element("small", "", metric.units));
      card.append(
        symbol,
        element("span", "metric-label", metric.name),
        value,
        element("p", "", metric.note),
      );
      if (metric.trend) card.append(element("p", "", metric.trend));
      const valid = metric.observations.filter((item) =>
        Number.isFinite(item.value),
      );
      if (valid.length > 1) {
        const min = Math.min(...valid.map((item) => item.value)),
          max = Math.max(...valid.map((item) => item.value));
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        svg.setAttribute("viewBox", "0 0 60 25");
        svg.setAttribute("class", "sparkline");
        svg.setAttribute("aria-hidden", "true");
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        let connected = false;
        path.setAttribute(
          "d",
          metric.observations
            .map((item, i) => {
              if (!Number.isFinite(item.value)) {
                connected = false;
                return "";
              }
              const d =
                (connected ? "L" : "M") +
                ((i / (metric.observations.length - 1)) * 60).toFixed(1) +
                "," +
                (23 - ((item.value - min) / (max - min || 1)) * 21).toFixed(1);
              connected = true;
              return d;
            })
            .join(" "),
        );
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", metricStyles[metric.id][1]);
        path.setAttribute("stroke-width", "1.2");
        svg.append(path);
        card.append(svg);
      }
      return card;
    }),
  );
}
function renderInsights() {
  $("#insightGrid").replaceChildren(
    ...climateInsights(state.dataset).map((item) => {
      const card = element("article", "insight-card glass"),
        symbol = element("span", "metric-icon");
      symbol.innerHTML = icon(item.icon);
      card.append(
        symbol,
        element("span", "insight-kind", item.kind),
        element("h3", "", item.title),
        element("p", "", item.text),
      );
      return card;
    }),
  );
}
function applyChartFilter() {
  if (!state.dataset) return toast("Fetch a dataset before filtering.");
  const start = Number($("#filterStart").value),
    end = Number($("#filterEnd").value);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start > end ||
    start < state.dataset.startYear ||
    end > state.dataset.endYear
  ) {
    $("#filterError").hidden = false;
    setText(
      "#filterError",
      "Choose years within the loaded period: " +
        state.dataset.startYear +
        "-" +
        state.dataset.endYear +
        ".",
    );
    return;
  }
  $("#filterError").hidden = true;
  state.filterStart = start;
  state.filterEnd = end;
  renderInvestigation();
}
async function setExplorerMode(mode) {
  const globe = mode === "globe";
  $("#map").hidden = globe;
  $("#explorerGlobe").hidden = !globe;
  $("#mapStatus").style.display = globe ? "none" : "";
  [
    ["showMap", !globe],
    ["showGlobe", globe],
  ].forEach(([id, active]) => {
    $("#" + id).classList.toggle("selected", active);
    $("#" + id).setAttribute("aria-pressed", String(active));
  });
  setText(
    "#explorerHint",
    globe
      ? "Drag to orbit, scroll to zoom, click to select a point."
      : "Click the map to select a location. Fetch when you are ready.",
  );
  if (!globe) {
    requestAnimationFrame(() => map.invalidateSize());
    return;
  }
  if (!explorerGlobePromise)
    explorerGlobePromise = initOneGlobe(
      "explorerCanvas",
      "pauseExplorerGlobe",
      "resetExplorerGlobe",
      null,
      "explorerGlobeError",
    );
  const controller = await explorerGlobePromise;
  controller?.focus(state.location.lat, state.location.lng);
  controller?.resize();
}
async function initOneGlobe(
  canvasId,
  pauseId,
  resetId,
  loadingId,
  fallbackId,
  cinematic = false,
) {
  const { createEarthGlobe } = await import("./src/earthGlobe.js");
  const controller = await createEarthGlobe({
    canvas: $("#" + canvasId),
    location: state.location,
    onSelect: (coords) =>
      setLocation(
        {
          id: "custom",
          name: "Custom point",
          province: "Globe selection",
          ...coords,
          zoom: map?.getZoom() || 8,
        },
        !document.body.classList.contains("landing-mode"),
      ),
    pauseButton: $("#" + pauseId),
    resetButton: $("#" + resetId),
    loading: loadingId ? $("#" + loadingId) : null,
    fallback: $("#" + fallbackId),
    cinematic,
  });
  if (controller) {
    globes.push(controller);
    if (!cinematic) controller.focus(state.location.lat, state.location.lng);
  }
  return controller;
}

renderSidebar();
renderTopbar();
renderOverview();
renderEarthExplorer();
renderHistoricalClimate();
renderClimateAnalytics();
renderDataInsights();
renderDataExport();
renderAbout();
initNavigation();
const enterApplication = (target = "#investigate", smooth = true) => {
  document.body.classList.add("app-mode");
  document.body.classList.remove("landing-mode");
  document.body.classList.remove("app-menu-open");
  const menu = $("#mobileMenu");
  menu?.setAttribute("aria-expanded", "false");
  requestAnimationFrame(() => {
    if (location.hash !== target) history.replaceState(null, "", target);
    document.querySelector(target)?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
    map?.invalidateSize({ pan: false });
    globes[0]?.resize();
  });
};
document.querySelectorAll("[data-enter-app]").forEach((link) =>
  link.addEventListener("click", (event) => {
    event.preventDefault();
    enterApplication(link.getAttribute("href") || "#investigate");
  }),
);
document.querySelectorAll("[data-home]").forEach((link) =>
  link.addEventListener("click", (event) => {
    event.preventDefault();
    document.body.classList.remove("app-mode", "app-menu-open");
    document.body.classList.add("landing-mode");
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }),
);
if (
  location.hash &&
  !["#explore", "#home"].includes(location.hash) &&
  document.querySelector(location.hash)
)
  enterApplication(location.hash, false);
initSelectors();
initMap();
initComparison();
initControls();
charts = createAnalyticsCharts();
assistantChat = createAssistantChat();
renderClimateOverview();
syncStatus();
initOneGlobe(
  "earthCanvas",
  "pauseGlobe",
  "resetGlobe",
  "globeLoading",
  "globeFallback",
  true,
);
