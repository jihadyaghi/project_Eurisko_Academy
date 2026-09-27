# Product Enhancements Beyond the Core Assignment
## Purpose
This document highlights product and engineering enhancements added beyond the minimum academy requirements.
The goal of these additions is to improve:
- Product realism
- Maintainability
- Security boundaries
- End-to-end usability
- Testing confidence
- Operational clarity
- Demonstration quality
These enhancements extend the original assignment without changing the core product goal.

## 1. Extended Relational Data Model
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
- Administrators
- Departments
- Request ownership
- Request assignment
- Request lifecycle state
- Lifecycle history
- User activation state
The `User` model also includes:
```text
role
departmentId
isActive
```
to support role-based workflows and account administration.

## 2. Backend Authentication
JWT-based authentication was added to replace the earlier simplified demo identity.
Authentication flow:
```text
Email + Password
        ↓
User lookup
        ↓
Active-account check
        ↓
bcrypt password verification
        ↓
JWT access token
        ↓
Authenticated API access
```
Passwords are stored as bcrypt hashes rather than plain text.
The backend exposes:
```http
POST /auth/login
GET /auth/me
```
The authenticated user is derived from the verified JWT rather than trusted from client-provided IDs.

## 3. Expanded Role-Based Authorization
The system now distinguishes between three roles:
```text
EMPLOYEE
HANDLER
ADMIN
```
The backend applies role-based authorization using guards and role metadata.
Examples:
```text
EMPLOYEE
→ Create service requests
→ View own requests
→ View own request details

HANDLER
→ Access department inbox
→ Claim requests
→ View department request details
→ Change assigned request lifecycle status

ADMIN
→ View users
→ Create employees and handlers
→ Activate / deactivate users
```
The frontend may hide role-inappropriate actions, but backend authorization remains authoritative.

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
This prevents the client from impersonating another handler by sending a different handler ID.

## 5. Authenticated Employee Identity
Request ownership is also derived from authentication.
When an employee creates a request:
```text
employeeId = authenticated employee ID
```
The employee cannot provide another employee ID as the authoritative request owner.
This prevents client-controlled identity spoofing.

## 6. Employee Request Submission
The AI-assisted Request Intake capability was connected to a real Service Request creation flow.
Current product flow:
```text
Employee Login
        ↓
Describe Request
        ↓
AI Analysis
        ↓
Review Suggestion
        ↓
Submit Request
        ↓
Backend Validation
        ↓
Persist in Database
```
The backend creates the request with:
```text
employeeId = authenticated employee
status = submitted
handlerId = null
```
The employee does not control request ownership.

## 7. Human Confirmation Before Persistence
AI suggestions are not automatically persisted.
The flow remains:
```text
AI proposes
      ↓
Software validates
      ↓
Employee reviews
      ↓
Employee submits
      ↓
Backend validates
      ↓
Request is persisted
```
This preserves the AI authority boundary.
AI remains advisory rather than authoritative.

## 8. Bounded AI Output Validation
The AI output is constrained to product-owned values.
The structured result contains:
```text
department
category
priority
summary
needsReview
```
Supported departments are:
```text
IT
HR
Finance
```
Supported priority values are:
```text
low
normal
high
```
Categories are also bounded by department.
The application validates:
- Department values
- Category values
- Priority values
- Department/category relationships
- Structured response shape
Invalid or malformed AI output is rejected.

## 9. Safe AI Review State
When the request cannot be classified confidently or safely, the system can return:
```text
department = null
category = null
needsReview = true
```
This avoids silently inventing unsupported routing values.
The user receives a manual-review state instead of an unsafe automatic classification.

## 10. Department-Based Handler Inbox
Handlers can retrieve requests for their own department.
Example endpoint:
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
The client does not choose the department authorization filter.

## 11. Request Claim / Assignment Flow
New requests initially have:
```text
handlerId = null
```
A handler can claim a request from the same department.
Flow:
```text
Department Inbox
        ↓
Unassigned Request
        ↓
Claim Request
        ↓
Backend verifies department
        ↓
handlerId = authenticated handler
```
The backend rejects:
- A handler claiming a request from another department
- A handler without an assigned department
- A request that has already been assigned

## 12. Explicit Request Lifecycle
The request lifecycle was formalized as:
```text
submitted -> in_progress -> completed
```
Allowed transitions are:
```text
submitted -> in_progress
in_progress -> completed
```
Invalid transitions are rejected by the backend.
Examples:
```text
submitted -> completed
completed -> in_progress
```
Only the assigned handler may change request status.

## 13. Request Audit History
Lifecycle transitions are recorded in:
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
This preserves an audit trail instead of storing only the current state.

