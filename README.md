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
