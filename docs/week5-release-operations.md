# Week 5 — Release & Operations
## Internal Operations Service Hub
This document describes how the Internal Operations Service Hub is released, configured, verified, monitored, and recovered in a production-like environment.
The goal of Week 5 is to demonstrate that the system can operate independently of the developer's local machine.

## 1. Release Objective
The Internal Operations Service Hub is deployed as a remotely accessible full-stack application.
The production release must allow a user to complete the critical product journey without depending on localhost or the developer's machine.
The critical journey is:
1. Open the deployed application.
2. Authenticate with a valid account.
3. An employee creates a service request.
4. AI-assisted intake analyzes the request.
5. The request is persisted in the database.
6. An authorized handler views requests for their department.
7. The handler claims the request.
8. The handler performs valid status transitions.
9. The employee can view the updated request and its status history.
10. Unauthorized or invalid actions are rejected without corrupting persisted state.
The system also provides an Admin Portal for managing employee and handler accounts.
 ### Production Endpoints
 - **Frontend:** https://project-eurisko-academy.vercel.app/
 - **Backend:** https://projecteuriskoacademy-production.up.railway.app
 - **Repository:** https://github.com/jihadyaghi/project_Eurisko_Academy.git

## 2. Production Architecture
The deployed system contains three main runtime components:
```text
User Browser
     |
     v
Frontend
     |
     | HTTPS / REST API
     v
NestJS Backend
     |
     +--------------------+
     |                    |
     v                    v

Production Database   AI Provider
                          |
                          v
                     OpenRouter

```
 ### Frontend
 The frontend is implemented using:
 - React
 - TypeScript
 - Vite
 The frontend is deployed remotely and communicates with the backend through its production API URL.
 ### Backend
 The backend is implemented using:
 - NestJS
 - TypeScript
 - Prisma
 - JWT authentication
 - Role-based authorization
 The backend owns validation, authorization, request lifecycle rules, persistence, and AI orchestration.
 ### Database
 Persistent application data is stored in the production database.
 The database stores:
 - Users
 - Departments
 - Service requests
 - Service Request Status
 Application state must survive application restarts and redeployments.
 ### AI Provider
 AI-assisted request intake uses a provider abstraction.
 The production configuration uses OpenRouter.
 AI output is advisory only.
 The application validates AI output before it can influence product state.
 ### Email Notification Provider
 Completion notifications are delivered through Resend.
 When a Service Request successfully reaches `completed`, the system attempts to send a completion email to the employee.
 Email delivery is treated as an external side effect. A notification-provider failure does not roll back a valid Service Request completion or corrupt persisted lifecycle state. The failure can be diagnosed through backend/deployment logs while the completed request remains durable.

## 3. Application Roles
The system supports three roles.
 ### Employee
 Employees can:
 - Sign in.
 - Describe an internal service request.
 - Use AI-assisted request intake.
 - Submit a request.
 - View their own requests.
 - View request details.
 - View request status history.
 Employees cannot manage other users or perform handler actions.
 ### Handler
 Handlers belong to a department.
 Handlers can:
 - Sign in
 - View requests for their department.
 - Claim eligible unassigned requests.
 - Move assigned requests through valid lifecycle transitions.
 - View request details and status history.
 A handler cannot operate on requests outside their authorized department.
 ### Admin
 Administrators can:
 - Sign in to the Admin Portal.
 - View system users.
 - Create Employee accounts.
 - Create Handler accounts.
 - Assign handlers to departments.
 - Activate accounts.
 - Deactivate accounts.

## 4. Request Lifecycle
The supported lifecycle is:
```text
submitted
    |
    v
in_progress
    |
    v
completed
```
Valid transitions:
```text
submitted -> in_progress
in_progress -> completed
```
Invalid transitions are rejected by the backend.
Examples include:
```text
submitted -> completed
completed -> in_progress
```
The frontend is not trusted to enforce these rules.
The backend application layer remains authoritative.

## 5. Authentication and Authorization
Authentication uses JWT access tokens.
After a successful login, the token identifies:
- User ID
- Email
- Role
- Department
Protected backend endpoints validate the JWT before processing the request.
Role-based authorization is implemented using NestJS guards.
Examples:
```text
Employee
→ Employee endpoints

Handler
→ Handler workflow endpoints

Admin
→ Administrative endpoints
```
Authorization decisions are performed on the server.
The UI is not considered a security boundary.

## 6. Account Provisioning
Departments are reference data and are created through the database seed process.
The seed does not create normal demo employees or handlers.
The initial administrator is created through a dedicated bootstrap process.
The provisioning flow is:
```text
Database
    |
    v
Seed Departments
    |
    v
Bootstrap Initial Admin
    |
    v
Admin Login
    |
    v
Create Employees / Handlers
```
This separates static reference data from user provisioning.

