# Product Requirements Document: Studdy

> **Version:** 1.1 — MVP  
> **Status:** Approved / Engineering Ready  
> **Author:** Lead Developer (AI-assisted)  
> **Last Updated:** 2026-08-18

---

## 1. Overview

### 1.1 Product Summary

**Studdy** is a web-based AI study companion that helps students and general users transform dense, complex text into usable, interactive study material and plain-language explanations.

The MVP consists of a landing page (`/`) and two standalone tool routes: **Quiz Generator (`/quiz`)** and **Explain Text (`/explain`)**:

| Tool / Route | Core Value / Purpose |
|---|---|
| **Landing Page (`/`)** | Feature chooser landing page linking to both tools |
| **Quiz Generator (`/quiz`)** | Paste notes → get 10 practice questions with hidden answers |
| **Explain Text (`/explain`)** | Paste confusing text → get plain-language explanation + flagged "Watch Out For" items |


### 1.2 Problem Statement

Students waste hours turning class notes into practice questions manually. Readers encounter dense textbook paragraphs, contracts, and bills they cannot easily parse. No simple, frictionless tool exists that uses AI to bridge both gaps in a single, mobile-friendly interface — without requiring login or payment.

### 1.3 Goals

- Deliver a functional, fast, and polished MVP with zero authentication friction.
- Handle AI output validation gracefully — never render raw or malformed AI responses.
- Keep all AI API secrets server-side.
- Produce a mobile-responsive, accessible interface.
- Validate all user inputs with clear, friendly error messages.

### 1.4 Non-Goals & Post-MVP Scope

The following are explicitly **out of scope for the MVP** (moved to Post-MVP / Backlog):

- User accounts, authentication, or saved history
- Payments or subscription tiers
- File upload (PDF, DOCX, etc.)
- Multi-language support
- **Post-MVP UX Polish items:**
  - Copy All Questions / Export to PDF
  - Reveal All / Hide All master toggle buttons
  - Dark/Light mode theme toggle switch (MVP uses dark theme standard)
  - Page transition animations
  - Advanced SEO / OG image generation

---

## 2. Users

### 2.1 Primary Users

| Persona | Description |
|---|---|
| **The Cramming Student** | High school or university student with class notes who needs quick practice questions before an exam. |
| **The Confused Reader** | Anyone who encounters a textbook passage, legal contract, lease agreement, or government bill they cannot easily parse. |

### 2.2 User Stories

#### Feature 1: Quiz Generator

> **US-01** — As a student, I want to paste my class notes and receive exactly 10 mixed-format practice questions (multiple choice, true/false, and short answer) so I can quiz myself without writing questions manually.

> **US-02** — As a student, I want answers to be hidden by default and revealable per-question, so I can test myself honestly before checking.

> **US-03** — As a student, I want to see a loading state while questions are being generated, so I know the app is working.

> **US-04** — As a student, I want to see a clear error if the AI fails or returns unexpected output, so I am never left with a blank or broken screen.

#### Feature 2: Explain Text

> **US-05** — As a user, I want to paste a hard paragraph (textbook, contract, or bill) and receive a plain-language explanation shown alongside the original text, so I can understand confusing material quickly.

> **US-06** — As a user reviewing a contract or bill, I want potentially important details (fees, deadlines, penalties, renewal clauses, obligations, restrictions) flagged as "Watch Out For" items, so I don't miss critical information.

> **US-07** — As a user, I want a prominent disclaimer stating that Studdy is an reading assistant and does not provide legal, financial, or professional advice.

> **US-08** — As a user, I want to see a loading state while the explanation is being generated, so I know the app is working.

#### Validation & General

> **US-09** — As a user, I want to see a clear, friendly validation error if I submit empty input, so I know what to fix.

> **US-10** — As a user, I want to see a clear validation error if my pasted text is too short to process (e.g., fewer than 50 characters), so the app doesn't attempt to generate meaningless output.

> **US-11** — As a mobile user, I want the app to be fully usable on a small screen, so I can study anywhere.

---

