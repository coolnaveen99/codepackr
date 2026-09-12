export interface EdiSamplePreset {
  id: string;
  name: string;
  code: string;
  standard: 'X12' | 'EDIFACT';
  category: string;
  description: string;
  payload: string;
  storyGroup?: string;
  storyStep?: number;
}

export interface StoryModeFlow {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  steps: {
    transaction: string;
    role: string;
    description: string;
    sampleId: string;
  }[];
}

export const STORY_MODE_FLOWS: StoryModeFlow[] = [
  {
    id: 'retail-order-to-cash',
    title: 'Retail Order-to-Cash Cycle',
    category: 'Supply Chain & Retail',
    description: 'Complete end-to-end retail procurement lifecycle from Purchase Order to Settlement.',
    iconName: 'Package',
    steps: [
      {
        transaction: '850',
        role: 'Buyer ➔ Supplier',
        description: 'Purchase Order requesting 150 total units across 2 SKU lines with ship-to DC.',
        sampleId: '850',
      },
      {
        transaction: '855',
        role: 'Supplier ➔ Buyer',
        description: 'Purchase Order Acknowledgment confirming order acceptance and scheduled delivery.',
        sampleId: '855',
      },
      {
        transaction: '856',
        role: 'Supplier ➔ Buyer',
        description: 'Advance Ship Notice (ASN) with SSCC-18 pallet barcode packing structure.',
        sampleId: '856',
      },
      {
        transaction: '810',
        role: 'Supplier ➔ Buyer',
        description: 'Commercial Electronic Invoice matching PO prices with payment terms.',
        sampleId: '810',
      },
      {
        transaction: '997',
        role: 'Buyer ➔ Supplier',
        description: 'Functional Acknowledgment confirming envelope and syntax compliance.',
        sampleId: '997',
      },
    ],
  },
  {
    id: 'logistics-freight-lifecycle',
    title: 'Logistics & Freight Shipment Flow',
    category: 'Logistics & Transportation',
    description: 'Motor carrier load tendering, shipment status tracking, and freight settlement.',
    iconName: 'Truck',
    steps: [
      {
        transaction: '204',
        role: 'Shipper ➔ Carrier',
        description: 'Motor Carrier Load Tender dispatching TL/LTL equipment and pickup dates.',
        sampleId: '204',
      },
      {
        transaction: '214',
        role: 'Carrier ➔ Shipper',
        description: 'Transportation Carrier Shipment Status Message with GPS departure & arrival milestones.',
        sampleId: '214',
      },
      {
        transaction: '210',
        role: 'Carrier ➔ Shipper',
        description: 'Motor Carrier Freight Details and Invoice for accessorial and linehaul charges.',
        sampleId: '210',
      },
    ],
  },
  {
    id: 'edifact-global-trade',
    title: 'UN/EDIFACT Global Trade Cycle',
    category: 'International Commerce',
    description: 'Standard UNECE international procurement message cycle (ORDERS ➔ DESADV ➔ INVOIC).',
    iconName: 'Globe',
    steps: [
      {
        transaction: 'ORDERS (D16B)',
        role: 'Buyer ➔ Seller',
        description: 'UN/EDIFACT Purchase Order message under D.16B directory.',
        sampleId: 'ORDERS-D16B',
      },
      {
        transaction: 'DESADV (D23A)',
        role: 'Seller ➔ Buyer',
        description: 'UN/EDIFACT Despatch Advice / Shipping Notification with consignment details.',
        sampleId: 'DESADV-D23A',
      },
      {
        transaction: 'INVOIC (D96A)',
        role: 'Seller ➔ Buyer',
        description: 'UN/EDIFACT Commercial Invoice message with VAT and line item breakdown.',
        sampleId: 'INVOIC-D96A',
      },
    ],
  },
];
