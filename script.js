// ---------- State ----------
let allProducts = [];
let cart = []; // { id, title, price, image, quantity }
let loadNote = "";

const productGrid = document.getElementById("product-grid");
const resultCount = document.getElementById("result-count");
const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");

// ---------- Fetch products (with fallbacks) ----------
// Tries each source in order so the page still works if one API is slow, down or blocked.
// The only categories shown in the catalog
const ALLOWED_CATEGORIES = ["beauty", "fragrances", "furniture", "home-decoration", "laptops"];

const SOURCES = [
  {
    name: "DummyJSON",
    url: "https://dummyjson.com/products?limit=200",
    map: (d) =>
      d.products
        .filter((p) => ALLOWED_CATEGORIES.includes(p.category))
        .map((p) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          category: p.category,
          image: p.thumbnail,
        })),
  },
];

const SAMPLE_PRODUCTS = [
  ["Matte Lipstick", "beauty", 12.99],
  ["Rose Eau de Parfum", "fragrances", 54.5],
  ["Oak Bookshelf", "furniture", 249],
  ["Ceramic Table Lamp", "home-decoration", 34.9],
  ["14-inch Laptop", "laptops", 749],
  ["Face Moisturizer", "beauty", 18.5],
  ["Velvet Armchair", "furniture", 329],
  ["Wall Mirror", "home-decoration", 59]
].map(([title, category, price], i) => ({ id: 9000 + i, title, category, price, image: "" }));

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#efe9de"/><text x="60" y="66" font-size="14" text-anchor="middle" fill="#706a60" font-family="sans-serif">No image</text></svg>'
  );

// Swap any image that fails to load for a placeholder
document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG" && e.target.src !== PLACEHOLDER_IMG) e.target.src = PLACEHOLDER_IMG;
  },
  true
);

async function fetchSource(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(source.url, { signal: controller.signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const list = source.map(await response.json());
    if (!Array.isArray(list) || list.length === 0) throw new Error("Empty response");
    return list;
  } finally {
    clearTimeout(timer);
  }
}

async function loadProducts() {
  let note = "";
  for (const source of SOURCES) {
    try {
      allProducts = await fetchSource(source);
      if (source !== SOURCES[0]) note = "";
      break;
    } catch (err) {
      console.warn(`${source.name} failed:`, err.message);
    }
  }
  if (allProducts.length === 0) {
    allProducts = SAMPLE_PRODUCTS;
    note = " (offline sample data: no product API could be reached)";
  }
  loadNote = note;
  populateCategories(allProducts);
  renderProducts(allProducts);
}

function populateCategories(products) {
  const categories = [...new Set(products.map((p) => p.category))];
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.replace(/-/g, " ");
    categorySelect.appendChild(option);
  });
}

