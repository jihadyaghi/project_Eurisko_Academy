# Internal Operations Service Hub

## 1. Problem / Context
Employees currently request internal help through different and unstructured communication channels.
Examples inclue:
    - Reporting a laptop or IT problem.
    - Requesting access to a software system.
    - Requesting an employment letter from HR.
    - Requesting approval for a work expense.
This creates several operational problems:
    - Requests may be forgotten.
    - Requests may be sent to the wrong person.
    - Ownership of a request may be unclear.
    - Employees may not know the current status of their request.
    - Approval progress may be unclear.
The company needs one internal system where employees can submit, track, and follow requests for help from departments such as IT, HR, and Finance.

## 2. Known Facts
 - The product is an internal company system.
 - Employees need a central place to request help from internal departments.
 - Requests may involve departments such as IT, HR, and Finance.
 - Employees need to be able to submit and follow their requests.
 - Internal departments need to handle employee requests.
 - Current requests are handled through different and unstructured communication channels.
 - In the current process, requests may be forgotten or sent to the wrong person.
 - Request ownership and status may be unclear.
 - Approval progress may also be unclear for requests that require approval.
 - Example requests include IT problems, software access requests, employment letters, and work expense
   approvals.

## 3. Actors / Stakeholders
 ### Employee / Requester
 An employee who needs help or a service from an internal department.
 Responsibilities:
   - Submit an internal service request.
   - Follow the progress of a submitted request.
   - View the current status of the request.
 ### Internal Department Staff / Request Handler
 Staff members from internal departments such as IT, HR, and Finance who handle employee requests.
 Responsibilities:
   - Handle requests related to their department.
   - Take responsibility for requests being handled.
   - Keep the request progress/status clear while it is being handled.
 ### Stakeholders
 The company and its internal departments are stakeholders because the system is intended to improve how internal requests are submitted, handled, and followed.

## 4. Functional Requirements
 ### FR-1: Submit a Request
 Employees must be able to submit an internal service request for help from an internal department.
 ### FR-2: Handle Requests
 Internal staff must be able to handle requests related to their department.
 ### FR-3: Track Request Status
 Employees must be able to view and follow the current status of their submitted requests.
 ### FR-4: Request Ownership
 The system must make it clear who is responsible for handling a request.
 ### FR-5: Request Routing
 Requests must be directed to the appropriate internal department, such as IT, HR, or Finance.
 ### FR-6: Approval Tracking
 For requests that require approval, the system must make the approval progress clear.

## 5. Non-Functional Requirements
 The following non-functional requirements are proposed and should be validated with stakeholders.
 ### NFR-1: Security
 The system should protect internal company and request information from unauthorized access.
 ### NFR-2: Authorization
 Users should be able to perform actions that are allowed for their role.
 ### NFR-3: Usability
 The system should provide a clear and easy-to-use experience for submitting, handling, and following requests.
 ### NFR-4: Reliability
 Submitted requests and their status information should be stored and handled reliably without being unintentionally lost.
 ### NFR-5: Maintainability
 The system should be designed so that its functionality can be maintained and changed as internal company needs evolve.

## 6. Assumptions / Constraints / Unknowns
 ### Assumptions
    - Employees have an existing company identity that can be used to access the internal system.
    - Internal departments have staff responsible for handling employee requests.
    - A request can have a clear current status while it is being handled.
 ### Constraints
    - The system is intended for internal company use.
    - No specific technical constraints have been confirmed yet.
 ### Unknowns
    - How will users authenticate to the system?
    - How is the appropriate department for a request determined?
    - What information is required when submitting a request?
    - What request statuses should exist?
    - Who is responsible for assigning or taking ownership of a request?
    - Which types of requests require approval?
    - Who can approve those requests?
    - What is the approval workflow?
    - Are notifications required? If yes, through which channels?
    - Are file attachments required?
    - Are request priorities or SLAs required?
    - What is the expected number of users and requests?
    - Are there specific performance or availability requirements?
    - Are audit logs or request history required?

## 7. Non-Goals
The following are proposed non-goals for the initial scope and should be validated with stakeholders:
    - The system is not intended for external customer support requests.
    - AI-based request handling or routing is not part of the initial scope.
    - Replacing the internal tools used by IT, HR, or Finance is not part of the initial scope.
    - Advanced reporting and analytics are not part of the initial scope.
    - Integrations with external third-party systems are not included unless explicitly required.

## 8. Acceptance Criteria 
  ### AC-1: Request submission
  Given an employee is using the system,
  when the employee submits a valid internal service request,
  then the request is successfully created and available for tracking.
  ### AC-2: Request Handling
  Given a request belongs to an internal department,
  when an authorized staff member handles the request,
  then the request reflects the handling progress.
  ### AC-3: Request Status
  Given an employee has submitted a request,
  when the employee views that request,
  then the current request status is visible.
  ### AC-4: Request Ownership
  Given a request has a responsible handler,
  when the request is viewed,
  then its ownership is clearly visible.
  ### AC-5: Request Routing
  Given a valid request has been submitted,
  when the request is routed,
  then it reaches the appropriate internal department.
  ### AC-6: Approval Tracking
  Given a request requires approval,
  when an approval decision or progress is recorded,
  then the approval state is clearly visible.
