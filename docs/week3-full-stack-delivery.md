# Week 3 Full-Stack Delivery
## 1. Overview
Week 3 extends the existing Internal Operations Service Hub with one narrow, user-facing Service Request flow.
The goal of this milestone is to connect the frontend, backend, business rules, authorization, and real database into one integrated product slice.
The implemented flow connects:
```text
React Frontend -> NestJS Backend -> Validation -> Authorization -> Business Rules -> Prisma -> SQLite Database -> API Response -> React UI Update
```
The selected behavior is the Service Request lifecycle transition.
Supported lifecycle states:
- `submitted`
- `in_progress`
- `completed`
Support valid transitions:
- `submitted` -> `in_progress`
- `in_progress` -> `completed`
Invalid lifecycle transitions are rejected.

## 2. Integrated Product Slice
The Week 3 product slice allows a user to retrieve a Service Request and change its lifecycle status through the React frontend.
The same flow crosses all application layers:
```text
React -> Http API -> NestJS Controller -> DTO Validation -> Service Layer -> Authorization -> Lifecycle Validation -> Prisma -> SQLite
```
This is intentionally a narrow vertical slice rather than an implementation of the entire Internal Operations Service Hub.

## 3. Technology Stack
The integrated slice uses:
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
The Service Request Lifecycle implemented in this slice is:
```text
submitted
    ↓
in_progress
    ↓
completed
```
Valid transitions are:
```text
submitted → in_progress
in_progress → completed
```
Examples of invalid transtions include:
```text
submitted → completed
completed → in_progress
```
Lifecycle rules are enforced in the backend Service Layer.
The frontend is not trusted to decide whether a transition is valid.

## 5. Full-Stack User Flow
The implemented user-facing flow works as follows:
1. React requests a Service Request from the NestJS API.
2. NestJS retrieves the Service Request from SQLite through Prisma.
3. React displays the Service Request information.
4. The user requests a status change.
5. React sends a `PATCH` request to the backend.
6. NestJS validates the request body.
7. The Service layer verifies that the requesting handler is authorized.
8. The Service layer verifies that the requested lifecycle transition is valid.
9. Prisma persists the valid status change in SQLite.
10. NestJS returns the updated Service Request.
11. React updates the displayed state using the API response.
The resulting flow is:
```text
User Action -> React -> PATCH API Request -> NestJS Controller -> DTO Validation -> Authorization -> Lifecycle Business Rule -> Prisma -> SQLite -> Updated API Response -> React UI Update
```

## 6. API Contract
The frontend and backend communicate through an explicit HTTP request and response contract.
  ### Retrieve All Service Requests
  ```http
  GET /service-requests
  ```
  The endpoint returns the currently stored Service Requests.
  ### Retrieve One Service Request
  ```http
  GET /service-requests/:id
  ```
  ### Change Service Request Status
  ```http
  PATCH /service-requests/:id/status
  ```
The request contract requires:
- `status` to be a valid Service Request status.
- `handlerId` to be an integer.

## 7. Real Database Persistence
Week 2 used in-memory Service Request data.
Week 3 replaces that temporary state with real SQLite persistence using Prisma.
The persistence flow is:
```text
NestJS Service -> Prisma Client -> SQLite Database
```
Service Requests are retrieved using Prisma databasse queries.
Status changes are persisted using Prisma update operations instead of changing an in-memory JavaScript object.
Persistence was manually verified by:
1. Updating a Service Request through the API.
2. Confirming that the status changed.
3. Restarting the backend application.
4. Retrieving the Service Request again.
5. Confirming that the updated status remained stored.
This demonstrates that the Service Request state survives application restarts.

## 8. Prisma Data Model
The Service Request is persisted using the following logical data structure:
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
The `handlerId` field is optional because a newly submitted Service Request may not yet have an assigned handler.

## 9. Database Migrations
Prisma migrations are used to evolve the database schema.
The initial migration introduced persistent Service Requests.
A later migration introduced:
```text
handlerId
```
to support request assignment and authorization.
Using migrations keeps database schema changes explicit and reproducible instead of manually changing the database structure.

## 10. Input Validation
Incoming lifecycle requests are validated using a DTO and NestJS `ValidationPipe`.
The status-transition request requires:
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

## 11. Authorization Rule
The meaningful authorization rule implemented for the Week 3 slice is:
> Only the assigned handler can change the status of a Service Request.
The authorization decision is enforced in the backend Service layer.
The frontend is not trusted to make the authorization decision.
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
  The requesting handler matches the assigned handler.
  Expected result:
  ```text
  HTTP 200 OK
  ```
  The request is allowed to continue to lifecycle validation and persistence.
  ### Denied Authorization Case
  Request body:
  ```json
  {
  "status": "completed",
  "handlerId": 202
  }
  ```
  The requesting handler does not match the assigned handler.
  Expected result:
  ```text
  HTTP 403 Forbidden
  ```
  The backend rejects the operation.

