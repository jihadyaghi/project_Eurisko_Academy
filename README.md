# Internal Operations Service Hub
## Overview
The Internal Operations Service Hub is a company-internal system for requesting and tracking help from departments such as IT, HR, and Finance.
The product provides employees with one central place to submit internal service requests while giving department handlers a structured workflow for receiving, claiming, processing, and completing those requests.
The current implementation includes:
- JWT-based authentication.
- Role-based authorization.
- Separate Employee, Handler, and Administrator workflows.
- AI-assisted Request Intake.
- Persistent Service Request creation.
- Department-based routing.
- Handler request assignment.
- Controlled lifecycle transitions.
- Status-change audit history.
- Automated unit, integration, AI evaluation, and end-to-end testing.
The application is built with React, NestJS, Prisma, SQLite, Vitest, OpenRouter, and Resend.

## Live Production Release
The final system is deployed and publicly accessible.
- **Frontend:** https://project-eurisko-academy.vercel.app/
- **Backend:** https://projecteuriskoacademy-production.up.railway.app
- **Health Check:** https://projecteuriskoacademy-production.up.railway.app/health
- **Repository:** https://github.com/jihadyaghi/project_Eurisko_Academy
- **Release Date:** September 29, 2026
The final submitted commit SHA is recorded after the final documentation and README commit.
Release, health-check, recovery, and operational handoff details are documented in [`docs/week5-release-operations.md`](docs/week5-release-operations.md).

## Problem
Internal requests are often communicated through unstructured channels such as messages, email threads, or verbal communication.
This can cause requests to:
- Be forgotten.
- Be sent to the wrong person.
- Have unclear ownership.
- Have unclear status.
- Be difficult to track.
The Internal Operations Service Hub provides a structured foundation for submitting, routing, assigning, processing, and tracking these requests.

## Current Product Flow
The final product exposes three authenticated workspaces:
```text
Login
  ↓
Backend Session Validation
  ↓
Authenticated Role
  ├── EMPLOYEE → Employee Portal
  │                 ↓
  │          AI-Assisted Intake
  │                 ↓
  │            Human Review
  │                 ↓
  │          Submit / Track Request
  │
  ├── HANDLER → Department Inbox
  │                 ↓
  │            Claim Request
  │                 ↓
  │        Start / Complete Work
  │                 ↓
  │          Audit History Update
  │                 ↓
  │       Completion Email Attempt
  │
  └── ADMIN → Admin Portal
                    ↓
              Manage Users
                    ↓
       Create / Activate / Deactivate
```
The backend remains authoritative for authentication, authorization, validation, lifecycle rules, user administration, and persistence.
AI is advisory only. Email notification delivery is secondary to the core request transaction: a notification failure does not roll back an already completed request.

## Technology Stack
 ### Frontend
 - React
 - TypeScript
 - Vite
 ### Backend
 - NestJS
 - TypeScript
 - Passport
 - JWT
 - bcrypt
 ### Database
 - SQLite
 - Prisma ORM
 ### Validation
 - NestJS ValidationPipe
 - class-validator
 - class-transformer
 ### Testing
 - Vitest
 - Supertest
 - Isolated SQLite test database
 - Deterministic AI evaluation set
 ### AI
 - OpenRouter
 - OpenAI-compatible SDK
 - Deterministic AI provider for repeatable evaluation

## Repository Structure
```text
.
├── README.md
│
├── docs/
│   ├── product-spec.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── week2-agentic-workflow.md
│   ├── week3-full-stack-delivery.md
│   ├── week4-production-ai.md
│   ├── week5-release-operations.md

│   ├── product-enhancements.md
│   └── decisions/
│       └── ADR-001.md
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── auth/
│   │   ├── prisma/
│   │   ├── service-requests/
│   │   └── request-intake/
│   │
│   ├── test/
│   │   └── service-requests.e2e.spec.ts
│   │
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── pages/
    │   ├── styles/
    │   ├── types/
    │   ├── utils/
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    │
    └── package.json
```

