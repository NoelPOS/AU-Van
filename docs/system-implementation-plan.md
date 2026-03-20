# AU Van Production System Implementation Plan

## 1) Vision and Scope

### Vision
Keep the current AU Van concept, but move to a production-ready architecture where:
- Admin operations stay on the web admin portal.
- Student operations move to a LIFF app integrated with LINE.
- A LINE Official Account bot handles menu entry points, notifications, and user interactions.
- Payment is manual PromptPay verification (no payment gateway yet).

### In Scope (Phase 1)
- Keep existing admin portal and harden it for production.
- Build a dedicated student LIFF app.
- Integrate LINE Login/LIFF identity with current user model.
- Add LINE bot webhook and rich menu actions.
- Support manual PromptPay proof submission and admin approval.
- Add booking reminders and rescheduling flow.

### Out of Scope (for now)
- Real-time map tracking.
- Automated payment gateway integration.
- Complex dispatch optimization.

---

## 2) Current Project Structure (As-Is)

This repository is a Next.js 14 app router monolith with both admin and student flows.

### Core folders
- `src/app`: pages and route handlers
  - Student pages: `/routes`, `/book/[routeId]`, `/mybookings`, `/profile`
  - Admin pages: `/admin`, `/admin/bookings`, `/admin/timeslots`, `/admin/routes`, `/admin/users`, `/admin/payments`
  - API routes: `/api/bookings`, `/api/timeslots`, `/api/routes-manage`, `/api/seats`, `/api/payments`, `/api/users`, `/api/notifications`
- `src/services`: booking, timeslot, route, user, seat, notification business logic
- `src/models`: Mongoose models (User, Booking, Route, Timeslot, Seat, Payment, Notification)
- `src/libs/auth.ts`: NextAuth config (credentials + Google)
- `src/middleware.ts`: route protection and admin checks

### Existing strengths to reuse
- Clean service layer and validators.
- Role protection via middleware and `requireAdmin`.
- Seat locking and SSE updates.
- Notification abstraction via strategies/factory.
- PromptPay and bank transfer placeholders already exist.

### Main gaps for target architecture
- Student flow currently depends on session-based web auth (not LIFF identity).
- No LINE webhook/bot integration.
- Manual payment proof flow is too simple (only text transaction ID).
- No job scheduler for reminders.
- No explicit production observability, idempotency, or audit logging.

---

## 3) Target Production Architecture

## 3.1 App topology
Use a staged approach.

### Stage A (fastest)
Keep one Next.js app, add clear app boundaries:
- Admin Web: existing `/admin/*`
- LIFF Web: new `/liff/*` routes optimized for mobile webview
- LINE Webhook API: new `/api/line/webhook`

### Stage B (optional later)
Split into separate deployables:
- `admin-web`
- `liff-web`
- `line-webhook-service`
- `job-worker` (reminders, lock cleanup, retries)

## 3.2 Identity and access model
- Admin users: continue using NextAuth credentials/Google.
- Student users (LIFF): authenticate with LINE profile + LIFF ID token.
- Extend `User` model with:
  - `lineUserId` (unique, indexed)
  - `displayName`
  - `pictureUrl`
  - `authProvider` (`local`, `google`, `line`)
- API authorization strategy:
  - Admin endpoints: session + admin role.
  - LIFF endpoints: signed LIFF/LINE token validation and user binding.

## 3.3 Domain modules (target)
- Booking module
- Schedule module (route/timeslot/seat)
- Payment verification module (manual PromptPay)
- Notification module (LINE push + in-app fallback)
- Admin operations module

---

## 4) Product Flows (Target)

## 4.1 Student booking flow (LIFF)
1. Student opens LIFF via rich menu.
2. LIFF obtains LINE profile and app access token.
3. User profile is upserted in AU Van DB.
4. Student chooses route/date/timeslot/seats.
5. Seat lock starts with timeout.
6. Student submits booking with `paymentMethod=promptpay`.
7. System generates booking `PENDING_PAYMENT` and payment `PENDING_REVIEW`.
8. Student uploads payment proof (slip image + reference + paidAt).
9. Admin reviews and marks approved/rejected.
10. On approval, booking becomes `CONFIRMED` and reminder schedule is created.

