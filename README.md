# Restaurant Billing & Management System

**Technical Assessment Submission | Full-stack Restaurant POS, Billing and Customer Ordering Application**

A practical restaurant application built with **React, Node.js, Express and MongoDB**. It covers the complete restaurant billing journey, from selecting menu items and placing an order to recording payment and issuing a final customer bill. The implementation also provides separate workflows for restaurant owners, cashiers and customers.

> **Project type:** One-day technical assessment demonstration. This application uses demo authentication and simulated/manual payments; it is not configured for production or real-money transactions.

## 1. Assessment Requirements vs. Delivered Application

The supplied **Restaurant Billing & Management System — One-Day Development Assignment** intentionally leaves feature selection open-ended. Its explicit minimum functional requirement is to demonstrate:

**Restaurant Order → Items → Final Customer Bill**

The assessment also evaluates practical design choices, the amount of *working* functionality, clean architecture, data modelling, validation, error handling, reliability and usable UI/UX. It permits a developer-selected technology stack and AI-assisted development, and asks for source code, run instructions and an explanatory README.

### What the assessment asked for, and what was implemented

| Assessment expectation | Implementation in this project |
| --- | --- |
| A working restaurant order-to-bill flow | Menu selection, quantities, order creation, billing and printable paid invoice |
| Useful functionality chosen by the developer | Menu management, order management, checkout, payment tracking, bill history and reports |
| Clear, practical restaurant workflow | Role-specific Owner, Cashier and Customer interfaces |
| Maintainable code and appropriate data modelling | Separate frontend/backend, REST API modules and MongoDB/Mongoose schemas |
| Validation and error handling | Server-side validation, guarded actions and duplicate-checkout protection |
| Usable UI | Responsive navigation, order screens, checkout and receipt printing |
| Complete submission documentation | Setup instructions, database configuration, demo credentials, architecture, tests and limitations in this README |

### Additional functionality beyond the minimum brief

The assessment **did not explicitly require** authentication, separate staff/customer panels, customer accounts, a dashboard, reports or a payment workflow. These were added to demonstrate how the same billing system could be used by different people in a restaurant:

- **Three distinct roles:** Owner, Cashier and Customer, each with role-appropriate screens and server-enforced permissions.
- **Customer registration and login:** Sign up using an email-shaped identifier or a 10-digit mobile number, then sign in again with the saved password.
- **Customer self-ordering:** Public menu browsing, cart, dine-in/takeaway selection, checkout and personal order history.
- **Owner management:** Menu creation/editing/deletion, availability management, order oversight, registered customer counts, bills and sales reports.
- **Cashier operations:** Walk-in/staff orders, customer cash collection, manual cash/UPI payment recording and invoice printing.
- **Customer profile:** Editable name, personal order totals, paid order counts and recorded/demo spending.
- **Billing controls:** Bill preview, optional staff-order tax/discount, unique invoice number, preserved item-price snapshots and protection against duplicate checkout.
- **Financial visibility:** Daily summaries, bill history and distinction between simulated UPI and cashier-recorded payments.

**Important:** The original document defines a minimum workflow, **not a fixed number of mandatory features**. The items above are implementation decisions, not additional requirements imposed by the interviewer.

## 2. Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS v4 |
| Navigation and UI | React Router, Lucide icons |
| Backend | Node.js, Express.js |
| API | REST, JSON |
| Database | MongoDB with Mongoose |
| Authentication | Scrypt-hashed passwords; HMAC-signed HTTP-only session cookies |
| Version control | Git / GitHub |
| Payment handling | Demo UPI simulation and manual cashier-confirmed payment records; **no payment gateway** |

Amounts are calculated on the server using integer **paise**, not floating-point rupee totals.

## 3. Roles and Demo Credentials

| Role | Demo login | Password | Access |
| --- | --- | --- | --- |
| **Owner** | `owner@gmail.com` | `1234` | Dashboard, menu CRUD, orders, bills, customers count and reports |
| **Cashier** | `cashir@gmail.com` | `1234` | Orders, customer cash collection, payment confirmation and printable invoices |
| **Customer** | Self-register using a demo email or 10-digit phone number | Choose a password (at least 6 characters) | Menu, cart, checkout, own orders, paid invoices and profile |

