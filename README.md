# Internal Operations Service Hub
## Overview
The Internal Operations Service Hub is a company-internal system for requesting and tracking help from departments such as IT, HR, and Finance.
The product aims to provide employees with one central place to submit and follow internal service requests, while helping internal department staff handle requests with clear status, ownership, and approval progress.

## Problem
Internal requests are often communicated through unstructured channels, which can cause requests to be forgotten, sent to the wrong person, or become unclear in terms of ownership, status, and approval.
This project defines the product foundation for a more structured internal request-handling system.

## Documentation
The repository contains the following product and implementation documents:
- [`product-spec.md`](docs/product-spec.md) — Defines the problem, actors, requirements, constraints, non-goals, and acceptance criteria.
- [`architecture.md`](docs/architecture.md) — Describes the high-level system structure, responsibilities, data flows, trust boundaries, resilience considerations, and architecture decisions.
- [`data-model.md`](docs/data-model.md) — Describes the domain entities, relationships, lifecycle rules, storage reasoning, and important access patterns.
- [`ADR-001.md`](docs/decisions/ADR-001.md) — Records an important architecture decision and its consequences.
- [`week2-agentic-workflow.md`](docs/week2-agentic-workflow.md) — Documents the Week 2 Understand → Direct → Prove workflow and implementation verification evidence.

## Repository Structure
```text
.
├── README.md
├── docs/
│   ├── product-spec.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── week2-agentic-workflow.md
│   └── decisions/
│       └── ADR-001.md
└── backend/
    ├── src/
    │   ├── main.ts
    │   ├── app.module.ts
    │   └── service-requests/
    │       ├── enums/
    │       │   └── service-request-status.enum.ts
    │       ├── models/
    │       │   └── service-request.model.ts
    │       ├── service-requests.controller.ts
    │       ├── service-requests.service.ts
    │       ├── service-requests.module.ts
    │       └── service-requests.data.ts
    ├── test/
    └── package.json
```

## Week 2 — First Verified Implementation
Week 2 implements a small bounded backend behavior for the Service Request lifecycle using NestJS and in-memory data.
The implementation focuses only on the lifecycle transition behavior and does not introduce a frontend, database, authentication, or production infrastructure.
### Implemented Lifecycle
The following Service Request states are used in this implementation slice:
- `submitted`
- `in_progress`
- `completed`
Valid transitions:
- `submitted` → `in_progress`
- `in_progress` → `completed`
Invalid transitions, including the following examples, are rejected:
- `submitted` → `completed`
- `completed` → `in_progress`
A Service Request status is updated only after the requested transition has been validated.

## Run the Backend
### Prerequisites
- Node.js
- npm
From the repository root, navigate to the backend directory:
```bash
cd backend
```
Install dependencies:
```bash
npm install
```
Start the NestJS application in development mode:
```bash
npm run start:dev
```
The backend runs by default on:
```text
http://localhost:3000
```

## API Endpoints
The Week 2 implementation exposes the following endpoints:
```text
GET   /service-requests
GET   /service-requests/:id
PATCH /service-requests/:id/status
```
### Get All Service Requests
```text
GET http://localhost:3000/service-requests
```
This returns the Service Requests currently stored in memory.
### Get One Service Request
```text
GET http://localhost:3000/service-requests/1
```
This returns the Service Request with the specified ID.
### Transition a Service Request Status
```text
PATCH http://localhost:3000/service-requests/1/status
```

## Verify the Implementation
The lifecycle behavior can be verified through valid and invalid transition cases.
### Valid Transition
Given Service Request `1` is currently:
```text
submitted
```
Send:
```text
PATCH /service-requests/1/status
```
with:
```json
{
  "status": "in_progress"
}
```
Expected result:

```text
HTTP 200
```
The Service Request status changes from:
```text
submitted → in_progress
```
The second valid lifecycle transition is:
```text
in_progress → completed
```
and should also be accepted.
### Invalid Transition
Given a Service Request is currently `submitted`, attempt:
```text
submitted → completed
```
The expected result is:
```text
HTTP 400 Bad Request
```
The invalid transition is rejected and the Service Request status remains unchanged.
A transition from:
```text
completed → in_progress
```
is also rejected with an HTTP `400 Bad Request`.

## Verification Summary
The Week 2 implementation verifies that:
- `submitted` → `in_progress` is accepted.
- `in_progress` → `completed` is accepted.
- `submitted` → `completed` is rejected.
- `completed` → `in_progress` is rejected.
- Invalid transitions do not update the Service Request status.
- The Service Request lifecycle invariant is preserved.
Detailed verification evidence and the implementation workflow are documented in [`docs/week2-agentic-workflow.md`](docs/week2-agentic-workflow.md).