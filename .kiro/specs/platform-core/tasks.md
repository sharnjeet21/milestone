# Tasks: platform-core

## Phase 1: Foundation — Models, DB helpers, Notification Service

- [x] 1.1 Add new Pydantic models: `Job`, `Application`, `Contract`, `Dispute`, `Notification` in `backend/models/`
- [x] 1.2 Extend `backend/models/project.py` Milestone with `overdue`, `penalty_amount`, `frozen` fields
- [x] 1.3 Add Firestore helpers to `backend/database/firebase.py`: jobs, applications, contracts, disputes, notifications CRUD
- [x] 1.4 Create `backend/services/notification_service.py` with `send(user_id, type, message, metadata)` that writes to `users/{id}/notifications`
- [x] 1.5 Extend `frontend/lib/types.ts` with `Job`, `Application`, `Vault`, `VaultTransaction`, `Contract`, `Signature`, `Dispute`, `Notification`, `PFIHistoryEntry` types

## Phase 2: Freelancer Profile & Search

- [x] 2.1 Create `backend/routers/freelancers.py` with routes: `GET /api/freelancers`, `GET /api/freelancers/{id}/profile`, `PUT /api/freelancers/{id}/profile`
- [x] 2.2 Implement profile completeness calculation in `backend/services/search_service.py` (7-field formula)
- [x] 2.3 Implement `GET /api/freelancers/search?q={query}` in `backend/routers/freelancers.py` using NLPAgent + relevance ranking (skill overlap 60% + PFI 40%)
- [x] 2.4 Add `GET /api/freelancers/{id}/pfi/history` route that reads `pfi_history` sub-collection ordered by `recorded_at` desc
- [x] 2.5 Register freelancers router in `backend/main.py`
- [x] 2.6 Create `frontend/app/employer/search/page.tsx` — search input, results list with PFI badge, skills, hourly rate, availability
- [x] 2.7 Add search API call to `frontend/lib/api.ts`

## Phase 3: Job Board

- [x] 3.1 Create `backend/routers/jobs.py` with `POST /api/jobs`, `GET /api/jobs` (OPEN only, sorted by created_at desc)
- [x] 3.2 Add `POST /api/jobs/{job_id}/apply` — validate no duplicate application (409), validate job is OPEN (422), persist with status PENDING
- [x] 3.3 Add `GET /api/jobs/{job_id}/applications` — return applications enriched with applicant PFI score and name
- [x] 3.4 Add `PATCH /api/jobs/{job_id}/applications/{application_id}` — accept ACCEPTED/REJECTED; on ACCEPTED: set job to FILLED, create project record linking employer+freelancer
- [x] 3.5 Register jobs router in `backend/main.py`
- [x] 3.6 Create `frontend/app/jobs/page.tsx` — employer view: post job form + list of own jobs; freelancer view: browse OPEN jobs
- [x] 3.7 Create `frontend/app/jobs/[jobId]/page.tsx` — job detail with application list (employer) or apply button (freelancer)
- [x] 3.8 Create `frontend/app/jobs/[jobId]/apply/page.tsx` — cover note form, submit application
- [x] 3.9 Add job API calls to `frontend/lib/api.ts`

## Phase 4: PFI History Persistence

- [x] 4.1 In `backend/main.py` `submit_milestone` handler: after PFI update, write a `pfi_history` sub-collection entry with `project_id`, `milestone_id`, `previous_score`, `new_score`, `score_change`, `component_breakdown`, `recorded_at`
- [x] 4.2 After PFI update, set `restricted = true` on user doc if `new_score < 400`; set `pfi_tier` field
- [x] 4.3 Add `pfi_history` Firestore helper to `backend/database/firebase.py`: `add_pfi_history_entry(freelancer_id, entry)`
- [x] 4.4 Update `frontend/app/freelancer/pfi/page.tsx` to fetch and display PFI history from `GET /api/freelancers/{id}/pfi/history`

## Phase 5: Escrow Vault Lifecycle

- [x] 5.1 Create `backend/routers/escrow.py` with `GET /api/escrow/vault/{vault_id}` returning full vault doc including transactions
- [x] 5.2 Add `POST /api/escrow/vault/{vault_id}/fund` — validate vault is UNFUNDED (409 if already funded), set status FUNDED, record `paypal_capture_id`, set `locked_amount = total_amount`
- [x] 5.3 Add `POST /api/escrow/vault/{vault_id}/release` — accept `milestone_id` + `completion_score`; compute release amount per tier logic; check milestone not frozen (409 if frozen); call `paypal_service.payout_to_freelancer`; record RELEASE transaction; send PAYMENT_RELEASED notification to freelancer
- [x] 5.4 After all milestones terminal: deduct 15% success fee, record SUCCESS_FEE transaction, set vault status CLOSED
- [x] 5.5 Add vault Firestore helpers: `update_vault_status`, `append_vault_transaction`, `freeze_milestone`, `unfreeze_milestone`
- [x] 5.6 Register escrow router in `backend/main.py` (replace/extend existing `/api/escrow` routes)
- [x] 5.7 Update `frontend/app/escrow/page.tsx` to use new vault endpoint and display transaction history

## Phase 6: Delay Penalty Engine

