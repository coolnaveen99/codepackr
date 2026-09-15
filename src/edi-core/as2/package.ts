import { As2Package } from '../models/envelope';

export function packageAs2Mime(
  ediText: string,
  as2From = 'CODEPACKR_HUB',
  as2To = 'PARTNER_CORP',
  subject = 'EDI Transmission Dispatch'
): As2Package {
  const timestamp = Date.now();
  const msgId = `<AS2-${timestamp}-${Math.floor(Math.random() * 10000)}@codepackr.com>`;
  const date = new Date().toUTCString();
  const boundary = `----=_Part_${timestamp}_AS2_BOUNDARY`;

  const headers: Record<string, string> = {
    'AS2-Version': '1.2',
    'AS2-From': as2From,
    'AS2-To': as2To,
    'Message-ID': msgId,
    Subject: subject,
    'Content-Type': `multipart/signed; protocol="application/pkcs7-signature"; micalg=sha-256; boundary="${boundary}"`,
    Date: date,
    'Disposition-Notification-To': `as2-mdn@${as2From.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    'Disposition-Notification-Options': 'signed-receipt-protocol=optional, pkcs7-signature; signed-receipt-micalg=optional, sha-256',
  };

  const payload = ediText.trim();
  const signaturePreview = `MIAGCSqGSIb3DQEHAqCAMIACAQExDzANBglghkgBZQMEAgEFADCABgkqhkiG9w0BBwEAAKCAMIIF
AgIBATAwMzAKBggqhkiG9w0BAQICAQAwDjEMMAoGA1UEAxMDY29kZTEUMBIGA1UEBRMLQUNNRVNV
UExZ...[SHA256-DIGITAL-SIGNATURE-VERIFIED-BROWSER-MOCK]`;

  const rawEml = `POST /as2/receive HTTP/1.1
Host: as2.tradingpartner.com
AS2-Version: ${headers['AS2-Version']}
AS2-From: ${headers['AS2-From']}
AS2-To: ${headers['AS2-To']}
Message-ID: ${headers['Message-ID']}
Subject: ${headers.Subject}
Content-Type: ${headers['Content-Type']}
Date: ${headers.Date}
Disposition-Notification-To: ${headers['Disposition-Notification-To']}
Disposition-Notification-Options: ${headers['Disposition-Notification-Options']}

--${boundary}
Content-Type: application/edi-x12; name="transmission.edi"
Content-Transfer-Encoding: 8bit
Content-Disposition: attachment; filename="transmission.edi"

${payload}
--${boundary}
Content-Type: application/pkcs7-signature; name="smime.p7s"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="smime.p7s"

${signaturePreview}
--${boundary}--`;

  return {
    messageId: msgId,
    headers,
    mimeBoundary: boundary,
    payload,
    signaturePreview,
    rawEml,
    as2From,
    as2To,
    createdAt: new Date().toISOString(),
  };
}
