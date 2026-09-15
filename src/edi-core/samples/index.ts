import { MockPartner } from '../models/envelope';
export * from './presets';

export const FIXTURE_X12_850 = `ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260912*0830*U*00401*000000850*0*P*>~
GS*PO*NORTHWIND*CONTOSO*20260912*0830*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-DEMO-10042**20260912~
CUR*SE*USD~
REF*DP*042~
N1*BT*CONTOSO RETAIL*9*0012345678900~
N3*100 CONTOSO WAY~
N4*REDMOND*WA*98052~
N1*ST*CONTOSO DISTRIBUTION DC #4*9*0098765432100~
N3*1200 LOGISTICS WAY~
N4*DALLAS*TX*75201~
PO1*1*150*EA*45.00**VN*SKU-A101*UP*012345678905~
PID*F****INDUSTRIAL SMART SENSOR MODULE 24V~
PO1*2*75*EA*120.00**VN*SKU-B202*UP*012345678912~
PID*F****WIRELESS TELEMETRY GATEWAY IP67~
CTT*2*225~
SE*16*0001~
GE*1*85001~
IEA*1*000000850~`;

export const FIXTURE_X12_860 = `ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260912*0900*U*00401*000000860*0*P*>~
GS*PC*NORTHWIND*CONTOSO*20260912*0900*86001*X*004010~
ST*860*0001~
BCH*04*NE*PO-DEMO-10042**01*20260912~
CUR*SE*USD~
REF*DP*042~
N1*BT*CONTOSO RETAIL*9*0012345678900~
N1*ST*CONTOSO DISTRIBUTION DC #4*9*0098765432100~
POC*1*CA*200*150*EA*45.00**VN*SKU-A101~
PID*F****INDUSTRIAL SMART SENSOR MODULE 24V - QUANTITY INCREASE~
CTT*1*200~
SE*11*0001~
GE*1*86001~
IEA*1*000000860~`;

export const FIXTURE_X12_944 = `ISA*00*          *00*          *ZZ*FABRIKAM       *ZZ*CONTOSO        *260912*1100*U*00401*000000944*0*P*>~
GS*RE*FABRIKAM*CONTOSO*20260912*1100*94401*X*004010~
ST*944*0001~
W17*F*WR-DEMO-5544*20260912*DEPO-991*REC-887~
N1*WH*FABRIKAM LOGISTICS DC WEST*9*004455667788~
N1*DE*NORTHWIND TRADING*9*0012345678900~
W07*150*EA*VN*SKU-A101~
W07*75*EA*VN*SKU-B202~
W14*225~
SE*9*0001~
GE*1*94401~
IEA*1*000000944~`;

export const FIXTURE_X12_837_CLAIM = `ISA*00*          *00*          *ZZ*HORIZON        *ZZ*SUMMIT         *260912*0915*^*00501*000000837*0*P*:~
GS*HC*HORIZON*SUMMIT*20260912*0915*83701*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*00*CLAIM-DEMO-9901*20260912*0915*CH~
NM1*41*2*HORIZON CLINICAL MEDICAL*****46*987654321~
PER*IC*CLAIMS DEPT*TE*8005550199~
NM1*40*2*SUMMIT HEALTH PLAN*****46*543216789~
HL*1**20*1~
NM1*85*2*HORIZON CLINIC LLC*****XX*1982736450~
N3*400 MEDICAL PARKWAY~
N4*ORLANDO*FL*32801~
HL*2*1*22*0~
SBR*P*18*******CI~
NM1*IL*1*DOE*JANE*M***MI*W123456789~
DMG*D8*19800512*M~
NM1*PR*2*SUMMIT HEALTH PLAN*****PI*PAYER001~
CLM*CLM-DEMO-001*285.00***11:B:1*Y*A*Y*Y~
HI*BK:M545*BF:M542~
LX*1~
SV1*HC:99214*150.00*UN*1***1~
DTP*472*D8*20260910~
LX*2~
SV1*HC:72148*135.00*UN*1***2~
DTP*472*D8*20260910~
SE*23*0001~
GE*1*83701~
IEA*1*000000837~`;