// ---------- Render product grid ----------
function renderProducts(products) {
  if (products.length === 0) {
    productGrid.innerHTML = `<p class="empty-message">No products match your search.</p>`;
    resultCount.textContent = "0 products found" + loadNote;
    return;
  }

  resultCount.textContent = `${products.length} product${products.length === 1 ? "" : "s"} found${loadNote}`;

  productGrid.innerHTML = products
    .map(
      (p) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${p.image || PLACEHOLDER_IMG}" alt="${escapeHtml(p.title)}" loading="lazy">
      </div>
      <p class="product-category">${escapeHtml(p.category)}</p>
      <h3 class="product-title">${escapeHtml(p.title)}</h3>
      <p class="product-price">$${p.price.toFixed(2)}</p>
      <button class="btn btn-primary add-to-cart" data-id="${p.id}">Add to cart</button>
    </article>
  `
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Filtering ----------
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;

  const filtered = allProducts.filter((p) => {
    const matchesQuery = p.title.toLowerCase().includes(query);
    const matchesCategory = category === "all" || p.category === category;
    return matchesQuery && matchesCategory;
  });

  renderProducts(filtered);
}

searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);

// ---------- Cart logic ----------
productGrid.addEventListener("click", (e) => {
  const button = e.target.closest(".add-to-cart");
  if (!button) return;
  const id = Number(button.dataset.id);
  const product = allProducts.find((p) => p.id === id);
  addToCart(product);
});

function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }
  renderCart();
  openCart();
}

function updateQuantity(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.id !== id);
  }
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");
  const cartTotalEl = document.getElementById("cart-total");
  const checkoutOpenBtn = document.getElementById("checkout-open");

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalQuantity;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
    checkoutOpenBtn.disabled = true;
  } else {
    cartItems.innerHTML = cart
      .map(
        (item) => `
      <div class="cart-item">
        <img src="${item.image || PLACEHOLDER_IMG}" alt="">
        <div>
          <p class="cart-item-name">${escapeHtml(item.title)}</p>
          <p class="cart-item-price">$${item.price.toFixed(2)}</p>
          <div class="qty-controls">
            <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-action="remove" data-id="${item.id}">Remove</button>
      </div>
    `
      )
      .join("");
    checkoutOpenBtn.disabled = false;
  }

  cartTotalEl.textContent = `$${cartTotal().toFixed(2)}`;
  document.getElementById("checkout-total").textContent = `$${cartTotal().toFixed(2)}`;
}

document.getElementById("cart-items").addEventListener("click", (e) => {
  const button = e.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "increase") updateQuantity(id, 1);
  if (action === "decrease") updateQuantity(id, -1);
  if (action === "remove") removeFromCart(id);
});

// ---------- Cart drawer open/close ----------
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");

function openCart() {
  cartDrawer.hidden = false;
  cartOverlay.hidden = false;
}
function closeCart() {
  cartDrawer.hidden = true;
  cartOverlay.hidden = true;
}

document.getElementById("cart-toggle").addEventListener("click", openCart);
document.getElementById("cart-close").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// ---------- Checkout modal ----------
const checkoutModal = document.getElementById("checkout-modal");
const checkoutOverlay = document.getElementById("checkout-overlay");
const checkoutForm = document.getElementById("checkout-form");
const checkoutStatus = document.getElementById("checkout-status");

function openCheckout() {
  closeCart();
  checkoutModal.hidden = false;
  checkoutOverlay.hidden = false;
}
function closeCheckout() {
  checkoutModal.hidden = true;
  checkoutOverlay.hidden = true;
}

document.getElementById("checkout-open").addEventListener("click", openCheckout);
document.getElementById("checkout-close").addEventListener("click", closeCheckout);
checkoutOverlay.addEventListener("click", closeCheckout);

// ---------- Checkout form validation ----------
const FIELD_ORDER = ["full-name", "email", "address"];

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (message) {
    input.setAttribute("aria-invalid", "true");
    errorEl.textContent = message;
  } else {
    input.removeAttribute("aria-invalid");
    errorEl.textContent = "";
  }
}

// Each validator returns an error message, or "" if the value is valid.
const validators = {
  "full-name": (value) => {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name) return "Please enter your full name.";
    const parts = name.split(" ");
    if (parts.length < 2) {
      return "Name is not complete. Enter your first name and surname, separated by a space.";
    }
    const validPart = /^\p{L}[\p{L}'’.-]+$/u; // letters, at least 2 characters
    if (!parts.every((part) => validPart.test(part))) {
      return "Names can only contain letters, hyphens and apostrophes (at least 2 letters each).";
    }
    return "";
  },

  email: (value) => {
    const email = value.trim();
    if (!email) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return "Invalid email format. Use something like name@example.com.";
    }
    return "";
  },

  address: (value) => {
    const address = value.trim();
    if (!address) return "Please enter your shipping address.";
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3 || !/\d/.test(address) || address.length < 12) {
      return "Address is incomplete. Include house number and street, area, city and country, e.g. 14 Cantonments Road, Osu, Accra, Ghana.";
    }
    return "";
  },
};

// Validate one field, show/clear its error, return true if valid
function validateField(fieldId) {
  const message = validators[fieldId](document.getElementById(fieldId).value);
  setFieldError(fieldId, message);
  return message === "";
}

FIELD_ORDER.forEach((fieldId) => {
  const input = document.getElementById(fieldId);
  // Validate when the user leaves a field
  input.addEventListener("blur", () => validateField(fieldId));
  // Once a field shows an error, re-check as the user types so it clears when fixed
  input.addEventListener("input", () => {
    if (input.hasAttribute("aria-invalid")) validateField(fieldId);
  });
});

// Step gating: a field can't be used until every field before it is valid
checkoutForm.addEventListener("focusin", (e) => {
  const index = FIELD_ORDER.indexOf(e.target.id);
  if (index <= 0) return;
  for (let i = 0; i < index; i++) {
    if (!validateField(FIELD_ORDER[i])) {
      document.getElementById(FIELD_ORDER[i]).focus();
      return;
    }
  }
});

function validateCheckoutForm() {
  let firstInvalid = null;
  FIELD_ORDER.forEach((fieldId) => {
    if (!validateField(fieldId) && !firstInvalid) firstInvalid = fieldId;
  });
  if (firstInvalid) document.getElementById(firstInvalid).focus();
  return firstInvalid === null;
}

checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validateCheckoutForm()) {
    checkoutStatus.textContent = "Please fix the errors above before placing your order.";
    checkoutStatus.className = "form-status";
    return;
  }

  checkoutStatus.textContent = "Order placed! Please check your email for confirmation.";
  checkoutStatus.className = "form-status success";

  cart = [];
  renderCart();
  checkoutForm.reset();
  FIELD_ORDER.forEach((fieldId) => setFieldError(fieldId, ""));

  setTimeout(() => {
    closeCheckout();
    checkoutStatus.textContent = "";
  }, 2200);
});

// ---------- Init ----------
loadProducts();