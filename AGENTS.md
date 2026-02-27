# UNIFIED TEST APP

**Stack:** Next.js 16.1.6 · React 19 · TypeScript 5 (strict) · Tailwind CSS v4 · App Router
**Language:** Chinese-first (`lang="zh-CN"`), all UI text in Chinese

## STRUCTURE

```
src/
├── app/
│   ├── layout.tsx          # Root layout: Navbar + footer, metadata
│   ├── page.tsx            # Home: hero + 3 test cards
│   ├── mbti/page.tsx       # 70 A/B questions → violet theme
│   ├── mbti/result/page.tsx
│   ├── iq/page.tsx         # 60 image questions, 20min timer → indigo theme
│   ├── iq/result/page.tsx
│   ├── career/page.tsx     # 10 Likert questions → emerald theme
│   ├── career/result/page.tsx
│   └── history/page.tsx    # All results from localStorage
├── components/
│   └── Navbar.tsx          # Client component, mobile hamburger
├── data/                   # Question banks + type definitions (see data/AGENTS.md)
└── lib/                    # Pure scoring functions (no side effects)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add/modify test questions | `src/data/` | See `data/AGENTS.md` for gotchas |
| Change scoring algorithm | `src/lib/{module}-scoring.ts` | Pure functions, no DB |
| Add new test module | Copy pattern: `data/{name}-data.ts` + `lib/{name}-scoring.ts` + `app/{name}/page.tsx` + `app/{name}/result/page.tsx` |
| Modify navigation | `src/components/Navbar.tsx` + `src/app/layout.tsx` footer |
| Change theme colors | `src/app/globals.css` (CSS variables + `@theme inline`) |
| Fix localStorage | Search for `localStorage.getItem` / `setItem` in page files |

## DATA FLOW (all 3 modules follow same pattern)

```
data/{module}.ts → app/{module}/page.tsx → lib/{module}-scoring.ts → localStorage → app/{module}/result/page.tsx
                   (questions)              (user answers)            (scoring)       (persist)    (read & display)
```

**localStorage keys** (dual storage per module):
- `{module}_results` — array of all historical results (append-only)
- `{module}_latest_result` — single most recent result (overwritten)

History page reads all 6 keys.

## CONVENTIONS

- Path alias: `@/*` → `./src/*`
- File naming: kebab-case (`mbti-scoring.ts`), PascalCase components (`Navbar.tsx`)
- All data/lib files use named exports only (no default exports)
- All scoring functions are pure — no side effects, no state
- Client components marked with `'use client'` — only test pages and Navbar
- Tailwind v4 CSS-first config via `@theme inline` in `globals.css` (no `tailwind.config.js`)
- Color scheme: violet (MBTI), indigo/blue (IQ), emerald (Career)
- Consistent UI: `rounded-2xl shadow-xl` cards, `transition-all duration-300` animations

## ANTI-PATTERNS

- `mbti-types.ts` is 1596 lines — edit surgically by type, never rewrite entire file
- Line 27 has `export const mbtiTypes: MBTIType[] = [] = [` — double assignment syntax, builds fine but looks wrong
- No error boundaries — component failures crash the page
- No localStorage error handling — corrupted JSON will throw
- `find()!` non-null assertions in scoring — assumes data integrity
- No shared components for common patterns (progress bars, test cards) — each page duplicates UI

## IQ TEST SPECIFICS

- 60 images in `public/iq-images/` named `{Set}-{N}.png` (A-1 through E-12)
- Answers are 0-indexed in frontend, 1-indexed in `CORRECT_ANSWERS` — comparison: `answers[i] + 1 === CORRECT_ANSWERS[i]`
- Age adjustment: thresholds at 30/35/40/45/50/55 with quotients 97/93/88/82/76/70
- 20-minute countdown timer auto-submits on expiry

## CAREER TEST SPECIFICS

- Questions 0-4 are reverse-scored (`6 - value`)
- FFM pairs: indices [0,5], [1,6], [2,7], [3,8], [4,9]
- MBTI derivation uses individual processed answers (NOT sums): `[2] vs [7]→E/I`, `[0] vs [5]→N/S`, `[3] vs [8]→F/T`, `[1] vs [6]→J/P`

## COMMANDS

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Static build, all 9 routes
npm run lint     # ESLint 9 flat config
npx tsc --noEmit # Type check
```
