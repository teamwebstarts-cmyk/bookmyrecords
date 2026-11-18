# SOFTWARE REQUIREMENTS SPECIFICATION
## Book My Records — Service Booking & Client Portal
**Draft v1.0 | 27 October 2026**

| Document Field | Details |
| :--- | :--- |
| **Prepared for** | Book My Records |
| **Prepared by** | WebStarts |
| **Reference website** | https://bookmyrecords.co.in/ |
| **Inspiration/reference platform** | https://legal251.com/ |
| **Document status** | Draft — assumptions and open questions require client confirmation |
| **Purpose** | Define the proposed first-version scope before final quotation, UI design and development. |

**CONFIDENTIAL — FOR DISCUSSION AND REQUIREMENTS VALIDATION**

---

### Document Control
| Version | Date | Owner | Change Summary |
| :--- | :--- | :--- | :--- |
| 1.0 | 27 Oct 2026 | WebStarts | Initial draft based on publicly visible websites and discussion; not yet client-approved. |

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) describes the proposed requirements for a web application for Book My Records. The proposed system will allow visitors to discover services, submit service requests, provide documents, and track progress. Book My Records staff will use an administrative workspace to manage services, customers, requests and fulfilment statuses.

### 1.2 Product Context
The current Book My Records website presents accounting, taxation, compliance, business registration, software, training and automation offerings. The reference Legal251 website demonstrates service discovery, service-specific information, enquiry/consultancy entry points and service tracking concepts. This project is intended to adapt relevant service-booking and case-tracking patterns—not to reproduce the reference site's branding, content or full platform.

### 1.3 Intended Audience
- Book My Records business owner / project sponsor
- Book My Records operations and service-delivery staff
- WebStarts project, design and development team
- QA/testing and deployment personnel

### 1.4 Definitions
| Term | Meaning |
| :--- | :--- |
| **Service request / order** | A customer’s request to purchase or enquire about a particular service. |
| **Customer portal** | Authenticated area where a customer views their own requests and uploads documents. |
| **Admin panel** | Restricted area used by authorised Book My Records staff. |
| **Status timeline** | Ordered list of meaningful status changes for a service request. |
| **MVP** | Minimum viable product: the first agreed release with core booking and tracking functionality. |

---

## 2. Scope

### 2.1 In Scope for Proposed MVP
- Responsive public website pages and service catalogue.
- Service detail pages with description, indicative price/starting price, required inputs/documents, estimated processing time and FAQs.
- Customer registration/login and basic profile.
- Service enquiry/booking form with service-specific fields.
- Document upload and access by authorised staff.
- Customer dashboard showing service requests and their current status.
- Admin panel to manage service catalogue, customers, requests, assignment and status changes.
- Basic email notifications for key events, subject to an agreed email provider.
- Basic request list/search/filtering and simple operational summaries.
- Deployment to an agreed hosting environment, testing and handover.

### 2.2 Out of Scope Unless Separately Approved
- Automatic GST, ITR, MCA or other government-portal filing or submission.
- Government API integrations, DSC/e-signature workflows, OTP automation on government portals, or scraping.
- Advanced two-way WhatsApp chatbot or WhatsApp Business API workflows.
- Tally/ERP/accounting software integrations and automated reconciliation.
- Native Android/iOS apps.
- Complex recurring billing, subscription lifecycle management, or multi-service cart unless confirmed.
- Advanced CRM, marketing automation, lead scoring, BI dashboards or custom report builder.
- Historical migration of large customer databases, files or accounting records.
- Third-party subscription, hosting, messaging, payment gateway and government charges.
- Legal/tax advice or the accuracy/completion of professional services themselves.

### 2.3 Proposed Project Constraints
| Item | Planning Assumption (to confirm) |
| :--- | :--- |
| **Commercial target** | Indicative development budget: “xxxx” plus applicable taxes, subject to approved scope. |
| **Schedule** | Indicative 6–8 weeks after requirements, content, access and designs are approved. |
| **Platform** | Responsive web application; no native mobile app in MVP. |
| **Initial users** | One Book My Records business, with multiple internal staff accounts. |
| **Payment** | Payment gateway is optional pending client confirmation; enquiry-first/manual payment is the lower-scope baseline. |
| **Service workflows** | Initial release uses a small set of agreed service categories and configurable standard statuses. |

---

## 3. User Roles and Permissions

| Role | Main Capabilities | Restrictions |
| :--- | :--- | :--- |
| **Public visitor** | Browse pages/services, submit general enquiry or service enquiry. | Cannot see private customer records or uploaded files. |
| **Customer** | Manage own profile, submit/view own requests, upload requested documents, view statuses and available invoices/deliverables. | Can access only their own data and requests. |
| **Administrator** | Manage service catalogue, staff, customers, requests, assignments, statuses and basic settings. | Privileged actions should be logged; access limited to authorised accounts. |
| **Operations staff** | View assigned/authorised requests, review documents, request more information, add internal notes and update allowed statuses. | Cannot manage system-wide settings or other users unless permission is granted. |