## 7. AI-Assisted Request Intake
The AI feature helps classify an employee's request.
The AI returns structured information containing:
```json
{
  "department": "IT | HR | Finance | null",
  "category": "bounded category | null",
  "priority": "low | normal | high",
  "summary": "string",
  "needsReview": true
}
```
 ### Supported departments:
 - IT
 - HR
 - Finance
 ### Supported priorities:
 - low
 - normal
 - high
 ### Supported categories:
  #### IT
  - hardware
  - software
  - access
  #### HR
  - employment_document
  - leave
  - employee_support
  #### Finance
  - reimbursement
  - payroll
  - expense
The backend validates the AI response against product-owned values.
The AI does not have authority to bypass:
- Authentication
- Authorization
- Lifecycle rules
- Product validation
- Persistence rules
If the provider fails, the backend returns a controlled error rather than silently accepting invalid output.

## 8. Production Configuration
Runtime configuration is supplied through environment variables.
Sensitive values are not committed to Git.
Examples of required backend configuration include:
```env
DATABASE_URL="...."
AI_INTAKE_PROVIDER="openrouter"
OPENROUTER_API_KEY="......."
JWT_SECRET="....."
ADMIN_NAME="....."
ADMIN_EMAIL="......"
ADMIN_PASSWORD="....."
RESEND_API_KEY= "......."
EMAIL_FROM="......."
```
Production values are configured through the deployment platform.
The repository must not contain production secrets.
The local .env file is ignored by Git.

## 9. Frontend Production Configuration
The frontend must communicate with the deployed backend rather than localhost.
The production API base URL is configured for the deployed environment.
No critical production journey should depend on:
```text
localhost
127.0.0.1
```
The deployed frontend and backend must communicate over the remote network.

## 10. Release Gate
A release should not be considered ready only because it builds successfully.
Before release, the following checks must pass.
 ### Backend
 ```bash
 npm install
 npm run build
 npm test
 ```
 Where applicable, the release also verifies:
 - Unit tests
 - Integration tests
 - End-to-end tests
 - AI evaluation tests
 ### Frontend
 ```bash
 npm install
 npm run build
 ```
 The production frontend build must complete without TypeScript or Vite errors.
 A failed build blocks the release.

## 11. Deployment Verification
After deployment, verify that both applications are remotely reachable.
 ### Frontend Verification
 Confirm:
 - Application loads through the public URL.
 - Login page renders.
 - Static assets load correctly.
 - No production request depends on localhost.
 ### Backend Verification
 Confirm:
 - Backend is reachable remotely.
 - Authentication endpoints respond.
 - Protected endpoints enforce authentication.
 - Database connectivity works.
 - AI integration is reachable when required.
- Resend email integration is configured for completion notifications.

## 12. Critical Journey Smoke Test
 ### Step 1 — Login as Employee
 Verify that a valid employee can authenticate.
 Expected result:
 ```text
 Login succeeds.
 Employee Portal is displayed.
 ```
 ### Step 2 — Analyze a Request
 Enter a realistic internal support request.
 Example:
 ```text
 My company laptop keeps shutting down while I am working.
 ```
 Run AI-assisted analysis.
 Expected result:
 - A valid department is suggested.
 - A bounded category is returned.
 - Priority is valid.
 - A summary is generated.
 - The response satisfies the product schema.
 ### Step 3 — Submit Request
 Submit the analyzed request.
 Expected result:
 ```text
 Request persisted successfully.
 Status = submitted.
 ```
 ### Step 4 — Verify Employee Tracking
 Open My Requests.
 Expected result:
 - Newly created request appears.
 - Request details are accessible.
 - Current status is visible.
 ### Step 5 — Login as Handler
 Authenticate using a handler from the appropriate department.
 Expected result:
 ```text
 Handler Portal is displayed.
 Department inbox loads.
 ```
 ### Step 6 — Claim Request
 Claim the unassigned request.
 Expected result:
 ```text
 handlerId = authenticated handler
 ```
 The request remains persisted.
 ### Step 7 — Start Work
 Perform:
 ```text
 submitted -> in_progress
 ```
 Expected result:
 - Transition succeeds.
 - Request status changes.
 - Audit/status-history record is persisted.
 ### Step 8 — Complete Work
 Perform:
 ```text
 in_progress -> completed
 ```
 Expected result:
 - Transition succeeds.
 - Request status becomes completed.
 - Another status-history record is persisted.
 - A completion notification is attempted for the employee through the configured email provider.
 ### Step 9 — Employee Verification
 Login again as the employee.
 Expected result:
 - Request displays completed.
 - Request details display the assigned handler.
 - Status history shows the lifecycle changes.

