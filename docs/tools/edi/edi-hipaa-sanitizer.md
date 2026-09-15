# 📦 EDI HIPAA De-Identifier & PHI Sanitizer

> 100% client-side HIPAA Safe Harbor (45 CFR § 164.514(b)) de-identifier to mask patient names, SSNs, member IDs, DOBs, and addresses in 837/835/270 transactions with audit logging.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/edi-hipaa-sanitizer` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

Healthcare EDI transactions (like an 834 enrollment file or 837 claim) contain real Protected Health Information (PHI) — patient names, birth dates, member IDs, SSNs, addresses. This tool automatically finds those specific fields in a message and replaces them with realistic but fake substitute values, following the HIPAA Safe Harbor de-identification standard (45 CFR § 164.514(b)) — so you can safely share, test with, or store the file without exposing real patient data.

## 🙋 Who is this for, and when do I need it?

- You need to share a real production EDI healthcare file with a QA team, a vendor, or a support ticket, without exposing real patient information.
- You're building test fixtures from real transaction shapes but need them scrubbed of any actual PHI before they can live in a shared repository.

## ✨ What it can do

- Detects and replaces PHI fields following the HIPAA Safe Harbor standard (45 CFR § 164.514(b)).
- Individually toggleable rules: patient/subscriber names, birth dates, addresses, member IDs, claim IDs, provider NPIs, and contact info (phone/email).
- Replaces real values with realistic synthetic substitutes, preserving the message's structure.
- Includes preloaded sample HIPAA transactions (834, 837) to try the tool safely.

## 📝 Step-by-step: how to use the EDI HIPAA De-Identifier & PHI Sanitizer

1. Paste a real or sample healthcare EDI transaction (e.g. 834 enrollment or 837 claim).
2. Review and toggle on every PHI category relevant to your file (names, DOB, addresses, IDs, NPIs, contacts).
3. Run the sanitizer and review the de-identified output next to the original.
4. Copy or download the sanitized file for safe sharing, testing, or storage.

### 💡 Worked example

**Scenario:** Sanitizing a segment containing a patient's real name and date of birth:

**You paste in:**
```
NM1*IL*1*SMITH*JOHN*A~DMG*D8*19850101
```

**You get back:**
```
NM1*IL*1*DOE*JANE*X~DMG*D8*19850101  (name replaced with a synthetic name; a safe static test DOB is used consistently)
```

## ⚠️ Common mistakes & troubleshooting

- Always review the specific toggles (patient names, DOB, addresses, member IDs, claim IDs, provider NPIs, contact info) to make sure every category relevant to your file is switched on — an off-by-default toggle could leave a PHI field untouched.
- This tool is a strong first pass, but for anything going into a regulated production audit, have a compliance/privacy officer confirm the sanitized output meets your organization's specific policy before wider distribution.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## 🔗 Also searchable as

`hipaa edi`, `edi de-identifier`, `phi sanitizer`, `anonymize 837`, `835 de-identification`, `hipaa safe harbor`, `mask edi`, `healthcare edi privacy`, `edi compliance audit`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
