import { CanonicalDocument } from '../models/canonical';
import { escapeXml } from '../utils/xmlEscape';

export function renderCanonicalToXml(canonical: CanonicalDocument): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<EnterpriseDocument xmlns="urn:codepackr:canonical:v1" schemaVersion="1.0">
  <DocumentHeader>
    <TransactionType>${escapeXml(canonical.transactionType)}</TransactionType>
    <DocumentType>${escapeXml(canonical.documentType)}</DocumentType>
    <OrderNumber>${escapeXml(canonical.header.orderNumber)}</OrderNumber>
    <OrderDate>${escapeXml(canonical.header.orderDate)}</OrderDate>
    <Currency>${escapeXml(canonical.header.currency)}</Currency>
    <Status>${escapeXml(canonical.header.statusOrType || 'Original')}</Status>
    ${canonical.header.referenceNumber ? `<ReferenceNumber>${escapeXml(canonical.header.referenceNumber)}</ReferenceNumber>` : ''}
    ${canonical.header.department ? `<Department>${escapeXml(canonical.header.department)}</Department>` : ''}
  </DocumentHeader>
  <ControlNumbers>
    <Interchange>${escapeXml(canonical.controlNumbers.interchange)}</Interchange>
    <Group>${escapeXml(canonical.controlNumbers.group)}</Group>
    <Transaction>${escapeXml(canonical.controlNumbers.transaction)}</Transaction>
  </ControlNumbers>
  <Parties>
${canonical.parties
  .map(
    (p) => `    <Party role="${escapeXml(p.role)}">
      <Name>${escapeXml(p.name)}</Name>
      <DUNS>${escapeXml(p.duns || '')}</DUNS>
      <Address>${escapeXml(p.address || '')}</Address>
      <City>${escapeXml(p.city || '')}</City>
      <State>${escapeXml(p.state || '')}</State>
      <PostalCode>${escapeXml(p.zip || '')}</PostalCode>
      <Country>${escapeXml(p.country || 'USA')}</Country>
    </Party>`
  )
  .join('\n')}
  </Parties>
  <LineItems>
${canonical.lineItems
  .map(
    (it) => `    <LineItem number="${escapeXml(it.lineNumber)}">
      <PartNumber>${escapeXml(it.partNumber)}</PartNumber>
      ${it.upc ? `<UPC>${escapeXml(it.upc)}</UPC>` : ''}
      <Description>${escapeXml(it.description)}</Description>
      <Quantity unit="${escapeXml(it.uom)}">${it.quantity}</Quantity>
      <UnitPrice>${it.unitPrice.toFixed(2)}</UnitPrice>
      <ExtendedAmount>${(it.extendedAmount || it.quantity * it.unitPrice).toFixed(2)}</ExtendedAmount>
    </LineItem>`
  )
  .join('\n')}
  </LineItems>
  <Summary>
    <TotalLineCount>${canonical.summary.lineCount}</TotalLineCount>
    <TotalQuantity>${canonical.summary.totalQuantity}</TotalQuantity>
    <TotalAmount currency="${escapeXml(canonical.header.currency)}">${canonical.summary.totalAmount.toFixed(2)}</TotalAmount>
  </Summary>
</EnterpriseDocument>`;
}
