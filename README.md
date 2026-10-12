# Restaurant Billing & Management System

**Technical assessment demo — Part 3: role-based restaurant POS + customer ordering**

## Objective

A small practical restaurant flow: **menu → order → payment confirmation → immutable customer bill**. Existing Part 1 and Part 2 menu, orders and invoices remain in the same MongoDB database.

## Stack

- Frontend: React, Vite, Tailwind CSS v4, React Router, Lucide icons.
- Backend: Node.js, Express REST API, Mongoose.
- Database: MongoDB.
- Authentication: locally hashed scrypt passwords, HMAC-signed **HTTP-only** session cookie (7-day expiry) and backend role checks.
- Payment: **simulation/manual record only** — **no real payment gateway**.
- Git: source control and deliverable repository.

## Roles and demo credentials

| Role | Login | Password | Permissions |
| --- | --- | --- | --- |
| Owner | `owner@gmail.com` | `1234` | Dashboard, registered customer count, menu CRUD, orders, payments, bill history and reports |
| Cashier | `cashir@gmail.com` | `1234` | All staff orders, cash/UPI payment record, paid invoices, new staff orders |
| Customer | Self-register with an email-shaped string or 10-digit number | Set a password (minimum 6 characters) | Menu, cart, own orders, demo UPI or cashier cash, paid bills and editable profile |

**These are shared, intentionally weak demo credentials. Never expose a database containing real customer information or deploy them for real business use.** Registration/login does not send OTP/email or verify identity; demo identifiers need not correspond to real contacts. Passwords are hashed in MongoDB (not stored as `1234`).

## Setup on macOS

1. Have Node.js, npm, Git, React/Vite/Tailwind frontend and Express/Mongoose backend installed from the earlier setup. Existing working port **5050** avoids Apple AirPlay port 5000 conflicts.
2. ADD/REPLACE the Part 3 source files using the supplied individual `.txt` copies. Preserve unrelated source files and `backend/.env`.
3. In `backend/.env`, keep the existing working `MONGODB_URI` and `PORT=5050`; add these lines if missing:

   ```dotenv
   CLIENT_ORIGIN=http://localhost:5173
   SESSION_SECRET=YOUR_OWN_RANDOM_64_CHARACTER_HEX_STRING
   ```

   Generate a value locally with `openssl rand -hex 32`. **Do not commit this value or share the `.env` file.** To append safely, copy the generated value into your `.env` editor; do not paste the secret into chat.
4. Confirm frontend Vite proxy still maps `/api` to `http://127.0.0.1:5050`. Use **http://localhost:5173** in the browser (not `127.0.0.1:5173`) to match the configured allowed Origin.
5. Create initial demo accounts **once** (safe to re-run; it will not overwrite existing users or passwords):

   ```bash
   cd backend
   node scripts/seedDemoUsers.js
   ```

6. Run backend and frontend in separate terminals:

   ```bash
   # backend/
   npm run dev
   ```

   ```bash
   # frontend/
   npm run dev
   ```

7. Visit **http://localhost:5173/**. Guests see the customer menu; staff/customer login is at `/login`. Never use the default `owner@gmail.com / 1234` and `cashir@gmail.com / 1234` credentials on public infrastructure.

## App routes

- Public: `/customer/menu`, `/customer/cart`, `/login`, `/signup`.
- Owner: `/owner`, `/owner/menu`, `/owner/orders`, `/owner/bills`, `/owner/reports`.
- Cashier: `/cashier/orders`, `/cashier/bills`, staff order editor and checkout routes.
- Signed-in customer: `/customer/orders`, `/customer/profile`, `/customer/bills/:id`.

## Complete workflows

### Owner
1. Log in with seeded owner demo account.
2. View real MongoDB counts, including **registered customers** (not verified visits or footfall).
3. Create/edit/delete/disable food items, view orders, bills and daily reports.

### Cashier
1. Log in with seeded cashier demo account.
2. See pending staff and customer orders; create restaurant walk-in orders.
3. For a **customer CASH** order, confirm cash actually received, then issue a bill. A customer-submitted order's agreed subtotal/tax/discount cannot be changed by the cashier.
4. For staff orders, manually record cash or UPI. Print paid bills.