## 3. Functional Requirements

### 3.1 Feature: Quiz Generator

#### Input

| Requirement | Detail |
|---|---|
| FR-Q1 | A large text area accepts user's class notes. |
| FR-Q2 | Minimum input length: **50 characters**. Below this, display an inline validation error. |
| FR-Q3 | Maximum input length: **10,000 characters** (to control API cost and response time). Display a character counter. |
| FR-Q4 | A **"Generate Quiz"** button triggers submission. |

#### Processing

| Requirement | Detail |
|---|---|
| FR-Q5 | The AI prompt instructs the model to return **exactly 10 questions** in a structured, validated format (JSON). |
| FR-Q6 | Questions must include a **mix** of: multiple choice (4 options, 1 correct), true/false, and short answer. Exact split: 4 MC / 3 T-F / 3 short answer. |
| FR-Q7 | The server validates the parsed AI response using Zod schema guards: exactly 10 items, each with strict type rules (MC has 4 options, TF answer is "True"/"False", Short Answer has no options). |
| FR-Q8 | If the AI response is malformed or fails validation, the server returns a structured error — never raw AI output. |

#### Output

| Requirement | Detail |
|---|---|
| FR-Q9 | Questions are displayed in a numbered list. |
| FR-Q10 | Each question's answer is **hidden by default**. |
| FR-Q11 | A **"Reveal Answer"** toggle button per question shows/hides the answer. |
| FR-Q12 | Multiple choice questions display all 4 answer options. The correct answer is hidden within the options until revealed. |
| FR-Q13 | A **"Generate New Quiz"** button resets the view and allows re-submission. |

### 3.2 Feature: Explain Text

#### Input

| Requirement | Detail |
|---|---|
| FR-E1 | A large text area accepts the difficult text. |
| FR-E2 | Minimum input length: **50 characters**. Below this, display an inline validation error. |
| FR-E3 | Maximum input length: **5,000 characters**. Display a character counter. |
| FR-E4 | An **"Explain This"** button triggers submission. |

#### Processing

| Requirement | Detail |
|---|---|
| FR-E5 | The AI prompt instructs the model to act as a clear-language assistant (not a legal/financial advisor) and return a structured JSON response with `summary`, `detailedExplanation`, and `watchOutFor` (array of flagged items, can be empty). |
| FR-E6 | The `watchOutFor` array should contain items from these categories when present: fees, deadlines, penalties, auto-renewal clauses, obligations, restrictions, and liability limitations. |
| FR-E7 | The server validates the parsed AI response for required fields before passing it to the client. |
| FR-E8 | If the AI response is malformed or fails validation, the server returns a structured error. |

#### Output

| Requirement | Detail |
|---|---|
| FR-E9 | The original text and the plain-language explanation are displayed **side-by-side** on desktop and **stacked** on mobile. |
| FR-E10 | If the `watchOutFor` array is non-empty, a clearly styled **"⚠️ Watch Out For"** section is displayed below the explanation. |
| FR-E11 | Each "Watch Out For" item is displayed as a distinct, visually highlighted card. |
| FR-E12 | If no "Watch Out For" items exist, the section is omitted entirely. |
| FR-E13 | **Safety Disclaimer:** Below the explanation results, render a clear disclaimer: *"Studdy highlights potentially important information for easier reading. It does not provide legal, financial, or professional advice."* |


### 3.3 Validation & Error Handling

| Requirement | Detail |
|---|---|
| FR-V1 | Empty input: display inline error "Please paste some text to continue." |
| FR-V2 | Too-short input: display inline error "Your text is too short. Please paste at least 50 characters." |
| FR-V3 | Too-long input: disable submission and show inline error "Text exceeds the maximum length of X characters." |
| FR-V4 | API/network error: display a user-friendly banner "Something went wrong. Please try again." — never expose raw error messages or stack traces to the user. |
| FR-V5 | AI output validation failure: display "We couldn't process the AI response. Please try again." |
| FR-V6 | Loading state: display a visible spinner or skeleton with a short message ("Generating your quiz…" / "Explaining your text…") while awaiting the API response. |
| FR-V7 | The Submit button is disabled during loading to prevent duplicate requests. |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Requirement | Detail |
|---|---|
| NFR-P1 | First Contentful Paint < 2 seconds on a standard connection. |
| NFR-P2 | AI API calls should have a server-side timeout of **30 seconds**. If exceeded, return a structured timeout error. |

