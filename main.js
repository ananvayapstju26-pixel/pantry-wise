/* ============================================================
   PantryWise — main.js
   Bootstraps the app, wires up all events, and re-renders views
   whenever the store changes.
   ============================================================ */
(function () {
  const app = {
    init() {
      PW.store.init();
      PW.ui.populateSelects();

      // theme from saved settings
      const theme = PW.store.getSettings().theme;
      PW.ui.applyTheme(theme);

      // re-render everything when data changes
      PW.store.onChange(() => app.refresh());

      this.wireEvents();
      app.refresh();
    },

    refresh() {
      PW.pantry.renderDashboard();
      PW.pantry.renderPantry();
      PW.shopping.render();
      PW.stats.render();
      if (document.getElementById("view-stats").classList.contains("is-active")) {
        PW.charts.render();
      }
    },

    switchView(view) {
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
      document.getElementById("view-" + view).classList.add("is-active");
      document.querySelectorAll(".nav__item").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.view === view);
      });
      if (view === "stats") PW.charts.render();
    },

    /* ----- sample data so the demo isn't empty ----- */
    makeSampleData() {
      const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); const tz = d.getTimezoneOffset() * 60000; return new Date(d - tz).toISOString().slice(0, 10); };
      const seed = [
        ["Spinach", "produce", "1", "bunch", "fridge", day(-2), day(-1)],
        ["Greek Yogurt", "dairy", "2", "pcs", "fridge", day(-3), day(0)],
        ["Salmon Fillet", "meat", "1", "pcs", "fridge", day(-1), day(1)],
        ["Bread Loaf", "bakery", "1", "pcs", "counter", day(-2), day(2)],
        ["Strawberries", "produce", "1", "box", "fridge", day(-1), day(3)],
        ["Milk", "dairy", "1", "l", "fridge", day(-2), day(5)],
        ["Pasta", "grains", "3", "pack", "pantry", day(-20), day(60)],
        ["Tomato Sauce", "canned", "4", "can", "pantry", day(-30), day(180)],
        ["Orange Juice", "beverages", "1", "bottle", "fridge", day(-5), day(10)],
        ["Mixed Nuts", "snacks", "1", "pack", "pantry", day(-10), day(90)],
        ["Frozen Peas", "frozen", "2", "pack", "freezer", day(-15), day(120)],
        ["Olive Oil", "condiments", "1", "bottle", "pantry", day(-40), null],
      ].map(([name, category, quantity, unit, location, purchaseDate, expiryDate]) => ({
        id: PW.uid(), name, category, quantity: Number(quantity), unit, location, purchaseDate, expiryDate, addedAt: new Date().toISOString(),
      }));
      PW.store.replaceItems(seed);

      // a little history so Stats has something to show
      PW.store.history = [
        { id: PW.uid(), name: "Bananas", category: "produce", quantity: 1, unit: "bunch", reason: "consumed", date: new Date(Date.now() - 3 * 86400000).toISOString() },
        { id: PW.uid(), name: "Old Bread", category: "bakery", quantity: 1, unit: "pcs", reason: "expired", date: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: PW.uid(), name: "Cheese", category: "dairy", quantity: 1, unit: "pcs", reason: "consumed", date: new Date(Date.now() - 6 * 86400000).toISOString() },
      ];

      PW.store.shopping = [
        { id: PW.uid(), name: "Eggs", quantity: 1, unit: "pcs", category: "dairy", done: false, addedAt: new Date().toISOString() },
        { id: PW.uid(), name: "Rice", quantity: 1, unit: "pack", category: "grains", done: false, addedAt: new Date().toISOString() },
      ];
      PW.store.save();
      PW.ui.toast("Sample data loaded", "success");
    },

    wireEvents() {
      /* ----- navigation ----- */
      document.getElementById("nav").addEventListener("click", (e) => {
        const btn = e.target.closest(".nav__item");
        if (btn) app.switchView(btn.dataset.view);
      });

      /* ----- theme toggle (header button + settings select) ----- */
      document.getElementById("theme-toggle").addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        PW.store.updateSettings({ theme: next });
        PW.ui.applyTheme(next);
      });
      document.getElementById("setting-theme").addEventListener("change", (e) => {
        PW.store.updateSettings({ theme: e.target.value });
        PW.ui.applyTheme(e.target.value);
      });

      /* ----- open add modal ----- */
      document.querySelectorAll("[data-open-add]").forEach((b) =>
        b.addEventListener("click", () => PW.ui.openAddModal()));

      /* ----- modal close (buttons + backdrop + escape) ----- */
      document.querySelectorAll("[data-close-modal]").forEach((el) =>
        el.addEventListener("click", () => PW.ui.closeModal()));
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") PW.ui.closeModal();
      });

      /* ----- item form submit ----- */
      document.getElementById("item-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const data = {
          name: document.getElementById("item-name").value,
          category: document.getElementById("item-category").value,
          quantity: document.getElementById("item-quantity").value,
          unit: document.getElementById("item-unit").value,
          location: document.getElementById("item-location").value,
          purchaseDate: document.getElementById("item-purchase").value,
          expiryDate: document.getElementById("item-expiry").value,
        };
        if (!data.name.trim()) { PW.ui.toast("Item name is required", "danger"); return; }
        const id = document.getElementById("item-id").value;
        if (id) PW.store.updateItem(id, data); else PW.store.addItem(data);
        PW.ui.closeModal();
        PW.ui.toast("Item saved", "success");
      });

      /* ----- delete from inside the modal ----- */
      document.getElementById("btn-delete-item").addEventListener("click", () => {
        const id = document.getElementById("item-id").value;
        if (!id) return;
        if (confirm("Delete this item? This cannot be undone.")) {
          const item = PW.store.getItem(id);
          const reason = item && PW.itemStatus(item, PW.store.getSettings().expiringSoonDays) === "expired" ? "expired" : "removed";
          PW.store.removeItem(id, reason);
          PW.ui.closeModal();
          PW.ui.toast("Item deleted", "success");
        }
      });

      /* ----- delegated clicks (pantry + shopping lists) ----- */
      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const { action, id } = btn.dataset;
        switch (action) {
          case "use-one":
            PW.store.decrementItem(id, "consumed");
            PW.ui.toast("Marked as used", "success");
            break;
          case "edit":
            PW.ui.openEditModal(id);
            break;
          case "remove": {
            const item = PW.store.getItem(id);
            if (!item) return;
            if (confirm(`Remove "${item.name}"?`)) {
              const reason = PW.itemStatus(item, PW.store.getSettings().expiringSoonDays) === "expired" ? "expired" : "removed";
              PW.store.removeItem(id, reason);
              PW.ui.toast("Item removed", "success");
            }
            break;
          }
          case "toggle-shop":
            PW.store.toggleShopping(id);
            break;
          case "remove-shop":
            PW.store.removeShopping(id);
            break;
        }
      });

      /* ----- pantry filters ----- */
      document.getElementById("pantry-search").addEventListener("input", (e) => {
        PW.pantry.setFilter("search", e.target.value);
        PW.pantry.renderPantry();
      });
      document.getElementById("filter-category").addEventListener("change", (e) => {
        PW.pantry.setFilter("category", e.target.value);
        PW.pantry.renderPantry();
      });
      document.getElementById("filter-location").addEventListener("change", (e) => {
        PW.pantry.setFilter("location", e.target.value);
        PW.pantry.renderPantry();
      });
      document.getElementById("sort-by").addEventListener("change", (e) => {
        PW.pantry.setFilter("sort", e.target.value);
        PW.pantry.renderPantry();
      });

      /* ----- shopping form ----- */
      document.getElementById("shopping-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("shopping-name").value;
        if (!name.trim()) return;
        PW.store.addShopping({
          name,
          quantity: document.getElementById("shopping-qty").value,
          unit: document.getElementById("shopping-unit").value,
          category: document.getElementById("shopping-category").value,
        });
        document.getElementById("shopping-name").value = "";
        document.getElementById("shopping-qty").value = "1";
        PW.ui.toast("Added to list", "success");
      });
      document.getElementById("btn-autofill").addEventListener("click", () => PW.shopping.autofill());
      document.getElementById("btn-clear-done").addEventListener("click", () => {
        PW.store.clearDoneShopping();
        PW.ui.toast("Cleared checked items");
      });

      /* ----- settings: data actions ----- */
      document.getElementById("btn-sample").addEventListener("click", () => {
        if (PW.store.getItems().length && !confirm("Replace current items with sample data?")) return;
        app.makeSampleData();
      });
      document.getElementById("btn-export").addEventListener("click", () => PW.ui.exportCSV());
      document.getElementById("btn-import").addEventListener("click", () => document.getElementById("file-import").click());
      document.getElementById("file-import").addEventListener("change", (e) => {
        if (e.target.files[0]) PW.ui.importCSV(e.target.files[0]);
        e.target.value = "";
      });
      document.getElementById("btn-clear").addEventListener("click", () => {
        if (confirm("Erase ALL pantry, history and shopping data? This cannot be undone.")) {
          PW.store.clearAll();
          PW.ui.toast("All data cleared", "success");
        }
      });
    },
  };

  // boot once the DOM is ready
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => app.init());
  else app.init();

  PW.app = app;
})();
