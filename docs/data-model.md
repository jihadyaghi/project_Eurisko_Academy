# Internal Operations Service Hub - Data Model
## 1. Domain
 ### Important Entities
  #### Employee
  Represents an employee who submits and follows internal service requests.
  #### Internal Department
  Represents an internal company department, such as IT, HR, or Finance, that is responsible for handling relevant service requests.
  #### Service Request
  Represents an internal request submitted by an employee for help or a service from an internal department.
 ### Relationships
 - An Employee submits Service Requests.
 - Each Service Request is associated with the Employee who submitted it.
 - A Service Request is directed to an Internal Department.
 - An Internal Department handles Service Requests related to that department.
 ### Cardinality
 - One Employee can submit many Service Requests.
 - Each Service Request is submitted by one Employee.
 - One Internal Department can handle many Service Requests.
 - Each Service Request is directed to one Internal Department.
 ### Conceptual Domain Diagram
 ```mermaid
 erDiagram
    EMPLOYEE ||--o{ SERVICE_REQUEST : submits
    INTERNAL_DEPARTMENT ||--o{ SERVICE_REQUEST : handles
 ```
 ### Ownership
 - Each Service Request is associated with the Employee who submitted it.
 - A Service Request may be assigned to an authorized staff member responsible for handling it.
 - Request ownership should remain clear so that the system can show who is currently responsible for handling  the request.
 - The exact mechanism for assigning ownership is not yet defined and requires clarification.

## 2. Lifecycle + Rules
 ### State Transitions
 A Service Request has a lifecycle that represents its current progress.
 A possible initial lifecycle is:
 `Submitted -> In Progress -> Completed`
 These states are currently proposed for modeling purposes. The exact set of request statuses and allowed transitions requires further clarification.
 ### Invariants
 - Every Service Request must be associated with the Employee who submitted it.
 - Every Service Request must have a valid current status.
 - If a Service Request is assigned to a handler, that handler must be authorized to handle the request.
 - A Service Request must remain associated with the appropriate Internal Department once routing has been determined.
 - Changes to request data must not leave the request in an invalid or inconsistent state.
 ### Authorization-Sensitive Rules
 - Employees should only perform actions on Service Requests that they are authorized to access.
 - Internal Department Staff should only handle or update Service Requests they are authorized to manage.
 - Assignment and request updates must be validated against the user's permissions.
 - Authorization rules must be enforced by the Application Layer rather than trusted to the client.
 - The exact permission model and role definitions require further clarification.

## 3. Storage
 ### Storage Model
 A relational storage model is preferred for the Internal Operations Service Hub.
 The product has structured entities with clear relationships, such as Employees, Service Requests, and Internal  Departments. It also requires consistent relationships, ownership, status tracking, and authorization-sensitive  rules.
 A relational model provides a natural way to represent these relationships and maintain data consistency.
 The exact database technology is not selected at this stage.
 ### Durable vs Derived Data
  #### Durable Data
  The system should durably preserve the core information required to represent and track a Service Request, including:
  - The Service Request itself.
  - The Employee who submitted the request.
  - The Internal Department associated with the request.
  - The current status of the request.
  - The current handler, when one has been assigned.
  - Approval-related state when approval is required.
  #### Derived Data
  Information that can be calculated from durable data does not need to be stored separately unless a future performance requirement justifies it.
  Examples include:
  - The number of requests associated with a department.
  - The number of requests in a particular status.
  - Whether a request is currently assigned, based on whether a handler exists.

## 4. Access
 ### Important Access Patterns
 The main product behaviors require the system to support access patterns such as:
 - Retrieve Service Requests submitted by a specific Employee.
 - Retrieve Service Requests associated with a specific Internal Department.
 - Retrieve a specific Service Request with its current status and ownership information.
 - Retrieve Service Requests assigned to a specific handler, when ownership has been assigned.
 - Retrieve approval-related information for requests that require approval.
 ### Index Considerations
 Indexes should be introduced only when they support important access patterns or demonstrated performance needs.
 Potentially justified indexes include:
 - An index supporting retrieval of Service Requests by Employee.
 - An index supporting retrieval of Service Requests by Internal Department.
 - An index supporting retrieval of Service Requests by assigned handler, if handler-based queues are required.
 Additional indexes should not be introduced until further access patterns or performance requirements justify them.