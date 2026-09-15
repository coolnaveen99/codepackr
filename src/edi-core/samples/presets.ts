// Data-driven EDI Presets Registry
// Strictly follows fictional partner naming policy:
// Supplier: NORTHWIND TRADING / NORTHWIND_SUPPLY / NWT-SENDER
// Buyer: CONTOSO RETAIL / CONTOSO_BUYER / CTS-RECV
// Warehouse / DC: FABRIKAM LOGISTICS / FABRIKAM DC WEST
// Carrier: TAILWIND CARRIER / TLW-CARRIER
// Healthcare: HORIZON CLINIC / SUMMIT HEALTH PLAN

export type PresetGroup =
  | 'Retail Order-to-Cash'
  | 'Warehouse & Inventory'
  | 'Transportation'
  | 'Healthcare (Synthetic)'
  | 'International (EDIFACT)'
  | 'AS2 Transport'
  | 'Custom';

export type PresetFamily = 'X12' | 'EDIFACT' | 'AS2 + X12' | 'JSON' | 'XML';

export interface EdiPreset {
  id: string;
  label: string;
  group: PresetGroup;
  family: PresetFamily;
  direction: 'inbound' | 'outbound';
  payload: string;
  description: string;
  transactionType: string;
  capability: 'full' | 'parse' | 'envelope';
  defaultPartnerId: string;
}

// Inbound Story Presets
export const PRESET_INBOUND_850: EdiPreset = {
  id: 'retail-po-850',
  label: 'Retail Purchase Order (850)',
  group: 'Retail Order-to-Cash',
  family: 'X12',
  direction: 'inbound',
  transactionType: '850',
  capability: 'full',
  defaultPartnerId: 'NORTHWIND',
  description: 'Contoso Retail purchase order for industrial sensors and wireless telemetry gateways.',
  payload: `ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260912*0830*U*00401*000000850*0*P*>~
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
IEA*1*000000850~`,
};

export const PRESET_INBOUND_860: EdiPreset = {
  id: 'retail-po-change-860',
  label: 'Order Change (860)',
  group: 'Retail Order-to-Cash',
  family: 'X12',
  direction: 'inbound',
  transactionType: '860',
  capability: 'full',
  defaultPartnerId: 'NORTHWIND',
  description: 'Purchase order revision requesting line quantity increases on active orders.',
  payload: `ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260912*0900*U*00401*000000860*0*P*>~
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
IEA*1*000000860~`,
};

export const PRESET_INBOUND_810: EdiPreset = {
  id: 'invoice-810',
  label: 'Supplier Invoice (810)',
  group: 'Retail Order-to-Cash',
  family: 'X12',
  direction: 'inbound',
  transactionType: '810',
  capability: 'full',
  defaultPartnerId: 'NORTHWIND',
  description: 'Northwind Trading commercial invoice for delivered smart hardware components.',
  payload: `ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260912*1000*U*00401*000000810*0*P*>~
GS*IN*NORTHWIND*CONTOSO*20260912*1000*81001*X*004010~
ST*810*0001~
BIG*20260912*INV-DEMO-5501*20260912*PO-DEMO-10042~
CUR*SE*USD~
N1*RE*NORTHWIND REMITTANCE*91*REMIT1~
N1*BT*CONTOSO RETAIL*9*0012345678900~
IT1*1*150*EA*45.00**VN*SKU-A101~
IT1*2*75*EA*120.00**VN*SKU-B202~
TDS*1575000~
CTT*2~
SE*10*0001~
GE*1*81001~
IEA*1*000000810~`,
};

export const PRESET_INBOUND_856: EdiPreset = {
  id: 'asn-856',
  label: 'Advance Ship Notice (856)',
  group: 'Retail Order-to-Cash',
  family: 'X12',
  direction: 'inbound',
  transactionType: '856',
  capability: 'full',
  defaultPartnerId: 'NORTHWIND',
  description: 'Advance shipping dispatch notice with package hierarchy and tracking information.',
  payload: `ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260912*1130*U*00401*000000856*0*P*>~
GS*SH*NORTHWIND*CONTOSO*20260912*1130*85601*X*004010~
ST*856*0001~
BSN*00*ASN-DEMO-3301*20260912*1130~
HL*1**S~
TD1*CTN25*10~
TD5*B*2*TLWCARRIER*M*TAILWIND TRUCKLOAD~
REF*BM*BOL-DEMO-9912~
DTM*011*20260912~
N1*SF*NORTHWIND TRADING SHIP DOCK~
N1*ST*CONTOSO DISTRIBUTION DC #4~
HL*2*1*O~
PRF*PO-DEMO-10042~
HL*3*2*I~
LIN*1*VN*SKU-A101*UP*012345678905~
SN1*1*150*EA~
CTT*3~
SE*17*0001~
GE*1*85601~
IEA*1*000000856~`,
};

