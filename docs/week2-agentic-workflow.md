# Week 2 Agentic Workflow
## 1. UNDERSTAND
Before implementing the Week 2 milestone, the Week 1 documentation was reviewed to understand the existing product and architecture decisions.
 ### Selected Behavior
 The bounded behavior selected for implementation is the Service Request lifecycle transition.
 For this Week 2 implementation slice, the following lifecycle states are used:
 - `submitted`
 - `in_progress`
 - `completed`
 ### Lifecycle Rules
 Valid transitions:
 - `submitted` -> `in_progress`
 - `in_progress` -> `completed`
 Invalid transitions include:
 - `submitted` -> `completed`
 - `completed` -> `in_progress`
 ### Invariant
 A Service Request must always have a valid current status.
 The status is updated only after the requested transition has been validated.
 ### Implementation Scope
 The implementation is limited to a small backend slice using NestJS and in-memory data.

## 2. DIRECT
The implementation task was defined as a small and bounded backend behavior:
> Implement the Service Request lifecycle transitions using NestJS while preserving the lifecycle rules and invariant identified from the Week 1 documentation.
 ### Implementation Direction
 Before modifying the application:
 - The existing repository structure and Week 1 documentation were reviewed.
 - The NestJS application was run to establish a working baseline.
 - The implementation was limited to the `service-requests` feature.
 - In-memory data was used instead of introducing a database.
 - Business rules were placed in the Service layer.
 - The Controller was kept responsible for Http request handling.
 ### Implementation Plan
 The implementation was completed incrementally:
 1. Create the `ServiceRequestsModule`
 2. Create the `ServiceRequestsController`.
 3. Create the `ServiceRequestsService`.
 4. Define the Service Request status enum and model.
 5. Add in-memory Service Request data.
 6. Implement lifecycle transition validation in the Service.
 7. Expose the behavior through HTTP endpoints.
 8. Run the application and verify the implemented behavior.
 ### Change Control
 Changes were kept within the bounded Week 2 scope.
 Unrelated functionality such as frontend development, database integration, and authentication was not introduced.

## 3. PROVE
The implemented Service Request lifecycle behavior was verified by running the NestJS application and testing the HTTP endpoints.
 ### Baseline Verification
 The application was successfully started before and after the implementation changes.
 The following endpoint was used to verify the initial in-memory Service Request data:
 `GET /service-requests`
 The initial states were:
 - Service Request 1: `submitted`
 - Service Request 2: `in_progress`
### Transition Verification
| Test | Current Status | Requested Status | Expected Result | Actual Result | Result |
|---|---|---|---|---|---|
| 1 | `submitted` | `in_progress` | Transition accepted | Status changed to `in_progress` | PASS |
| 2 | `in_progress` | `completed` | Transition accepted | Status changed to `completed` | PASS |
| 3 | `completed` | `in_progress` | Transition rejected | HTTP 400 Bad Request | PASS |
| 4 | `submitted` | `completed` | Transition rejected | HTTP 400 Bad Request | PASS |
### Invariant Verification
The Service Request status is changed only after the requested transition is validated.
Invalid transitions return an HTTP `400 Bad Request` response and do not update the Service Request status.
Therefore, the invariant that every Service Request must maintain a valid current status is preserved.
### Verification Result
The bounded lifecycle implementation behaves as expected:
- Valid transitions are accepted.
- Invalid transitions are rejected.
- The lifecycle invariant is preserved.
