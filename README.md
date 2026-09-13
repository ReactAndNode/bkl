# Bowen K Liu's personal website

React 19 and Next.js 16, exported as a static website for GitHub Pages at https://bowenkliu.com. The existing pages and personal content are retained.

## Development

Use Node.js 24 (see `.nvmrc`) and Yarn 1.22.22:

```sh
nvm install
nvm use
corepack enable
corepack yarn install --frozen-lockfile
yarn dev
```

Open http://localhost:7999. Changes update automatically.

## Validate and preview the production site

```sh
yarn lint
yarn build
yarn test
yarn start
```

`yarn build` creates `out/`, including separate HTML files for every route, the 404 page, the custom domain's `CNAME`, and `.nojekyll` so GitHub Pages serves Next.js assets. The tests check rendered page content, direct URLs, metadata, local assets, and the hosting files. `yarn start` serves the static export locally on port 7999; use `PORT=8000 yarn start` to change it.

## Publishing

The repository continues to use its existing `gh-pages` branch. GitHub Pages should publish from that branch's root with the custom domain `bowenkliu.com`.

```sh
yarn deploy
```

Yarn runs `predeploy` first: lint, build, and export tests must all pass before publishing. Deployment requires Git push access to `https://github.com/ReactAndNode/bkl.git`. Source changes belong on `master`; pushing source alone does not publish the compiled site.

## Editing the site

- `app/page.js`: About Me homepage, sourced from `app/data/about.md`.
- `app/about/page.js`: Picture gallery, sourced from `app/data/photos.js`.
- `app/resume/page.js`, `app/projects/page.js`, `app/contact/page.js`: existing pages.
- `app/data/routes.js`: navigation links; add a matching `app/<route>/page.js` for a new tab.
- `app/components/`: shared UI, including the mobile menu, skill filters, and animated contact address.
- `app/static/css/`: existing Sass design.
- `public/`: images and other files copied into the export.

The gallery retains the original external Unsplash URLs; their availability is controlled by Unsplash. The retired Universal Analytics integration and the unused legacy Stats code were removed with the old Webpack/Express/Babel toolchain.

The existing Sass theme still compiles but emits deprecation warnings for its legacy syntax. The scripts use Next.js's supported Webpack compiler. ESLint 9 is pinned for compatibility with Next.js's current lint plugins.

This is a public static site. Hiding a navigation link does not make content private. Authentication and content changes are outside this code migration.

## Sumday math practice

The **Math** navigation link opens `/math/`, a self-contained practice page with its own scoped styles and bundled fonts:

- **Mental math:** One-minute rounds of addition, subtraction, multiplication, and whole-number division. Three difficulty levels, four answer choices, one point per correct answer, and keys 1–4 for quick answers.
- **Everyday stats:** Twelve lessons across a four-week study path, with examples, three-question quizzes, explanations, daily exercises, mastery, and XP.
- **Quick tip:** One-minute games at 15%, 18%, 20%, 22%, and 25%, with three levels of bill difficulty. Tip amounts round to the nearest cent.

- **Poker Lab:** Call or Fold, Count Your Outs, Find the Edge, and Skill or Luck. Use river hands, betting histories, working opponent ranges, visible Hold’em cards, and an explicitly labeled EV warm-up to practice reasoning.
- **Stock Lab:** Return Rollercoaster, Build a Balanced Basket, Find the Edge, and Skill or Luck. All returns and probabilities are fictional; no live prices or trades are involved.

Both labs offer **Learn** (five untimed decisions with hints and explanations) and **Sprint** (60 seconds, immediate advancement, and a full explanation review afterward). Mixed learning rounds include all four games in the selected lab. A correct decision earns one point; simulated wins or losses do not affect points. Only finished rounds are saved, and lab personal bests compare completed sprints. Existing arithmetic, tipping, and statistics progress is retained.

Call or Fold introduces your known hand, your own wider range, and the opponent’s estimated range separately. Each scenario shows both players’ positions and explains how the betting history relates to your own range. Opponent value bets and possible bluffs have plain-language definitions; the suggested hand lists and exact combination counts are expandable.

Before answering, choose an opponent read: unknown, rarely bluffs, sometimes bluffs, or often bluffs. Unknown is the default and considers the full 0–100% frequency interval for the listed bluff candidates. A decision that changes across those assumptions is graded as “It depends on their bluffing.” Explicit reads use 25%, 50%, or 100% candidate bluff frequencies. Changing a read preserves the cards, pot, question count, and timer; it does not score an answer. Feedback records the chosen assumption. These are simplified learning models, not measured player tendencies or a complete strategy for your own range.

River equity comes from legal opponent combinations after blockers and the selected bluff weights. It shows no win percentage before answering. The optional post-answer slider changes the explored equity and decision without changing your score. An unknown read has no single-outcome simulation. The four situations vary suits, card blockers, and pot sizes.

All five tabs use a 12px minimum text size, with 16px main explanations and responsive layouts for larger text.

Poker scenarios state their assumptions explicitly. Outs questions ask about completing the specified draw on the **next card**, not necessarily winning the hand. The uncertainty game uses a 95% Wilson binomial interval for independent trials of a pre-chosen model; it does not label a favorable sample as proof of skill. The basket game compares historical variation for portfolios reset to equal weights before each fictional month.

Learning references: [pot odds](https://www.pokerstars.com/poker/learn/lesson/pot-odds/), [counting outs](https://www.pokerstars.com/poker/learn/lesson/calculating-outs/), [Wilson confidence intervals](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm), and [diversification](https://www.investor.gov/introduction-investing/getting-started/asset-allocation).

Scores, streaks, and study progress stay in the visitor's browser. Completed rounds count toward a three-session daily goal. Math, tip, and lab questions are generated randomly; statistics quizzes use fixed questions with shuffled answers. Progress on a local origin does not transfer automatically to bowenkliu.com.

The implementation is under `app/math/`. Tests in `test/math-*.test.ts*` cover scoring, timer expiry, keyboard input, tip rounding, poker draws, expected values, confidence intervals, compound returns, mastery, and restored progress; `test/export.test.mjs` checks the exported route. Run `yarn typecheck` for TypeScript checks alongside the existing lint, build, and test commands. The integrated site continues using port 7999; the standalone Sumday project remains on port 3006.
