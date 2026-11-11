/* ============================================================
   PantryWise — stats.js
   Computes usage / waste figures and renders the activity feed.
   (Charts themselves are drawn by charts.js.)
   ============================================================ */
(function () {
  const stats = {
    render() {
      const history = PW.store.getHistory();
      const used = history.filter((h) => h.reason === "consumed").length;
      const wasted = history.filter((h) => h.reason === "expired").length;
      const rate = used + wasted ? Math.round((wasted / (used + wasted)) * 100) : 0;

      document.getElementById("stat-used").textContent = used;
      document.getElementById("stat-wasted").textContent = wasted;
      document.getElementById("stat-waste-rate").textContent = rate + "%";
      document.getElementById("stat-tracked").textContent = history.length;

      renderActivity("recent-activity", history.slice(0, 10));
    },
  };

  function renderActivity(elId, entries) {
    const el = document.getElementById(elId);
    if (!entries.length) { el.innerHTML = `<p class="empty">No activity yet.</p>`; return; }
    el.innerHTML = entries.map(entryHTML).join("");
  }

  function entryHTML(h) {
    const cat = PW.catById(h.category);
    const meta = {
      consumed: { icon: "✅", text: "used" },
      expired: { icon: "🗑️", text: "expired" },
      removed: { icon: "📤", text: "removed" },
    }[h.reason] || { icon: "•", text: h.reason };
    const when = new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `
      <div class="activity-item">
        <span class="activity-item__icon">${meta.icon}</span>
        <div style="flex:1">
          <span class="activity-item__name">${cat.icon} ${PW.esc(h.name)}</span>
          <span class="muted"> — ${meta.text}</span>
        </div>
        <span class="activity-item__time">${when}</span>
      </div>`;
  }

  PW.stats = stats;
})();
