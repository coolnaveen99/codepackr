// Comprehensive EDI Transaction & Segment Knowledge Base
// Covers Retail, Supply Chain, Logistics, Healthcare, Finance, and EDIFACT standards

export interface EdiTransactionDefinition {
  id: string;
  code: string;
  name: string;
  standard: 'X12' | 'EDIFACT';
  functionalGroup: string; // e.g. PO, IN, SH, PC, RA, FA, etc.
  category: 'Supply Chain & Retail' | 'Logistics & Warehousing' | 'Manufacturing & Automotive' | 'Finance & Healthcare' | 'Administrative & Acknowledgment';
  description: string;
  purpose: string;
  keySegments: string[];
  samplePayload: string;
}

export const FSMA_204_COMPLIANT_856 = `ISA*00*          *00*          *ZZ*VALLEYFARM_SF  *ZZ*FRESHMARKET_HQ *260904*0600*U*00401*000000856*0*P*>~
GS*SH*VALLEYFARM_SF*FRESHMARKET_HQ*20260904*0600*85601*X*004010~
ST*856*0001~
BSN*00*ASN-FSMA-2026-01*20260904*0600*0001~
DTM*011*20260904*0600~
DTM*196*20260902*0800~
DTM*197*20260902*1400~
DTM*198*20260903*1000~
DTM*036*20260920~
HL*1**S~
TD1*CTN25*40~
TD5**2*FDEG*M*FEDEX FREIGHT~
REF*BM*BOL-FSMA-9921~
N1*SF*VALLEY PACKING HOUSE #4*92*0012345000019~
N3*8800 HARVEST WAY*BLDG B~
N4*SALINAS*CA*93901*US~
N1*DA*TRACEABILITY LOT SOURCE*FA*19283746501~
N3*8800 HARVEST WAY~
N4*SALINAS*CA*93901*US~
N1*ST*FRESH MARKET DC #12*UL*0078742037777~
N3*400 WHOLESALE BLVD~
N4*TRACY*CA*95376*US~
HL*2*1*O~
PRF*PO-2026-FSMA01***20260901~
HL*3*2*P~
MAN*GM*00100123450000001815~
HL*4*3*I~
LIN*1*UK*10012345678902*UP*012345678902~
SN1*1*40*CA~
PID*F****ORGANIC ROMAINE HEARTS CRISP FRESH~
REF*LT*TLC-2026-0902-F4~
REF*BT*FARM-FIELD-04B~
CTT*4~
SE*30*0001~
GE*1*85601~
IEA*1*000000856~`;

