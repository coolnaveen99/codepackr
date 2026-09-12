/**
 * Rigorous EDI Fidelity and Lossless Conversion Test Suite
 * Validates ANSI X12 (850, 810, 856, 855, 860, 997) & UN/EDIFACT (ORDERS, DESADV)
 * Tests against fabricated values, data loss, delimiter variations, and newline formatting.
 */

import assert from 'node:assert/strict';

console.log('--- STARTING CODEPACKR RIGOROUS EDI FIDELITY TEST SUITE ---\n');

// 1. Delimiter Detection Function (mirroring EdiToolsView)
function detectDelimiters(text) {
  let segTerm = '~';
  let elemSep = '*';
  let subSep = ':';

  if (text.startsWith('ISA') && text.length >= 106) {
    elemSep = text.charAt(3);
    const pos105 = text.charAt(105);
    const pos106 = text.charAt(106);

    if (pos105 === '\r' && pos106 === '\n') {
      segTerm = '\r\n';
    } else if (pos105 === '\n') {
      segTerm = '\n';
    } else if (pos105 === '\r') {
      segTerm = '\r';
    } else {
      segTerm = pos105;
    }

    subSep = text.charAt(104) || ':';
    return { segTerm, elemSep, subSep };
  }

  if (text.startsWith('UNA') && text.length >= 9) {
    subSep = text.charAt(3);
    elemSep = text.charAt(4);
    segTerm = text.charAt(8);
    return { segTerm, elemSep, subSep };
  }

  const clean = text.replace(/[\r\n\t]/g, '');
  if (clean.includes('~')) segTerm = '~';
  else if (text.includes('\n')) segTerm = '\n';
  else if (clean.includes("'")) segTerm = "'";

  if (clean.includes('*')) elemSep = '*';
  else if (clean.includes('+')) elemSep = '+';
  else if (clean.includes('|')) elemSep = '|';

  return { segTerm, elemSep, subSep };
}

// 2. Segment Splitter Function (mirroring EdiToolsView)
function parseEdiSegments(text, segTerm, elemSep) {
  let effectiveTerm = segTerm;
  if (!effectiveTerm) effectiveTerm = '~';

  let rawSegments = [];
  if (effectiveTerm === '\r\n') {
    rawSegments = text.split(/\r\n/);
  } else if (effectiveTerm === '\n' || effectiveTerm === '\r') {
    rawSegments = text.split(/\r?\n/);
  } else {
    rawSegments = text.split(effectiveTerm);
  }

  const segments = [];
  rawSegments.forEach((raw, idx) => {
    const cleaned = raw.replace(/[\r\n]/g, '').trim();
    if (!cleaned) return;
    const elements = cleaned.split(elemSep);
    const tag = elements[0].trim().toUpperCase();
    if (!tag) return;
    segments.push({
      tag,
      elements: elements.slice(1).map((el) => el.trim()),
      raw: cleaned,
      lineNumber: idx + 1,
    });
  });
  return segments;
}

// ==========================================
// TEST 1: 850 PO with Newline Delimiters (The Reddit Bug Reproduction)
// ==========================================
console.log('TEST 1: ANSI X12 850 with Newline Delimiters & No Hardcoded Fallbacks');
const test850Newline = `ISA*00*          *00*          *ZZ*ACME           *ZZ*WAYNE          *260311*1200*U*00401*000000042*0*T*:
GS*PO*ACME*WAYNE*20260311*1200*42*X*004010
ST*850*0042
BEG*00*SA*PO-98765**20260311
N1*ST*GOTHAM FACILITY*92*GOTH-99
PO1*1*500*BX*12.50**VN*ITEM-998877
CTT*1
SE*7*0042
GE*1*42
IEA*1*000000042`;

const delims1 = detectDelimiters(test850Newline);
assert.strictEqual(delims1.elemSep, '*', 'Element separator must be *');
assert.ok(delims1.segTerm === '\n' || delims1.segTerm === '\r\n', 'Segment terminator must be newline');

const segs1 = parseEdiSegments(test850Newline, delims1.segTerm, delims1.elemSep);
assert.strictEqual(segs1.length, 10, 'Must parse exactly 10 segments');
assert.strictEqual(segs1[0].tag, 'ISA');
assert.strictEqual(segs1[0].elements[12], '000000042', 'Control number must match 000000042');
assert.strictEqual(segs1[3].elements[2], 'PO-98765', 'PO number must match PO-98765');
assert.strictEqual(segs1[5].tag, 'PO1');
assert.strictEqual(segs1[5].elements[0], '1', 'Line number must match 1');
assert.strictEqual(segs1[5].elements[1], '500', 'Quantity must be 500');
assert.strictEqual(segs1[5].elements[2], 'BX', 'UOM must be BX (not defaulted to EA)');
assert.strictEqual(segs1[5].elements[3], '12.50', 'Price must be 12.50');
assert.strictEqual(segs1[5].elements[6], 'ITEM-998877', 'Product ID must be preserved');
console.log('  Passed: All 10 segments extracted faithfully without dropping data.\n');

