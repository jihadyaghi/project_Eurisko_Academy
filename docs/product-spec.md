# Internal Operations Service Hub
## 1. Problem / Context
Employees often request internal help through different and unstructured communication channels.
Examples include:
- Reporting a laptop or IT problem.
- Requesting access to a software system.
- Requesting an employment document from HR.
- Requesting help related to payroll, reimbursement, or expenses.
This creates several operational problems:
- Requests may be forgotten.
- Requests may be sent to the wrong department or person.
- Ownership of a request may be unclear.
- Employees may not know the current status of their request.
- Internal staff may not have a clear view of requests that belong to their department.
- Request progress may be difficult to track.
The company needs one internal system where employees can submit, track, and follow requests for help from departments such as IT, HR, and Finance.

## 2. Product Goal
The Internal Operations Service Hub provides a centralized workflow for internal service requests.
The system allows:
- Employees to authenticate and submit service requests.
- AI to assist employees during request intake.
- Employees to track their own requests.
- Department handlers to view requests belonging to their department.
- Handlers to claim requests and manage their lifecycle.
- Employees and handlers to view request details and status history.
- Administrators to manage employee and handler accounts.
- Employees to receive an email notification when a request is completed.
Critical business rules and authorization decisions are enforced by the backend Application Layer rather than trusted to the User Interface.

## 3. Actors / Roles
 ### 3.1 Employee
 An employee is a requester who needs help or a service from an internal department.
 Responsibilities and capabilities:
 - Authenticate to the system.
 - Use AI-assisted intake when preparing a request.
 - Submit a service request.
 - View their own submitted requests.
 - View the current status of their requests.
 - View request details.
 - View request status history.
 - See the assigned handler when a request has been claimed.
 - Receive an email notification when a request is completed.
 Employees cannot:
 - View requests belonging to other employees.
 - Access the handler inbox.
 - Claim requests.
 - Change request status.
 - Access administrator functionality.
 ### 3.2 Handler
 A handler is an internal department staff member responsible for handling service requests.
 Each handler belongs to a department such as IT, HR, or Finance.
 Responsibilities and capabilities:
 - Authenticate to the system.
 - View the request inbox for their department.
 - View request details for requests belonging to their department.
 - Claim an unassigned request from their department.
 - Start working on an assigned request.
 - Complete an assigned request.
 - View request status history.
 Handlers cannot:
 - Submit employee service requests through the employee request endpoint.
 - View requests belonging to another department.
 - Change the status of a request assigned to another handler.
 - Access administrator functionality.
 ### 3.3 Administrator
 An administrator manages access to the system.
 Responsibilities and capabilities:
 - Authenticate to the system.
 - View system users.
 - Create employee accounts.
 - Create handler accounts.
 - Assign handlers to a department.
 - Activate user accounts.
 - Deactivate employee and handler accounts.
 Administrator restrictions:
 - Additional administrator accounts cannot be created through the normal user-management endpoint.
 - Administrator accounts cannot be deactivated through the normal user-management endpoint.
 The initial administrator account is created separately through the administrator bootstrap process.

## 4. Supported Departments
The current system supports the following departments:
- IT
- HR
- Finance
These departments are application-owned values and are created as static system data.

## 5. Request Categories
Request categories are bounded by department.
### IT
- `hardware`
- `software`
- `access`
### HR
- `employment_document`
- `leave`
- `employee_support`
### Finance
- `reimbursement`
- `payroll`
- `expense`
A category must be valid for the selected department.

## 6. Request Priority
The supported request priorities are:
- `low`
- `normal`
- `high`
Priority values are bounded application values.

## 7. Request Lifecycle
The supported request lifecycle is:
```text
submitted -> in_progress -> completed
```
 ### Valid Transitions
 ```text
 submitted -> in_progress
 in_progress -> completed
 ```
 ### Invalid Transition Examples
 ```text
 submitted -> completed
 completed -> in_progress
 ```
 Status transition rules are enforced by the backend Application Layer.
 A handler must also be the assigned handler of the request before changing its status.

