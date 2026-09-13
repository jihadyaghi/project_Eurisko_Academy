# Internal Operations Service Hub
## Overview
The Internal Operations Service Hub is a company-internal system for requesting and tracking help from departments such as IT, HR, and Finance.
The product provides employees with one central place to submit and follow internal service requests while helping internal department staff handle requests with clear status and ownership.
The current implementation contains one integrated Service Request lifecycle slice built with React, NestJS, Prisma, and SQLite.


## Problem
Internal requests are often communicated through unstructured channels.
This can cause requests to:
- Be forgotten.
- Be sent to the wrong person.
- Have unclear ownership.
- Have unclear status.
- Have unclear approval progress.
The Internal Operations Service Hub provides a structured foundation for handling these requests.


## Current Product Slice
The current Week 3 implementation provides one narrow full-stack Service Request flow.
```text
React Frontend -> NestJS API -> DTO Validation -> Authorization -> Lifecycle Business Rules -> Prisma -> SQLite -> API Response -> React UI Update
```
The implemented Service Request lifecycle is:
```text
submitted -> in_progress -> completed
```
Valid transitions:
- `submitted` → `in_progress`
- `in_progress` → `completed`
Invalid transitions are rejected by the backend.


## Technology Stack
### Frontend
- React
- TypeScript
- Vite
### Backend
- NestJS
- TypeScript
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


## Repository Structure
```text
.
├── README.md
├── docs/
│   ├── product-spec.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── week2-agentic-workflow.md
│   ├── week3-full-stack-delivery.md
│   └── decisions/
│       └── ADR-001.md
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   └── service-requests/
│   │       ├── dto/
│   │       ├── enums/
│   │       ├── models/
│   │       ├── service-requests.controller.ts
│   │       ├── service-requests.service.ts
│   │       ├── service-requests.module.ts
│   │       ├── service-requests.service.spec.ts
│   │       └── service-requests.integration.spec.ts
│   ├── test/
│   │   └── service-requests.e2e.spec.ts
│   └── package.json
│
└── frontend/
    ├── src/
    │   └── App.tsx
    └── package.json
```


## Documentation
The repository contains the following project documentation:
- [`product-spec.md`](docs/product-spec.md) — Defines the product problem, actors, requirements, constraints, non-goals, and acceptance criteria.
- [`architecture.md`](docs/architecture.md) — Describes the high-level system structure and architectural boundaries.
- [`data-model.md`](docs/data-model.md) — Describes domain entities, relationships, lifecycle rules, and storage reasoning.
- [`ADR-001.md`](docs/decisions/ADR-001.md) — Records the decision to centralize business rules and authorization in the application layer.
- [`week2-agentic-workflow.md`](docs/week2-agentic-workflow.md) — Documents the Week 2 Understand → Direct → Prove workflow.
- [`week3-full-stack-delivery.md`](docs/week3-full-stack-delivery.md) — Documents the Week 3 integrated product slice, API contract, persistence, authorization, failure handling, and automated confidence.


# Installation
## Prerequisites
Install:
- Node.js
- npm
Clone the repository and enter the project directory.

## Backend Setup
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
Apply the database migrations:
```bash
npx prisma migrate dev
```
Start the NestJS backend:
```bash
npm run start:dev
```
The backend runs by default at:
```text
http://localhost:3000
```

## Frontend Setup
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
Open that URL in a browser to exercise the Service Request flow.


# API Contract
## Get All Service Requests
```http
GET /service-requests
```
Example:
```text
http://localhost:3000/service-requests
```

## Get One Service Request
```http
GET /service-requests/:id
```
Example:
```text
http://localhost:3000/service-requests/1
```
Example response:
```json
{
  "id": 1,
  "employeeId": 101,
  "departmentId": 1,
  "handlerId": 201,
  "title": "Laptop Issue",
  "description": "My laptop is not turning on.",
  "status": "submitted"
}
```

## Change Service Request Status
```http
PATCH /service-requests/:id/status
```
Example:
```text
PATCH http://localhost:3000/service-requests/1/status
```
Request body:
```json
{
  "status": "in_progress",
  "handlerId": 201
}
```
A successful request returns the updated Service Request.


# Input Validation
Status-transition requests are validated by the backend.
A valid request requires:
- A valid Service Request status.
- An integer `handlerId`.
Example intentionally invalid request:
```json
{
  "status": "banana",
  "handlerId": 201
}
```
Expected response:
```text
HTTP 400 Bad Request
```
The invalid request is rejected before the Service Request is updated.


# Authorization
The implemented authorization rule is:
> Only the assigned handler can change the status of a Service Request.
For example, if:
```text
handlerId = 201
```
then:
```json
{
  "status": "in_progress",
  "handlerId": 201
}
```
is allowed when the lifecycle transition is valid.
Expected response:
```text
HTTP 200 OK
```
An unauthorized handler:
```json
{
  "status": "in_progress",
  "handlerId": 202
}
```
is rejected.
Expected response:
```text
HTTP 403 Forbidden
```
For this Week 3 slice, `handlerId` is used as a simplified demonstration identity.
A production system would derive the user's identity from a trusted authentication mechanism such as a session or access token.


# Expected Failure Handling
Invalid lifecycle transitions are intentionally rejected.
For example:
```text
completed → in_progress
```
Expected backend response:
```text
HTTP 400 Bad Request
```
The React frontend handles unsuccessful API responses and displays the returned error message to the user.
The rejected transition does not modify the persisted Service Request.


# Database Persistence
Service Requests are persisted in SQLite through Prisma.
```text
NestJS Service -> Prisma -> SQLite
```
Unlike the Week 2 in-memory implementation, Week 3 status changes survive backend restarts.
Database schema changes are managed through Prisma migrations located in:
```text
backend/prisma/migrations/
```


# Automated Tests
From the `backend` directory, run:
```bash
npm test
```
The automated suite covers four important behaviors.
### Business-Rule Test
Verifies that:
```text
completed → in_progress
```
is rejected.
### Database Integration Test
Verifies:
```text
ServiceRequestsService → Prisma → SQLite
```
and confirms that a valid lifecycle transition is persisted.
### End-to-End Test
Sends an HTTP request through the NestJS application and verifies:
```text
HTTP Request → Controller → Validation → Authorization → Service → Prisma → SQLite → HTTP Response
```
### Regression Protection
Protects the existing valid behavior:
```text
submitted → in_progress
```
from being accidentally broken by future changes.
Current verified result:
```text
Test Files  3 passed
Tests       4 passed
```


# Manual Verification
The implemented slice has also been manually verified.
| Scenario | Expected Result |
|---|---|
| `submitted → in_progress` | Accepted |
| `in_progress → completed` | Accepted |
| `submitted → completed` | 400 Bad Request |
| `completed → in_progress` | 400 Bad Request |
| Invalid status such as `banana` | 400 Bad Request |
| Assigned handler changes status | 200 OK |
| Different handler changes status | 403 Forbidden |
| Restart backend after persisted update | State remains stored |


# Week 2 → Week 3 Evolution
Week 2 established the first verified backend lifecycle behavior:
```text
NestJS → In-Memory Data → Manual Verification
```
Week 3 evolves the same behavior into:
```text
React
→ NestJS → Validation → Authorization → Business Rules → Prisma → SQLite → Automated Verification
```
The lifecycle behavior from Week 2 remains protected by automated regression tests.
