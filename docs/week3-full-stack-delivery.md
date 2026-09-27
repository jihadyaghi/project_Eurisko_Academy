# Week 3 Full-Stack Delivery
## Historical Milestone Note
This document records the Week 3 implementation as it existed at that stage of the project.
Week 3 focused on evolving the Week 2 backend lifecycle behavior into a narrow full-stack vertical slice using:
```text
React
NestJS
Prisma
SQLite
Automated Tests
```
At this stage, authentication had not yet been replaced with the later JWT-based identity model.
The Week 3 status-transition demonstration therefore used a client-provided `handlerId` to demonstrate the backend authorization rule.
Later project stages replaced this simplified identity mechanism with authenticated JWT identity and introduced stronger role, ownership, department, and assignment authorization.
The unrestricted:
```http
GET /service-requests
```
used during this milestone was also removed later as part of authorization hardening.
This document preserves the original Week 3 implementation evidence rather than rewriting the milestone to match the final architecture.

## 1. Overview
Week 3 extended the existing Internal Operations Service Hub with one narrow, user-facing Service Request flow.
The goal of this milestone was to connect the frontend, backend, business rules, authorization, and a real database into one integrated product slice.
The implemented flow connected:
```text
React Frontend
      ↓
NestJS Backend
      ↓
Validation
      ↓
Authorization
      ↓
Business Rules
      ↓
Prisma
      ↓
SQLite Database
      ↓
API Response
      ↓
React UI Update
```
The selected behavior remained the Service Request lifecycle transition.
Supported lifecycle states:
- `submitted`
- `in_progress`
- `completed`
Supported valid transitions:
```text
submitted -> in_progress
in_progress -> completed
```
Invalid lifecycle transitions were rejected.

## 2. Integrated Product Slice
The Week 3 product slice allowed a user to retrieve a Service Request and change its lifecycle status through the React frontend.
The same flow crossed all application layers:
```text
React
  ↓
HTTP API
  ↓
NestJS Controller
  ↓
DTO Validation
  ↓
Service Layer
  ↓
Authorization
  ↓
Lifecycle Validation
  ↓
Prisma
  ↓
SQLite
```
This was intentionally a narrow vertical slice rather than an implementation of the entire Internal Operations Service Hub.

## 3. Technology Stack
The integrated slice used:
 ### Frontend
 - React
 - TypeScript
 - Vite
 ### Backend
 - NestJS
 - TypeScript
 ### Persistence
 - Prisma ORM
 - SQLite
 ### Validation
 - `class-validator`
 - `class-transformer`
 - NestJS `ValidationPipe`
 ### Automated Testing
 - Vitest
 - Supertest

## 4. Service Request Lifecycle
The Service Request lifecycle implemented in this slice was:
```text
submitted
    ↓
in_progress
    ↓
completed
```
Valid transitions:
```text
submitted -> in_progress
in_progress -> completed
```
Examples of invalid transitions:
```text
submitted -> completed
completed -> in_progress
```
Lifecycle rules were enforced in the backend Service Layer.
The frontend was not trusted to decide whether a transition was valid.

## 5. Full-Stack User Flow
The Week 3 user-facing flow worked as follows:
1. React requested a Service Request from the NestJS API.
2. NestJS retrieved the Service Request from SQLite through Prisma.
3. React displayed the Service Request information.
4. The user requested a status change.
5. React sent a `PATCH` request to the backend.
6. NestJS validated the request body.
7. The Service Layer verified that the requesting handler identity matched the assigned handler.
8. The Service Layer verified that the requested lifecycle transition was valid.
9. Prisma persisted the valid status change in SQLite.
10. NestJS returned the updated Service Request.
11. React updated the displayed state using the API response.
The resulting flow was:
```text
User Action
    ↓
React
    ↓
PATCH API Request
    ↓
NestJS Controller
    ↓
DTO Validation
    ↓
Authorization
    ↓
Lifecycle Business Rule
    ↓
Prisma
    ↓
SQLite
    ↓
Updated API Response
    ↓
React UI Update
```

