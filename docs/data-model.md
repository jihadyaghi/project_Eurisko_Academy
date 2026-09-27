# Internal Operations Service Hub - Data Model
## 1. Purpose
This document describes the current persistent data model of the Internal Operations Service Hub.
The data model supports:
- Authenticated users.
- Employee, handler, and administrator roles.
- User account activation state.
- Department membership.
- Service Request ownership.
- Department routing.
- Handler assignment.
- Request lifecycle state.
- Status-change audit history.
The current implementation uses:
```text
Prisma ORM
SQLite
```
The database stores durable application state.
External AI and email-provider interactions are not stored as separate persistent entities in the current model.

## 2. Core Entities
The current persistent model contains four main entities:
```text
User
Department
ServiceRequest
ServiceRequestStatusHistory
```
Their high-level relationships are:
```text
Department
   │
   ├── Users
   │
   └── Service Requests
            │
            ├── Employee / Creator
            ├── Assigned Handler
            └── Status History
```
There is no separate persistent entity for:
```text
AI intake result
Email notification
JWT session
```
Those concerns are handled by the application and external-provider boundaries rather than stored as first-class database entities.

## 3. User
A `User` represents an authenticated person who can access the system.
Users currently have one of three roles:
```text
EMPLOYEE
HANDLER
ADMIN
```
 ### Fields
 | Field | Type | Description |
 |---|---|---|
 | `id` | Int | Unique user identifier |
 | `name` | String | User display name |
 | `email` | String | Unique login email |
 | `passwordHash` | String | bcrypt password hash |
 | `role` | UserRole | EMPLOYEE, HANDLER, or ADMIN |
 | `departmentId` | Int? | Optional department membership |
 | `isActive` | Boolean | Determines whether the account may authenticate |
 | `createdAt` | DateTime | Creation timestamp |
 | `updatedAt` | DateTime | Last update timestamp |
 ### Role Enum
 ```prisma
 enum UserRole {
  EMPLOYEE
  HANDLER
  ADMIN
 }
 ```
 ### Account Activation
 New user accounts are active by default.
 ```text
 isActive = true
 ```
 When an administrator deactivates an employee or handler:
 ```text
 isActive = false
 ```
 The account remains stored in the database but authentication is rejected by the application.
 ### Department Membership
 A user may optionally belong to a department.
 Current role expectations are:
 ```text
 EMPLOYEE
 departmentId = null

 HANDLER
 departmentId = required by application rules

 ADMIN
 departmentId = null
 ```
 Handler department membership determines:
 - Which department inbox the handler can access.
 - Which request details the handler may view.
 - Which requests the handler may claim.
 The application layer validates these role-specific rules.

## 4. Department
A `Department` represents an internal operational department.
Current system departments are:
```text
IT
HR
Finance
```
 ### Fields
 | Field | Type | Description |
 |---|---|---|
 | `id` | Int | Unique department identifier |
 | `name` | String | Unique department name |
 | `createdAt` | DateTime | Creation timestamp |
 A department can have:
 ```text
 Many Users
 Many ServiceRequests
 ```
 The current development seed ensures that these department records exist.

## 5. ServiceRequest
A `ServiceRequest` is the central business entity.
It represents a request submitted by an employee and routed to an internal department.
 ### Fields
 | Field | Type | Description |
 |---|---|---|
 | `id` | Int | Unique request identifier |
 | `employeeId` | Int | Employee who created the request |
 | `departmentId` | Int | Department responsible for the request |
 | `handlerId` | Int? | Handler currently assigned to the request |
 | `title` | String | Short request title |
 | `description` | String | Original request description |
 | `category` | String? | Application-validated request category |
 | `priority` | String | Application-validated request priority |
 | `status` | String | Current lifecycle state |
 | `createdAt` | DateTime | Creation timestamp |
 | `updatedAt` | DateTime | Last update timestamp |
 ### Initial Request State
 A newly created request is stored with:
 ```text
 employeeId = authenticated employee ID
 handlerId = null
 status = submitted
 ```
 The authenticated employee identity is not accepted from client-controlled request input.

## 6. Service Request Ownership
Every Service Request belongs to the employee who created it.
```text
User (EMPLOYEE)
      │
      └── creates
             │
             ▼
        ServiceRequest
```
The relationship is represented by:
```text
ServiceRequest.employeeId
```
The value is derived from the authenticated employee during request creation.
The client does not choose another employee ID when submitting a request.
 ### Employee Access Rule
 When an employee requests Service Request details:
 ```text
 ServiceRequest.employeeId
 must equal
 Authenticated User.id
 ```
 This authorization rule is enforced by the application layer.

