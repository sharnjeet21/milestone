# Requirements Document

## Introduction

This document defines the requirements for **platform-core** — the five foundational pillars of a freelancer-employer mediation platform. The platform acts as a trusted intermediary: it helps employers find talent via AI-powered search and job postings, scores freelancers with an AI-driven Freelancer Performance Index (PFI), holds project funds in escrow with milestone-based release and delay penalties, and generates legally-binding MOUs with digital signing.

The codebase already has partial implementations of PFI scoring, escrow logic, milestone-based workspaces, and PayPal sandbox payouts. These requirements focus on what is **missing or incomplete** to deliver each pillar end-to-end.

---

## Glossary

- **Platform**: The freelancer-employer mediation web application (FastAPI backend + Next.js frontend).
- **Employer**: A registered user who posts jobs or searches for freelancers and funds projects.
- **Freelancer**: A registered user who applies to jobs, completes milestones, and receives payments.
- **PFI (Freelancer Performance Index)**: An AI-computed score (300–900) that represents a freelancer's reliability, quality, and delivery track record.
- **PFI_Agent**: The backend service that calculates and updates PFI scores.
- **Search_Engine**: The backend service that processes natural-language employer queries and returns ranked freelancer profiles.
- **Job_Board**: The platform subsystem that manages job postings and freelancer applications.
- **Escrow_Vault**: The platform subsystem that holds, locks, and releases project funds.
- **Penalty_Engine**: The component within Escrow_Vault that calculates and applies delay penalties.
- **MOU_Generator**: The backend service that produces milestone-based Memoranda of Understanding.
- **Signing_Service**: The platform subsystem that manages digital signature collection from both parties.
- **Feedback_Collector**: The subsystem that gathers post-project feedback from employers and freelancers.
- **Milestone**: A discrete, verifiable unit of work within a project, each with a deadline and payment amount.
- **Vault**: A per-project escrow account that holds the employer's deposited funds.
- **Dispute**: A formal disagreement raised by either party regarding milestone completion or payment.

---

## Requirements

---

### Requirement 1: Freelancer Profile Discovery via AI Search

**User Story:** As an employer, I want to type a natural-language description of the skills and experience I need, so that I can find matching freelancer profiles without manually browsing.

#### Acceptance Criteria

1. WHEN an employer submits a natural-language search query, THE Search_Engine SHALL parse the query and extract required skills, experience level, and domain keywords.
2. WHEN the Search_Engine has extracted query parameters, THE Search_Engine SHALL return a ranked list of freelancer profiles ordered by match relevance score descending.
3. THE Search_Engine SHALL include each freelancer's PFI score, skill tags, hourly rate, and availability status in search results.
4. WHEN a search query matches zero freelancer profiles, THE Search_Engine SHALL return an empty result set with a descriptive message indicating no matches were found.
5. WHEN a search query is fewer than 3 characters, THE Search_Engine SHALL return a validation error with status code 400.
6. THE Platform SHALL expose a `GET /api/freelancers/search?q={query}` endpoint that accepts a URL-encoded natural-language query string.
7. THE Platform SHALL store each freelancer's skills, bio, hourly rate, and availability in Firestore under the `users` collection so the Search_Engine can query them.
8. WHEN a freelancer profile is incomplete (missing skills or bio), THE Search_Engine SHALL exclude that profile from search results.

---

### Requirement 2: Job Posting and Application Flow

**User Story:** As an employer, I want to post a job with requirements and budget, so that qualified freelancers can discover and apply to it.

#### Acceptance Criteria

1. WHEN an employer submits a job posting with title, description, required skills, budget range, and timeline, THE Job_Board SHALL persist the posting to Firestore under a `jobs` collection with status `OPEN`.
2. THE Platform SHALL expose a `POST /api/jobs` endpoint that accepts job posting data and returns the created job document including a generated `job_id`.
3. THE Platform SHALL expose a `GET /api/jobs` endpoint that returns all `OPEN` job postings, ordered by creation date descending.
4. WHEN a freelancer submits an application for a job, THE Job_Board SHALL persist the application to Firestore under a `applications` sub-collection with status `PENDING`.
5. THE Platform SHALL expose a `POST /api/jobs/{job_id}/apply` endpoint that accepts the freelancer's `user_id` and a cover note, and returns the created application document.
6. WHEN an employer views a job's applications, THE Job_Board SHALL return all applications for that job including each applicant's PFI score and profile summary.
7. THE Platform SHALL expose a `GET /api/jobs/{job_id}/applications` endpoint that returns the application list for a given job.
8. WHEN an employer accepts an application, THE Job_Board SHALL update the application status to `ACCEPTED`, update the job status to `FILLED`, and create a project record linking the employer and freelancer.
9. THE Platform SHALL expose a `PATCH /api/jobs/{job_id}/applications/{application_id}` endpoint that accepts a `status` field of `ACCEPTED` or `REJECTED`.
10. IF a freelancer attempts to apply to a job they have already applied to, THEN THE Job_Board SHALL return a 409 Conflict error with a descriptive message.
11. WHEN a job status is `FILLED` or `CLOSED`, THE Job_Board SHALL reject new applications with a 422 error.

