# Technical Requirements Document (TRD): Studdy

> **Version:** 1.1 — MVP  
> **Status:** Approved / Engineering Ready  
> **Target PRD:** [studdy_prd.md](file:///c:/Users/User/OneDrive/Desktop/Studdy%20Project/studdy_prd.md)  
> **Author:** Lead Systems Architect  
> **Last Updated:** 2026-08-18

---


## 1. Executive Summary & Stack Selection

This Technical Requirements Document (TRD) specifies the hardware, software, architectural patterns, data models, API contracts, security bounds, and deployment procedures for **Studdy** — an AI-powered study companion application.

### 1.1 Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 14+ | Fullstack React framework with SSR and Node API handlers |
| **Language** | TypeScript | 5.0+ | Strict type safety across client and server logic |
| **Styling** | Vanilla CSS / CSS Modules | Standard | Design system tokens, dynamic dark mode, no heavy framework overhead |
| **AI SDK** | Google Gen AI SDK (`@google/genai`) | Latest | Server-side integration with Google Gemini 2.0 Flash API |
| **Validation** | Zod (or custom TS guards) | 3.x | Strict runtime schema parsing of AI outputs |
| **Deployment** | Vercel Serverless | Node 18/20 | Global edge hosting with zero secret exposure |

---

## 2. System Architecture & Component Mapping

### 2.1 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                │
│                                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐                    │
│  │   Quiz Page / UI     │   │  Explain Page / UI   │                    │
│  └──────────┬───────────┘   └──────────┬───────────┘                    │
└─────────────┼──────────────────────────┼────────────────────────────────┘
              │ Client HTTP Post         │ Client HTTP Post
              │ (Validated Input)        │ (Validated Input)
              ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS SERVER ROUTE HANDLERS                    │
│                                                                         │
│  ┌──────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  POST /api/quiz              │  │  POST /api/explain              │  │
│  │  - Rate Limit & Sanitize     │  │  - Rate Limit & Sanitize        │  │
│  │  - Build Prompt              │  │  - Build Prompt                 │  │
│  └──────────────┬───────────────┘  └──────────────┬──────────────────┘  │
└─────────────────┼─────────────────────────────────┼─────────────────────┘
                  │ Server API Call (Secret Key)    │ Server API Call (Secret Key)
                  ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      GOOGLE GEMINI API ENDPOINT                         │
│                    (gemini-2.0-flash Model)                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure & Module Boundaries

```
studdy/
├── app/
│   ├── layout.tsx              # Root Layout: CSS vars, Theme Provider, Meta
│   ├── page.tsx                # Landing Page: Feature chooser cards
│   ├── quiz/
│   │   └── page.tsx            # /quiz page component & view state
│   ├── explain/
│   │   └── page.tsx            # /explain page component & view state
│   └── api/
│       ├── quiz/
│       │   └── route.ts        # Handler: Input check -> AI call -> Schema validate -> Return
│       └── explain/
│           └── route.ts        # Handler: Input check -> AI call -> Schema validate -> Return
├── components/
│   ├── ui/
│   │   ├── Button.tsx          # Primary, secondary, loading states
│   │   ├── TextArea.tsx        # Textarea with live character counter
│   │   ├── Spinner.tsx         # Accessible loader spinner
│   │   ├── ErrorBanner.tsx     # Standard alert box for client/API errors
│   │   └── Header.tsx          # Navigation header & brand logo
│   ├── quiz/
│   │   ├── QuizForm.tsx        # User input form with client-side validation
│   │   ├── QuizCard.tsx        # Question card with toggleable answer reveal
│   │   └── QuizList.tsx        # Container for 10 rendered QuizCards + Copy All
│   └── explain/
│       ├── ExplainForm.tsx     # User input form with client-side validation
│       ├── OriginalTextCard.tsx# Original passage viewer
│       ├── ExplanationCard.tsx # Simplified explanation text
│       └── WatchOutSection.tsx # Flagged critical items cards (fees, dates, etc.)
├── lib/
│   ├── ai.ts                   # Gemini API client initialization (Singleton)
│   ├── rateLimit.ts            # Simple memory-based IP rate limiter middleware
│   ├── schemas/
│   │   ├── quizSchema.ts       # Zod schema & validator for 10 quiz questions
│   │   └── explainSchema.ts    # Zod schema & validator for explanation payload
│   └── types.ts                # Shared TypeScript definitions
├── styles/
│   ├── globals.css             # Theme variables (colors, typography, breakpoints)
│   └── components.css          # Shared utility styles
├── .env.local                  # GEMINI_API_KEY (Server-side environment variable)
└── next.config.ts
```

---

## 3. Data Schemas & TypeScript Definitions

### 3.1 Quiz Types (`lib/types.ts`)

```typescript
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface QuizQuestion {
  id: number; // 1 to 10
  type: QuestionType;
  question: string;
  options?: string[]; // Present if type === 'multiple_choice' (exactly 4 options)
  answer: string; // The correct answer text or choice
  explanation?: string; // Optional brief context for the answer
}

export interface QuizRequestPayload {
  text: string;
}

export interface QuizSuccessResponsePayload {
  success: true;
  data: {
    title: string;
    questions: QuizQuestion[];
  };
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: 'INVALID_INPUT' | 'RATE_LIMITED' | 'AI_GENERATION_FAILED' | 'SERVER_TIMEOUT' | 'INTERNAL_ERROR';
    message: string;
  };
}

export type QuizApiResponse = QuizSuccessResponsePayload | ApiErrorPayload;
```

### 3.2 Explain Types (`lib/types.ts`)

```typescript
export type WatchOutCategory = 
  | 'fee'
  | 'deadline'
  | 'penalty'
  | 'auto_renewal'
  | 'obligation'
  | 'restriction'
  | 'liability';

export interface WatchOutItem {
  id: number;
  category: WatchOutCategory;
  title: string; // Short summary (e.g., "30-Day Termination Notice")
  description: string; // Detail of what user needs to watch out for
}

export interface ExplainSuccessResponsePayload {
  success: true;
  data: {
    summary: string; // High-level 1-2 sentence overview
    detailedExplanation: string; // In-depth plain-language breakdown
    watchOutFor: WatchOutItem[]; // Array of flagged items, may be empty []
  };
}

export interface ExplainRequestPayload {
  text: string;
}

export type ExplainApiResponse = ExplainSuccessResponsePayload | ApiErrorPayload;
```

---

## 4. API Endpoints & Contracts

### 4.1 `POST /api/quiz`

Generates 10 practice questions from provided notes.

* **Headers:** `Content-Type: application/json`
* **Timeout:** 30,000 ms (30 seconds)

#### Input Validation Protocol:
1. `text` must be a non-null string.
2. `text.trim().length` must be `≥ 50` characters. Return HTTP `400` if shorter.
3. `text.length` must be `≤ 10,000` characters. Return HTTP `400` if longer.

#### Sample Request Body:
```json
{
  "text": "Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that can later be released to fuel the organisms' activities. This chemical energy is stored in carbohydrate molecules, such as sugars and starches, which are synthesized from carbon dioxide and water. The process takes place in organelles called chloroplasts, which contain chlorophyll."
}
```

#### Sample HTTP 200 Success Response:
```json
{
  "success": true,
  "data": {
    "title": "Photosynthesis Fundamentals Practice Quiz",
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "Where does photosynthesis take place inside plant cells?",
        "options": ["Mitochondria", "Chloroplasts", "Ribosomes", "Cell Wall"],
        "answer": "Chloroplasts",
        "explanation": "Chloroplasts are the organelles containing chlorophyll where light conversion happens."
      },
      {
        "id": 2,
        "type": "true_false",
        "question": "Oxygen is the primary sugar synthesized during photosynthesis to store chemical energy.",
        "answer": "False",
        "explanation": "Carbohydrates such as sugars and starches store chemical energy, not oxygen."
      },
      {
        "id": 3,
        "type": "short_answer",
        "question": "What two raw ingredients are combined to synthesize carbohydrate molecules?",
        "answer": "Carbon dioxide and water",
        "explanation": "Sugars and starches are synthesized directly from carbon dioxide and water."
      }
    ]
  }
}
```

---

### 4.2 `POST /api/explain`

Explains complex/dense text and flags critical clauses or warnings.

* **Headers:** `Content-Type: application/json`
* **Timeout:** 30,000 ms (30 seconds)

#### Input Validation Protocol:
1. `text` must be a non-null string.
2. `text.trim().length` must be `≥ 50` characters. Return HTTP `400` if shorter.
3. `text.length` must be `≤ 5,000` characters. Return HTTP `400` if longer.

#### Sample HTTP 200 Success Response:
```json
{
  "success": true,
  "data": {
    "summary": "This lease agreement automatically renews every year unless you give written notice 60 days before your contract end date.",
    "detailedExplanation": "The provided clause means your apartment contract will not automatically end when your lease year is up. Instead, it will sign you up for another full year unless you inform the landlord in writing at least 60 days before the deadline. If you fail to notify them in time, you may be charged a early-cancellation penalty equal to two months' rent.",
    "watchOutFor": [
      {
        "id": 1,
        "category": "auto_renewal",
        "title": "Automatic 12-Month Renewal",
        "description": "Lease automatically extends for another full year if notice is missed."
      },
      {
        "id": 2,
        "category": "deadline",
        "title": "60-Day Written Notice Requirement",
        "description": "Must deliver written notice 60 days prior to the expiration date."
      },
      {
        "id": 3,
        "category": "penalty",
        "title": "2-Month Rent Cancellation Fee",
        "description": "Terminating after auto-renewal incurs a hefty two-month financial penalty."
      }
    ]
  }
}
```

---

## 5. AI Prompt Engineering & Output Enforcement

To guarantee zero malformed outputs, requests to the Gemini API use strict system instructions and structured JSON response schemas (`responseSchema`).

### 5.1 Quiz Generation Prompt Contract

```typescript
export const QUIZ_SYSTEM_INSTRUCTION = `
You are an expert educational assessment system. Your job is to generate a high-quality practice quiz based ONLY on the provided text.

Strict Requirements:
1. Generate EXACTLY 10 questions.
2. Question Type Distribution MUST be:
   - 4 Multiple Choice questions (type: "multiple_choice") with EXACTLY 4 distractor options.
   - 3 True/False questions (type: "true_false").
   - 3 Short Answer questions (type: "short_answer").
3. Hidden Answers: The 'answer' field must contain the correct answer explicitly.
4. Output must match the exact JSON schema requested. Do not include markdown blocks or extra preamble.
`;
```

#### Gemini API Configuration Parameters:
```typescript
const quizGenConfig = {
  model: 'gemini-2.0-flash',
  config: {
    systemInstruction: QUIZ_SYSTEM_INSTRUCTION,
    temperature: 0.2, // Low temperature for high adherence to factual text
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        questions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'INTEGER' },
              type: { type: 'STRING', enum: ['multiple_choice', 'true_false', 'short_answer'] },
              question: { type: 'STRING' },
              options: { type: 'ARRAY', items: { type: 'STRING' } },
              answer: { type: 'STRING' },
              explanation: { type: 'STRING' }
            },
            required: ['id', 'type', 'question', 'answer']
          }
        }
      },
      required: ['title', 'questions']
    }
  }
};
```

### 5.2 Explain Text Prompt Contract

```typescript
export const EXPLAIN_SYSTEM_INSTRUCTION = `
You are a clear-language assistant. Explain the supplied text in simpler language.
Identify potentially important clauses or details that may deserve attention (such as fees, deadlines, penalties, auto-renewal clauses, obligations, restrictions, or liability), but do NOT provide legal, financial, or professional advice and do NOT determine whether a contract or document is safe, fair, or legally enforceable.

Strict Requirements:
1. Provide a short 1-2 sentence 'summary'.
2. Provide a detailed 'detailedExplanation' breaking down complex terms into plain English.
3. Identify and extract any critical items in 'watchOutFor' list (fees, deadlines, penalties, auto-renewals, obligations, restrictions, liability). If none exist, return an empty array [].
4. Output must match the exact JSON schema requested.
`;
```

---

## 6. Security, Rate Limiting & Error Boundaries

### 6.1 Server-Side Key Security (`NFR-S1`)

* The Google Gemini API key **MUST NEVER** be prefixed with `NEXT_PUBLIC_`.
* Name: `GEMINI_API_KEY` stored exclusively in `.env.local` or host environment settings.
* Any client attempt to read `process.env.GEMINI_API_KEY` will evaluate to `undefined`.

### 6.2 Rate Limiting Specification (`NFR-S4`)

To prevent API key depletion and denial-of-service abuse:
* **Prototype Mechanism:** In-memory token bucket keyed by client IP address (`x-forwarded-for` or socket address) for local development and single-instance Node runtime.
* **Serverless Deployment Limitation:** In serverless environments (e.g. Vercel Serverless Functions), separate requests hit ephemeral function instances with independent memory spaces. Therefore, an in-memory `Map` is **not production-grade**.
* **Production Recommendation:** For production deployment, use a distributed key-value store such as **Upstash Redis** (`@upstash/ratelimit`) or platform-level edge firewall rate-limiting rules.
* **Limit:** Maximum **10 requests per minute** per client IP address.
* **HTTP Status on Exceeded Limit:** `429 Too Many Requests`
* **Response Body:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "You have made too many requests. Please wait a minute before trying again."
  }
}
```


### 6.3 Input Sanitization & XSS Prevention (`NFR-S2`, `NFR-S3`)

* User input strings are trimmed and sanitized against control characters before building AI payloads.
* All AI outputs returned from the server are injected exclusively via standard React JSX text bindings (`{question.text}`).
* Direct DOM injection methods like `dangerouslySetInnerHTML` are **strictly forbidden**.

---

## 7. Frontend Interface & Design System

### 7.1 CSS Design System Tokens (`styles/globals.css`)

```css
:root {
  /* Color Palette - Dark Premium Default */
  --bg-primary: #0b0f19;
  --bg-secondary: #151c2e;
  --bg-card: #1e293b;
  --bg-card-hover: #26334d;
  
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  --accent-primary: #6366f1; /* Indigo */
  --accent-glow: rgba(99, 102, 241, 0.25);
  --accent-secondary: #10b981; /* Emerald green for reveal/success */
  --accent-warning: #f59e0b; /* Amber for Watch Out items */
  --accent-danger: #ef4444; /* Red for validation errors */
  
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: #6366f1;

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Layout & Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --max-width: 1000px;
}
```

### 7.2 Component Responsibilities

1. **`QuizForm.tsx`**
   - Renders standard `<textarea>` with character count indicator (`X / 10,000`).
   - Validates length instantly on change (`< 50` chars displays subtle helper alert; `> 10,000` disables submit button).
   - Shows active loading spinner inside submit button during fetch.

2. **`QuizCard.tsx`**
   - Displays single question card with question number badge and question type pill (`[Multiple Choice]`, `[True/False]`, `[Short Answer]`).
   - Answer section is initially hidden using CSS display / conditional React state (`showAnswer: boolean`).
   - Toggling **"Reveal Answer"** flips state and applies smooth CSS transition.

3. **`ExplainResult.tsx`**
   - Two-column flex/grid container on desktop (`> 768px`), collapsing to single-column stacked layout on mobile screens (`< 768px`).
   - Highlights "Watch Out For" items using warning-themed cards with category badges (e.g. `[Penalty]`, `[Deadline]`).

---

## 8. Verification & Test Plan

### 8.1 Minimal Automated Testing Suite (Vitest)

To guarantee high quality without bloat, the MVP includes automated unit tests targeting core validation and AI output parsing contracts. Run via `npm test`.

#### Test Suites:
1. **Input Validation Tests (`__tests__/validateInput.test.ts`)**
   - Reject empty string (`""` → `INVALID_INPUT`).
   - Reject 49-character string (`TOO_SHORT`).
   - Accept 50-character string (valid).
   - Accept max limit strings (5,000 for explain, 10,000 for quiz).
   - Reject string exceeding maximum limit (`TOO_LONG`).

2. **Quiz Schema Validation Tests (`__tests__/quizSchema.test.ts`)**
   - Accept valid array of 10 questions with exact 4/3/3 split.
   - Reject quiz with 9 or 11 questions.
   - Reject `multiple_choice` question with 3 or 5 options (must be exactly 4).
   - Reject `true_false` question with answer set to anything other than `"True"` or `"False"`.
   - Reject `short_answer` question containing an `options` array.

3. **Explain Schema Validation Tests (`__tests__/explainSchema.test.ts`)**
   - Accept valid payload with summary, detailed explanation, and watchOutFor array.
   - Accept empty `watchOutFor: []` array when text contains no warnings.
   - Reject payload missing required string fields (`summary` or `detailedExplanation`).
   - Reject invalid `WatchOutCategory` enum values.

### 8.2 Manual Verification Matrix

| Test ID | Area | Scenario / Action | Expected Result | Pass Criteria |
|---|---|---|---|---|
| **VT-01** | Validation | Submit empty string in Quiz Form | Form prevents API call; displays inline red error "Please paste some text to continue." | Inline error visible, 0 HTTP requests |
| **VT-02** | Validation | Submit 30-character note in Quiz Form | Form displays error "Your text is too short. Please paste at least 50 characters." | Inline error visible, submit blocked |
| **VT-03** | Security | Search client JavaScript bundles for `GEMINI_API_KEY` | Key string is completely absent from all `.js` bundles generated by build | 0 matches found in build output |
| **VT-04** | Quiz API | Send valid notes to `/api/quiz` | Server returns 200 OK with exactly 10 structured questions | 10 valid questions parsed by client |
| **VT-05** | UI Interaction | Click "Reveal Answer" button on Question #3 | Answer text appears; button text changes to "Hide Answer" | Toggle state changes cleanly |
| **VT-06** | Explain API | Send lease contract text to `/api/explain` | Server returns 200 OK with summary, detailed breakdown, flagged "Watch Out For" items, and legal disclaimer | Items rendered in warning cards; disclaimer visible |
| **VT-07** | Network Error | Disconnect network & click Submit | API returns failure banner: "Something went wrong. Please check your connection and try again." | Error banner renders without crash |
| **VT-08** | Responsiveness | View app on 375px mobile viewport | No horizontal scrollbar; inputs and buttons fully clickable and touch-friendly | 100% responsive design |

---

## 9. Implementation Essentials & Concrete Utilities

To eliminate developer friction and ensure 100% seamless execution, copy-paste ready utility scripts and configurations are provided below.

### 9.1 Robust JSON Parsing Helper (`lib/cleanJson.ts`)

AI models occasionally wrap JSON outputs in Markdown code blocks (e.g. ` ```json ... ``` `). This helper strips code fences and sanitizes raw AI text before calling `JSON.parse()`.

```typescript
/**
 * Safely parses raw text returned by LLMs into JSON objects by stripping 
 * markdown code block wrappers and leading/trailing whitespace.
 */
