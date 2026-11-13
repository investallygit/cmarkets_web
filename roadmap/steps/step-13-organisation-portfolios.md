# Step 13 · Portfolios of the organisation (M): done

Step 13 of the [roadmap](../../ROADMAP.md#order), for the
[second version of the spec](../second-version.md).

- **Sharing**: the settings of a portfolio held by a member of an organisation have "Share with
  Asset manager A", sent as `sharedWithOrganization` with `POST /portfolios` and
  `PUT /portfolios/{id}` (the spec names no endpoint: open question). `GET /portfolios` lists the
  user's portfolios, then those colleagues share, each with `sharedBy`, the colleague who holds
  it: every member who reads portfolios gets them, a CEO among them, who holds none. The owner
  sees SHARED next to the name; the others "Shared by P. Owona" and READ ONLY, and the selector
  lists them under "Shared with the organisation".
- **Read only**: on a colleague's portfolio, PORT has no new transaction, import, correction,
  settings, deletion, limit change or report: no Reports tab, no report link under the income.
  The panels ask `usePortfolioAccess` (`features/manage-portfolios`); the server answers 403 to
  every write and to a report. The quota counts the user's own portfolios only.
- **Approval**: a member whose status waits for an Admin, or was declined, reads none of the
  organisation's portfolios; a CEO's PORT says why.
- **Alerts**: a portfolio limit alert may watch a portfolio the user reads, as a CEO watches the
  organisation's fund. An account type without portfolios (a Journalist) is offered no portfolio
  alert, the server refuses one, and its sample alerts have none.
- **Mock**: each user's portfolios are read for a colleague too (`usersStore`, `db/session.ts`);
  P. Owona shares the sample fund with Asset manager A. A demo user's sample portfolios keep
  their short ids (`/port/portfolio-cemac`); another user's carry the user's id, since a
  colleague's are listed beside one's own. `SEED_VERSION` raised.
- **CMarket.Api**: the two fields, the colleagues' read access and the 403 on their writes (its
  phase 13).