Owner and Cashier accounts are created using `backend/scripts/seedDemoUsers.js`. The script creates missing demo accounts without overwriting existing users/passwords.

**Security note:** These shared staff credentials are intentionally weak **for local assessment demonstration only**. Passwords are stored as salted hashes, not as plain text. The project does not verify that a customer controls the provided email address or phone number; no OTP or verification email is sent. **Never use these demo credentials for a public production deployment.**

## 4. Main Features and Workflows

### Owner workflow

1. Sign in with the Owner demo credentials.
2. Open the Dashboard to review orders, menu availability, registered customers and daily recorded/demo sales.
3. Add, update, delete or change availability of menu items.
4. Review orders and completed bills; access sales reports.

The **registered customer count is not physical restaurant footfall**. The application does not measure real walk-in visitor traffic.

### Cashier workflow

1. Sign in with the Cashier demo credentials.
2. View open customer/staff orders or create a new walk-in order.
3. For a customer's **Cash at cashier** order, collect and confirm the payment before finalizing the invoice.
4. For staff-created orders, preview totals and manually record Cash or UPI payment.
5. View, print and reprint completed invoices.

A customer-submitted cash order keeps its agreed checkout amount; the cashier cannot add a new tax/discount to that order. Staff-created orders retain the configurable bill options.

### Customer workflow

1. Browse the menu and build a cart **without logging in**.
2. At checkout, register or sign in using a demo email/mobile identifier and password.
3. Select **Dine-in** (with table number) or **Takeaway**.
4. Choose a payment method:
   - **Demo UPI:** Place the order, then use **Complete demo UPI** from My Orders to simulate a successful payment. **No money is transferred.**
   - **Cash at cashier:** Place the order and wait for the cashier to confirm cash receipt.
5. After the order is marked paid, view and print the invoice.
6. Visit **My Profile** to change the displayed name and view personal order/spending summaries.

Customer data and bill access are scoped to the signed-in customer. A customer cannot retrieve another customer's private order or receipt.

### Billing and reporting behaviour

- The system records the selected menu items, unit-price snapshots, quantities, subtotal and final bill totals.
- A completed bill contains an invoice number, timestamp, payment details and recorded calculation amounts.
- Cash checkout can record amount received and change due.
- Atomic conditional updates reject duplicate finalization attempts.
- Daily reports use the **Asia/Kolkata** business date.
- **All paid/demo totals (`salesPaise`)** include simulated customer UPI records.
- **Demo UPI (`demoUpiPaise`)** identifies simulated UPI payments separately.
- **Recorded sales (`recordedSalesPaise`)** exclude simulated UPI but are still based on staff-entered confirmation, **not banking reconciliation**.

## 5. Application Architecture

```text
Restaurant_Billing_Technical_Assessment/
├── backend/
│   ├── scripts/                  # Seed Owner and Cashier demo accounts
│   ├── src/
│   │   ├── config/              # MongoDB connection
│   │   ├── models/              # User, MenuItem and Order schemas
│   │   ├── routes/              # REST endpoint definitions
│   │   ├── controllers/         # HTTP request handlers
│   │   ├── services/            # Auth, ordering and billing logic
│   │   ├── middleware/          # Auth/roles and error handling
│   │   ├── app.js               # Express application and API registration
│   │   └── server.js            # Database connection and server startup
│   ├── tests/                   # Unit tests
│   ├── .env.example             # Example environment variables (no secrets)
│   └── package.json
├── frontend/
│   ├── public/                  # Public assets
│   ├── src/
│   │   ├── components/         # Shared layouts and access guards
│   │   ├── contexts/           # Authentication and cart state
│   │   ├── pages/              # Owner, cashier, customer and auth pages
│   │   ├── services/           # REST client and UI helpers
│   │   ├── App.jsx             # Application routes
│   │   └── main.jsx            # React entry point
│   ├── vite.config.js           # Vite plugins and backend API proxy
│   └── package.json
├── docs/                        # Assessment reference/documentation
├── README.md                    # Setup, features and submission guide
└── .gitignore                   # Secrets and generated-file exclusions
```

