// Campus Cafeteria POS - script.js
// Cart, totals, payment validation, confirmation, receipt, and new transaction.
// All data is kept in memory only (it resets when the page is reloaded).

// =========================================================
// CONSTANTS
// =========================================================

const STORE_NAME = "Campus Cafeteria";
const CURRENCY = "₱";
const TXN_PREFIX = "TXN-";

// Product list (image files go in the images/ folder)
const PRODUCTS = [
  {
    id: "1",
    name: "Rice (Plain)",
    price: 15,
    image: "images/rice.jpg",
    emoji: "🍚",
  },
  {
    id: "2",
    name: "Fried Chicken (1 pc)",
    price: 65,
    image: "images/fried-chicken.jpg",
    emoji: "🍗",
  },
  {
    id: "3",
    name: "Pork Adobo",
    price: 60,
    image: "images/pork-adobo.jpg",
    emoji: "🍖",
  },
  {
    id: "4",
    name: "Vegetable Side Dish",
    price: 35,
    image: "images/vegetable.jpg",
    emoji: "🥗",
  },
  {
    id: "5",
    name: "Iced Tea (cup)",
    price: 20,
    image: "images/iced-tea.jpg",
    emoji: "🧋",
  },
  {
    id: "6",
    name: "Bottled Water",
    price: 20,
    image: "images/bottled-water.jpg",
    emoji: "💧",
  },
];

// All text shown to the user, kept in one place
const MESSAGES = {
  emptyCart: "Your cart is empty. Please add at least one item.",
  invalidAmount: "Please enter a valid payment amount.",
  insufficientStart: "Insufficient payment. Please enter at least ",
  paymentSuccessStart: "Payment successful. Change: ",
  addedEnd: " added to cart.",
  removedEnd: " removed from cart.",
  cartEmptyRow: "Cart is empty.",
  noReceipt: "No receipt has been generated yet.",
};

// Message types (decide the color: green or red)
const SUCCESS = "success";
const ERROR = "error";

// =========================================================
// DATA (in memory)
// =========================================================

let cart = []; // each item: { id, name, price, qty }
let transactionCounter = 0; // number of completed transactions
let isPaid = false; // true after payment, until New Transaction
let addButtons = []; // filled by renderProducts()

// =========================================================
// ELEMENT REFERENCES
// =========================================================

const productGrid = document.getElementById("product-grid");
const cartBody = document.getElementById("cart-body");
const cartMessage = document.getElementById("cart-message");
const totalAmountEl = document.getElementById("total-amount");
const cashInput = document.getElementById("cash-input");
const paymentMessage = document.getElementById("payment-message");
const confirmBtn = document.getElementById("confirm-payment-btn");
const newTxnBtn = document.getElementById("new-transaction-btn");
const confirmationBox = document.getElementById("payment-confirmation");
const receiptContent = document.getElementById("receipt-content");

// =========================================================
// FORMAT HELPERS
// =========================================================

// Rounds money to 2 decimals to avoid floating-point errors
function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

// Formats a number as pesos, e.g. 165 -> "₱165.00"
function formatPeso(amount) {
  return CURRENCY + roundMoney(amount).toFixed(2);
}

// Formats a transaction number, e.g. 1 -> "TXN-0001"
function formatTransactionNumber(number) {
  return TXN_PREFIX + String(number).padStart(4, "0");
}

// Formats a date as readable date and time, e.g. "10/13/2026, 11:30:05 AM"
function formatDateTime(date) {
  return date.toLocaleString("en-PH");
}

// =========================================================
// MESSAGE HELPERS
// =========================================================

// Shows text in a message box; type SUCCESS = green, ERROR = red
function setMessage(element, text, type) {
  element.textContent = text;
  element.className = type === ERROR ? "message error" : "message";
}

// Shows a green message above the cart table (empty text hides it)
function showMessage(text) {
  setMessage(cartMessage, text, SUCCESS);
}

// Shows a message near the payment input
function showPaymentMessage(text, type) {
  setMessage(paymentMessage, text, type);
}

