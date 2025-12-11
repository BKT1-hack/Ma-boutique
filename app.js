// Utilitaires
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

const currencySymbols = { XOF: "XOF", EUR: "€", USD: "$" };

// État initial
const state = {
  products: store.get("products", [
    { id: uid(), name: "Casque Bluetooth", category: "Électronique", price: 25000, stock: 12,
      image: "https://images.unsplash.com/photo-1518443895914-4f6e3d4f4f63?q=80&w=800&auto=format&fit=crop",
      desc: "Casque sans fil avec réduction de bruit, 20h d'autonomie." },
    { id: uid(), name: "Sac en cuir", category: "Mode", price: 18000, stock: 3,
      image: "https://images.unsplash.com/photo-1584916205388-3f5f6b3fb026?q=80&w=800&auto=format&fit=crop",
      desc: "Sac à main élégant, doublure premium." },
    { id: uid(), name: "Lampe LED", category: "Maison", price: 7000, stock: 0,
      image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=800&auto=format&fit=crop",
      desc: "Lampe LED basse consommation, lumière chaude." },
    { id: uid(), name: "Sneakers", category: "Mode", price: 30000, stock: 24,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
      desc: "Chaussures confortables pour le quotidien." }
  ]),
  customers: store.get("customers", [
    { id: uid(), name: "Awa Diop", phone: "+221 77 000 00 00", email: "awa@example.com", address: "Thiès" },
    { id: uid(), name: "Moussa Fall", phone: "+221 76 111 11 11", email: "moussa@example.com", address: "Dakar" }
  ]),
  orders: store.get("orders", []),
  cart: store.get("cart", []),
  settings: store.get("settings", { currency: "XOF", taxRate: 18, shopName: "Boutique Baoro" }),
  filters: { category: "", stock: "", status: "" },
  search: ""
};

// Helpers
function uid() { return Math.random().toString(36).slice(2, 10); }
function formatCurrency(amount) {
  const cur = state.settings.currency;
  const symbol = currencySymbols[cur] || cur;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: cur, currencyDisplay: "code" }).format(amount).replace(cur, symbol);
}
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}
function openModal(id) { $(id).classList.add("open"); }
function closeModal(id) { $(id).classList.remove("open"); }
function openDrawer(id) { $(id).classList.add("open"); }
function closeDrawer(id) { $(id).classList.remove("open"); }

function saveAll() {
  store.set("products", state.products);
  store.set("customers", state.customers);
  store.set("orders", state.orders);
  store.set("cart", state.cart);
  store.set("settings", state.settings);
}

// Navigation
$$(".menu-item").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".menu-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    $$(".view").forEach(v => v.classList.remove("active"));
    $(`#view-${view}`).classList.add("active");
    if (view === "products") renderProducts();
    if (view === "orders") renderOrders();
    if (view === "customers") renderCustomers();
    if (view === "dashboard") renderDashboard();
  });
});

// Thème
$("#toggleTheme").addEventListener("click", () => {
  const html = document.documentElement;
  const newTheme = html.getAttribute("data-theme") === "light" ? "dark" : "light";
  html.setAttribute("data-theme", newTheme);
});

// Recherche globale
$("#globalSearch").addEventListener("input", (e) => {
  state.search = e.target.value.trim().toLowerCase();
  renderProducts();
  renderOrders();
  renderCustomers();
});
$("#clearSearch").addEventListener("click", () => {
  $("#globalSearch").value = "";
  state.search = "";
  renderProducts();
  renderOrders();
  renderCustomers();
});

// Filtres
$("#categoryFilter").addEventListener("change", (e) => {
  state.filters.category = e.target.value;
  renderProducts();
});
$("#stockFilter").addEventListener("change", (e) => {
  state.filters.stock = e.target.value;
  renderProducts();
});
$("#orderStatusFilter").addEventListener("change", (e) => {
  state.filters.status = e.target.value;
  renderOrders();
});

// Modales produit
$("#addProductBtn").addEventListener("click", () => {
  $("#productModalTitle").textContent = "Ajouter un produit";
  $("#prodName").value = "";
  $("#prodCategory").value = "";
  $("#prodPrice").value = "";
  $("#prodStock").value = "";
  $("#prodImage").value = "";
  $("#prodDesc").value = "";
  $("#saveProductBtn").dataset.id = "";
  openModal("#productModal");
});
$("#closeProductModal").addEventListener("click", () => closeModal("#productModal"));