## Documentation
The repository contains the following project documentation:
- [`product-spec.md`](docs/product-spec.md) — Defines the product problem, actors, requirements, constraints, non-goals, and acceptance criteria.
- [`architecture.md`](docs/architecture.md) — Describes the current system architecture, trust boundaries, authentication, authorization, persistence, and AI boundary.
- [`data-model.md`](docs/data-model.md) — Describes the current persistent entities, relationships, lifecycle state, ownership, and audit history.
- [`ADR-001.md`](docs/decisions/ADR-001.md) — Records the decision to centralize business rules and authorization in the application layer.
- [`week2-agentic-workflow.md`](docs/week2-agentic-workflow.md) — Documents the Week 2 Understand → Direct → Prove workflow.
- [`week3-full-stack-delivery.md`](docs/week3-full-stack-delivery.md) — Documents the Week 3 integrated full-stack delivery.
- [`week4-production-ai.md`](docs/week4-production-ai.md) — Documents the Week 4 production-oriented AI capability and evaluation approach.
- [`week5-release-operations.md`](docs/week5-release-operations.md) — Documents the final production release, health checks, release gate, operational recovery, smoke testing, and engineering handoff.

- [`product-enhancements.md`](docs/product-enhancements.md) — Documents additional product and engineering enhancements implemented beyond the core assignment.

## Installation
 ### Prerequisites
 Install:
 - Node.js
 - npm
 Clone the repository and enter the project directory.
 ### Backend Setup
 From the repository root:
 ```bash
 cd backend
 ```
 Install backend dependencies:
 ```bash
 npm install
 ```
 Generate the Prisma client:
 ```bash
 npx prisma generate
 ```
 Apply database migrations:
 ```bash
 npx prisma migrate dev
 ```
 Seed the development database:
 ```bash
 npm run db:seed
 ```
 Start the NestJS backend:
 ```bash
 npm run start:dev
 ```
 The backend runs by default at:
 ```text
 http://localhost:3000
 ```
 ### Frontend Setup
 Open another terminal from the repository root:
 ```bash
 cd frontend
 ```
 Install frontend dependencies:
 ```bash
 npm install
 ```
 Start the React development server:
 ```bash
 npm run dev
 ```
 The frontend runs by default at:
 ```text
 http://localhost:5173
 ```
 Open that URL in a browser to use the application.

## Authentication
The current application uses JWT-based authentication.
Authentication flow:
```text
Email + Password -> User Lookup -> bcrypt Password Verification -> JWT Access Token -> Authenticated API Requests
```
The backend derives protected user identity from the verified JWT.
The client does not provide trusted employee or handler identity for protected business operations.
 ### Login
 ```http
 POST /auth/login
 ```
 Example request:
 ```json
 {
   "email": "employee@example.com",
   "password": "password123"
 }
 ```
 A successful login returns an access token and authenticated user information.
 ### Current User
 ```http
 GET /auth/me
 ```
 Requires:
 ```http
 Authorization: Bearer <access-token>
 ```
 This endpoint returns the currently authenticated user.

## Roles and Authorization
The final application contains three roles:
```text
EMPLOYEE
HANDLER
ADMIN
```
 ### Employee
 An employee can authenticate, use AI-assisted Request Intake, submit Service Requests, view their own requests and request details, inspect status history, and receive a completion email when a request is completed.
 ### Handler
 A handler can authenticate, access the inbox for their assigned department, view department request details, claim an unassigned request, and move an assigned request through valid lifecycle states.
 ## Administrator
 An administrator can authenticate, access the Admin Portal, view system users and user statistics, create employee and handler accounts, assign handlers to departments, and activate or deactivate employee and handler accounts.
 The initial administrator is provisioned separately through a privileged bootstrap process. Normal user-management operations do not create additional administrators, and administrator accounts cannot be deactivated through the normal account-status endpoint.
Backend authorization remains authoritative. Hiding an action in the frontend is not treated as a security boundary.