// Clears all messages (called at the start of every action)
function clearMessages() {
  showMessage("");
  showPaymentMessage("", SUCCESS);
}

// =========================================================
// ELEMENT HELPERS
// =========================================================

// Creates a table cell with text and an optional CSS class
function createCell(text, className) {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  return cell;
}

// Creates a button with a label, CSS class, and click handler
function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

// Builds one "label .... value" line as HTML (used by confirmation and receipt)
function lineHtml(label, value, className) {
  return `<p class="line ${className || ""}"><span>${label}</span> <span>${value}</span></p>`;
}

// =========================================================
// PRODUCTS
// =========================================================

// Finds a product in PRODUCTS by its id
function findProduct(id) {
  return PRODUCTS.find(function (product) {
    return product.id === id;
  });
}

// Creates the image area; shows the emoji if the image file fails to load
function createProductImage(product) {
  const imageBox = document.createElement("div");
  imageBox.className = "product-image";

  const img = document.createElement("img");
  img.alt = product.name;
  img.addEventListener("error", function () {
    imageBox.textContent = product.emoji; // replaces the broken image
    imageBox.classList.add("is-fallback");
  });
  img.src = product.image;

  imageBox.appendChild(img);
  return imageBox;
}

// Creates one product card: image, name, price, Add to Cart button
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  const body = document.createElement("div");
  body.className = "product-body";

  const name = document.createElement("h3");
  name.className = "product-name";
  name.textContent = product.name;

  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = formatPeso(product.price);

  const addBtn = createButton(
    "Add to Cart",
    "btn btn-primary add-btn",
    function () {
      addToCart(product.id);
    },
  );
  addButtons.push(addBtn);

  body.appendChild(name);
  body.appendChild(price);
  body.appendChild(addBtn);

  card.appendChild(createProductImage(product));
  card.appendChild(body);
  return card;
}

// Draws all product cards in the menu
function renderProducts() {
  productGrid.innerHTML = "";
  addButtons = [];
  PRODUCTS.forEach(function (product) {
    productGrid.appendChild(createProductCard(product));
  });
}

// =========================================================
// CART
// =========================================================

// Finds an item in the cart by its id (returns undefined if not found)
function findCartItem(id) {
  return cart.find(function (item) {
    return item.id === id;
  });
}

// Adds a product to the cart, or increases its qty if it is already there
function addToCart(productId) {
  if (isPaid) return; // cart is locked after payment

  const product = findProduct(productId);
  const existingItem = findCartItem(productId);

  if (existingItem) {
    existingItem.qty = existingItem.qty + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
    });
  }

  clearMessages();
  showMessage(product.name + MESSAGES.addedEnd);
  renderCart();
}

// Changes an item's qty by "amount" (+1 or -1), never below 1
function changeQty(id, amount) {
  if (isPaid) return;

  const item = findCartItem(id);
  item.qty = Math.max(1, item.qty + amount);
  clearMessages();
  renderCart();
}

// Increases the qty of a cart item by 1
function increaseQty(id) {
  changeQty(id, 1);
}

// Decreases the qty of a cart item by 1 (stops at 1)
function decreaseQty(id) {
  changeQty(id, -1);
}

// Removes an item from the cart completely
function removeFromCart(id) {
  if (isPaid) return;

  const item = findCartItem(id);
  cart = cart.filter(function (cartItem) {
    return cartItem.id !== id;
  });
  clearMessages();
  showMessage(item.name + MESSAGES.removedEnd);
  renderCart();
}

// Computes the subtotal of one item (price x qty)
function computeSubtotal(item) {
  return roundMoney(item.price * item.qty);
}

// Computes the total amount due of the whole cart
function computeTotal() {
  let total = 0;
  cart.forEach(function (item) {
    total = total + computeSubtotal(item);
  });
  return roundMoney(total);
}

