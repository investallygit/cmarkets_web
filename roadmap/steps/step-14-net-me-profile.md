# Step 14 · NET ME · My profile, visibility and contact (screen 12) (L): done

Step 14 of the [roadmap](../../ROADMAP.md#order), for the
[second version of the spec](../second-version.md).

- **Built**: the three panels of the mockup. My profile: the photo (JPEG or PNG up to 2 MB, sent
  at once), the type and VERIFIED badges, which the user does not change, the name, job title,
  organisation, city and country, languages, about with its count of 600, up to 8 specialties of
  the Admin's list, experience and certifications (each saved on its own), contact details.
  Visibility and contact: Hidden, CMarket members or Public; Direct, Request or No for each of the
  six client types; the work e-mail, phone, online status and, for an Analyst, the publication
  statistics shown or not. The card preview: the card as the directory will show it, changes not
  saved included, seen by each client type, and which types see which button. One SAVE sends the
  profile and its privacy; the title bar says when it was saved, or that changes wait.
- **Shared**: `entities/profile` holds the avatar (photo or initials, circled in the type's
  colour), the type badge, the directory card and its contact button, which NET and MSG will
  reuse; the type colours moved to `shared/config/accountTypes.ts`. A `Switch` joins the form kit
  (and `/_kit`), `format.language` names the languages.
- **Access**: `NET ME` in the command bar and in the user menu; NET joins the left menu with the
  directory (step 15). Three permissions in the matrix, under "Directory and messaging":
  `directory:list`, `directory:profile` and `messages:write`; the six client types have them, the
  Admin browses the directory, the Data admin has none.
- **Mock**: the demo clients' profiles, K. Atangana's that of the mockup, with the 42 notes
  published in the library, their 4.4 and 412 followers; any other client starts from the
  account. The contact rules as pure, tested logic (`lib/contact.ts`: a block first, then the
  employees, a conversation already open, a hidden profile, the rule of the sender's type; Direct
  by default, Request for a Student). The checks of the profile, the privacy and the experiences
  (`lib/profile.ts`); `SEED_VERSION` raised.
- **Since**: the people blocked, with the messaging (step 16); the Admin's default contact rules
  and specialties (step 18).
- **Still to do**: choosing the square of the photo (the mock keeps its centre).
