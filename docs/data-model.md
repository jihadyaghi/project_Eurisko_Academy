# Internal Operations Service Hub - Data Model
## 1. Purpose
This document describes the current persistent data model of the Internal Operations Service Hub.
The data model supports:
- Authenticated users.
- Employee and handler roles.
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

## 3. User
A `User` represents an authenticated person who can access the system.
Users currently have one of two roles:
```text
EMPLOYEE
HANDLER
```
### Fields
| Field | Type | Description |
|---|---|---|
| `id` | Int | Unique user identifier |
| `name` | String | User display name |
| `email` | String | Unique login email |
| `passwordHash` | String | bcrypt password hash |
| `role` | UserRole | EMPLOYEE or HANDLER |
| `departmentId` | Int? | Optional department membership |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
### Role Enum
```prisma
enum UserRole {
  EMPLOYEE
  HANDLER
}
```
### Department Membership
A user may optionally belong to a department.
In the current product flow, department membership is particularly important for handlers because it determines which department inbox they can access and which requests they may claim.

## 4. Department
A `Department` represents an internal operational department.
Current seeded departments are:
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
---
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
| `category` | String? | Request category |
| `priority` | String | Request priority |
| `status` | String | Current lifecycle state |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

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
The `employeeId` is derived from the authenticated employee during request creation.
The client does not choose another employee ID when submitting a request.

## 7. Department Relationship
Every Service Request belongs to one department.
```text
Department
    │
    └── ServiceRequest
```
The department represents the operational team responsible for handling the request.
Current product-owned department values are:
```text
IT
HR
Finance
```

## 8. Handler Assignment
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

## 9. Request Lifecycle
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
submitted → in_progress
in_progress → completed
```
The application layer rejects transitions outside this lifecycle.
The database stores the current state, while the application layer owns transition validity.

## 10. ServiceRequestStatusHistory
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

## 11. Audit Example
Consider a request created with:
```text
status = submitted
handlerId = null
```
After handler `201` claims the request:
```text
handlerId = 201
```
When the handler starts working:
```text
ServiceRequest.status
submitted → in_progress
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
in_progress → completed
```
Another history record is created:
```text
fromStatus = in_progress
toStatus = completed
changedByUserId = 201
```
The Service Request stores the current state while the history table preserves how that state was reached.

## 12. Transaction Boundary
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
If either operation fails, the transaction does not leave the system with only half of the intended change.

## 13. Current Prisma Schema
The current model is represented by the following Prisma structure:
```prisma
enum UserRole {
  EMPLOYEE
  HANDLER
}
model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole
  departmentId Int?
  department Department? @relation(fields: [departmentId], references: [id])
  createdRequests ServiceRequest[] @relation("EmployeeRequests")
  handledRequests ServiceRequest[] @relation("HandlerRequests")
  statusChanges   ServiceRequestStatusHistory[]
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
  id           Int  @id @default(autoincrement())
  employeeId   Int
  departmentId Int
  handlerId    Int?
  title       String
  description String
  category    String?
  priority    String @default("normal")
  status      String @default("submitted")
  employee   User       @relation("EmployeeRequests", fields: [employeeId], references: [id])
  department Department @relation(fields: [departmentId], references: [id])
  handler    User?      @relation("HandlerRequests", fields: [handlerId], references: [id])
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
  serviceRequest ServiceRequest @relation(fields: [serviceRequestId], references: [id])
  changedByUser  User           @relation(fields: [changedByUserId], references: [id])
}
```

## 14. Relationship Summary
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

## 15. Seed Data
The development seed provides deterministic demo data.
### Departments
```text
1 → IT
2 → HR
3 → Finance
```
### Demo Users
```text
Employee
ID: 101
Role: EMPLOYEE
Email: employee@example.com

IT Handler
ID: 201
Role: HANDLER
Department: IT
Email: it.handler@example.com

HR Handler
ID: 202
Role: HANDLER
Department: HR
Email: hr.handler@example.com

Finance Handler
ID: 203
Role: HANDLER
Department: Finance
Email: finance.handler@example.com
```
Demo passwords are stored in the database as bcrypt hashes.
The deterministic IDs are development/demo fixtures and should not be treated as a production identity strategy.

## 16. Development and Test Databases
Development and automated testing use separate SQLite databases.
```text
Development:
dev.db

Automated Tests:
test.db
```
This prevents automated tests from modifying normal development data.
The test command applies Prisma migrations to the isolated test database before executing the automated suite.

## 17. Data Ownership Rules
The current data model supports several application-level ownership rules.
### Employee Identity
```text
employeeId
```
comes from authenticated identity during request creation.
### Handler Identity
```text
handlerId
```
is assigned using the authenticated handler during the claim operation.
### Department Access
A handler may only claim a Service Request when:
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
These rules are enforced by the application layer rather than trusted to client input.

