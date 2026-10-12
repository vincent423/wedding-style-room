# The Wedding Wardrobe

An English wedding guest dress rental MVP for MKT 5590. The customer enters a wedding-specific style room, discovers an edit for the occasion, and tries reserving a look. The visual direction combines wedding invitation typography, blush and wine colors, garden wedding photography, and an eight-look boutique catalog.

[Open the demo website](https://vincent423.github.io/wedding-style-room/) · [Browse the source repository](https://github.com/vincent423/wedding-style-room)

## What works

- Two sample weddings: **EJ2027** (Emma & James, garden formal) and **ON2027** (Olivia & Noah, coastal cocktail).
- Eight illustrated looks with photography, fit notes, available sizes, and sample rental dates.
- Style filters, name/color search, size filtering, and alphabetical sorting.
- Per-wedding favorites and a saved-look collection.
- Size selection, validated contact fields, an explicit demo checkout, and a confirmation.
- A local reservation prevents the same style being reserved twice in the same room on this device.
- Reservations survive refresh, can be canceled, and have a downloadable **demo** receipt.
- Responsive desktop/mobile layouts, keyboard-operable dialogs, focus indicators, and reduced-motion support.
- All images and fonts are included locally. The deployed interface has no external runtime library or build dependency.

## Demo boundaries

This is a classroom prototype, not a live rental business. No payment is taken, no email is sent, and no physical inventory or delivery is booked. Weddings, product names, sizing, prices, and seeded reserved states are illustrative. The garment photographs do not establish real stock or designer partnerships.

Favorites and demo reservations are stored only in the current browser's local storage, separately for each sample wedding. They are not shared across devices or independent guests. A real service would need shared inventory with server-side reservation enforcement, actual garments and verified measurements, payment processing, operator fulfillment, and clear rental policies.

If browser storage is blocked or full, the app keeps each wedding's data in memory for the current visit and explains that refreshing will clear it. Switching sample weddings during that visit preserves favorites and reservations.

Do not interpret browser demo confirmations or seeded reserved labels as observed demand. A real Test 3 must record actual behavior, include everyone with an opportunity to act in the denominator, declare thresholds before running, and separate supply failures from customer rejection.

## Preview locally

Open `index.html` directly in a modern browser, or serve the folder:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/`. A local HTTP server is recommended for consistent browser behavior.

## Publish the classroom demo on GitHub Pages

1. Create a public repository, for example `wedding-style-room`.
2. Extract the project ZIP first. Upload `index.html`, `style.css`, the entire `assets/` folder, and `.nojekyll` to the repository root. Upload the extracted files, not the ZIP itself. You may also upload this README and the tests. Do not upload `work/` or `outputs/`.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, branch **main**, folder **/(root)**, and save.
5. Wait for the deployment to finish. Copy the exact website address displayed by GitHub. A project-site address normally looks like `https://YOUR-USERNAME.github.io/wedding-style-room/`.
6. Test the published link on a phone and in an incognito window. Confirm photos, filters, both wedding rooms, and demo checkout work.

Assets use relative paths, so the site supports a repository-name URL prefix. Uploading source files alone does not enable Pages; the Settings step is required.

GitHub Pages is for this educational demo. Its [usage rules](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) prohibit sites primarily facilitating commercial transactions. If the project progresses to a real paid rental test, keep the source on GitHub and deploy it to an appropriate commercial host instead.

## Project structure

```text
index.html                    Semantic page and dialogs
style.css                     Wedding visual system and responsive layout
assets/js/app.js              Catalog, rooms, dialogs and customer flows
assets/js/rental-store.js     State sanitation, validation and reservation rules
assets/images/               Bundled online photographs
assets/image-credits.json    Exact photo sources and usage context
assets/fonts/                Local fonts and source/license notes
tests/                       State and browser verification
.nojekyll                    Static GitHub Pages publishing
```

## Tests

Node.js 22 or newer is recommended for the commands below:

```sh
node --test --test-isolation=none tests/rental-store.test.cjs
```

For the browser checks, run a local server at port 4173 and install Playwright with a Chromium browser. The script uses an existing Microsoft Edge installation on Windows when available:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser-smoke.cjs
node tests/browser-recovery.cjs
```

The browser scripts can also target a different server using `MVP_URL`. Smoke-test screenshots are written to `work/screenshots/`. The recovery checks cover keyboard focus and blocked/full browser storage.

## Photography and fonts

Wedding images: Jonathan Borba and Eugenia Remark, via Pexels. Dress photography: Petal & Pup retailer product pages, used as illustrative classroom imagery. Retailer photography is **not represented as free stock**; its rights remain with the respective owners. There is no affiliation with the photographed clothing brand or Rent the Runway.

Exact photo URLs are recorded in `assets/image-credits.json` and accessible through the site's **Photo credits** link. Review image usage rights before any public or commercial use and replace assets if necessary.

Bodoni Moda and DM Sans were retrieved from official Google Fonts endpoints. Their local file sources and OFL references are in `assets/fonts/README.txt`.

## License

Original code, tests, documentation, and the SVG favicon use the MIT license in `LICENSE`. The third-party photographs and fonts are excluded; see `NOTICE` and their bundled source/license records. The project license does not make retailer photographs open source.