## 8. Functional Requirements
 ### FR-1: Authentication
 Users must authenticate before accessing protected system functionality.
 The system uses JWT-based authentication.
 After successful login, the authenticated identity includes the user's:
 - User ID
 - Email
 - Role
 - Department ID when applicable
 Inactive accounts must not be allowed to authenticate.
 ### FR-2: Role-Based Authorization
 The system must authorize actions according to the authenticated user's role.
 Supported roles are:
 ```text
 EMPLOYEE
 HANDLER
 ADMIN
 ```
 Authorization must be enforced by the backend and must not depend on client-side restrictions.

 ### FR-3: Employee Request Submission
 An authenticated employee must be able to submit a service request.
 The employee identity must be derived from the authenticated JWT identity rather than accepted from client-controlled request data.
 A submitted request must contain valid application-owned request information.
 New requests begin with the status:
 ```text
 submitted
 ```
 ### FR-4: AI-Assisted Request Intake
 The system provides AI-assisted intake to help an employee prepare a service request.
 The AI intake result uses the following structured shape:
 ```json
 {
   "department": "IT | HR | Finance | null",
   "category": "bounded category | null",
   "priority": "low | normal | high",
   "summary": "string",
   "needsReview": true
 }
 ```
 The AI may assist with:
 - Department classification.
 - Category classification.
 - Priority suggestion.
 - Request summarization.
 - Identifying when human review is required.
 AI output is advisory.
 The AI provider does not have final authority over application data or authorization decisions.
 All AI output must be validated against application-owned values before it is used.
 When the request is ambiguous, the system may return:
 ```text
 department = null
 category = null
 needsReview = true
 ```
 The application must not invent unsupported department or category values.
 ### FR-5: Employee Request Tracking
 An authenticated employee must be able to view their own submitted requests.
 The employee request list must not expose requests belonging to another employee.
 Requests are returned with the most recently created requests first.
 ### FR-6: Department Handler Inbox
 An authenticated handler must be able to view requests belonging to their department.
 A handler must not be able to use the handler inbox to access requests belonging to another department.
 ### FR-7: Request Claiming
 An authenticated handler must be able to claim an unassigned request from their own department.
 The system must verify:
 - The user is a handler.
 - The request belongs to the handler's department.
 - The request is currently unassigned.
 When successfully claimed, the handler becomes responsible for the request.
 ### FR-8: Request Status Management
 The assigned handler must be able to move a request through the supported lifecycle.
 The backend must verify:
 - The authenticated user is a handler.
 - The handler is assigned to the request.
 - The requested status transition is valid.
 Unauthorized or invalid transitions must be rejected without incorrectly changing the persisted request state.
 ### FR-9: Request Details
 Employees and handlers must be able to view detailed information for authorized requests.
 Request details include relevant information such as:
 - Request ID.
 - Title.
 - Description.
 - Department.
 - Category.
 - Priority.
 - Current status.
 - Assigned handler when available.
 - Creation time.
 - Update time.
 - Status history.
 An employee may only view their own request details.
 A handler may only view request details for requests belonging to their department.
 ### FR-10: Request Status History
 The system must preserve status transition history.
 A status history entry records:
 - Previous status.
 - New status.
 - User who performed the transition.
 - Timestamp.
 The request details interface presents this history as a timeline.
 Status history provides an audit trail for request lifecycle changes.
 ### FR-11: Administrator User Management
 An authenticated administrator must be able to view system users.
 An administrator must be able to create:
 - Employees.
 - Handlers.
 When creating a handler, a valid department is required.
 Employee accounts do not require a department assignment.
 Passwords must not be stored as plain text.
 The backend stores password hashes and must not expose password hashes through user-management responses.
 ### FR-12: Account Activation
 Administrators must be able to activate and deactivate employee and handler accounts.
 Inactive accounts must not be allowed to log in.
 Administrator accounts cannot be deactivated through the normal account-status endpoint.
 ### FR-13: Completion Email Notification
 When a service request successfully reaches the `completed` state, the system attempts to send a completion email to the employee who created the request.
 The email identifies the completed request.
 Notification delivery is secondary to the core request workflow.
 The request status and status-history transaction must be persisted before the notification attempt. 
 If the email provider fails, the already completed request must remain completed.
 Notification failure must not roll back a successful request completion.
 ### FR-14: Stored Session Validation
 The frontend may preserve authentication information between page reloads.
 When the application starts with a stored authentication token, the frontend validates the session with the backend.
 If the stored session is rejected by the backend:
 - Stored authentication data is cleared.
 - The local application session is removed.
 - The user is returned to the login page.
 The frontend must not treat locally stored authentication data alone as sufficient proof of a valid session.

