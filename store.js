/* ============================================================
   PantryWise — store.js
   Single source of truth. Persists to localStorage and exposes
   a small CRUD + pub/sub API so the UI can re-render on change.
   ============================================================ */
(function () {
  const KEYS = {
    items: "pantrywise.items",
    history: "pantrywise.history",
    shopping: "pantrywise.shopping",
    settings: "pantrywise.settings",
  };

  const DEFAULT_SETTINGS = {
    theme: "light",
    expiringSoonDays: 3,
    lowStockThreshold: 1,
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("PantryWise: storage write failed", e); }
  }

  const store = {
    items: [],
    history: [],
    shopping: [],
    settings: { ...DEFAULT_SETTINGS },
    listeners: [],

    /* ----- lifecycle ----- */
    init() {
      this.items = read(KEYS.items, []);
      this.history = read(KEYS.history, []);
      this.shopping = read(KEYS.shopping, []);
      this.settings = { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
    },

    /* ----- pub/sub ----- */
    onChange(fn) { this.listeners.push(fn); },
    emit() { this.listeners.forEach((fn) => fn()); },
    save() {
      write(KEYS.items, this.items);
      write(KEYS.history, this.history);
      write(KEYS.shopping, this.shopping);
      write(KEYS.settings, this.settings);
      this.emit();
    },

    /* ----- items ----- */
    getItems() { return this.items.slice(); },
    getItem(id) { return this.items.find((i) => i.id === id); },

    addItem(data) {
      const item = {
        id: PW.uid(),
        name: data.name.trim(),
        category: data.category,
        quantity: Math.max(0, Number(data.quantity) || 0),
        unit: data.unit,
        location: data.location,
        purchaseDate: data.purchaseDate || null,
        expiryDate: data.expiryDate || null,
        addedAt: new Date().toISOString(),
      };
      this.items.push(item);
      this.save();
      return item;
    },

    updateItem(id, data) {
      const item = this.getItem(id);
      if (!item) return null;
      item.name = data.name.trim();
      item.category = data.category;
      item.quantity = Math.max(0, Number(data.quantity) || 0);
      item.unit = data.unit;
      item.location = data.location;
      item.purchaseDate = data.purchaseDate || null;
      item.expiryDate = data.expiryDate || null;
      item.updatedAt = new Date().toISOString();
      this.save();
      return item;
    },

    /* Remove an item from the pantry, logging why it left. */
    removeItem(id, reason) {
      const idx = this.items.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const item = this.items[idx];
      this.items.splice(idx, 1);
      this.addHistory(item, reason);
      this.save();
    },

    decrementItem(id, reason) {
      const item = this.getItem(id);
      if (!item) return;
      item.quantity = Math.max(0, Number((item.quantity - 1).toFixed(2)));
      if (item.quantity <= 0) {
        this.removeItem(id, reason);
      } else {
        item.updatedAt = new Date().toISOString();
        this.save();
      }
    },

    /* ----- history ----- */
    addHistory(item, reason) {
      this.history.push({
        id: PW.uid(),
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        reason, // "consumed" | "expired" | "removed"
        date: new Date().toISOString(),
      });
    },
    getHistory() { return this.history.slice().reverse(); },

    /* ----- shopping ----- */
    getShopping() { return this.shopping.slice(); },
    addShopping(data) {
      const entry = {
        id: PW.uid(),
        name: data.name.trim(),
        quantity: Math.max(1, Number(data.quantity) || 1),
        unit: data.unit || "",
        category: data.category || "other",
        done: false,
        addedAt: new Date().toISOString(),
      };
      this.shopping.push(entry);
      this.save();
      return entry;
    },
    toggleShopping(id) {
      const s = this.shopping.find((x) => x.id === id);
      if (s) { s.done = !s.done; this.save(); }
    },
    removeShopping(id) {
      this.shopping = this.shopping.filter((x) => x.id !== id);
      this.save();
    },
    clearDoneShopping() {
      this.shopping = this.shopping.filter((x) => !x.done);
      this.save();
    },

    /* ----- settings ----- */
    getSettings() { return { ...this.settings }; },
    updateSettings(patch) {
      this.settings = { ...this.settings, ...patch };
      this.save();
    },

    /* ----- bulk / destructive ----- */
    replaceItems(items) {
      this.items = items;
      this.save();
    },
    clearAll() {
      this.items = [];
      this.history = [];
      this.shopping = [];
      this.save();
    },
  };

  PW.store = store;
})();