$("#saveProductBtn").addEventListener("click", () => {
  const id = $("#saveProductBtn").dataset.id || uid();
  const product = {
    id,
    name: $("#prodName").value.trim(),
    category: $("#prodCategory").value.trim(),
    price: Number($("#prodPrice").value) || 0,
    stock: Number($("#prodStock").value) || 0,
    image: $("#prodImage").value.trim(),
    desc: $("#prodDesc").value.trim()
  };
  if (!product.name) return showToast("Le nom du produit est requis.");
  const existingIndex = state.products.findIndex(p => p.id === id);
  if (existingIndex >= 0) state.products[existingIndex] = product;
  else state.products.push(product);
  saveAll();
  closeModal("#productModal");
  showToast("Produit enregistré.");
  renderProducts(); renderDashboard(); fillCategoryFilters();
});

// Modale client
$("#addCustomerBtn").addEventListener("click", () => {
  $("#customerModalTitle").textContent = "Ajouter un client";
  $("#custName").value = "";
  $("#custPhone").value = "";
  $("#custEmail").value = "";
  $("#custAddress").value = "";
  $("#saveCustomerBtn").dataset.id = "";
  openModal("#customerModal");
});
$("#closeCustomerModal").addEventListener("click", () => closeModal("#customerModal"));

$("#saveCustomerBtn").addEventListener("click", () => {
  const id = $("#saveCustomerBtn").dataset.id || uid();
  const customer = {
    id,
    name: $("#custName").value.trim(),
    phone: $("#custPhone").value.trim(),
    email: $("#custEmail").value.trim(),
    address: $("#custAddress").value.trim()
  };
  if (!customer.name) return showToast("Le nom du client est requis.");
  const i = state.customers.findIndex(c => c.id === id);
  if (i >= 0) state.customers[i] = customer;
  else state.customers.push(customer);
  saveAll();
  closeModal("#customerModal");
  showToast("Client enregistré.");
  renderCustomers();
});

// Panier
$("#openCart").addEventListener("click", () => openDrawer("#cartDrawer"));
$("#closeCart").addEventListener("click", () => closeDrawer("#cartDrawer"));
$("#checkoutBtn").addEventListener("click", () => {
  if (!state.cart.length) return showToast("Panier vide.");
  const total = calcCartTotal();
  const order = {
    id: uid(),
    customerName: "Client Comptoir",
    items: JSON.parse(JSON.stringify(state.cart)),
    total,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  state.orders.push(order);
  state.cart = [];
  saveAll();
  renderCart();
  renderOrders();
  renderDashboard();
  showToast("Commande créée.");
});

// Rendu Produits
function renderProducts() {
  const grid = $("#productGrid");
  if (!grid) return;

  let products = [...state.products];
  // recherche
  if (state.search) {
    products = products.filter(p =>
      [p.name, p.category, p.desc].join(" ").toLowerCase().includes(state.search)
    );
  }
  // filtre catégorie
  if (state.filters.category) {
    products = products.filter(p => p.category === state.filters.category);
  }
  // filtre stock
  if (state.filters.stock === "in") products = products.filter(p => p.stock > 0);
  if (state.filters.stock === "low") products = products.filter(p => p.stock > 0 && p.stock <= 5);
  if (state.filters.stock === "out") products = products.filter(p => p.stock === 0);

  grid.innerHTML = products.map(p => productCardHTML(p)).join("");

  // boutons actions
  products.forEach(p => {
    const addBtn = document.getElementById(`add-${p.id}`);
    const editBtn = document.getElementById(`edit-${p.id}`);
    const delBtn = document.getElementById(`del-${p.id}`);

    addBtn?.addEventListener("click", () => addToCart(p.id));
    editBtn?.addEventListener("click", () => editProduct(p.id));
    delBtn?.addEventListener("click", () => deleteProduct(p.id));
  });

  // featured sur dashboard
  renderFeatured(products.slice(0, 8));

  // compteur panier
  $("#cartCount").textContent = String(state.cart.reduce((a, c) => a + c.qty, 0));
}

function renderFeatured(list) {
  const el = $("#featuredProducts");
  if (!el) return;
  el.innerHTML = list.map(productCardHTML).join("");
  list.forEach(p => {
    document.getElementById(`add-${p.id}`)?.addEventListener("click", () => addToCart(p.id));
    document.getElementById(`edit-${p.id}`)?.addEventListener("click", () => editProduct(p.id));
    document.getElementById(`del-${p.id}`)?.addEventListener("click", () => deleteProduct(p.id));
  });
}

function productCardHTML(p) {
  const badge = p.stock === 0 ? "Rupture" : (p.stock <= 5 ? "Stock bas" : "En stock");
  return `
  <div class="product-card">
    <div class="product-cover">
      ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : ""}
      <div class="product-badge">${badge}</div>
    </div>
    <div class="product-content">
      <div class="product-title">${p.name}</div>
      <div class="product-desc">${p.desc || ""}</div>
      <div class="product-meta">
        <div class="price">${formatCurrency(p.price)}</div>
        <div class="stock">Stock: ${p.stock}</div>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn-primary btn" id="add-${p.id}">Ajouter 🛒</button>
      <button class="btn-secondary btn" id="edit-${p.id}">Modifier</button>
      <button class="btn-danger btn" id="del-${p.id}">Supprimer</button>
    </div>
  </div>`;
}

function editProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  $("#productModalTitle").textContent = "Modifier le produit";
  $("#prodName").value = p.name;
  $("#prodCategory").value = p.category;
  $("#prodPrice").value = p.price;
  $("#prodStock").value = p.stock;
  $("#prodImage").value = p.image || "";
  $("#prodDesc").value = p.desc || "";
  $("#saveProductBtn").dataset.id = p.id;
  openModal("#productModal");
}