---

### Requirement 3: Freelancer Onboarding and Profile Completeness

**User Story:** As a freelancer, I want to complete my profile with skills, bio, portfolio links, and hourly rate, so that employers can find and evaluate me.

#### Acceptance Criteria

1. WHEN a new user completes onboarding with role `freelancer`, THE Platform SHALL create a Firestore user document containing: `name`, `email`, `role`, `skills` (array), `bio`, `hourly_rate`, `availability` (boolean), `portfolio_url`, `pfi_score` (default 500), and `created_at`.
2. THE Platform SHALL expose a `PUT /api/freelancers/{freelancer_id}/profile` endpoint that accepts updated profile fields and persists them to Firestore.
3. WHEN a freelancer's profile is updated, THE Platform SHALL recompute the profile completeness percentage and store it on the user document.
4. THE Platform SHALL expose a `GET /api/freelancers/{freelancer_id}/profile` endpoint that returns the full profile including PFI score, tier label, and completeness percentage.
5. WHEN a freelancer's `availability` field is set to `false`, THE Search_Engine SHALL exclude that freelancer from all search results.
6. THE Platform SHALL expose a `GET /api/freelancers` endpoint that returns all freelancer profiles with their PFI scores, for use in employer browsing.

---

### Requirement 4: PFI Score Computation and Persistence

**User Story:** As an employer, I want to see an AI-computed performance score for each freelancer, so that I can make informed hiring decisions without relying on subjective star ratings.

#### Acceptance Criteria

1. WHEN a milestone is marked as completed or failed, THE PFI_Agent SHALL recalculate the freelancer's PFI score using quality score (40%), deadline adherence (30%), revision rate (15%), and completion rate (15%) as weighted inputs.
2. THE PFI_Agent SHALL clamp the resulting PFI score to the range [300, 900].
3. WHEN the PFI_Agent computes a new score, THE Platform SHALL persist the updated score and the score delta to the freelancer's Firestore document.
4. THE Platform SHALL persist a PFI history entry to a `pfi_history` sub-collection on the freelancer document for every score update, containing: `project_id`, `milestone_id`, `previous_score`, `new_score`, `score_change`, `component_breakdown`, and `recorded_at`.
5. THE Platform SHALL expose a `GET /api/freelancers/{freelancer_id}/pfi/history` endpoint that returns the full PFI history for a freelancer, ordered by `recorded_at` descending.
6. WHEN an employer views a freelancer's profile, THE Platform SHALL display the PFI score, tier label (POOR / AVERAGE / GOOD / EXCELLENT / ELITE), tier color, and a plain-language summary of what the freelancer excels at based on their highest-weighted component.
7. WHEN a freelancer's PFI score falls below 400, THE Platform SHALL flag the freelancer's profile with a `restricted` status and display a warning to employers.
8. THE Feedback_Collector SHALL accept post-project text feedback from employers after project completion and pass it to the PFI_Agent as an additional quality signal.
9. THE Platform SHALL expose a `POST /api/projects/{project_id}/feedback` endpoint that accepts employer feedback text and a numeric satisfaction rating (1–5), and triggers a PFI score update.

---

### Requirement 5: Escrow Vault Funding and Locking

**User Story:** As an employer, I want to deposit the full project budget into an escrow vault before work begins, so that the freelancer is guaranteed payment upon delivery.

#### Acceptance Criteria

1. WHEN a project is created, THE Escrow_Vault SHALL automatically create a Vault record in Firestore with status `UNFUNDED`, linked to the project by `project_id`.
2. WHEN an employer completes a PayPal payment for a project, THE Escrow_Vault SHALL update the Vault status to `FUNDED` and record the `paypal_capture_id` and `funded_at` timestamp.
3. WHILE a Vault status is `UNFUNDED`, THE Platform SHALL prevent the project from transitioning to `ACTIVE` status.
4. THE Platform SHALL expose a `GET /api/escrow/vault/{vault_id}` endpoint that returns vault status, total amount, locked amount, released amount, and transaction history.
5. WHEN a Vault is `FUNDED`, THE Escrow_Vault SHALL lock the full deposited amount and set `locked_amount` equal to `total_amount`.
6. THE Platform SHALL expose a `POST /api/escrow/vault/{vault_id}/fund` endpoint that accepts a `paypal_capture_id` and updates vault status to `FUNDED`.