### 4.2 Security

| Requirement | Detail |
|---|---|
| NFR-S1 | **AI API keys must never be exposed to the client.** All AI calls must be proxied through a server-side API route. |
| NFR-S2 | Input is sent to the server as a plain string. Sanitize inputs server-side before constructing AI prompts. |
| NFR-S3 | AI-generated content must be parsed as structured data (JSON), never injected as raw HTML. |
| NFR-S4 | Rate limiting on API routes to prevent abuse (e.g., max 10 requests/minute per IP at MVP). |

### 4.3 Accessibility & UX

| Requirement | Detail |
|---|---|
| NFR-A1 | All interactive elements must be keyboard-navigable. |
| NFR-A2 | ARIA labels on toggle buttons ("Reveal Answer", "Hide Answer"). |
| NFR-A3 | Color is not used as the sole indicator of state (e.g., error/success). |
| NFR-A4 | Mobile-first responsive layout. Fully usable on screens ≥ 320px wide. |

---

## 5. Architecture

### 5.1 Recommended Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 14+ | Fullstack React framework with SSR and Node API handlers |
| **Language** | TypeScript | 5.0+ | Strict type safety across client and server logic |
| **Styling** | Vanilla CSS / CSS Modules | Standard | Design system tokens, default dark theme, lightweight |
| **AI SDK** | Google Gen AI SDK (`@google/genai`) | Latest (`^0.1.1`) | Official unified Google Gen AI SDK for Node.js / TypeScript |
| **AI Model** | Gemini 2.0 Flash (`gemini-2.0-flash`) | Current | Fast, high-quality structured JSON output |
| **Validation** | Zod | 3.x | Strict runtime schema parsing of AI outputs |
| **Hosting** | Vercel Serverless | Node 18/20 | Zero-config deployment; secret environment key protection |

> **Why Next.js over a simple static site?**  
> The core security requirement (NFR-S1) mandates server-side API calls. A purely static HTML+JS site would expose the AI API key. Next.js API routes solve this cleanly with zero infrastructure overhead.


### 5.2 Application Architecture

```
Browser (Client)
     │
     │  HTTP requests (no API keys)
     ▼
Next.js Frontend (React Pages + Components)
     │
     │  Internal API calls
     ▼
Next.js API Routes (Server-side)         ← API key lives here only
     │
     │  Authenticated requests
     ▼
AI Provider (Gemini / OpenAI)
```

### 5.3 Proposed Folder Structure

```
studdy/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, meta, global styles)
│   ├── page.tsx                # Home page (feature selector / landing)
│   ├── quiz/
│   │   └── page.tsx            # Quiz Generator page
│   ├── explain/
│   │   └── page.tsx            # Explain Text page
│   └── api/
│       ├── quiz/
│       │   └── route.ts        # POST /api/quiz — server-side AI call
│       └── explain/
│           └── route.ts        # POST /api/explain — server-side AI call
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── TextArea.tsx
│   │   ├── Spinner.tsx
│   │   └── ErrorBanner.tsx
│   ├── quiz/
│   │   ├── QuizForm.tsx        # Input form
│   │   └── QuizCard.tsx        # Single question with reveal toggle
│   └── explain/
│       ├── ExplainForm.tsx     # Input form
│       └── ExplainResult.tsx   # Side-by-side original + explanation
├── lib/
│   ├── ai.ts                   # AI client initialization
│   ├── validateQuiz.ts         # Server-side quiz response validator
│   └── validateExplain.ts      # Server-side explain response validator
├── styles/
│   ├── globals.css             # Design tokens, reset, typography
│   └── components.css          # Shared component styles
├── .env.local                  # API keys (never committed)
├── .gitignore
└── next.config.ts
```