export const PRESET_INBOUND_944: EdiPreset = {
  id: 'warehouse-receipt-944',
  label: 'Warehouse Receipt (944)',
  group: 'Warehouse & Inventory',
  family: 'X12',
  direction: 'inbound',
  transactionType: '944',
  capability: 'full',
  defaultPartnerId: 'FABRIKAM',
  description: 'Fabrikam Logistics inbound stock receipt verification for inventory reconciliation.',
  payload: `ISA*00*          *00*          *ZZ*FABRIKAM       *ZZ*CONTOSO        *260912*1100*U*00401*000000944*0*P*>~
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
IEA*1*000000944~`,
};

export const PRESET_INBOUND_214: EdiPreset = {
  id: 'transport-status-214',
  label: 'Shipment Status (214)',
  group: 'Transportation',
  family: 'X12',
  direction: 'inbound',
  transactionType: '214',
  capability: 'full',
  defaultPartnerId: 'TAILWIND',
  description: 'Tailwind Carrier freight status message with tracking events and transit checkpoint.',
  payload: `ISA*00*          *00*          *ZZ*TAILWIND       *ZZ*CONTOSO        *260912*1045*U*00401*000000214*0*P*>~
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
IEA*1*000000214~`,
};

export const PRESET_INBOUND_837: EdiPreset = {
  id: 'healthcare-837p',
  label: 'Healthcare Claim Professional (837)',
  group: 'Healthcare (Synthetic)',
  family: 'X12',
  direction: 'inbound',
  transactionType: '837',
  capability: 'full',
  defaultPartnerId: 'HORIZON',
  description: 'Synthetic HIPAA professional medical claim with procedure codes and patient envelope.',
  payload: `ISA*00*          *00*          *ZZ*HORIZON        *ZZ*SUMMIT         *260912*0915*^*00501*000000837*0*P*:~
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
IEA*1*000000837~`,
};

export const PRESET_INBOUND_EDIFACT_ORDERS: EdiPreset = {
  id: 'edifact-orders',
  label: 'EDIFACT ORDERS (D96A)',
  group: 'International (EDIFACT)',
  family: 'EDIFACT',
  direction: 'inbound',
  transactionType: 'ORDERS',
  capability: 'full',
  defaultPartnerId: 'CONTOSO_UK',
  description: 'International purchase order message formatted per UN/EDIFACT D96A standards.',
  payload: `UNB+UNOA:2+NORTHWIND_SUPPLY:ZZ+CONTOSO_BUYER:ZZ+260912:0830+IREF0001+++++1'
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
UNZ+1+IREF0001'`,
};

export const PRESET_INBOUND_EDIFACT_INVOIC: EdiPreset = {
  id: 'edifact-invoic',
  label: 'EDIFACT INVOIC',
  group: 'International (EDIFACT)',
  family: 'EDIFACT',
  direction: 'inbound',
  transactionType: 'INVOIC',
  capability: 'full',
  defaultPartnerId: 'CONTOSO_UK',
  description: 'International commercial billing invoice message formatted under UN/EDIFACT D96A.',
  payload: `UNB+UNOA:2+NORTHWIND_SUPPLY:ZZ+CONTOSO_BUYER:ZZ+260912:0900+IREF0002+++++1'
UNH+MEST0002+INVOIC:D:96A:UN:EAN008'
BGM+380+INV-DEMO-7711+9'
DTM+137:20260912:102'
NAD+BY+CTS-RECV::9++CONTOSO RETAIL UK+100 BISHOPSGATE+LONDON++EC2N 4AG+GB'
NAD+SU+NWT-SENDER::9++NORTHWIND TRADING LTD+45 INDUSTRIAL ROAD+MANCHESTER++M1 1AA+GB'
LIN+1++5012345678900:EN'
IMD+F++:::INDUSTRIAL PNEUMATIC ACTUATOR 240V'
QTY+47:120:PCE'
MOA+203:75.00'
UNS+S'
CNT+2:1'
MOA+77:9000.00'
UNT+13+MEST0002'
UNZ+1+IREF0002'`,
};

