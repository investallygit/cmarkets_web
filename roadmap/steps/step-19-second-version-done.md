# Step 19 · Second version done (S): done

Step 19 of the [roadmap](../../ROADMAP.md#order), for the
[second version of the spec](../second-version.md).

- **Checked**: axe-core (WCAG 2.2 AA) on NET, a profile in NET, NET ME and MSG, with their
  dialogs, for each of the six client types, a client waiting for approval and the French texts;
  the screens a Data admin or an Admin may not open; MOD, ADMCFG, USER and AUDT; the public
  profile page. axe finds nothing at 1600, 390 and 320 px, and no page scrolls sideways. From the
  keyboard: Tab reaches every control of the new screens, the focus always shows and never sticks,
  and each dialog keeps it, closes on Escape and gives it back. Every Playwright flow passes; no
  file is over 700 lines.
- **Checked again**: every screen of both versions for each account type, the client waiting for
  approval, a client, the Data admin and the Admin in French, and the visitor, at 1600, 390 and
  320 px; the dialogs of the first version's screens at 1600 and 320 px. axe finds nothing, no
  page scrolls sideways, no column of a table is under 44 px, no translation key shows and the
  console has no error. The last four faults below were found then.
- **Fixed**:
  - A profile's latest publications in NET were links 18 px high, too close for 24 px targets
    (WCAG 2.5.8): 24 px now.
  - A dialog shown while some state holds (Leave the group, Delete a message, Remove a specialty)
    left the focus on the page once Escape closed it: `Dialog` now gives the focus back to the
    control that opened it when it leaves the page open, unless the action moved the focus or took
    the control away.
  - In a narrow window the columns given as a share of the width shrank to a few pixels (USER,
    whose sort buttons then overlapped, EQS, PORT, ALRT, CAL, CFG, IMP, HIST, CORR, NEWS, EODH,
    ANLY, PAY, AUDT): such a column now keeps 56 px (`columnTrack`), more for the columns of USER
    and the line items of the statements and ratios, and the table scrolls sideways in its panel
    instead. On a desktop only the invoices of CFG, cramped at 1280 px, scroll.
  - MSG cut the names of the conversations at 320 px ("R. …"): the badge goes below the name, the
    time stays on its right.
  - The figures of the bond calculator (YCRV, YAS) scroll in a short panel with nothing in them to
    focus, so the keyboard could not scroll them at 390 px (WCAG 2.1.1): they take the focus, as
    `ScrollArea` does.
  - The choices of a title bar (`PanelSelect`: the countries and instruments of the auctions in
    CAL, the transactions of PORT) were 14 px high, too close together at 320 px (WCAG 2.5.8):
    24 px now, as tall as the bar.
  - The countries of the yield curves' legend (YCRV, YAS) were 16 px high, too close together in
    French at 320 px (WCAG 2.5.8): 24 px now, in a legend as tall as before.
  - The public page of a profile that is not public, or no longer exists, took the directory's
    title: it is titled with what it says.
- **Added**: a Playwright flow from the keyboard alone (NET from the command bar, a profile found,
  Send a message, two lines sent with Enter, a dialog closed with Escape) and the titles of NET,
  MSG, NET ME and the public page.
- **Documentation**: the README (the directory and the messaging in the introduction and the mock,
  `ui-kit` among the pages, the shared components added) and this roadmap, each screen with the
  steps that built it.
