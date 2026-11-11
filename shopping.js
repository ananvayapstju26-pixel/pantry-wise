/* ============================================================
   PantryWise — shopping.js
   Renders the shopping list and provides an "auto-fill" that
   pulls in items which are running low.
   ============================================================ */
(function () {
  const shopping = {
    render() {
      const list = PW.store.getShopping();
      const ul = document.getElementById("shopping-list");
      const empty = document.getElementById("shopping-empty");
      ul.innerHTML = "";
      if (!list.length) { empty.hidden = false; return; }
      empty.hidden = true;
      ul.innerHTML = list.map(itemHTML).join("");
    },

    /* Add everything currently at/below the low-stock threshold that
       isn't already on the shopping list. */
    autofill() {
      const s = PW.store.getSettings();
      const already = new Set(PW.store.getShopping().map((x) => x.name.toLowerCase()));
      const low = PW.store.getItems().filter(
        (i) => i.quantity > 0 && i.quantity <= s.lowStockThreshold && !already.has(i.name.toLowerCase())
      );
      if (!low.length) { PW.ui.toast("Nothing low to add — pantry looks stocked!"); return; }
      low.forEach((i) => PW.store.addShopping({
        name: i.name,
        quantity: 1,
        unit: i.unit || "",
        category: i.category,
      }));
      PW.ui.toast(`Added ${low.length} low-stock item${low.length > 1 ? "s" : ""} to your list`, "success");
    },
  };

  function itemHTML(item) {
    const cat = PW.catById(item.category);
    return `
      <li class="shopping-item ${item.done ? "done" : ""}">
        <input type="checkbox" class="shopping-item__checkbox" data-action="toggle-shop" data-id="${item.id}" ${item.done ? "checked" : ""} />
        <div>
          <div class="shopping-item__name">${cat.icon} ${PW.esc(item.name)}</div>
          <div class="shopping-item__meta">${cat.label} · ${PW.formatQty(item.quantity, item.unit)}</div>
        </div>
        <button class="shopping-item__remove" data-action="remove-shop" data-id="${item.id}" title="Delete">✕</button>
      </li>`;
  }

  PW.shopping = shopping;
})();
