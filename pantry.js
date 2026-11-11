/* ============================================================
   PantryWise — pantry.js
   Renders the dashboard overview + the filterable pantry grid.
   ============================================================ */
(function () {
  const filters = { search: "", category: "all", location: "all", sort: "expiry-asc" };

  const pantry = {
    filters,
    setFilter(key, value) { filters[key] = value; },

    /* ---------- Dashboard ---------- */
    renderDashboard() {
      const items = PW.store.getItems();
      const s = PW.store.getSettings();
      const statusOf = (i) => PW.itemStatus(i, s.expiringSoonDays);

      const expiring = items.filter((i) => statusOf(i) === "expired" || statusOf(i) === "expiring")
        .sort((a, b) => (PW.daysUntil(a.expiryDate) ?? Infinity) - (PW.daysUntil(b.expiryDate) ?? Infinity));

      const expired = expiring.filter((i) => statusOf(i) === "expired");
      const expiringSoon = expiring.filter((i) => statusOf(i) === "expiring");
      const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= s.lowStockThreshold);

      document.getElementById("stat-total").textContent = items.length;
      document.getElementById("stat-expiring").textContent = expiringSoon.length;
      document.getElementById("stat-expired").textContent = expired.length;
      document.getElementById("stat-lowstock").textContent = lowStock.length;

      renderMiniList("expiring-soon-list", expiringSoon, "🎉 Nothing expiring soon");
      renderMiniList("expired-list", expired, "✨ No expired items — nice!");
    },

    /* ---------- Pantry grid ---------- */
    renderPantry() {
      const s = PW.store.getSettings();
      let items = PW.store.getItems();

      if (filters.search) {
        const q = filters.search.toLowerCase();
        items = items.filter((i) => i.name.toLowerCase().includes(q));
      }
      if (filters.category !== "all") items = items.filter((i) => i.category === filters.category);
      if (filters.location !== "all") items = items.filter((i) => i.location === filters.location);

      items.sort((a, b) => {
        switch (filters.sort) {
          case "expiry-desc": return (PW.daysUntil(b.expiryDate) ?? -Infinity) - (PW.daysUntil(a.expiryDate) ?? -Infinity);
          case "name-asc": return a.name.localeCompare(b.name);
          case "added-desc": return (b.addedAt || "").localeCompare(a.addedAt || "");
          default: return (PW.daysUntil(a.expiryDate) ?? Infinity) - (PW.daysUntil(b.expiryDate) ?? Infinity);
        }
      });

      const grid = document.getElementById("pantry-list");
      const empty = document.getElementById("pantry-empty");
      grid.innerHTML = "";
      if (!items.length) { empty.hidden = false; return; }
      empty.hidden = true;
      grid.innerHTML = items.map((i) => itemCardHTML(i, s)).join("");
    },
  };

  /* ---------- helpers ---------- */
  function renderMiniList(elId, items, emptyMsg) {
    const el = document.getElementById(elId);
    if (!items.length) { el.innerHTML = `<p class="empty">${emptyMsg}</p>`; return; }
    el.innerHTML = items.slice(0, 6).map(miniItemHTML).join("");
  }

  function miniItemHTML(item) {
    const s = PW.store.getSettings();
    const status = PW.itemStatus(item, s.expiringSoonDays);
    const cat = PW.catById(item.category);
    const badge = PW.statusBadge(status);
    const loc = PW.locById(item.location);
    return `
      <div class="mini-item">
        <span class="mini-item__icon">${cat.icon}</span>
        <div>
          <button class="mini-item__name link" data-action="edit" data-id="${item.id}">${PW.esc(item.name)}</button>
          <p class="mini-item__meta">${PW.formatQty(item.quantity, item.unit)} · ${loc.label} · ${PW.relativeExpiry(item.expiryDate)}</p>
        </div>
        <span class="mini-item__badge badge ${badge.cls}">${badge.label}</span>
        <button class="icon-btn mini-item__remove" data-action="remove" data-id="${item.id}" title="Remove">✕</button>
      </div>`;
  }

  function itemCardHTML(item, s) {
    const status = PW.itemStatus(item, s.expiringSoonDays);
    const cat = PW.catById(item.category);
    const loc = PW.locById(item.location);
    const badge = PW.statusBadge(status);
    const cls = status === "expired" ? "item-card--expired" : status === "expiring" ? "item-card--expiring" : "";
    return `
      <div class="item-card ${cls}">
        <div class="item-card__top">
          <span class="item-card__icon">${cat.icon}</span>
          <div>
            <div class="item-card__name">${PW.esc(item.name)}</div>
            <div class="item-card__cat">${cat.label}</div>
          </div>
          <span class="item-card__badge badge ${badge.cls}">${badge.label}</span>
        </div>
        <div class="item-card__meta">
          <div class="item-card__row"><span>Quantity</span><span>${PW.formatQty(item.quantity, item.unit)}</span></div>
          <div class="item-card__row"><span>Location</span><span>${loc.icon} ${loc.label}</span></div>
          <div class="item-card__row"><span>Expiry</span><span>${PW.relativeExpiry(item.expiryDate)}</span></div>
        </div>
        <div class="item-card__actions">
          <button class="btn" data-action="use-one" data-id="${item.id}">Use one</button>
          <button class="btn" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="btn" data-action="remove" data-id="${item.id}">Remove</button>
        </div>
      </div>`;
  }

  PW.pantry = pantry;
})();