## 6. Week 3 API Contract
The frontend and backend communicated through an explicit HTTP request and response contract.
 ### Retrieve All Service Requests
 ```http
 GET /service-requests
 ```
 At the Week 3 stage, this endpoint returned the stored Service Requests used by the vertical slice.
 > **Later evolution:** This unrestricted endpoint was removed during later authorization hardening. The final system exposes request data through authorized employee and handler workflows instead.
 ### Retrieve One Service Request
 ```http
 GET /service-requests/:id
 ```
 At this stage, this endpoint supported the Week 3 frontend flow.
 > **Later evolution:** Request-detail access was later protected by JWT authentication and ownership/department authorization.
 ### Change Service Request Status
 ```http
 PATCH /service-requests/:id/status
 ```
 The Week 3 request contract required:
 - `status` to be a valid Service Request status.
 - `handlerId` to be an integer.
 Example:
 ```json
 {
   "status": "in_progress",
   "handlerId": 201
 }
 ```
 > **Later evolution:** `handlerId` was later removed from the client-controlled status-transition body. The final implementation derives the handler identity from the authenticated JWT.

## 7. Real Database Persistence
Week 2 used in-memory Service Request data.
Week 3 replaced that temporary state with SQLite persistence using Prisma.
The persistence flow was:
```text
NestJS Service
      ↓
Prisma Client
      ↓
SQLite Database
```
Service Requests were retrieved using Prisma database queries.
Status changes were persisted using Prisma update operations instead of modifying an in-memory JavaScript object.
Persistence was manually verified by:
1. Updating a Service Request through the API.
2. Confirming that the status changed.
3. Restarting the backend application.
4. Retrieving the Service Request again.
5. Confirming that the updated status remained stored.
This demonstrated that Service Request state survived application restarts.

## 8. Week 3 Prisma Data Model
The Service Request was persisted using the following logical data structure:
```text
ServiceRequest
├── id
├── employeeId
├── departmentId
├── handlerId
├── title
├── description
└── status
```
The `handlerId` field was optional because a newly submitted Service Request could be unassigned.
The data model evolved further after Week 3.
The final persistent model is documented separately in:
```text
docs/data-model.md
```

## 9. Database Migrations
Prisma migrations were used to evolve the database schema.
The initial persistence migration introduced durable Service Requests.
A later schema change introduced:
```text
handlerId
```
to support request assignment and the Week 3 authorization behavior.
Using migrations kept database schema changes explicit and reproducible instead of manually modifying the database structure.
Later project stages continued using migrations as additional persistent capabilities were introduced.

## 10. Input Validation
Incoming lifecycle requests were validated using a DTO and NestJS `ValidationPipe`.
At the Week 3 stage, the status-transition request required:
- A valid `ServiceRequestStatus`.
- An integer `handlerId`.
Example valid request:
```json
{
  "status": "in_progress",
  "handlerId": 201
}
```
Example intentionally invalid request:
```json
{
  "status": "banana",
  "handlerId": 201
}
```
Expected result:
```text
HTTP 400 Bad Request
```
> **Later evolution:** The final status-transition DTO no longer accepts `handlerId`. Handler identity is derived from authentication.

## 11. Week 3 Authorization Rule
The meaningful authorization rule implemented for the Week 3 slice was:
> Only the assigned handler can change the status of a Service Request.
The authorization decision was enforced in the backend Service Layer.
The frontend was not trusted to make the authorization decision.
Example Service Request:
```text
handlerId = 201
```
 ### Allowed Authorization Case
 Request body:
 ```json
 {
   "status": "in_progress",
   "handlerId": 201
 }
 ```
 The requesting handler identity matched the assigned handler.
 Expected result:
 ```text
 HTTP 200 OK
 ```
 The request was allowed to continue to lifecycle validation and persistence.
 ### Denied Authorization Case
 Request body:
 ```json
 {
   "status": "completed",
   "handlerId": 202
 }
 ```
 The requesting handler identity did not match the assigned handler.
 Expected result:
 ```text
 HTTP 403 Forbidden
 ```
 The backend rejected the operation.