export function safeParseAiJson<T>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip leading ```json or ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  }

  // Strip trailing ```
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    throw new Error(`Failed to parse AI output into JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### 9.2 Type-Strict Zod Schemas (`lib/schemas/quizSchema.ts` & `lib/schemas/explainSchema.ts`)

```typescript
// lib/schemas/quizSchema.ts
import { z } from 'zod';

export const MultipleChoiceQuestionSchema = z.object({
  id: z.number(),
  type: z.literal('multiple_choice'),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4, "Multiple choice questions must have exactly 4 options"),
  answer: z.string().min(1),
  explanation: z.string().optional()
});

export const TrueFalseQuestionSchema = z.object({
  id: z.number(),
  type: z.literal('true_false'),
  question: z.string().min(1),
  options: z.undefined().optional(),
  answer: z.enum(['True', 'False']),
  explanation: z.string().optional()
});

export const ShortAnswerQuestionSchema = z.object({
  id: z.number(),
  type: z.literal('short_answer'),
  question: z.string().min(1),
  options: z.undefined().optional(),
  answer: z.string().min(1),
  explanation: z.string().optional()
});

export const QuizQuestionSchema = z.discriminatedUnion('type', [
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
  ShortAnswerQuestionSchema
]);

export const QuizResponseSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuizQuestionSchema).length(10, "Must contain exactly 10 questions")
}).refine((data) => {
  const mc = data.questions.filter(q => q.type === 'multiple_choice').length;
  const tf = data.questions.filter(q => q.type === 'true_false').length;
  const sa = data.questions.filter(q => q.type === 'short_answer').length;
  return mc === 4 && tf === 3 && sa === 3;
}, {
  message: "Quiz must contain exactly 4 Multiple Choice, 3 True/False, and 3 Short Answer questions"
});