## 9. Authorization Rules
The User Interface is treated as an untrusted boundary.
Critical authorization rules are enforced by the backend Application Layer.
 ### Employee Rules 
 An employee:
 - Can create a service request.
 - Can list their own requests.
 - Can view details of their own requests.
 - Cannot view another employee's request.
 - Cannot access the handler inbox.
 - Cannot claim requests.
 - Cannot change request status.
 - Cannot access administrator endpoints.
 ### Handler Rules
 A handler:
 - Can view the inbox for their department.
 - Can view request details from their department.
 - Can claim an unassigned request from their department.
 - Can update the status of a request assigned to them.
 - Cannot access requests from another department.
 - Cannot change the status of a request assigned to another handler.
 - Cannot create requests through the employee-only request endpoint.
 - Cannot access administrator endpoints.
 ### Administrator Rules
 An administrator:
 - Can access user-management functionality.
 - Can create employees and handlers.
 - Can activate or deactivate employee and handler accounts.
Normal user-management operations cannot:
- Create additional administrator accounts.
- Deactivate administrator accounts.

## 10. Application Validation
The backend is responsible for validating critical application-owned values and business rules.
This includes:
- Authentication.
- Role authorization.
- Employee ownership.
- Handler department boundaries.
- Assigned-handler ownership.
- Request status transitions.
- Supported departments.
- Supported categories.
- Supported priorities.
- AI-generated structured output.
Client-side validation may improve usability but is not considered a security boundary.

## 11. Non-Functional Requirements
 ### NFR-1: Security
 Protected operations require authentication.
 Authorization decisions are enforced by the backend.
 Passwords are stored as hashes rather than plain text.
 Application secrets and provider API keys are supplied through environment configuration and must not be committed to source control.
 ### NFR-2: Authorization
 The system must enforce role, ownership, department, and assignment boundaries consistently.
 Unauthorized actions must be rejected without changing protected application state.
 ### NFR-3: Usability
 The system should provide clear interfaces for:
 - Authentication.
 - Employee request submission.
 - AI-assisted intake.
 - Employee request tracking.
 - Handler request handling.
 - Request details and history.
 - Administrator user management.
 The user should receive clear feedback when an operation fails.
 ### NFR-4: Reliability
 Request data and request status changes must be persisted reliably.
 Status changes and their corresponding history records are persisted together as part of the same database transaction.
 A secondary integration failure, such as completion email delivery failure, must not undo an already successful core request operation.
 ### NFR-5: Maintainability
 The system separates responsibilities across frontend, backend application logic, persistence, AI provider integration, and notification provider integration.
 External providers are accessed through application abstractions where appropriate so that core product logic is not tightly coupled to a specific provider.
 ### NFR-6: Testability
 Critical business rules and authorization behavior must be testable independently of external providers.
 Automated tests use mocked notification behavior rather than sending real emails.
 AI behavior includes an evaluation set for expected intake behavior and failure cases.

