# System Architecture Documentation
## College Library Management System (lib-LMS)

---

### 1. High-Level Architecture Overview

The College Library Management System is architected following the standard three-tier MERN (MongoDB, Express.js, React, Node.js) design pattern:

```mermaid
flowchart TB
    subgraph Presentation_Tier ["Client Tier (React 19 + Vite)"]
        UI["React SPA Components & Context"]
        Router["React Router v7"]
        APIService["api.js (Centralized Client Fetcher)"]
        UI --> Router
        Router --> APIService
    end

    subgraph Application_Tier ["Application Tier (Node.js + Express 5)"]
        Middleware["authMiddleware (JWT Verify & RBAC)"]
        Controllers["Controllers (Book, Student, Issue, Report, Dashboard)"]
        FineEngine["fineCalculator.js (Pure Function Engine)"]
        ErrorHandler["Centralized Error Middleware"]

        APIService -->|HTTP/REST with Bearer Token| Middleware
        Middleware --> Controllers
        Controllers --> FineEngine
        Controllers --> ErrorHandler
    end

    subgraph Persistence_Tier ["Database Tier (MongoDB)"]
        DBUser[(Users Collection)]
        DBBook[(Books Collection)]
        DBIssue[(Issues Collection)]
        DBSetting[(Settings Collection)]

        Controllers -->|Mongoose ODM Models| DBUser
        Controllers -->|Mongoose ODM Models| DBBook
        Controllers -->|Mongoose ODM Models| DBIssue
        Controllers -->|Mongoose ODM Models| DBSetting
    end
```

---

### 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ ISSUE : "borrows (student)"
    USER ||--o{ ISSUE : "authorizes (librarian)"
    BOOK ||--o{ ISSUE : "loaned copy"

    USER {
        ObjectId _id PK
        string name
        string email UK "unique, indexed"
        string password "hashed with bcrypt"
        string role "admin | librarian | student"
        string studentId UK "sparse, unique for students"
        string department
        string phone
        boolean isActive "default: true"
        date createdAt
        date updatedAt
    }

    BOOK {
        ObjectId _id PK
        string title
        string author
        string isbn UK "unique, indexed"
        string category
        string publisher
        number totalCopies "min: 1"
        number availableCopies "0 <= available <= total"
        string location
        date createdAt
        date updatedAt
    }

    ISSUE {
        ObjectId _id PK
        ObjectId book FK "references Book"
        ObjectId student FK "references User"
        ObjectId issuedBy FK "references User"
        date issueDate "default: now"
        date dueDate "scheduled deadline"
        date returnDate "actual return"
        string status "issued | returned | overdue"
        number fineAmount "default: 0"
        boolean finePaid "default: false"
        date paidAt
        string notes
        date createdAt
        date updatedAt
    }

    SETTING {
        ObjectId _id PK
        string key UK
        mixed value
        string description
    }
```

---

### 3. Circulation Lifecycle & Concurrency Control

To prevent race conditions during book checkout, the system uses MongoDB's atomic operator `$inc` with a precondition query:

```javascript
// Atomic inventory reduction preventing negative stock under concurrent requests
const book = await Book.findOneAndUpdate(
  { _id: bookId, availableCopies: { $gt: 0 } },
  { $inc: { availableCopies: -1 } },
  { returnDocument: 'after' }
);
```

#### Circulation State Transition Diagram:

```mermaid
stateDiagram-v2
    [*] --> Available: Book Registered in Catalog
    Available --> Issued: Issue book to student (availableCopies - 1)
    
    state Issued {
        [*] --> OnSchedule: issueDate <= now <= dueDate
        OnSchedule --> Overdue: now > dueDate (Auto-marked overdue)
    }

    Issued --> Returned: Return book on or before due date (Fine = ₹0)
    Overdue --> Returned: Return book after due date (Fine = Days * Rate)

    Returned --> [*]: availableCopies + 1 restored to catalog
```

---

### 4. RESTful API Endpoint Matrix

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and issues signed JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current authenticated user profile |
| `PUT` | `/api/auth/profile` | Authenticated | Updates contact details and department |
| `GET` | `/api/books` | Authenticated | Searches and filters catalog with category and availability |
| `GET` | `/api/books/:id` | Authenticated | Detailed book view with loan history count |
| `POST` | `/api/books` | Admin, Librarian | Registers new book title into catalog |
| `PUT` | `/api/books/:id` | Admin, Librarian | Updates book metadata and safe copy counts |
| `DELETE` | `/api/books/:id` | Admin, Librarian | Removes book (blocked if active loans exist) |
| `GET` | `/api/students` | Admin, Librarian | Searches and filters registered students |
| `POST` | `/api/students` | Admin, Librarian | Registers student account with generated password |
| `PUT` | `/api/students/:id` | Admin, Librarian | Updates student details |
| `PATCH` | `/api/students/:id/status`| Admin, Librarian | Toggles student account between Active and Inactive |
| `GET` | `/api/issues` | Admin, Librarian | Lists issues with filters (All, Issued, Overdue, Returned)|
| `POST` | `/api/issues` | Admin, Librarian | Issues an available book copy to an active student |
| `POST` | `/api/issues/:id/return`| Admin, Librarian | Processes return and calculates overdue fine |
| `GET` | `/api/issues/my-loans` | Student | Student self-service view of active books and fines |
| `GET` | `/api/issues/fines` | Admin, Librarian | Retrieves fines ledger with pending/paid filters |
| `PATCH` | `/api/issues/:id/pay-fine`| Admin, Librarian | Records fine payment receipt |
| `GET` | `/api/dashboard/stats` | Admin, Librarian | Aggregated KPI stats and recent activity stream |
| `GET` | `/api/reports` | Admin, Librarian | Date-bounded and category-filtered audit report |
| `GET` | `/api/health` | Public | Operational heartbeat monitor |