export const FIXTURE_X12_214_LOGISTICS = `ISA*00*          *00*          *ZZ*TAILWIND       *ZZ*CONTOSO        *260912*1045*U*00401*000000214*0*P*>~
GS*QM*TAILWIND*CONTOSO*20260912*1045*21401*X*004010~
ST*214*0001~
B10*BOL-DEMO-98214*PO-DEMO-10042*TLWCARRIER~
L11*PRO-DEMO-778899*PRO~
N1*SH*FABRIKAM DC WEST~
N1*CN*CONTOSO RETAIL~
LX*1~
AT7*X6*NS***20260912*1030*LT~
MS1*DALLAS*TX*USA~
MS2*TLWCARRIER*TRK-902~
SE*10*0001~
GE*1*21401~
IEA*1*000000214~`;

export const FIXTURE_AS2_MESSAGE = `POST /as2/receive HTTP/1.1
Host: as2.codepackr.com
AS2-Version: 1.2
AS2-From: NORTHWIND_AS2
AS2-To: CONTOSO_AS2
Message-ID: <AS2-20260912-083000-9876@northwindtrading.demo>
Subject: EDI X12 850 Purchase Order Transmission
Content-Type: multipart/signed; protocol="application/pkcs7-signature"; micalg=sha-256; boundary="----=_Part_2026_AS2_BOUNDARY_X987"
Date: Sat, 12 Sep 2026 08:30:00 GMT
Disposition-Notification-To: as2-mdn@northwindtrading.demo
Disposition-Notification-Options: signed-receipt-protocol=optional, pkcs7-signature; signed-receipt-micalg=optional, sha-256

------=_Part_2026_AS2_BOUNDARY_X987
Content-Type: application/edi-x12; name="PO_DEMO_10042.edi"
Content-Transfer-Encoding: 8bit
Content-Disposition: attachment; filename="PO_DEMO_10042.edi"

ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260912*0830*U*00401*000000850*0*P*>~
GS*PO*NORTHWIND*CONTOSO*20260912*0830*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-DEMO-10042**20260912~
CUR*SE*USD~
REF*DP*042~
N1*BT*CONTOSO RETAIL*9*0012345678900~
N3*100 CONTOSO WAY~
N4*REDMOND*WA*98052~
N1*ST*CONTOSO DISTRIBUTION DC #4*9*0098765432100~
N3*1200 LOGISTICS WAY~
N4*DALLAS*TX*75201~
PO1*1*150*EA*45.00**VN*SKU-A101*UP*012345678905~
PID*F****INDUSTRIAL SMART SENSOR MODULE 24V~
PO1*2*75*EA*120.00**VN*SKU-B202*UP*012345678912~
PID*F****WIRELESS TELEMETRY GATEWAY IP67~
CTT*2*225~
SE*16*0001~
GE*1*85001~
IEA*1*000000850~
------=_Part_2026_AS2_BOUNDARY_X987
Content-Type: application/pkcs7-signature; name="smime.p7s"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="smime.p7s"

MIAGCSqGSIb3DQEHAqCAMIACAQExDzANBglghkgBZQMEAgEFADCABgkqhkiG9w0BBwEAAKCAMIIF
AgIBATAwMzAKBggqhkiG9w0BAQICAQAwDjEMMAoGA1UEAxMDY29kZTEUMBIGA1UEBRMLTk9SVEhX
SU5E...[SHA256-DIGITAL-SIGNATURE-VERIFIED]
------=_Part_2026_AS2_BOUNDARY_X987--`;

export const FIXTURE_EDIFACT_ORDERS = `UNB+UNOA:2+NORTHWIND_SUPPLY:ZZ+CONTOSO_BUYER:ZZ+260912:0830+IREF0001+++++1'
UNH+MEST0001+ORDERS:D:96A:UN:EAN008'
BGM+220+PO-DEMO-99120+9'
DTM+137:20260912:102'
NAD+BY+CTS-RECV::9++CONTOSO RETAIL UK+100 BISHOPSGATE+LONDON++EC2N 4AG+GB'
NAD+SU+NWT-SENDER::9++NORTHWIND TRADING LTD+45 INDUSTRIAL ROAD+MANCHESTER++M1 1AA+GB'
NAD+DP+FAB-DC::9++FABRIKAM LOGISTICS DEPOT+PORT WAY+LIVERPOOL++L1 8JQ+GB'
LIN+1++5012345678900:EN'
IMD+F++:::INDUSTRIAL PNEUMATIC ACTUATOR 240V'
QTY+21:120:PCE'
MOA+203:75.00'
LIN+2++5012345678917:EN'
IMD+F++:::PRESSURE RELIEF VALVE FLANGE 16BAR'
QTY+21:40:PCE'
MOA+203:140.00'
UNS+S'
CNT+2:2'
UNT+17+MEST0001'
UNZ+1+IREF0001'`;

