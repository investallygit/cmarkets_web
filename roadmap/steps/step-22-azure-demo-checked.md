# Step 22 · The Azure demo checked (M): done

Step 22 of the [roadmap](../../ROADMAP.md#order).

Since 9 November 2026 the site runs on Azure Static Web Apps and `CMarket.Api` on an App Service,
on a shared Azure SQL database. A read-only check of every screen of every account type, and of
every GET of the API, found:

- **Logged out every 15 minutes**, on a reload and on a new tab: the site and the API are two
  sites, so browsers dropped the `SameSite=Strict` refresh cookie. The API's deployment now sets
  it `SameSite=None` and `Partitioned` (its ADR-041); Safari may still log out, until the site
  and the API share a domain.
- **Documents, message files and sign-up documents answered 404 and 410**: the shared database
  had been seeded from a developer's machine, which kept the files. The API now writes the demo's
  missing files again at start-up.
- **The indices never moved in real time**: the hub sends IndexUpdated to the connections that
  follow the index, and nothing followed one. `IndicesPanel`, `IndexChartPanel`, `TickerTape`
  and `PortfolioHeader` (its benchmark) now subscribe their index codes; the smoke flow checks
  that the first index moves.
- The API's development tools were open on Azure (off now), SignalR ran without web sockets
  (on now, with HTTP/2), and the site's hashed files were kept 30 seconds only: one year now
  (`public/staticwebapp.config.json`), which also keeps other sites from framing the site.

Left to do on Azure: the API runs in West US 3 and its database in France Central, so every query
crosses the Atlantic (1.5 to 3 s for the heavier reads); the App Service belongs in France Central.