*Note: Role-based access must be enforced on the server, not only by hiding interface controls.*

---

## 4. Functional Requirements

| ID | Requirement | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | Public pages | The system shall provide Home, About, Services, individual Service Detail, Contact/Enquiry, Privacy Policy and Terms pages. Final page list and content are subject to approval. | Must |
| **FR-02** | Service catalogue | The system shall display services grouped into categories, with search or category browsing where agreed. | Must |
| **FR-03** | Service details | Each service shall support a title, description, category, price or starting price, expected turnaround, requirements/documents, FAQs and active/inactive state. | Must |
| **FR-04** | Enquiry submission | A visitor shall be able to submit an enquiry with name, phone, email, selected service and message. The system shall validate required fields and show confirmation. | Must |
| **FR-05** | Customer account | A customer shall be able to register/login and view/update basic profile information. Login method (email/password, OTP or other) must be confirmed before design. | Must |
| **FR-06** | Create service request | An authenticated customer shall be able to select a service and submit its agreed intake form. The system shall generate a unique request reference. | Must |
| **FR-07** | Service-specific form | The system shall support configurable fields for agreed initial services, including required/optional fields and validation. Unlimited form-builder functionality is not included. | Must |
| **FR-08** | Document upload | Customers shall be able to upload permitted file types and sizes for a request. Files shall be linked to the request and available only to authorised users. | Must |
| **FR-09** | Document review | Authorised staff shall be able to view available documents and mark the request as requiring additional information. The customer shall be able to upload the requested missing files. | Must |
| **FR-10** | Customer dashboard | The customer shall see a list of their own requests, service name, request reference, creation date, current status and latest update. | Must |
| **FR-11** | Request detail/timeline | The customer shall be able to open a request and view status history and customer-visible notes or instructions. | Must |
| **FR-12** | Admin request management | Authorised staff shall be able to list, search/filter, open and update requests. The admin view shall show customer contact details, service, assigned staff, status and timestamps. | Must |
| **FR-13** | Assignment | An administrator shall be able to assign a request to an authorised staff member and change the assignment when necessary. | Should |
| **FR-14** | Status management | The system shall support agreed statuses, initially: New, Under Review, Documents Required, In Progress, Submitted/Processing (where relevant), Completed, Cancelled. Statuses shall be finalised with the client. | Must |
| **FR-15** | Internal notes | Authorised staff shall be able to add internal notes that are not visible to customers, distinct from customer-visible comments. | Should |
| **FR-16** | Notifications | The system shall send basic email notifications for agreed events, such as new request, documents required, status update and completion, subject to provider setup. | Should |
| **FR-17** | Payment handling | If approved for MVP, the system shall redirect to or integrate with a selected payment gateway, record transaction reference/status and verify payment status server-side. Gateway selection and refund handling must be confirmed. | Optional |
| **FR-18** | Invoices/receipts | The system shall allow authorised staff to attach or provide an invoice/receipt and customers to view/download it. Automated tax-compliant invoice generation is subject to confirmation. | Should |
| **FR-19** | Deliverables | Authorised staff shall be able to attach final deliverables to a completed request for customer download. | Must |
| **FR-20** | Admin service management | Administrators shall be able to create, edit, activate/deactivate and reorder service catalogue entries. | Must |
| **FR-21** | Basic reports | The admin shall see basic counts by status and service and be able to filter the request list. Export to CSV/Excel is optional and must be confirmed. | Should |
| **FR-22** | Audit history | The system shall record important actions such as status changes, assignment changes and privileged document access where feasible within the agreed scope. | Should |
| **FR-23** | Content management | If no CMS is included, public page content changes will be made by the developer or through agreed admin fields. A full visual page builder is not included. | Must |
| **FR-24** | Contact/support | The website shall show approved contact details and provide an enquiry route. Live chat/ticketing is not included unless separately approved. | Must |

---

## 5. Primary User Workflows

### 5.1 Customer Submits a Service Request
1. Visitor browses categories or searches for a service.
2. Visitor opens the service detail page and reviews price, estimated time and requirements.
3. Visitor starts an enquiry or signs in/registers to submit a service request.
4. Customer completes the service-specific form and uploads available documents.
5. System validates required fields and creates a request reference.
6. System confirms submission and notifies the customer and authorised staff, where email is configured.
7. Staff reviews the request and either begins processing or requests additional information.

