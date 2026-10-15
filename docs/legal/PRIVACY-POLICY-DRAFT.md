# BloomType privacy policy (draft)

> ## ⚠️ DRAFT — not in force. Needs legal review before publishing.
>
> This is a public-facing draft built **only** from [`docs/school/PRIVACY-SUMMARY.md`](../school/PRIVACY-SUMMARY.md), [`docs/PRIVACY-OPERATIONS.md`](../PRIVACY-OPERATIONS.md), [`docs/school/IT-SECURITY-SUMMARY.md`](../school/IT-SECURITY-SUMMARY.md), [`docs/pilot/PILOT-SURVEY.md`](../pilot/PILOT-SURVEY.md) and the public pages. It does not add any practice those documents do not describe. Where they are silent, it says `[OWNER/LEGAL: …]`. It is **not** a legal opinion and **not** a claim of compliance with any law. A privacy lawyer must review it before it is published. See [README.md](README.md).

**Last updated:** `[OWNER/LEGAL: date this policy takes effect]`

## The short version

- **No accounts for children, no ads, no tracking.** Children play without signing up.
- **Progress stays on the device.** In the public version, a child's game progress and the other gameplay data the game saves are kept in that browser only. They are not sent to BloomType, Ashbi Design or anyone else. (Loading the website still sends ordinary web requests to our server; see [section 5](#5-information-we-may-receive-in-other-ways).)
- **No AI talks to children.** The pictures, sounds and voices were made once, in advance, and ship with the game.
- **You stay in control.** Progress can be downloaded or deleted from the Profile screen at any time.
- **Cloud features are switched off.** They will only be switched on for a school after a signed data-privacy agreement and the other approvals listed below.

## 1. Who we are

BloomType is a typing game for children in grades 2 to 6, made by Ashbi Design in Toronto, Ontario, Canada.

- Legal business name: `[OWNER/LEGAL: legal business name]`
- Mailing address: `[OWNER/LEGAL: business mailing address]`
- Privacy contact: cameron@ashbi.ca
- Person responsible for privacy (privacy officer): `[OWNER/LEGAL: name and title; PIPEDA requires a designated person, and Quebec Law 25 requires the title and contact details to be published]`

## 2. Who this policy is for

This policy is for parents, guardians, teachers, schools and school boards. It explains what BloomType saves, where, and how you control it. Children use BloomType under an adult's supervision (see our [terms of service draft](TERMS-OF-SERVICE-DRAFT.md)).

## 3. What is saved, and where

In the public version, everything below is stored in the browser's **local storage** on the device the child uses. **It is not sent to us.** This covers the data the game saves; it does not cover the ordinary web requests a browser makes to load the site (see section 5).

| What | Why | Where |
|---|---|---|
| Display name the child types (a first name or nickname) | Shows on the profile, the teacher roster and the parent page | This browser |
| Avatar picture choice | Shows the child's pet | This browser |
| A random player ID (a UUID the game makes the first time it saves) | Tells apart two children with the same name on one device, and links a child to the classes they joined. It is stored in the active profile and in the profile copy the teacher and parent pages read. It is not shown to the child and does not contain any personal details. | This browser |
| Levels completed, stars, words typed, best speed and accuracy per level | Progress and rewards | This browser |
| Which keys are hard and which are learned | Picks practice words | This browser |
| Minutes practised per day | Parent page, teacher report and homeschool record | This browser |
| Garden flowers and Field Guide cards found | Rewards | This browser |
| Class code (only if a teacher gives one) | Groups students for the teacher page on the same device | This browser |
| Teacher's classes, assignments and spelling words | Teacher tools | The teacher's browser |
| Language, sound and voice settings | Preferences | This browser |
| Pilot survey answers (only if a grown-up chooses to fill it in) | Pilot feedback | The grown-up's browser |
| Teacher PIN and grown-up lock PIN (stored only as a scrambled, salted hash), plus a count of wrong tries | Keeps the teacher page and profile settings locked | That browser |