## Service Request API
 ### Create Service Request
 ```http
 POST /service-requests
 ```
 Requires an authenticated `EMPLOYEE`.
 Example request:
 ```json
 {
   "title": "Laptop issue preventing work",
   "description": "My laptop keeps shutting down and I cannot work.",
   "departmentId": 1,
   "category": "hardware",
   "priority": "high"
 }
 ```
 The employee does not provide:
 ```text
 employeeId
 handlerId
 status
 ```
 The backend determines the initial ownership and state:
 ```text
 employeeId = authenticated employee
 handlerId = null
 status = submitted
 ```
 ### Employee My Requests
 ```http
 GET /service-requests/my
 ```
 Requires an authenticated `EMPLOYEE` and returns only requests owned by the authenticated employee.
 ### Get One Service Request
 ```http
 GET /service-requests/:id
 ```
 Example:
 ```text
 GET http://localhost:3000/service-requests/1
 ```
 ### Handler Department Inbox
 ```http
 GET /service-requests/handler/inbox
 ```
 Requires an authenticated `HANDLER`.
 The backend uses the handler's authenticated department to determine which requests belong in the inbox.
 The client does not select another department for authorization purposes.
 ## Claim Service Request
 ```http
 PATCH /service-requests/:id/assign
 ```
 Requires an authenticated `HANDLER`.
 The backend verifies that:
 - The handler belongs to a department.
 - The request belongs to the same department.
 - The request is currently unassigned.
 After a successful claim:
 ```text
 handlerId = authenticated handler ID
 ```
 The client does not send a handler ID.
 ### Change Service Request Status
 ```http
 PATCH /service-requests/:id/status
 ```
 Requires an authenticated `HANDLER`.
 Example request body:
 ```json
 {
   "status": "in_progress"
 }
 ```
 The handler identity comes from the authenticated JWT rather than the request body.

## Service Request Lifecycle
The current lifecycle is:
```text
submitted -> in_progress -> completed
```
Valid transitions:
```text
submitted → in_progress
in_progress → completed
```
Examples of invalid transitions:
```text
submitted → completed
completed → in_progress
```
Invalid lifecycle transitions return:
```text
HTTP 400 Bad Request
```
The rejected transition does not modify the persisted Service Request.

## Authorization Rules
Authentication establishes user identity.
Authorization determines which operations that identity may perform.
The main handler ownership rule is:
> Only the assigned authenticated handler can change the status of a Service Request.
For example:
```text
Request handlerId = 201
Authenticated handler ID = 201
```
A valid lifecycle transition is allowed.
If:
```text
Request handlerId = 201
Authenticated handler ID = 202
```
the operation is rejected with:
```text
HTTP 403 Forbidden
```
Handler identity is derived from the verified JWT and is not accepted from the status-transition request body.

## Department Authorization
Handlers are associated with departments.
Current departments include:
```text
IT
HR
Finance
```
A handler may claim a request only when:
```text
handler.departmentId = serviceRequest.departmentId
```
This prevents a handler from claiming requests belonging to another department.

## AI-Assisted Request Intake
The AI-assisted Request Intake capability accepts employee free text and returns a structured product suggestion.
 ### Analyze Request
 ```http
 POST /request-intake/analyze
 ```
 Example request:
 ```json
 {
   "text": "My laptop keeps shutting down and I cannot work."
 }
 ```
 Example successful response:
 ```json
 {
   "department": "IT",
   "category": "hardware",
   "priority": "high",
   "summary": "Laptop issue preventing the employee from working.",
   "needsReview": false
 }
 ```
 For ambiguous or insufficient input:
 ```json
 {
   "department": null,
   "category": null,
   "priority": "normal",
   "summary": "Employee needs unspecified assistance.",
   "needsReview": true
 }
 ```

## Administrator and Account Management
The final system includes a dedicated `ADMIN` role and Admin Portal for user provisioning and account access management.
Administrator operations are protected by backend `ADMIN` authorization. The administrator can create employee and handler accounts, assign handler departments, and activate or deactivate employee and handler accounts. Inactive users are rejected during authentication.
The first administrator is provisioned separately using environment-supplied bootstrap credentials rather than through the normal user-creation flow.

## Completion Email Notifications
When an assigned handler successfully completes a Service Request, the durable request state and status history are committed first. The system then attempts to send a completion email to the employee through the notification provider boundary.
```text
Persist completion + audit history
        ↓
Commit transaction
        ↓
Attempt completion email
        ↓
Resend provider
```
Notification delivery is intentionally non-blocking with respect to the authoritative request lifecycle. If the external email provider fails, the request remains completed and its audit history remains valid. Automated tests mock notification delivery rather than sending real email.