## 12. AI Boundaries
AI is used only as an assistant during request intake.
AI does not:
- Authenticate users.
- Authorize users.
- Decide whether a protected action is allowed.
- Assign authenticated identity.
- Change request status.
- Override request ownership rules.
- Override department authorization.
- Write arbitrary values directly to durable application state.
The application owns:
- Allowed departments.
- Allowed categories.
- Allowed priorities.
- Authorization rules.
- Status lifecycle rules.
- Persistence decisions.
AI output is treated as untrusted structured input and is validated before use.
Provider or parsing failures are converted into controlled application errors rather than trusted as valid intake results.

## 13. External Provider Boundaries
 ### AI Provider
 The AI intake implementation uses a provider abstraction.
 The application can use a deterministic provider for predictable development/testing behavior and an external AI provider for real AI-assisted intake.
 The product contract remains owned by the application rather than by the external provider.
 ### Email Provider
 Completion notifications use an email-provider abstraction.
 The current external email integration is used only for notification delivery.
 Email delivery failure does not control or reverse the service-request lifecycle.

## 14. Resolved Product Decisions
Several questions from the initial product definition were resolved during implementation.
 ### Authentication
 Initial question:
 ```text
 How will users authenticate to the system?
 ```
 Resolved decision:
 ```text
 JWT-based authentication.
 ```
 ### Roles
 Resolved roles:
 ```text
 EMPLOYEE
 HANDLER
 ADMIN
 ```
 ### Request Statuses
 Initial question:
 ```text
 What request statuses should exist?
 ```
 Resolved lifecycle:
 ```text
 submitted -> in_progress -> completed
 ```
 ### Request Ownership
 Initial question:
 ```text
 Who is responsible for assigning or taking ownership of a request?
 ```
 Resolved decision:
 A handler can claim an unassigned request belonging to the handler's department.
 After assignment, only the assigned handler can perform request status transitions.
 ### Request Routing
 Initial question:
 ```text
 How is the appropriate department for a request determined?
 ```
 Resolved decision:
 The system supports bounded IT, HR, and Finance departments.
 AI may assist with department and category classification during intake, but its output is advisory and application-validated.
 ### Request History
 Initial question:
 ```text
 Are audit logs or request history required?
 ```
 Resolved decision:
 Status transitions are persisted as request status history and are displayed in request details.
 ### Notifications
 Initial question:
 ```text
 Are notifications required?
 ```
 Resolved decision:
 The system sends an email notification attempt when a request is completed.
 Notification failure does not roll back request completion.
 ### User Administration
 Resolved decision:
 Administrators manage employee and handler accounts through a dedicated administrator interface.
 The first administrator is created separately through a bootstrap process.

## 15. Current Constraints
The current implementation has the following intentional constraints:
- The system is designed for internal company use.
- Supported departments are currently limited to IT, HR, and Finance.
- Request categories are bounded application values.
- Request priorities are limited to `low`, `normal`, and `high`.
- The request lifecycle is limited to `submitted`, `in_progress`, and `completed`.
- A handler operates within one assigned department.
- The system uses application-managed user accounts rather than company SSO.
- AI is limited to assisted request intake.
- Email notifications are limited to request completion.
- Administrator functionality is focused on user management.

## 16. Non-Goals / Future Scope
The following functionality is not part of the current implemented product:
- External customer support.
- File attachments.
- Advanced analytics and reporting.
- SLA management.
- A dedicated approval workflow.
- Password-reset workflow.
- Company SSO integration.
- Chat or messaging between employees and handlers.
- Push notifications.
- SMS notifications.
- Administrator management of service-request lifecycle.
- Fully autonomous AI request handling.
- AI-controlled authorization or business decisions.
AI-assisted intake was not part of the initial product scope and was introduced later as a controlled product enhancement.
External integrations are limited to the integrations required by the implemented AI-assisted intake and completion email notification functionality.