## 12. Week 3 Authentication Limitation
For the Week 3 product slice, `handlerId` was sent in the request body as a simplified demonstration identity.
This was sufficient for demonstrating where the application enforced the assigned-handler authorization rule, but it was not trusted production authentication.
At this milestone, a stronger implementation was identified as requiring identity from a trusted authentication mechanism such as:
- An authenticated session.
- An access token.
- Another trusted identity provider.
The important architectural boundary remained that authorization was enforced by the backend rather than trusted to the frontend.
 ### Later Evolution
 This limitation was resolved after Week 3.
 The final implementation uses:
 ```text
 Email + Password
      ↓
 JWT Authentication
      ↓
 Verified User Identity
      ↓
 Backend Authorization
 ```
 The status-transition body became:
 ```json
 {
   "status": "in_progress"
 }
 ```
 The handler identity is derived from the authenticated JWT rather than client-provided `handlerId`.

## 13. Expected Failure Handling
The application intentionally handled expected lifecycle failures.
Example:
```text
completed -> in_progress
```
This transition is not allowed by the lifecycle rules.
The backend returns:
```text
HTTP 400 Bad Request
```
React checks the HTTP response.
If the response is unsuccessful, React stores the returned error and displays a meaningful error message to the user.
The flow is:
```text
Invalid User Action
      ↓
React PATCH Request
      ↓
NestJS
      ↓
Lifecycle Validation
      ↓
400 Bad Request
      ↓
React Error Handling
      ↓
Error Displayed to User
```
The rejected operation does not modify the persisted Service Request state.

## 14. Business Rules in the Application Layer
Lifecycle and authorization decisions were implemented in the backend Service Layer.
The Service Layer was responsible for deciding:
- Whether the current Service Request existed.
- Whether the requesting handler identity matched the assigned handler.
- Whether the requested lifecycle transition was valid.
- Whether the database update could proceed.
This followed the Week 1 architectural decision to centralize business rules and authorization in the Application Layer.

## 15. Automated Confidence
Week 3 introduced automated tests at multiple levels.
The test suite used Vitest.
At the Week 3 milestone, the automated test suite contained:
```text
Business-rule test
Database integration test
End-to-end test
Regression protection
```
The verified Week 3 result was:
```text
Test Files  3 passed
Tests       4 passed
```
These counts describe the Week 3 milestone and are not intended to represent the size of the final project test suite.

## 16. Business-Rule Automated Test
The business-rule test verified lifecycle behavior independently from the real database.
The tested invalid transition was:
```text
completed -> in_progress
```
Expected result:
```text
BadRequestException
```
The test also verified that Prisma's database update operation was not called.
This demonstrated that the Service Layer rejected the invalid transition before persistence.
The test used a mocked Prisma dependency so that the lifecycle business rule could be tested in isolation.

## 17. Backend and Database Integration Test
The integration test verified that the backend Service Layer and the real database worked together.
The tested flow was:
```text
ServiceRequestsService
      ↓
Prisma
      ↓
SQLite
```
The test created a Service Request and performed:
```text
submitted -> in_progress
```
The test then read the Service Request from SQLite and verified that the new status was persisted.
This verified integration between:
- Service Layer.
- Prisma.
- SQLite.

## 18. End-to-End Test
The Week 3 E2E test verified the application through its HTTP API boundary.
Instead of calling the Service directly, the test sent an HTTP request through the NestJS application.
The E2E flow was:
```text
HTTP PATCH Request
      ↓
NestJS Controller
      ↓
DTO Validation
      ↓
Authorization
      ↓
Service Layer
      ↓
Lifecycle Validation
      ↓
Prisma
      ↓
SQLite
      ↓
HTTP Response
```
The test verified that the assigned handler could successfully perform:
```text
submitted -> in_progress
```
Expected HTTP result:
```text
200 OK
```
The test also read the database after the request and confirmed that the updated status was persisted.

## 19. Frontend Behavior
The Week 3 React frontend displayed the Service Request returned by the backend.
The UI showed information including:
- Title.
- Description.
- Current status.
The user could perform lifecycle actions such as:
```text
Start Progress
Complete Request
```
React sent the requested transition to the NestJS backend.
After a successful request, React used the returned Service Request to update the displayed state.
For expected API failures, React displayed the backend error instead of silently failing.
The frontend evolved substantially in later milestones into separate employee, handler, and administrator workspaces.

