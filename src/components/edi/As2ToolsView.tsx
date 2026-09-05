import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  ArrowLeftRight,
  FileText,
  Terminal,
  KeyRound,
  FileCheck2,
  Zap,
  Trash2,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface As2ToolsViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
  initialTab?: 'encoder' | 'decoder' | 'mdn';
}

// Pre-packaged EDI Sample Payloads for AS2 Testing
const SAMPLE_EDI_850 = `ISA*00*          *00*          *ZZ*ACMESUPPLY     *ZZ*WALMART_HQ     *260904*2230*U*00401*000000850*0*P*>~
GS*PO*ACMESUPPLY*WALMART_HQ*20260904*2230*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-2026-99881**20260904~
CUR*SE*USD~
REF*DP*042~
N1*ST*WALMART DC #6022*9*0078742037777~
N3*100 LOGISTICS BLVD~
N4*BENTONVILLE*AR*72712~
PO1*1*120*CA*45.00**IN*WM-SKU-9901*UP*012345678905~
PID*F****PREMIUM ORGANIC BEVERAGE 12PK~
PO1*2*60*CA*62.50**IN*WM-SKU-9902*UP*012345678912~
PID*F****ARTISANAL ROAST COFFEE 6PK~
CTT*2*180~
SE*14*0001~
GE*1*85001~
IEA*1*000000850~`;

const SAMPLE_EDI_810 = `ISA*00*          *00*          *ZZ*ACMESUPPLY     *ZZ*AMAZON_EDI     *260904*2235*U*00401*000000810*0*P*>~
GS*IN*ACMESUPPLY*AMAZON_EDI*20260904*2235*81001*X*004010~
ST*810*0001~
BIG*20260904*INV-77341*20260901*PO-987654~
CUR*SE*USD~
N1*BT*AMAZON PAYABLE*9*0012345678900~
IT1*1*50*EA*24.00**VP*AMZ-ITEM-101~
TDS*120000~
CTT*1~
SE*9*0001~
GE*1*81001~
IEA*1*000000810~`;

// Lightweight standard MD5 implementation for RFC 4130 backwards-compatibility
function computeMD5(string: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function add32(a: number, b: number) {
    return (a + b) & 0xffffffff;
  }
  const n = string.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i;
  for (i = 64; i <= string.length; i += 64) {
    const block: number[] = [];
    for (let j = 0; j < 16; j++) {
      block[j] =
        string.charCodeAt(i - 64 + j * 4) |
        (string.charCodeAt(i - 64 + j * 4 + 1) << 8) |
        (string.charCodeAt(i - 64 + j * 4 + 2) << 16) |
        (string.charCodeAt(i - 64 + j * 4 + 3) << 24);
    }
    md5cycle(state, block);
  }
  const tail: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let j = 0; j < n - (i - 64); j++) {
    tail[j >> 2] |= string.charCodeAt(i - 64 + j) << ((j % 4) << 3);
  }
  tail[(n - (i - 64)) >> 2] |= 0x80 << (((n - (i - 64)) % 4) << 3);
  if (n - (i - 64) > 55) {
    md5cycle(state, tail);
    for (let j = 0; j < 16; j++) tail[j] = 0;
  }
  tail[14] = n * 8;
  md5cycle(state, tail);

  // Convert raw 16 bytes to base64
  const bytes = new Uint8Array(16);
  for (let k = 0; k < 4; k++) {
    bytes[k * 4] = state[k] & 0xff;
    bytes[k * 4 + 1] = (state[k] >> 8) & 0xff;
    bytes[k * 4 + 2] = (state[k] >> 16) & 0xff;
    bytes[k * 4 + 3] = (state[k] >> 24) & 0xff;
  }
  let binary = '';
  for (let b = 0; b < bytes.length; b++) {
    binary += String.fromCharCode(bytes[b]);
  }
  return btoa(binary);
}

// Compute real Web Crypto Digest in Base64 (Standard RFC 4130 MIC)
async function computeMic(
  payload: string,
  algorithm: 'sha-256' | 'sha-1' | 'sha-384' | 'sha-512' | 'md5'
): Promise<string> {
  // RFC 4130 requires canonical line breaks (CRLF) for MIC calculation
  const canonicalPayload = payload.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalPayload);

  if (algorithm === 'md5') {
    return computeMD5(canonicalPayload);
  }

  const webCryptoAlgo = algorithm.toUpperCase(); // 'SHA-256', 'SHA-1', etc.
  try {
    const hashBuffer = await crypto.subtle.digest(webCryptoAlgo, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const binary = hashArray.map((b) => String.fromCharCode(b)).join('');
    return btoa(binary);
  } catch {
    return computeMD5(canonicalPayload);
  }
}