## 4.2 Admin payment verification flow
1. Admin opens `/admin/payments` queue.
2. Filter by `pending_review`.
3. Review slip image, payer name, amount, reference, paid time.
4. Approve or reject with reason.
5. System logs reviewer + timestamp + reason.
6. Student gets LINE notification of result.

## 4.3 Reschedule flow
1. Student requests reschedule from LIFF booking details.
2. System validates policy window (for example, at least 2 hours before departure).
3. Old seats are released only after new seat lock and confirmation.
4. Payment stays linked (or flagged for manual adjustment when fare differs).
5. Admin audit record is stored.

## 4.4 Reminder flow
- T-24h (optional) and T-1h reminders via LINE push.
- Fallback to in-app notification if LINE push fails.
- Retry policy and dead-letter tracking required.

---

## 5) Data Model Changes

## 5.1 User
Add fields:
- `lineUserId?: string` (unique index)
- `authProvider: "local" | "google" | "line"`
- `displayName?: string`
- `pictureUrl?: string`
- `lineLinkedAt?: Date`

## 5.2 Booking
Consider extending status model:
- Current: `pending | confirmed | cancelled | completed`
- Target:
  - `pending_payment`
  - `payment_under_review`
  - `confirmed`
  - `reschedule_requested`
  - `cancelled`
  - `completed`

Add fields:
- `bookingCode` (human friendly unique code)
- `sourceChannel` (`web_admin`, `liff`, `line_bot`)
- `rescheduledFromBookingId?`

## 5.3 Payment
Add manual verification fields:
- `proofImageUrl?`
- `proofReference?`
- `proofSubmittedAt?`
- `reviewedBy?` (admin user id)
- `reviewedAt?`
- `reviewNote?`
- `status`: include `pending_review`

## 5.4 Notification
Add:
- `channel` (`line_push`, `inapp`, `email`)
- `deliveryStatus`
- `externalMessageId?`

---

## 6) API Design Plan

Create explicit API boundaries.

## 6.1 Admin APIs (existing + harden)
- `/api/admin/bookings`
- `/api/admin/payments`
- `/api/admin/routes`
- `/api/admin/timeslots`
- `/api/admin/users`

## 6.2 LIFF APIs (new)
- `/api/liff/auth/line`
- `/api/liff/routes`
- `/api/liff/timeslots`
- `/api/liff/seats/lock`
- `/api/liff/bookings`
- `/api/liff/bookings/{id}/payment-proof`
- `/api/liff/bookings/{id}/reschedule`

## 6.3 LINE bot APIs (new)
- `/api/line/webhook` (verify signature)
- `/api/line/richmenu/sync` (admin/internal use)
- `/api/line/push/test` (admin/internal use)

## 6.4 Quality requirements for all APIs
- Input validation with zod.
- Idempotency key for booking create and payment proof submit.
- Structured error format with trace ID.
- Rate limiting on public endpoints.
- Audit log for all admin approvals/rejections.

---

## 7) LIFF App Implementation Plan

## 7.1 UX and routing (mobile-first)
Proposed pages:
- `/liff/home`
- `/liff/routes`
- `/liff/book/:routeId`
- `/liff/booking/:bookingId`
- `/liff/my-bookings`
- `/liff/payment/:bookingId`
- `/liff/profile`

## 7.2 LIFF integration
- Initialize LIFF SDK in app bootstrap.
- Force login if not logged in LINE.
- Collect profile (`userId`, `displayName`, `pictureUrl`).
- Exchange LIFF token on backend to bind local user.
- Persist short-lived app token for API calls.

## 7.3 Rich menu integration
Rich menu actions:
- Book Van -> LIFF `/liff/routes`
- My Bookings -> LIFF `/liff/my-bookings`
- Payment Status -> LIFF `/liff/my-bookings?tab=payment`
- Contact Admin -> LINE chat deep link

---

## 8) Admin Portal Refactor Plan

Keep current admin portal and improve it:
- Move admin API paths to `/api/admin/*` (clear boundary).
- Add payment review details panel with proof image preview.
- Add booking reschedule management and reason tracking.
- Add notification center for failed reminders/push.
- Add role-based permissions (super admin vs staff).

---

## 9) Payment (Manual PromptPay) Plan

## 9.1 Phase 1 behavior
- Student sees PromptPay QR/account instructions.
- Student submits:
  - amount
  - transfer reference
  - transfer timestamp
  - slip image
- Payment status becomes `pending_review`.
- Admin approves/rejects.