- [x] 6.1 Create `backend/services/penalty_service.py` with pure function `compute_penalty(days_late, payment_amount) -> dict` returning `penalty_rate`, `penalty_amount`, `releasable_amount`
- [x] 6.2 Add `POST /api/escrow/vault/{vault_id}/penalty` to `backend/routers/escrow.py` — accept `milestone_id` + `days_late`; validate milestone is overdue; check not frozen; compute penalty; deduct from vault; record PENALTY transaction; trigger PFI deadline adherence update; send PENALTY_APPLIED notification to freelancer
- [x] 6.3 Add milestone overdue check helper: compare `milestone.deadline_days` against current date offset from project `created_at`

## Phase 7: Dispute Resolution

- [x] 7.1 Create `backend/routers/disputes.py` with `POST /api/disputes` — persist dispute with status OPEN; freeze milestone in vault (`frozen_milestones` array); send DISPUTE_OPENED notification to both parties
- [x] 7.2 Add `PATCH /api/disputes/{dispute_id}` — accept `resolution` + `status` (RESOLVED/DISMISSED); unfreeze milestone; if EMPLOYER_WINS call `paypal_service.refund_capture`; if FREELANCER_WINS call release at full amount; send DISPUTE_RESOLVED notification
- [x] 7.3 Add `GET /api/disputes?project_id={project_id}` route
- [x] 7.4 Register disputes router in `backend/main.py`
- [~] 7.5 Add dispute UI to `frontend/app/freelancer/workspace/[projectId]/page.tsx` — raise dispute button per milestone
- [~] 7.6 Add dispute management view to `frontend/app/employer/dashboard/[projectId]/page.tsx`

## Phase 8: MOU Generation and Digital Signing

- [x] 8.1 Create `backend/services/mou_service.py` with `generate(project) -> dict` producing `mou_json` (structured) and `mou_text` (plain-text) including party names, milestones, penalty schedule, dispute clause, governing law placeholder
- [x] 8.2 Create `backend/routers/contracts.py` with `POST /api/contracts/generate` — accept `project_id`; call MOU service; persist to `contracts` collection with status DRAFT; return both JSON and text
- [x] 8.3 Add `GET /api/contracts/{contract_id}` route
- [x] 8.4 Add `POST /api/contracts/{contract_id}/sign` — validate contract is DRAFT or partially signed; check no duplicate signature (409); record signature with `user_id`, `role`, `signed_at`, `ip_address`; if both parties signed set status EXECUTED + `executed_at`; send CONTRACT_SIGNED notification; if EXECUTED send CONTRACT_EXECUTED notification to both parties
- [x] 8.5 Add `GET /api/contracts/{contract_id}/signatures` route
- [x] 8.6 Register contracts router in `backend/main.py`
- [~] 8.7 Create `frontend/app/contracts/[contractId]/page.tsx` — display MOU text, show signature status, sign button
- [~] 8.8 Add contract API calls to `frontend/lib/api.ts`
- [~] 8.9 Enforce ACTIVE gate in project creation/activation: check vault FUNDED and contract EXECUTED before allowing project status ACTIVE

## Phase 9: Notifications Sub-System

- [~] 9.1 Create `backend/routers/notifications.py` with `GET /api/users/{user_id}/notifications` (ordered by `created_at` desc) and `PATCH /api/users/{user_id}/notifications/{notification_id}` (set `read = true`)
- [~] 9.2 Register notifications router in `backend/main.py`
- [~] 9.3 Create `frontend/components/NotificationBell.tsx` — fetches unread count from Firestore `notifications` sub-collection, displays numeric badge, dropdown list of recent notifications, marks read on click
- [~] 9.4 Integrate `NotificationBell` into `frontend/components/Navbar.tsx` replacing or extending existing auth state display
- [~] 9.5 Add notification API calls to `frontend/lib/api.ts`

## Phase 10: Post-Project Feedback

- [~] 10.1 Create `backend/routers/feedback.py` with `POST /api/projects/{project_id}/feedback` — accept `employer_id`, `feedback_text`, `satisfaction_rating` (1–5); validate project is completed; pass rating as quality signal to PFI_Agent; persist PFI history entry; return updated PFI
- [~] 10.2 Register feedback router in `backend/main.py`
- [~] 10.3 Add feedback form to `frontend/app/employer/dashboard/[projectId]/page.tsx` shown when project status is completed

## Phase 11: Property-Based Tests

- [~] 11.1 Set up Hypothesis in `backend/` (`pip install hypothesis`, add to requirements)
- [~] 11.2 Create `backend/tests/test_properties.py` with property tests for:
  - [ ] 11.2a Property 1 — search excludes unavailable/incomplete profiles
  - [ ] 11.2b Property 2 — search results sorted descending by relevance
  - [ ] 11.2c Property 3 — duplicate application returns 409, count unchanged
  - [ ] 11.2d Property 4 — apply to FILLED/CLOSED job returns 422
  - [ ] 11.2e Property 5 — penalty is monotone in days_late
  - [ ] 11.2f Property 6 — release + penalty <= payment_amount
  - [ ] 11.2g Property 7 — open dispute freezes milestone (release/penalty fail)
  - [ ] 11.2h Property 8 — contract JSON round-trip serialization
  - [ ] 11.2i Property 9 — contract EXECUTED iff both signatures present
  - [ ] 11.2j Property 10 — duplicate signature returns 409, count unchanged
  - [ ] 11.2k Property 11 — PFI score always in [300, 900]
  - [ ] 11.2l Property 12 — pfi_history entry written with correct delta on every update
  - [ ] 11.2m Property 13 — notification written with read=false and non-empty message for every key event
