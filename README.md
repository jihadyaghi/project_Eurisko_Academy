# Internal Operations Service Hub
## Overview
The Internal Operations Service Hub is a company-internal system for requesting and tracking help from departments such as IT, HR, and Finance.
The product provides employees with one central place to submit and follow internal service requests while helping internal department staff handle requests with clear status and ownership.
The current implementation contains:
- A full-stack Service Request lifecycle flow.
- An AI-assisted Request Intake capability.
The application is built with React, NestJS, Prisma, SQLite, Vitest, and OpenRouter.


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
The current implementation includes:
- A full-stack Service Request lifecycle flow.
- An AI-assisted Request Intake capability.
The Service Request flow is:
```text
React Frontend → NestJS API → DTO Validation → Authorization → Lifecycle Business Rules → Prisma → SQLite → API Response → React UI Update
```
The AI-assisted intake flow is:
```text
Employee Free Text → React Frontend → NestJS API → AI Provider → Structured Candidate → Backend Validation → Product-Safe Suggestion → React UI
```
The AI is advisory only. Product-owned rules and final application authority remain in the backend.


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
- Deterministic AI evaluation set
### AI
- OpenRouter
- OpenAI-compatible SDK
- Deterministic AI provider for repeatable evaluation


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
│   ├── week4-production-ai.md
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
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   │
│   │   ├── service-requests/
│   │   │   ├── dto/
│   │   │   ├── enums/
│   │   │   ├── models/
│   │   │   ├── service-requests.controller.ts
│   │   │   ├── service-requests.service.ts
│   │   │   ├── service-requests.module.ts
│   │   │   ├── service-requests.service.spec.ts
│   │   │   └── service-requests.integration.spec.ts
│   │   │
│   │   └── request-intake/
│   │       ├── dto/
│   │       ├── enums/
│   │       ├── providers/
│   │       │   ├── ai-intake-provider.interface.ts
│   │       │   ├── deterministic-ai-intake.provider.ts
│   │       │   └── openrouter-ai-intake.provider.ts
│   │       ├── request-intake.controller.ts
│   │       ├── request-intake.service.ts
│   │       ├── request-intake.module.ts
│   │       ├── request-intake.service.spec.ts
│   │       └── request-intake.eval.spec.ts
│   │
│   ├── test/
│   │   └── service-requests.e2e.spec.ts
│   │
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   └── App.css
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
- [`week4-production-ai.md`](docs/week4-production-ai.md) — Documents the Week 4 AI-assisted Request Intake capability, provider boundary, runtime validation, failure handling, AI evaluation set, and authority model.


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
Seed the development database with sample data:
```bash
npm run db:seed
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


# AI-Assisted Request Intake
The Week 4 capability accepts employee free text and returns a structured product suggestion.
## Analyze a Request
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
The AI result is advisory and does not automatically create or mutate a Service Request.

# AI Product Rules
The application owns the allowed values.
Departments:
```text
IT
HR
Finance
```
Categories:
```text
IT:
hardware
software
access

HR:
employment_document
leave
employee_support


Finance:
reimbursement
payroll
expense
```
Priorities:
```text
low
normal
high
```
The backend validates both individual values and department/category relationships before accepting an AI candidate.


# AI Failure Handling
If the AI provider returns invalid product values, the backend rejects the candidate.
If the AI provider is unavailable or fails unexpectedly, the backend returns:
```text
HTTP 502 Bad Gateway
AI assistance is temporarily unavailable
```
AI failures do not modify Service Request state. 

# Automated Tests
From the `backend` directory, run:
```bash
npm test
```
The full regression suite covers:
- Service Request business rules
- Valid lifecycle transitions
- Invalid lifecycle transitions
- Database integration
- End-to-end HTTP behavior
- Handler authorization behavior
- Regression protection
- Invalid AI output
- AI provider failure
- Department/category cross-field validation
- AI evaluation cases

# AI Evaluation Set
Run the focused AI evaluation suite with:
```bash
npm run ai:eval
```
The current evaluation set contains seven representative cases:
1. Clear IT request
2. Clear HR request
3. Clear Finance request
4. Urgent IT request
4. Thin input
5. Ambiguous input
6. Untrusted / unsupported instruction


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
| Clear IT AI input                      | IT / hardware        |
| Clear HR AI input                      | HR / employment_document |
| Clear Finance AI input                 | Finance / reimbursement  |
| Ambiguous AI input                     | Manual review            |
| Invalid AI product value               | Rejected                 |
| External AI provider failure           | Stable 502 response      |


# Week 3 → Week 4 Evolution
Week 3 established the integrated deterministic product slice:
```text
React → NestJS → Validation → Authorization → Business Rules → Prisma → SQLite → Automated Verification
```
Week 4 adds a bounded AI capability:
```text
Employee Free Text → React → NestJS → AI Provider → Structured Candidate → Backend Validation → Product-Safe Suggestion
```
The AI capability complements the deterministic application behavior rather than replacing it.