### 5.2 Staff Requests Missing Documents
1. Staff opens a request and selects "Documents Required".
2. Staff records a customer-visible explanation of the missing information.
3. Customer receives a notification (if configured) and opens the request.
4. Customer uploads the requested documents.
5. Staff reviews the new files and updates the status to "Under Review" or "In Progress".

### 5.3 Request Completion
1. Staff updates the request to "Completed" after internal checks.
2. Staff attaches the final deliverable or completion evidence, where applicable.
3. Customer sees the completed status and can download the available deliverable.
4. The request and its status history remain available according to the agreed data-retention policy.

### 5.4 Payment Workflow (Conditional)
If online payments are included, the customer reviews the payable amount and applicable fee breakdown, proceeds to the selected gateway, and returns to the application. The server verifies the gateway response/webhook before marking the payment as successful. A browser redirect alone must not be treated as proof of payment. Refunds, partial payments, payment retries and payment reconciliation rules require client approval.

---

## 6. Non-Functional Requirements

| ID | Requirement | Description |
| :--- | :--- | :--- |
| **NFR-01** | Security | Use HTTPS in production, secure password/session handling, server-side authorisation, input validation and protection against common web vulnerabilities. |
| **NFR-02** | Privacy | Collect only necessary personal data; publish approved privacy/terms content; define who can access sensitive documents and how long they are retained. |
| **NFR-03** | File security | Validate upload size/type, use non-public storage or equivalent access controls, prevent unauthorised direct file access and scan files where an appropriate service is available. |
| **NFR-04** | Performance | Common pages and dashboard lists should load within a reasonable target under the agreed expected traffic and hosting. Exact performance targets to be agreed after hosting and usage estimates. |
| **NFR-05** | Availability/backup | Hosting, backups, restore responsibility, recovery objectives and ongoing monitoring must be agreed. Third-party hosting availability is outside developer control. |
| **NFR-06** | Usability | Interface shall be responsive for modern desktop, tablet and mobile browsers and use clear labels, validation and empty/error states. |
| **NFR-07** | Compatibility | Support current stable versions of major browsers (Chrome, Edge, Firefox and Safari) subject to QA scope. |
| **NFR-08** | Maintainability | Use documented modules, environment-based configuration and a handover note for deployment and routine administration. |
| **NFR-09** | Auditability | Important request status/assignment changes should retain timestamp and acting user where implemented. |
| **NFR-10** | Accessibility | Use semantic headings, form labels, keyboard-accessible controls and readable contrast as practical within the agreed design scope. |

---

## 7. Data Requirements (Initial)

| Entity | Key Data Fields (Indicative) |
| :--- | :--- |
| **User** | User ID, name, email/phone, role, account status, created/updated timestamps. |
| **Service category** | Category ID, name, description, display order, active flag. |
| **Service** | Service ID, category, title, description, price/starting price, estimated turnaround, requirements, FAQs, active flag. |
| **Service request** | Request ID/reference, customer, service, submitted form data, status, assigned staff, created/updated timestamps. |
| **Request document** | Document ID, request, uploader, file metadata, storage reference, upload timestamp, document type/visibility. |
| **Status history** | Request, previous status, new status, actor, timestamp, customer-visible message where applicable. |
| **Internal note** | Request, staff author, note content, timestamp; visible only to authorised staff. |
| **Payment (conditional)** | Payment ID, request, amount, currency, gateway, transaction reference, status and timestamps. |
| **Invoice/deliverable** | Request, file/reference, type, uploaded by, visibility and timestamp. |

*The exact fields, legal basis/consent wording, retention periods and any accounting record requirements must be approved by Book My Records. The SRS does not prescribe a final database schema.*

---

## 8. External Integrations

| Integration | MVP Treatment | Client Decision Required |
| :--- | :--- | :--- |
| **Email provider** | Basic transactional email, if approved. | Provider/account, sender domain and template content. |
| **Payment gateway** | Optional; integrate one gateway if included. | Provider, merchant onboarding, payment/refund rules and fee display. |
| **WhatsApp Business API** | Excluded from baseline; may be Phase 2. | Whether notifications only or two-way chatbot is required. |
| **Cloud/file storage** | Use secure storage suitable for confidential documents. | Hosting preference, account ownership, storage limits and retention. |
| **Government portals/APIs** | Excluded from baseline. | Any required authorised integration must be separately scoped and feasibility-checked. |
| **Tally/accounting systems** | Excluded from baseline. | Specific product/version, direction of sync and supported data format. |

---

