# Product Enhancements Beyond the Core Assignment
## Purpose
This document highlights product and engineering enhancements added beyond the minimum academy requirements.
The goal of these additions is to improve product realism, maintainability, security boundaries, end-to-end usability, and demonstration quality without replacing the original assignment scope.

## 1.  Extended Relational Data Model
The original Service Request model was expanded into a more realistic relational model.
Current core entities include:
```text
User
Department
ServiceRequest
ServiceRequestStatusHistory
```
This allows the system to represent:
- Employees
- Department handlers
- Departments
- Request ownership
- Request assignment
- Lifecycle history

## 2. Backend Authentication
JWT-based authentication was added to replace the earlier simplified demo identity.
Authentication flow:
```text
Email + Password → User lookup → bcrypt password verification → JWT access token → Authenticated API access
```
Passwords are stored as bcrypt hashes rather than plain text.
The backend exposes:
```http
POST /auth/login
GET /auth/me
```
The current authenticated user is derived from the verified JWT rather than trusted from client-provided IDs.

## 3. Role-Based Authorization
The system now distinguishes between two main roles:
```text
EMPLOYEE
HANDLER
```
The backend applies role-based authorization using guards and role metadata.
Examples:
```text
EMPLOYEE → Create service requests

HANDLER → Access department inbox
        → Claim requests
        → Change request lifecycle status
```

## 4. Authenticated Handler Identity
The earlier Week 3 demonstration sent:
```json
{
    "handlerId": 201
}
```
from the client.
This was replaced with authenticated identity from the JWT.
The status transition API now receives only:
```json
{
    "status": "in_progress"
}
```
The backend determines the current handler from the verified token.
This prevents the client from claiming another user's identity.

## 5. Employee Request Submission
The AI-assisted Request Intake capability was connected to a real Service Request creation flow.
New product flow:
```text
Employee Login → Describe Request → AI Analysis → Review Suggestion → Submit Request → Persist in Database
```
The backend creates the request with:
```text
employeeId = authenticated employee
status = submitted
handlerId = null
```
The employee does not control request ownership.

## 6. Human Confirmation Before Persistence
AI suggestions are not automatically persisted.
The flow remains:
```text
AI proposes → Employee reviews → Employee submits → Backend validates → Request is persisted
```
This preserves the existing AI authority boundary.

## 7. Department-Based Handler Inbox
Handlers can retrieve requests for their own department.
Example:
```http
GET /service-requests/handler/inbox
```
The department is taken from authenticated user identity.
Examples:
```text
IT Handler
→ IT requests

HR Handler
→ HR requests

Finance Handler
→ Finance requests
```
The client does not choose the department filter.

## 8. Request Claim / Assignment Flow
New requests initially have:
```text
handlerId = null
```
A handler can claim a request from the same department.
Flow:
```text
Department Inbox → Unassigned Request → Claim Request → handlerId = authenticated handler
```
The backend rejects:
- A handler claiming a request from another department.
- A handler without an assigned department.
- A request that has already been assigned.

## 9. Request Audit History
Lifecycle transitions are now recorded in:
```text
ServiceRequestStatusHistory
```
Each history record stores:
```text
serviceRequestId
fromStatus
toStatus
changedByUserId
createdAt
```

## 10. Atomic Lifecycle Updates
Status updates and audit-history creation are performed inside a Prisma transaction.
```text
Update ServiceRequest + Create StatusHistory = Single atomic transaction
```
If one operation fails, the other operation is not committed independently.
This protects data consistency.

## 11. Expanded Automated Confidence
The test suite was extended to cover the enhanced backend behavior.
Coverage includes:
- Request creation
- Unknown department rejection
- Valid lifecycle transitions
- Invalid lifecycle transitions
- Request assignment
- Cross-department assignment rejection
- Already-assigned request rejection
- Department inbox filtering
- Audit-history persistence
- Authentication-backed E2E flow

## 12. Full Product-Flow E2E Test
The E2E suite now verifies a complete product workflow.
```text
Employee Login → Create Request → Handler Login → Department Inbox → Claim Request → Start Progress → Complete Request → Verify Database → Verify Audit History
```
This tests the integrated system through real HTTP boundaries rather than only direct service calls.

## 13. Actor-Based Frontend Separation
The frontend was reorganized around user responsibilities.
Instead of mixing employee and handler functionality in one screen, the application now routes authenticated users to the correct workspace.
```text
Login
   ↓
Role
├── EMPLOYEE → Employee Portal
└── HANDLER  → Handler Portal
```
This improves product clarity while backend authorization remains authoritative.

## 14. Employee Portal
The Employee Portal supports:
- AI-assisted request analysis
- Structured AI suggestion review
- Manual-review feedback
- Request submission
- Submission success state
Flow:
```text
Describe → Analyze → Review → Submit
```

## 15. Handler Portal
The Handler Portal supports:
- Department-specific inbox
- Request metadata
- Claiming unassigned requests
- Starting work
- Completing requests
- Ownership-aware actions
The UI reflects backend state rather than acting as the security boundary.
