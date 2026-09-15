# 📦 EDI Semantic Diff & Compare

> Compare two ANSI X12 or EDIFACT documents side-by-side or unified with loop alignment, element-level mutation highlights, and volatile envelope ignoring.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/edi-diff-compare` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

A specialized diff for EDI messages that understands their structure, not just raw text lines: it aligns segments by their meaning (like matching up the same `PO1` line item across two versions even if it moved position), automatically ignores "volatile" noise fields that always change between messages (control numbers, timestamps), and highlights only the segments and elements that meaningfully changed.

## 🙋 Who is this for, and when do I need it?

- You're debugging why a re-sent EDI message is being treated as different from the original by a partner's system.
- You want to compare two versions of a purchase order (like an original vs. a change order) and see exactly what changed in the business data, not just the changed control numbers.

## ✨ What it can do

- Aligns two EDI messages by semantic meaning (e.g. matching the same PO1 line item even if it moved).
- Automatically masks volatile, always-changing fields (control numbers, dates/timestamps) so they don't create false differences.
- Highlights only genuinely modified, added, or removed segments and elements.
- Includes preloaded sample message pairs to try the comparison instantly.

## 📝 Step-by-step: how to use the EDI Semantic Diff & Compare

1. Paste your first EDI message (Doc A) and the message you want to compare it to (Doc B).
2. Run the comparison — the tool auto-aligns segments and masks volatile fields.
3. Review the highlighted differences: added, removed, and modified segments/elements.
4. Use the quick 'swap A/B' button to compare in the other direction if needed.

### 💡 Worked example

**Scenario:** Comparing an original PO and a corrected version:

**You paste in:**
```
Doc A: PO1*1*10*EA*25.00  |  Doc B: PO1*1*12*EA*25.00 (quantity changed from 10 to 12)
```

**You get back:**
```
PO1 segment flagged as modified: element 2 (quantity) changed 10 → 12. Control numbers and dates are automatically masked/ignored as non-meaningful.
```

## ⚠️ Common mistakes & troubleshooting

- A plain text diff of two EDI messages (like the general Diff Checker tool) would flag every line as changed just because control numbers differ — use this EDI-specific diff instead when comparing real transaction content.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## 🔗 Also searchable as

`edi diff`, `edi compare`, `x12 diff`, `compare edi`, `semantic diff`, `edi version compare`, `850 revision compare`, `element diff`, `edi revision`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