---

### Requirement 6: Milestone-Based Payment Release

**User Story:** As a freelancer, I want to receive payment automatically when a milestone is approved, so that I am compensated for completed work without waiting for manual employer action.

#### Acceptance Criteria

1. WHEN a milestone submission is evaluated and achieves a completion score of 80 or above, THE Escrow_Vault SHALL release the milestone's `payment_amount` from the Vault to the freelancer's registered PayPal account.
2. WHEN a milestone submission achieves a completion score between 50 and 79, THE Escrow_Vault SHALL release a prorated payment equal to `(completion_score / 100) * payment_amount` and mark the milestone as `PARTIALLY_COMPLETED`.
3. WHEN a milestone submission achieves a completion score below 50, THE Escrow_Vault SHALL withhold the full milestone payment and mark the milestone as `UNMET`.
4. WHEN a payment is released, THE Escrow_Vault SHALL record a transaction entry in the Vault's `transactions` array with fields: `type`, `amount`, `milestone_id`, `freelancer_id`, `timestamp`, and `paypal_payout_id`.
5. WHEN all milestones in a project reach a terminal status (FULLY_COMPLETED, PARTIALLY_COMPLETED, or UNMET), THE Escrow_Vault SHALL release the platform success fee (15% of total budget) and set the Vault status to `CLOSED`.
6. THE Platform SHALL expose a `POST /api/escrow/vault/{vault_id}/release` endpoint that accepts `milestone_id` and `completion_score`, computes the release amount, initiates the PayPal payout, and records the transaction.

---

### Requirement 7: Delay Penalty Enforcement

**User Story:** As an employer, I want the platform to automatically penalize a freelancer for late milestone delivery, so that there is a financial incentive for on-time work.

#### Acceptance Criteria

1. WHEN a milestone deadline passes and the milestone status is not `SUBMITTED` or a terminal status, THE Penalty_Engine SHALL mark the milestone as overdue.
2. WHEN a milestone is overdue by 1–3 days, THE Penalty_Engine SHALL apply a penalty of 5% of the milestone's `payment_amount`.
3. WHEN a milestone is overdue by 4–7 days, THE Penalty_Engine SHALL apply a penalty of 10% of the milestone's `payment_amount`.
4. WHEN a milestone is overdue by more than 7 days, THE Penalty_Engine SHALL apply a penalty of 20% of the milestone's `payment_amount` and flag the project for employer review.
5. WHEN a penalty is applied, THE Escrow_Vault SHALL deduct the penalty amount from the milestone's releasable payment and record a `PENALTY` transaction entry in the Vault.
6. WHEN a penalty is applied, THE PFI_Agent SHALL reduce the freelancer's PFI score using the existing deadline adherence component with the appropriate `days_late` value.
7. THE Platform SHALL expose a `POST /api/escrow/vault/{vault_id}/penalty` endpoint that accepts `milestone_id` and `days_late`, computes the penalty, updates the Vault, and returns the penalty amount and updated releasable payment.
8. WHEN a penalty is applied, THE Platform SHALL send a notification record to the freelancer's Firestore `notifications` sub-collection with the penalty amount and reason.

---

### Requirement 8: Dispute Resolution Workflow

**User Story:** As either party, I want to raise a dispute if I believe a milestone outcome is unfair, so that there is a structured process for resolving disagreements.

#### Acceptance Criteria

1. WHEN an employer or freelancer submits a dispute for a milestone, THE Platform SHALL create a dispute record in Firestore under a `disputes` collection with status `OPEN`, containing: `project_id`, `milestone_id`, `raised_by`, `reason`, `evidence_url` (optional), and `created_at`.
2. THE Platform SHALL expose a `POST /api/disputes` endpoint that accepts dispute data and returns the created dispute document.
3. WHILE a dispute is `OPEN` for a milestone, THE Escrow_Vault SHALL freeze the milestone's payment and prevent any release or penalty for that milestone.
4. THE Platform SHALL expose a `PATCH /api/disputes/{dispute_id}` endpoint that accepts a `resolution` field and a `status` of `RESOLVED` or `DISMISSED`, and unfreezes the associated milestone payment.
5. WHEN a dispute is resolved with `resolution` = `EMPLOYER_WINS`, THE Escrow_Vault SHALL refund the milestone payment to the employer's PayPal account.
6. WHEN a dispute is resolved with `resolution` = `FREELANCER_WINS`, THE Escrow_Vault SHALL release the full milestone payment to the freelancer regardless of completion score.
7. THE Platform SHALL expose a `GET /api/disputes?project_id={project_id}` endpoint that returns all disputes for a given project.

