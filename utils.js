/* ============================================================
   PantryWise — utils.js
   Global namespace, constants, formatting + helper functions.
   ============================================================ */
window.PW = window.PW || {};

PW.CATEGORIES = [
  { id: "produce",   label: "Produce",      icon: "🥬" },
  { id: "dairy",     label: "Dairy & Eggs", icon: "🥛" },
  { id: "meat",      label: "Meat & Fish",  icon: "🍖" },
  { id: "grains",    label: "Grains & Pasta", icon: "🌾" },
  { id: "bakery",    label: "Bakery",       icon: "🍞" },
  { id: "beverages", label: "Beverages",    icon: "🥤" },
  { id: "snacks",    label: "Snacks",       icon: "🍿" },
  { id: "frozen",    label: "Frozen",      icon: "🧊" },
  { id: "condiments",label: "Condiments",   icon: "🫙" },
  { id: "canned",    label: "Canned",       icon: "🥫" },
  { id: "other",     label: "Other",        icon: "📦" },
];

PW.LOCATIONS = [
  { id: "fridge",  label: "Fridge",  icon: "🧊" },
  { id: "freezer", label: "Freezer", icon: "❄️" },
  { id: "pantry",  label: "Pantry",  icon: "🚪" },
  { id: "counter", label: "Counter", icon: "🧺" },
];

PW.UNITS = ["pcs", "g", "kg", "ml", "l", "pack", "box", "bunch", "can", "bottle"];

PW.catById = (id) => PW.CATEGORIES.find((c) => c.id === id) || PW.CATEGORIES[PW.CATEGORIES.length - 1];
PW.locById = (id) => PW.LOCATIONS.find((l) => l.id === id) || PW.LOCATIONS[2];

/* ----- IDs ----- */
PW.uid = function () {
  return "i_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
};

/* ----- Date helpers (operate on YYYY-MM-DD strings) ----- */
PW.todayStr = function () {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
};

/* Whole-day difference: expiry - today (negative if expired). */
PW.daysUntil = function (dateStr) {
  if (!dateStr) return null;
  const today = new Date(PW.todayStr() + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target - today) / 86400000);
};

PW.formatDate = function (dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

/* Relative "in 3 days", "2 days ago", "today" */
PW.relativeExpiry = function (dateStr) {
  const d = PW.daysUntil(dateStr);
  if (d === null) return "no expiry";
  if (d === 0) return "expires today";
  if (d === 1) return "expires tomorrow";
  if (d === -1) return "expired yesterday";
  if (d > 0) return `in ${d} days`;
  return `expired ${Math.abs(d)} days ago`;
};

/* ----- Number / quantity formatting ----- */
PW.formatQty = function (qty, unit) {
  const n = Number(qty) || 0;
  const rounded = Number.isInteger(n) ? n : Math.round(n * 100) / 100;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
};

/* ----- Status of an item based on expiry date ----- */
PW.itemStatus = function (item, expiringSoonDays) {
  const d = PW.daysUntil(item.expiryDate);
  if (d === null) return "fresh";
  if (d < 0) return "expired";
  if (d <= (expiringSoonDays ?? 3)) return "expiring";
  return "fresh";
};

PW.statusBadge = function (status) {
  switch (status) {
    case "expired":  return { cls: "badge--danger", label: "Expired" };
    case "expiring": return { cls: "badge--warn", label: "Expiring" };
    default:         return { cls: "badge--ok", label: "Fresh" };
  }
};

/* ----- Tiny HTML escaper (data is user-generated) ----- */
PW.esc = function (str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

/* ----- CSV helpers ----- */
PW.toCSV = function (rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
};

PW.parseCSV = function (text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  // remove fully empty trailing rows
  return rows.filter((r) => r.some((c) => c !== ""));
};
