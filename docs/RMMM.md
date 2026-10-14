# Risk Mitigation, Monitoring, and Management (RMMM) Plan
## College Library Management System (lib-LMS)

---

### 1. Introduction

The Risk Mitigation, Monitoring, and Management (RMMM) plan establishes proactive measures to identify, assess, track, and manage potential risks throughout the lifecycle of the College Library Management System. The objective is to protect data integrity, ensure high circulation availability, secure student records, and avoid financial disputes over overdue library fines.

---

### 2. Risk Identification & Categorization

| Risk ID | Category | Risk Description | Root Cause |
| :--- | :--- | :--- | :--- |
| **R-01** | Technical / Concurrency | Book stock over-allocation when multiple staff issue the last available copy concurrently. | Unsafe non-atomic read-then-write updates. |
| **R-02** | Security | Token forgery or privilege escalation allowing unauthorized student access to admin circulation desk. | Weak secret keys or missing RBAC route middleware. |
| **R-03** | Operational / Financial | Overdue fine miscalculation disputes and duplicate fine assessments. | Non-standard date parsing and time-zone drift across client/server. |
| **R-04** | Technical / Database | MongoDB service downtime causing circulation desk lockup during peak hours. | Unmonitored standalone database process or memory exhaustion. |
| **R-05** | Data Integrity | Duplicate student IDs or ISBN records polluting catalog search results. | Lack of database unique indexes and pre-validation. |

---

### 3. Risk Assessment Matrix

Risk Exposure is quantified as:
$$\text{Risk Exposure (RE)} = \text{Probability (P)} \times \text{Impact (I)}$$

Where:
- **Probability (P)**: 1 (Rare) to 5 (Frequent)
- **Impact (I)**: 1 (Minor) to 5 (Catastrophic)

| Risk ID | Risk Description | Probability (1-5) | Impact (1-5) | Severity Score | Priority Level |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **R-01** | Inventory Race Condition Over-Allocation | 3 | 4 | **12** | High |
| **R-02** | Unauthorized Role Escalation | 2 | 5 | **10** | High |
| **R-03** | Fine Calculation Discrepancies | 3 | 3 | **9** | Medium |
| **R-04** | Database Service Downtime | 2 | 4 | **8** | Medium |
| **R-05** | Duplicate Record Collisions | 2 | 3 | **6** | Low |

```mermaid
quadrantChart
    title Risk Assessment Quadrant
    x-axis Low Impact --> High Impact
    y-axis Low Probability --> High Probability
    quadrant-1 Monitor & Plan
    quadrant-2 Immediate Mitigation Required
    quadrant-3 Low Priority
    quadrant-4 Contingency Focus
    R-01 (Inventory Over-allocation): [0.75, 0.60]
    R-02 (Privilege Escalation): [0.90, 0.40]
    R-03 (Fine Calculation Drift): [0.55, 0.60]
    R-04 (Database Downtime): [0.80, 0.35]
    R-05 (Duplicate Record Collisions): [0.50, 0.35]
```

---

### 4. Detailed RMMM Strategies

#### Risk R-01: Inventory Race Condition Over-Allocation
- **Mitigation (Prevention)**:
  - Eliminate multi-step read-modify-write patterns.
  - Implement atomic database queries via MongoDB `$inc` with strict filter conditions:
    ```javascript
    Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { returnDocument: 'after' }
    );
    ```
- **Monitoring (Detection)**:
  - Automated database invariant validation: `availableCopies <= totalCopies && availableCopies >= 0`.
  - Log any failed checkout where `availableCopies === 0`.
- **Management (Contingency)**:
  - If a discrepancy occurs, run an automated inventory reconciliation script comparing total copies minus active issue documents.

---

#### Risk R-02: Unauthorized Role Escalation
- **Mitigation (Prevention)**:
  - Use cryptographically signed JWT tokens with non-trivial secret keys (`JWT_SECRET`) loaded from environment variables.
  - Enforce layered role-based access control (RBAC) via Express middleware on every sensitive route:
    ```javascript
    router.use(protect, authorize('admin', 'librarian'));
    ```
  - Hash all passwords with bcryptjs (minimum 10 salt rounds) and configure Mongoose schema with `select: false` so password hashes are never serialized.
- **Monitoring (Detection)**:
  - Log repeated 401 Unauthorized and 403 Forbidden responses to security audit logs.
- **Management (Contingency)**:
  - Immediate rotation of `JWT_SECRET` in environment configuration, invalidating all existing active sessions.

---

#### Risk R-03: Fine Calculation Discrepancies
- **Mitigation (Prevention)**:
  - Encapsulate overdue fine calculation inside a pure, deterministic utility function (`calculateOverdueFine`).
  - Normalize both due dates and return dates to UTC midnight (`00:00:00.000`) before calculating day differences, preventing fractional day overcharging.
  - Check return status (`status !== 'returned'`) before applying fine to prevent duplicate penalties.
- **Monitoring (Detection)**:
  - Include automated boundary value unit tests verifying $Due - 1$, $Due$, and $Due + 1$ day scenarios in the CI pipeline.
- **Management (Contingency)**:
  - Provide authorized librarians with an audit ledger to review fine computation history and issue administrative fee waivers if necessary.

---

#### Risk R-04: Database Service Downtime
- **Mitigation (Prevention)**:
  - Implement resilient MongoDB connection retry logic with event listeners (`connected`, `error`, `disconnected`).
  - Deploy MongoDB with local replica set or automated process supervisor (e.g., systemd / launchd).
- **Monitoring (Detection)**:
  - Health check endpoint `/api/health` providing active system ping and database connectivity verification.
- **Management (Contingency)**:
  - Automated restart scripts and regular database backup dumps (`mongodump`).

---

#### Risk R-05: Duplicate Record Collisions
- **Mitigation (Prevention)**:
  - Enforce unique compound indexes in MongoDB schemas on `email`, `studentId`, and `isbn`.
  - Sanitize and normalize string casing (e.g. `toUpperCase()` for ISBN and Student ID, `toLowerCase()` for Email) prior to database insertion.
- **Monitoring (Detection)**:
  - Centralized error handler catches MongoDB error code `11000` and transforms it into user-friendly validation messages indicating the exact duplicate field.
- **Management (Contingency)**:
  - Immediate rollback of failed creation attempts without partial writes.