export const FIXTURE_OUTBOUND_JSON_PO = `{
  "transactionType": "850",
  "documentType": "PurchaseOrder",
  "controlNumbers": {
    "interchange": "000000850",
    "group": "85001",
    "transaction": "0001"
  },
  "header": {
    "orderNumber": "PO-DEMO-10042",
    "orderDate": "2026-09-12",
    "currency": "USD",
    "statusOrType": "Original"
  },
  "parties": [
    {
      "role": "Buyer (BT)",
      "name": "CONTOSO RETAIL",
      "duns": "0012345678900",
      "address": "100 CONTOSO WAY",
      "city": "REDMOND",
      "state": "WA",
      "zip": "98052",
      "country": "USA"
    },
    {
      "role": "Ship-To (ST)",
      "name": "CONTOSO DISTRIBUTION DC #4",
      "duns": "0098765432100",
      "address": "1200 LOGISTICS WAY",
      "city": "DALLAS",
      "state": "TX",
      "zip": "75201",
      "country": "USA"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": "SKU-A101",
      "upc": "012345678905",
      "description": "INDUSTRIAL SMART SENSOR MODULE 24V",
      "quantity": 150,
      "uom": "EA",
      "unitPrice": 45.00,
      "extendedAmount": 6750.00
    },
    {
      "lineNumber": "2",
      "partNumber": "SKU-B202",
      "upc": "012345678912",
      "description": "WIRELESS TELEMETRY GATEWAY IP67",
      "quantity": 75,
      "uom": "EA",
      "unitPrice": 120.00,
      "extendedAmount": 9000.00
    }
  ],
  "summary": {
    "totalQuantity": 225,
    "totalAmount": 15750.00,
    "lineCount": 2
  },
  "rawMeta": {
    "originalFormat": "X12",
    "version": "004010",
    "delimiters": {
      "element": "*",
      "segment": "~"
    },
    "receivedAt": "2026-09-12T08:30:00Z"
  }
}`;

export const FIXTURE_OUTBOUND_JSON_INVOICE = `{
  "transactionType": "810",
  "documentType": "Invoice",
  "controlNumbers": {
    "interchange": "000000810",
    "group": "81001",
    "transaction": "0001"
  },
  "header": {
    "orderNumber": "INV-DEMO-5501",
    "orderDate": "2026-09-12",
    "currency": "USD",
    "statusOrType": "Original"
  },
  "parties": [
    {
      "role": "Supplier (SU)",
      "name": "NORTHWIND TRADING",
      "duns": "9988776655443",
      "address": "100 NORTHWIND PKWY",
      "city": "SEATTLE",
      "state": "WA",
      "zip": "98101"
    },
    {
      "role": "Bill-To (BT)",
      "name": "CONTOSO RETAIL",
      "duns": "0012345678900",
      "address": "100 CONTOSO WAY",
      "city": "REDMOND",
      "state": "WA",
      "zip": "98052"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": "SKU-A101",
      "description": "INDUSTRIAL SMART SENSOR MODULE 24V",
      "quantity": 150,
      "uom": "EA",
      "unitPrice": 45.00,
      "extendedAmount": 6750.00
    },
    {
      "lineNumber": "2",
      "partNumber": "SKU-B202",
      "description": "WIRELESS TELEMETRY GATEWAY IP67",
      "quantity": 75,
      "uom": "EA",
      "unitPrice": 120.00,
      "extendedAmount": 9000.00
    }
  ],
  "summary": {
    "totalQuantity": 225,
    "totalAmount": 15750.00,
    "lineCount": 2
  },
  "rawMeta": {
    "originalFormat": "X12",
    "version": "004010",
    "delimiters": {
      "element": "*",
      "segment": "~"
    },
    "receivedAt": "2026-09-12T08:30:00Z"
  }
}`;