## 14. Atomic Lifecycle Updates
Status updates and audit-history creation are performed inside a Prisma transaction.
```text
Update ServiceRequest status
        +
Create StatusHistory
        =
Single atomic transaction
```
If one database operation fails, the other is not committed independently.
This protects lifecycle consistency.

## 15. Employee "My Requests" Tracking
Employees can view the requests they have submitted.
The backend uses the authenticated employee identity to filter results.
```text
Authenticated Employee
        ↓
GET My Requests
        ↓
employeeId = authenticated user ID
        ↓
Only employee-owned requests returned
```
The employee cannot request another employee's request list by sending an arbitrary employee ID.

## 16. Request Details View
Employees and handlers can open a detailed view of a request.
The request details interface includes:
- Request ID
- Title
- Description
- Department
- Category
- Priority
- Current status
- Assigned handler
- Creation timestamp
- Update timestamp
- Status history
This provides a more complete product experience than only showing request cards.

## 17. Visual Status Timeline
The request details interface displays lifecycle history as a timeline.
Example:
```text
Submitted
    ↓
In Progress
Changed by Handler
    ↓
Completed
Changed by Handler
```
This makes the audit history visible to authorized users.

## 18. Request Detail Authorization
Request-detail access was hardened beyond role checks.
### Employee Rule
```text
serviceRequest.employeeId
must equal
authenticated employee ID
```
An employee cannot view another employee's request.
### Handler Rule
```text
serviceRequest.departmentId
must equal
authenticated handler departmentId
```
A handler cannot view requests from another department.
These checks are enforced by the backend.

## 19. Public Request Listing Removed
An unrestricted endpoint for listing all Service Requests was removed.
The previous public-style behavior:
```http
GET /service-requests
```
is no longer exposed.
Request access now happens through authorized flows such as:
```http
GET /service-requests/my
GET /service-requests/handler/inbox
GET /service-requests/:id
```
with backend authorization rules applied.
This reduced unnecessary data exposure.

## 20. Negative Authorization Testing
The automated E2E suite was expanded to test denied behavior, not only successful behavior.
Negative cases include:
- Missing authentication token
- Employee accessing handler inbox
- Handler using employee-only request creation
- Employee viewing another employee's request
- Handler viewing a request from another department
- Non-assigned handler attempting a status transition
- Public unrestricted request listing not being available
This verifies that security rules are enforced by the backend rather than by UI visibility alone.

## 21. Persisted-State Verification After Rejection
Authorization tests also verify that rejected actions do not corrupt valid stored state.
Example:
```text
Different handler attempts status change
        ↓
403 Forbidden
        ↓
Request remains assigned to original handler
        ↓
Status remains unchanged
```
This provides stronger confidence than checking only the HTTP response.

## 22. Expanded Automated Confidence
The test suite now covers:
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
- Request ownership authorization
- Department authorization
- Assigned-handler authorization
- Completion notification triggering
- Notification failure behavior
- AI evaluation behavior
The automated suite uses separate development and test databases.

## 23. Full Product-Flow E2E Test
The E2E suite verifies a complete product workflow.
```text
Employee Login
        ↓
Create Request
        ↓
Handler Login
        ↓
Department Inbox
        ↓
Claim Request
        ↓
Start Progress
        ↓
Complete Request
        ↓
Verify Database
        ↓
Verify Audit History
        ↓
Verify Notification Trigger
```
This tests the integrated application through HTTP boundaries rather than only direct service calls.

## 24. Actor-Based Frontend Separation
The frontend was reorganized around user responsibilities.
Instead of mixing all functionality in one screen, authenticated users are routed to the correct workspace.
```text
Login
   ↓
Role
├── EMPLOYEE → Employee Portal
├── HANDLER  → Handler Portal
└── ADMIN    → Admin Portal
```
This improves product clarity while backend authorization remains authoritative.

## 25. Employee Portal
The Employee Portal supports:
- AI-assisted request analysis
- Structured AI suggestion review
- Manual-review feedback
- Request submission
- Submission success state
- My Requests tracking
- Request Details
- Status timeline
- Assigned-handler visibility
Main flow:
```text
Describe
   ↓
Analyze
   ↓
Review
   ↓
Submit
   ↓
Track
   ↓
View Details
```

## 26. Handler Portal
The Handler Portal supports:
- Department-specific inbox
- Request metadata
- Request details
- Status history
- Claiming unassigned requests
- Starting work
- Completing requests
- Ownership-aware actions
The UI reflects backend state rather than acting as the security boundary.