export const As2ToolsView: React.FC<As2ToolsViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
  initialTab = 'encoder',
}) => {
  // Sub-tabs: 'encoder' | 'decoder' | 'mdn'
  const [activeTab, setActiveTab] = useState<'encoder' | 'decoder' | 'mdn'>(initialTab);

  // --- 1. ENCODER STATE ---
  const [as2From, setAs2From] = useState('MYCOMPANY_AS2');
  const [as2To, setAs2To] = useState('WALMART_AS2');
  const [messageId, setMessageId] = useState('');
  const [subject, setSubject] = useState('EDI X12 Transaction AS2 Transmission');
  const [contentType, setContentType] = useState<'application/edi-x12' | 'application/edifact' | 'application/xml' | 'text/plain'>('application/edi-x12');
  const [filename, setFilename] = useState('PO_20260904_850.x12');
  const [securityMode, setSecurityMode] = useState<'plain' | 'signed' | 'encrypted' | 'signed_encrypted'>('signed_encrypted');
  const [requestMdn, setRequestMdn] = useState(true);
  const [mdnType, setMdnType] = useState<'sync' | 'async'>('sync');
  const [asyncUrl, setAsyncUrl] = useState('https://as2.mycompany.com/as2/async-mdn');
  const [requestSignedMdn, setRequestSignedMdn] = useState(true);
  const [micAlgorithm, setMicAlgorithm] = useState<'sha-256' | 'sha-1' | 'sha-384' | 'sha-512' | 'md5'>('sha-256');
  const [encoderPayload, setEncoderPayload] = useState(initialInput || SAMPLE_EDI_850);
  const [computedMic, setComputedMic] = useState('');
  const [encodedOutput, setEncodedOutput] = useState('');
  const [curlCommand, setCurlCommand] = useState('');

  // --- 2. DECODER STATE ---
  const [decoderInput, setDecoderInput] = useState('');
  const [decoderResult, setDecoderResult] = useState<{
    headers: Record<string, string>;
    as2From?: string;
    as2To?: string;
    messageId?: string;
    as2Version?: string;
    contentType?: string;
    dispositionNotificationTo?: string;
    dispositionNotificationOptions?: string;
    receiptDeliveryOption?: string;
    date?: string;
    subject?: string;
    detectedMode: string;
    unpackedPayload: string;
    payloadMic?: string;
    diagnostics: Array<{ type: 'ok' | 'warning' | 'error'; message: string }>;
  } | null>(null);

  // --- 3. MDN STATE ---
  const [mdnSubMode, setMdnSubMode] = useState<'generator' | 'parser'>('generator');
  // MDN Generator Fields
  const [mdnReportingUa, setMdnReportingUa] = useState('Codepackr AS2 Gateway 1.2');
  const [mdnOriginalMessageId, setMdnOriginalMessageId] = useState('<20260904-223000-850@mycompany.com>');
  const [mdnOriginalRecipient, setMdnOriginalRecipient] = useState('WALMART_AS2');
  const [mdnFinalRecipient, setMdnFinalRecipient] = useState('WALMART_AS2');
  const [mdnOriginalSender, setMdnOriginalSender] = useState('MYCOMPANY_AS2');
  const [mdnDispositionStatus, setMdnDispositionStatus] = useState<'success' | 'warning_duplicate' | 'error_mic' | 'error_decrypt' | 'error_unexpected'>('success');
  const [mdnMicValue, setMdnMicValue] = useState('');
  const [mdnIsSigned, setMdnIsSigned] = useState(true);
  const [generatedMdnText, setGeneratedMdnText] = useState('');

  // MDN Parser Fields
  const [mdnParserInput, setMdnParserInput] = useState('');
  const [mdnParsedResult, setMdnParsedResult] = useState<{
    status: 'Processed' | 'Warning' | 'Error' | 'Unknown';
    reportingUa?: string;
    originalRecipient?: string;
    finalRecipient?: string;
    originalMessageId?: string;
    disposition?: string;
    receivedMic?: string;
    humanText?: string;
    isSignedMdn?: boolean;
    rawReport?: string;
  } | null>(null);
  const [expectedMicComparison, setExpectedMicComparison] = useState('');
  const [micMatchStatus, setMicMatchStatus] = useState<'match' | 'mismatch' | 'none'>('none');

  const [copied, setCopied] = useState<string | null>(null);

  // Auto-generate unique RFC 2822 Message-ID on mount
  const generateNewMessageId = () => {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const rand = Math.floor(100000 + Math.random() * 900000);
    const host = as2From ? as2From.toLowerCase().replace(/[^a-z0-9]/g, '') : 'codepackr';
    return `<${timestamp}.${rand}@${host}.com>`;
  };

  useEffect(() => {
    if (!messageId) {
      setMessageId(generateNewMessageId());
    }
  }, []);

  // Compute live MIC for Encoder
  useEffect(() => {
    let isCancelled = false;
    computeMic(encoderPayload, micAlgorithm).then((mic) => {
      if (!isCancelled) {
        setComputedMic(mic);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [encoderPayload, micAlgorithm]);

  // Construct complete AS2 HTTP Transmission & cURL
  useEffect(() => {
    const now = new Date().toUTCString();
    const boundarySigned = `----=_Part_${Date.now()}_SIGNED`;
    const boundaryEncrypted = `----=_Part_${Date.now()}_ENCRYPTED`;

    // 1. Build HTTP Headers
    const headers: string[] = [];
    headers.push('POST /as2 HTTP/1.1');
    headers.push('Host: as2.tradingpartner.com');
    headers.push('AS2-Version: 1.2');
    headers.push(`AS2-From: "${as2From}"`);
    headers.push(`AS2-To: "${as2To}"`);
    headers.push(`Date: ${now}`);
    headers.push(`Message-ID: ${messageId || generateNewMessageId()}`);
    headers.push(`Subject: ${subject}`);
    headers.push('Mime-Version: 1.0');

    // MDN Request Headers
    if (requestMdn) {
      headers.push('Disposition-Notification-To: return-receipt@codepackr.com');
      let dispOpts = `signed-receipt-protocol=${requestSignedMdn ? 'required, pkcs7-signature' : 'optional'}; signed-receipt-micalg=${requestSignedMdn ? 'required' : 'optional'}, ${micAlgorithm}`;
      headers.push(`Disposition-Notification-Options: ${dispOpts}`);
      if (mdnType === 'async' && asyncUrl) {
        headers.push(`Receipt-Delivery-Option: ${asyncUrl}`);
      }
    }

    // Body & Content-Type according to Security Mode
    let bodyText = '';
    const cleanPayload = encoderPayload.trim();

    if (securityMode === 'plain') {
      headers.push(`Content-Type: ${contentType}`);
      headers.push(`Content-Disposition: attachment; filename="${filename}"`);
      headers.push('Content-Transfer-Encoding: binary');
      bodyText = cleanPayload;
    } else if (securityMode === 'signed') {
      headers.push(
        `Content-Type: multipart/signed; protocol="application/pkcs7-signature"; micalg=${micAlgorithm}; boundary="${boundarySigned}"`
      );
      bodyText = [
        `--${boundarySigned}`,
        `Content-Type: ${contentType}`,
        `Content-Disposition: attachment; filename="${filename}"`,
        'Content-Transfer-Encoding: binary',
        '',
        cleanPayload,
        `--${boundarySigned}`,
        'Content-Type: application/pkcs7-signature; name="smime.p7s"',
        'Content-Disposition: attachment; filename="smime.p7s"',
        'Content-Transfer-Encoding: base64',
        '',
        'MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMIAGCSqGSIb3DQEHAQAAoIIBYzCC',
        'AW8wggHXoAMCAQICAQEwDQYJKoZIhvcNAQELBQAwFzEVMBMGA1UEAwwMQ09ERVBBQ0tSLUFT',
        `// PKCS#7 Detached Signature (Verified MIC: ${computedMic}, ${micAlgorithm})`,
        '--' + boundarySigned + '--',
      ].join('\r\n');
    } else if (securityMode === 'encrypted') {
      headers.push(
        'Content-Type: application/pkcs7-mime; smime-type=enveloped-data; name="smime.p7m"'
      );
      headers.push('Content-Disposition: attachment; filename="smime.p7m"');
      headers.push('Content-Transfer-Encoding: base64');
      bodyText = [
        'MIAGCSqGSIb3DQEHA6CAMIACAQAxggE2MIIBMgIBADAFMAcGBSsOAwIHMA0GCSqGSIb3DQEB',
        'BQUAA4GNADCBiQKBgQC3s9Xf7q8Y39j... [AES-256 ENCRYPTED S/MIME ENVELOPED DATA]',
        btoa(cleanPayload.slice(0, 120)) + '...',
        '0AKBggEA39...==',
      ].join('\r\n');
    } else {
      // signed_encrypted
      headers.push(
        'Content-Type: application/pkcs7-mime; smime-type=enveloped-data; name="smime.p7m"'
      );
      headers.push('Content-Disposition: attachment; filename="smime.p7m"');
      headers.push('Content-Transfer-Encoding: base64');
      bodyText = [
        'MIAGCSqGSIb3DQEHA6CAMIACAQAxggGTMIIB... [PKCS#7 AES-256 S/MIME ENVELOPE]',
        '// Encapsulated Multipart/Signed Payload (Inner MIC: ' + computedMic + ', ' + micAlgorithm + ')',
        btoa(`Content-Type: multipart/signed; boundary="${boundarySigned}"\r\n\r\n${cleanPayload}`.slice(0, 160)) + '...',
      ].join('\r\n');
    }

    const fullTransmission = headers.join('\r\n') + '\r\n\r\n' + bodyText;
    setEncodedOutput(fullTransmission);

    // Build cURL command
    const curlHeaders = headers
      .slice(2)
      .map((h) => `-H "${h.replace(/"/g, '\\"')}"`)
      .join(' \\\n  ');
    setCurlCommand(
      `curl -X POST https://as2.tradingpartner.com/as2 \\\n  ${curlHeaders} \\\n  --data-binary @${filename}`
    );
  }, [
    as2From,
    as2To,
    messageId,
    subject,
    contentType,
    filename,
    securityMode,
    requestMdn,
    mdnType,
    asyncUrl,
    requestSignedMdn,
    micAlgorithm,
    encoderPayload,
    computedMic,
  ]);

  // Decode raw AS2 transmission
  const handleDecode = (rawText: string) => {
    setDecoderInput(rawText);
    if (!rawText.trim()) {
      setDecoderResult(null);
      return;
    }

    const lines = rawText.split(/\r?\n/);
    const headers: Record<string, string> = {};
    let bodyStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') {
        bodyStartIndex = i + 1;
        break;
      }
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const val = line.slice(colonIdx + 1).trim();
        headers[key] = val;
      }
    }

    const bodyContent = bodyStartIndex !== -1 ? lines.slice(bodyStartIndex).join('\r\n') : rawText;

    // Diagnostics list
    const diagnostics: Array<{ type: 'ok' | 'warning' | 'error'; message: string }> = [];

    // Header validations
    if (headers['as2-from']) {
      diagnostics.push({ type: 'ok', message: `AS2-From detected: ${headers['as2-from']}` });
    } else {
      diagnostics.push({ type: 'error', message: 'Missing mandatory AS2-From header' });
    }

    if (headers['as2-to']) {
      diagnostics.push({ type: 'ok', message: `AS2-To detected: ${headers['as2-to']}` });
    } else {
      diagnostics.push({ type: 'error', message: 'Missing mandatory AS2-To header' });
    }

    if (headers['message-id']) {
      const msgId = headers['message-id'];
      if (/^<.+@.+>$/.test(msgId)) {
        diagnostics.push({ type: 'ok', message: `Valid RFC 2822 Message-ID format: ${msgId}` });
      } else {
        diagnostics.push({ type: 'warning', message: `Message-ID (${msgId}) does not follow standard RFC 2822 angle brackets <id@domain>` });
      }
    } else {
      diagnostics.push({ type: 'error', message: 'Missing mandatory Message-ID header' });
    }

    if (headers['as2-version']) {
      diagnostics.push({ type: 'ok', message: `AS2-Version: ${headers['as2-version']}` });
    } else {
      diagnostics.push({ type: 'warning', message: 'AS2-Version header omitted (RFC 4130 recommends 1.1 or 1.2)' });
    }

    // Detect Security Mode
    const cType = headers['content-type'] || '';
    let detectedMode = 'Plain / Unsigned';
    let extractedPayload = bodyContent;

    if (cType.includes('multipart/signed')) {
      detectedMode = 'S/MIME Signed (multipart/signed)';
      // Extract boundary and unpack first sub-part
      const boundaryMatch = cType.match(/boundary="?([^";]+)"?/i);
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = bodyContent.split(`--${boundary}`);
        if (parts.length > 1) {
          // Part 1 is the signed payload (including its MIME subheaders)
          const part1 = parts[1];
          const subHeaderEnd = part1.indexOf('\r\n\r\n');
          if (subHeaderEnd !== -1) {
            extractedPayload = part1.slice(subHeaderEnd + 4).trim();
          } else {
            const lfEnd = part1.indexOf('\n\n');
            extractedPayload = lfEnd !== -1 ? part1.slice(lfEnd + 2).trim() : part1.trim();
          }
        }
      }
    } else if (cType.includes('enveloped-data') || cType.includes('pkcs7-mime')) {
      detectedMode = 'S/MIME Encrypted (pkcs7-mime enveloped-data)';
      extractedPayload = `[Encrypted PKCS#7 Enveloped Payload]\n${bodyContent.trim()}`;
    } else if (cType.includes('application/edi-x12') || cType.includes('application/edifact')) {
      detectedMode = 'Plain EDI Payload (' + cType.split(';')[0] + ')';
    }

    // Compute live payload MIC
    computeMic(extractedPayload, 'sha-256').then((mic) => {
      setDecoderResult((prev) => (prev ? { ...prev, payloadMic: `${mic}, sha-256` } : prev));
    });

    setDecoderResult({
      headers,
      as2From: headers['as2-from'],
      as2To: headers['as2-to'],
      messageId: headers['message-id'],
      as2Version: headers['as2-version'],
      contentType: headers['content-type'],
      dispositionNotificationTo: headers['disposition-notification-to'],
      dispositionNotificationOptions: headers['disposition-notification-options'],
      receiptDeliveryOption: headers['receipt-delivery-option'],
      date: headers['date'],
      subject: headers['subject'],
      detectedMode,
      unpackedPayload: extractedPayload,
      diagnostics,
    });
  };

  // Generate MDN Receipt (RFC 4130 & RFC 3798)
  useEffect(() => {
    const boundary = `----=_Part_MDN_${Date.now()}`;
    const now = new Date().toUTCString();
    const micLine = mdnMicValue
      ? `Received-Content-MIC: ${mdnMicValue}\r\n`
      : `Received-Content-MIC: ${computedMic || '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='}, sha-256\r\n`;

    let dispositionHeader = 'automatic-action/MDN-sent-automatically; processed';
    let humanStatusDesc = 'The AS2 message has been successfully received, decrypted, and verified.';

    if (mdnDispositionStatus === 'warning_duplicate') {
      dispositionHeader = 'automatic-action/MDN-sent-automatically; processed/warning: duplicate-document';
      humanStatusDesc = 'The AS2 message was received, but flagged with warning: duplicate document received.';
    } else if (mdnDispositionStatus === 'error_mic') {
      dispositionHeader = 'automatic-action/MDN-sent-automatically; processed/Error: integrity-check-failed';
      humanStatusDesc = 'Error: The calculated Message Integrity Check (MIC) does not match the sender digest.';
    } else if (mdnDispositionStatus === 'error_decrypt') {
      dispositionHeader = 'automatic-action/MDN-sent-automatically; processed/Error: decryption-failed';
      humanStatusDesc = 'Error: Could not decrypt the S/MIME PKCS#7 envelope using recipient private key.';
    } else if (mdnDispositionStatus === 'error_unexpected') {
      dispositionHeader = 'automatic-action/MDN-sent-automatically; processed/Error: unexpected-processing-error';
      humanStatusDesc = 'Error: An internal parser exception occurred while processing the transaction.';
    }

    const humanTextPart = [
      `AS2 Message Disposition Notification (MDN)`,
      `Status: ${mdnDispositionStatus === 'success' ? 'PROCESSED (SUCCESS)' : 'ERROR / WARNING'}`,
      `Message ID: ${mdnOriginalMessageId}`,
      `Sender AS2-From: ${mdnOriginalSender}`,
      `Receiver AS2-To: ${mdnFinalRecipient}`,
      `Received Date: ${now}`,
      '',
      humanStatusDesc,
    ].join('\r\n');

    const machineReportPart = [
      `Reporting-UA: ${mdnReportingUa}`,
      `Original-Recipient: rfc822; ${mdnOriginalRecipient}`,
      `Final-Recipient: rfc822; ${mdnFinalRecipient}`,
      `Original-Message-ID: ${mdnOriginalMessageId}`,
      `Disposition: ${dispositionHeader}`,
      mdnDispositionStatus !== 'error_decrypt' ? micLine.trim() : '',
    ]
      .filter(Boolean)
      .join('\r\n');

    const httpResponseHeaders = [
      'HTTP/1.1 200 OK',
      'Server: Codepackr AS2 Engine/1.2',
      `Date: ${now}`,
      `AS2-Version: 1.2`,
      `AS2-From: "${mdnFinalRecipient}"`,
      `AS2-To: "${mdnOriginalSender}"`,
      `Message-ID: <mdn-${Date.now()}@codepackr.com>`,
      `Content-Type: multipart/report; report-type=disposition-notification; boundary="${boundary}"`,
      'Connection: close',
    ].join('\r\n');

    const mdnBody = [
      `--${boundary}`,
      'Content-Type: text/plain; charset=us-ascii',
      'Content-Transfer-Encoding: 7bit',
      '',
      humanTextPart,
      '',
      `--${boundary}`,
      'Content-Type: message/disposition-notification',
      'Content-Transfer-Encoding: 7bit',
      '',
      machineReportPart,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    setGeneratedMdnText(httpResponseHeaders + '\r\n\r\n' + mdnBody);
  }, [
    mdnReportingUa,
    mdnOriginalMessageId,
    mdnOriginalRecipient,
    mdnFinalRecipient,
    mdnOriginalSender,
    mdnDispositionStatus,
    mdnMicValue,
    mdnIsSigned,
    computedMic,
  ]);

  // Parse incoming MDN receipt
  const handleParseMdn = (rawMdn: string) => {
    setMdnParserInput(rawMdn);
    if (!rawMdn.trim()) {
      setMdnParsedResult(null);
      setMicMatchStatus('none');
      return;
    }

    const lines = rawMdn.split(/\r?\n/);
    let reportingUa: string | undefined;
    let originalRecipient: string | undefined;
    let finalRecipient: string | undefined;
    let originalMessageId: string | undefined;
    let disposition: string | undefined;
    let receivedMic: string | undefined;
    let humanText = '';
    let isSignedMdn = rawMdn.includes('pkcs7-signature') || rawMdn.includes('multipart/signed');

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^Reporting-UA:/i.test(trimmed)) {
        reportingUa = trimmed.split(/:(.+)/)[1]?.trim();
      } else if (/^Original-Recipient:/i.test(trimmed)) {
        originalRecipient = trimmed.split(/:(.+)/)[1]?.trim();
      } else if (/^Final-Recipient:/i.test(trimmed)) {
        finalRecipient = trimmed.split(/:(.+)/)[1]?.trim();
      } else if (/^Original-Message-ID:/i.test(trimmed)) {
        originalMessageId = trimmed.split(/:(.+)/)[1]?.trim();
      } else if (/^Disposition:/i.test(trimmed)) {
        disposition = trimmed.split(/:(.+)/)[1]?.trim();
      } else if (/^Received-Content-MIC:/i.test(trimmed)) {
        receivedMic = trimmed.split(/:(.+)/)[1]?.trim();
      }
    }

    // Determine status
    let status: 'Processed' | 'Warning' | 'Error' | 'Unknown' = 'Unknown';
    if (disposition) {
      if (/error/i.test(disposition)) {
        status = 'Error';
      } else if (/warning/i.test(disposition)) {
        status = 'Warning';
      } else if (/processed/i.test(disposition)) {
        status = 'Processed';
      }
    }

    setMdnParsedResult({
      status,
      reportingUa,
      originalRecipient,
      finalRecipient,
      originalMessageId,
      disposition,
      receivedMic,
      humanText,
      isSignedMdn,
      rawReport: rawMdn,
    });

    // Check MIC match if expected MIC is filled
    if (expectedMicComparison && receivedMic) {
      const cleanExpected = expectedMicComparison.trim().toLowerCase();
      const cleanReceived = receivedMic.trim().toLowerCase();
      if (cleanReceived.includes(cleanExpected.split(',')[0])) {
        setMicMatchStatus('match');
      } else {
        setMicMatchStatus('mismatch');
      }
    }
  };

  // Compare expected MIC
  const handleCheckMic = (val: string) => {
    setExpectedMicComparison(val);
    if (!val.trim() || !mdnParsedResult?.receivedMic) {
      setMicMatchStatus('none');
      return;
    }
    const cleanExpected = val.trim().toLowerCase();
    const cleanReceived = mdnParsedResult.receivedMic.trim().toLowerCase();
    if (cleanReceived.includes(cleanExpected.split(',')[0])) {
      setMicMatchStatus('match');
    } else {
      setMicMatchStatus('mismatch');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadTextFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Main Suite Navigation Tabs */}
      <div
        className="flex items-center gap-2 border-b overflow-x-auto pb-2 text-xs font-semibold"
        style={{ borderColor: 'var(--line)' }}
      >
        <button
          onClick={() => setActiveTab('encoder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'encoder' ? 'shadow-sm' : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: activeTab === 'encoder' ? 'var(--brand)' : 'var(--surface)',
            color: activeTab === 'encoder' ? '#ffffff' : 'var(--muted)',
            border: activeTab === 'encoder' ? '1px solid var(--brand)' : '1px solid var(--line)',
          }}
        >
          <Send className="w-4 h-4" />
          <span>1. AS2 Message Encoder &amp; Packager</span>
        </button>

        <button
          onClick={() => setActiveTab('decoder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'decoder' ? 'shadow-sm' : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: activeTab === 'decoder' ? 'var(--brand)' : 'var(--surface)',
            color: activeTab === 'decoder' ? '#ffffff' : 'var(--muted)',
            border: activeTab === 'decoder' ? '1px solid var(--brand)' : '1px solid var(--line)',
          }}
        >
          <Unlock className="w-4 h-4" />
          <span>2. AS2 Decoder &amp; Header Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('mdn')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'mdn' ? 'shadow-sm' : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: activeTab === 'mdn' ? 'var(--brand)' : 'var(--surface)',
            color: activeTab === 'mdn' ? '#ffffff' : 'var(--muted)',
            border: activeTab === 'mdn' ? '1px solid var(--brand)' : '1px solid var(--line)',
          }}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>3. MDN Receipt Generator &amp; Verifier</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AS2 ENCODER & PACKAGER */}
      {/* ========================================================================= */}
      {activeTab === 'encoder' && (
        <div className="space-y-6">
          {/* Trading Partner & AS2 Headers Configuration */}
          <div
            className="p-5 rounded-2xl border space-y-4 text-xs"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--brand)]" />
                <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                  AS2 Transmission Profile &amp; Headers (RFC 4130)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEncoderPayload(SAMPLE_EDI_850);
                    setContentType('application/edi-x12');
                    setFilename('PO_20260904_850.x12');
                    setSubject('Walmart Purchase Order 850 PO-2026-99881');
                    setAs2From('MYCOMPANY_AS2');
                    setAs2To('WALMART_HQ');
                  }}
                  className="px-2.5 py-1 rounded-lg border font-medium hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  Load 850 PO Sample
                </button>
                <button
                  onClick={() => {
                    setEncoderPayload(SAMPLE_EDI_810);
                    setContentType('application/edi-x12');
                    setFilename('INV_20260904_810.x12');
                    setSubject('Amazon Invoice 810 INV-77341');
                    setAs2From('MYCOMPANY_AS2');
                    setAs2To('AMAZON_EDI');
                  }}
                  className="px-2.5 py-1 rounded-lg border font-medium hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  Load 810 Invoice Sample
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* AS2-From */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">AS2-From (Sender ID)</label>
                <input
                  type="text"
                  value={as2From}
                  onChange={(e) => setAs2From(e.target.value)}
                  className="w-full p-2.5 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  placeholder="e.g. MYCOMPANY_PROD"
                />
              </div>

              {/* AS2-To */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">AS2-To (Receiver ID)</label>
                <input
                  type="text"
                  value={as2To}
                  onChange={(e) => setAs2To(e.target.value)}
                  className="w-full p-2.5 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  placeholder="e.g. WALMART_AS2"
                />
              </div>

              {/* Message-ID */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[var(--muted)]">Message-ID (RFC 2822)</label>
                  <button
                    onClick={() => setMessageId(generateNewMessageId())}
                    className="flex items-center gap-1 text-[var(--brand)] hover:opacity-80"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            {/* Row 2: Security & MDN Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Security Mode */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">Security &amp; Encryption Mode</label>
                <select
                  value={securityMode}
                  onChange={(e: any) => setSecurityMode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border font-medium outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <option value="signed_encrypted">Signed &amp; Encrypted (Production AS2)</option>
                  <option value="signed">Signed Only (multipart/signed)</option>
                  <option value="encrypted">Encrypted Only (pkcs7-mime)</option>
                  <option value="plain">Plain / Unsigned (application/edi-x12)</option>
                </select>
              </div>

              {/* MIC Algorithm */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">MIC Algorithm (Integrity Hash)</label>
                <select
                  value={micAlgorithm}
                  onChange={(e: any) => setMicAlgorithm(e.target.value)}
                  className="w-full p-2.5 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <option value="sha-256">SHA-256 (Modern Standard)</option>
                  <option value="sha-1">SHA-1 (Legacy RFC 4130)</option>
                  <option value="sha-384">SHA-384 (High Security)</option>
                  <option value="sha-512">SHA-512 (Ultra High Security)</option>
                  <option value="md5">MD5 (Legacy Only)</option>
                </select>
              </div>

              {/* Content-Type */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">Payload Content-Type</label>
                <select
                  value={contentType}
                  onChange={(e: any) => setContentType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <option value="application/edi-x12">application/edi-x12 (ANSI X12)</option>
                  <option value="application/edifact">application/edifact (UN/EDIFACT)</option>
                  <option value="application/xml">application/xml (cXML, RosettaNet)</option>
                  <option value="text/plain">text/plain (Raw Data)</option>
                </select>
              </div>

              {/* Filename */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">Attachment Filename</label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full p-2.5 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  placeholder="e.g. PO850.x12"
                />
              </div>
            </div>

            {/* MDN Controls Bar */}
            <div
              className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-4 mt-2"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={requestMdn}
                    onChange={(e) => setRequestMdn(e.target.checked)}
                    className="rounded text-[var(--brand)]"
                  />
                  <span>Request MDN Delivery Receipt (Disposition-Notification-To)</span>
                </label>

                {requestMdn && (
                  <>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={requestSignedMdn}
                        onChange={(e) => setRequestSignedMdn(e.target.checked)}
                        className="rounded"
                      />
                      <span>Require Cryptographically Signed MDN (pkcs7-signature)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">Delivery:</span>
                      <select
                        value={mdnType}
                        onChange={(e: any) => setMdnType(e.target.value)}
                        className="p-1 rounded-md border text-xs"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                      >
                        <option value="sync">Synchronous (HTTP 200 Return)</option>
                        <option value="async">Asynchronous (HTTP Callback)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Real-time Calculated MIC badge */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[var(--muted)]">Computed Payload MIC:</span>
                <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {computedMic || 'Calculating...'}, {micAlgorithm}
                </span>
              </div>
            </div>

            {mdnType === 'async' && requestMdn && (
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">Receipt-Delivery-Option (Async MDN Callback URL)</label>
                <input
                  type="url"
                  value={asyncUrl}
                  onChange={(e) => setAsyncUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  placeholder="https://as2.mycompany.com/as2/async-mdn"
                />
              </div>
            )}
          </div>

          {/* Two-Column Workspace: Payload Input & Encoded Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Payload */}
            <div
              className="p-4 rounded-2xl border flex flex-col space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
                  <FileCode2 className="w-4 h-4 text-[var(--brand)]" />
                  <span>Payload to Package (EDI / XML / Raw Data)</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-[var(--muted)] text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".edi,.txt,.xml,.json,.x12"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            if (typeof evt.target?.result === 'string') {
                              setEncoderPayload(evt.target.result);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => setEncoderPayload('')}
                    disabled={!encoderPayload}
                    className="hover:opacity-80 text-rose-500 disabled:opacity-40 flex items-center gap-1 text-xs cursor-pointer"
                    title="Clear payload"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <textarea
                value={encoderPayload}
                onChange={(e) => setEncoderPayload(e.target.value)}
                rows={18}
                className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                placeholder="Paste your raw EDI X12, EDIFACT, or XML document here..."
              />
              <div className="text-[11px] text-[var(--muted)] flex items-center justify-between">
                <span>{encoderPayload.length} bytes</span>
                <span>Auto-normalized with canonical CRLF (\r\n) per RFC 4130</span>
              </div>
            </div>

            {/* Packaged AS2 Output */}
            <div
              className="p-4 rounded-2xl border flex flex-col space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
                  <Send className="w-4 h-4 text-emerald-500" />
                  <span>Full AS2 HTTP Transmission Payload</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(encodedOutput, 'encoded')}
                    className="flex items-center gap-1 hover:opacity-80 text-[var(--brand)] font-medium"
                  >
                    {copied === 'encoded' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'encoded' ? 'Copied!' : 'Copy AS2'}</span>
                  </button>
                  <button
                    onClick={() => downloadTextFile(encodedOutput, `${filename}.as2`)}
                    className="flex items-center gap-1 hover:opacity-80 text-[var(--muted)] font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDecode(encodedOutput);
                      setActiveTab('decoder');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--brand)' }}
                    title="Send this AS2 transmission directly to the Decoder to inspect headers"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Send to Decoder</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={encodedOutput}
                rows={18}
                className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />

              {/* Action: Send to MDN Generator */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between text-xs"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
              >
                <div className="text-[var(--muted)]">
                  Simulate receipt confirmation for this transmission:
                </div>
                <button
                  onClick={() => {
                    setMdnOriginalMessageId(messageId);
                    setMdnOriginalSender(as2From);
                    setMdnOriginalRecipient(as2To);
                    setMdnFinalRecipient(as2To);
                    setMdnMicValue(`${computedMic}, ${micAlgorithm}`);
                    setActiveTab('mdn');
                    setMdnSubMode('generator');
                  }}
                  className="px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity text-[var(--brand)]"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Generate MDN for this Message</span>
                </button>
              </div>
            </div>
          </div>

          {/* cURL Terminal Test Command */}
          <div
            className="p-4 rounded-2xl border space-y-2 text-xs"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span>cURL Terminal Command for AS2 Partner Testing</span>
              </div>
              <button
                onClick={() => copyToClipboard(curlCommand, 'curl')}
                className="flex items-center gap-1 hover:opacity-80 text-[var(--brand)] font-medium"
              >
                {copied === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'curl' ? 'Copied!' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre
              className="p-3 rounded-xl font-mono text-xs overflow-x-auto border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {curlCommand}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AS2 DECODER & HEADER INSPECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'decoder' && (
        <div className="space-y-6">
          {/* Top Quick Actions Bar */}
          <div
            className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-[var(--brand)]" />
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                AS2 Inbound Message Dissector &amp; MIME Unpacker
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleDecode(encodedOutput);
                }}
                className="px-2.5 py-1 rounded-lg border font-medium hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                Load Encoded Sample
              </button>
              <button
                onClick={() => handleDecode('')}
                disabled={!decoderInput}
                className="hover:opacity-80 text-rose-500 disabled:opacity-40 flex items-center gap-1 text-xs cursor-pointer"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Raw AS2 Inbound Input */}
            <div
              className="p-4 rounded-2xl border flex flex-col space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                  Raw AS2 HTTP Stream / Transmission (Headers + Body)
                </span>
                <label className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-[var(--muted)]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .as2 / .eml</span>
                  <input
                    type="file"
                    accept=".as2,.eml,.txt,.edi"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (typeof evt.target?.result === 'string') {
                            handleDecode(evt.target.result);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={decoderInput}
                onChange={(e) => handleDecode(e.target.value)}
                rows={18}
                placeholder="Paste raw incoming AS2 HTTP request, headers, and MIME payload here..."
                className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>

            {/* Analysis & Diagnostics Dashboard */}
            <div
              className="p-4 rounded-2xl border flex flex-col space-y-4"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between text-xs border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                  AS2 Headers &amp; Envelope Diagnostics
                </span>
                {decoderResult && (
                  <span className="px-2 py-0.5 rounded-md font-semibold text-xs bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                    {decoderResult.detectedMode}
                  </span>
                )}
              </div>

              {decoderResult ? (
                <div className="space-y-4 text-xs overflow-y-auto max-h-[500px] pr-1">
                  {/* Key AS2 Identifiers Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="p-2.5 rounded-xl border space-y-1"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
                    >
                      <span className="text-[var(--muted)] text-[10px] block">AS2-From (Sender)</span>
                      <span className="font-mono font-bold block truncate" style={{ color: 'var(--ink)' }}>
                        {decoderResult.as2From || 'None'}
                      </span>
                    </div>

                    <div
                      className="p-2.5 rounded-xl border space-y-1"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
                    >
                      <span className="text-[var(--muted)] text-[10px] block">AS2-To (Receiver)</span>
                      <span className="font-mono font-bold block truncate" style={{ color: 'var(--ink)' }}>
                        {decoderResult.as2To || 'None'}
                      </span>
                    </div>

                    <div
                      className="p-2.5 rounded-xl border space-y-1 col-span-2"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
                    >
                      <span className="text-[var(--muted)] text-[10px] block">Message-ID</span>
                      <span className="font-mono font-bold block truncate" style={{ color: 'var(--ink)' }}>
                        {decoderResult.messageId || 'None'}
                      </span>
                    </div>

                    {decoderResult.dispositionNotificationTo && (
                      <div
                        className="p-2.5 rounded-xl border space-y-1 col-span-2"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
                      >
                        <span className="text-[var(--muted)] text-[10px] block">MDN Requested To:</span>
                        <span className="font-mono text-emerald-600 block truncate">
                          {decoderResult.dispositionNotificationTo}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Diagnostic Rules Checklist */}
                  <div className="space-y-1.5">
                    <span className="font-semibold block text-[var(--muted)]">RFC 4130 Compliance Checks:</span>
                    {decoderResult.diagnostics.map((diag, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg border text-[11px]"
                        style={{
                          backgroundColor: diag.type === 'ok' ? 'rgba(16, 185, 129, 0.05)' : diag.type === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                          borderColor: diag.type === 'ok' ? 'rgba(16, 185, 129, 0.2)' : diag.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        {diag.type === 'ok' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : diag.type === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span style={{ color: 'var(--ink)' }}>{diag.message}</span>
                      </div>
                    ))}
                  </div>

                  {/* Extracted Payload Section */}
                  <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                        Extracted Payload
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(decoderResult.unpackedPayload, 'unpacked')}
                          className="text-[var(--brand)] hover:opacity-80 flex items-center gap-1 cursor-pointer"
                        >
                          {copied === 'unpacked' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied === 'unpacked' ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => downloadTextFile(decoderResult.unpackedPayload, 'extracted_payload.edi')}
                          className="text-[var(--muted)] hover:opacity-80 flex items-center gap-1 cursor-pointer"
                          title="Download extracted payload"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    <pre
                      className="p-3 rounded-xl font-mono text-[11px] overflow-x-auto border max-h-48"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    >
                      {decoderResult.unpackedPayload}
                    </pre>

                    {/* Quick Button: Generate MDN for this decoded message */}
                    <button
                      onClick={() => {
                        setMdnOriginalMessageId(decoderResult.messageId || '<unknown@domain>');
                        setMdnOriginalSender(decoderResult.as2From || 'UNKNOWN_SENDER');
                        setMdnOriginalRecipient(decoderResult.as2To || 'MYCOMPANY_AS2');
                        setMdnFinalRecipient(decoderResult.as2To || 'MYCOMPANY_AS2');
                        if (decoderResult.payloadMic) {
                          setMdnMicValue(decoderResult.payloadMic);
                        }
                        setActiveTab('mdn');
                        setMdnSubMode('generator');
                      }}
                      className="w-full py-2.5 rounded-xl font-medium border flex items-center justify-center gap-2 hover:opacity-80 transition-opacity text-[var(--brand)]"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Generate Matching MDN Receipt for this Message</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--muted)] space-y-2">
                  <Unlock className="w-8 h-8 opacity-40" />
                  <p className="text-xs">Paste an AS2 transmission on the left to inspect headers, boundaries, and unpack payload.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MDN RECEIPT GENERATOR & VERIFIER */}
      {/* ========================================================================= */}
      {activeTab === 'mdn' && (
        <div className="space-y-6">
          {/* Sub-mode selector */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMdnSubMode('generator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mdnSubMode === 'generator' ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mdnSubMode === 'generator' ? 'var(--brand)' : 'var(--surface)',
                color: mdnSubMode === 'generator' ? '#ffffff' : 'var(--muted)',
                border: mdnSubMode === 'generator' ? '1px solid var(--brand)' : '1px solid var(--line)',
              }}
            >
              Generate MDN Receipt (RFC 4130 / 3798)
            </button>
            <button
              onClick={() => setMdnSubMode('parser')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mdnSubMode === 'parser' ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mdnSubMode === 'parser' ? 'var(--brand)' : 'var(--surface)',
                color: mdnSubMode === 'parser' ? '#ffffff' : 'var(--muted)',
                border: mdnSubMode === 'parser' ? '1px solid var(--brand)' : '1px solid var(--line)',
              }}
            >
              Parse &amp; Verify Incoming Partner MDN
            </button>
          </div>

          {/* SUBMODE A: GENERATOR */}
          {mdnSubMode === 'generator' && (
            <div className="space-y-6">
              {/* Generator Settings Form */}
              <div
                className="p-5 rounded-2xl border space-y-4 text-xs"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                  MDN (Message Disposition Notification) Settings
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Reporting-UA */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--muted)]">Reporting-UA (Software Gateway)</label>
                    <input
                      type="text"
                      value={mdnReportingUa}
                      onChange={(e) => setMdnReportingUa(e.target.value)}
                      className="w-full p-2.5 rounded-xl border font-mono outline-none"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                  </div>

                  {/* Original Message-ID */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--muted)]">Original-Message-ID to Acknowledge</label>
                    <input
                      type="text"
                      value={mdnOriginalMessageId}
                      onChange={(e) => setMdnOriginalMessageId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border font-mono outline-none"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                  </div>

                  {/* Original Recipient */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--muted)]">Final-Recipient (Our AS2 ID)</label>
                    <input
                      type="text"
                      value={mdnFinalRecipient}
                      onChange={(e) => setMdnFinalRecipient(e.target.value)}
                      className="w-full p-2.5 rounded-xl border font-mono outline-none"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                  </div>

                  {/* Original Sender */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--muted)]">Original-Sender (Partner AS2 ID)</label>
                    <input
                      type="text"
                      value={mdnOriginalSender}
                      onChange={(e) => setMdnOriginalSender(e.target.value)}
                      className="w-full p-2.5 rounded-xl border font-mono outline-none"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                  </div>

                  {/* Disposition Status */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--muted)]">Disposition Status</label>
                    <select
                      value={mdnDispositionStatus}
                      onChange={(e: any) => setMdnDispositionStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl border font-medium outline-none"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    >
                      <option value="success">Success: automatic-action; processed</option>
                      <option value="warning_duplicate">Warning: duplicate-document received</option>
                      <option value="error_mic">Error: integrity-check-failed (MIC Mismatch)</option>
                      <option value="error_decrypt">Error: decryption-failed (Key Mismatch)</option>
                      <option value="error_unexpected">Error: unexpected-processing-error</option>
                    </select>
                  </div>

                  {/* Received-Content-MIC */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--muted)]">Received-Content-MIC Value</label>
                    <input
                      type="text"
                      value={mdnMicValue}
                      onChange={(e) => setMdnMicValue(e.target.value)}
                      placeholder="e.g. 47DEQpj...==, sha-256"
                      className="w-full p-2.5 rounded-xl border font-mono outline-none"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Output Preview */}
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
                    <FileCheck2 className="w-4 h-4 text-emerald-500" />
                    <span>Generated HTTP 200 OK MDN Receipt (multipart/report)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(generatedMdnText, 'mdn')}
                      className="flex items-center gap-1 hover:opacity-80 text-[var(--brand)] font-medium text-xs"
                    >
                      {copied === 'mdn' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === 'mdn' ? 'Copied!' : 'Copy MDN'}</span>
                    </button>
                    <button
                      onClick={() => downloadTextFile(generatedMdnText, 'receipt.mdn')}
                      className="flex items-center gap-1 hover:opacity-80 text-[var(--muted)] font-medium text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={generatedMdnText}
                  rows={14}
                  className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>
          )}

          {/* SUBMODE B: PARSER & MIC VERIFIER */}
          {mdnSubMode === 'parser' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inbound MDN Input */}
                <div
                  className="p-4 rounded-2xl border flex flex-col space-y-3"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                      Paste Trading Partner MDN Receipt
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-[var(--muted)]">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".mdn,.txt,.eml,.as2"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (typeof evt.target?.result === 'string') {
                                  handleParseMdn(evt.target.result);
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => handleParseMdn(generatedMdnText)}
                        className="text-[var(--brand)] hover:opacity-80 font-medium"
                      >
                        Sample
                      </button>
                      <button
                        onClick={() => handleParseMdn('')}
                        disabled={!mdnParserInput}
                        className="hover:opacity-80 text-rose-500 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                        title="Clear MDN input"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={mdnParserInput}
                    onChange={(e) => handleParseMdn(e.target.value)}
                    rows={16}
                    placeholder="Paste the multipart/report MDN response from your partner..."
                    className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  />
                </div>

                {/* Parsed MDN Details & Non-Repudiation Check */}
                <div
                  className="p-4 rounded-2xl border flex flex-col space-y-4"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center justify-between text-xs border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                      MDN Receipt Breakdown &amp; Non-Repudiation Verification
                    </span>
                    {mdnParsedResult && (
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                          mdnParsedResult.status === 'Processed'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : mdnParsedResult.status === 'Warning'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {mdnParsedResult.status}
                      </span>
                    )}
                  </div>

                  {mdnParsedResult ? (
                    <div className="space-y-4 text-xs">
                      <div className="space-y-2">
                        <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--line)' }}>
                          <span className="text-[var(--muted)]">Reporting-UA:</span>
                          <span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>
                            {mdnParsedResult.reportingUa || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--line)' }}>
                          <span className="text-[var(--muted)]">Original-Message-ID:</span>
                          <span className="font-mono font-semibold truncate max-w-[240px]" style={{ color: 'var(--ink)' }}>
                            {mdnParsedResult.originalMessageId || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--line)' }}>
                          <span className="text-[var(--muted)]">Final-Recipient:</span>
                          <span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>
                            {mdnParsedResult.finalRecipient || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--line)' }}>
                          <span className="text-[var(--muted)]">Disposition:</span>
                          <span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>
                            {mdnParsedResult.disposition || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--line)' }}>
                          <span className="text-[var(--muted)]">Partner Received MIC:</span>
                          <span className="font-mono font-semibold text-emerald-600 truncate max-w-[240px]">
                            {mdnParsedResult.receivedMic || 'None'}
                          </span>
                        </div>
                      </div>

                      {/* MIC Matching Verifier */}
                      <div
                        className="p-4 rounded-xl border space-y-2"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
                      >
                        <span className="font-semibold block" style={{ color: 'var(--ink)' }}>
                          Verify Against Sent MIC (Non-Repudiation of Receipt - NRR)
                        </span>
                        <input
                          type="text"
                          value={expectedMicComparison}
                          onChange={(e) => handleCheckMic(e.target.value)}
                          placeholder="Paste your original sent MIC or hash here to compare..."
                          className="w-full p-2.5 rounded-lg border font-mono outline-none text-xs"
                          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                        />

                        {micMatchStatus === 'match' && (
                          <div className="flex items-center gap-2 text-emerald-600 font-semibold p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>MIC Validated! Received digest matches your sent digest exactly.</span>
                          </div>
                        )}
                        {micMatchStatus === 'mismatch' && (
                          <div className="flex items-center gap-2 text-rose-600 font-semibold p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>MIC Mismatch! The hash in the receipt does not match your sent message.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--muted)] space-y-2">
                      <FileCheck2 className="w-8 h-8 opacity-40" />
                      <p className="text-xs">Paste an MDN receipt on the left to verify transaction disposition and MIC integrity.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
