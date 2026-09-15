import { CanonicalDocument } from '../models/canonical';

export function render997Acknowledgment(canonical: CanonicalDocument): string {
  const icn = (canonical.controlNumbers.interchange || '000000850').padStart(9, '0');
  const gcn = canonical.controlNumbers.group || '85001';
  const tcn = (canonical.controlNumbers.transaction || '0001').padStart(4, '0');
  const txCode = canonical.transactionType || '850';
  const today = new Date().toISOString().slice(2, 10).replace(/-/g, '');

  return `ISA*00*          *00*          *ZZ*CODEPACKRHUB   *ZZ*TRADINGPARTNER *${today}*0835*U*00401*${icn}*0*P*>~
GS*FA*CODEPACKRHUB*TRADINGPARTNER*20${today}*0835*${gcn}*X*004010~
ST*997*0001~
AK1*PO*${gcn}~
AK2*${txCode}*${tcn}~
AK5*A~
AK9*A*1*1*1~
SE*6*0001~
GE*1*${gcn}~
IEA*1*${icn}~`;
}
