# College Library Management System (lib-LMS)

A modern, production-grade **College Library Management System** engineered with a full-stack architecture featuring a **React 19 + Vite** single-page frontend, a **Node.js + Express 5** RESTful backend, and a **MongoDB** document database.

---

## 🌟 Key Features

### 1. Authentication & Role-Based Access Control (RBAC)
- **Three Dedicated Roles**:
  - **Admin**: Full system governance (Books, Students, Circulation, Fines, Reports).
  - **Librarian**: Daily circulation operations (Issue books, process returns, collect fines, manage catalog).
  - **Student**: Self-service student portal (Check active book loans, countdown to due dates, fine status, catalog search).
- **Security**: Password hashing via **bcryptjs** (10 salt rounds), stateless **JWT** bearer authorization tokens, and zero plaintext credential leakage.
- **Demo Quick Login**: One-click demo credentials chip buttons on the login page for instant role switching.

### 2. Comprehensive Book Catalog Management
- Full catalog CRUD (Add, View, Edit, Search, and Delete).
- Strict **ISBN uniqueness** enforcement and automatic capitalization.
- **Inventory Bounds**: Automatic validation preventing negative copies or available copies exceeding total stock.
- Multi-parameter search (Title, Author, ISBN, Publisher) with category filter pills and real-time stock indicators.
- Safe deletion protection preventing catalog removal of books currently loaned out.

### 3. Student Registry & Account Management
- Student profile registration: Full Name, Institutional Email, Student ID, Department, and Contact Phone.
- Strict duplicate email and Student ID collision protection.
- **Account Status Controls**: Deactivate/activate accounts; deactivated students are blocked from borrowing books.
- Individual student borrowing audit history and active loan tracking.

### 4. Circulation Desk: Atomic Issue & Return Operations
- **Concurrency Safety**: Atomic `$inc` inventory decrements with stock preconditions preventing overselling or negative inventory.
- Configurable loan duration (defaults to 14 days) and scheduled due date selection.
- Borrowing limit enforcement (maximum 5 active books per student) and duplicate title checkout prevention.
- Real-time overdue status tracking.

### 5. Overdue Fine Engine
- Deterministic overdue fine calculation based on configurable daily rates (defaults to ₹5/day).
- Fair calendar date normalization (midnight boundaries) preventing fractional day overcharges.
- Flexible payment reconciliation: Collect fines immediately upon return or record as pending liabilities.
- Complete Fines & Penalties Ledger with "Mark Paid" settlement workflows.

### 6. Audit & Circulation Reports
- Date-bounded circulation reporting (`fromDate` to `toDate`).
- Categorized filters: All Loans, Currently Issued, Returned, Overdue, and Fines Ledger.
- Executive KPI cards for filtered data slices.
- **Printable Layout**: Clean `@media print` styling enabling one-click browser PDF export and printing.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router v7, Lucide React, Modern Vanilla CSS (No Tailwind) |
| **Backend** | Node.js, Express 5, Mongoose 9, CORS, Dotenv |
| **Database** | MongoDB (v6.0+) |
| **Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Testing** | Node.js built-in test runner (`node --test`), Node Assert (`node:assert/strict`) |

---

## 📂 Project Directory Structure