---

## 6. Development Task Breakdown

Tasks are ordered by dependency. Each task should be implemented and verified before starting the next.

| # | Task | Description |
|---|---|---|
| T-01 | Project scaffold | Initialize Next.js app, configure `.env.local`, install dependencies |
| T-02 | Design system | Define CSS tokens (colors, spacing, typography, dark/light mode), global reset |
| T-03 | Shared UI components | Build `Button`, `TextArea`, `Spinner`, `ErrorBanner` with full validation states |
| T-04 | Home / Landing page | Build the feature-selector landing page linking to both tools |
| T-05 | API route: `/api/quiz` | Prompt engineering, AI call, JSON parsing, server-side validation, error handling |
| T-06 | Quiz Generator UI | `QuizForm` (input + validation), `QuizCard` (reveal toggle), results layout |
| T-07 | API route: `/api/explain` | Prompt engineering, AI call, JSON parsing, server-side validation |
| T-08 | Explain Text UI | `ExplainForm`, `ExplainResult` (side-by-side layout, Watch Out For section) |
| T-09 | Mobile responsiveness | Test and fix all layouts at 320px, 375px, 768px breakpoints |
| T-10 | Error & edge case hardening | Empty input, short input, API timeout, malformed AI output, rate limit |
| T-11 | Accessibility pass | Keyboard nav, ARIA labels, contrast audit |
| T-12 | Final polish & deploy | SEO meta tags, favicon, deploy to Vercel, smoke test on mobile |

---

## 7. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **AI returns malformed JSON** | High | Wrap all AI calls in try/catch; validate schema strictly server-side; return structured error to client |
| **AI returns fewer/more than 10 questions** | Medium | Validate exact count server-side; retry once automatically or return error to user |
| **AI key leaked to client** | Critical | API key only in `.env.local`; all AI calls in Next.js API routes; secret never referenced in any client component |
| **API timeout / slow response** | Medium | 30s server-side timeout; clear loading state; user-friendly "try again" message |
| **Rate limit abuse** | Medium | Implement basic IP-based rate limiting on API routes via middleware |
| **XSS via AI-generated content** | Medium | Never render AI content as raw HTML (`dangerouslySetInnerHTML`); always use React text nodes |
| **Input too large causing high API cost** | Low-Medium | Enforce `maxLength` on textarea client-side AND validate server-side before calling AI |
| **Mixed question formats not enforced** | Low | Specify exact format distribution in system prompt; validate types in server-side schema check |

---

## 8. Open Questions & Decisions

> [!IMPORTANT]
> The following decisions should be confirmed before development begins.

| # | Question | Default Assumption |
|---|---|---|
| OQ-1 | Which AI provider should be used — **Gemini** or **OpenAI**? | Gemini Flash 2.0 (fast, cost-effective) |
| OQ-2 | Should a **dark mode** be supported at MVP? | Yes — dark mode preferred as default |
| OQ-3 | Should the app be a **single page** (both tools on one page via tabs) or **two separate routes**? | Two routes (`/quiz`, `/explain`) with a shared landing page |
| OQ-4 | Should the **character counter** show a live count or only appear near the limit? | Live count, turns red near limit |
| OQ-5 | Should users be able to **copy** generated questions to clipboard? | Yes — "Copy All" button on results |
| OQ-6 | What is the **minimum viable question format mix** for the quiz? | 4 MC / 3 T-F / 3 Short Answer |
| OQ-7 | Should **rate limiting** be strict (block) or soft (warn)? | Strict block with a friendly message |

---

## 9. Success Metrics (MVP)

| Metric | Target |
|---|---|
| All 10 user stories pass manual testing | 100% |
| No AI API key exposed in client bundle | Verified via browser DevTools |
| Input validation errors surface correctly | All 5 error states confirmed |
| Mobile usability at 375px | No horizontal scroll, all interactions usable |
| Page loads in < 2s | Verified via browser Lighthouse |

---

*End of PRD v1.0*
