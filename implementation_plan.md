# Implementation Plan: Studdy MVP

**Based on:** PRD v1.1 & TRD v1.1 (Revised & Standardized 2026-08-18)  
**Stack:** Next.js 14+ (App Router, TS) · Vanilla CSS Modules · Google Gen AI SDK (`@google/genai`) · Gemini 2.0 Flash (`gemini-2.0-flash`) · Vitest  
**Scope:** Two-tool MVP — Quiz Generator + Explain Text

---

## User Review Required

> [!IMPORTANT]
> The technical decisions across the PRD, TRD, and Implementation Plan are standardized as follows:
>
> | Decision | Standardized Value |
> |---|---|
> | Framework | **Next.js 14+ (App Router, TypeScript)** |
> | AI SDK | **Google Gen AI SDK (`@google/genai` `^0.1.1`)** |
> | AI Model | **Gemini 2.0 Flash (`gemini-2.0-flash`)** |
> | Routing | **Two routes** (`/quiz`, `/explain`) + landing page at `/` |
> | Theme | **Dark theme default** (light mode toggle moved to Post-MVP) |
> | Safety Disclaimer | **Required** under Explain results: *"Studdy highlights potentially important information for easier reading. It does not provide legal, financial, or professional advice."* |
> | Quiz Format | **Strict 50 questions** (20 Multiple Choice [4 options], 15 True/False ["True"/"False"], 15 Short Answer [no options]) |
> | Automated Tests | **Included in MVP scope** (Vitest unit tests for validation & Zod schemas) |
> | Rate Limiting | Prototype in-memory IP limiter for local dev; **Upstash Redis** documented for serverless prod |