```
college-lms/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI (Sidebar, Topbar, StatCard, Modal, ConfirmModal, Badge)
│   │   ├── context/            # AuthContext (JWT state, role helpers)
│   │   ├── pages/              # Views (Login, Dashboard, Books, Students, Issues, Fines, Reports, MyBooks)
│   │   ├── services/           # api.js centralized API fetch client
│   │   ├── App.jsx             # Main router and role guards
│   │   ├── index.css           # Premium vanilla CSS design system
│   │   └── main.jsx            # React root mount
│   ├── index.html              # HTML shell with viewport and SEO meta
│   ├── vite.config.js          # Vite config with backend API proxy
│   └── package.json
│
├── server/                     # Backend Application (Node.js + Express 5)
│   ├── config/                 # db.js MongoDB connection manager
│   ├── controllers/            # Route business logic (auth, book, student, issue, dashboard, report)
│   ├── middleware/             # authMiddleware (protect, authorize), errorHandler
│   ├── models/                 # Mongoose Schemas (User, Book, Issue, Setting)
│   ├── routes/                 # Express REST routers
│   ├── scripts/                # seed.js database seeder with demo accounts & catalog
│   ├── tests/                  # Automated test suite (fineCalculator, auth, circulation)
│   ├── utils/                  # fineCalculator.js pure calculation engine
│   ├── app.js                  # Express app export
│   ├── server.js               # HTTP listener entry point
│   ├── .env                    # Local environment variables
│   └── package.json
│
├── docs/                       # Academic & Engineering Documentation
│   ├── SRS.md                  # Software Requirements Specification (IEEE 830)
│   ├── ARCHITECTURE.md         # Architecture diagrams, ERD, and API endpoint matrix
│   ├── TESTING.md              # White-box CFG, Cyclomatic Complexity, ECP & BVA tables
│   └── RMMM.md                 # Risk Mitigation, Monitoring, and Management plan
│
├── .env.example                # Placeholder environment configuration template
├── .gitignore                  # Git exclusions for dependencies, secrets, build artifacts
└── README.md                   # Project overview and instructions
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Installed and running locally on `localhost:27017` (or provide a remote MongoDB URI)

---

### Step 1: Start MongoDB
Ensure MongoDB is running on your machine:
```bash
# macOS (if installed via brew or local binary)
mongod --dbpath ~/.mongodb/data --fork --logpath ~/.mongodb/log/mongod.log
```

---

### Step 2: Configure Environment Variables
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

Default local environment configuration:
```env
PORT=5001
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/college_lms
JWT_SECRET=super_secret_college_lms_jwt_key_2026
JWT_EXPIRES_IN=7d
FINE_PER_DAY=5
DEFAULT_ISSUE_DAYS=14
```

---

### Step 3: Seed the Database
Populate the database with demo accounts, sample textbooks, and initial circulation records:
```bash
cd server
npm run seed
```

#### Demo Development Credentials
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@collegelms.edu` | `Admin@123` | Full access across all modules |
| **Librarian** | `librarian@collegelms.edu` | `Librarian@123` | Circulation desk, catalog, students, fines, reports |
| **Student** | `rahul.sharma@collegelms.edu` | `Student@123` | Student portal, active loans, fines, catalog search |
| **Student** | `priya.patel@collegelms.edu` | `Student@123` | Demonstrates overdue loan and pending fine |
| **Student** | `arjun.verma@collegelms.edu` | `Student@123` | Demonstrates returned loan with paid fine receipt |

*(You can also use the **Quick Demo Login** buttons on the login screen for instant access!)*

---

### Step 4: Run the Backend Server
```bash
cd server
npm run dev
# Server will start on http://localhost:5001
# Health check: http://localhost:5001/api/health
```

---

### Step 5: Run the Frontend Client
In a separate terminal window:
```bash
cd client
npm run dev
# Vite will launch the application on http://localhost:5173
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Automated Testing

Automated tests are implemented using Node.js's built-in test runner (`node --test`):

```bash
cd server
npm test
```

### Test Suite Coverage:
- **Fine Calculation & Boundary Values** (`fineCalculator.test.js`): On-time returns, 1-day overdue boundary, multi-day calculations, custom rates, zero rate grace periods, negative rate rejection, invalid dates.
- **Authentication & Role Authorization** (`authAndRoles.test.js`): bcrypt password hashing, credential comparison, JWT signing/verifying, RBAC middleware role guards.
- **Database Books & Circulation Operations** (`circulationAndBooks.test.js`): Book creation, duplicate ISBN collision rejection, inventory copy constraints, stock exhaustion, out-of-stock issue prevention, return recalculation.

```
✔ 20 tests passed (3 test suites)
✔ 0 failures, 0 skipped
```

Detailed test documentation, including the **Control Flow Graph (CFG)**, **Cyclomatic Complexity ($V(G) = 6$)** derivation, and **Equivalence Class Partitioning (ECP)** tables, is available in [`docs/TESTING.md`](docs/TESTING.md).

---

## 📚 Technical Documentation

Complete software engineering documentation is organized inside the [`docs/`](docs/) directory:
- [**Software Requirements Specification (SRS)**](docs/SRS.md): IEEE 830 compliant functional and non-functional specifications.
- [**System Architecture Documentation**](docs/ARCHITECTURE.md): Component diagrams, Entity Relationship Diagram (ERD), circulation state transitions, and RESTful API matrix.
- [**Software Testing Specifications**](docs/TESTING.md): White-box CFG, cyclomatic complexity calculations, independent basis paths, and black-box ECP/BVA test cases.
- [**Risk Mitigation, Monitoring & Management (RMMM)**](docs/RMMM.md): Risk assessment matrix, concurrency safeguards, security escalation controls, and disaster recovery.

---

## 📄 License
This project is developed for educational and academic college administration purposes.
