import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Table,
  Lightbulb,
  AlertTriangle,
  FileText,
  Workflow,
  X,
} from 'lucide-react';

export interface EdiTutorial {
  toolId: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  overview: string;
  steps: {
    stepNumber: number;
    title: string;
    description: string;
    details?: string[];
    proTip?: string;
  }[];
  keySegments: {
    tag: string;
    name: string;
    usage: 'Mandatory' | 'Optional' | 'Conditional';
    description: string;
    example: string;
  }[];
  businessScenario: {
    domain: string;
    scenario: string;
    tradingPartners: string;
  };
  commonPitfalls: {
    error: string;
    fix: string;
  }[];
  sampleData?: string;
}

export const EDI_TUTORIALS: Record<string, EdiTutorial> = {
  'edi-message-gateway': {
    toolId: 'edi-message-gateway',
    title: 'Inbound & Outbound Integration Gateway Tutorial',
    category: 'B2B Enterprise Integration',
    difficulty: 'Advanced',
    duration: '4 min',
    overview:
      'Master the bi-directional enterprise EDI pipeline. Process inbound transactions (EDI/AS2 ➔ Envelope Verification ➔ Canonical Model ➔ ERP JSON/XML + Auto 997 & MDN) and reverse outbound transactions (ERP Data ➔ Canonical Model ➔ EDI 850/810 Synthesis ➔ AS2 Packaging).',
    steps: [
      {
        stepNumber: 1,
        title: 'Select Integration Direction & Business Scenario Preset',
        description:
          'Choose between Inbound Gateway (Partner EDI to ERP) and Outbound Dispatch (ERP business data to partner EDI), or use the instant Swap button to toggle between flows.',
        details: [
          'Inbound Mode: Select from business presets across Retail (850/860), Warehousing (944), Logistics (214), Healthcare (837 Claim), International (EDIFACT ORDERS), or AS2 S/MIME Envelopes.',
          'Outbound Mode: Accepts canonical ERP JSON for Invoices (810), Ship Notices (856), Catalog (888), or Stock Advice (943) and synthesizes valid ANSI X12 or UN/EDIFACT streams.',
          'Swap Pipeline: Click the "Swap" button in the top toolbar to transfer in-memory canonical data into Outbound synthesis, or transfer synthesized EDI into Inbound ingestion for full loopback verification.',
        ],
        proTip: 'Use the "Randomize Numbers" button to generate fresh ISA13, GS06, and ST02 control numbers with synchronized timestamps on demand.',
      },
      {
        stepNumber: 2,
        title: 'Choose Transport Gateway & Ingest Payload',
        description:
          'Select your protocol (Browser Paste/Upload, AS2 S/MIME container, or simulated SFTP/HTTPS/VAN).',
        details: [
          'For AS2 messages: The gateway strips HTTP/MIME wrappers, decrypts/verifies simulated S/MIME payloads, and prepares an automated synchronous MDN receipt.',
          'For raw X12 or EDIFACT: The parser identifies delimiters dynamically from the 106-character ISA or UNB header, with optional manual overrides in Expert Mode.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Configure Schema & Normalization Mode',
        description:
          'Decide between Zero-Dependency No-Schema AST mode or custom BizTalk/XSD Schema validation.',
        details: [
          'No-Schema mode parses tags and loops automatically using smart semantic inference.',
          'Schema mode enforces strict cardinality, data-type lengths, and structural validation.',
        ],
        proTip: 'No-Schema mode is best for quick inspection without downloading large proprietary XSD files.',
      },
      {
        stepNumber: 4,
        title: 'Inspect Validation & Pipeline Stages',
        description:
          'Click through the 9-stage pipeline breakdown to review envelope integrity, control numbers, line items, and schema compliance.',
        details: [
          'Audit envelope control numbers: ISA13 must equal IEA02, GS06 must equal GE02, ST02 must equal SE02.',
          'Verify segment counts: SE01 declared count is checked against actual segment count.',
        ],
      },
      {
        stepNumber: 5,
        title: 'Export Target ERP Output & Acknowledgments',
        description:
          'Download the generated business output (JSON, XML, CSV, or Delimited) and download the auto-generated 997 Functional Ack or AS2 MDN receipt.',
      },
    ],
    keySegments: [
      { tag: 'ISA', name: 'Interchange Control Header', usage: 'Mandatory', description: 'Defines sender (ISA06), receiver (ISA08), date/time, and interchange control number (ISA13).', example: 'ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260912*0830*U*00401*000000850*0*P*>' },
      { tag: 'GS', name: 'Functional Group Header', usage: 'Mandatory', description: 'Groups related transaction sets. GS01 is functional code (PO, IN, SH, FA). GS06 is group control number.', example: 'GS*PO*NORTHWIND*CONTOSO*20260912*0830*85001*X*004010' },
      { tag: 'ST', name: 'Transaction Set Header', usage: 'Mandatory', description: 'Starts transaction set (850, 810, 856). ST02 is transaction set control number.', example: 'ST*850*0001' },
      { tag: 'BEG/BIG', name: 'Beginning Segment', usage: 'Mandatory', description: 'Carries PO number (BEG03), PO date (BEG05), or Invoice number (BIG02).', example: 'BEG*00*NE*PO-2026-78901**20260912' },
      { tag: 'PO1/IT1', name: 'Purchase Order / Invoice Line', usage: 'Mandatory', description: 'Item quantity, UOM, unit price, and item identifiers (VN=Vendor Part, UP=UPC).', example: 'PO1*1*150*EA*45.00**VN*SKU-A101*UP*012345678905' },
      { tag: 'CTT', name: 'Transaction Totals', usage: 'Optional', description: 'Line item hash count (CTT01) and sum of quantities (CTT02).', example: 'CTT*2*225' },
      { tag: 'SE', name: 'Transaction Set Trailer', usage: 'Mandatory', description: 'Total segment count from ST to SE inclusive (SE01) and matching ST02 control number.', example: 'SE*16*0001' },
    ],
    businessScenario: {
      domain: 'Retail & Omnichannel Logistics',
      scenario: 'Contoso Retail transmits an EDI 850 purchase order via AS2. The gateway ingests the order, maps it into your ERP database via canonical JSON, and immediately generates an AS2 MDN receipt and 997 Functional Acknowledgment to confirm receipt without human intervention.',
      tradingPartners: 'Contoso Retail, Northwind Trading, Fabrikam Logistics, Tailwind Carrier',
    },
    commonPitfalls: [
      {
        error: 'Control Number Mismatch (ISA13 != IEA02 or GS06 != GE02)',
        fix: 'Trading partners reject the entire transmission if envelope control numbers do not match. Verify your numbering sequence matches trailers.',
      },
      {
        error: 'SE01 Segment Count Discrepancy',
        fix: 'SE01 must count all segments starting at ST and ending at SE (including both ST and SE). Ensure empty lines are not included in the count.',
      },
    ],
  },
  'edi-csv-converter': {
    toolId: 'edi-csv-converter',
    title: 'EDI to CSV & CSV to EDI Converter Tutorial',
    category: 'Spreadsheet Integration',
    difficulty: 'Beginner',
    duration: '2 min',
    overview:
      'Bridge the gap between complex EDI envelopes and business spreadsheet workflows. Parse EDI 850, 810, 856, and 846 into structured Excel/CSV tables, or generate ANSI X12 directly from spreadsheet rows.',
    steps: [
      {
        stepNumber: 1,
        title: 'Select Conversion Direction',
        description: 'Choose "EDI ➔ CSV / Excel" to read files, or "CSV / Spreadsheet ➔ EDI X12" to generate files.',
      },
      {
        stepNumber: 2,
        title: 'Choose Flattening Strategy (for EDI ➔ CSV)',
        description:
          'Select between "Line-Item Flattened" (repeats header info for each line item), "Order Summary" (one row per document with totals), or "Segment Matrix" (segment-by-segment forensic view).',
        proTip: 'Line-Item Flattened is ideal for importing purchase orders directly into QuickBooks or Excel pivot tables.',
      },
      {
        stepNumber: 3,
        title: 'Review Data in Interactive Spreadsheet Grid',
        description:
          'Search by SKU or document number, inspect unit prices in your chosen global currency, and view calculated line totals.',
      },
      {
        stepNumber: 4,
        title: 'Export in 1-Click',
        description: 'Copy directly to clipboard, download as standard `.csv`, or export as tab-delimited `.tsv` for Microsoft Excel.',
      },
    ],
    keySegments: [
      { tag: 'PO1/IT1', name: 'Line Item Segment', usage: 'Mandatory', description: 'Extracts Line#, Qty, UOM, Price, SKU, and UPC into spreadsheet columns.', example: 'PO1*1*150*EA*45.00**VN*SKU-A101' },
      { tag: 'N1', name: 'Entity Identifier', usage: 'Mandatory', description: 'Extracts Buyer (BY/BT) and Ship-To (ST) names and addresses.', example: 'N1*ST*DALLAS DISTRIBUTION CENTER*9*0098765432100' },
      { tag: 'CUR', name: 'Currency Code', usage: 'Optional', description: 'Specifies transactional currency (USD, EUR, GBP, CAD).', example: 'CUR*SE*USD' },
    ],
    businessScenario: {
      domain: 'Accounting & Operations',
      scenario: 'Non-technical warehouse managers or accounts payable clerks need to inspect an 810 invoice or 850 order without needing dedicated EDI software.',
      tradingPartners: 'Suppliers, 3PL Warehouses, Accounting Teams',
    },
    commonPitfalls: [
      {
        error: 'Missing Header Identifiers in Multi-line CSVs',
        fix: 'When generating EDI from CSV, ensure each row includes the PO Number so the generator knows which lines belong to which order.',
      },
    ],
  },
  'edi-hipaa-sanitizer': {
    toolId: 'edi-hipaa-sanitizer',
    title: 'HIPAA PHI De-Identifier & Sanitizer Tutorial',
    category: 'Healthcare Compliance',
    difficulty: 'Intermediate',
    duration: '3 min',
    overview:
      'Sanitize Protected Health Information (PHI) from EDI 837 (Claims), 835 (Remittance), 270/271 (Eligibility), and 276/277 transactions according to HIPAA Safe Harbor rules (45 CFR § 164.514(b)) with 100% browser-local privacy.',
    steps: [
      {
        stepNumber: 1,
        title: 'Paste or Upload Healthcare EDI Document',
        description: 'Load an 837 professional or institutional claim, 835 payment remittance, or 270 eligibility request.',
      },
      {
        stepNumber: 2,
        title: 'Configure Redaction Toggles',
        description:
          'Choose which Safe Harbor identifiers to sanitize: Patient & Subscriber Names, SSN / Member IDs, Dates of Birth, Street Addresses & ZIP codes, or Provider NPIs.',
        proTip: 'Enable Synthetic Pseudonyms to replace real names with readable test names (e.g. JOHN DOE ➔ TEST_PATIENT_101) so downstream systems still validate.',
      },
      {
        stepNumber: 3,
        title: 'Inspect Side-by-Side Redaction View',
        description: 'Verify masked values highlighted in red/green with exact segment and element positions.',
      },
      {
        stepNumber: 4,
        title: 'Export Sanitized File & Audit Trail',
        description: 'Download the clean `.x12` file for safe testing, and download the compliance audit log for HIPAA auditing.',
      },
    ],
    keySegments: [
      { tag: 'NM1*IL', name: 'Insured / Subscriber Name', usage: 'Mandatory', description: 'Contains subscriber last name, first name, and SSN/Member ID in NM109.', example: 'NM1*IL*1*SMITH*JOHN****MI*987654321A' },
      { tag: 'NM1*QC', name: 'Patient Name', usage: 'Conditional', description: 'Present when patient is not the primary subscriber.', example: 'NM1*QC*1*DOE*JANE' },
      { tag: 'DMG', name: 'Demographic Information', usage: 'Mandatory', description: 'Carries patient date of birth (DMG02) and gender (DMG03).', example: 'DMG*D8*19850614*F' },
      { tag: 'N3/N4', name: 'Patient Address', usage: 'Mandatory', description: 'Contains street, city, state, and ZIP code.', example: 'N3*123 HEALTHCARE AVE~N4*NASHVILLE*TN*37203' },
    ],
    businessScenario: {
      domain: 'Healthcare Technology (HIPAA)',
      scenario: 'A healthtech engineering team needs real claim files from production to reproduce a billing bug in a staging environment. Transmitting real patient data violates HIPAA. Sanitizing with Safe Harbor removes all liability while maintaining EDI syntax.',
      tradingPartners: 'Health Plans, Clearinghouses (Change Healthcare, Availity), Hospitals',
    },
    commonPitfalls: [
      {
        error: 'Accidentally leaving Member IDs in REF segments',
        fix: 'PHI is not only in NM1 segments; look out for REF*SY (Social Security) and REF*EJ (Patient Account Number). Keep all redaction toggles enabled.',
      },
    ],
  },
  'edi-batch-splitter': {
    toolId: 'edi-batch-splitter',
    title: 'Batch Splitter & Multi-Transaction Joiner Tutorial',
    category: 'Document Management',
    difficulty: 'Intermediate',
    duration: '3 min',
    overview:
      'Split large EDI transmissions containing hundreds of purchase orders or invoices into individual transaction files, or bundle multiple loose EDI files into a single unified interchange envelope.',
    steps: [
      {
        stepNumber: 1,
        title: 'Load Multi-Transaction EDI File',
        description: 'Paste or upload an interchange containing multiple ST-SE blocks or multiple GS-GE groups.',
      },
      {
        stepNumber: 2,
        title: 'Choose Split Level',
        description: 'Split by Individual Transaction Set (ST..SE), by Functional Group (GS..GE), or by Interchange (ISA..IEA).',
      },
      {
        stepNumber: 3,
        title: 'Envelope Regeneration',
        description: 'The splitter automatically generates valid ISA/GS envelopes for each individual split file with matching control numbers and correct SE01 counts.',
      },
      {
        stepNumber: 4,
        title: 'Batch Download',
        description: 'Download individual `.edi` files or a single `.zip` archive ready for partner distribution.',
      },
    ],
    keySegments: [
      { tag: 'ST/SE', name: 'Transaction Set Boundary', usage: 'Mandatory', description: 'Encloses each independent business document (e.g. 850 PO).', example: 'ST*850*0001 ... SE*18*0001' },
      { tag: 'GS/GE', name: 'Functional Group Boundary', usage: 'Mandatory', description: 'Encloses all transactions of the same type.', example: 'GS*PO*... GE*5*85001' },
    ],
    businessScenario: {
      domain: 'Logistics & 3PL Warehousing',
      scenario: 'A trading partner sends a single daily batch file containing 200 purchase orders. Your warehouse management system requires 1 order per file for message queue processing.',
      tradingPartners: 'Amazon Vendor, 3PL Fulfillment, Retail EDI Hubs',
    },
    commonPitfalls: [
      {
        error: 'Invalid Segment Count in Split Files',
        fix: 'When splitting transactions out of a batch, SE01 must be recalculated for the single transaction, not copied from the original batch.',
      },
    ],
  },
  'edi-diff-compare': {
    toolId: 'edi-diff-compare',
    title: 'EDI Semantic Diff & Compare Tutorial',
    category: 'Quality Assurance',
    difficulty: 'Intermediate',
    duration: '2 min',
    overview:
      'Compare two EDI documents semantically rather than textually. Ignore line-break or whitespace differences to pinpoint added segments, modified element positions, quantity changes, and price variances.',
    steps: [
      {
        stepNumber: 1,
        title: 'Paste Original & Modified Documents',
        description: 'Load the original document in Document A (e.g. original 850 PO) and modified in Document B (e.g. 855 PO Acknowledgment or revised 850).',
      },
      {
        stepNumber: 2,
        title: 'Run Semantic Analysis',
        description: 'The engine parses both files into segment and element trees, aligning matching keys (e.g. Line Numbers in PO101).',
      },
      {
        stepNumber: 3,
        title: 'Inspect Highlighted Variances',
        description: 'Green highlights show added segments/elements; red highlights show removed or altered values.',
      },
    ],
    keySegments: [
      { tag: 'ACK', name: 'Line Item Acknowledgment', usage: 'Optional', description: 'Highlights order status changes (IA=Accepted, IR=Rejected, IQ=Quantity Changed).', example: 'ACK*IQ*100*EA' },
    ],
    businessScenario: {
      domain: 'Supply Chain Auditing',
      scenario: 'Verify what changed between a buyer’s original Purchase Order (850) and the vendor’s Order Acknowledgment (855), such as backordered quantities or revised delivery dates.',
      tradingPartners: 'Suppliers, Procurement Analysts',
    },
    commonPitfalls: [
      {
        error: 'Comparing files with different segment terminators',
        fix: 'The semantic diff engine automatically normalizes delimiters before comparison, so delimiter differences do not create false change alerts.',
      },
    ],
  },
  'edi-formatter': {
    toolId: 'edi-formatter',
    title: 'EDI Formatter & Indenter Tutorial',
    category: 'Developer Productivity',
    difficulty: 'Beginner',
    duration: '1 min',
    overview:
      'Format unreadable, single-line EDI strings into beautifully indented, human-readable segment trees with custom delimiters and segment descriptions.',
    steps: [
      {
        stepNumber: 1,
        title: 'Paste Raw EDI String',
        description: 'Paste any continuous stream of ANSI X12 or EDIFACT text without line breaks.',
      },
      {
        stepNumber: 2,
        title: 'Configure Formatting Preferences',
        description: 'Set segment terminators (tilde ~, newline), element separators (*), and loop indentation levels.',
      },
      {
        stepNumber: 3,
        title: 'View Annotated Segment Hierarchy',
        description: 'Hover over segment tags (BEG, N1, PO1) to see instant plain-English descriptions and element breakdowns.',
      },
    ],
    keySegments: [
      { tag: 'ISA', name: 'Interchange Header', usage: 'Mandatory', description: 'Position 104 is the sub-element separator; position 105 is the segment terminator.', example: 'ISA*00*...~' },
    ],
    businessScenario: {
      domain: 'Daily EDI Debugging',
      scenario: 'Copying a continuous 500-segment transaction from server logs and formatting it instantly to locate a syntax error.',
      tradingPartners: 'All Trading Partners',
    },
    commonPitfalls: [
      {
        error: 'Missing segment terminator at the end of the file',
        fix: 'Ensure the final trailer segment (IEA or UNZ) ends with a segment terminator (~ or \').',
      },
    ],
  },
  'edi-schema-viewer': {
    toolId: 'edi-schema-viewer',
    title: 'Hierarchical Schema Viewer & Element Lookup Tutorial',
    category: 'Specification Reference',
    difficulty: 'Intermediate',
    duration: '3 min',
    overview:
      'Browse standard ANSI X12 loop hierarchies (Header, Detail PO1 loop, Summary) and look up exact element positions, data types (AN, DT, TM, R, ID), and code qualifier meanings.',
    steps: [
      {
        stepNumber: 1,
        title: 'Select Transaction Standard',
        description: 'Choose from 850 (PO), 810 (Invoice), 856 (Ship Notice), 837 (Health Claim), or 820 (Payment).',
      },
      {
        stepNumber: 2,
        title: 'Explore Loop Tree',
        description: 'Click through the visual tree to see parent-child loop nesting (e.g. PO1 Line Item loop containing PID product descriptions).',
      },
      {
        stepNumber: 3,
        title: 'Lookup Specific Elements & Qualifiers',
        description: 'Click any element (e.g. BEG01, N101, PO106) to see valid code values (e.g. BT=Bill To, ST=Ship To, VN=Vendor Part).',
      },
    ],
    keySegments: [
      { tag: 'HL', name: 'Hierarchical Level (856)', usage: 'Mandatory', description: 'Establishes Shipment (S), Order (O), Tare/Pallet (T), and Item (I) levels in ASNs.', example: 'HL*1**S~HL*2*1*O~HL*3*2*I' },
    ],
    businessScenario: {
      domain: 'EDI Implementation & Mapping',
      scenario: 'An integration engineer mapping an ERP database into EDI needs to verify whether PO103 is Quantity Ordered or Unit Price, and what UOM qualifiers are allowed.',
      tradingPartners: 'Integration Architects, EDI Coordinators',
    },
    commonPitfalls: [
      {
        error: 'Confusing Segment Order in Detail Loops',
        fix: 'Subordinate segments like PID (Product Description) must immediately follow the PO1 or IT1 segment they describe.',
      },
    ],
  },
  'edi-validator': {
    toolId: 'edi-validator',
    title: 'EDI Compliance Validator Tutorial',
    category: 'Validation & Audit',
    difficulty: 'Intermediate',
    duration: '2 min',
    overview:
      'Perform multi-level syntax and business validation: envelope control numbers, segment order, mandatory presence, numeric formatting, and date verification.',
    steps: [
      {
        stepNumber: 1,
        title: 'Paste EDI Document to Audit',
        description: 'Paste your transaction into the editor or upload an `.edi` file.',
      },
      {
        stepNumber: 2,
        title: 'Review Audit Results',
        description: 'Findings are categorized by severity: FATAL, ERROR, WARNING, and INFO with exact segment coordinates.',
      },
      {
        stepNumber: 3,
        title: 'Apply 1-Click Fixes',
        description: 'Use the automatic repair helper to correct segment counts (SE01) and synchronize control numbers.',
      },
    ],
    keySegments: [
      { tag: 'SE/GE/IEA', name: 'Trailers', usage: 'Mandatory', description: 'Carries verification hashes and counts.', example: 'SE*12*0001~GE*1*85001~IEA*1*000000850~' },
    ],
    businessScenario: {
      domain: 'Pre-transmission Testing',
      scenario: 'Validate outgoing EDI documents before transmission to a retail partner to prevent costly partner chargebacks and failed transmissions.',
      tradingPartners: 'Retailers, Automotive OEMs',
    },
    commonPitfalls: [
      {
        error: 'Invalid Date Format (e.g. YYYY-MM-DD instead of CCYYMMDD)',
        fix: 'X12 dates must be in CCYYMMDD or YYMMDD without slashes or dashes (e.g. 20260912).',
      },
    ],
  },
  'edi-997-generator': {
    toolId: 'edi-997-generator',
    title: '997 Functional Acknowledgment Generator Tutorial',
    category: 'Acknowledgment Protocols',
    difficulty: 'Beginner',
    duration: '2 min',
    overview:
      'Automatically generate compliant ANSI X12 997 Functional Acknowledgments (or TA1 Interchange Acknowledgments / EDIFACT CONTRL) directly from inbound documents.',
    steps: [
      {
        stepNumber: 1,
        title: 'Load Inbound EDI Document',
        description: 'Paste the partner’s 850, 810, or 856 message into the generator.',
      },
      {
        stepNumber: 2,
        title: 'Select Acknowledgment Status',
        description: 'Choose Accept (A), Accept with Warnings (E), or Reject (R).',
      },
      {
        stepNumber: 3,
        title: 'Generate Correlated 997',
        description: 'The tool extracts GS06 and ST02 control numbers, populates AK1 and AK2/AK5 loops, and calculates trailer counts.',
      },
    ],
    keySegments: [
      { tag: 'AK1', name: 'Functional Group Response', usage: 'Mandatory', description: 'Correlates to inbound GS01 and GS06 control numbers.', example: 'AK1*PO*85001' },
      { tag: 'AK2', name: 'Transaction Set Response', usage: 'Mandatory', description: 'Correlates to inbound ST01 (850) and ST02 control numbers.', example: 'AK2*850*0001' },
      { tag: 'AK5', name: 'Transaction Acknowledgment Status', usage: 'Mandatory', description: 'A=Accepted, E=Accepted with Errors, R=Rejected.', example: 'AK5*A' },
      { tag: 'AK9', name: 'Functional Group Trailer Status', usage: 'Mandatory', description: 'Final group status and transaction counts received/accepted.', example: 'AK9*A*1*1*1' },
    ],
    businessScenario: {
      domain: 'B2B Service Level Agreements (SLAs)',
      scenario: 'Most retailers require a 997 Functional Acknowledgment within 2 hours of receiving an 850 PO. Missing the SLA triggers automated supplier chargebacks.',
      tradingPartners: 'Walmart, Amazon, Costco, Target',
    },
    commonPitfalls: [
      {
        error: 'Swapping Sender and Receiver IDs in 997 ISA/GS',
        fix: 'The 997 is sent back to the original sender, so ISA06 and ISA08 must be inverted from the inbound message.',
      },
    ],
  },
  'edi-lifecycle-reconciliation': {
    toolId: 'edi-lifecycle-reconciliation',
    title: 'Order Lifecycle Reconciliation (850 ➔ 855 ➔ 856 ➔ 810) Tutorial',
    category: 'Multi-Document Audit',
    difficulty: 'Advanced',
    duration: '4 min',
    overview:
      'Perform end-to-end 3-way matching across the full B2B order lifecycle: Purchase Order (850), Order Acknowledgment (855), Advance Ship Notice (856), and Commercial Invoice (810).',
    steps: [
      {
        stepNumber: 1,
        title: 'Load Order Lifecycle Set',
        description: 'Load all documents associated with a single order (850 PO, 855 Ack, 856 ASN, 810 Invoice).',
      },
      {
        stepNumber: 2,
        title: 'Execute Cross-Document Matching',
        description: 'The reconciliation engine matches line items, SKUs, ordered quantities, shipped quantities, and invoiced amounts.',
      },
      {
        stepNumber: 3,
        title: 'Detect Financial & Quantity Discrepancies',
        description: 'Pinpoint short shipments (Qty Invoiced > Qty Shipped) and price mismatches (Invoice Price > PO Price).',
      },
    ],
    keySegments: [
      { tag: 'PO1 vs IT1', name: 'Price & Qty Audit', usage: 'Mandatory', description: 'Compares ordered price (PO104) against invoiced price (IT104).', example: 'PO1 Unit: $45.00 vs IT1 Unit: $48.50 ➔ Discrepancy Flag' },
    ],
    businessScenario: {
      domain: 'Accounts Payable & Supply Chain Audit',
      scenario: 'Prevent overpaying invoices by ensuring you only pay for goods that were actually confirmed in the 856 ASN and originally authorized on the 850 PO.',
      tradingPartners: 'Retail, Manufacturing, Distribution',
    },
    commonPitfalls: [
      {
        error: 'Mismatched Unit of Measure (UOM)',
        fix: 'Check if the PO was ordered in Cases (CA) but invoiced in Each (EA). UOM mismatches create false quantity variances.',
      },
    ],
  },
  'gs1-sscc-label-generator': {
    toolId: 'gs1-sscc-label-generator',
    title: 'GS1-128 / SSCC-18 Shipping Label Tutorial',
    category: 'Logistics & Barcodes',
    difficulty: 'Intermediate',
    duration: '2 min',
    overview:
      'Generate retail-compliant 4x6 GS1-128 logistics shipping container labels with automated Mod-10 check digit calculation for Application Identifier (00) Serial Shipping Container Codes.',
    steps: [
      {
        stepNumber: 1,
        title: 'Enter GS1 Company Prefix & Serial Reference',
        description: 'Provide your 7-10 digit GS1 company prefix and a sequential pallet/carton serial number.',
      },
      {
        stepNumber: 2,
        title: 'Input Shipping & Carrier Data',
        description: 'Enter Ship-To destination, PO Number, Carrier Name, Tracking Number, and carton contents.',
      },
      {
        stepNumber: 3,
        title: 'Generate & Print 4x6 Barcode Label',
        description: 'The tool calculates the Mod-10 checksum and generates a crisp vector GS1-128 barcode ready for thermal printing.',
      },
    ],
    keySegments: [
      { tag: 'AI (00)', name: 'SSCC-18 Identifier', usage: 'Mandatory', description: 'Application Identifier (00) indicates an 18-digit Serial Shipping Container Code.', example: '(00) 0 0012345 123456789 7' },
    ],
    businessScenario: {
      domain: 'Distribution Center Receiving',
      scenario: 'Pallets arriving at Walmart or Target distribution centers are scanned via their SSCC-18 barcode to match against the pre-sent 856 ASN for instant cross-docking.',
      tradingPartners: 'Retail DC Receiving, 3PL Fulfillment',
    },
    commonPitfalls: [
      {
        error: 'Incorrect Check Digit',
        fix: 'The 18th digit of an SSCC must be a Mod-10 check digit calculated across the first 17 digits. Codepackr computes this automatically.',
      },
    ],
  },
};

interface EdiTutorialPanelProps {
  toolId: string;
  isOpen: boolean;
  onToggle: () => void;
  onLoadSample?: (sampleText: string) => void;
}

export const EdiTutorialPanel: React.FC<EdiTutorialPanelProps> = ({
  toolId,
  isOpen,
  onToggle,
  onLoadSample,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    steps: true,
    segments: true,
    scenario: false,
    pitfalls: false,
  });

  const tutorial = EDI_TUTORIALS[toolId] || EDI_TUTORIALS['edi-message-gateway'];

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full shadow-lg border flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 cursor-pointer"
        style={{
          backgroundColor: 'var(--brand)',
          color: '#ffffff',
          borderColor: 'rgba(255,255,255,0.2)',
        }}
        title="Open Step-by-Step Tutorial & Field Guide"
      >
        <BookOpen className="w-4 h-4" />
        <span>Tutorial &amp; Guide</span>
        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">Help</span>
      </button>
    );
  }

  return (
    <div
      className="p-5 rounded-2xl border space-y-4 shadow-sm animate-fade-in transition-all"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl text-white"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                {tutorial.title}
              </h2>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--brand)',
                  border: '1px solid var(--line)',
                }}
              >
                {tutorial.difficulty} • {tutorial.duration}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {tutorial.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tutorial.sampleData && onLoadSample && (
            <button
              type="button"
              onClick={() => onLoadSample(tutorial.sampleData!)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--line)',
                color: 'var(--brand)',
                border: '1px solid var(--line)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Verified Sample</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg border hover:opacity-80 transition-all cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
            title="Minimize Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview text */}
      <div
        className="p-3.5 rounded-xl border text-xs leading-relaxed"
        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
      >
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Summary: </span>
            <span>{tutorial.overview}</span>
          </div>
        </div>
      </div>

      {/* Section 1: Step-by-Step Instructions */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--line)' }}>
        <button
          type="button"
          onClick={() => toggleSection('steps')}
          className="w-full p-3 flex items-center justify-between font-bold text-xs cursor-pointer text-left transition-colors"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Step-by-Step Execution Guide ({tutorial.steps.length} Steps)</span>
          </div>
          {expandedSections.steps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expandedSections.steps && (
          <div className="p-4 space-y-4" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tutorial.steps.map((st) => (
                <div
                  key={st.stepNumber}
                  className="p-3 rounded-xl border space-y-2 flex flex-col justify-between"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: 'var(--brand)' }}
                      >
                        {st.stepNumber}
                      </span>
                      <h4 className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                        {st.title}
                      </h4>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {st.description}
                    </p>
                    {st.details && st.details.length > 0 && (
                      <ul className="list-disc list-inside text-[11px] space-y-1 pt-1" style={{ color: 'var(--ink)' }}>
                        {st.details.map((d, i) => (
                          <li key={i} className="leading-snug">{d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {st.proTip && (
                    <div
                      className="p-2 rounded-lg text-[10px] flex items-center gap-1.5 font-medium"
                      style={{ backgroundColor: 'var(--surface-2)', color: 'var(--brand)' }}
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{st.proTip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Key Segments Reference Table */}
      {tutorial.keySegments && tutorial.keySegments.length > 0 && (
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--line)' }}>
          <button
            type="button"
            onClick={() => toggleSection('segments')}
            className="w-full p-3 flex items-center justify-between font-bold text-xs cursor-pointer text-left transition-colors"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
          >
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-sky-500" />
              <span>Key EDI Segments &amp; Elements Reference</span>
            </div>
            {expandedSections.segments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandedSections.segments && (
            <div className="overflow-x-auto" style={{ backgroundColor: 'var(--surface)' }}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-[11px] font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                    <th className="p-3">Segment</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Requirement</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Example Syntax</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                  {tutorial.keySegments.map((seg) => (
                    <tr key={seg.tag} className="hover:opacity-90">
                      <td className="p-3 font-mono font-bold" style={{ color: 'var(--brand)' }}>
                        {seg.tag}
                      </td>
                      <td className="p-3 font-medium" style={{ color: 'var(--ink)' }}>
                        {seg.name}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            seg.usage === 'Mandatory'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {seg.usage}
                        </span>
                      </td>
                      <td className="p-3 text-[11px]" style={{ color: 'var(--muted)' }}>
                        {seg.description}
                      </td>
                      <td className="p-3 font-mono text-[10px] select-all" style={{ color: 'var(--ink)' }}>
                        <code>{seg.example}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section 3: Real-World Business Scenario & Common Pitfalls (2-column) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Business Scenario */}
        <div className="border rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 font-bold text-xs" style={{ color: 'var(--ink)' }}>
            <Workflow className="w-4 h-4 text-indigo-500" />
            <span>Real-World Business Scenario</span>
          </div>
          <div className="text-xs space-y-1.5" style={{ color: 'var(--muted)' }}>
            <p className="font-semibold" style={{ color: 'var(--ink)' }}>
              {tutorial.businessScenario.domain}
            </p>
            <p className="leading-relaxed">
              {tutorial.businessScenario.scenario}
            </p>
            <div className="text-[11px] pt-1">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>Common Partners: </span>
              <span>{tutorial.businessScenario.tradingPartners}</span>
            </div>
          </div>
        </div>

        {/* Common Pitfalls & Fixes */}
        <div className="border rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 font-bold text-xs" style={{ color: 'var(--ink)' }}>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Common Pitfalls &amp; Partner Chargeback Risks</span>
          </div>
          <div className="space-y-2 text-xs">
            {tutorial.commonPitfalls.map((p, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}>
                <p className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                  ⚠️ {p.error}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  ✅ <span className="font-semibold">Fix:</span> {p.fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