export const PRESET_INBOUND_AS2_WRAPPED: EdiPreset = {
  id: 'as2-wrapped-850',
  label: 'AS2-Wrapped Purchase Order',
  group: 'AS2 Transport',
  family: 'AS2 + X12',
  direction: 'inbound',
  transactionType: '850',
  capability: 'full',
  defaultPartnerId: 'NORTHWIND',
  description: 'HTTP multipart/signed S/MIME container packaging an X12 850 with simulated SHA-256 cert.',
  payload: `POST /as2/receive HTTP/1.1
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
------=_Part_2026_AS2_BOUNDARY_X987--`,
};

// Outbound Story Presets
export const PRESET_OUTBOUND_810: EdiPreset = {
  id: 'invoice-out-810',
  label: 'Invoice from ERP (→ 810)',
  group: 'Retail Order-to-Cash',
  family: 'JSON',
  direction: 'outbound',
  transactionType: '810',
  capability: 'full',
  defaultPartnerId: 'CONTOSO',
  description: 'ERP invoice ready to be formatted into an ANSI X12 810 EDI billing transaction.',
  payload: `{
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
    "statusOrType": "Original",
    "referenceNumber": "PO-DEMO-10042"
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
  }
}`,
};

export const PRESET_OUTBOUND_856: EdiPreset = {
  id: 'shipment-out-856',
  label: 'Shipment Notice from WMS (→ 856)',
  group: 'Retail Order-to-Cash',
  family: 'JSON',
  direction: 'outbound',
  transactionType: '856',
  capability: 'full',
  defaultPartnerId: 'CONTOSO',
  description: 'WMS shipping manifest ready for dispatch notice synthesis with carrier routing.',
  payload: `{
  "transactionType": "856",
  "documentType": "ShipmentNotice",
  "controlNumbers": {
    "interchange": "000000856",
    "group": "85601",
    "transaction": "0001"
  },
  "header": {
    "orderNumber": "ASN-DEMO-3301",
    "orderDate": "2026-09-12",
    "currency": "USD",
    "statusOrType": "Original"
  },
  "parties": [
    {
      "role": "Shipper (SH)",
      "name": "NORTHWIND TRADING SHIP DOCK",
      "duns": "9988776655443"
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
      "quantity": 150,
      "uom": "EA"
    },
    {
      "lineNumber": "2",
      "partNumber": "SKU-B202",
      "description": "WIRELESS TELEMETRY GATEWAY IP67",
      "quantity": 75,
      "uom": "EA"
    }
  ],
  "summary": {
    "totalQuantity": 225,
    "lineCount": 2
  }
}`,
};

export const PRESET_OUTBOUND_888: EdiPreset = {
  id: 'item-master-888',
  label: 'Item Master Catalog (→ 888)',
  group: 'Warehouse & Inventory',
  family: 'JSON',
  direction: 'outbound',
  transactionType: '888',
  capability: 'full',
  defaultPartnerId: 'CONTOSO',
  description: 'Product catalog master maintenance message for syncing parts and pricing with partners.',
  payload: `{
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
  }
}`,
};

export const PRESET_OUTBOUND_943: EdiPreset = {
  id: 'stock-advice-943',
  label: 'Stock Transfer Advice (→ 943)',
  group: 'Warehouse & Inventory',
  family: 'JSON',
  direction: 'outbound',
  transactionType: '943',
  capability: 'full',
  defaultPartnerId: 'FABRIKAM',
  description: 'ERP warehouse transfer advice instructing warehouse operators on inbound stock arrival.',
  payload: `{
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
  }
}`,
};

export const PRESET_OUTBOUND_ORDERS_EDIFACT: EdiPreset = {
  id: 'orders-out-edifact',
  label: 'Order from ERP (→ EDIFACT ORDERS)',
  group: 'International (EDIFACT)',
  family: 'JSON',
  direction: 'outbound',
  transactionType: 'ORDERS',
  capability: 'full',
  defaultPartnerId: 'CONTOSO_UK',
  description: 'ERP purchase order JSON destined for European partners using UN/EDIFACT D96A ORDERS.',
  payload: `{
  "transactionType": "ORDERS",
  "documentType": "EDIFACT_ORDERS",
  "controlNumbers": {
    "interchange": "00000001",
    "group": "0001",
    "transaction": "MEST0001"
  },
  "header": {
    "orderNumber": "PO-DEMO-EU-99120",
    "orderDate": "2026-09-12",
    "currency": "EUR",
    "statusOrType": "Original"
  },
  "parties": [
    {
      "role": "Supplier (SU)",
      "name": "NORTHWIND TRADING LTD",
      "duns": "NWT-SENDER",
      "city": "MANCHESTER",
      "country": "GB"
    },
    {
      "role": "Buyer (BY)",
      "name": "CONTOSO RETAIL UK",
      "duns": "CTS-RECV",
      "city": "LONDON",
      "country": "GB"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": "5012345678900",
      "description": "INDUSTRIAL PNEUMATIC ACTUATOR 240V",
      "quantity": 120,
      "uom": "PCE",
      "unitPrice": 75.00,
      "extendedAmount": 9000.00
    }
  ],
  "summary": {
    "totalQuantity": 120,
    "totalAmount": 9000.00,
    "lineCount": 1
  },
  "rawMeta": {
    "originalFormat": "EDIFACT"
  }
}`,
};

