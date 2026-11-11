/* ============================================================
   PantryWise — charts.js
   Renders Chart.js charts. Reads theme colours from CSS variables
   so charts adapt to light/dark mode.
   ============================================================ */
(function () {
  const charts = { _instances: {} };

  function themeColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  function destroy(id) {
    if (charts._instances[id]) { charts._instances[id].destroy(); delete charts._instances[id]; }
  }

  function baseOpts() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: themeColor("--text"), boxWidth: 14, padding: 14 } },
        tooltip: { backgroundColor: themeColor("--text") },
      },
    };
  }

  charts.render = function () {
    if (typeof Chart === "undefined") return; // offline / CDN blocked

    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    const text = themeColor("--text");
    const muted = themeColor("--muted");
    const border = themeColor("--border");
    const green = "#2f8f5b", red = "#d64545", orange = "#e8833a", blue = "#3a7bd5";
    const palette = [green, orange, blue, "#9b59b6", "#16a085", "#e84393", "#f39c12", "#34495e", "#1abc9c", "#7f8c8d"];

    /* --- use vs waste (doughnut) --- */
    const history = PW.store.getHistory();
    const consumed = history.filter((h) => h.reason === "consumed").length;
    const expired = history.filter((h) => h.reason === "expired").length;
    const removed = history.filter((h) => h.reason === "removed").length;
    destroy("chart-waste");
    charts._instances["chart-waste"] = new Chart(document.getElementById("chart-waste"), {
      type: "doughnut",
      data: {
        labels: ["Used", "Expired", "Removed"],
        datasets: [{ data: [consumed, expired, removed], backgroundColor: [green, red, blue], borderWidth: 0 }],
      },
      options: { ...baseOpts(), cutout: "62%" },
    });

    /* --- items by category (bar) --- */
    const items = PW.store.getItems();
    const catCounts = PW.CATEGORIES.map((c) => items.filter((i) => i.category === c.id).length);
    destroy("chart-categories");
    charts._instances["chart-categories"] = new Chart(document.getElementById("chart-categories"), {
      type: "bar",
      data: {
        labels: PW.CATEGORIES.map((c) => c.label),
        datasets: [{
          data: catCounts,
          backgroundColor: palette,
          borderRadius: 6,
          maxBarThickness: 26,
        }],
      },
      options: {
        ...baseOpts(),
        plugins: { ...baseOpts().plugins, legend: { display: false } },
        scales: {
          x: { ticks: { color: muted, autoSkip: false, maxRotation: 45, minRotation: 30 }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: muted, precision: 0 }, grid: { color: border } },
        },
      },
    });

    /* --- expiry timeline (next 7 days) --- */
    const labels = [];
    const counts = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date();
      day.setDate(day.getDate() + d);
      const tz = day.getTimezoneOffset() * 60000;
      const key = new Date(day - tz).toISOString().slice(0, 10);
      labels.push(day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }));
      counts.push(items.filter((i) => i.expiryDate === key).length);
    }
    destroy("chart-timeline");
    charts._instances["chart-timeline"] = new Chart(document.getElementById("chart-timeline"), {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: counts.map((_, i) => (i === 0 ? red : i < 3 ? orange : green)),
          borderRadius: 6,
          maxBarThickness: 32,
        }],
      },
      options: {
        ...baseOpts(),
        plugins: { ...baseOpts().plugins, legend: { display: false } },
        scales: {
          x: { ticks: { color: muted }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: muted, precision: 0 }, grid: { color: border } },
        },
      },
    });
  };

  PW.charts = charts;
})();