// Creates the quantity cell: [−] qty [+]
function createQtyCell(item) {
  const cell = document.createElement("td");
  cell.className = "qty-cell center";

  const minusBtn = createButton("−", "btn btn-qty", function () {
    decreaseQty(item.id);
  });
  minusBtn.disabled = item.qty === 1 || isPaid; // cannot go below 1

  const qtyValue = document.createElement("span");
  qtyValue.className = "qty-value";
  qtyValue.textContent = item.qty;

  const plusBtn = createButton("+", "btn btn-qty", function () {
    increaseQty(item.id);
  });
  plusBtn.disabled = isPaid;

  cell.appendChild(minusBtn);
  cell.appendChild(qtyValue);
  cell.appendChild(plusBtn);
  return cell;
}

// Creates the action cell: [Remove]
function createActionCell(item) {
  const cell = document.createElement("td");
  cell.className = "center";

  const removeBtn = createButton(
    "Remove",
    "btn btn-danger btn-small",
    function () {
      removeFromCart(item.id);
    },
  );
  removeBtn.disabled = isPaid;

  cell.appendChild(removeBtn);
  return cell;
}

// Creates one table row for a cart item
function createCartRow(item) {
  const row = document.createElement("tr");
  row.appendChild(createCell(item.name));
  row.appendChild(createCell(formatPeso(item.price), "num"));
  row.appendChild(createQtyCell(item));
  row.appendChild(createCell(formatPeso(computeSubtotal(item)), "num"));
  row.appendChild(createActionCell(item));
  return row;
}

// Creates the "Cart is empty." row
function createEmptyCartRow() {
  const row = document.createElement("tr");
  const cell = createCell(MESSAGES.cartEmptyRow, "empty-message");
  cell.colSpan = 5;
  row.appendChild(cell);
  return row;
}

// Redraws the cart table and the total amount due
function renderCart() {
  cartBody.innerHTML = ""; // clear old rows

  if (cart.length === 0) {
    cartBody.appendChild(createEmptyCartRow());
  } else {
    cart.forEach(function (item) {
      cartBody.appendChild(createCartRow(item));
    });
  }

  totalAmountEl.textContent = formatPeso(computeTotal());
}

// =========================================================
// PAYMENT
// =========================================================

// Locks or unlocks ordering (used after payment and on New Transaction)
function setOrderLocked(locked) {
  addButtons.forEach(function (button) {
    button.disabled = locked;
  });
  cashInput.disabled = locked;
  confirmBtn.disabled = locked;
}

// Builds a "failed" validation result
function invalidResult(message, amount) {
  return { valid: false, message: message, amount: amount };
}

// Checks the payment, in order:
//   a. cart is empty
//   b. blank, not a number, or negative
//   c. less than the total
// Returns { valid, message, amount }
function validatePayment(amountInput, total) {
  const rawValue = amountInput.value.trim();

  // a. Cart is empty
  if (cart.length === 0) {
    return invalidResult(MESSAGES.emptyCart, 0);
  }

  // b. Blank or not a number
  //    (badInput is true when the browser cannot read the typed text, e.g. "e")
  if (amountInput.validity.badInput || rawValue === "") {
    return invalidResult(MESSAGES.invalidAmount, 0);
  }

  const amount = roundMoney(parseFloat(rawValue));

  // b. Still not a number, or negative
  if (isNaN(amount) || amount < 0) {
    return invalidResult(MESSAGES.invalidAmount, 0);
  }

  // c. Not enough cash
  if (amount < total) {
    return invalidResult(
      MESSAGES.insufficientStart + formatPeso(total) + ".",
      amount,
    );
  }

  // d. Valid payment
  return { valid: true, message: "", amount: amount };
}

// Creates a snapshot of the finished transaction (used by the receipt)
function createTransaction(total, amountPaid) {
  transactionCounter = transactionCounter + 1;

  return {
    number: formatTransactionNumber(transactionCounter),
    dateTime: new Date(),
    items: cart.map(function (item) {
      return { id: item.id, name: item.name, price: item.price, qty: item.qty };
    }),
    total: total,
    amountPaid: amountPaid,
    change: roundMoney(amountPaid - total),
  };
}