## 13. Negative-Path Verification
The release must also prove that invalid behavior is rejected.
Examples:
 ### Unauthorized Request Access
 An employee attempts to access another employee's request.
 Expected:
 ```text
 403 Forbidden
 ```
 Persisted request state remains unchanged.
 ### Wrong Department
 A handler attempts to access or operate on a request outside their department.
 Expected:
 ```text
 Request rejected.
 ```
 Persisted state remains unchanged.
 ### Invalid Lifecycle Transition
 Attempt:
 ```text
 submitted -> completed
 ```
 Expected:
 ```text
 Request rejected.
 ```
 The stored status remains:
 ```text
 submitted
 ```
 ### Inactive Account
 Deactivate a user through the Admin Portal.
 Attempt to authenticate with that account.
 Expected:
 ```text
 401 Unauthorized
 Account is inactive.
 ```
 Reactivate the account and verify that authentication works again.

## 14. Health and Operational Visibility
The deployed backend must provide enough operational visibility to determine whether the service is functioning.
Operational checks should make it possible to distinguish between:
```text
Application healthy
Database unavailable
Configuration missing
External AI provider unavailable
Application failure
```
Production logs should provide useful diagnostic information without exposing secrets.
Sensitive values such as:
- Passwords
- JWT secrets
- API keys
- Authorization tokens
must never be written to logs.

## 15. Controlled Failure and Recovery
A production system must demonstrate predictable behavior when a dependency fails.
A controlled failure should be introduced during release verification.
One suitable scenario is temporary AI provider failure or invalid AI configuration.
Expected behavior:
```text
AI dependency fails
        |
        v
Backend catches provider failure
        |
        v
Controlled API error
        |
        v
Application remains running
```
 ### Email Provider Failure
 Email delivery is a secondary external side effect and must not control the core Service Request transaction. 
 Expected behavior:
 ```text
 Request reaches completed
         |
         v
 Completion state is persisted
         |
         v
 Email notification is attempted
         |
         v
 Email provider fails
         |
         v
 Failure is logged / surfaced operationally
         |
         v
 Completed request remains completed
 ```
 ### Recovery Procedure
 1. Identify the failing dependency from deployment logs and environment configuration.
 2. Correct the affected configuration or restore the external provider.
 3. Redeploy or restart the affected service when required.
 4. Verify that the backend is remotely reachable.
 5. Verify that database-backed state is still present.
 6. Re-run the affected integration path or critical journey.
 7. Confirm that no secrets were exposed during diagnosis.
 ### Post-Recovery Verification
 After recovery, verify:
 - Login succeeds for an active account.
 - Existing persisted Service Requests remain available.
 - Employee, Handler, and Admin authorized flows remain accessible.
 - Valid lifecycle transitions continue to work.
 - AI-assisted intake responds when OpenRouter is healthy.
 - Completion email delivery can be attempted when Resend is healthy.
 - Production logs do not show a continuing configuration or dependency failure.

## 16. Persistence Verification
Persistence must be verified independently from the frontend state.
Create a request through the deployed application.
Then restart or redeploy the application.
After recovery:
```text
Login
→ My Requests
→ previously created request still exists
```
This demonstrates that durable application state does not depend on application memory or the developer's laptop.

## 17. Security Checks
Before final release, verify:
- .env is not committed.
- Production secrets are not present in source code.
- Passwords are stored as hashes.
- JWT-protected endpoints reject unauthenticated access.
- Admin endpoints require ADMIN.
- Handler actions require HANDLER.
- Employee request access is ownership-scoped.
- Handler access is department-scoped.
- Lifecycle transitions are validated server-side.
- AI output is validated before use.
- Email provider credentials are supplied only through environment configuration and are not committed to Git.

## 18. Three-Stranger Test
The final system should satisfy three independent users.
 ### Stranger User
 A person unfamiliar with the code should be able to:
 ```text
 Open live application
 → Login
 → Understand the UI
 → Create request
 → Track request
 ```
 without assistance from the developer.
 ### Stranger Engineer
 An engineer unfamiliar with the project should be able to:
 ```text
 Clone repository
 → Follow README
 → Install dependencies
 → Configure environment
 → Run tests
 → Build application
 ```
 without undocumented setup knowledge.
 ### Stranger Operator
 An operator should be able to determine:
 ```text
 Is the service running?
 Did deployment succeed?
 Is the database reachable?
 Did a dependency fail?
 Can the service recover?
 ```
 using deployment status, health information, and logs.

## 19. Final Release Record
Complete this section immediately before submission.
```text
Repository: https://github.com/jihadyaghi/project_Eurisko_Academy.git
Final Commit SHA: [Finalize Week 5 documentation and README]
Live Frontend: https://project-eurisko-academy.vercel.app/
Live Backend: https://projecteuriskoacademy-production.up.railway.app
Release Status: GO
Release Date: September 29, 2026
```

## 20. Demo Access
Document the accounts required to demonstrate each role.

```text
Admin
Email: admin@example.com
Password: admin123

Employee
Email: jihadyaghie@gmail.com
Password: 12345678

IT Handler
Email: jihad.it@gmail.com
Password: 12345678

HR handler
Email: jihad.hr@gmail.com
Password: 12345678

Finance handler
Email: jihad.finance@gmail.com
Password: 12345678
```