export const FIXTURE_OUTBOUND_ERP_ITEM_MASTER = `{
  "transactionType": "888",
  "documentType": "ItemMasterMaintenance",
  "controlNumbers": {
    "interchange": "000000888",
    "group": "88801",
    "transaction": "0001"
  },
  "header": {
    "orderNumber": "CAT-DEMO-ITM99",
    "orderDate": "2026-09-12",
    "currency": "USD",
    "statusOrType": "CatalogUpdate"
  },
  "parties": [
    {
      "role": "Vendor (VN)",
      "name": "NORTHWIND TRADING",
      "duns": "9988776655443"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": "ACT-770-PNEUMATIC",
      "description": "HEAVY DUTY PNEUMATIC ACTUATOR 24V",
      "quantity": 1,
      "uom": "EA",
      "unitPrice": 340.00,
      "extendedAmount": 340.00
    },
    {
      "lineNumber": "2",
      "partNumber": "VALVE-FLANGE-16B",
      "description": "STAINLESS STEEL FLANGED VALVE 16BAR",
      "quantity": 1,
      "uom": "EA",
      "unitPrice": 210.00,
      "extendedAmount": 210.00
    }
  ],
  "summary": {
    "totalQuantity": 2,
    "totalAmount": 550.00,
    "lineCount": 2
  },
  "rawMeta": {
    "originalFormat": "X12",
    "version": "004010",
    "delimiters": { "element": "*", "segment": "~" },
    "receivedAt": "2026-09-12T08:30:00Z"
  }
}`;

export const FIXTURE_OUTBOUND_ERP_STOCK_ADVICE = `{
  "transactionType": "943",
  "documentType": "WarehouseStockTransferShipmentAdvice",
  "controlNumbers": {
    "interchange": "000000943",
    "group": "94301",
    "transaction": "0001"
  },
  "header": {
    "orderNumber": "STA-DEMO-TRANSFER-01",
    "orderDate": "2026-09-12",
    "currency": "USD",
    "statusOrType": "TransferAdvice"
  },
  "parties": [
    {
      "role": "Warehouse (WH)",
      "name": "FABRIKAM LOGISTICS DC WEST",
      "duns": "004455667788"
    },
    {
      "role": "Ship-To (ST)",
      "name": "CONTOSO DISTRIBUTION DC #4",
      "duns": "0098765432100"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": "SKU-A101",
      "description": "INDUSTRIAL SMART SENSOR MODULE 24V",
      "quantity": 300,
      "uom": "EA",
      "unitPrice": 45.00,
      "extendedAmount": 13500.00
    }
  ],
  "summary": {
    "totalQuantity": 300,
    "totalAmount": 13500.00,
    "lineCount": 1
  },
  "rawMeta": {
    "originalFormat": "X12",
    "version": "004010",
    "delimiters": { "element": "*", "segment": "~" },
    "receivedAt": "2026-09-12T08:30:00Z"
  }
}`;

