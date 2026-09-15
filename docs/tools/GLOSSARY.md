# 📖 Glossary

Plain-English definitions of terms used across the tool documentation. If a tutorial uses a
term you don't recognize, check here first.

### General
- **Client-side / local processing** — the work happens on your own device inside your web
  browser. Nothing you type or upload is sent to a remote server.
- **Minify** — squash code/data down by removing all unnecessary spaces and line breaks, to
  make the file smaller.
- **Beautify / Format** — the opposite of minify: add spacing and indentation back in so a
  human can read it.
- **Parse** — read a piece of text and break it down into its structural pieces so a computer
  (or a tool) can understand it.
- **Schema** — a rulebook or blueprint describing what a valid document of a certain type must
  look like.

### Data formats
- **JSON** — JavaScript Object Notation. A lightweight data format using `{}` for objects and
  `[]` for lists, used by almost every modern web API.
- **XML** — a tag-based data format (`<tag>value</tag>`), common in enterprise and legacy
  systems.
- **YAML** — a human-friendly, indentation-based data format, common in DevOps configuration
  (Kubernetes, Docker Compose, CI pipelines).
- **CSV** — Comma-Separated Values, the plain-text format behind spreadsheets.

### Encoding & security
- **Base64** — a way of representing any data using only letters, numbers, and a few symbols,
  so it survives being carried through text-only systems. It is not encryption.
- **Hash** — a fixed-length "fingerprint" of data. The same input always produces the same
  hash, but you cannot reverse a hash back into the original data.
- **JWT (JSON Web Token)** — a compact, signed token (`header.payload.signature`) commonly used
  to represent a logged-in session.
- **OAuth 2.0 / PKCE** — a standard protocol for letting one app securely log a user in via
  another service (like "Sign in with Google"); PKCE is a security add-on for apps that can't
  keep a secret safely (mobile apps, single-page web apps).

### XML world
- **XSD** — XML Schema Definition; the blueprint that says what a valid XML document must
  contain.
- **XPath** — a query language for finding specific data inside an XML document.
- **XSLT** — a language for transforming one XML document into another document.
- **CDATA** — a special XML section that lets you include raw text (even `<` and `&`)
  without escaping it.
- **Namespace** — a prefix system in XML that avoids naming collisions between tags from
  different sources; a common cause of "my XPath matches nothing" bugs.

### EDI world
*(see also the dedicated [EDI Basics primer](edi/00-edi-basics.md))*
- **EDI (Electronic Data Interchange)** — the exchange of business documents between
  companies as strict, standardized text files.
- **X12** — the EDI dialect mostly used in the United States (transaction sets are numbered,
  e.g. 850, 810, 856).
- **EDIFACT** — the international EDI dialect (message types are named, e.g. ORDERS, INVOIC).
- **Segment** — one line/record inside an EDI message (e.g. `BEG`, `N1`, `PO1`).
- **Element** — one individual data field inside a segment.
- **Delimiter** — the character used to separate segments (like `~`) or elements (like `*`)
  in an EDI file.
- **Envelope** — the wrapper segments (ISA/GS/ST ... SE/GE/IEA) that mark the start and end
  of an interchange, functional group, and transaction set.
- **Functional Acknowledgment (997) / CONTRL** — an automatic "receipt" message confirming an
  EDI file was structurally readable (not the same as a business-level approval).
- **Trading partner** — the other company you exchange EDI documents with.
- **AS2** — a secure internet protocol for transmitting EDI files directly between companies,
  with encryption, digital signatures, and delivery receipts.
- **MDN (Message Disposition Notification)** — the AS2 delivery receipt confirming a message
  arrived (and whether it was processed successfully).
- **PHI (Protected Health Information)** — real patient data (name, birth date, medical
  record info) that must be handled carefully under healthcare privacy law (HIPAA).
- **GS1-128 / SSCC-18** — global barcode standards for shipping labels; the SSCC-18 is an
  18-digit number that uniquely identifies one specific shipment or pallet.

### Scheduling & identifiers
- **Cron expression** — a compact syntax (`0 9 * * 1-5`) for describing a recurring schedule.
- **UUID** — a 36-character random identifier that's essentially guaranteed to be unique
  without any central coordination.
- **Unix timestamp** — the number of seconds (or milliseconds) since January 1, 1970, used
  internally by most computer systems to represent a date/time.