function deleteProduct(id) {
  if (!confirm("Supprimer ce produit ?")) return;
  state.products = state.products.filter(p => p.id !== id);
  saveAll();
  renderProducts(); renderDashboard(); fillCategoryFilters();
  showToast("Produit supprimé.");
}

// Panier rendu
function renderCart() {
  const list = $("#cartItems");
  const items = state.cart;
  list.innerHTML = items.map(item => `
    <div class="cart-item">
      <img src="${item.image || "https://picsum.photos/80?blur=3"}" alt="${item.name}" />
      <div>
        <div><strong>${item.name}</strong></div>
        <div class="muted">${formatCurrency(item.price)} x ${item.qty}</div>
      </div>
      <div class="qty">
        <button class="qty-btn" id="minus-${item.id}">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" id="plus-${item.id}">+</button>
        <button class="icon-btn" id="rm-${item.id}">✖</button>
      </div>
    </div>
  `).join("");

  items.forEach(item => {
    $(`#minus-${item.id}`)?.addEventListener("click", () => updateQty(item.id, item.qty - 1));
    $(`#plus-${item.id}`)?.addEventListener("click", () => updateQty(item.id, item.qty + 1));
    $(`#rm-${item.id}`)?.addEventListener("click", () => removeFromCart(item.id));
  });

  const totals = calcCartTotal();
  $("#cartSubtotal").textContent = formatCurrency(totals.subtotal);
  $("#cartTax").textContent = formatCurrency(totals.tax);
  $("#cartTotal").textContent = formatCurrency(totals.total);
  $("#cartCount").textContent = String(state.cart.reduce((a, c) => a + c.qty, 0));
  saveAll();
}

function addToCart(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  const existing = state.cart.find(i => i.id === id);
  if (p.stock <= 0) return showToast("Stock insuffisant.");
  if (existing) {
    if (existing.qty + 1 > p.stock) return showToast("Stock insuffisant.");
    existing.qty += 1;
  } else {
    state.cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 });
  }
  renderCart();
  openDrawer("#cartDrawer");
}

function updateQty(id, qty) {
  const p = state.products.find(x => x.id === id);
  const item = state.cart.find(i => i.id === id);
  if (!item || !p) return;
  if (qty <= 0) return removeFromCart(id);
  if (qty > p.stock) return showToast("Stock insuffisant.");
  item.qty = qty;
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  renderCart();
}

function calcCartTotal() {
  const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = Math.round(subtotal * (state.settings.taxRate / 100));
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

// Commandes
function renderOrders() {
  const tbody = $("#ordersTable");
  let orders = [...state.orders];
  if (state.search) {
    orders = orders.filter(o => (o.customerName || "").toLowerCase().includes(state.search));
  }
  if (state.filters.status) {
    orders = orders.filter(o => o.status === state.filters.status);
  }
  tbody.innerHTML = orders.map((o, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${o.customerName}</td>
      <td>${formatCurrency(o.total.total)}</td>
      <td>
        <select id="status-${o.id}" class="select small">
          ${["pending","paid","shipped","cancelled"].map(s => `<option value="${s}" ${s===o.status?"selected":""}>${labelStatus(s)}</option>`).join("")}
        </select>
      </td>
      <td>${new Date(o.createdAt).toLocaleString("fr-FR")}</td>
      <td><button class="btn-secondary" id="details-${o.id}">Détails</button></td>
    </tr>
  `).join("");

  orders.forEach(o => {
    $(`#status-${o.id}`)?.addEventListener("change", (e) => {
      o.status = e.target.value;
      saveAll();
      showToast("Statut mis à jour.");
    });
    $(`#details-${o.id}`)?.addEventListener("click", () => {
      alert(orderDetailsText(o));
    });
  });
}

