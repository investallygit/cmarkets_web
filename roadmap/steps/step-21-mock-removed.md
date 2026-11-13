# Step 21 · The mock removed (M): done

Step 21 of the [roadmap](../../ROADMAP.md#order).

The front end takes all its data from `CMarket.Api`. `src/mocks` (the MSW routes, the in-memory
state, the sample data, the simulated hubs and their tests) and `public/mockServiceWorker.js` are
gone, and so are MSW, `VITE_USE_MOCKS` and the "Prototype — sample data" labels. The spec's
formulas (bond math 14.1, the portfolio engine 14.2 and 14.3, the upload checks 11) are now
tested in the API's repository only.

- `npm run dev` is what `npm run dev:api` was: `.env.development` (formerly `.env.api`) forwards
  `/api` and `/hubs` to port 5001 and turns on `VITE_DEV_TOOLS`, which is off in every other mode.
  `/_kit` follows it.
- `npm run e2e` is what `npm run e2e:api` was, on port 5173: one worker, the API's GUIDs always.
  The `@mock` tag is now `@fresh-db` (`E2E_FRESH_DB=1` runs those flows, one spec per fresh
  database). The flow of the missing service worker is gone. The three messaging flows that
  relied on the mock's scripted people still need a second session to play the other person on
  the API.
- The routes of `shared/api/endpoints` are checked against the API's OpenAPI only.
