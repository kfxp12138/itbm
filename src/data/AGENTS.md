# DATA LAYER

Static question banks and type definitions. All content in Chinese.

## FILES

| File | Lines | Content | Origin |
|------|-------|---------|--------|
| `mbti-questions.ts` | 568 | 70 MBTI questions, A/B answers with E/I/S/N/T/F/J/P scores | Copied from `mbti/data/personality-test.ts` |
| `mbti-types.ts` | 1596 | 16 personality type descriptions (traits, strengths, weaknesses, tips) | Copied from `mbti/data/personality-class-groups.ts` |
| `mbti-classes.ts` | 39 | 8 dimension labels (E/I/S/N/T/F/J/P with Chinese descriptions) | Derived from source |
| `iq-data.ts` | 22 | 60 correct answers, IQ score mapping, set config, helper functions | Ported from `iq-tester/src/tester.py` |
| `career-data.ts` | 46 | 10 BFI-10 questions + 16 MBTI-career mappings | Translated from `Career-Prediction/.../data.js` + `mbti.js` |

## EDITING RULES

- `mbti-types.ts` (1596 lines): NEVER rewrite entire file. Target specific type objects by searching for `type: "ENFJ"` etc. Truncation risk is real.
- `mbti-types.ts` line 27 has double assignment `= [] = [` — do not "fix" this, it compiles and the build passes.
- Question numbering is 1-indexed (`no: 1` through `no: 70` for MBTI, `no: 1` through `no: 10` for career).
- IQ `CORRECT_ANSWERS` are 1-indexed (values 1-8). Frontend answers are 0-indexed. The +1 offset happens in `iq-scoring.ts`.
- Career questions 1-5 have `reversed: true` — scoring inverts them (`6 - value`).

## EXPORT PATTERN

All files use named exports with TypeScript interfaces:

```typescript
export interface MBTIQuestion { ... }
export const mbtiQuestions: MBTIQuestion[] = [...]

export const FFM_TRAITS = [...] as const  // readonly tuple
```

No default exports. Scoring libs import by name: `import { mbtiQuestions } from '@/data/mbti-questions'`

## ANTI-PATTERNS

- Do not add default exports — all consumers use named imports
- Do not change array ordering in `CORRECT_ANSWERS` or `careerQuestions` — scoring depends on index positions
- Do not change `FFM_TRAITS` order — maps to question pairs by index
- `MBTIType` interface has optional `suggestions?: string[]` — some types have it, some don't