Because this data stays on the device, **anyone who can use that device and browser may be able to see it.** The teacher page has a PIN, and the profile screen has a grown-up lock, to help.

### Save codes

A child can copy a **save code** from the Profile screen to carry progress to another device. The code holds only level, star, word, pet, avatar, language and a few weak-key details. It holds **no name and no identifiers**. It is made and read on the device; it is not sent to us. Whoever has the code can restore that progress, so keep it like a library card.

## 4. What BloomType never collects

BloomType does **not** ask for or collect: email addresses, birth dates, home addresses, phone numbers, photos, voice recordings, precise location, contacts, advertising IDs, or anything typed outside the game's word lists.

There are **no third-party analytics, advertising or tracking scripts**, and no behavioural profiling. We do not sell data. The app loads nothing from other websites (no outside fonts, CDNs, analytics or ads).

`[OWNER/LEGAL: the docs do not say whether BloomType sets any cookies. The app uses browser local storage and a service worker for offline use. Confirm "no cookies" (or list any) before publishing.]`

## 5. Information we may receive in other ways

The game itself sends no student data to us. We may still receive some information in these ways:

- **Website visits.** BloomType is served from our web server at `bloomtype.ashbi.ca`. Like most web servers, it may record technical details of each request (such as IP address, time and page requested). `[OWNER/LEGAL: the docs are silent on web-server logging. Confirm what the server logs, why, where the server is located, who hosts it, and how long logs are kept.]`
- **Emails you send us.** If you email us (for example to ask about a pilot or privacy), we receive your email address and what you write. The website does not collect or log email addresses itself; its pilot link opens your own email app. `[OWNER/LEGAL: state how long emails are kept and who can read them.]`
- **Pilot feedback you choose to send.** Teachers and parents may fill in an optional pilot survey. It is saved only in their browser. It reaches us only if they copy or download it and send it to us themselves. The export has no names, class codes, device or profile IDs, emails or time of day. A pilot summary that teachers can export holds class-level numbers only. Please do not write children's names in the comment box. `[OWNER/LEGAL: state how long pilot feedback is kept and how it may be used, for example in a published pilot report.]`
- **School orders.** When a school asks for a quote or buys a plan, we receive the school's name, contact names, work emails, addresses and purchase-order details. This is adult business information, not student data. `[OWNER/LEGAL: state the retention period for business and tax records.]`

## 6. Your choices: download and delete

- **Delete one child (game or parent):** Profile → *Delete local progress*. This removes the **current** child's profile (including their settings and player ID), their saved profile copies and their class memberships from that browser. It does not remove other children's profiles on the same device, the teacher's classes, any PINs, or pilot survey answers. The parent page points to this same Profile action; it has no separate delete button.
- **Download:** Profile → *Download local progress* saves the child's data as a file.
- **Teachers (*Clear All*):** the teacher page can export a class report (CSV) and clear student data on that device. *Clear All* removes every player profile and profile copy, every class roster record, and the teacher's class list (classes, assignments and spelling words). It does **not** remove the pilot survey answers, the teacher PIN and grown-up lock PIN records, or the wrong-try counters.
- **Pilot survey:** *Delete my answers* removes saved survey answers.
- **Remove everything:** clear the browser's site data (cookies and site data / storage) for `bloomtype.ashbi.ca`. This deletes all BloomType data in that browser, including PINs, pilot answers and the offline copy of the app.

Because we do not hold a copy of the data in the public version, **we cannot see, correct or delete it for you, and we cannot recover it once deleted.** You do this yourself on the device. If you have a question or need help, email cameron@ashbi.ca.

## 7. Optional school cloud features (switched off)

A school version with cloud class sync is built but **turned off**. The public website does not include the cloud code; a build check stops any release that contains it.

It will only be switched on for a school **after**:

1. a signed data-privacy agreement (DPA) with that school or school board;
2. parent notice and consent where the law requires it;
3. a retention and deletion schedule;
4. security checks on the hosted database;