## 27. Administrator Role
A dedicated `ADMIN` role was added.
The administrator is responsible for user provisioning and account access management.
Current administrator capabilities include:
- View system users
- Create employees
- Create handlers
- Assign handler departments
- Activate employee and handler accounts
- Deactivate employee and handler accounts
This closes the earlier product gap where users existed only through seed/demo data.

## 28. Administrator Portal
A dedicated Admin Portal was added to the frontend.
The portal includes:
- User statistics
- User list
- Employee creation form
- Handler creation form
- Department selection for handlers
- Account status visibility
- Activate / Deactivate actions
The administrator workflow is separated from employee and handler workflows.

## 29. Administrator Security Restrictions
User-management rules are enforced by the backend.
The normal user-management endpoint does not allow:
```text
Creating another ADMIN account
```
The normal account-status endpoint does not allow:
```text
Deactivating an ADMIN account
```
These restrictions prevent normal administrative user management from modifying privileged administrator provisioning.

## 30. Initial Administrator Bootstrap
The earlier seed-based user provisioning was replaced with a separate initial-administrator bootstrap process.
The first administrator is created using environment-supplied administrator credentials.
After the initial administrator exists:
```text
Admin Login
      ↓
Admin Portal
      ↓
Create Employees / Handlers
```
This separates privileged bootstrap provisioning from normal user creation.

## 32. Account Activation / Deactivation
An `isActive` field was added to the `User` model.
```text
isActive = true
```
represents an active account.
```text
isActive = false
```
represents a disabled account.
Administrators can change employee and handler account status.
Inactive users are rejected during authentication.

## 33. Completion Email Notification
A completion notification was added.
When a request successfully reaches:
```text
completed
```
the system attempts to send an email to the employee who created the request.
The message includes request information such as:
- Request ID
- Request title
- Completed status
This improves the employee experience because the employee does not need to continuously check the portal to discover that the request is complete.

## 34. Notification Provider Abstraction
Email delivery is accessed through an application-owned provider boundary.
```text
NotificationsService
        ↓
EmailProvider
        ↓
ResendEmailProvider
```
This prevents the core Service Request logic from depending directly on a specific email SDK.
A Console Email Provider was also useful during development before real delivery was enabled.

## 35. Non-Blocking Notification Failure
Completion email delivery is intentionally secondary to the core request lifecycle.
The order is:
```text
Persist request completion
        +
Persist status history
        ↓
Commit database transaction
        ↓
Attempt email notification
```
If the email provider fails:
```text
Request remains completed
Status history remains valid
Email delivery fails separately
```
This prevents external provider failure from corrupting authoritative business state.

## 36. Real Email Integration
The external notification implementation uses Resend.
Provider secrets are supplied through environment configuration rather than hard-coded source values.
Sensitive values such as:
```text
RESEND_API_KEY
EMAIL_FROM
```
are not committed to source control.

## 37. Notification Testing Isolation
Automated tests do not send real emails.
`NotificationsService` is mocked in unit and E2E tests.
This ensures:
- Tests remain deterministic
- Tests do not require external email availability
- Test runs do not consume external provider calls
- Fake test addresses do not cause provider validation failures
At the same time, tests verify that completion triggers the expected notification call.

## 38. Stored Session Validation
The frontend previously trusted authentication data stored in local storage when the application restarted.
This was hardened by validating the stored token against:
```http
GET /auth/me
```
Application startup now follows:
```text
Stored token exists
        ↓
Validate with backend
        ↓
Valid?
├── Yes → Restore authenticated workspace
└── No  → Clear local authentication → Login Page
```
This prevents stale or invalid browser state from opening a dashboard with an unauthorized session.

## 39. Persistent Login With Backend Validation
The application still supports persistent login between page reloads.
The enhancement does not remove session persistence.
Instead, it changes the trust model:
```text
localStorage
≠
authentication authority
```
The backend remains authoritative about whether a stored session is currently accepted.

## 40. Provider Isolation
Both major external integrations use application boundaries.
### AI
```text
Application
   ↓
AI Provider abstraction
   ↓
External AI provider
```
### Email
```text
Application
   ↓
Email Provider abstraction
   ↓
Resend
```
This keeps external SDK details separated from core business rules.

## 41. Product Boundary Improvements
The final system now has clearer boundaries between responsibilities.
```text
Frontend
→ User interaction
Authentication Layer
→ Identity
Authorization Layer
→ Permission decisions
Service Request Application Logic
→ Business workflow
Prisma
→ Persistence
AI Provider
→ Advisory request classification
Notification Provider
→ Secondary email delivery
```
No external provider owns critical authorization or lifecycle decisions.