## 9. Acceptance Criteria
- Public visitors can browse the approved service categories and open service detail pages.
- A visitor can submit a valid enquiry and receives a clear confirmation.
- A registered customer can submit an agreed service request and receives a unique reference.
- Customers can upload supported files and only the customer and authorised staff can access them.
- A customer can view only their own requests and associated status history.
- An authorised staff member can review a request, request missing documents, assign it and update its status.
- The customer can upload requested documents and view the resulting status update.
- Staff can attach a final deliverable and the customer can access it after completion.
- If payments are in scope, successful and failed payment states are recorded based on server-side verification.
- Core workflows pass agreed functional testing on supported desktop and mobile browsers.
- The application is deployed to the agreed production environment and handover materials are provided.

---

## 10. Assumptions and Dependencies
- Book My Records will provide approved service names, descriptions, pricing, timelines, document checklists, FAQs, logos, brand assets and legal page content.
- Book My Records will identify the initial services to digitise; the first release will not automatically support every advertised service with a bespoke workflow.
- Client will provide access to the domain, hosting/cloud account, email provider and payment gateway accounts where needed.
- Client will nominate an authorised decision-maker and provide timely feedback on requirements, design and acceptance testing.
- Client staff remain responsible for professional review, regulatory decisions, actual filing/submission and accuracy of service outcomes unless separately contracted.
- All third-party subscriptions and transaction charges are paid by the client.
- Scope changes after approval may affect price and delivery schedule and require written change approval.

---

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Trying to include all service types at launch** | Budget and timeline overrun. | Limit MVP to an agreed initial service list; use reusable workflow patterns. |
| **Sensitive financial/identity documents** | Privacy/security exposure. | Private storage, least-privilege access, secure transport and defined retention. |
| **Unclear pricing or government fees** | Customer disputes and rework. | Separate professional fees, taxes and government charges; show approved terms. |
| **Payment status mismatch** | Incorrect order state or reconciliation. | Server-side gateway verification and logged payment references. |
| **Scope expansion to government automation** | Major technical/legal complexity. | Explicitly exclude from MVP and estimate separately after feasibility review. |
| **Delayed client content or approvals** | Schedule delay. | Agree content/approval dates and milestone sign-off. |

---

## 12. Open Questions for Client Sign-off
1. Which exact services are included in the first release (recommended: a limited initial list)?
2. Should a customer be able to purchase/pay online, or should the first release collect enquiries and let staff confirm pricing?
3. Which login method is preferred: email/password, mobile OTP, or another method?
4. Are customer and staff accounts required on day one? Which staff roles and permissions are needed?
5. What exact fields and documents are required for each initial service?
6. Which statuses should customers see, and which statuses are internal only?
7. Should invoices be generated by the platform, uploaded by staff, or handled by existing accounting software?
8. Are email notifications enough for launch? Is WhatsApp notification/chatbot functionality required?
9. Is any existing customer, order or document data to be imported?
10. Which hosting, domain, email and payment gateway accounts will be used, and who will own them?
11. What are the file types, maximum sizes and document-retention requirements?
12. Who will provide approved Privacy Policy, Terms of Service, cancellation/refund policy and consent text?
13. Is the requested price inclusive or exclusive of GST, hosting, gateway fees and third-party subscriptions?
14. Who will perform user acceptance testing and formally approve the release?

---

## 13. Proposed Delivery Plan

| Stage | Indicative Work | Indicative Duration |
| :--- | :--- | :--- |
| **1. Discovery & scope lock** | Confirm service list, roles, forms, status model, integrations and acceptance criteria. | 3–5 working days |
| **2. UI/UX** | Wireframes and visual design for public pages, customer portal and admin workflows. | 1 week |
| **3. Core development** | Catalogue, authentication, requests, uploads, customer dashboard and admin panel. | 3–4 weeks |
| **4. Integration & QA** | Email and any approved payment integration; security and workflow testing. | 1–2 weeks |
| **5. UAT & launch** | Client testing, fixes, deployment and handover. | 1 week |

*Overall planning estimate: approximately 6–8 weeks, dependent on final scope, client feedback and third-party account readiness. This is not a contractual delivery commitment until scope and dependencies are approved.*

---

## 14. Approval
Approval confirms that the parties agree this SRS is the baseline for detailed design and estimation. It does not include features listed as out of scope unless they are added through a written change request.

| For Book My Records | For WebStarts |
| :--- | :--- |
| **Name:** ______________________________ | **Name:** ______________________________ |
| **Title:** _______________________________ | **Title:** _______________________________ |
| **Signature:** ___________________________ | **Signature:** ___________________________ |
| **Date:** _______________________________ | **Date:** _______________________________ |

---

## References
1. **Book My Records public website:** [https://bookmyrecords.co.in/](https://bookmyrecords.co.in/)
2. **Legal251 public website (reference for service discovery and service-tracking concepts):** [https://legal251.com/](https://legal251.com/)

*These public pages were reviewed to inform this draft. The document describes a proposed MVP and does not assert access to either site's private application/backend functionality.*
