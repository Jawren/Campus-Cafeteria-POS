// Campus Cafeteria POS - script.js
// Step 3: Cart, totals, payment VALIDATION, confirmation, receipt,
// and new transaction. All data is kept in memory only
// (it resets when the page is reloaded).

// ===== DATA (in memory) =====
let cart = []; // each item: { id, name, price, qty }
let transactionCounter = 0; // number of completed transactions
let isPaid = false; // true after payment, until New Transaction

// ===== ELEMENT REFERENCES =====
const addButtons = document.querySelectorAll(".add-btn");
const cartBody = document.getElementById("cart-body");
const cartMessage = document.getElementById("cart-message");
const totalAmountEl = document.getElementById("total-amount");
const cashInput = document.getElementById("cash-input");
const paymentMessage = document.getElementById("payment-message");
const confirmBtn = document.getElementById("confirm-payment-btn");
const newTxnBtn = document.getElementById("new-transaction-btn");
const confirmationBox = document.getElementById("payment-confirmation");
const receiptContent = document.getElementById("receipt-content");

// ===== HELPER FUNCTIONS =====

// Rounds money to 2 decimals to avoid floating-point errors
function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

// Formats a number as pesos, e.g. 165 -> "₱165.00"
function formatPeso(amount) {
  return "₱" + roundMoney(amount).toFixed(2);
}

// Formats a transaction number, e.g. 1 -> "TXN-0001"
function formatTransactionNumber(number) {
  return "TXN-" + String(number).padStart(4, "0");
}

// Formats a date as readable date and time, e.g. "10/13/2026, 11:30:05 AM"
function formatDateTime(date) {
  return date.toLocaleString("en-PH");
}

// Shows a green message above the cart table (empty text hides it)
function showMessage(text) {
  cartMessage.textContent = text;
}

// Shows a message near the payment input
// type is "error" (red) or "success" (green)
function showPaymentMessage(text, type) {
  paymentMessage.textContent = text;
  if (type === "error") {
    paymentMessage.className = "message error";
  } else {
    paymentMessage.className = "message";
  }
}

// Clears all messages (called at the start of every action)
function clearMessages() {
  showMessage("");
  showPaymentMessage("", "success");
}

// Finds an item in the cart by its id (returns undefined if not found)
function findCartItem(id) {
  return cart.find(function (item) {
    return item.id === id;
  });
}

// Creates a table cell with the given text
function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

// Creates a button with a label, a CSS class, and a click handler
function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

// ===== CART FUNCTIONS =====

// Adds a product to the cart, or increases its qty if it is already there
function addToCart(id, name, price) {
  if (isPaid) return; // cart is locked after payment

  const existingItem = findCartItem(id);

  if (existingItem) {
    existingItem.qty = existingItem.qty + 1;
  } else {
    cart.push({ id: id, name: name, price: price, qty: 1 });
  }

  clearMessages();
  showMessage(name + " added to cart.");
  renderCart();
}

// Increases the qty of a cart item by 1
function increaseQty(id) {
  if (isPaid) return;

  const item = findCartItem(id);
  item.qty = item.qty + 1;
  clearMessages();
  renderCart();
}

// Decreases the qty of a cart item by 1, but never below 1
function decreaseQty(id) {
  if (isPaid) return;

  const item = findCartItem(id);
  if (item.qty > 1) {
    item.qty = item.qty - 1;
  }
  clearMessages();
  renderCart();
}