export const MOCK_PARTNERS: MockPartner[] = [
  {
    id: 'NORTHWIND',
    name: 'Northwind Trading (X12 Supplier)',
    standard: 'X12',
    isaSenderId: 'NORTHWIND_SUPPLY',
    isaReceiverId: 'CONTOSO_BUYER',
    as2Id: 'NORTHWIND_AS2',
    defaultAck: true,
    notes: 'Primary industrial supplies partner (ANSI X12 4010)',
  },
  {
    id: 'CONTOSO',
    name: 'Contoso Retail (X12 Buyer)',
    standard: 'X12',
    isaSenderId: 'CONTOSO_BUYER',
    isaReceiverId: 'NORTHWIND_SUPPLY',
    as2Id: 'CONTOSO_AS2',
    defaultAck: true,
    notes: 'Enterprise retail buyer for smart components and consumer hardware',
  },
  {
    id: 'FABRIKAM',
    name: 'Fabrikam Logistics (WMS / 944 / 943)',
    standard: 'X12',
    isaSenderId: 'FABRIKAM_WH',
    isaReceiverId: 'CONTOSO_BUYER',
    as2Id: 'FABRIKAM_AS2',
    defaultAck: true,
    notes: 'Warehouse & distribution center fulfillment provider',
  },
  {
    id: 'TAILWIND',
    name: 'Tailwind Carrier (Freight / 214)',
    standard: 'X12',
    isaSenderId: 'TAILWIND_CARR',
    isaReceiverId: 'CONTOSO_BUYER',
    as2Id: 'TAILWIND_AS2',
    defaultAck: false,
    notes: 'Logistics motor freight carrier sending tracking status updates',
  },
  {
    id: 'HORIZON',
    name: 'Horizon Clinic (HIPAA 837 Claim)',
    standard: 'X12',
    isaSenderId: 'HORIZON_CLINIC',
    isaReceiverId: 'SUMMIT_HEALTH',
    as2Id: 'HORIZON_AS2',
    defaultAck: true,
    notes: 'Healthcare HIPAA EDI 5010 X222 claims provider (synthetic demo)',
  },
  {
    id: 'CONTOSO_UK',
    name: 'Contoso Retail UK (EDIFACT)',
    standard: 'EDIFACT',
    isaSenderId: 'CTS-RECV',
    isaReceiverId: 'NWT-SENDER',
    as2Id: 'CONTOSO_UK_AS2',
    defaultAck: true,
    notes: 'European division ordering via UN/EDIFACT D96A ORDERS & INVOIC',
  },
];

export const MOCK_ROUTES = [
  {
    txCode: '850',
    name: 'Purchase Order Ingestion Route',
    subscriptionLabel: 'Reference example: Orders-Sub',
    targetDocType: 'PurchaseOrder',
    transformerId: 'x12-850-to-canonical-order',
  },
  {
    txCode: '860',
    name: 'Purchase Order Change Route',
    subscriptionLabel: 'Reference example: OrderChange-Sub',
    targetDocType: 'PurchaseOrderChange',
    transformerId: 'x12-860-to-canonical-change',
  },
  {
    txCode: '944',
    name: 'Warehouse Stock Receipt Advice',
    subscriptionLabel: 'Reference example: Inventory-Receipt-Sub',
    targetDocType: 'WarehouseStockTransferReceipt',
    transformerId: 'x12-944-to-canonical-stock',
  },
  {
    txCode: '837',
    name: 'HIPAA Healthcare Claim Adjudication',
    subscriptionLabel: 'Reference example: Claims-Adjudication-Sub',
    targetDocType: 'HealthcareClaim',
    transformerId: 'x12-837-to-canonical-claim',
  },
  {
    txCode: '214',
    name: 'Freight Carrier Tracking Route',
    subscriptionLabel: 'Reference example: Carrier-Tracking-Sub',
    targetDocType: 'ShipmentStatus',
    transformerId: 'x12-214-to-canonical-tracking',
  },
  {
    txCode: '810',
    name: 'Accounts Payable Commercial Invoice',
    subscriptionLabel: 'Reference example: Invoices-Sub',
    targetDocType: 'Invoice',
    transformerId: 'x12-810-to-canonical-invoice',
  },
  {
    txCode: '856',
    name: 'Advance Ship Notice Route',
    subscriptionLabel: 'Reference example: Logistics-ASN-Sub',
    targetDocType: 'ShipmentNotice',
    transformerId: 'x12-856-to-canonical-asn',
  },
  {
    txCode: 'ORDERS',
    name: 'EDIFACT European Purchase Order Route',
    subscriptionLabel: 'Reference example: EU-Orders-Sub',
    targetDocType: 'EDIFACT_ORDERS',
    transformerId: 'edifact-orders-to-canonical-order',
  },
  {
    txCode: 'INVOIC',
    name: 'EDIFACT European Commercial Invoice Route',
    subscriptionLabel: 'Reference example: EU-Invoices-Sub',
    targetDocType: 'EDIFACT_INVOIC',
    transformerId: 'edifact-invoic-to-canonical-invoice',
  },
];