> [!WARNING]
> You will need a **Google Gemini API key** (available at [aistudio.google.com](https://aistudio.google.com)) stored in `.env.local` as `GEMINI_API_KEY`. This key is server-side only and never exposed to the browser.

---

## Post-MVP / Backlog Scope (Deferred)

The following polish items are explicitly deferred to post-MVP so development stays focused on core user stories:
- Master "Reveal All / Hide All" buttons (per-card reveal is in MVP)
- "Copy All Questions to Clipboard" button
- Dark/Light mode theme toggle switch
- Route transition animations & extra SEO polish

---

## Proposed Changes & Task Breakdown

### Component & Execution Layer Ordering

Dependencies flow top-to-bottom:

```
T-01 Scaffold & Vitest → T-02 Design System → T-03 Shared UI
     → T-04 Landing Page
     → T-05 API: /api/quiz & Zod Schema → T-06 Quiz UI
     → T-07 API: /api/explain & Safety Disclaimer → T-08 Explain UI
     → T-09 Automated Tests & Edge Cases → T-10 Mobile Pass & Deploy
```

---

### T-01 · Project Scaffold & Testing Setup

Run `npx create-next-app@latest` in the workspace with TypeScript, App Router, CSS Modules (no Tailwind). Configure `.env.local` placeholder. Install `@google/genai` and `zod`. Configure `vitest` for automated testing.

#### [NEW] `.env.local`
```
GEMINI_API_KEY=your_key_here
```

#### [NEW] `package.json`
Dependencies: `@google/genai`, `next`, `react`, `react-dom`, `zod`.  
DevDependencies: `typescript`, `@types/node`, `@types/react`, `vitest`.

#### [MODIFY] `next.config.ts`
- Disable `x-powered-by` header.
- Add security headers (`X-Frame-Options`, `X-Content-Type-Options`).

---

### T-02 · Design System

Single source of truth for visual tokens — colors, spacing, typography.

#### [NEW] `styles/globals.css`
CSS custom properties defining:
- **Color palette** — dark slate base (`#0b0f19`), surface layers (`#151c2e`, `#1e293b`), accent violet/indigo (`#6366f1`), warning amber (`#f59e0b`), success emerald (`#10b981`), red error (`#ef4444`).
- **Typography** — `Inter` font; clear type scale.
- **Spacing & Radius tokens** — `--radius-sm`, `--radius-md`, `--radius-lg`.

---

### T-03 · Shared UI Components

Reusable primitives used by both features.

#### [NEW] `components/ui/Button.tsx` + `Button.module.css`
- Variants: `primary`, `secondary`, `ghost`.
- States: default, hover, active, disabled, loading (with spinner).

#### [NEW] `components/ui/TextArea.tsx` + `TextArea.module.css`
- Props: `value`, `onChange`, `maxLength`, `minLength`, `label`, `error`, `charCount`.
- Live character counter bottom-right (amber at 80%, red at 100%).
- Inline error text rendering.

#### [NEW] `components/ui/Spinner.tsx` + `Spinner.module.css`
- Rotating arc spinner with `aria-label="Loading"`.

#### [NEW] `components/ui/ErrorBanner.tsx` + `ErrorBanner.module.css`
- Accessible error/warning alert box (`role="alert"`).

#### [NEW] `components/ui/SafetyDisclaimer.tsx` + `SafetyDisclaimer.module.css`
- Rendered disclaimer block for Explain results establishing clear non-legal/non-financial assistance boundaries.

---

### T-04 · Landing Page

#### [MODIFY] `app/page.tsx`
- Hero section: app title + tagline.
- Two primary feature cards linking to `/quiz` and `/explain`.

#### [NEW] `app/layout.tsx`
- Root layout with Inter font and global dark background styles.

---

### T-05 · API Route: `/api/quiz` & Quiz Schema

Core server-side logic for Quiz generation.

#### [NEW] `lib/schemas/quizSchema.ts`
Zod schema enforcing:
- `multiple_choice`: exactly 4 options, valid answer.
- `true_false`: no options, answer strictly `"True"` or `"False"`.
- `short_answer`: no options, non-empty answer string.
- Exact count: array of 50 items with 20 MC / 15 TF / 15 Short Answer split.

#### [NEW] `app/api/quiz/route.ts`
1. Validate input (50–8,000 chars).
2. Check IP rate limit (returns `429` if exceeded).
3. Call Gemini 2.0 Flash via `@google/genai` with `responseMimeType: "application/json"`.
4. Clean JSON markdown wrapper (`safeParseAiJson`).
5. Validate via `QuizResponseSchema`.
6. Return `200 JSON` or structured error.

---

### T-06 · Quiz Generator UI

#### [NEW] `app/quiz/page.tsx`
Renders `<QuizForm>` and conditionally `<QuizList>`.

#### [NEW] `components/quiz/QuizForm.tsx`
Textarea input with client-side length check (50–8,000 chars) and submit handler.

#### [NEW] `components/quiz/QuizCard.tsx`
- Displays question number and type badge.
- Multiple choice renders all 4 options.
- Answer hidden by default with per-card **"Reveal Answer"** toggle.

#### [NEW] `components/quiz/QuizList.tsx`
Container displaying 10 `QuizCard` items and a "Generate New Quiz" button.

---

### T-07 · API Route: `/api/explain` & Explain Schema

#### [NEW] `lib/schemas/explainSchema.ts`
Zod schema for `summary`, `detailedExplanation`, and `watchOutFor` array.

#### [NEW] `app/api/explain/route.ts`
1. Validate input (≥ 50 chars).
2. Call Gemini 2.0 Flash with safety instruction ("clear-language assistant, not legal/financial advisor").
3. Clean and parse JSON.
4. Validate via `ExplainResponseSchema`.
5. Return `200 JSON`.

---

### T-08 · Explain Text UI

#### [NEW] `app/explain/page.tsx`
Renders `<ExplainForm>` and conditionally `<ExplainResult>`.

#### [NEW] `components/explain/ExplainForm.tsx`
Textarea input with minimum length check (50 chars) and loading state.

#### [NEW] `components/explain/ExplainResult.tsx`
- Side-by-side on desktop / stacked on mobile (Original text vs Plain explanation).
- Warning cards for `"Watch Out For"` items.
- Renders `<SafetyDisclaimer>` at the bottom of the result.

---

### T-09 · Automated Unit Tests & Edge Case Hardening

Run `npm test` (Vitest) to verify all core logic automatically.

#### [NEW] `__tests__/validateInput.test.ts`
- Tests empty input, 49-char input, 50-char input, and max-length boundary limits.

#### [NEW] `__tests__/quizSchema.test.ts`
- Tests 10-question count, MC 4 options requirement, TF "True"/"False" validation, and SA options exclusion.

#### [NEW] `__tests__/explainSchema.test.ts`
- Tests valid explanation payloads, empty watchOutFor arrays, and required field validation.

---

### T-10 · Mobile Pass, Accessibility & Deployment

- Responsive verification on 320px and 375px screens.
- Keyboard navigation & ARIA audit.
- Deploy to Vercel and configure `GEMINI_API_KEY`.

---

## Verification Plan

### Automated Tests
Run via terminal:
```bash
npm test
```
Expected output: 3 test suites passing (`validateInput`, `quizSchema`, `explainSchema`).

### Manual Verification Checklist
- [ ] Quiz Generator rejects input < 50 chars inline.
- [ ] Quiz Generator accepts valid notes and renders 50 questions with hidden answers.
- [ ] Reveal Answer toggle shows answer per card.
- [ ] Explain Text renders side-by-side explanation and Watch Out cards.
- [ ] Safety Disclaimer appears under Explain Text results.
- [ ] API key is verified server-side only (never visible in client DevTools).

---

*End of Implementation Plan v1.1*