## Automated Tests
From the `backend` directory, run:
```bash
npm test
```
The automated suite covers behavior including:
- Service Request creation.
- Department validation.
- Valid lifecycle transitions.
- Invalid lifecycle transitions.
- Handler assignment.
- Cross-department assignment rejection.
- Already-assigned request rejection.
- Department inbox behavior.
- Handler authorization.
- Database integration.
- Audit-history persistence.
- AI output validation.
- AI provider failure.
- Department/category cross-field validation.
- End-to-end HTTP behavior.

## AI Evaluation Set
Run the focused AI evaluation suite with:
```bash
npm run ai:eval
```
The current evaluation set contains seven representative cases:
1. Clear IT request.
2. Clear HR request.
3. Clear Finance request.
4. Urgent IT request.
5. Thin input.
6. Ambiguous input.
7. Untrusted or unsupported instruction.
The evaluation set provides repeatable evidence for expected AI-assisted intake behavior.

## Project Evolution
 ### Week 1
 Established product understanding, architecture boundaries, and the decision to centralize business rules and authorization in the application layer.
 ### Week 2
 Established the deterministic Service Request workflow using the:
 ```text
 Understand → Direct → Prove
 ```
 approach.
 ### Week 3
 Delivered the first integrated full-stack Service Request slice:
 ```text
 React
 → NestJS
 → Validation
 → Authorization
 → Business Rules
 → Prisma
 → SQLite
 → Automated Verification
 ```
 ### Week 4
 Added bounded AI-assisted Request Intake:
 ```text
 Employee Free Text
 → AI Provider
 → Structured Candidate
 → Backend Validation
 → Product-Safe Suggestion
 ```
 ### Week 5
 Prepared the final system for production release and engineering handoff.
 The final release includes:
 - Public frontend deployment on Vercel.
 - Backend deployment on Railway.
 - Production health verification.
 - Release-gate and smoke-test guidance.
 - Operational failure and recovery procedures.
 - Final documentation and evidence mapping.
 See [`docs/week5-release-operations.md`](docs/week5-release-operations.md) for the release and operations handoff.
 ### Additional Product Enhancements
 The project was extended beyond the core slice with:
 - Relational users and departments.
 - JWT authentication.
 - bcrypt password hashing.
 - Role-based authorization.
 - Authenticated identity.
 - Employee request submission.
 - Department handler inbox.
 - Request claiming.
 - Transactional audit history.
 - Full product-flow E2E testing.
 - Role-oriented frontend portals.
 - Modular frontend organization.
Detailed enhancement documentation is available in:
 ```text
 docs/product-enhancements.md
 ```
## Current Scope Boundaries
The final implementation intentionally does not include:
- Dedicated approval workflows.
- File attachments.
- Password reset.
- Email verification.
- Refresh tokens.
- OAuth or social login.
- Company SSO.
- Advanced analytics and reporting.
- SLA management.
- Multi-tenant architecture.
- Chat or messaging between employees and handlers.
- Push or SMS notifications.
- Administrator management of the Service Request lifecycle.
- Fully autonomous AI request handling.
Current external integrations are intentionally bounded: OpenRouter supports advisory AI-assisted intake, and Resend supports completion email delivery. Neither external provider owns authorization or core lifecycle decisions.

# Final Current Flow
```text
Employee
   ↓
Login → Employee Portal
   ↓
AI-Assisted Request Intake
   ↓
Human Review
   ↓
Submit Service Request
   ↓
Backend Validation / Authorization
   ↓
Prisma / SQLite
   ↓
Department Queue
   ↓
Handler Login → Department Inbox
   ↓
Claim Request
   ↓
submitted → in_progress → completed
   ↓
Transactional Audit History
   ↓
Completion Email Attempt via Resend

Administrator
   ↓
Login → Admin Portal
   ↓
View / Create / Activate / Deactivate Users
```
The result is a small but complete internal operations workflow with explicit responsibility boundaries, deterministic business rules, persistent state, bounded AI assistance, authenticated and role-based access, administrator user management, completion email notifications, automated verification, and a documented production release and operations handoff.
