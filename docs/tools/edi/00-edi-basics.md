# 📦 EDI Basics — start here before the individual tool pages

If you're new to EDI, read this once. Every tool page in this `edi/` folder assumes you
already know the handful of ideas explained below.

## What is EDI, really?

**EDI (Electronic Data Interchange)** is how large companies send each other everyday
business documents — purchase orders, invoices, shipping notices, insurance enrollments —
as strict, computer-readable text files, instead of PDFs, emails, or phone calls.

Two companies agree in advance on an exact format ("if you're going to send me a purchase
order, it must look exactly like *this*"), so both sides' computers can read the file
automatically with zero human re-typing. EDI has existed since the 1970s and still moves
the vast majority of the world's retail, logistics, healthcare, and supply-chain data today.

## The two main "dialects": X12 and EDIFACT

- **ANSI ASC X12** — the dialect used mostly in the United States. Documents ("transaction
  sets") are numbered, e.g. **850** = Purchase Order, **810** = Invoice, **856** = Advance
  Ship Notice (ASN), **855** = PO Acknowledgment, **834** = Benefit Enrollment, **837** =
  Healthcare Claim, **997** = Functional Acknowledgment (a "receipt").
- **EDIFACT** — the international dialect (common in Europe and global trade), with similarly
  named message types like **ORDERS**, **INVOIC**, **DESADV**, and **CONTRL** (its version of
  a receipt).

CodePackr's EDI tools support both, and you'll see both names throughout the tool pages.

## The envelope: how one message is wrapped

Every X12 file is wrapped in three nested "envelopes," like a letter inside an envelope
inside a mailbag:

```
ISA  ← Interchange envelope (who is sending, who is receiving, when)
  GS  ← Functional Group envelope (groups messages of the same type, e.g. all POs)
    ST  ← Transaction Set (one actual document, e.g. one Purchase Order)
      BEG, N1, PO1, ... ← the segments that hold the actual business data
    SE  ← closes the Transaction Set
  GE  ← closes the Functional Group
IEA  ← closes the Interchange
```

Each of those all-caps codes (ISA, GS, ST, BEG, N1, PO1, SE, GE, IEA) is called a
**segment**. Every segment is made of **elements** — the individual data fields — separated
by a character like `*`, and segments themselves are separated by a character like `~` or a
newline. Those separator characters are called **delimiters**, and they can differ from one
trading partner to another (see the **EDI Delimiter Swapper**).

## Why EDI text looks so unreadable

A raw EDI file is usually one dense, unbroken line, e.g.:

```
ISA*00*          *00*          *ZZ*SENDERID *ZZ*RECEIVERID*260301*1200*U*00401*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260301*1200*1*X*004010~ST*850*0001~BEG*00*NE*PO123456**20260301~SE*3*0001~GE*1*1~IEA*1*000000001~
```

That's exactly what the **EDI X12 Formatter** and **EDI Segment Viewer** tools are for —
they break this into readable, labeled lines.

## The workflow a real order usually goes through

1. Buyer sends an **850** (Purchase Order).
2. Seller's system sends back a **997** (a receipt confirming the file was structurally
   readable) and often an **855** (a business-level acknowledgment: "yes, we accept this order").
3. Seller ships the goods and sends an **856** (Advance Ship Notice) describing what's in
   the shipment.
4. Seller sends an **810** (Invoice) to request payment.

The **EDI Order Lifecycle Reconciliation** tool is built to visualize exactly this chain, and
flag when something doesn't line up (e.g. invoiced quantity ≠ shipped quantity).

## How messages actually get delivered

Historically, companies exchanged EDI files through **VANs** (Value-Added Networks) or
directly over **AS2** — a secure internet protocol with digital signatures, encryption, and
delivery receipts called **MDNs** (Message Disposition Notifications). See the **AS2 Tools**
page for more.

## A note on healthcare EDI (834/837) and privacy

Healthcare-related EDI transactions carry real patient data (PHI — Protected Health
Information). If you're working with real 834/837 files outside of production, always run
them through the **EDI HIPAA De-Identifier & PHI Sanitizer** first.

## Glossary shortcuts

See the shared [Glossary](../GLOSSARY.md) for quick definitions of X12, EDIFACT, ISA, GS, ST,
segment, element, delimiter, functional acknowledgment (997/CONTRL), AS2, MDN, GS1-128, and
SSCC-18.

---

## The EDI tools, in the order you'd typically use them

| # | Tool | What it does |
|---|------|---------------|
| 1 | [EDI Message Gateway & Analyzer](edi-message-gateway.md) | The all-in-one inbound/outbound workspace |
| 2 | [EDI X12 Formatter](edi-formatter.md) | Makes a raw message readable |
| 3 | [EDI Segment Viewer](edi-segment-viewer.md) | Labels each segment in plain English |
| 4 | [EDI Hierarchical Schema Viewer & Element Lookup](edi-schema-viewer.md) | Looks up what a code/segment means |
| 5 | [EDI Syntax & Envelope Validator](edi-validator.md) | Checks a message is structurally correct |
| 6 | [EDI to JSON Converter](edi-to-json.md) | EDI → JSON |
| 7 | [JSON to EDI Converter](json-to-edi.md) | JSON → EDI |
| 8 | [EDI to CSV & CSV to EDI Converter](edi-csv-converter.md) | EDI ⇄ spreadsheet table |
| 9 | [EDI Template & Sample Generator](edi-sample-generator.md) | Generates realistic sample messages |
| 10 | [EDI Delimiter Swapper & Normalizer](edi-delimiter-converter.md) | Changes segment/element separators |
| 11 | [EDI 997 & CONTRL Ack Generator](edi-997-generator.md) | Generates the "receipt" message |
| 12 | [EDI Batch Splitter & Joiner](edi-batch-splitter.md) | Splits/joins multi-transaction files |
| 13 | [EDI Semantic Diff & Compare](edi-diff-compare.md) | Compares two EDI messages meaningfully |
| 14 | [EDI Order Lifecycle Reconciliation](edi-lifecycle-reconciliation.md) | Tracks an order across 850→856→810 |
| 15 | [EDI HIPAA De-Identifier & PHI Sanitizer](edi-hipaa-sanitizer.md) | Scrubs real patient data |
| 16 | [AS2 Message Encoder, Decoder & MDN Generator](as2-tools.md) | Secure transmission format |
| 17 | [GS1-128 / SSCC-18 Label Generator](gs1-sscc-label-generator.md) | Shipping label barcodes |