export type ValidatedQuizResponse = z.infer<typeof QuizResponseSchema>;
```

```typescript
// lib/schemas/explainSchema.ts
import { z } from 'zod';

export const WatchOutCategorySchema = z.enum([
  'fee',
  'deadline',
  'penalty',
  'auto_renewal',
  'obligation',
  'restriction',
  'liability'
]);

export const WatchOutItemSchema = z.object({
  id: z.number(),
  category: WatchOutCategorySchema,
  title: z.string().min(1),
  description: z.string().min(1)
});

export const ExplainResponseSchema = z.object({
  summary: z.string().min(1),
  detailedExplanation: z.string().min(1),
  watchOutFor: z.array(WatchOutItemSchema)
});

export type ValidatedExplainResponse = z.infer<typeof ExplainResponseSchema>;
```

### 9.3 In-Memory Rate Limiter Helper (`lib/rateLimit.ts`)

> **Note:** Strictly for local dev/single instance. Production serverless deployments should use Upstash Redis (`@upstash/ratelimit`).

```typescript
// lib/rateLimit.ts
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

export function checkRateLimit(ip: string): { isLimited: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { isLimited: false, remaining: MAX_REQUESTS - 1 };
  }

  if (record.count >= MAX_REQUESTS) {
    return { isLimited: true, remaining: 0 };
  }

  record.count += 1;
  return { isLimited: false, remaining: MAX_REQUESTS - record.count };
}
```

### 9.4 Package Manifest Dependencies (`package.json`)

```json
{
  "name": "studdy",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "vitest": "^1.5.0"
  }
}
```

### 9.5 UX Micro-Interactions & Input Ergonomics

1. **Auto-Scroll to Results**:
   When AI results arrive successfully, execute `resultsRef.current?.scrollIntoView({ behavior: 'smooth' })` to focus immediately on output.
2. **Keyboard Submission**:
   Pressing `Ctrl + Enter` (or `Cmd + Enter`) while focused in any text input area triggers submission automatically.
3. **Legal/Financial Safety Disclaimer Component**:
   Below explanation output, render standard disclaimer text block to establish clear reading-assistant boundaries.


---

*End of Technical Requirements Document (TRD) v1.0*