## 7. Department Relationship
Every Service Request belongs to one department.
```text
Department
    │
    └── ServiceRequest
```
The relationship is represented by:
```text
ServiceRequest.departmentId
```
The department represents the operational team responsible for handling the request.
Current product-owned department values are:
```text
IT
HR
Finance
```
 ### Handler Department Access Rule
 When a handler accesses request details:
 ```text
 Handler.departmentId
 must equal
 ServiceRequest.departmentId
 ```
 This rule is enforced by the application layer.

## 8. Request Category
The database currently stores request category as:
```text
String?
```
Category values are not trusted as arbitrary strings at the application boundary.
The application owns the supported department/category mappings.
Current mappings are:
```text
IT
- hardware
- software
- access

HR
- employment_document
- leave
- employee_support

Finance
- reimbursement
- payroll
- expense
```
The application validates that a category is valid for the selected department.
The AI provider may suggest a category, but the application validates the value before use.

## 9. Request Priority
The database stores request priority as:
```text
String
```
with the current default:
```text
normal
```
The application-owned priority values are:
```text
low
normal
high
```
Priority validation belongs to the application layer.

## 10. Handler Assignment
A Service Request may have an assigned handler.
The relationship is optional because new requests begin unassigned.
```text
handlerId = null
```
After a valid claim:
```text
handlerId = authenticated handler ID
```
Relationship:
```text
User (HANDLER)
      │
      └── handles
             │
             ▼
        ServiceRequest
```
A handler may handle many requests.
A Service Request can have at most one currently assigned handler.
 ### Claim Rules
 The application allows a claim only when:
 ```text
 Request handlerId = null
 AND
 Handler.departmentId
 =
 ServiceRequest.departmentId
 ```
 The application rejects:
 - Claims from another department.
 - Claims from handlers without a department.
 - Claims for already assigned requests.

## 11. Request Lifecycle
The current lifecycle states are:
```text
submitted
in_progress
completed
```
The lifecycle is:
```text
submitted -> in_progress -> completed
```
Allowed transitions:
```text
submitted -> in_progress
in_progress -> completed
```
Invalid transition examples:
```text
submitted -> completed
completed -> in_progress
```
The database stores only the current state on `ServiceRequest`.
The application layer owns transition validity.
 ### Assigned Handler Rule
 A handler may change request status only when:
 ```text
 ServiceRequest.handlerId
 =
 Authenticated Handler.id
 ```
 A handler cannot change the status of a request assigned to another handler.

## 12. ServiceRequestStatusHistory
`ServiceRequestStatusHistory` records request lifecycle changes.
It provides an audit trail showing:
```text
What changed?
From which state?
To which state?
Who changed it?
When did it change?
```
 ### Fields
 | Field | Type | Description |
 |---|---|---|
 | `id` | Int | Unique history record identifier |
 | `serviceRequestId` | Int | Request that changed |
 | `fromStatus` | String | Previous lifecycle state |
 | `toStatus` | String | New lifecycle state |
 | `changedByUserId` | Int | User who performed the change |
 | `createdAt` | DateTime | Time of the transition |
 Relationship:
 ```text
 ServiceRequest
      │
      └── has many
             │
             ▼
 ServiceRequestStatusHistory
 ```
 The user responsible for the transition is also related to the history record:
 ```text
 User
 │
 └── statusChanges
          │
          ▼
 ServiceRequestStatusHistory
 ```
 The frontend uses these records to display the Request Details status timeline.

## 13. Audit Example
Consider a request created with:
```text
status = submitted
handlerId = null
```
After handler `201` claims the request:
```text
handlerId = 201
```
Claiming does not currently create a status-history record because the lifecycle status remains:
```text
submitted
```
When the handler starts working:
```text
ServiceRequest.status
submitted -> in_progress
```
A history record is created:
```text
fromStatus = submitted
toStatus = in_progress
changedByUserId = 201
```
When the request is completed:
```text
ServiceRequest.status
in_progress -> completed
```
Another history record is created:
```text
fromStatus = in_progress
toStatus = completed
changedByUserId = 201
```
The Service Request stores the current state while the history table preserves how that lifecycle state was reached.

## 14. Transaction Boundary
A lifecycle change requires two persistent operations:
```text
1. Update ServiceRequest.status
2. Create ServiceRequestStatusHistory
```
These operations are executed inside one Prisma transaction.
```text
BEGIN TRANSACTION
Update current status
        +
Create audit history
COMMIT
```
If either database operation fails, the transaction does not leave the system with only half of the intended lifecycle change.
 ### Notification Boundary
 Completion email delivery is not included inside this database transaction.
 The order is:
 ```text
 Persist status
        +
 Persist history
        ↓
 Commit transaction
        ↓
 Attempt completion email
 ```
 Therefore, email-provider failure does not roll back the durable completed request state.