function labelStatus(s) {
  return { pending: "En attente", paid: "Payée", shipped: "Expédiée", cancelled: "Annulée" }[s] || s;
}
function orderDetailsText(o) {
  const lines = o.items.map(i => `- ${i.name} x${i.qty} (${formatCurrency(i.price)})`).join("\n");
  return `Commande ${o.id}
Client: ${o.customerName}
Articles:
${lines}
Sous-total: ${formatCurrency(o.total.subtotal)}
Taxe: ${formatCurrency(o.total.tax)}
Total: ${formatCurrency(o.total.total)}
Statut: ${labelStatus(o.status)}`;
}

// Clients
function renderCustomers() {
  const tbody = $("#customersTable");
  let customers = [...state.customers];
  if (state.search) {
    customers = customers.filter(c => [c.name, c.phone, c.email].join(" ").toLowerCase().includes(state.search));
  }
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.phone || "-"}</td>
      <td>${c.email || "-"}</td>
      <td>${state.orders.filter(o => o.customerName === c.name).length}</td>
      <td>
        <button class="btn-secondary" id="edit-c-${c.id}">Modifier</button>
        <button class="btn-danger" id="del-c-${c.id}">Supprimer</button>
      </td>
    </tr>
  `).join("");

  customers.forEach(c => {
    $(`#edit-c-${c.id}`)?.addEventListener("click", () => editCustomer(c.id));
    $(`#del-c-${c.id}`)?.addEventListener("click", () => deleteCustomer(c.id));
  });
}

function editCustomer(id) {
  const c = state.customers.find(x => x.id === id);
  if (!c) return;
  $("#customerModalTitle").textContent = "Modifier le client";
  $("#custName").value = c.name;
  $("#custPhone").value = c.phone || "";
  $("#custEmail").value = c.email || "";
  $("#custAddress").value = c.address || "";
  $("#saveCustomerBtn").dataset.id = c.id;
  openModal("#customerModal");
}

function deleteCustomer(id) {
  if (!confirm("Supprimer ce client ?")) return;
  state.customers = state.customers.filter(c => c.id !== id);
  saveAll();
  renderCustomers();
  showToast("Client supprimé.");
}

// Dashboard
function renderDashboard() {
  const monthOrders = state.orders.filter(o => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const rev = monthOrders.reduce((sum, o) => sum + o.total.total, 0);
  $("#revMonth").textContent = formatCurrency(rev);
  $("#orderCount").textContent = String(monthOrders.length);
  $("#customerCount").textContent = String(state.customers.length);
  $("#orderTrend").textContent = `${monthOrders.length} aj.`;
  $("#customerTrend").textContent = `+${Math.max(0, state.customers.length - 2)} nouv.`;
  $("#revTrend").textContent = rev > 0 ? "+12%" : "+0%";
}

// Paramètres
$("#currencySelect").value = state.settings.currency;
$("#taxRateInput").value = state.settings.taxRate;
$("#shopNameInput").value = state.settings.shopName;

$("#saveSettingsBtn").addEventListener("click", () => {
  state.settings.currency = $("#currencySelect").value;
  state.settings.taxRate = Number($("#taxRateInput").value) || 0;
  state.settings.shopName = $("#shopNameInput").value.trim() || "Boutique";
  saveAll();
  showToast("Paramètres sauvegardés.");
  renderCart(); renderDashboard();
});

// Remplir filtres catégories
function fillCategoryFilters() {
  const cats = Array.from(new Set(state.products.map(p => p.category).filter(Boolean))).sort();
  const options = ['<option value="">Toutes catégories</option>', ...cats.map(c => `<option value="${c}">${c}</option>`)].join("");
  $("#categoryFilter").innerHTML = options;
  $("#dashboardCategoryFilter").innerHTML = options;
  $("#dashboardCategoryFilter").addEventListener("change", (e) => {
    const cat = e.target.value;
    const list = cat ? state.products.filter(p => p.category === cat) : state.products;
    renderFeatured(list.slice(0, 8));
  });
}

// Init
function init() {
  fillCategoryFilters();
  renderProducts();
  renderOrders();
  renderCustomers();
  renderDashboard();
  renderCart();
  document.title = state.settings.shopName + " — Boutique Manager";
}
document.addEventListener("DOMContentLoaded", init);
