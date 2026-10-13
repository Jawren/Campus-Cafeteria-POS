# Campus Cafeteria POS

A computer-based food ordering and point-of-sale (POS) system for a walk-up campus cafeteria. Cashiers or student assistants use it to take lunch orders, accept cash payments, and generate digital receipts. Built for the IT 415 Application Development and Emerging Technologies practical examination.

**Scenario:** Scenario 1 — Campus Cafeteria POS

## Products

| Product              | Price  |
| -------------------- | ------ |
| Rice (Plain)         | ₱15.00 |
| Fried Chicken (1 pc) | ₱65.00 |
| Pork Adobo           | ₱60.00 |
| Vegetable Side Dish  | ₱35.00 |
| Iced Tea (cup)       | ₱20.00 |
| Bottled Water        | ₱20.00 |

## Features

- Add products to the cart with on-screen buttons
- Increase or decrease item quantity (minimum of 1) and remove items
- Subtotals and total amount due update automatically
- Cash payment through a numeric input (Enter key also confirms)
- Payment validation with clear on-screen error messages
- Change computation rounded to 2 decimals
- Payment confirmation and digital receipt with a transaction number (TXN-0001, TXN-0002, ...)
- Cart is locked after payment until a new transaction starts
- New Transaction clears the cart, payment, and receipt

## Transaction Flow

1. **Browse** the menu
2. **Add** items to the cart
3. **Review** quantities, subtotals, and the total
4. **Pay** by entering the cash amount
5. **Validate** the payment
6. **Confirm** the payment and show the change
7. **Receipt** is generated; click **New Transaction** for the next customer

## Payment Validation Rules

| Condition                                 | Message                                            |
| ----------------------------------------- | -------------------------------------------------- |
| Cart is empty                             | Your cart is empty. Please add at least one item.  |
| Blank, non-numeric, or negative amount    | Please enter a valid payment amount.               |
| Amount less than the total                | Insufficient payment. Please enter at least ₱X.XX. |
| Amount equal to or greater than the total | Payment accepted; change = Amount Paid − Total     |

Invalid payments do not generate a receipt or a transaction number.

## How to Run

1. Download or clone this repository.
2. Open `index.html` in a web browser (Chrome, Edge, or Firefox).

No installation, server, or database is required. Data is kept in memory and resets when the page is reloaded.

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript (no frameworks or libraries)

## File Structure

```
Campus-Cafeteria-POS/
├── index.html   # Page structure: menu, cart, payment, receipt
├── style.css    # Layout and styling
├── script.js    # Cart, validation, payment, and receipt logic
└── README.md    # Project documentation
```

## AI-Assisted Development

AI tools were used to help with code generation and debugging. All code was reviewed, tested, and understood by the developer before submission.