and after we have recorded and approved the lawful basis and consent process, who is controller and processor, the incident contact and notification timeline, the database region and administrators, a tested access/export/deletion drill, and a test proving that one class or student cannot see another's data.

**When it is on, for that school only:**

- Students still never make an account or type an email. Each device signs in anonymously.
- **Student data** stored can include the player ID, a display name, avatar, scores, lesson progress, achievements, garden state, weak-key practice state, class code and session performance (level, score, words typed, combos). It must not include email, birth date, address, advertising identifiers, free-form student content or precise location.
- **Linked devices:** which anonymous device IDs belong to the same student, so a teacher sees one student.
- **Imported rosters:** if a teacher imports a class list (from Google Classroom or a CSV file; ClassLink and Clever later), we store, for each student, the roster provider, the provider's opaque student ID and the display name. No email, birth date or photo. This lets the teacher dashboard match imported names to students who joined with the class code.
- **Teacher accounts:** teachers sign in with Google. Our sign-in provider receives the teacher's Google account ID, name and email address so the teacher can sign in, and we store the teacher's account ID, display name, role (teacher or admin) and school. Teachers' classes are stored with a class name, class code and, if imported, the roster provider and its class ID. `[OWNER/LEGAL: confirm exactly which Google profile fields and Classroom permissions are requested, and how long Google access tokens are kept.]`
- **Schools and staff invites:** a school record holds the school name. A school admin can invite staff by school email; we store the invited email, the school, the role, who sent the invite (their account ID) and when. Only adult staff emails are stored; children never have invites.
- A child who uses two devices can link them with a 12-character link code. The code works for 14 days, and the server stores only a scrambled (hashed) copy.
- Database rules let a student see only their own data, a teacher see only the classes they own, and a school admin see only their own school's teachers and invites.
- The profile screen offers a cloud export (only that student's own data) and a confirmed cloud deletion.
- Hosting in Canada is planned for Canadian school boards. `[OWNER/LEGAL: confirm the region once the Supabase project exists (#133), and list Supabase (and any other provider) as a service provider.]`
- Encrypted daily backups are kept for 30 days by default. `[OWNER/LEGAL: confirm backup retention in the retention policy (#132).]`
- The school's DPA controls how this data is used, kept and deleted. In general the school decides and we act on its instructions. `[OWNER/LEGAL: confirm the controller/processor (or "service provider") roles.]`
- Class data is deleted on the school's request, or on the retention schedule. `[OWNER/LEGAL: the retention policy is still to be written (#132); the pricing doc proposes deletion within 90 days of the term ending.]`

## 8. Security

- BloomType is served only over HTTPS.
- Its Content-Security-Policy allows content only from BloomType itself, and blocks camera, microphone and location.
- The teacher page is protected by a hashed PIN with a lock-out after repeated wrong tries.
- Each change is checked by automated tests, including a check that the public build has no cloud code.
- We have a written incident plan that covers data breaches, including telling schools and regulators.

No system is perfectly secure. Data on a device is only as safe as that device. `[OWNER/LEGAL: confirm the breach-notification promise and timeline to schools, families and regulators.]`

## 9. Children's privacy

BloomType is designed for children and is built to collect as little as possible. Children cannot make an account, are never asked for an email, and cannot chat with or share content with other students.

`[OWNER/LEGAL: add the specific statements each law below requires once the lawyer confirms which apply.]`

## 10. Laws and how they apply

BloomType is **designed** to make approval easy under the laws below. **This is a design goal, not a legal opinion or certification.** `[OWNER/LEGAL: confirm every statement in this section.]`

### Canada: PIPEDA

The *Personal Information Protection and Electronic Documents Act* (PIPEDA) applies to personal information a business collects in commercial activity. In the public version we do not collect children's game data at all, because it stays on the device. For information we do receive (emails, pilot feedback sent to us, school order details), we follow PIPEDA's principles: we collect only what we need, use it only for the reason given, keep it safe, and let people ask to see or correct it. `[OWNER/LEGAL: confirm, add the right to complain to the Office of the Privacy Commissioner of Canada, and name the privacy officer.]`

### Ontario schools: MFIPPA and Bill 194

Ontario school boards are covered by the *Municipal Freedom of Information and Protection of Privacy Act* (MFIPPA), and by the *Strengthening Cyber Security and Building Trust in the Public Sector Act, 2024* (Bill 194). Student records a school creates with BloomType's cloud features stay under the school board's control. Before cloud features are used, the board and we sign a DPA. Local-first use keeps student data on the board's own devices. `[OWNER/LEGAL: confirm how BloomType fits a board's privacy impact assessment and Bill 194 duties.]`

### Quebec: Law 25

Quebec's *Act respecting the protection of personal information in the private sector*, as amended by Law 25, has extra rules, including a published privacy officer, privacy impact assessments before sending data outside Quebec, and consent rules for children under 14. Quebec public schools are covered by separate public-sector law. `[OWNER/LEGAL: decide whether Quebec users are in scope, whether a French version of this policy is required, and what changes cloud features would need for Quebec schools.]`

### United States: COPPA

The *Children's Online Privacy Protection Act* (COPPA) covers online services that collect personal information from children under 13. In the public version, BloomType does not collect personal information from children: progress stays on the device. If cloud features are used in a US school, the school may give consent for educational use only, under a DPA, and parents may ask the school to review or delete their child's information. `[OWNER/LEGAL: confirm COPPA analysis, including the 2025 COPPA Rule amendments, and whether iKeepSafe or another COPPA safe-harbor certification is planned.]`

### United States: FERPA and state student-privacy laws

The *Family Educational Rights and Privacy Act* (FERPA) protects student education records held by US schools. When a US school uses BloomType's cloud features, we would act as a "school official" under the school's direct control, using student data only for the school's purposes, as set out in the DPA. Many states have their own student-privacy laws; we plan to sign the SDPC National Data Privacy Agreement. `[OWNER/LEGAL: confirm, and list any state-specific terms (for example California SOPIPA, New York Education Law 2-d).]`

### Other places

BloomType is also designed with GDPR-K and the UK Children's Code in mind. `[OWNER/LEGAL: decide whether users outside Canada and the US are in scope, and add any required statements.]`

## 11. Where data is stored

- **Public version:** on the device the child uses.
- **Our web server:** `[OWNER/LEGAL: hosting provider and country of the VPS.]`
- **Cloud features (when on):** planned Canadian hosting for Canadian boards. `[OWNER/LEGAL: confirm region and any transfers outside Canada.]`

## 12. Sharing

We do not sell, rent or trade personal information. We do not share it for advertising. In the public version there is no student data on our side to share.

`[OWNER/LEGAL: list any service providers who may handle the information in section 5 (email provider, web host, accountant), and the cases where law requires disclosure.]`

## 13. Keeping information

- **On the device:** kept until you delete it or clear the browser's site data.
- **Information we receive:** `[OWNER/LEGAL: retention periods for emails, pilot feedback and business records.]`
- **Cloud features:** under the school's DPA and our retention policy `[OWNER/LEGAL: link once written (#132)]`.

## 14. Your rights

Depending on where you live, you may have the right to ask what personal information we hold about you or your child, to correct it, to delete it, or to withdraw consent. For data on the device, you can do this yourself (section 6). For anything else, email cameron@ashbi.ca. `[OWNER/LEGAL: state the response time, how we check identity, and how to complain to a regulator.]`

## 15. Changes to this policy

If we change this policy, we will update the "Last updated" date. We will not start collecting new kinds of children's data without updating this policy first and, where the law requires, getting consent. `[OWNER/LEGAL: confirm how schools and families are notified of material changes.]`

## 16. Contact

Privacy questions or requests: cameron@ashbi.ca

Mail: `[OWNER/LEGAL: business mailing address]`