## 20. CORS Boundary
During local Week 3 development, the frontend and backend ran on separate origins.
React ran on:
```text
http://localhost:5173
```
NestJS ran on:
```text
http://localhost:3000
```
The NestJS application explicitly enabled CORS for the React development origin.
This allowed the browser frontend to communicate with the backend while keeping the local development origin explicit.
Deployment and production environment configuration are separate release concerns.

## 21. Separation of Responsibilities
The Week 3 implementation kept responsibilities separated across layers.
 ### React
 Responsible for:
 - Displaying Service Request data.
 - Sending user actions to the API.
 - Displaying successful results.
 - Displaying expected errors.
 ### Controller
 Responsible for:
 - Exposing HTTP endpoints.
 - Receiving HTTP parameters and request bodies.
 - Passing validated input to the Service Layer.
 ### DTO and ValidationPipe
 Responsible for:
 - Validating the shape of incoming requests.
 - Rejecting invalid API input.
 ### Service Layer
 Responsible for:
 - Authorization.
 - Lifecycle business rules.
 - Coordinating persistence.
 ### Prisma
 Responsible for:
 - Database access.
 ### SQLite
 Responsible for:
 - Durable Service Request state.

## 22. Week 2 to Week 3 Evolution
Week 2 implemented the first verified backend lifecycle behavior.
Week 3 evolved the same behavior into an integrated product slice.
 ### Week 2
 ```text
 NestJS
   ↓
 In-Memory Data
   ↓
 Manual API Verification
 ```
 ### Week 3
 ```text
 React
   ↓
 NestJS
   ↓
 Validation
   ↓
 Authorization
   ↓
 Business Rules
   ↓
 Prisma
   ↓
 SQLite
   ↓
 Automated Verification
 ```
 The existing lifecycle behavior was preserved while new integration boundaries were added.

## 23. Protecting the Boundaries
The Week 3 implementation protected several important application boundaries.
 ### API Boundary
 DTO validation prevented unsupported input from entering the application flow.
 ### Authorization Boundary
 The backend verified that the provided handler identity matched the assigned handler.
 ### Business-Rule Boundary
 Lifecycle transitions were validated before persistence.
 ### Persistence Boundary
 Prisma provided explicit database access instead of direct in-memory mutation.
 ### Regression Boundary
 Automated tests protected previously working behavior from accidental future changes.

## 24. Evolution After Week 3
The Week 3 vertical slice became the foundation for later product development.
The following capabilities were added after this milestone:
```text
JWT Authentication
Role-Based Authorization
Authenticated Employee Identity
Authenticated Handler Identity
Department-Specific Handler Inbox
Request Claiming
Employee Request Submission
Employee My Requests
Protected Request Details
Status History
AI-Assisted Request Intake
Administrator Role
User Management
Account Activation / Deactivation
Completion Email Notifications
Stored Session Validation
Expanded Authorization Tests
```
Several important Week 3 limitations were therefore resolved.
 ### Identity
 Week 3:
 ```text
 Client-provided handlerId
 ```
 Later implementation:
 ```text
 Verified JWT identity
 ```
 ### Request Access
 Week 3:
 ```text
 GET /service-requests
 ```
 Later implementation:
 ```text
 GET /service-requests/my
 GET /service-requests/handler/inbox
 GET /service-requests/:id
 ```
 with authentication and authorization.
 ### Status Transition
 Week 3:
 ```json
 {
   "status": "in_progress",
   "handlerId": 201
 }
 ```
 Later implementation:
 ```json
 {
   "status": "in_progress"
 }
 ```
 with handler identity derived from authentication.
 ### Persistence and Audit
 Week 3 persisted the current request state.
 Later implementation additionally records lifecycle transitions in:
 ```text
 ServiceRequestStatusHistory
 ```
 with the status update and history record written atomically.
 The original Week 3 lifecycle and Application Layer principles were preserved while the surrounding security, identity, persistence, and product boundaries were strengthened.