The main MongoDB entities are **User**, **MenuItem** and **Order**. Completed bill information is stored with its Order rather than requiring a separate bill collection. Existing orders without an associated customer account remain available to staff, but are not retroactively assigned to customer profiles.

## 6. Prerequisites

- Node.js and npm installed (use a Node version supported by the project's Vite installation).
- MongoDB Atlas or a working local MongoDB instance.
- Git for version control.
- Terminal access on macOS, Windows or Linux; the commands below use macOS/Linux shell syntax.

**Ports used in this setup:** Frontend `5173`, Backend `5050`. Port `5050` is used because Apple's AirPlay/AirTunes service can occupy port `5000` on macOS.

## 7. Installation and Local Setup

### 7.1 Clone or open the source folder

```bash
git clone https://github.com/Alok04-sharma/Restaurant_Billing_Technical_Assessment.git
cd Restaurant_Billing_Technical_Assessment
```

If you already have the folder on your Desktop, open it instead:

```bash
cd ~/Desktop/Restaurant_Billing_Technical_Assessment
```

### 7.2 Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set the actual connection string and locally generated session secret:

```dotenv
NODE_ENV=development
PORT=5050
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_URL_ENCODED_PASSWORD@YOUR_CLUSTER/restaurant_billing?retryWrites=true&w=majority
SESSION_SECRET=YOUR_RANDOM_SESSION_SECRET
```

Generate your secret locally:

```bash
openssl rand -hex 32
```

Paste the generated output in `SESSION_SECRET`. Replace the MongoDB placeholders with **your own** connection details. Atlas cluster connection formats vary, so prefer the **Connect → Drivers** URI shown for your Atlas cluster; ensure that the configured database user's credentials/authentication settings are correct. Do not commit `.env` or put its contents in a screenshot/issue.

If you already have a working `backend/.env`, **keep its existing MongoDB URI** and add only missing settings.

### 7.3 Seed the staff demo accounts

Run once after configuring MongoDB (safe to re-run):

```bash
node scripts/seedDemoUsers.js
```

### 7.4 Run the backend

From `backend/`:

```bash
npm run dev
```

Expected startup includes a MongoDB connection and an API listening on **5050**.

Check the health endpoint:

```bash
curl -i http://127.0.0.1:5050/api/health
```

With MongoDB connected, it should return HTTP `200` and a response containing `"status":"ok"`.

### 7.5 Run the frontend

Open a **second Terminal** at the project root and run:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173/**. Guests land on the customer menu; the shared login form is at **http://localhost:5173/login**.

The Vite `/api` proxy must target `http://127.0.0.1:5050`. Use `localhost:5173` as the browser origin to match the configured `CLIENT_ORIGIN`.

## 8. Application Routes

| Audience | Frontend routes |
| --- | --- |
| Public | `/`, `/customer/menu`, `/customer/cart`, `/login`, `/signup` |
| Owner | `/owner`, `/owner/menu`, `/owner/orders`, `/owner/bills`, `/owner/reports` |
| Cashier | `/cashier/orders`, `/cashier/orders/new`, `/cashier/bills` and order billing screens |
| Signed-in Customer | `/customer/orders`, `/customer/profile`, `/customer/bills/:id` |

Protected routes redirect users who do not have the required role. **Backend permissions are enforced independently of frontend navigation.**

## 9. REST API Overview

| Access | Endpoints / Operations |
| --- | --- |
| Public | `GET /api/health`, `GET /api/menu` |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Customer profile | `PATCH /api/auth/profile` |
| Owner | `GET /api/dashboard/overview`, menu creation/update/deletion, `GET /api/reports/daily` |
| Owner and Cashier | `GET/POST /api/orders`, `GET/PUT /api/orders/:id`, `PATCH /api/orders/:id/cancel` |
| Staff billing | `POST /api/orders/:id/bill-preview`, `POST /api/orders/:id/checkout`, `GET /api/bills` |
| Customer | `GET/POST /api/customer/orders`, `GET /api/customer/orders/:id`, `POST /api/customer/orders/:id/demo-pay`, `GET /api/customer/stats` |
| Paid bill detail | `GET /api/bills/:id` (staff or the owning customer) |

Requests and responses use JSON. Authenticated sessions use HTTP-only cookies and role checks. The customer-facing APIs never grant menu-editing or owner-reporting permissions.

## 10. Testing and Verification

### Automated tests

From the backend folder:

```bash
cd backend
node --test tests/*.test.js
```

From the frontend folder:

```bash
cd frontend
npm run build
```

### Manual acceptance checklist

- [ ] Owner signs in and can add/edit/disable a menu item; Cashier and Customer cannot edit the menu.
- [ ] Customer browses the menu and creates a cart without logging in.
- [ ] Customer signs up using a demo email/mobile identifier and can log in again after logout.
- [ ] Customer places a Dine-in or Takeaway order; saved order remains after refresh.
- [ ] Cashier sees the customer Cash order and records payment; customer then accesses the paid invoice.
- [ ] Customer demo UPI checkout clearly indicates a simulated transaction, with no actual money transfer.
- [ ] Two checkout attempts do not generate duplicate paid bills.
- [ ] Cashier prints the paid invoice; bill history and Owner daily reports update.
- [ ] Customer cannot read another customer's order or invoice.
- [ ] Customer updates their profile and sees their own order/spending totals.
- [ ] Existing staff-created orders and bills remain available after adding customer accounts.
- [ ] Frontend builds successfully and the main workflows work in desktop and mobile layouts.

The commands above are **verification steps**, not a claim that every end-to-end check was executed in every environment. Run them against the final local source before submitting.

## 11. Known Limitations

This is an **assessment/demo application**, not a production restaurant payment system.

- **No real UPI or card processing.** Customer UPI is simulated; Cashier Cash/UPI entries are manually confirmed, not verified with a bank.
- **No real customer identity verification.** No OTP, confirmation email, password recovery or verified phone ownership.
- **Demo-only staff passwords.** The seeded credentials are deliberately simple and must not be used in public deployment.
- **Session limitations.** Sessions use signed HTTP-only cookies with a seven-day expiry; logout clears the browser cookie but does not globally revoke a copied session token. Production needs stronger session revocation, HTTPS and CSRF protection.
- **Development rate limiting.** Login throttling is kept in the running Node process, not shared across servers.
- **No fulfillment lifecycle.** Kitchen preparation tracking, inventory deduction, refunds and reconciliation are not included.
- **No automatic tax compliance determination.** Tax/discount are billing options for staff orders, not jurisdiction-specific legal advice.
- **Client-side cart storage.** Carts do not synchronize across devices. Customer order lists show up to 100 recent orders; staff order lists show up to 200, and bill history is limited to 100 records per request.
- **Printing via browser.** Receipts can be printed using the browser print dialog; server-side PDF generation/storage is not provided.
- **No measured footfall.** The Owner customer count reflects registered customer accounts, not physical visitors.

## 12. Future Improvements

With additional development time, priorities would include production authentication and recovery, verified payment gateway/webhook integration, refund handling, kitchen order status, inventory/stock management, role/audit logs, data export, configurable tax rules and automated integration/end-to-end tests.

## 13. Submission Instructions

The assessment requests:

- Complete source code, provided through a **Git repository URL or a ZIP archive**.
- A `README.md` describing the stack, features, architecture, database, setup, known issues and next improvements.
- Database configuration/setup instructions and test credentials when login is implemented.

**Repository:** https://github.com/Alok04-sharma/Restaurant_Billing_Technical_Assessment

Before submission, verify that `.env`, `notebook.text`, `node_modules/`, local database secrets and generated build output are **not committed**. The shared demo credentials belong in this README; the actual MongoDB URI and `SESSION_SECRET` do not.

---

**Core assessment outcome:** The minimum **Order → Items → Bill** workflow is covered, and the project goes beyond that baseline with a role-based owner/cashier/customer experience, persistent accounts, customer self-ordering, payment recording, invoice history and management reports.