export const PRESET_OUTBOUND_CUSTOM_CANONICAL: EdiPreset = {
  id: 'custom-canonical',
  label: 'Custom Canonical JSON/XML',
  group: 'Custom',
  family: 'JSON',
  direction: 'outbound',
  transactionType: '850',
  capability: 'full',
  defaultPartnerId: 'NORTHWIND',
  description: 'Clean user-defined canonical document structure for custom ERP mappings.',
  payload: `{
  "transactionType": "850",
  "documentType": "PurchaseOrder",
  "controlNumbers": {
    "interchange": "000000850",
    "group": "85001",
    "transaction": "0001"
  },
  "header": {
    "orderNumber": "PO-CUSTOM-001",
    "orderDate": "2026-09-12",
    "currency": "USD",
    "statusOrType": "Original"
  },
  "parties": [
    {
      "role": "Buyer (BT)",
      "name": "CONTOSO RETAIL",
      "city": "REDMOND",
      "country": "USA"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": "CUSTOM-PART-1",
      "description": "CUSTOM HARDWARE ASSET",
      "quantity": 10,
      "uom": "EA",
      "unitPrice": 100.00,
      "extendedAmount": 1000.00
    }
  ],
  "summary": {
    "totalQuantity": 10,
    "totalAmount": 1000.00,
    "lineCount": 1
  }
}`,
};

// All Inbound Presets list
export const INBOUND_PRESETS: EdiPreset[] = [
  PRESET_INBOUND_850,
  PRESET_INBOUND_860,
  PRESET_INBOUND_810,
  PRESET_INBOUND_856,
  PRESET_INBOUND_944,
  PRESET_INBOUND_214,
  PRESET_INBOUND_837,
  PRESET_INBOUND_EDIFACT_ORDERS,
  PRESET_INBOUND_EDIFACT_INVOIC,
  PRESET_INBOUND_AS2_WRAPPED,
];

// All Outbound Presets list
export const OUTBOUND_PRESETS: EdiPreset[] = [
  PRESET_OUTBOUND_810,
  PRESET_OUTBOUND_856,
  PRESET_OUTBOUND_888,
  PRESET_OUTBOUND_943,
  PRESET_OUTBOUND_ORDERS_EDIFACT,
  PRESET_OUTBOUND_CUSTOM_CANONICAL,
];

export const ALL_PRESETS: EdiPreset[] = [...INBOUND_PRESETS, ...OUTBOUND_PRESETS];

export function getPresetById(id: string): EdiPreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}

/**
 * Randomize control numbers in EDI text so successive demo loads
 * don't have identical fingerprinting sequences.
 */
export function randomizeControlNumbers(ediText: string): string {
  const randNum = (digits: number) =>
    Math.floor(Math.random() * Math.pow(10, digits))
      .toString()
      .padStart(digits, '0');

  const newIcn = randNum(9);
  const newGcn = randNum(5);
  const newTcn = randNum(4);

  let result = ediText;
  // Replace X12 ISA / IEA control number
  result = result.replace(/(\*U\*0040[0-9]\*)(\d{9})(\*0\*)/, `$1${newIcn}$3`);
  result = result.replace(/(IEA\*\d+\*)(\d{9})(~)/, `$1${newIcn}$3`);
  // Replace GS / GE control number
  result = result.replace(/(GS\*[A-Z0-9]+\*[^*]+\*[^*]+\*\d{8}\*\d{4}\*)(\d+)(\*)/, `$1${newGcn}$3`);
  result = result.replace(/(GE\*\d+\*)(\d+)(~)/, `$1${newGcn}$3`);
  // Replace ST / SE control number
  result = result.replace(/(ST\*\d{3}\*)(\d{4})(~)/, `$1${newTcn}$3`);
  result = result.replace(/(SE\*\d+\*)(\d{4})(~)/, `$1${newTcn}$3`);

  return result;
}