// Removes an item from the cart completely
function removeFromCart(id) {
  if (isPaid) return;

  const item = findCartItem(id);
  cart = cart.filter(function (cartItem) {
    return cartItem.id !== id;
  });
  clearMessages();
  showMessage(item.name + " removed from cart.");
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

// Redraws the cart table and the total amount due
function renderCart() {
  cartBody.innerHTML = ""; // clear old rows

  if (cart.length === 0) {
    const row = document.createElement("tr");
    const cell = createCell("Cart is empty.");
    cell.colSpan = 5;
    cell.className = "empty-message";
    row.appendChild(cell);
    cartBody.appendChild(row);
  } else {
    cart.forEach(function (item) {
      const row = document.createElement("tr");

      // Quantity cell: [−] qty [+]
      const qtyCell = document.createElement("td");
      qtyCell.className = "qty-cell";

      const minusBtn = createButton("−", "qty-btn", function () {
        decreaseQty(item.id);
      });
      minusBtn.disabled = item.qty === 1 || isPaid; // cannot go below 1

      const qtyValue = document.createElement("span");
      qtyValue.className = "qty-value";
      qtyValue.textContent = item.qty;

      const plusBtn = createButton("+", "qty-btn", function () {
        increaseQty(item.id);
      });
      plusBtn.disabled = isPaid;

      qtyCell.appendChild(minusBtn);
      qtyCell.appendChild(qtyValue);
      qtyCell.appendChild(plusBtn);

      // Action cell: [Remove]
      const actionCell = document.createElement("td");
      const removeBtn = createButton("Remove", "remove-btn", function () {
        removeFromCart(item.id);
      });
      removeBtn.disabled = isPaid;
      actionCell.appendChild(removeBtn);

      row.appendChild(createCell(item.name));
      row.appendChild(createCell(formatPeso(item.price)));
      row.appendChild(qtyCell);
      row.appendChild(createCell(formatPeso(computeSubtotal(item))));
      row.appendChild(actionCell);

      cartBody.appendChild(row);
    });
  }

  totalAmountEl.textContent = formatPeso(computeTotal());
}

// ===== PAYMENT AND RECEIPT FUNCTIONS =====

// Locks or unlocks ordering (used after payment and on New Transaction)
function setOrderLocked(locked) {
  addButtons.forEach(function (button) {
    button.disabled = locked;
  });
  cashInput.disabled = locked;
  confirmBtn.disabled = locked;
}

// Checks the payment, in order:
//   a. cart is empty
//   b. blank, not a number, or negative
//   c. less than the total
// Returns { valid, message, amount }
function validatePayment(amountInput, total) {
  const rawValue = amountInput.value.trim();
  const invalidMessage = "Please enter a valid payment amount.";

  // a. Cart is empty
  if (cart.length === 0) {
    return {
      valid: false,
      message: "Your cart is empty. Please add at least one item.",
      amount: 0,
    };
  }

  // b. Blank or not a number
  //    (badInput is true when the browser cannot read the typed text, e.g. "e")
  if (amountInput.validity.badInput || rawValue === "") {
    return { valid: false, message: invalidMessage, amount: 0 };
  }

  const amount = roundMoney(parseFloat(rawValue));

  // b. Still not a number, or negative
  if (isNaN(amount) || amount < 0) {
    return { valid: false, message: invalidMessage, amount: 0 };
  }

  // c. Not enough cash
  if (amount < total) {
    return {
      valid: false,
      message:
        "Insufficient payment. Please enter at least " +
        formatPeso(total) +
        ".",
      amount: amount,
    };
  }

  // d. Valid payment
  return { valid: true, message: "", amount: amount };
}

// Validates the payment, then shows the confirmation and receipt
function processPayment() {
  if (isPaid) return; // already paid - wait for New Transaction

  clearMessages();

  const total = computeTotal();
  const result = validatePayment(cashInput, total);

  // Invalid: show the error and stop (no receipt, no new TXN number)
  if (!result.valid) {
    showPaymentMessage(result.message, "error");
    return;
  }

  const amountPaid = result.amount;
  const change = roundMoney(amountPaid - total);

  transactionCounter = transactionCounter + 1;

  // Save a snapshot of this transaction for the receipt
  const transaction = {
    number: formatTransactionNumber(transactionCounter),
    dateTime: new Date(),
    items: cart.map(function (item) {
      return { id: item.id, name: item.name, price: item.price, qty: item.qty };
    }),
    total: total,
    amountPaid: amountPaid,
    change: change,
  };

  renderConfirmation(transaction);
  renderReceipt(transaction);

  // Lock the order so the paid cart cannot be changed or paid again
  isPaid = true;
  setOrderLocked(true);
  renderCart();

  showPaymentMessage(
    "Payment successful. Change: " + formatPeso(change),
    "success",
  );
}

// Shows the "Payment Successful" box
function renderConfirmation(transaction) {
  confirmationBox.innerHTML = `
    <div class="confirmation-box">
      <h3>Payment Successful</h3>
      <p><span>Transaction No.:</span> <span>${transaction.number}</span></p>
      <p><span>Total Amount:</span> <span>${formatPeso(transaction.total)}</span></p>
      <p><span>Amount Paid:</span> <span>${formatPeso(transaction.amountPaid)}</span></p>
      <p><span>Change:</span> <strong>${formatPeso(transaction.change)}</strong></p>
    </div>
  `;
}

// Shows the digital receipt with all items and amounts
function renderReceipt(transaction) {
  let itemRows = "";
  transaction.items.forEach(function (item) {
    itemRows += `
      <tr>
        <td>${item.name}</td>
        <td class="num">${item.qty}</td>
        <td class="num">${formatPeso(item.price)}</td>
        <td class="num">${formatPeso(computeSubtotal(item))}</td>
      </tr>
    `;
  });

  receiptContent.innerHTML = `
    <div class="receipt">
      <div class="receipt-header">
        <h3>Campus Cafeteria</h3>
        <p>Digital Receipt</p>
      </div>
      <p>Transaction No.: ${transaction.number}</p>
      <p>Date &amp; Time: ${formatDateTime(transaction.dateTime)}</p>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Price</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div class="receipt-totals">
        <p class="grand-total"><span>TOTAL AMOUNT:</span> <span>${formatPeso(transaction.total)}</span></p>
        <p><span>Amount Paid:</span> <span>${formatPeso(transaction.amountPaid)}</span></p>
        <p><span>Change:</span> <span>${formatPeso(transaction.change)}</span></p>
      </div>

      <p class="receipt-footer">Thank you! Enjoy your meal.</p>
    </div>
  `;
}

// Clears everything for the next customer (keeps the transaction counter)
function newTransaction() {
  cart = [];
  cashInput.value = "";
  confirmationBox.innerHTML = "";
  receiptContent.innerHTML =
    '<p class="receipt-placeholder">No receipt has been generated yet.</p>';
  clearMessages();

  isPaid = false;
  setOrderLocked(false);
  renderCart();
}

// ===== EVENT LISTENERS =====

// Connect each "Add to Cart" button to its product card's data
document.querySelectorAll(".product-card").forEach(function (card) {
  const button = card.querySelector(".add-btn");
  button.addEventListener("click", function () {
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    addToCart(id, name, price);
  });
});

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
  showPaymentMessage("", "success");
});

// Draw the empty cart when the page first loads
renderCart();
