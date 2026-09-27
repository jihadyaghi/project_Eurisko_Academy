# Week 2 Agentic Workflow
## Historical Milestone Note
This document records the Week 2 implementation as it existed at that stage of the project.
Week 2 intentionally used a small NestJS backend slice with in-memory data and without authentication, persistent database storage, or the later production-oriented authorization model.
The system evolved in later weeks to include persistent storage, JWT authentication, role-based authorization, authenticated ownership, department boundaries, audit history, and additional product functionality.
Some Week 2 endpoints described below, including the unrestricted:
```http
GET /service-requests
```
were used for the bounded Week 2 implementation and verification but are not part of the final protected application API.
This document preserves the original Week 2 implementation evidence rather than rewriting the milestone to match later architecture.

## 1. UNDERSTAND
Before implementing the Week 2 milestone, the Week 1 documentation was reviewed to understand the existing product and architecture decisions.
 ### Selected Behavior
 The bounded behavior selected for implementation was the Service Request lifecycle transition.
 For this Week 2 implementation slice, the following lifecycle states were used:
 - `submitted`
 - `in_progress`
 - `completed`
 ### Lifecycle Rules
 Valid transitions:
 ```text
 submitted -> in_progress
 in_progress -> completed
 ```
 Invalid transitions include:
 ```text
 submitted -> completed
 completed -> in_progress
 ```
 ### Invariant
 A Service Request must always have a valid current status.
 The status is updated only after the requested transition has been validated.
 ### Implementation Scope
 The implementation was intentionally limited to a small backend slice using NestJS and in-memory data.
 The Week 2 milestone did not introduce:
 - Persistent database storage
 - Authentication
 - Role-based authorization
 - Frontend functionality
 - AI-assisted intake
 Those capabilities were introduced in later project stages.

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
 - The Controller was kept responsible for HTTP request handling.
 This direction remained consistent with the Week 1 architecture decision that critical business rules should be enforced in the Application Layer rather than trusted to the client.
 ### Implementation Plan
 The implementation was completed incrementally:
 1. Create the `ServiceRequestsModule`.
 2. Create the `ServiceRequestsController`.
 3. Create the `ServiceRequestsService`.
 4. Define the Service Request status enum and model.
 5. Add in-memory Service Request data.
 6. Implement lifecycle transition validation in the Service.
 7. Expose the behavior through HTTP endpoints.
 8. Run the application and verify the implemented behavior.
 ### Change Control
 Changes were kept within the bounded Week 2 scope.
 Unrelated functionality such as frontend development, database integration, authentication, and AI-assisted intake was intentionally not introduced during this milestone.

## 3. PROVE
The implemented Service Request lifecycle behavior was verified by running the NestJS application and testing the HTTP endpoints available during the Week 2 milestone.
 ### Baseline Verification
 The application was successfully started before and after the implementation changes.
 At the Week 2 stage, the following endpoint was used to verify the initial in-memory Service Request data:
 ```http
 GET /service-requests
 ```
 The initial states were:
 ```text
 Service Request 1: submitted
 Service Request 2: in_progress
 ```
 > **Later evolution:** The unrestricted `GET /service-requests` endpoint was removed in a later authorization-hardening stage. The final application exposes request data only through authorized employee and handler flows.
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
 The bounded lifecycle implementation behaved as expected:
 - Valid transitions were accepted.
 - Invalid transitions were rejected.
 - The lifecycle invariant was preserved.

## 4. Evolution After Week 2
The Week 2 lifecycle remained part of the product as the system evolved.
The same core lifecycle:
```text
submitted -> in_progress -> completed
```
was later integrated with:
- Prisma persistence.
- SQLite storage.
- JWT authentication.
- `EMPLOYEE` and `HANDLER` authorization.
- Authenticated handler identity.
- Request assignment.
- Department authorization.
- Assigned-handler authorization.
- Status-change audit history.
- Atomic status/history persistence.
- Employee and handler frontend workflows.
- Automated unit and end-to-end tests.
The core Week 2 invariant was preserved:
> A request status changes only after the requested transition has been validated.
Later milestones strengthened who is authorized to perform those transitions and how the resulting state is persisted and audited.