## 15. Current Prisma Schema
The current persistent model is represented by the following Prisma structure:
```prisma
enum UserRole {
  EMPLOYEE
  HANDLER
  ADMIN
}
model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole
  departmentId Int?
  isActive     Boolean  @default(true)

  department Department? @relation(
    fields: [departmentId],
    references: [id]
  )

  createdRequests ServiceRequest[]
    @relation("EmployeeRequests")

  handledRequests ServiceRequest[]
    @relation("HandlerRequests")

  statusChanges ServiceRequestStatusHistory[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
model Department {
  id   Int    @id @default(autoincrement())
  name String @unique

  users           User[]
  serviceRequests ServiceRequest[]

  createdAt DateTime @default(now())
}
model ServiceRequest {
  id           Int    @id @default(autoincrement())
  employeeId   Int
  departmentId Int
  handlerId    Int?
  title        String
  description  String
  category     String?
  priority     String @default("normal")
  status       String @default("submitted")

  employee User
    @relation(
      "EmployeeRequests",
      fields: [employeeId],
      references: [id]
    )

  department Department
    @relation(
      fields: [departmentId],
      references: [id]
    )

  handler User?
    @relation(
      "HandlerRequests",
      fields: [handlerId],
      references: [id]
    )

  statusHistory ServiceRequestStatusHistory[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
model ServiceRequestStatusHistory {
  id               Int      @id @default(autoincrement())
  serviceRequestId Int
  fromStatus       String
  toStatus         String
  changedByUserId  Int
  createdAt        DateTime @default(now())

  serviceRequest ServiceRequest
    @relation(
      fields: [serviceRequestId],
      references: [id]
    )

  changedByUser User
    @relation(
      fields: [changedByUserId],
      references: [id]
    )
}
```
This document describes the current model conceptually.
The actual `schema.prisma` file remains the authoritative schema definition.

## 16. Relationship Summary
```text
Department 1 ─────── * User

Department 1 ─────── * ServiceRequest

User (Employee) 1 ── * ServiceRequest
                       via employeeId

User (Handler) 1 ─── * ServiceRequest
                       via handlerId

ServiceRequest 1 ─── * ServiceRequestStatusHistory

User 1 ───────────── * ServiceRequestStatusHistory
                       via changedByUserId
```
`handlerId` is optional, so an unassigned request has no current handler relationship.
`departmentId` on `User` is also optional at the database level, while application rules require it for handlers.

## 18. Development and Test Databases
Development and automated testing use separate SQLite databases.
```text
Development:
dev.db

Automated Tests:
test.db
```
This prevents automated tests from modifying normal development data.
The test command applies Prisma migrations to the isolated test database before executing the automated suite.
Automated E2E setup creates the specific users, departments, and requests required by the tests.
These test records are fixtures and are not production provisioning behavior.

---

## 19. Data Ownership Rules
The current data model supports several application-level ownership rules.
### Employee Identity
```text
employeeId
```
comes from authenticated identity during request creation.
The employee cannot choose the authoritative creator ID.
### Employee Request Access
An employee may view a request only when:

```text
serviceRequest.employeeId
=
authenticated employee ID
```
### Handler Identity
```text
handlerId
```
is assigned using the authenticated handler during the claim operation.
### Handler Department Access
A handler may access or claim a Service Request only when the application confirms:
```text
handler.departmentId
=
serviceRequest.departmentId
```
### Status Changes
A handler may change request status only when:
```text
serviceRequest.handlerId
=
authenticated handler ID
```
### Administrator User Management
User creation and account activation changes require authenticated `ADMIN` authorization.
Normal administrator user creation can create:

```text
EMPLOYEE
HANDLER
```
but not another:

```text
ADMIN
```
through the standard user-creation endpoint.
Administrator accounts cannot be deactivated through the normal account-status endpoint.
These rules are enforced by the application layer rather than trusted to client input.

## 20. Authentication-Related Data
Authentication credentials are represented by:
```text
User.email
User.passwordHash
User.isActive
```
Passwords are hashed before persistence.
Plain-text passwords are not stored in the `User` entity.
JWT tokens are not currently persisted as database entities.
The application validates stored frontend sessions through authenticated backend requests rather than through a database session table.

## 21. AI and Persistence Boundary
The AI intake result is not a durable database entity.
AI may suggest:
```text
department
category
priority
summary
needsReview
```
The application validates those values before a Service Request can be created.
Only the explicit submitted Service Request becomes durable state.
Therefore:
```text
AI suggestion
≠
ServiceRequest database record
```
until the employee explicitly submits a validated request.

## 22. Email Notification and Persistence Boundary
Completion email delivery is not represented by a dedicated database table in the current implementation.
When a request reaches:
```text
completed
```
the durable state is:
```text
ServiceRequest.status = completed
+
ServiceRequestStatusHistory entry
```
After this state is committed, the application attempts to send the external completion notification.
Current notification delivery state is therefore not stored as durable notification records.
A future notification-delivery/audit table could be introduced if reliable delivery tracking becomes a product requirement.
That capability is not part of the current data model.