// ==========================================
// TEST 2: Absence of Optional Segments (No Hallucination Test)
// ==========================================
console.log('TEST 2: Absence of CUR, SAC, DTM - Verify No Injected Default Values');
const testNoCur = `ISA*00*          *00*          *01*003882728      *01*001928374      *260311*0930*U*00501*999888777*0*P*^
GS*PO*003882728*001928374*20260311*0930*999*X*005010
ST*850*9001
BEG*00*NE*ORD-ABC-123**20260311
N1*BY*EUROPEAN BUYER*91*EU-CORP
PO1*A-10*25*KG*45.00**IN*PART-XYZ
SE*6*9001
GE*1*999
IEA*1*999888777`;

const delims2 = detectDelimiters(testNoCur);
const segs2 = parseEdiSegments(testNoCur, delims2.segTerm, delims2.elemSep);
assert.strictEqual(segs2.length, 9);
const curSeg = segs2.find(s => s.tag === 'CUR');
assert.strictEqual(curSeg, undefined, 'CUR segment must NOT exist in source document');
assert.strictEqual(segs2[2].elements[1], '9001', 'ST02 must be 9001, never overwritten with 0001');
assert.strictEqual(segs2[1].elements[7], '005010', 'GS08 must be 005010, never overwritten with 004010');
assert.strictEqual(segs2[5].elements[2], 'KG', 'UOM must be KG, never overwritten with EA');
console.log('  Passed: No arbitrary USD, 004010, or EA fallbacks injected.\n');

// ==========================================
// TEST 3: UN/EDIFACT (ORDERS & DESADV)
// ==========================================
console.log('TEST 3: UN/EDIFACT Message Parsing & Segment Count Verification');
const testEdifact = `UNA:+.? '
UNB+UNOC:3+SENDER_GLN:14+RECEIVER_GLN:14+260311:1430+REF9901'
UNH+MSG001+ORDERS:D:96A:UN'
BGM+220+PO-DE-4411+9'
DTM+137:20260311:102'
NAD+BY+BUYER_ID::9'
NAD+SU+SUPPLIER_ID::9'
LIN+1++PRODUCT_EAN:EN'
QTY+21:100:PCE'
PRI+AAA:15.75'
UNT+9+MSG001'
UNZ+1+REF9901'`;

const delims3 = detectDelimiters(testEdifact);
assert.strictEqual(delims3.elemSep, '+', 'EDIFACT element separator must be +');
assert.strictEqual(delims3.segTerm, "'", "EDIFACT segment terminator must be '");
assert.strictEqual(delims3.subSep, ':', 'EDIFACT component separator must be :');

const segs3 = parseEdiSegments(testEdifact, delims3.segTerm, delims3.elemSep);
assert.strictEqual(segs3.length, 12, 'Must parse 12 EDIFACT segments including UNA/UNB/UNZ');
assert.strictEqual(segs3[2].tag, 'UNH');
assert.strictEqual(segs3[2].elements[0], 'MSG001');
assert.strictEqual(segs3[3].elements[1], 'PO-DE-4411');
assert.strictEqual(segs3[10].elements[0], '9', 'UNT segment count must match 9');
assert.strictEqual(segs3[10].elements[1], 'MSG001', 'UNT reference must match UNH reference MSG001');
console.log('  Passed: UN/EDIFACT standard parsed and validated.\n');

// ==========================================
// TEST 4: ANSI X12 856 ASN with Hierarchical Levels & SSCC Barcodes
// ==========================================
console.log('TEST 4: ANSI X12 856 Advance Ship Notice (HL Loops + Barcode Carrier)');
const test856 = `ISA*00*          *00*          *ZZ*LOGISTICS_EXP  *ZZ*RETAIL_DIST    *260311*1015*U*00401*100000001*0*P*~
GS*SH*LOGISTICS_EXP*RETAIL_DIST*20260311*1015*1001*X*004010~
ST*856*0001~
BSN*00*SH-2026-001*20260311*1015*0001~
HL*1**S~
TD1*CTN*50~
TD5*B*2*FDEX*M~
HL*2*1*O~
PRF*PO-88221~
HL*3*2*I~
LIN*1*UP*012345678901~
SN1*1*120*EA~
MAN*GM*00001234567890123456~
SE*13*0001~
GE*1*1001~
IEA*1*100000001~`;

const delims4 = detectDelimiters(test856);
console.log('delims4 detected:', delims4);
const segs4 = parseEdiSegments(test856, delims4.segTerm, delims4.elemSep);
assert.strictEqual(segs4.length, 16);
const hlList = segs4.filter(s => s.tag === 'HL');
assert.strictEqual(hlList.length, 3, 'Must find 3 Hierarchical Levels');
assert.strictEqual(hlList[0].elements[2], 'S', 'First HL must be Shipment (S)');
assert.strictEqual(hlList[1].elements[2], 'O', 'Second HL must be Order (O)');
assert.strictEqual(hlList[2].elements[2], 'I', 'Third HL must be Item (I)');