### Customer
1. Browse menu and build cart without signing in.
2. At checkout, create customer account or log in (email-shaped demo identifier or 10-digit mobile + password).
3. Choose dine-in/table or takeaway, and either **Demo UPI** or **Cash at cashier**.
4. **Demo UPI**: place the order then press **Complete demo UPI** from My Orders to simulate success. No real money moves; receipt explicitly identifies simulated UPI.
5. **Cash**: place the order; status is awaiting payment until cashier confirms actual cash received. Only then is the invoice available to customer.
6. Profile supports editable name, personal order count, paid count and recorded/demo spending.

Previous Part 1/2 orders and invoices remain accessible to staff. They are not retroactively attributed to a customer account.

## REST API summary

- Public/menu: `GET /api/health`, `GET /api/menu` (only available menu for non-owners).
- Auth: `POST /api/auth/register`, `/login`, `/logout`; `GET /api/auth/me`; `PATCH /api/auth/profile` (customer).
- Owner-only: `GET /api/dashboard/overview`; `POST|PUT|DELETE /api/menu`; `GET /api/reports/daily`.
- Owner/cashier: `GET|POST /api/orders`, `GET|PUT /api/orders/:id`, `PATCH /api/orders/:id/cancel`, `POST /api/orders/:id/bill-preview`, `POST /api/orders/:id/checkout`, `GET /api/bills`.
- Owner/cashier or owning customer: `GET /api/bills/:id`.
- Customer-only: `GET|POST /api/customer/orders`, `GET /api/customer/orders/:id`, `POST /api/customer/orders/:id/demo-pay`, `GET /api/customer/stats`.

Every protected endpoint verifies the backend user role, not just whether a menu link is visible. Customer receipt endpoints verify MongoDB owner ID. Bill generation and demo UPI use atomic conditional updates to avoid double payment.

## Reporting: avoid misleading demo totals

- `salesPaise`: all bills marked paid, including simulated UPI.
- `demoUpiPaise`: amount only from simulated customer UPI payments.
- `recordedSalesPaise`: paid amount excluding simulated UPI.
- Cash/staff UPI records depend on cashier confirmation; the system does not independently verify payment with a bank.
- Business date is in Asia/Kolkata and all API money values are in integer **paise**.

## Tests and quality check

```bash
cd backend
node --test tests/*.test.js
```

```bash
cd frontend
npm run build
```

Manually verify: owner can edit menu, cashier cannot; customer can view menu but cannot call owner reporting; customer cannot open another customer's bill; re-login with same fake identifier/password retains profile; cash order requires cashier payment; demo UPI receipt says simulated; repeated checkout cannot generate a second bill; logout and refresh restore correct access control; previous ₹645 order remains intact.

## Architecture

```text
frontend/src/contexts/         Auth session state and customer cart state
frontend/src/components/       Role protection and owner/cashier/customer layouts
frontend/src/pages/            Existing Part 1/2 staff pages + new customer/auth screens
frontend/src/services/         REST client and money/date helpers
backend/src/models/            User, MenuItem and Order with embedded immutable bill
backend/src/services/          Order/bill/auth validation, signing and hashing
backend/src/middleware/        Authentication, RBAC, JSON errors
backend/src/controllers/       HTTP handlers for staff, auth and owned customer data
backend/src/routes/            Separate resource/role-based API routes
backend/scripts/               Idempotent demo owner/cashier seed
backend/tests/                 Unit tests
```

## Known limitations and future work

- Demo credentials are shared/weak. In-memory login throttle is per Node process and does not replace production-grade rate limiting.
- No email/mobile ownership verification, password recovery, payment gateway, live UPI validation, audit logs, real order fulfillment, refunds or tax compliance validation.
- Stateless signed sessions expire after seven days; logout clears the browser cookie but does not globally revoke already-copied sessions. Production should use server-side revocable sessions, HTTPS and CSRF hardening.
- Customer cart uses local browser storage; no cross-device cart sync. Customer order list shows at most 100 recent orders and staff lists at most 200.
- Simulated UPI is **not revenue received**. Receipt printing uses the browser print dialog, not PDF storage.
- Local/demo only. Real restaurant deployment would require stronger controls, payment provider reconciliation, privacy policy and operational monitoring.

## Submission

Commit source code and this README to Git; include database setup, demo credentials, test commands and known limitations. **Never commit `backend/.env`**, `node_modules`, private database URIs or real user data. Submit the Git repository URL or clean source ZIP as required by the interviewer.