## 9.2 Validation rules
- Enforce file type and size for slip upload.
- Prevent duplicate proof for same booking unless previous rejected.
- Lock booking confirmation to approved payment only.

## 9.3 Storage
- Store proof images in object storage (not MongoDB binary).
- Save only URL and metadata in `Payment` document.

---

## 10) Notifications and Reminders Plan

Channels:
- Primary: LINE push message.
- Secondary: in-app notification.
- Optional: email fallback.

Events:
- Booking created
- Payment submitted
- Payment approved/rejected
- Booking rescheduled
- Reminder before departure

Delivery controls:
- Retry up to N attempts.
- Store delivery result per channel.
- Admin view for failed deliveries.

---

## 11) Production Readiness Requirements

## 11.1 Security
- Validate LINE webhook signature on every request.
- Store secrets in environment manager, never in repo.
- Enforce strict authorization in every route handler.
- Add CSRF/XSS-safe patterns for admin pages.
- Add audit log for admin critical actions.

## 11.2 Reliability
- Add database indexes for booking lookup and payment queue.
- Add idempotency for critical writes.
- Add background worker for reminders and retries.
- Add health endpoints and readiness checks.

## 11.3 Observability
- Structured logs (JSON).
- Request tracing (trace id).
- Metrics:
  - booking conversion
  - payment review SLA
  - reminder success rate
  - webhook error rate

---

## 12) Delivery Roadmap

## Milestone 1: Foundation hardening (1-2 weeks)
- Define new statuses and schema migrations.
- Add audit log model.
- Create `/api/admin/*` path structure.
- Stabilize admin payment verification workflow.

## Milestone 2: LIFF MVP (2-3 weeks)
- Build `/liff/*` pages using existing booking logic.
- Implement LINE profile binding and LIFF auth middleware.
- Implement booking + payment proof submission.

## Milestone 3: LINE bot + rich menu (1-2 weeks)
- Build webhook endpoint and signature validation.
- Configure rich menu links to LIFF paths.
- Add push notifications for key events.

## Milestone 4: Operations and reminders (1-2 weeks)
- Add reminder scheduler worker.
- Add retry and failure dashboards.
- Add production monitoring and alerts.

## Milestone 5: UAT and go-live (1 week)
- End-to-end test with student and admin scenarios.
- Load test for peak booking windows.
- Rollout and hypercare.

---

## 13) Testing Strategy

Required test layers:
- Unit: validators, services, payment state transitions.
- Integration: API routes with Mongo test DB.
- E2E:
  - LIFF login to booking confirmation
  - payment proof to admin approval
  - reschedule flow
  - reminder delivery

Go-live minimum criteria:
- Zero critical security issues.
- 95%+ reminder delivery success in staging tests.
- No double-booking in concurrency tests.

---

## 14) Immediate Build Backlog (Start Next)

1. Add schema fields for LINE identity and payment proof review.
2. Create `api/liff` namespace with auth handshake endpoint.
3. Build LIFF route list + booking skeleton pages.
4. Implement slip upload endpoint and storage adapter.
5. Refactor admin payments page to `pending_review` workflow.
6. Add basic LINE webhook endpoint with signature verification.
7. Add reminder job skeleton and queue persistence.

---

## 15) Notes Specific to This Repository

- Existing services are reusable; do not rewrite from scratch.
- Keep admin portal in the current app initially to reduce migration risk.
- Introduce LIFF as a parallel student channel, then phase out current student web routes if desired.
- Current payment strategies are stubs and should be treated as manual workflow adapters in Phase 1.


---

## 16) Mandatory Engineering Rules (Always Apply)

These rules are non-negotiable for all new implementation in this project.

## 16.1 Clean Architecture (required)
- Use clear layers: `Domain -> Application -> Interface -> Infrastructure`.
- Keep business rules in domain/application services, not in UI pages or route handlers.
- Route handlers should orchestrate only: validate input, call use case/service, return response.
- Enforce dependency direction: outer layers can depend on inner layers, never the reverse.
- Define interfaces (ports) for external systems (LINE API, storage, queue, email) and inject adapters.

## 16.2 Design principles (required)
- Apply SOLID for maintainable modules.
- Keep DRY, but do not over-abstract too early (YAGNI).
- Prefer simple and explicit flows (KISS), especially for booking and payment state transitions.
- Make critical workflows idempotent and observable by default.
- Add testability as a first-class requirement (pure functions in core rules when possible).