## 12. Authentication Limatation
For this Week 3 product slice, `handlerId` is sent in the request body as a simplified demonstration identify.
This is sufficient to demonstrate where and how the application enforces the authorization rule, but it is not production authentication.
A production implementation should derive the current user's identify from a trusted authentication mechanism such as:
- An authenticated session.
- An access token.
- Another trusted identify provider.
The important architectural boundary in this slice is that authorization is still enforced by the backend rather than trusted to the frontend.

## 13. Expected Failure Handling
The application intentionally handles expected lifecycle failures.
Example:
```text
completed → in_progress
```
This transtion is not allowed by the lifecycle rules.
The backend returns:
```text
HTTP 400 Bad Request
```
React checks the HTTP response.
If the response is unsuccessful, React stores the returned error and displays a meaningful error message to the user.
The flow is :
```text
Invalid User Action -> React PATCH Request -> NestJS -> Lifecycle Validation -> 400 Bad Request -> React Error Handling -> Error Displayed to User
```
The rejected operation does not modify the persisted Service Request state.

## 14. Business Rules in the Application Layer
Lifecycle and authorization decisions are implemented in the backend Service layer.
The Service layer is responsible for deciding:
- Whether the current Service Request exists.
- Whether the requesting handler is authorized.
- Whether the requested lifecycle transtion is valid.
- Whether the database update may proceed.
This follows the Week 1 architectural decision to centralize business rules and authorization in the application layer.

## 15. Automated Confidence 
Week 3 introduces automated tests at multiple levels.
The test suite uses Vitest.
The current automated test suite contains:
```text
Business-rule test
Database integration test
End-to-end test
Regression protection
```
Current verified result:
```text
Test Files  3 passed
Tests       4 passed
```

## 16. Business-Rule Automated Test
The business-rule test verifies lifecycle behavior independently from the real database.
The tested invalid transition is:
```text
completed → in_progress
```
Expected result:
```text
BadRequestException
```
The test also verifies that Prisma's database update operation is not called.
This proves that the Service layer rejects the invalid transition before persistence.
The test uses a mocked Prisma dependency so that the lifecycle business rule can be tested in isolation.

## 17. Backend and Database Integration Test
The integration test verifies that the backend Service and the real database work together.
the tested flow:
```text
ServiceRequestsService -> Prisma -> SQLite
```
The test creates a Service Request and performs:
```text
submitted → in_progress
```
The test then reads the Service Request from SQLite and verifies that the new status was actually persisted.
This verifies integration between:
- The Service layer.
- Prisma
- SQLite

## 18. End-to-End Test
The E2E test verifies the application through its public HTTP API boundary.
Instead of calling the Service directly, the test sends an HTTP request through the NestJS application.
The E2E flow is:
```text
HTTP PATCH Request -> NestJS Controller -> DTO Validation -> Authorization -> Service Layer -> Lifecycle Validation -> Prisma -> SQLite -> HTTP Response 
```
The test verifies that the assigned handler can successfully perform:
```text
submitted → in_progress
```
The expected HTTP result is:
```text
200 OK
```
The test also reads the database after the request and confirms that the updated status was persisted.

## 19. Frontend Behavior
The React frontend displays the Service Request returned by the backend.
The UI shows information including:
- Title
- Description
- Current Status
The user can perform lifecycle actions such as:
```text
Start Progress
Complete Request
```
React sends the requested transition to the NestJS backend.
After a successful request, React uses the returned Service Request to update the displayed status.
For expected API failures, React displays the backend error instead of silently failing.

## 20. CORS Boundary
The frontend and backend run on separate local development origins.
React runs on:
```text
http://localhost:5173
```
NestJS runs on:
```text
http://localhost:3000
```
The NestJS application explicitly enables CORS for the React development origin.
This allows the browser frontend to communicate with the backend while keeping the allowed origin explicit.

## 21. Separation of Responsibilities
The implementation keeps responsibilities separated across layers.
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
  - Passing validated input to the Service layer.
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
Week 3 evolves the same behavior into an integrated product slice.
  ### Week 2
  ```text
  NestJS → In-Memory Data → Manual API Verification
  ```
  ### Week 3
  ```text
  React → NestJS → Validation → Authorization → Business Rules → Prisma → SQLite → Automated Verification
```
The existing lifecycle behavior was preserved while new integration boundaries were added.

## 23. Protecting the Boundaries
The Week 3 implementation protects several important application boundaries.
  ### API Boundary
  DTO validation prevents unsupported input from entering the application flow.
  ### Authorization Boundary
  The backend verifies that the requesting handler matches the assigned handler.
  ### Business-Rule Boundary
  Lifecycle transitions are validated before persistence.
  ### Persistence Boundary
  Prisma provides explicit database access instead of direct in-memory mutation.
  ### Regression Boundary
  Automated tests protect previously working behavior from accidental future changes.



