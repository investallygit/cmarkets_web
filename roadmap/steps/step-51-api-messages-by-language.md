# Step 51 · CMarket.Api's messages in the user's language: to do

Step 51 of the [roadmap](../../ROADMAP.md#order), planned on 18 November 2026 from
[step 50](step-50-page-bug-sweep.md)'s B18, on the user's word.

## Why

CMarket.Api writes its messages in English, about 1,100 of them: the title and detail of each
problem (RFC 7807), the validators' messages by field, the reasons it gives. A page in French
shows them as they come, inside its own French sentence: OPT's "Le scénario ne s'est pas ouvert :
No scenario …", the refusals of RFQ's answer form on B. Ngoma's page, SUBS's "Extend to a day
after 2027-08-09." with a date in ISO among dd/mm/yyyy ones.

## Plan

- CMarket.Api answers in the user's language: the profile's, the browser's before login
  (`Accept-Language`), English otherwise.
- Its messages move to resources in English and French, by area, their dates and figures formatted
  in the language (dd/mm/yyyy, "52 500,25" in French). The notices and e-mails already written in
  the user's language stay so.
- A test lists every message in both languages; a request in French gets its problems in French.
- The web shows the API's words as they come (`problemMessage`); its own sentences around them stay
  translated by the web.
- Checked: CMarket.Api's suites, the web's flows in French on the screens B18 names (OPT, RFQ,
  SUBS, the toasts), axe.