## 16.3 Design patterns to use intentionally
- `Strategy`: payment methods, notification channels.
- `Factory`: create payment/notification strategies.
- `Observer/Event Bus`: booking and payment domain events.
- `Adapter`: LINE webhook client, LIFF auth verifier, storage providers.
- `Repository`: isolate MongoDB persistence from domain logic when module complexity grows.
- `State` (recommended next): formalize booking/payment lifecycle transitions and guards.

## 16.4 Definition of done for every feature
- Has clear layer placement and no leaked business logic in UI.
- Has validation, authorization, and structured error handling.
- Has tests for success path and failure path.
- Has audit logging for admin-impacting actions.
- Has updated docs and sequence notes when behavior changes.

---

## 17) Portfolio Positioning, Niche, and Showcase Strategy

## 17.1 Why this project is strong for portfolio
- It solves a real operational problem with real user roles (students + admins).
- It demonstrates production concerns, not just CRUD screens.
- It includes concurrency handling (seat locking), approvals, scheduling, and notification delivery.
- It shows ecosystem integration (LIFF + LINE bot + webhook), which is highly practical in SEA markets.

## 17.2 Your niche (recommended positioning)
- Niche statement: **I build production-ready LINE-first operational systems for service businesses in Southeast Asia.**
- Secondary angle: **I specialize in booking and operations workflows where reliability, approvals, and notifications matter.**

## 17.3 What to emphasize to impress others
- Architecture maturity: show clean layering and clear API boundaries (`admin`, `liff`, `line webhook`).
- Real-world workflow design: show manual PromptPay proof review, admin approval, and audit trail.
- Reliability engineering: show seat lock timeout, idempotency, retry strategy, reminder jobs, and failure handling.
- Security: show webhook signature verification, role-based access, input validation, and secret management.
- Product thinking: show mobile-first LIFF UX, rich menu entry points, and smooth student journey.

## 17.4 What to showcase in demo and README
- A short architecture diagram (current vs target).
- End-to-end demo path: student books in LIFF, submits PromptPay proof, admin approves in portal, and student receives LINE confirmation/reminder.
- Engineering highlights: pattern usage (Strategy/Factory/Observer/Adapter), testing strategy with sample results, and production readiness checklist/metrics targets.

## 17.5 Suggested personal pitch
- **I took a campus booking prototype and redesigned it into a production-oriented LINE-integrated system with clean architecture, operational controls, and reliability-focused workflows.**


---

## 18) Architecture and Deployment Decision Guide (Interview-Ready)

Use this section to explain **why** each decision was made, what alternatives were considered, and when to change it.

## 18.1 Decision framework to use in interviews
For each decision, answer in this order:
1. Context/problem
2. Options considered
3. Chosen option
4. Trade-offs accepted
5. Revisit trigger

## 18.2 Key architecture decisions (ADR summary)

### ADR-01: Keep modular monolith first, split services later
- Context: We need fast delivery with a small team and existing Next.js code.
- Options: immediate microservices vs modular monolith.
- Decision: modular monolith with clear boundaries (`admin`, `liff`, `line webhook`, `worker responsibilities`).
- Why: lower operational complexity, faster iteration, easier debugging.
- Trade-off: one codebase can become coupled if boundaries are not enforced.
- Revisit trigger: independent scaling or deployment cadence becomes a bottleneck.

### ADR-02: Role/channel separated API namespaces
- Context: Admin, LIFF students, and LINE bot have different auth and risk levels.
- Options: shared mixed endpoints vs explicit namespaces.
- Decision: use `/api/admin/*`, `/api/liff/*`, `/api/line/*`.
- Why: cleaner authorization, auditability, and ownership.
- Trade-off: more endpoints to maintain.
- Revisit trigger: if duplicated logic grows, consolidate through shared application services.

### ADR-03: Hybrid identity model
- Context: Admin users and students authenticate differently.
- Options: single auth provider vs hybrid.
- Decision: NextAuth for admin web, LIFF/LINE identity for students.
- Why: matches real usage and minimizes friction in LINE ecosystem.
- Trade-off: extra token validation and account-linking complexity.
- Revisit trigger: if organization requires central SSO for everyone.