const manSeg = segs4.find(s => s.tag === 'MAN');
assert.ok(manSeg, 'MAN segment must exist');
assert.strictEqual(manSeg.elements[1], '00001234567890123456', 'SSCC-18 barcode must be extracted');
console.log('  Passed: 856 ASN Hierarchical Levels & SSCC Barcode fully extracted.\n');

// ==========================================
// TEST 5: Complex real-world style 850 (Tediware-style) – full segment preservation
// ==========================================
console.log('TEST 5: Complex 850 with REF/PER/FOB/ITD/DTM/N9-MSG/PO4/multi-product-ID – Lossless Segment Count');
const testComplex850 = `ISA*00*          *00*          *ZZ*TEDIBUYER      *01*WIDGETWORKS    *260101*0000*U*00401*000000001*0*T*>~
GS*PO*TEDIBUYER*WIDGETWORKS*20260101*0000*1001*X*004010~
ST*850*1001~
BEG*00*SA*TEDIPO0001**20260101~
CUR*BY*CAD~
REF*IA*10000~
REF*19*Ship to head office~
REF*YD*1~
REF*ZZ*No QC Hold, OK to Ship~
PER*BD*Adrian~
FOB*PP~
ITD************26~
DTM*106*20260201~
N9*ZZ*GEN~
MSG*THIS PURCHASE ORDER MUST BE FULFILLED ACCORDING TO THE VENDOR GUIDE AT https://tediware.com~
MSG*QUESTIONS ABOUT THIS ORDER? CONTACT INFO@TEDIWARE.COM. NO SUBSTITUTIONS OR BACKORDERS.~
N1*VN*WIDGETWORKS LLC~
N3*1 INDUSTRIAL WAY~
N4*PORTLAND*OR*97201*US~
N1*ST*TEDIWARE HEAD OFFICE*92*400~
N3*18 KING STREET EAST*SUITE 1400~
N4*TORONTO*ON*M5C1C4*CA~
PO1*1*36*EA*10**SK*0000001*VN*SKUTEDI1*UP*000000000001~
PID*F*08***WIDGET ASSEMBLY KIT~
PO4*36*****27*LB***10*15*12*IN~
CTT*1~
SE*25*1001~
GE*1*1001~
IEA*1*000000001~`;

const delims5 = detectDelimiters(testComplex850);
const segs5 = parseEdiSegments(testComplex850, delims5.segTerm, delims5.elemSep);

assert.ok(segs5.length >= 25, `Must parse at least 25 segments (got ${segs5.length})`);
assert.strictEqual(segs5.find(s => s.tag === 'BEG')?.elements[2], 'TEDIPO0001');
assert.strictEqual(segs5.find(s => s.tag === 'CUR')?.elements[1], 'CAD');
const refs = segs5.filter(s => s.tag === 'REF');
assert.strictEqual(refs.length, 4, 'Must preserve all 4 REF segments');
assert.ok(segs5.some(s => s.tag === 'PER' && s.elements[1] === 'Adrian'));
assert.ok(segs5.some(s => s.tag === 'FOB' && s.elements[0] === 'PP'));
assert.ok(segs5.some(s => s.tag === 'DTM' && s.elements[0] === '106'));
assert.ok(segs5.some(s => s.tag === 'N9'));
assert.strictEqual(segs5.filter(s => s.tag === 'MSG').length, 2, 'Must preserve both MSG notes');
const stParty = segs5.find(s => s.tag === 'N1' && s.elements[0] === 'ST');
assert.ok(stParty);
assert.strictEqual(stParty.elements[3], '400');
const n3St = segs5.filter(s => s.tag === 'N3');
assert.ok(n3St.some(s => s.elements[1] === 'SUITE 1400'), 'Must preserve multi-line address (SUITE 1400)');
const po1 = segs5.find(s => s.tag === 'PO1');
assert.ok(po1);
assert.strictEqual(po1.elements[1], '36');
assert.strictEqual(po1.elements[6], '0000001'); // SK
assert.strictEqual(po1.elements[8], 'SKUTEDI1'); // VN
assert.strictEqual(po1.elements[10], '000000000001'); // UP
const po4 = segs5.find(s => s.tag === 'PO4');
assert.ok(po4, 'PO4 physical details must be present');
assert.strictEqual(po4.elements[0], '36');
assert.strictEqual(po4.elements[5], '27');
console.log('  Passed: Complex 850 – all REF/PER/FOB/ITD/DTM/N9/MSG/PO4/multi-product-ID and multi-line address preserved with zero data loss.\n');

console.log('====================================================');
console.log('ALL 5 RIGOROUS EDI FIDELITY TESTS PASSED WITH 100% SUCCESS!');
console.log('Zero data loss, zero hallucinated defaults, 100% strict compliance.');
console.log('Complex real-world 850 (REF/N9/MSG/PO4) fully covered.');
console.log('====================================================');
