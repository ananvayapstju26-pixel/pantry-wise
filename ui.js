/* ============================================================
   PantryWise — ui.js
   DOM helpers: dropdown population, toasts, the add/edit modal,
   theme application, and CSV import/export.
   ============================================================ */
(function () {
  let toastTimer = null;

  const ui = {
    /* ----- populate all <select> dropdowns from constants ----- */
    populateSelects() {
      const catOpts = PW.CATEGORIES.map((c) => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join("");
      const locOpts = PW.LOCATIONS.map((l) => `<option value="${l.id}">${l.icon} ${l.label}</option>`).join("");
      const unitOpts = PW.UNITS.map((u) => `<option value="${u}">${u}</option>`).join("");

      setHTML("#filter-category", `<option value="all">All categories</option>${catOpts}`);
      setHTML("#filter-location", `<option value="all">All locations</option>${locOpts}`);
      setHTML("#item-category", catOpts);
      setHTML("#item-location", locOpts);
      setHTML("#item-unit", unitOpts);
      setHTML("#shopping-category", catOpts);
      setHTML("#shopping-unit", `<option value="">—</option>${unitOpts}`);
    },

    /* ----- toast ----- */
    toast(msg, type = "") {
      const el = document.getElementById("toast");
      el.textContent = msg;
      el.className = "toast" + (type ? ` toast--${type}` : "");
      el.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
    },

    /* ----- theme ----- */
    applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      const btn = document.getElementById("theme-toggle");
      if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
      const sel = document.getElementById("setting-theme");
      if (sel) sel.value = theme;
      // charts read CSS vars, so refresh them when the palette changes
      if (typeof PW.charts !== "undefined" && document.getElementById("view-stats").classList.contains("is-active")) {
        PW.charts.render();
      }
    },

    /* ----- add / edit modal ----- */
    openAddModal() {
      document.getElementById("modal-title").textContent = "Add item";
      document.getElementById("btn-delete-item").hidden = true;
      const form = document.getElementById("item-form");
      form.reset();
      document.getElementById("item-id").value = "";
      document.getElementById("item-unit").value = "pcs";
      document.getElementById("item-purchase").value = PW.todayStr();
      showModal();
    },

    openEditModal(id) {
      const item = PW.store.getItem(id);
      if (!item) return;
      document.getElementById("modal-title").textContent = "Edit item";
      document.getElementById("btn-delete-item").hidden = false;
      document.getElementById("item-id").value = item.id;
      document.getElementById("item-name").value = item.name;
      document.getElementById("item-quantity").value = item.quantity;
      document.getElementById("item-unit").value = item.unit;
      document.getElementById("item-category").value = item.category;
      document.getElementById("item-location").value = item.location;
      document.getElementById("item-purchase").value = item.purchaseDate || "";
      document.getElementById("item-expiry").value = item.expiryDate || "";
      showModal();
    },

    closeModal() {
      document.getElementById("item-modal").hidden = true;
    },

    /* ----- CSV export ----- */
    exportCSV() {
      const items = PW.store.getItems();
      const header = ["name", "category", "quantity", "unit", "location", "purchaseDate", "expiryDate"];
      const rows = [header, ...items.map((i) => [i.name, i.category, i.quantity, i.unit, i.location, i.purchaseDate || "", i.expiryDate || ""])];
      const csv = PW.toCSV(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      download(blob, `pantrywise-${PW.todayStr()}.csv`);
      PW.ui.toast(`Exported ${items.length} items`, "success");
    },

    /* ----- CSV import (appends to pantry) ----- */
    importCSV(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rows = PW.parseCSV(e.target.result);
          if (rows.length < 2) { PW.ui.toast("CSV looks empty or invalid", "danger"); return; }
          const header = rows[0].map((h) => h.trim().toLowerCase());
          const idx = (name) => header.indexOf(name);
          const nameI = idx("name");
          if (nameI === -1) { PW.ui.toast("CSV must have a 'name' column", "danger"); return; }
          const qI = idx("quantity"), uI = idx("unit"), cI = idx("category"),
            lI = idx("location"), pI = idx("purchasedate"), eI = idx("expirydate");

          const validCats = new Set(PW.CATEGORIES.map((c) => c.id));
          const validLocs = new Set(PW.LOCATIONS.map((l) => l.id));
          const parsed = [];
          for (let r = 1; r < rows.length; r++) {
            const name = (rows[r][nameI] || "").trim();
            if (!name) continue;
            let cat = cI >= 0 ? (rows[r][cI] || "").trim() : "other";
            let loc = lI >= 0 ? (rows[r][lI] || "").trim() : "pantry";
            if (!validCats.has(cat)) cat = "other";
            if (!validLocs.has(loc)) loc = "pantry";
            parsed.push({
              name,
              category: cat,
              quantity: Math.max(0, Number(qI >= 0 ? rows[r][qI] : 1) || 1),
              unit: uI >= 0 ? (rows[r][uI] || "").trim() : "",
              location: loc,
              purchaseDate: pI >= 0 ? (rows[r][pI] || "").trim() : null,
              expiryDate: eI >= 0 ? (rows[r][eI] || "").trim() : null,
              addedAt: new Date().toISOString(),
              id: PW.uid(),
            });
          }
          PW.store.replaceItems([...PW.store.getItems(), ...parsed]);
          PW.ui.toast(`Imported ${parsed.length} items`, "success");
        } catch (err) {
          console.error(err);
          PW.ui.toast("Could not read that CSV file", "danger");
        }
      };
      reader.readAsText(file);
    },
  };

  /* ----- private DOM helpers ----- */
  function setHTML(sel, html) {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = html;
  }
  function showModal() {
    const modal = document.getElementById("item-modal");
    modal.hidden = false;
    setTimeout(() => document.getElementById("item-name").focus(), 30);
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  PW.ui = ui;
})();
