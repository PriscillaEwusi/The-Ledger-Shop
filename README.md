# The Ledger Shop

A mini e-commerce product page with search, category filtering, a shopping cart and a validated checkout form. Built with plain HTML, CSS and JavaScript (no frameworks) as **Task 3** of the Daryl Tech & Educational Network (DTEN) Full Stack Web Development internship.

**Live site:** 
**Author:** Priscilla Ewusi

---

## Features

- **Product catalog** loaded from a public mock API
- **Search** by product name (case-insensitive)
- **Category filter** built dynamically from the loaded products; search and category work together
- **Live result count** announced to screen readers
- **Shopping cart drawer**: add items, increase/decrease quantity, remove items, item-count badge and running total
- **Checkout modal** with custom form validation (name, email, shipping address)
- **Resilient loading**: 8-second request timeout, offline sample-data fallback, and a placeholder for broken images
- **Responsive and accessible**: works on mobile, includes a skip link, ARIA labels and live regions, and respects `prefers-reduced-motion`

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, Grid, Flexbox) |
| Logic | Vanilla JavaScript (ES6+, `fetch`, `async/await`) |
| Data | [DummyJSON Products API](https://dummyjson.com/products) |
| Fonts | Fraunces and Inter (Google Fonts) |

## Project Structure

```
.
├── index.html    # Page structure, cart drawer and checkout modal
├── styles.css    # All styling and responsive rules
├── script.js     # Fetching, filtering, cart logic and validation
└── README.md     # 
```

## Setup and Running Locally

No build step or dependencies are required.

**Option 1: open the file directly**

1. Clone the repository:
   ```bash
   git clone https://github.com/PriscillaEwusi/<repo-name>.git
   cd <repo-name>
   ```
2. Open `index.html` in your browser.

**Option 2: run a local server (recommended)**

```bash
# Python 3
python -m http.server 8000
```

Then visit `http://localhost:8000`. Alternatively, use the **Live Server** extension in VS Code.

An internet connection is needed to load products and fonts. Without one, the app falls back to 8 built-in sample products and tells you so beside the result count.

## How It Works

### Data loading
Products are fetched from `https://dummyjson.com/products?limit=200` and filtered to five categories: `beauty`, `fragrances`, `furniture`, `home-decoration` and `laptops`. Each request is cancelled after 8 seconds using an `AbortController`. If the API fails, sample products are used instead.

### Cart
The cart is an in-memory array of `{ id, title, price, image, quantity }`. A single `renderCart()` function updates the item list, count badge, totals and Checkout button whenever the cart changes. Reducing a quantity to zero removes the item.

### Checkout validation
Native browser validation is turned off (`novalidate`) and replaced with custom rules:

| Field | Rules |
|---|---|
| Full name | Required; at least two words; each part starts with a letter, has at least 2 characters, and contains only letters, hyphens, apostrophes or full stops |
| Email | Required; must match the `name@domain.tld` format |
| Shipping address | Required; at least three comma-separated parts, at least one digit, and at least 12 characters (e.g. `14 Cantonments Road, Osu, Accra, Ghana`) |

Fields are validated when the user leaves them, re-checked as they type once an error appears, and all checked again on submit, with focus moved to the first error.

### Security
All product text is escaped before being inserted into the page to prevent HTML injection.

## Deployment

The site is static, so it can be hosted on GitHub Pages, with no build command and no output directory. Deploy from the repository root.

## Known Limitations

- Checkout is a demonstration only: no order is sent or stored, and no email is delivered.
- The cart is not saved and is cleared when the page is refreshed.
- The cart drawer and checkout modal do not yet trap keyboard focus or close with the Escape key.
- Search matches product names only.

## Possible Improvements

- Node.js/Express backend and database to store orders
- Persist the cart with `localStorage`
- Search across categories and descriptions, with debounce
- Email feedback for order confirmation

## Acknowledgements

- Product data from [DummyJSON](https://dummyjson.com)
- Built during the DTEN Full Stack Web Development internship