// Validates the payment, then shows the confirmation and receipt
function processPayment() {
  if (isPaid) return; // already paid - wait for New Transaction

  clearMessages();

  const total = computeTotal();
  const result = validatePayment(cashInput, total);

  // Invalid: show the error and stop (no receipt, no new TXN number)
  if (!result.valid) {
    showPaymentMessage(result.message, ERROR);
    return;
  }

  const transaction = createTransaction(total, result.amount);

  renderConfirmation(transaction);
  renderReceipt(transaction);

  // Lock the order so the paid cart cannot be changed or paid again
  isPaid = true;
  setOrderLocked(true);
  renderCart();

  showPaymentMessage(
    MESSAGES.paymentSuccessStart + formatPeso(transaction.change),
    SUCCESS,
  );
}

// =========================================================
// CONFIRMATION AND RECEIPT
// =========================================================

// Shows the "Payment Successful" box (big change + TXN badge)
function renderConfirmation(transaction) {
  confirmationBox.innerHTML = `
    <div class="confirmation-box">
      <div class="confirmation-header">
        <h3>✔ Payment Successful</h3>
        <span class="txn-badge">${transaction.number}</span>
      </div>
      ${lineHtml("Total Amount:", formatPeso(transaction.total))}
      ${lineHtml("Amount Paid:", formatPeso(transaction.amountPaid))}
      <div class="change-highlight">
        <span>Change</span>
        <strong>${formatPeso(transaction.change)}</strong>
      </div>
    </div>
  `;
}

// Builds the item rows of the receipt table
function createReceiptItemRows(items) {
  let rows = "";
  items.forEach(function (item) {
    rows += `
      <tr>
        <td>${item.name}</td>
        <td class="num">${item.qty}</td>
        <td class="num">${formatPeso(item.price)}</td>
        <td class="num">${formatPeso(computeSubtotal(item))}</td>
      </tr>
    `;
  });
  return rows;
}

// Shows the digital receipt with all items and amounts
function renderReceipt(transaction) {
  receiptContent.innerHTML = `
    <div class="receipt">
      <div class="receipt-header">
        <h3>${STORE_NAME}</h3>
        <p>Digital Receipt</p>
      </div>
      ${lineHtml("Transaction No.:", transaction.number, "receipt-txn")}
      ${lineHtml("Date &amp; Time:", formatDateTime(transaction.dateTime))}

      <table class="receipt-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Price</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>${createReceiptItemRows(transaction.items)}</tbody>
      </table>

      <div class="receipt-totals">
        ${lineHtml("TOTAL AMOUNT:", formatPeso(transaction.total), "grand-total")}
        ${lineHtml("Amount Paid:", formatPeso(transaction.amountPaid))}
        ${lineHtml("Change:", formatPeso(transaction.change), "receipt-change")}
      </div>

      <p class="receipt-footer">Thank you! Enjoy your meal.</p>
    </div>
  `;
}

// Shows the "No receipt has been generated yet." placeholder
function showReceiptPlaceholder() {
  receiptContent.innerHTML = `<p class="receipt-placeholder">${MESSAGES.noReceipt}</p>`;
}

// =========================================================
// NEW TRANSACTION
// =========================================================

// Clears everything for the next customer (keeps the transaction counter)
function newTransaction() {
  cart = [];
  cashInput.value = "";
  confirmationBox.innerHTML = "";
  showReceiptPlaceholder();
  clearMessages();

  isPaid = false;
  setOrderLocked(false);
  renderCart();
}

// =========================================================
// START THE APP
// =========================================================

// Connects buttons and the Enter key to their functions
function setupEventListeners() {
  confirmBtn.addEventListener("click", processPayment);
  newTxnBtn.addEventListener("click", newTransaction);

  // Pressing Enter in the cash input works like clicking Confirm Payment
  cashInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      processPayment();
    }
  });

  // Typing a new amount clears the old payment message
  cashInput.addEventListener("input", function () {
    showPaymentMessage("", SUCCESS);
  });
}

// Draws the starting screen
function init() {
  renderProducts();
  renderCart();
  showReceiptPlaceholder();
  setupEventListeners();
}

init();