### ADR-04: Manual PromptPay verification in Phase 1
- Context: Need reliable payment confirmation without full gateway integration.
- Options: instant payment gateway vs manual review.
- Decision: proof upload + admin approve/reject workflow.
- Why: fastest safe route for launch, operationally realistic.
- Trade-off: manual workload and slower confirmation.
- Revisit trigger: payment volume or SLA requires automation.

### ADR-05: Event-driven side effects
- Context: Booking and payment actions trigger notifications/reminders.
- Options: direct inline calls vs event-driven handlers.
- Decision: domain events with handlers (Observer pattern).
- Why: decouples core transaction from side effects.
- Trade-off: event traceability needs strong logging.
- Revisit trigger: if throughput rises, move from in-process bus to message queue.

### ADR-06: Concurrency control for seat booking
- Context: Prevent double booking under concurrent access.
- Options: pessimistic lock vs atomic update + lock timeout.
- Decision: atomic seat lock (`available -> locked -> booked`) with expiry.
- Why: simple, practical, and good enough for current scale.
- Trade-off: requires careful timeout handling and cleanup jobs.
- Revisit trigger: large peak traffic requiring distributed locking.

## 18.3 Deployment decisions (recommended target)

### Environment layout
- `dev`: local + test sandbox integrations.
- `staging`: production-like infra for UAT and load tests.
- `prod`: hardened environment with alerts and backup policy.

### Runtime layout (Phase 1)
- Web app: Next.js (admin + LIFF frontend/API).
- Database: MongoDB Atlas.
- Object storage: S3-compatible bucket or Cloudinary for payment slips.
- Queue/cache: Redis (for idempotency keys, rate limits, future jobs).
- Worker: separate process/container for reminders and retries.

### Runtime layout (Phase 2)
- Split webhook and worker from web runtime for independent scaling.
- Keep same domain/application layer contracts to avoid rewrite.

### CI/CD decisions
- PR checks: lint + typecheck + unit/integration tests.
- Merge to `main`: deploy to staging first.
- Promotion: staging approval gate before production deploy.
- Rollback: one-click rollback to previous stable release.

### Production operational decisions
- Add health endpoints (`/health`, `/ready`).
- Add structured logs with request trace ID.
- Monitor SLIs: booking success rate, payment review latency, reminder success rate, webhook failure rate.
- Define SLOs and alert thresholds before go-live.

## 18.4 Security decisions to explain in interview
- Verify LINE webhook signatures server-side.
- Enforce least privilege by route namespace + role checks.
- Validate all payloads with zod before business logic.
- Keep secrets in environment manager and rotate periodically.
- Add immutable audit trail for admin approvals and rejections.

---

## 19) Interview Question Bank (Architecture and Deployment)

## 19.1 “Why didn’t you start with microservices?”
Suggested answer:
- I chose a modular monolith first to optimize delivery speed and reliability with a small team. I enforced clean boundaries and contracts so we can split services later without rewriting domain logic.

## 19.2 “How do you prevent double-booking?”
Suggested answer:
- Seat selection uses atomic status transitions with lock expiry. We only confirm booking after lock ownership is validated. This guarantees that concurrent users cannot finalize the same seat.

## 19.3 “How do you handle payment without a gateway?”
Suggested answer:
- We designed a manual PromptPay verification workflow with proof upload, explicit review states, admin approval, and audit logs. It is operationally safe for early-stage rollout and easy to automate later.

## 19.4 “How do you scale this system?”
Suggested answer:
- First, scale stateless web horizontally and move background reminders/retries to a dedicated worker. Next, isolate webhook and high-traffic modules. Because architecture boundaries are explicit, scaling can be incremental.

## 19.5 “How do you ensure reliability?”
Suggested answer:
- We use validation at boundaries, idempotency for critical writes, event-driven side effects, retries for delivery, and observability with metrics and traceable logs.

## 19.6 “What are the biggest trade-offs in your design?”
Suggested answer:
- We accept temporary manual payment review and monolith deployment complexity limits in exchange for faster time-to-market and lower operational burden. Both are planned upgrade points with clear triggers.

## 19.7 “What would you improve next?”
Suggested answer:
- Add formal booking/payment state machine, move event bus to external queue, automate payment verification where possible, and introduce stronger SLO-driven operations.

## 19.8 “What makes this project production-oriented?”
Suggested answer:
- It includes real-world constraints: role separation, external platform integration (LINE/LIFF), approval workflows, concurrency control, reminders, observability, and deployment strategy.