export const EDI_TRANSACTIONS: EdiTransactionDefinition[] = [
  // ==========================================
  // 1. SUPPLY CHAIN & RETAIL
  // ==========================================
  {
    id: '850',
    code: '850',
    name: '850 Purchase Order',
    standard: 'X12',
    functionalGroup: 'PO',
    category: 'Supply Chain & Retail',
    description: 'Buyer ordering merchandise, parts, or services with prices, quantities, and ship-to locations.',
    purpose: 'Placed by a buyer (e.g. Walmart, Target) to request item quantities, delivery schedules, and pricing from a seller.',
    keySegments: ['ST', 'BEG', 'CUR', 'REF', 'PER', 'N1', 'N3', 'N4', 'PO1', 'PID', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*BUYER_RETAIL   *ZZ*ACME_SUPPLIER  *260904*1000*U*00401*000000850*0*P*>~
GS*PO*BUYER_RETAIL*ACME_SUPPLIER*20260904*1000*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-2026-9901**20260904~
CUR*BY*USD~
REF*DP*042~
PER*BD*JOHN SMITH*TE*555-0100*EM*buyer@retailer.com~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
N3*1500 LOGISTICS PKWY~
N4*DALLAS*TX*75261*US~
N1*BT*RETAIL CORP ACCOUNTS*91*CORP01~
N3*100 HEADQUARTERS BLVD~
N4*BENTONVILLE*AR*72712*US~
PO1*1*100*CA*32.50**VN*SKU-A101*UP*012345678901~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
PO1*2*50*CA*45.00**VN*SKU-B202*UP*012345678918~
PID*F****HEAVYWEIGHT FLEECE HOODIE 6PK~
CTT*2*150~
SE*16*0001~
GE*1*85001~
IEA*1*000000850~`,
  },
  {
    id: '855',
    code: '855',
    name: '855 Purchase Order Acknowledgment',
    standard: 'X12',
    functionalGroup: 'PR',
    category: 'Supply Chain & Retail',
    description: 'Seller confirming, rejecting, or making line-item changes (price, date, backorders) to an 850 PO.',
    purpose: 'Notifies buyer whether the purchase order was accepted without changes (AD), accepted with changes (AC), or rejected (RD).',
    keySegments: ['ST', 'BAK', 'CUR', 'REF', 'N1', 'PO1', 'ACK', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1130*U*00401*000000855*0*P*>~
GS*PR*ACME_SUPPLIER*BUYER_RETAIL*20260904*1130*85501*X*004010~
ST*855*0001~
BAK*00*AC*PO-2026-9901*20260904****20260904~
CUR*SE*USD~
REF*DP*042~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
PO1*1*100*CA*32.50**VN*SKU-A101*UP*012345678901~
ACK*IA*100*CA*068*20260912~
PO1*2*50*CA*45.00**VN*SKU-B202*UP*012345678918~
ACK*BP*30*CA*068*20260912~
ACK*DR*20*CA*068*20260920~
CTT*2*150~
SE*13*0001~
GE*1*85501~
IEA*1*000000855~`,
  },
  {
    id: '860',
    code: '860',
    name: '860 Purchase Order Change Request - Buyer Initiated',
    standard: 'X12',
    functionalGroup: 'PC',
    category: 'Supply Chain & Retail',
    description: 'Buyer requesting modifications to a previously submitted 850 PO (quantity revision, cancellation, date shift).',
    purpose: 'Transmits additions, cancellations, or revisions to items, quantities, or ship dates of an open purchase order.',
    keySegments: ['ST', 'BCH', 'CUR', 'REF', 'N1', 'POC', 'PID', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*BUYER_RETAIL   *ZZ*ACME_SUPPLIER  *260904*1400*U*00401*000000860*0*P*>~
GS*PC*BUYER_RETAIL*ACME_SUPPLIER*20260904*1400*86001*X*004010~
ST*860*0001~
BCH*04*NE*PO-2026-9901**20260904*01*20260904~
CUR*BY*USD~
REF*DP*042~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
POC*1*CA*120*100*EA*32.50**VN*SKU-A101*UP*012345678901~
PID*F****REVISED QUANTITY REQUEST (+20 CASES)~
POC*2*DI*0*50*EA*45.00**VN*SKU-B202*UP*012345678918~
PID*F****LINE ITEM CANCELLATION REQUEST~
CTT*2*120~
SE*12*0001~
GE*1*86001~
IEA*1*000000860~`,
  },
  {
    id: '865',
    code: '865',
    name: '865 Purchase Order Change Acknowledgment',
    standard: 'X12',
    functionalGroup: 'CA',
    category: 'Supply Chain & Retail',
    description: 'Seller acknowledging acceptance, rejection, or counter-proposals to a buyer 860 change request.',
    purpose: 'Confirming whether the supplier accepts or rejects the requested cancellations, price shifts, or delivery reschedules.',
    keySegments: ['ST', 'BCA', 'REF', 'N1', 'POC', 'ACK', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1530*U*00401*000000865*0*P*>~
GS*CA*ACME_SUPPLIER*BUYER_RETAIL*20260904*1530*86501*X*004010~
ST*865*0001~
BCA*00*AT*PO-2026-9901*20260904*01*20260904~
REF*DP*042~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
POC*1*CA*120*100*EA*32.50**VN*SKU-A101~
ACK*AC*120*EA*068*20260914~
POC*2*DI*0*50*EA*45.00**VN*SKU-B202~
ACK*AC*0*EA~
CTT*2*120~
SE*11*0001~
GE*1*86501~
IEA*1*000000865~`,
  },
  {
    id: '856',
    code: '856',
    name: '856 Ship Notice / Manifest (Advance Shipping Notice - ASN)',
    standard: 'X12',
    functionalGroup: 'SH',
    category: 'Logistics & Warehousing',
    description: 'Informs receiver about shipment contents, carrier details, barcodes (GS1-128 / UCC-128), and packaging hierarchy (SOPI).',
    purpose: 'Enables automated receiving docks and cross-docking without manual box unpacking by transmitting packing structures.',
    keySegments: ['ST', 'BSN', 'DTM', 'HL', 'TD1', 'TD5', 'REF', 'N1', 'PRF', 'MAN', 'LIN', 'SN1', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1600*U*00401*000000856*0*P*>~
GS*SH*ACME_SUPPLIER*BUYER_RETAIL*20260904*1600*85601*X*004010~
ST*856*0001~
BSN*00*ASN-2026-1102*20260904*1600*0001~
DTM*011*20260904~
HL*1**S~
TD1*CTN25*2~
TD5*B*2*FDEG*M*FEDEX FREIGHT~
REF*BM*BOL-98841~
N1*SF*ACME LOGISTICS DOCK*91*FAC01~
N3*12 INDUSTRIAL WAY~
N4*CHICAGO*IL*60601*US~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
N3*1500 LOGISTICS PKWY~
N4*DALLAS*TX*75261*US~
HL*2*1*O~
PRF*PO-2026-9901***20260904~
HL*3*2*P~
MAN*GM*00100123450000000018~
HL*4*3*I~
LIN*1*VN*SKU-A101*UP*012345678901~
SN1*1*120*CA~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
CTT*4~
SE*21*0001~
GE*1*85601~
IEA*1*000000856~`,
  },
  {
    id: '810',
    code: '810',
    name: '810 Commercial Invoice',
    standard: 'X12',
    functionalGroup: 'IN',
    category: 'Supply Chain & Retail',
    description: 'Supplier requesting payment for goods or services delivered, detailing item quantities, payment terms, and taxes.',
    purpose: 'Triggers accounts payable matching against 850 PO and 856 ASN (3-way match) for electronic settlement.',
    keySegments: ['ST', 'BIG', 'CUR', 'REF', 'N1', 'ITD', 'IT1', 'PID', 'TDS', 'TXI', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1700*U*00401*000000810*0*P*>~
GS*IN*ACME_SUPPLIER*BUYER_RETAIL*20260904*1700*81001*X*004010~
ST*810*0001~
BIG*20260904*INV-2026-4401*20260904*PO-2026-9901~
CUR*SE*USD~
REF*DP*042~
N1*RE*ACME REMITTANCE CENTER*91*REMIT1~
N3*PO BOX 7700~
N4*DALLAS*TX*75201*US~
N1*BT*BUYER CORPORATE ACCOUNTS*92*BUY01~
N3*100 HEADQUARTERS BLVD~
N4*BENTONVILLE*AR*72712*US~
ITD*01*3*2**10*20260914*30~
IT1*1*120*CA*32.50**VN*SKU-A101*UP*012345678901~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
TDS*390000~
CTT*1~
SE*15*0001~
GE*1*81001~
IEA*1*000000810~`,
  },
  {
    id: '820',
    code: '820',
    name: '820 Payment Order / Remittance Advice',
    standard: 'X12',
    functionalGroup: 'RA',
    category: 'Finance & Healthcare',
    description: 'Buyer ordering payment via bank ACH or notifying vendor which specific invoices are being settled.',
    purpose: 'Transfers remittance detail (invoice number, discounts taken, net paid) alongside or preceding electronic bank funds.',
    keySegments: ['ST', 'BPR', 'TRN', 'CUR', 'REF', 'N1', 'RMR', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*BUYER_RETAIL   *ZZ*ACME_SUPPLIER  *260904*1800*U*00401*000000820*0*P*>~
GS*RA*BUYER_RETAIL*ACME_SUPPLIER*20260904*1800*82001*X*004010~
ST*820*0001~
BPR*C*3822.00*C*ACH*CTX*01*123456789*DA*987654321***01*987654321*DA*123456789*20260904~
TRN*1*CHK-2026-9901*1234567890~
CUR*PR*USD~
N1*PR*BUYER RETAIL CORP*91*BUY01~
N1*PE*ACME SUPPLIER CORP*91*ACME1~
RMR*IV*INV-2026-4401*PO*3900.00*3822.00*78.00~
SE*9*0001~
GE*1*82001~
IEA*1*000000820~`,
  },
  {
    id: '846',
    code: '846',
    name: '846 Inventory Inquiry / Advice',
    standard: 'X12',
    functionalGroup: 'IB',
    category: 'Supply Chain & Retail',
    description: 'Vendor or warehouse providing real-time inventory on-hand, safety stock, backorders, and committed quantities.',
    purpose: 'Ensures omni-channel retailers and drop-shippers have accurate available-to-promise (ATP) quantities.',
    keySegments: ['ST', 'BIA', 'N1', 'LIN', 'QTY', 'UIT', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*0800*U*00401*000000846*0*P*>~
GS*IB*ACME_SUPPLIER*BUYER_RETAIL*20260904*0800*84601*X*004010~
ST*846*0001~
BIA*00*MB*STK-2026-0904*20260904~
N1*WH*CENTRAL STOCK LOCATION*91*STK01~
LIN*1*VN*SKU-A101*UP*012345678901~
QTY*33*850*CA~
UIT*CA~
LIN*2*VN*SKU-B202*UP*012345678918~
QTY*33*320*CA~
UIT*CA~
CTT*2~
SE*11*0001~
GE*1*84601~
IEA*1*000000846~`,
  },
  {
    id: '852',
    code: '852',
    name: '852 Product Activity Data (POS & Sales Reporting)',
    standard: 'X12',
    functionalGroup: 'PD',
    category: 'Supply Chain & Retail',
    description: 'Retail point-of-sale (POS) data, historical turnover, and inventory positions sent to vendors (VMI).',
    purpose: 'Used in Vendor-Managed Inventory (VMI) arrangements so the manufacturer can plan automated replenishment.',
    keySegments: ['ST', 'XQ', 'N1', 'LIN', 'ZA', 'QTY', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*BUYER_RETAIL   *ZZ*ACME_SUPPLIER  *260904*0600*U*00401*000000852*0*P*>~
GS*PD*BUYER_RETAIL*ACME_SUPPLIER*20260904*0600*85201*X*004010~
ST*852*0001~
XQ*H*20260828*20260903~
N1*ST*STORE #4022*92*STR4022~
LIN*1*VN*SKU-A101*UP*012345678901~
ZA*QS*48*EA~
ZA*QA*120*EA~
LIN*2*VN*SKU-B202*UP*012345678918~
ZA*QS*22*EA~
ZA*QA*40*EA~
CTT*2~
SE*11*0001~
GE*1*85201~
IEA*1*000000852~`,
  },
  {
    id: '830',
    code: '830',
    name: '830 Planning Schedule with Release Capability',
    standard: 'X12',
    functionalGroup: 'PS',
    category: 'Manufacturing & Automotive',
    description: 'Long-term forecasting and firm short-term delivery releases for Just-In-Time (JIT) manufacturing.',
    purpose: 'Transmits multi-week or multi-month production forecasts and committed release dates to tier-1 part suppliers.',
    keySegments: ['ST', 'BFR', 'N1', 'LIN', 'FST', 'SDP', 'CTT', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*AUTO_OEM_MFG   *ZZ*TIER1_PARTS    *260904*0700*U*00401*000000830*0*P*>~
GS*PS*AUTO_OEM_MFG*TIER1_PARTS*20260904*0700*83001*X*004010~
ST*830*0001~
BFR*00*SCHED-2026-W36*01*DL*20260904*20261130*20260904~
N1*MI*DETROIT ASSEMBLY PLANT #4*92*PLANT04~
N1*SU*TIER 1 SUSPENSION SYSTEMS*91*VEND88~
LIN*1*BP*PART-99042*EC*REV-C~
UIT*EA~
FST*500*C*D*20260908~
FST*500*C*D*20260915~
FST*600*D*W*20260922~
FST*600*D*W*20260929~
CTT*1~
SE*12*0001~
GE*1*83001~
IEA*1*000000830~`,
  },
  {
    id: '862',
    code: '862',
    name: '862 Shipping Schedule (Just-In-Time Pull Signal)',
    standard: 'X12',
    functionalGroup: 'SS',
    category: 'Manufacturing & Automotive',
    description: 'Exact, hourly or daily shipment pull instructions for automotive and lean assembly lines.',
    purpose: 'Supplements the 830 forecast with precise loading dock arrival windows, container types, and sequence.',
    keySegments: ['ST', 'BSS', 'DTM', 'N1', 'LIN', 'FST', 'SHP', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*AUTO_OEM_MFG   *ZZ*TIER1_PARTS    *260904*0730*U*00401*000000862*0*P*>~
GS*SS*AUTO_OEM_MFG*TIER1_PARTS*20260904*0730*86201*X*004010~
ST*862*0001~
BSS*00*SS-2026-0904*20260904*BB*20260904*20260905~
DTM*097*20260904*0800~
N1*ST*DOCK 4A - CHASSIS LINE*92*DOCK04~
LIN*1*BP*PART-99042*EC*REV-C~
UIT*EA~
FST*120*C*D*20260904*0930~
FST*120*C*D*20260904*1330~
SHP*02*240*011*20260903~
SE*10*0001~
GE*1*86201~
IEA*1*000000862~`,
  },
  // ==========================================
  // 2. LOGISTICS & WAREHOUSING (3PL)
  // ==========================================
  {
    id: '204',
    code: '204',
    name: '204 Motor Carrier Load Tender',
    standard: 'X12',
    functionalGroup: 'SM',
    category: 'Logistics & Warehousing',
    description: 'Shipper tendering a truckload or LTL freight pickup and delivery consignment to a carrier.',
    purpose: 'Offers a freight load to a trucking carrier or broker with equipment requirements, pickup times, and stops.',
    keySegments: ['ST', 'B2', 'B2A', 'MS3', 'N1', 'N3', 'N4', 'S5', 'L11', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*SHIPPER_CORP   *ZZ*CARRIER_TRUCK  *260904*0900*U*00401*000000204*0*P*>~
GS*SM*SHIPPER_CORP*CARRIER_TRUCK*20260904*0900*20401*X*004010~
ST*204*0001~
B2**FDEG*LOAD-99441**PP~
B2A*00~
MS3*FDEG*B~
N1*SH*CONSIGNOR WAREHOUSE*91*WH01~
N3*500 FREIGHT RD~
N4*MEMPHIS*TN*38101*US~
N1*CN*CONSIGNEE TERMINAL*92*CN02~
N3*99 DISTRIBUTION PARK~
N4*DALLAS*TX*75201*US~
S5*1*CL*42500*G*1400*E~
L11*BOL-2026-9901*BM~
SE*12*0001~
GE*1*20401~
IEA*1*000000204~`,
  },
  {
    id: '990',
    code: '990',
    name: '990 Response to a Load Tender',
    standard: 'X12',
    functionalGroup: 'GF',
    category: 'Logistics & Warehousing',
    description: 'Carrier accepting (A) or declining (D) a 204 motor carrier freight tender offer.',
    purpose: 'Informs shipper whether the booked truck is confirmed or if the load needs to be re-tendered to another carrier.',
    keySegments: ['ST', 'B1', 'N9', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*CARRIER_TRUCK  *ZZ*SHIPPER_CORP   *260904*0920*U*00401*000000990*0*P*>~
GS*GF*CARRIER_TRUCK*SHIPPER_CORP*20260904*0920*99001*X*004010~
ST*990*0001~
B1*FDEG*LOAD-99441*20260904*A~
N9*CN*DISPATCH-UNIT-441~
SE*4*0001~
GE*1*99001~
IEA*1*000000990~`,
  },
  {
    id: '214',
    code: '214',
    name: '214 Transportation Carrier Shipment Status Message',
    standard: 'X12',
    functionalGroup: 'QM',
    category: 'Logistics & Warehousing',
    description: 'Carrier tracking milestones: dispatched, departed terminal, in-transit checkpoint, out for delivery, delivered.',
    purpose: 'Provides freight visibility to shippers and receivers throughout the transit lifecycle.',
    keySegments: ['ST', 'B10', 'LX', 'AT7', 'MS1', 'MS2', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*CARRIER_TRUCK  *ZZ*SHIPPER_CORP   *260904*1500*U*00401*000000214*0*P*>~
GS*QM*CARRIER_TRUCK*SHIPPER_CORP*20260904*1500*21401*X*004010~
ST*214*0001~
B10*BOL-2026-9901*LOAD-99441*FDEG~
LX*1~
AT7*D1*NS***20260904*1435*LT~
MS1*DALLAS*TX*US~
MS2*FDEG*TRUCK-8812~
SE*7*0001~
GE*1*21401~
IEA*1*000000214~`,
  },
  {
    id: '210',
    code: '210',
    name: '210 Motor Carrier Freight Details and Invoice',
    standard: 'X12',
    functionalGroup: 'IM',
    category: 'Logistics & Warehousing',
    description: 'Carrier billing shipper or 3rd-party payer for freight transportation services rendered.',
    purpose: 'Itemizes linehaul rates, fuel surcharges, detention charges, and accessorial fees.',
    keySegments: ['ST', 'B3', 'C3', 'N1', 'N3', 'N4', 'LX', 'L5', 'L0', 'L1', 'L3', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*CARRIER_TRUCK  *ZZ*SHIPPER_CORP   *260904*1900*U*00401*000000210*0*P*>~
GS*IM*CARRIER_TRUCK*SHIPPER_CORP*20260904*1900*21001*X*004010~
ST*210*0001~
B3*B*FRT-2026-8812*BOL-2026-9901*PP**20260904*185000**20260904*FDEG~
C3*USD~
N1*SH*CONSIGNOR WAREHOUSE*91*WH01~
N1*CN*CONSIGNEE TERMINAL*92*CN02~
N1*PR*SHIPPER BILLING ACCOUNTS*91*SHIP01~
LX*1~
L5*1*DRY GROCERY PALLETS*50000*G~
L0*1*42500*G*1400*E~
L1*1*160000*FR*160000~
L1*2*25000*FSC*25000****FUEL SURCHARGE~
L3*42500*G***185000~
SE*13*0001~
GE*1*21001~
IEA*1*000000210~`,
  },
  {
    id: '940',
    code: '940',
    name: '940 Warehouse Shipping Order',
    standard: 'X12',
    functionalGroup: 'OW',
    category: 'Logistics & Warehousing',
    description: 'Depositor instructing a third-party logistics (3PL) warehouse to pick, pack, and ship orders.',
    purpose: 'Transfers pick-ticket instructions from an ERP or merchant order system to a 3PL fulfillment warehouse.',
    keySegments: ['ST', 'W05', 'N1', 'N3', 'N4', 'N9', 'G62', 'W01', 'G69', 'W76', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*MERCHANT_BRAND *ZZ*3PL_WAREHOUSE  *260904*1030*U*00401*000000940*0*P*>~
GS*OW*MERCHANT_BRAND*3PL_WAREHOUSE*20260904*1030*94001*X*004010~
ST*940*0001~
W05*N*SO-2026-88901*PO-2026-9901~
N1*ST*CUSTOMER DELIVERY DOCK*92*CUST01~
N3*400 COMMERCE ST~
N4*AUSTIN*TX*78701*US~
N9*BM*BOL-REQ-4401~
G62*10*20260905~
W01*100*CA*012345678901*UP*SKU-A101*VN~
G69*PREMIUM COTTON CREW SHIRT 12PK~
W76*100*1200*LB~
SE*10*0001~
GE*1*94001~
IEA*1*000000940~`,
  },
  {
    id: '945',
    code: '945',
    name: '945 Warehouse Shipping Advice',
    standard: 'X12',
    functionalGroup: 'SW',
    category: 'Logistics & Warehousing',
    description: '3PL warehouse confirming completed shipment back to the merchant/depositor with tracking details.',
    purpose: 'Closes out the 940 warehouse order so the merchant can notify customer, generate ASN, or trigger invoicing.',
    keySegments: ['ST', 'W06', 'N1', 'N9', 'G62', 'W12', 'G69', 'W03', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*3PL_WAREHOUSE  *ZZ*MERCHANT_BRAND *260904*1630*U*00401*000000945*0*P*>~
GS*SW*3PL_WAREHOUSE*MERCHANT_BRAND*20260904*1630*94501*X*004010~
ST*945*0001~
W06*N*SO-2026-88901*20260904*BOL-2026-9901~
N1*ST*CUSTOMER DELIVERY DOCK*92*CUST01~
N9*2I*TRK-990144882109~
G62*11*20260904~
W12*CC*100*100*0*CA*012345678901*UP*SKU-A101*VN~
G69*PREMIUM COTTON CREW SHIRT 12PK~
W03*100*1200*LB~
SE*9*0001~
GE*1*94501~
IEA*1*000000945~`,
  },
  {
    id: '943',
    code: '943',
    name: '943 Warehouse Stock Transfer Shipment Advice',
    standard: 'X12',
    functionalGroup: 'AR',
    category: 'Logistics & Warehousing',
    description: 'Informs 3PL warehouse that a replenishment shipment of inventory is on its way to the warehouse.',
    purpose: 'Gives the receiving warehouse advance notice of inbound purchase orders or factory inventory arrivals.',
    keySegments: ['ST', 'W06', 'N1', 'G62', 'W04', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*MERCHANT_BRAND *ZZ*3PL_WAREHOUSE  *260904*0915*U*00401*000000943*0*P*>~
GS*AR*MERCHANT_BRAND*3PL_WAREHOUSE*20260904*0915*94301*X*004010~
ST*943*0001~
W06*N*TRF-2026-0041*20260904**BOL-TRF-01~
N1*WH*3PL CENTRAL RECEIVING*91*WH01~
G62*17*20260905~
W04*500*CA*012345678901*UP*SKU-A101*VN~
SE*6*0001~
GE*1*94301~
IEA*1*000000943~`,
  },
  {
    id: '944',
    code: '944',
    name: '944 Warehouse Stock Transfer Receipt Advice',
    standard: 'X12',
    functionalGroup: 'RE',
    category: 'Logistics & Warehousing',
    description: '3PL warehouse confirming inventory received into warehouse racks, noting overages, shortages, or damaged units.',
    purpose: 'Reconciles inbound shipments against 943 expectations to update inventory in stock management systems.',
    keySegments: ['ST', 'W17', 'N1', 'G62', 'W07', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*3PL_WAREHOUSE  *ZZ*MERCHANT_BRAND *260904*1430*U*00401*000000944*0*P*>~
GS*RE*3PL_WAREHOUSE*MERCHANT_BRAND*20260904*1430*94401*X*004010~
ST*944*0001~
W17*F*20260904*RCPT-99881*TRF-2026-0041~
N1*WH*3PL CENTRAL RECEIVING*91*WH01~
G62*11*20260904~
W07*500*CA*012345678901*UP*SKU-A101*VN~
SE*6*0001~
GE*1*94401~
IEA*1*000000944~`,
  },
  // ==========================================
  // 3. HEALTHCARE & INSURANCE (HIPAA 5010)
  // ==========================================
  {
    id: '837',
    code: '837P',
    name: '837 Health Care Claim (Professional / Institutional / Dental)',
    standard: 'X12',
    functionalGroup: 'HC',
    category: 'Finance & Healthcare',
    description: 'Healthcare providers billing insurance plans (Medicare, Medicaid, commercial payers) for patient medical services.',
    purpose: 'Standard HIPAA 5010 electronic healthcare claim submission.',
    keySegments: ['ST', 'BHT', 'NM1', 'N3', 'N4', 'PER', 'HL', 'PRV', 'SBR', 'PAT', 'CLM', 'HI', 'LX', 'SV1', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*CLINIC_MED     *ZZ*HEALTH_INSUR   *260904*1100*U*00501*000000837*0*P*>~
GS*HC*CLINIC_MED*HEALTH_INSUR*20260904*1100*83701*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*00*CLAIM-2026-001*20260904*1100*CH~
NM1*41*2*VALLEY MEDICAL CLINIC*****46*123456789~
PER*IC*BILLING OFFICE*TE*5550188~
NM1*40*2*BLUE CROSS BLUE SHIELD*****46*BCBS001~
HL*1**20*1~
PRV*BI*PXC*207Q00000X~
NM1*85*2*VALLEY MEDICAL CLINIC*****XX*1982736450~
N3*100 HEALTH BLVD~
N4*PHOENIX*AZ*85001~
HL*2*1*22*0~
SBR*P*18*******CI~
NM1*IL*1*SMITH*JANE****MI*W123456780~
N3*456 MAPLE AVE~
N4*SCOTTSDALE*AZ*85251~
DMG*D8*19850412*F~
NM1*PR*BLUE CROSS BLUE SHIELD*****PI*BCBS001~
CLM*CLM-99120*150.00***11:B:1*Y*A*Y*Y~
HI*BK:J029~
LX*1~
SV1*HC:99213*150.00*UN*1***1~
DTP*472*D8*20260903~
SE*23*0001~
GE*1*83701~
IEA*1*000000837~`,
  },
  {
    id: '835',
    code: '835',
    name: '835 Health Care Claim Payment / Advice (ERA)',
    standard: 'X12',
    functionalGroup: 'HP',
    category: 'Finance & Healthcare',
    description: 'Health plan sending electronic remittance advice (ERA) and claims settlement details to healthcare providers.',
    purpose: 'Informs clinics and hospitals which medical claims were approved, co-pay responsibilities, or reasons for denial (CARC codes).',
    keySegments: ['ST', 'BPR', 'TRN', 'REF', 'N1', 'LX', 'CLP', 'CAS', 'NM1', 'SVC', 'DTM', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*HEALTH_INSUR   *ZZ*CLINIC_MED     *260904*1200*U*00501*000000835*0*P*>~
GS*HP*HEALTH_INSUR*CLINIC_MED*20260904*1200*83501*X*005010X221A1~
ST*835*0001~
BPR*I*120.00*C*ACH*CCP*01*011000015*DA*12345678*1234567890**01*043000096*DA*98765432*20260904~
TRN*1*ERA-2026-9901*1999999999~
N1*PR*BLUE CROSS BLUE SHIELD~
N1*PE*VALLEY MEDICAL CLINIC*XX*1982736450~
LX*1~
CLP*CLM-99120*1*150.00*120.00*30.00*MC*BCBS-REF-01~
CAS*PR*1*30.00~
NM1*QC*1*SMITH*JANE****MI*W123456780~
SVC*HC:99213*150.00*120.00~
DTM*472*20260903~
CAS*CO*45*30.00~
SE*14*0001~
GE*1*83501~
IEA*1*000000835~`,
  },
  {
    id: '270',
    code: '270',
    name: '270 Health Care Eligibility Benefit Inquiry',
    standard: 'X12',
    functionalGroup: 'HS',
    category: 'Finance & Healthcare',
    description: 'Medical provider querying insurance company regarding patient active coverage, co-pays, and deductibles.',
    purpose: 'Verifies insurance coverage before conducting medical procedures.',
    keySegments: ['ST', 'BHT', 'HL', 'NM1', 'DMG', 'EQ', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*CLINIC_MED     *ZZ*HEALTH_INSUR   *260904*0945*U*00501*000000270*0*P*>~
GS*HS*CLINIC_MED*HEALTH_INSUR*20260904*0945*27001*X*005010X279A1~
ST*270*0001*005010X279A1~
BHT*0022*13*INQ-2026-001*20260904*0945~
HL*1**20*1~
NM1*PR*2*BLUE CROSS BLUE SHIELD*****PI*BCBS001~
HL*2*1*21*1~
NM1*1P*1*JOHNSON*ROBERT****XX*1982736450~
HL*3*2*22*0~
NM1*IL*1*SMITH*JANE****MI*W123456780~
DMG*D8*19850412~
DTP*291*D8*20260904~
EQ*30~
SE*12*0001~
GE*1*27001~
IEA*1*000000270~`,
  },
  {
    id: '271',
    code: '271',
    name: '271 Health Care Eligibility Benefit Response',
    standard: 'X12',
    functionalGroup: 'HB',
    category: 'Finance & Healthcare',
    description: 'Payer responding to 270 inquiry confirming active eligibility, deductible balances, and network status.',
    purpose: 'Standard response confirming eligibility status (Active 1) and in-network co-pay specifics.',
    keySegments: ['ST', 'BHT', 'HL', 'NM1', 'EB', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*HEALTH_INSUR   *ZZ*CLINIC_MED     *260904*0946*U*00501*000000271*0*P*>~
GS*HB*HEALTH_INSUR*CLINIC_MED*20260904*0946*27101*X*005010X279A1~
ST*271*0001*005010X279A1~
BHT*0022*11*RESP-2026-001*20260904*0946~
HL*1**20*1~
NM1*PR*2*BLUE CROSS BLUE SHIELD*****PI*BCBS001~
HL*2*1*21*1~
NM1*1P*1*JOHNSON*ROBERT****XX*1982736450~
HL*3*2*22*0~
NM1*IL*1*SMITH*JANE****MI*W123456780~
EB*1**30~
EB*B**30***27*25.00~
SE*11*0001~
GE*1*27101~
IEA*1*000000271~`,
  },
  // ==========================================
  // 4. ADMINISTRATIVE & ACKNOWLEDGMENTS
  // ==========================================
  {
    id: 'TA1',
    code: 'TA1',
    name: 'TA1 Interchange Acknowledgment',
    standard: 'X12',
    functionalGroup: 'TI',
    category: 'Administrative & Acknowledgment',
    description: 'Technical envelope acknowledgment verifying outer ISA/IEA syntax, control numbers, and partner identifiers before group translation.',
    purpose: 'Generated directly by EDI gateways to report immediate acceptance (A), errors (E), or rejection (R) of the interchange header (ISA13 vs IEA02 control number, version, separators).',
    keySegments: ['ISA', 'TA1', 'IEA'],
    samplePayload: `ISA*00*          *00*          *ZZ*RECEIVER_CO    *ZZ*SENDER_CO      *260905*1200*U*00401*000000001*0*P*>~
TA1*000000850*260904*1000*A*000~
IEA*0*000000001~`,
  },
  {
    id: '997',
    code: '997',
    name: '997 Functional Acknowledgment',
    standard: 'X12',
    functionalGroup: 'FA',
    category: 'Administrative & Acknowledgment',
    description: 'Technical confirmation that an ANSI X12 interchange and transaction set was received and syntax-verified.',
    purpose: 'Reports syntax errors or confirmations (Accepted A, Rejected R, Accepted with Errors E) for audit trails.',
    keySegments: ['ST', 'AK1', 'AK2', 'AK3', 'AK4', 'AK5', 'AK9', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*RECEIVER_CO    *ZZ*SENDER_CO      *260904*1015*U*00401*000000997*0*P*>~
GS*FA*RECEIVER_CO*SENDER_CO*20260904*1015*99701*X*004010~
ST*997*0001~
AK1*PO*85001~
AK2*850*0001~
AK5*A~
AK9*A*1*1*1~
SE*6*0001~
GE*1*99701~
IEA*1*000000997~`,
  },
  {
    id: '999',
    code: '999',
    name: '999 Implementation Acknowledgment (HIPAA 5010)',
    standard: 'X12',
    functionalGroup: 'FA',
    category: 'Administrative & Acknowledgment',
    description: 'Modern HIPAA 5010 replacement for 997, validating deep TR3 implementation guide rules and segments.',
    purpose: 'Validates HIPAA implementation conventions beyond generic X12 syntax.',
    keySegments: ['ST', 'AK1', 'AK2', 'IK3', 'IK4', 'IK5', 'AK9', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*HEALTH_INSUR   *ZZ*CLINIC_MED     *260904*1115*U*00501*000000999*0*P*>~
GS*FA*HEALTH_INSUR*CLINIC_MED*20260904*1115*99901*X*005010X231A1~
ST*999*0001*005010X231A1~
AK1*HC*83701*005010X222A1~
AK2*837*0001*005010X222A1~
IK5*A~
AK9*A*1*1*1~
SE*6*0001~
GE*1*99901~
IEA*1*000000999~`,
  },
  {
    id: '824',
    code: '824',
    name: '824 Application Advice',
    standard: 'X12',
    functionalGroup: 'AG',
    category: 'Administrative & Acknowledgment',
    description: 'Application-level business acceptance or rejection (e.g. invalid customer ID, missing warehouse code).',
    purpose: 'Communicates business rule errors that passed syntax parsing (997) but failed application ingestion.',
    keySegments: ['ST', 'BGN', 'N1', 'OTI', 'TED', 'SE'],
    samplePayload: `ISA*00*          *00*          *ZZ*BUYER_RETAIL   *ZZ*ACME_SUPPLIER  *260904*1830*U*00401*000000824*0*P*>~
GS*AG*BUYER_RETAIL*ACME_SUPPLIER*20260904*1830*82401*X*004010~
ST*824*0001~
BGN*00*APP-ADV-9901*20260904*1830~
N1*FR*BUYER RETAIL CORP~
N1*TO*ACME SUPPLIER CORP~
OTI*TR*TN*PO*PO-2026-9901~
TED*024*VENDOR SKU-B202 DISCONTINUED BY BUYER CATEGORY~
SE*7*0001~
GE*1*82401~
IEA*1*000000824~`,
  },
  // ==========================================
  // 5. INTERNATIONAL EDIFACT STANDARDS
  // ==========================================
  {
    id: 'ORDERS',
    code: 'ORDERS',
    name: 'EDIFACT ORDERS (Purchase Order)',
    standard: 'EDIFACT',
    functionalGroup: 'ORDERS',
    category: 'Supply Chain & Retail',
    description: 'Global international purchase order message used across European, Asian, and worldwide supply chains.',
    purpose: 'International equivalent of ANSI X12 850.',
    keySegments: ['UNB', 'UNH', 'BGM', 'DTM', 'NAD', 'LIN', 'QTY', 'PRI', 'UNS', 'CNT', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOA:2+BUYER_GLOBAL:ZZZ+ACME_GLOBAL:ZZZ+260904:1000+00000001'
UNH+1+ORDERS:D:96A:UN'
BGM+220+ORD-2026-8801+9'
DTM+137:20260904:102'
NAD+BY+BUYER_GLOBAL::92'
NAD+SU+ACME_GLOBAL::91'
LIN+1++PROD-101:VN'
QTY+21:100:EA'
PRI+AAA:25.50'
LIN+2++PROD-202:VN'
QTY+21:50:EA'
PRI+AAA:40.00'
UNS+S'
CNT+2:2'
UNT+13+1'
UNZ+1+00000001'`,
  },
  {
    id: 'ORDRSP',
    code: 'ORDRSP',
    name: 'EDIFACT ORDRSP (Purchase Order Response)',
    standard: 'EDIFACT',
    functionalGroup: 'ORDRSP',
    category: 'Supply Chain & Retail',
    description: 'Supplier responding to an EDIFACT ORDERS message confirming acceptance, modifications, or line rejections.',
    purpose: 'International equivalent of ANSI X12 855.',
    keySegments: ['UNB', 'UNH', 'BGM', 'DTM', 'RFF', 'NAD', 'LIN', 'QTY', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOA:2+ACME_GLOBAL:ZZZ+BUYER_GLOBAL:ZZZ+260904:1100+00000002'
UNH+1+ORDRSP:D:96A:UN'
BGM+231+ORD-2026-8801+9'
DTM+137:20260904:102'
RFF+ON:ORD-2026-8801'
NAD+BY+BUYER_GLOBAL::92'
NAD+SU+ACME_GLOBAL::91'
LIN+1+1+PROD-101:VN'
QTY+113:100:EA'
LIN+2+1+PROD-202:VN'
QTY+113:50:EA'
UNT+11+1'
UNZ+1+00000002'`,
  },
  {
    id: 'ORDCHG',
    code: 'ORDCHG',
    name: 'EDIFACT ORDCHG (Purchase Order Change Request)',
    standard: 'EDIFACT',
    functionalGroup: 'ORDCHG',
    category: 'Supply Chain & Retail',
    description: 'Buyer requesting changes to a previously issued EDIFACT ORDERS message.',
    purpose: 'International equivalent of ANSI X12 860.',
    keySegments: ['UNB', 'UNH', 'BGM', 'DTM', 'RFF', 'NAD', 'LIN', 'QTY', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOA:2+BUYER_GLOBAL:ZZZ+ACME_GLOBAL:ZZZ+260904:1200+00000003'
UNH+1+ORDCHG:D:96A:UN'
BGM+230+ORD-2026-8801+9'
DTM+137:20260904:102'
RFF+ON:ORD-2026-8801'
NAD+BY+BUYER_GLOBAL::92'
LIN+1+3+PROD-101:VN'
QTY+21:120:EA'
UNT+8+1'
UNZ+1+00000003'`,
  },
  {
    id: 'DESADV',
    code: 'DESADV',
    name: 'EDIFACT DESADV (Despatch Advice / Shipping Notice)',
    standard: 'EDIFACT',
    functionalGroup: 'DESADV',
    category: 'Logistics & Warehousing',
    description: 'Despatch advice notifying receiver about consignment packages, transport details, and item breakdowns.',
    purpose: 'International equivalent of ANSI X12 856 ASN.',
    keySegments: ['UNB', 'UNH', 'BGM', 'DTM', 'RFF', 'NAD', 'CPS', 'PAC', 'LIN', 'QTY', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOA:2+ACME_GLOBAL:ZZZ+BUYER_GLOBAL:ZZZ+260904:1500+00000004'
UNH+1+DESADV:D:96A:UN'
BGM+351+DES-2026-9901+9'
DTM+137:20260904:102'
RFF+ON:ORD-2026-8801'
NAD+CN+BUYER_GLOBAL::92'
NAD+CZ+ACME_GLOBAL::91'
CPS+1'
PAC+2++CTN'
LIN+1++PROD-101:VN'
QTY+12:120:EA'
UNT+11+1'
UNZ+1+00000004'`,
  },
  {
    id: 'INVOIC',
    code: 'INVOIC',
    name: 'EDIFACT INVOIC (Commercial Invoice)',
    standard: 'EDIFACT',
    functionalGroup: 'INVOIC',
    category: 'Supply Chain & Retail',
    description: 'International commercial invoice message billing for exported, imported, or domestically delivered goods.',
    purpose: 'International equivalent of ANSI X12 810.',
    keySegments: ['UNB', 'UNH', 'BGM', 'DTM', 'RFF', 'NAD', 'LIN', 'QTY', 'MOA', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOA:2+ACME_GLOBAL:ZZZ+BUYER_GLOBAL:ZZZ+260904:1700+00000005'
UNH+1+INVOIC:D:96A:UN'
BGM+380+INV-2026-7701+9'
DTM+137:20260904:102'
RFF+ON:ORD-2026-8801'
NAD+BY+BUYER_GLOBAL::92'
NAD+SU+ACME_GLOBAL::91'
LIN+1++PROD-101:VN'
QTY+47:120:EA'
MOA+203:3060.00'
UNT+10+1'
UNZ+1+00000005'`,
  },
  {
    id: 'INVRPT',
    code: 'INVRPT',
    name: 'EDIFACT INVRPT (Inventory Report)',
    standard: 'EDIFACT',
    functionalGroup: 'INVRPT',
    category: 'Logistics & Warehousing',
    description: 'Inventory report specifying quantities of stock held in store, transit, or distribution centers.',
    purpose: 'International equivalent of ANSI X12 846.',
    keySegments: ['UNB', 'UNH', 'BGM', 'DTM', 'NAD', 'LIN', 'QTY', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOA:2+ACME_GLOBAL:ZZZ+BUYER_GLOBAL:ZZZ+260904:0800+00000006'
UNH+1+INVRPT:D:96A:UN'
BGM+35+INV-REP-2026-09+9'
DTM+137:20260904:102'
NAD+WH+CENTRAL_DEPOT::92'
LIN+1++PROD-101:VN'
QTY+145:850:EA'
LIN+2++PROD-202:VN'
QTY+145:320:EA'
UNT+9+1'
UNZ+1+00000006'`,
  },
  {
    id: 'CONTRL',
    code: 'CONTRL',
    name: 'EDIFACT CONTRL (Syntax & Service Acknowledgment)',
    standard: 'EDIFACT',
    functionalGroup: 'CONTRL',
    category: 'Administrative & Acknowledgment',
    description: 'EDIFACT receipt acknowledging UNB/UNH envelope integrity and reporting syntax validation status.',
    purpose: 'International equivalent of ANSI X12 997.',
    keySegments: ['UNB', 'UNH', 'UCI', 'UCM', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOA:2+RECEIVER_GLOBAL:ZZZ+SENDER_GLOBAL:ZZZ+260904:1020+00000007'
UNH+1+CONTRL:4:1'
UCI+00000001+BUYER_GLOBAL:ZZZ+ACME_GLOBAL:ZZZ+7'
UCM+1+ORDERS:D:96A:UN+7'
UNT+4+1'
UNZ+1+00000007'`,
  },
  {
    id: 'ORDERS-D16B',
    code: 'ORDERS:D:16B',
    name: 'EDIFACT ORDERS D.16B (GS1 Modern Standard)',
    standard: 'EDIFACT',
    functionalGroup: 'ORDERS',
    category: 'Supply Chain & Retail',
    description: 'Modern enterprise purchase order aligned with GS1 2016B global logistics attributes and serialization.',
    purpose: 'Modern international purchase order incorporating modern GTIN and GLN syntax.',
    keySegments: ['UNB', 'UNH', 'BGM', 'DTM', 'NAD', 'LIN', 'PIA', 'QTY', 'PRI', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOC:3+5412345000013:14+4012345000019:14+260904:1030+00001601'
UNH+1+ORDERS:D:16B:UN:EAN014'
BGM+220+PO-GS1-2026-9102+9'
DTM+137:20260904:102'
DTM+2:20260915:102'
NAD+BY+5412345000013::9'
NAD+SU+4012345000019::9'
LIN+1++4012345678901:SRV'
PIA+1+SKU-ENTERPRISE-16B:VN'
QTY+21:200:PCE'
PRI+AAA:19.75'
LIN+2++4012345678918:SRV'
PIA+1+SKU-ENTERPRISE-16C:VN'
QTY+21:100:PCE'
PRI+AAA:42.00'
UNS+S'
CNT+2:2'
UNT+15+1'
UNZ+1+00001601'`,
  },
  {
    id: 'DESADV-D23A',
    code: 'DESADV:D:23A',
    name: 'EDIFACT DESADV D.23A (UNECE Contemporary Release)',
    standard: 'EDIFACT',
    functionalGroup: 'DESADV',
    category: 'Logistics & Warehousing',
    description: 'Contemporary despatch advice supporting Digital Product Passport (DPP), carbon metrics, and advanced packaging.',
    purpose: 'Cutting-edge UNECE D.23A shipping notice with modern sustainability and traceability identifiers.',
    keySegments: ['UNB', 'UNH', 'BGM', 'DTM', 'RFF', 'NAD', 'CPS', 'PAC', 'LIN', 'QTY', 'UNT', 'UNZ'],
    samplePayload: `UNB+UNOD:4+5412345000013:14+4012345000019:14+260904:1530+00002301'
UNH+1+DESADV:D:23A:UN:EAN017'
BGM+351+DES-2026-23A-01+9'
DTM+137:20260904:102'
DTM+11:20260905:102'
RFF+ON:PO-GS1-2026-9102'
NAD+CN+5412345000013::9'
NAD+CZ+4012345000019::9'
CPS+1'
PAC+1++201::92'
PCI+33E'
GIN+ML+00354123450000001815'
LIN+1++4012345678901:SRV'
QTY+12:200:PCE'
UNT+14+1'
UNZ+1+00002301'`,
  },
  {
    id: '856-FSMA204',
    code: '856-FSMA',
    name: '856 ASN - FSMA 204 Food Traceability Compliant',
    standard: 'X12',
    functionalGroup: 'SH',
    category: 'Supply Chain & Retail',
    description: 'FDA Food Traceability Rule 204 compliant 856 ASN with Traceability Lot Code (TLC), TLCS GLN, and Harvest/Cooling/Packing dates.',
    purpose: 'Complete model implementation of FDA 21 CFR Part 1 Subpart S compliance for Food Traceability List (FTL) items.',
    keySegments: ['ST', 'BSN', 'DTM', 'HL', 'TD5', 'REF', 'N1', 'PRF', 'MAN', 'LIN', 'SN1', 'PID', 'SE'],
    samplePayload: FSMA_204_COMPLIANT_856,
  },
];

// Comprehensive Segment Dictionary for ANSI X12 and EDIFACT
export const COMPREHENSIVE_SEGMENT_DICTIONARY: Record<string, string> = {
  // Envelope
  ISA: 'Interchange Control Header',
  IEA: 'Interchange Control Trailer',
  GS: 'Functional Group Header',
  GE: 'Functional Group Trailer',
  ST: 'Transaction Set Header',
  SE: 'Transaction Set Trailer',

  // Common Headers & Beginning Segments
  BEG: 'Beginning Segment for Purchase Order (850)',
  BAK: 'Beginning Segment for Purchase Order Acknowledgment (855)',
  BCH: 'Beginning Segment for Purchase Order Change Request (860)',
  BCA: 'Beginning Segment for Purchase Order Change Acknowledgment (865)',
  BIG: 'Beginning Segment for Invoice (810)',
  BSN: 'Beginning Segment for Ship Notice / ASN (856)',
  B2: 'Beginning Segment for Motor Carrier Shipment (204)',
  B2A: 'Set Purpose (204)',
  B1: 'Beginning Segment for Booking or Tender Confirmation (990)',
  B3: 'Beginning Segment for Motor Carrier Invoice (210)',
  B10: 'Beginning Segment for Motor Carrier Status (214)',
  BIA: 'Beginning Segment for Inventory Inquiry/Advice (846)',
  BPR: 'Beginning Segment for Payment Order/Remittance (820/835)',
  BGN: 'Beginning Segment for Application Advice (824)',
  BHT: 'Beginning of Hierarchical Transaction (837/270/271)',
  BFR: 'Beginning Segment for Planning Schedule (830)',
  BSS: 'Beginning Segment for Shipping Schedule (862)',
  W05: 'Warehouse Shipping Order Identification (940)',
  W06: 'Warehouse Shipment Advice Identification (945/943)',
  W17: 'Warehouse Receipt Identification (944)',
  XQ: 'Reporting Date/Time (852 Product Activity)',

  // General Segments
  CUR: 'Currency Identification',
  REF: 'Reference Identification',
  PER: 'Administrative Communications Contact',
  N1: 'Party Identification (Name)',
  N2: 'Additional Name Information',
  N3: 'Party Location (Address)',
  N4: 'Geographic Location (City, State, Zip)',
  DTM: 'Date/Time Reference',
  FOB: 'F.O.B. Related Instructions',
  ITD: 'Terms of Sale / Deferred Terms',
  TXI: 'Tax Information',
  CAD: 'Carrier Detail',
  SAC: 'Service, Promotion, Allowance, or Charge Information',
  PKG: 'Marking, Packaging, Loading',
  TD1: 'Carrier Details (Quantity & Weight)',
  TD3: 'Carrier Details (Equipment)',
  TD4: 'Carrier Details (Special Handling)',
  TD5: 'Carrier Details (Routing Sequence / Transit Time)',
  MS1: 'Equipment, Shipment, or Real Property Location',
  MS2: 'Equipment Details',
  MS3: 'Intermodal Service Response Information',
  MAN: 'Marks and Numbers (Barcode / GS1-128 / UCC-128)',
  L11: 'Business Support Variable / Reference Identifier',
  S5: 'Stop-off Details',
  AT7: 'Shipment Status Details',
  LX: 'Assigned Number / Loop Header',

  // Line Items & Detail Segments
  PO1: 'Baseline Item Data (Purchase Order)',
  POC: 'Line Item Change (860/865)',
  ACK: 'Line Item Acknowledgment (855/865)',
  IT1: 'Baseline Item Data (Invoice)',
  LIN: 'Item Identification',
  SN1: 'Item Detail (Shipment / Quantity Shipped)',
  PID: 'Product/Item Description',
  MEA: 'Measurements',
  QTY: 'Quantity Information',
  UIT: 'Unit of Measure Detail',
  TDS: 'Total Monetary Value Summary',
  CTT: 'Transaction Totals',
  PRF: 'Purchase Order Reference',
  HL: 'Hierarchical Level (SOPI: Shipment-Order-Pack-Item)',

  // Warehousing Segments
  W01: 'Line Item Detail (Warehouse 940)',
  W03: 'Total Shipping Order (945)',
  W04: 'Warehouse Detail (943)',
  W07: 'Item Detail Received (944)',
  W12: 'Warehouse Item Detail (945)',
  W76: 'Total Shipping Order (940)',
  G62: 'Date/Time (Warehouse)',
  G69: 'Line Item Detail - Description',
  N9: 'Reference Identification (Warehouse)',

  // Automotive / JIT Segments
  FST: 'Forecast Schedule / Release Quantity',
  SDP: 'Ship/Delivery Pattern',
  SHP: 'Shipped / Received Information',
  ZA: 'Product Activity Reporting (POS/Sales 852)',

  // Acknowledgments
  TA1: 'Interchange Acknowledgment (Outer Envelope)',
  AK1: 'Functional Group Response Header (997)',
  AK2: 'Transaction Set Response Header (997)',
  AK3: 'Data Segment Note (997)',
  AK4: 'Data Element Note (997)',
  AK5: 'Transaction Set Response Trailer (997)',
  AK9: 'Functional Group Response Trailer (997)',
  IK3: 'Error Segment Identification (999)',
  IK4: 'Element Error Identification (999)',
  IK5: 'Transaction Set Response Trailer (999)',
  OTI: 'Original Transaction Identification (824)',
  TED: 'Technical Error Description (824)',

  // Healthcare / HIPAA 5010 Segments
  CLM: 'Health Claim Information (837)',
  HI: 'Health Care Information Codes (ICD-10 / Diagnosis)',
  SV1: 'Professional Service (CPT / HCPCS Code)',
  SBR: 'Subscriber Information',
  PRV: 'Billing Provider Specialty Information',
  PAT: 'Patient Information',
  CLP: 'Claim Level Data (835 ERA)',
  CAS: 'Claims Adjustment (CARC / RARC)',
  SVC: 'Service Payment Information (835)',
  EQ: 'Eligibility or Benefit Inquiry (270)',
  EB: 'Eligibility or Benefit Information (271)',
  TRN: 'Trace / Check / EFT Reference Number',

  // EDIFACT Segments
  UNB: 'Interchange Header (EDIFACT)',
  UNZ: 'Interchange Trailer (EDIFACT)',
  UNH: 'Message Header (EDIFACT)',
  UNT: 'Message Trailer (EDIFACT)',
  BGM: 'Beginning of Message (EDIFACT)',
  RFF: 'Reference (EDIFACT)',
  NAD: 'Name and Address (EDIFACT)',
  CTA: 'Contact Information (EDIFACT)',
  COM: 'Communication Contact (EDIFACT)',
  CPS: 'Consignment Packing Sequence (DESADV)',
  PAC: 'Package (EDIFACT)',
  PCI: 'Package Identification (EDIFACT)',
  GIR: 'Goods Item Identification (EDIFACT)',
  PRI: 'Price Details (EDIFACT)',
  MOA: 'Monetary Amount (EDIFACT)',
  TAX: 'Duty/Tax/Fee Details (EDIFACT)',
  UNS: 'Section Control (EDIFACT)',
  CNT: 'Control Total (EDIFACT)',
  UCI: 'Interchange Response (CONTRL)',
  UCM: 'Message Response (CONTRL)',
};

export interface EdifactVersionBadgeInfo {
  directory: string;
  standard: string;
  messageType?: string;
  syntaxVersion?: string;
  controllingAgency?: string;
  era: 'Legacy Baseline' | 'Modern Enterprise Standard' | 'Contemporary Release';
  label: string;
  badgeClass: string;
  description: string;
}

export function detectEdifactVersion(content: string): EdifactVersionBadgeInfo | null {
  if (!content) return null;
  const unhMatch = content.match(/UNH\s*[\+\*]\s*[^+'*]+\s*[\+\*]\s*([A-Z0-9]+)\s*:\s*([A-Z0-9]+)\s*:\s*([A-Z0-9]+)\s*(?::\s*([A-Z0-9]+))?/i);
  let syntaxVersion = '';
  const unbMatch = content.match(/UNB\s*[\+\*]\s*([A-Z0-9]+:[0-9]+)/i);
  if (unbMatch) {
    syntaxVersion = unbMatch[1];
  }

  if (unhMatch) {
    const msgType = unhMatch[1].toUpperCase();
    const dirPrefix = unhMatch[2].toUpperCase();
    const release = unhMatch[3].toUpperCase();
    const agency = unhMatch[4]?.toUpperCase() || 'UN';
    const directory = `${dirPrefix}.${release}`;

    if (release.startsWith('96') || release.startsWith('97') || release.startsWith('90')) {
      return {
        directory,
        standard: 'UN/EDIFACT',
        messageType: msgType,
        syntaxVersion: syntaxVersion || 'UNOA:2',
        controllingAgency: agency,
        era: 'Legacy Baseline',
        label: `EDIFACT ${directory} (EANCOM Classic)`,
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        description: 'Baseline 1996/1997 United Nations EDIFACT directory. Universally supported by legacy retail, EANCOM 97, and classic EDI translators.',
      };
    } else if (release.startsWith('16') || release.startsWith('14') || release.startsWith('18') || release.startsWith('01') || release.startsWith('02')) {
      return {
        directory,
        standard: 'UN/EDIFACT',
        messageType: msgType,
        syntaxVersion: syntaxVersion || 'UNOC:3',
        controllingAgency: agency,
        era: 'Modern Enterprise Standard',
        label: `EDIFACT ${directory} (GS1 Modern Standard)`,
        badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        description: 'Modern global supply chain standard directory (GS1 2016B) with enhanced GS1 Application Identifiers, global logistics attributes, and serialization.',
      };
    } else if (release.startsWith('23') || release.startsWith('22') || release.startsWith('24') || release.startsWith('21')) {
      return {
        directory,
        standard: 'UN/EDIFACT',
        messageType: msgType,
        syntaxVersion: syntaxVersion || 'UNOD:4',
        controllingAgency: agency,
        era: 'Contemporary Release',
        label: `EDIFACT ${directory} (UNECE Contemporary)`,
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        description: 'Contemporary UNECE release featuring modern Digital Product Passport (DPP) attributes, Scope-3 carbon reporting, and circular economy tracking.',
      };
    }

    return {
      directory,
      standard: 'UN/EDIFACT',
      messageType: msgType,
      syntaxVersion: syntaxVersion || 'UNOB:2',
      controllingAgency: agency,
      era: 'Modern Enterprise Standard',
      label: `EDIFACT ${directory}`,
      badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      description: `EDIFACT Directory Release ${directory} governed by ${agency}.`,
    };
  }

  if (content.includes('UNB') || content.includes('UNH') || content.includes('UNZ')) {
    return {
      directory: 'D.96A',
      standard: 'UN/EDIFACT',
      syntaxVersion: syntaxVersion || 'UNOA:2',
      controllingAgency: 'UN',
      era: 'Legacy Baseline',
      label: 'EDIFACT D.96A (Detected)',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      description: 'EDIFACT interchange syntax detected.',
    };
  }

  return null;
}