## 17. Acceptance Criteria
 ### AC-1: Authentication
 Given a valid active user account,
 when the user provides valid credentials,
 then the system authenticates the user and provides access according to the user's role.
 ### AC-2: Inactive Account Protection
 Given a user account is inactive,
 when the user attempts to authenticate,
 then authentication is rejected.
 ### AC-3: Request Submission
 Given an authenticated employee,
 when the employee submits a valid service request,
 then the request is successfully created under that employee's authenticated identity with status `submitted`.
 ### AC-4: AI-Assisted Intake
 Given an employee provides request information to the AI intake feature,
 when the AI intake succeeds,
 then the result follows the application-owned structured contract and contains only supported values.
 If the request cannot be classified safely,
 then the result indicates that review is required instead of inventing unsupported classification values.
 ### AC-5: Employee Request Tracking
 Given an employee has submitted requests,
 when the employee opens their request list,
 then their own requests are visible.
 Requests belonging to another employee must not be exposed.
 ### AC-6: Handler Department Inbox
 Given an authenticated handler,
 when the handler opens the request inbox,
 then requests for the handler's department are available.
 Requests from another department must not be exposed through the handler inbox.
 ### AC-7: Request Claiming
 Given an unassigned request belongs to the handler's department,
 when the handler claims the request,
 then the handler becomes the assigned handler.
 A handler must not be allowed to claim a request from another department.
 ### AC-8: Valid Status Transition
 Given a request is assigned to the authenticated handler and currently has status `submitted`,
 when the handler changes the status to `in_progress`,
 then the request status is updated and a status-history entry is created.
 Given the same request is `in_progress`,
 when the assigned handler changes the status to `completed`,
 then the request is completed and the transition is recorded.
 ### AC-9: Invalid Status Transition
 Given a request is currently `submitted`,
 when a handler attempts to move it directly to `completed`,
 then the transition is rejected and the persisted request remains in its valid previous state.
 ### AC-10: Assigned Handler Authorization
 Given a request is assigned to one handler,
 when another handler attempts to change its status,
 then the operation is rejected and the request state remains unchanged.
 ### AC-11: Employee Request Ownership
 Given an employee attempts to access another employee's request,
 when the request-details operation is performed,
 then access is rejected.
 ### AC-12: Handler Department Authorization
 Given a handler belongs to one department,
 when the handler attempts to access a request belonging to another department,
 then access is rejected.
 ### AC-13: Request Details and History
 Given an authorized employee or handler opens a request,
 when request details are loaded,
 then the current request information and status-history timeline are visible.
 ### AC-14: Administrator User Creation
 Given an authenticated administrator,
 when the administrator creates a valid employee or handler account,
 then the user is created without exposing the stored password hash.
 A handler must have a valid department.
 ### AC-15: Account Activation
 Given an authenticated administrator,
 when the administrator deactivates an employee or handler,
 then that account can no longer authenticate.
 When the account is activated again,
 then it may authenticate with valid credentials.
 ### AC-16: Administrator Protection
 Given an administrator account,
 when the normal user-management status endpoint is used to attempt to deactivate that administrator,
 then the operation is rejected.
 Additional administrator accounts must not be creatable through the normal user-creation endpoint.
 ### AC-17: Completion Notification
 Given an assigned handler successfully moves a request from `in_progress` to `completed`,
 when the completion transaction succeeds,
 then the system attempts to send a completion email to the employee.
 If notification delivery fails,
 then the request remains completed and its persisted status history remains valid.
 ### AC-18: Stored Session Validation
 Given the frontend contains stored authentication data,
 when the application starts,
 then the stored session is validated with the backend.
 If the backend rejects the session,
 then the stored authentication state is cleared and the user is returned to the login page.

## 18. Product Boundary Summary
The current product provides a complete internal request journey:
```text
Employee authenticates
        |
        v
AI assists request intake
        |
        v
Employee submits request
        |
        v
Request is stored as submitted
        |
        v
Department handler sees request
        |
        v
Handler claims request
        |
        v
submitted -> in_progress
        |
        v
in_progress -> completed
        |
        v
Status history is preserved
        |
        v
Completion email is attempted
```