---

### Requirement 9: MOU and Contract Generation

**User Story:** As an employer, I want the platform to generate a custom MOU based on the project milestones and terms, so that both parties have a legally-structured agreement before work begins.

#### Acceptance Criteria

1. WHEN a project is created with milestones, THE MOU_Generator SHALL produce a draft MOU document containing: party names, project title, scope of work, milestone list with deadlines and payment amounts, penalty terms, dispute resolution clause, and governing law placeholder.
2. THE Platform SHALL expose a `POST /api/contracts/generate` endpoint that accepts a `project_id` and returns the generated MOU as a structured JSON document and a rendered plain-text version.
3. THE MOU_Generator SHALL include the penalty schedule from Requirement 7 (5% / 10% / 20% by delay band) in the generated contract terms.
4. WHEN an MOU is generated, THE Platform SHALL persist the document to Firestore under a `contracts` collection linked to the `project_id`, with status `DRAFT`.
5. THE Platform SHALL expose a `GET /api/contracts/{contract_id}` endpoint that returns the full contract document including current status and signature records.

---

### Requirement 10: Digital Signing of Contracts

**User Story:** As both an employer and a freelancer, I want to digitally sign the MOU on the platform, so that the agreement is acknowledged by both parties before work begins.

#### Acceptance Criteria

1. WHEN an MOU has status `DRAFT`, THE Signing_Service SHALL allow the employer to sign by recording their `user_id`, `signed_at` timestamp, and IP address on the contract document.
2. THE Platform SHALL expose a `POST /api/contracts/{contract_id}/sign` endpoint that accepts `user_id` and `role` (employer or freelancer) and records the signature.
3. WHEN both parties have signed a contract, THE Signing_Service SHALL update the contract status to `EXECUTED` and record an `executed_at` timestamp.
4. WHILE a contract status is not `EXECUTED`, THE Platform SHALL prevent the project from transitioning to `ACTIVE` status.
5. IF a party attempts to sign a contract that already has their signature recorded, THEN THE Signing_Service SHALL return a 409 Conflict error.
6. WHEN a contract reaches `EXECUTED` status, THE Platform SHALL send a notification record to both parties' Firestore `notifications` sub-collections confirming the agreement is in effect.
7. THE Platform SHALL expose a `GET /api/contracts/{contract_id}/signatures` endpoint that returns the list of recorded signatures and the current signing status.

---

### Requirement 11: Notifications Sub-System

**User Story:** As a platform user, I want to receive in-app notifications for key events, so that I am always aware of actions that require my attention.

#### Acceptance Criteria

1. THE Platform SHALL write a notification document to the user's Firestore `notifications` sub-collection for each of the following events: milestone submitted, milestone approved, milestone rejected, payment released, penalty applied, dispute opened, dispute resolved, contract signed, and contract executed.
2. WHEN a notification is created, THE Platform SHALL set its `read` field to `false` and include a `created_at` timestamp and a human-readable `message` string.
3. THE Platform SHALL expose a `GET /api/users/{user_id}/notifications` endpoint that returns all notifications for a user, ordered by `created_at` descending.
4. THE Platform SHALL expose a `PATCH /api/users/{user_id}/notifications/{notification_id}` endpoint that sets the notification's `read` field to `true`.
5. WHEN a user has unread notifications, THE Platform's frontend Navbar SHALL display a numeric badge showing the unread count.

---

### Requirement 12: Round-Trip Contract Serialization

**User Story:** As a developer, I want the MOU document model to serialize and deserialize correctly, so that contracts stored in Firestore can be reliably reconstructed without data loss.

#### Acceptance Criteria

1. WHEN a contract document is serialized to JSON and then deserialized back to a contract object, THE MOU_Generator SHALL produce an object that is structurally equivalent to the original.
2. THE Platform SHALL expose a contract schema that defines all required fields with explicit types, so that Firestore reads and writes are validated against the schema.
3. FOR ALL valid contract objects, serializing then deserializing SHALL produce an equivalent object (round-trip property).
