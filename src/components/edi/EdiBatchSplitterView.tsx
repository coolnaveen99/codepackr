import React, { useState, useMemo, useRef } from 'react';
import {
  Scissors,
  Layers,
  Download,
  Copy,
  Check,
  FileText,
  Upload,
  RotateCcw,
  Sparkles,
  Archive,
  ArrowRight,
  Filter,
  Eye,
  Plus,
  Trash2,
  Sliders,
  Settings2,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';
import JSZip from 'jszip';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { downloadFile } from '../../lib/smartDownload';

interface EdiBatchSplitterViewProps {
  tool: ToolDef;
  onBackToHome: () => void;
  onSelectRelated: (t: ToolDef) => void;
  initialInput?: string;
}

interface SplitResultFile {
  id: string;
  filename: string;
  transactionType: string;
  controlNumber: string;
  referenceId: string;
  segmentCount: number;
  content: string;
  sizeBytes: number;
}

interface JoinFileItem {
  id: string;
  name: string;
  content: string;
}

export const EdiBatchSplitterView: React.FC<EdiBatchSplitterViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [activeMode, setActiveMode] = useState<'split' | 'join'>('split');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // SPLIT MODE STATE
  // -------------------------------------------------------------
  const [splitInput, setSplitInput] = useState<string>(initialInput || '');
  const [splitStrategy, setSplitStrategy] = useState<'transaction' | 'group' | 'chunk' | 'filter'>('transaction');
  const [chunkSize, setChunkSize] = useState<number>(1);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [reenvelope, setReenvelope] = useState<boolean>(true);
  const [sequentialControlNumbers, setSequentialControlNumbers] = useState<boolean>(true);
  const [overrideSender, setOverrideSender] = useState<string>('');
  const [overrideReceiver, setOverrideReceiver] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // JOIN MODE STATE
  // -------------------------------------------------------------
  const [joinFiles, setJoinFiles] = useState<JoinFileItem[]>([]);
  const [joinSenderId, setJoinSenderId] = useState<string>('ACMEPARTNER');
  const [joinSenderQual, setJoinSenderQual] = useState<string>('ZZ');
  const [joinReceiverId, setJoinReceiverId] = useState<string>('GLOBALBUYER');
  const [joinReceiverQual, setJoinReceiverQual] = useState<string>('ZZ');
  const [joinInterchangeCtrl, setJoinInterchangeCtrl] = useState<string>('000000001');
  const [joinGroupCtrl, setJoinGroupCtrl] = useState<string>('10001');
  const [joinSegmentTerm, setJoinSegmentTerm] = useState<string>('~');
  const [joinElementSep, setJoinElementSep] = useState<string>('*');
  const [groupByFunctionalCode, setGroupByFunctionalCode] = useState<boolean>(true);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, id: string = 'main') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // -------------------------------------------------------------
  // SPLIT ENGINE
  // -------------------------------------------------------------
  const splitResults = useMemo<SplitResultFile[]>(() => {
    if (!splitInput.trim()) return [];

    const isEdifact = splitInput.includes('UNB') || splitInput.includes('UNH');
    const segmentSep = isEdifact ? "'" : '~';
    const elementSep = isEdifact ? '+' : '*';

    // Parse segments cleanly
    const rawSegments = splitInput
      .split(segmentSep)
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawSegments.length === 0) return [];

    // Extract outer envelope details if available
    let origIsa = rawSegments.find((s) => s.startsWith('ISA'));
    let origGs = rawSegments.find((s) => s.startsWith('GS'));
    let origUnb = rawSegments.find((s) => s.startsWith('UNB'));

    const isaElements = origIsa ? origIsa.split(elementSep) : [];
    const gsElements = origGs ? origGs.split(elementSep) : [];
    const unbElements = origUnb ? origUnb.split(elementSep) : [];

    const sender = overrideSender.trim() || (isEdifact ? unbElements[2]?.split(':')[0] || 'SENDER' : isaElements[6]?.trim() || 'SENDER');
    const receiver = overrideReceiver.trim() || (isEdifact ? unbElements[3]?.split(':')[0] || 'RECEIVER' : isaElements[8]?.trim() || 'RECEIVER');

    const results: SplitResultFile[] = [];

    if (!isEdifact) {
      // ANSI ASC X12 SPLITTING
      // Locate all ST...SE transaction blocks
      const transactions: { st: string; segments: string[]; se: string; type: string; ctrl: string; refId: string }[] = [];
      let currentTx: string[] | null = null;
      let currentType = '';
      let currentCtrl = '';
      let currentRefId = '';

      for (const seg of rawSegments) {
        const segName = seg.slice(0, 2);
        const parts = seg.split(elementSep);

        if (segName === 'ST') {
          currentTx = [seg];
          currentType = parts[1] || 'Unknown';
          currentCtrl = parts[2] || '';
          currentRefId = '';
        } else if (segName === 'SE' && currentTx) {
          currentTx.push(seg);
          transactions.push({
            st: currentTx[0],
            segments: currentTx,
            se: seg,
            type: currentType,
            ctrl: currentCtrl,
            refId: currentRefId || currentCtrl || 'TX',
          });
          currentTx = null;
        } else if (currentTx) {
          currentTx.push(seg);
          // Look for reference identifiers (PO number in BEG, Invoice in BIG, ASN in BSN, Claim in CLM, Ref in REF)
          if (segName === 'BE' && parts[0] === 'BEG' && parts[3]) {
            currentRefId = parts[3];
          } else if (segName === 'BI' && parts[0] === 'BIG' && parts[2]) {
            currentRefId = parts[2];
          } else if (segName === 'BS' && parts[0] === 'BSN' && parts[2]) {
            currentRefId = parts[2];
          } else if (segName === 'CL' && parts[0] === 'CLM' && parts[1]) {
            currentRefId = parts[1];
          } else if (segName === 'BA' && parts[0] === 'BAK' && parts[3]) {
            currentRefId = parts[3];
          }
        }
      }

      // If no ST/SE found, fallback to groups or raw
      if (transactions.length === 0) {
        return [];
      }

      // Filter transactions if filter query provided
      let filteredTx = transactions;
      if (splitStrategy === 'filter' && filterQuery.trim()) {
        const q = filterQuery.trim().toLowerCase();
        filteredTx = transactions.filter(
          (t) =>
            t.refId.toLowerCase().includes(q) ||
            t.ctrl.toLowerCase().includes(q) ||
            t.type.toLowerCase().includes(q) ||
            t.segments.some((s) => s.toLowerCase().includes(q))
        );
      }

      if (splitStrategy === 'group') {
        // Group by functional code (e.g. PO, IN, SH)
        const groupsMap = new Map<string, typeof transactions>();
        for (const tx of filteredTx) {
          const list = groupsMap.get(tx.type) || [];
          list.push(tx);
          groupsMap.set(tx.type, list);
        }

        let groupIdx = 1;
        groupsMap.forEach((txList, type) => {
          const allSegs: string[] = [];
          const now = new Date();
          const dStr = now.toISOString().slice(2, 10).replace(/-/g, '');
          const tStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
          const ctrlNum = String(groupIdx).padStart(9, '0');

          if (reenvelope) {
            allSegs.push(`ISA*00*          *00*          *ZZ*${sender.padEnd(15, ' ')}*ZZ*${receiver.padEnd(15, ' ')}*${dStr}*${tStr}*U*00401*${ctrlNum}*0*P*>`);
            allSegs.push(`GS*${type.slice(0, 2)}*${sender}*${receiver}*${now.toISOString().slice(0, 10).replace(/-/g, '')}*${tStr}*${groupIdx}*X*004010`);
          }

          for (const tx of txList) {
            allSegs.push(...tx.segments);
          }

          if (reenvelope) {
            allSegs.push(`GE*${txList.length}*${groupIdx}`);
            allSegs.push(`IEA*1*${ctrlNum}`);
          }

          const fileContent = allSegs.join('~\n') + '~';
          results.push({
            id: `grp_${groupIdx}`,
            filename: `group_${type}_${groupIdx}.edi`,
            transactionType: `${type} Group (${txList.length} transactions)`,
            controlNumber: ctrlNum,
            referenceId: `${type} Group`,
            segmentCount: allSegs.length,
            content: fileContent,
            sizeBytes: new Blob([fileContent]).size,
          });
          groupIdx++;
        });
      } else if (splitStrategy === 'chunk') {
        // Chunk by N transactions per file
        const size = Math.max(1, chunkSize);
        for (let i = 0; i < filteredTx.length; i += size) {
          const chunk = filteredTx.slice(i, i + size);
          const chunkIndex = Math.floor(i / size) + 1;
          const allSegs: string[] = [];
          const now = new Date();
          const dStr = now.toISOString().slice(2, 10).replace(/-/g, '');
          const tStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
          const ctrlNum = String(chunkIndex).padStart(9, '0');

          if (reenvelope) {
            allSegs.push(`ISA*00*          *00*          *ZZ*${sender.padEnd(15, ' ')}*ZZ*${receiver.padEnd(15, ' ')}*${dStr}*${tStr}*U*00401*${ctrlNum}*0*P*>`);
            allSegs.push(`GS*${chunk[0].type.slice(0, 2)}*${sender}*${receiver}*${now.toISOString().slice(0, 10).replace(/-/g, '')}*${tStr}*${chunkIndex}*X*004010`);
          }

          for (const tx of chunk) {
            allSegs.push(...tx.segments);
          }

          if (reenvelope) {
            allSegs.push(`GE*${chunk.length}*${chunkIndex}`);
            allSegs.push(`IEA*1*${ctrlNum}`);
          }

          const fileContent = allSegs.join('~\n') + '~';
          results.push({
            id: `chunk_${chunkIndex}`,
            filename: `chunk_${chunkIndex}_${chunk.length}tx.edi`,
            transactionType: `Batch Chunk (${chunk.length} transactions)`,
            controlNumber: ctrlNum,
            referenceId: `Items ${i + 1}-${i + chunk.length}`,
            segmentCount: allSegs.length,
            content: fileContent,
            sizeBytes: new Blob([fileContent]).size,
          });
        }
      } else {
        // Individual Transaction Set (ST/SE)
        filteredTx.forEach((tx, idx) => {
          const indexNum = idx + 1;
          const ctrlNum = sequentialControlNumbers ? String(indexNum).padStart(9, '0') : tx.ctrl.padStart(9, '0');
          const txCtrl = sequentialControlNumbers ? String(indexNum).padStart(4, '0') : tx.ctrl;

          const allSegs: string[] = [];
          const now = new Date();
          const dStr = now.toISOString().slice(2, 10).replace(/-/g, '');
          const tStr = now.toTimeString().slice(0, 5).replace(/:/g, '');

          if (reenvelope) {
            allSegs.push(`ISA*00*          *00*          *ZZ*${sender.padEnd(15, ' ')}*ZZ*${receiver.padEnd(15, ' ')}*${dStr}*${tStr}*U*00401*${ctrlNum}*0*P*>`);
            allSegs.push(`GS*${tx.type.slice(0, 2)}*${sender}*${receiver}*${now.toISOString().slice(0, 10).replace(/-/g, '')}*${tStr}*${indexNum}*X*004010`);
          }

          // Segments of the transaction
          const updatedTxSegments = tx.segments.map((seg, sIdx) => {
            if (sIdx === 0 && sequentialControlNumbers) {
              // Update ST02
              const p = seg.split('*');
              p[2] = txCtrl;
              return p.join('*');
            }
            if (sIdx === tx.segments.length - 1 && sequentialControlNumbers) {
              // Update SE02
              const p = seg.split('*');
              p[2] = txCtrl;
              return p.join('*');
            }
            return seg;
          });

          allSegs.push(...updatedTxSegments);

          if (reenvelope) {
            allSegs.push(`GE*1*${indexNum}`);
            allSegs.push(`IEA*1*${ctrlNum}`);
          }

          const fileContent = allSegs.join('~\n') + '~';
          const safeRef = tx.refId.replace(/[^a-zA-Z0-9_-]/g, '_');
          const filename = `${tx.type}_${safeRef || txCtrl}_${indexNum}.edi`;

          results.push({
            id: `tx_${indexNum}`,
            filename,
            transactionType: `${tx.type} Transaction`,
            controlNumber: txCtrl,
            referenceId: tx.refId || txCtrl,
            segmentCount: allSegs.length,
            content: fileContent,
            sizeBytes: new Blob([fileContent]).size,
          });
        });
      }
    } else {
      // EDIFACT SPLITTING (UNH...UNT)
      const messages: { unh: string; segments: string[]; unt: string; type: string; ctrl: string; refId: string }[] = [];
      let currentMsg: string[] | null = null;
      let currentType = '';
      let currentCtrl = '';
      let currentRefId = '';

      for (const seg of rawSegments) {
        const segName = seg.slice(0, 3);
        const parts = seg.split(elementSep);

        if (segName === 'UNH') {
          currentMsg = [seg];
          currentCtrl = parts[1] || '';
          currentType = parts[2]?.split(':')[0] || 'Unknown';
          currentRefId = '';
        } else if (segName === 'UNT' && currentMsg) {
          currentMsg.push(seg);
          messages.push({
            unh: currentMsg[0],
            segments: currentMsg,
            unt: seg,
            type: currentType,
            ctrl: currentCtrl,
            refId: currentRefId || currentCtrl || 'MSG',
          });
          currentMsg = null;
        } else if (currentMsg) {
          currentMsg.push(seg);
          if (segName === 'BGM' && parts[2]) {
            currentRefId = parts[2];
          }
        }
      }

      if (messages.length === 0) return [];

      let filteredMsg = messages;
      if (splitStrategy === 'filter' && filterQuery.trim()) {
        const q = filterQuery.trim().toLowerCase();
        filteredMsg = messages.filter(
          (m) =>
            m.refId.toLowerCase().includes(q) ||
            m.ctrl.toLowerCase().includes(q) ||
            m.type.toLowerCase().includes(q) ||
            m.segments.some((s) => s.toLowerCase().includes(q))
        );
      }

      filteredMsg.forEach((msg, idx) => {
        const indexNum = idx + 1;
        const ctrlNum = sequentialControlNumbers ? `IREF${String(indexNum).padStart(4, '0')}` : msg.ctrl;
        const allSegs: string[] = [];
        const now = new Date();
        const dStr = now.toISOString().slice(2, 10).replace(/-/g, '');
        const tStr = now.toTimeString().slice(0, 5).replace(/:/g, '');

        if (reenvelope) {
          allSegs.push(`UNB+UNOA:2+${sender}:ZZ+${receiver}:ZZ+${dStr}:${tStr}+${ctrlNum}+++++1`);
        }

        allSegs.push(...msg.segments);

        if (reenvelope) {
          allSegs.push(`UNZ+1+${ctrlNum}`);
        }

        const fileContent = allSegs.join("'\n") + "'";
        const safeRef = msg.refId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${msg.type}_${safeRef || ctrlNum}_${indexNum}.edi`;

        results.push({
          id: `edifact_${indexNum}`,
          filename,
          transactionType: `${msg.type} Message`,
          controlNumber: msg.ctrl,
          referenceId: msg.refId || msg.ctrl,
          segmentCount: allSegs.length,
          content: fileContent,
          sizeBytes: new Blob([fileContent]).size,
        });
      });
    }

    return results;
  }, [
    splitInput,
    splitStrategy,
    chunkSize,
    filterQuery,
    reenvelope,
    sequentialControlNumbers,
    overrideSender,
    overrideReceiver,
  ]);

  // Set default selected file when results change
  const activeSelectedFile = useMemo(() => {
    if (!splitResults || splitResults.length === 0) return null;
    return splitResults.find((f) => f.id === selectedFileId) || splitResults[0];
  }, [splitResults, selectedFileId]);

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (splitResults.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      splitResults.forEach((file) => {
        zip.file(file.filename, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codepackr_split_edi_batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error creating ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // -------------------------------------------------------------
  // JOIN ENGINE
  // -------------------------------------------------------------
  const handleAddJoinFile = () => {
    const newId = `file_${Date.now()}`;
    setJoinFiles((prev) => [
      ...prev,
      {
        id: newId,
        name: `transaction_${prev.length + 1}.edi`,
        content: `ST*850*000${prev.length + 1}~\nBEG*00*NE*PO-JOIN-${1000 + prev.length + 1}**20260912~\nPO1*1*10*EA*25.00**VN*SKU-${101 + prev.length + 1}~\nSE*4*000${prev.length + 1}~`,
      },
    ]);
  };

  const handleRemoveJoinFile = (id: string) => {
    setJoinFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateJoinContent = (id: string, content: string) => {
    setJoinFiles((prev) => prev.map((f) => (f.id === id ? { ...f, content } : f)));
  };

  const handleUpdateJoinName = (id: string, name: string) => {
    setJoinFiles((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  };

  const handleMultiFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setJoinFiles((prev) => [
            ...prev,
            {
              id: `upload_${Date.now()}_${Math.random()}`,
              name: file.name,
              content: text,
            },
          ]);
        }
      };
      reader.readAsText(file);
    });
  };

  // Merge Join Files into a single valid ANSI X12 or EDIFACT Interchange
  const mergedJoinOutput = useMemo(() => {
    if (joinFiles.length === 0) return '';

    const term = joinSegmentTerm || '~';
    const sep = joinElementSep || '*';

    // Collect all transaction set bodies
    interface ExtractedTx {
      type: string;
      segments: string[];
      originalCtrl: string;
    }

    const allTx: ExtractedTx[] = [];

    for (const file of joinFiles) {
      const segs = file.content
        .split(/[~'\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      let inTx = false;
      let curTxSegs: string[] = [];
      let curType = '850';
      let curCtrl = '0001';

      for (const seg of segs) {
        const parts = seg.split(/[*+]/);
        const name = parts[0];

        if (name === 'ST') {
          inTx = true;
          curTxSegs = [];
          curType = parts[1] || '850';
          curCtrl = parts[2] || '0001';
        } else if (name === 'SE' && inTx) {
          inTx = false;
          allTx.push({
            type: curType,
            segments: curTxSegs,
            originalCtrl: curCtrl,
          });
        } else if (inTx) {
          curTxSegs.push(seg);
        } else if (name !== 'ISA' && name !== 'IEA' && name !== 'GS' && name !== 'GE') {
          // If transaction has no ST/SE, treat valid segments as raw body
          if (!curTxSegs.length) curTxSegs = [];
          curTxSegs.push(seg);
        }
      }

      // If file didn't have ST/SE envelope, add whole body as a transaction
      if (curTxSegs.length > 0 && !inTx) {
        allTx.push({
          type: '850',
          segments: curTxSegs,
          originalCtrl: '0001',
        });
      }
    }

    if (allTx.length === 0) return '';

    const now = new Date();
    const dStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const gsDStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const tStr = now.toTimeString().slice(0, 5).replace(/:/g, '');

    const senderFormatted = joinSenderId.padEnd(15, ' ').slice(0, 15);
    const receiverFormatted = joinReceiverId.padEnd(15, ' ').slice(0, 15);
    const isaCtrl = joinInterchangeCtrl.padStart(9, '0');

    const resultSegments: string[] = [];

    // ISA Envelope
    resultSegments.push(
      `ISA${sep}00${sep}          ${sep}00${sep}          ${sep}${joinSenderQual.padEnd(2, ' ')}${sep}${senderFormatted}${sep}${joinReceiverQual.padEnd(2, ' ')}${sep}${receiverFormatted}${sep}${dStr}${sep}${tStr}${sep}U${sep}00401${sep}${isaCtrl}${sep}0${sep}P${sep}>`
    );

    // Grouping
    if (groupByFunctionalCode) {
      const groupsMap = new Map<string, ExtractedTx[]>();
      allTx.forEach((tx) => {
        const grp = groupsMap.get(tx.type) || [];
        grp.push(tx);
        groupsMap.set(tx.type, grp);
      });

      let gIdx = 1;
      groupsMap.forEach((txList, txType) => {
        const grpCtrl = String(Number(joinGroupCtrl) + gIdx - 1);
        const functionalCode = txType === '810' ? 'IN' : txType === '856' ? 'SH' : txType === '855' ? 'PR' : 'PO';

        // GS
        resultSegments.push(`GS${sep}${functionalCode}${sep}${joinSenderId}${sep}${joinReceiverId}${sep}${gsDStr}${sep}${tStr}${sep}${grpCtrl}${sep}X${sep}004010`);

        // Transaction Sets
        txList.forEach((tx, txIdx) => {
          const txCtrl = String(txIdx + 1).padStart(4, '0');
          resultSegments.push(`ST${sep}${tx.type}${sep}${txCtrl}`);
          tx.segments.forEach((s) => {
            // Re-normalize delimiters if needed
            const normalized = s.replace(/[*+]/g, sep);
            resultSegments.push(normalized);
          });
          // SE: Total segments in ST including ST and SE
          const totalCount = tx.segments.length + 2;
          resultSegments.push(`SE${sep}${totalCount}${sep}${txCtrl}`);
        });

        // GE
        resultSegments.push(`GE${sep}${txList.length}${sep}${grpCtrl}`);
        gIdx++;
      });

      // IEA
      resultSegments.push(`IEA${sep}${groupsMap.size}${sep}${isaCtrl}`);
    } else {
      // Single Group for all
      const grpCtrl = joinGroupCtrl;
      resultSegments.push(`GS${sep}PO${sep}${joinSenderId}${sep}${joinReceiverId}${sep}${gsDStr}${sep}${tStr}${sep}${grpCtrl}${sep}X${sep}004010`);

      allTx.forEach((tx, txIdx) => {
        const txCtrl = String(txIdx + 1).padStart(4, '0');
        resultSegments.push(`ST${sep}${tx.type}${sep}${txCtrl}`);
        tx.segments.forEach((s) => {
          resultSegments.push(s.replace(/[*+]/g, sep));
        });
        const totalCount = tx.segments.length + 2;
        resultSegments.push(`SE${sep}${totalCount}${sep}${txCtrl}`);
      });

      resultSegments.push(`GE${sep}${allTx.length}${sep}${grpCtrl}`);
      resultSegments.push(`IEA${sep}1${sep}${isaCtrl}`);
    }

    return resultSegments.join(term + '\n') + term;
  }, [
    joinFiles,
    joinSenderId,
    joinSenderQual,
    joinReceiverId,
    joinReceiverQual,
    joinInterchangeCtrl,
    joinGroupCtrl,
    joinSegmentTerm,
    joinElementSep,
    groupByFunctionalCode,
  ]);

  // -------------------------------------------------------------
  // PRELOAD SAMPLES
  // -------------------------------------------------------------
  const loadMultiPoSample = () => {
    const sample = `ISA*00*          *00*          *ZZ*ACMESUPPLIER   *ZZ*GLOBALBUYER    *260912*0830*U*00401*000000850*0*P*>~
GS*PO*ACMESUPPLIER*GLOBALBUYER*20260912*0830*1001*X*004010~
ST*850*0001~
BEG*00*NE*PO-2026-9001**20260912~
CUR*SE*USD~
N1*ST*EAST DISTRIBUTION DC #1*9*0012345678901~
PO1*1*100*EA*15.50**VN*SKU-A101~
PID*F****WIDGET MODEL A101 INDUSTRIAL~
SE*7*0001~
ST*850*0002~
BEG*00*NE*PO-2026-9002**20260912~
CUR*SE*USD~
N1*ST*WEST DISTRIBUTION DC #2*9*0012345678902~
PO1*1*250*EA*42.00**VN*SKU-B202~
PID*F****HEAVY DUTY MOTOR DRIVE 24V~
PO1*2*50*EA*110.00**VN*SKU-C303~
PID*F****INTELLIGENT CONTROLLER UNIT~
SE*9*0002~
ST*850*0003~
BEG*00*NE*PO-2026-9003**20260912~
CUR*SE*USD~
N1*ST*CENTRAL WAREHOUSE DC #3*9*0012345678903~
PO1*1*500*EA*5.25**VN*SKU-D404~
PID*F****PRECISION SENSOR ADAPTER~
SE*7*0003~
GE*3*1001~
IEA*1*000000850~`;
    setSplitInput(sample);
    setActiveMode('split');
  };

  const loadMixedBatchSample = () => {
    const sample = `ISA*00*          *00*          *ZZ*ENTERPRISEB2B  *ZZ*PARTNERCORP    *260912*0915*U*00401*000000999*0*P*>~
GS*PO*ENTERPRISEB2B*PARTNERCORP*20260912*0915*2001*X*004010~
ST*850*0001~
BEG*00*NE*PO-RETAIL-5541**20260912~
N1*BY*SUPERMART BUYING OFFICE*9*1122334455667~
PO1*1*300*EA*12.00**VN*SKU-RETAIL-1~
SE*5*0001~
GE*1*2001~
GS*IN*ENTERPRISEB2B*PARTNERCORP*20260912*0916*2002*X*004010~
ST*810*0002~
BIG*20260912*INV-2026-8812*20260910*PO-RETAIL-5541~
N1*RE*REMIT TO ENTERPRISE B2B*9*9988776655443~
IT1*1*300*EA*12.00**VN*SKU-RETAIL-1~
TDS*360000~
SE*6*0002~
GE*1*2002~
IEA*2*000000999~`;
    setSplitInput(sample);
    setActiveMode('split');
  };

  const loadJoinSampleData = () => {
    setJoinFiles([
      {
        id: 'sample_1',
        name: 'Order_850_PO101.edi',
        content: `ST*850*0001~\nBEG*00*NE*PO-ALPHA-101**20260912~\nN1*ST*DALLAS HUB*9*0012345670001~\nPO1*1*50*EA*35.00**VN*PART-A1~\nSE*5*0001~`,
      },
      {
        id: 'sample_2',
        name: 'Order_850_PO102.edi',
        content: `ST*850*0002~\nBEG*00*NE*PO-BETA-102**20260912~\nN1*ST*CHICAGO HUB*9*0012345670002~\nPO1*1*120*EA*18.50**VN*PART-B2~\nSE*5*0002~`,
      },
      {
        id: 'sample_3',
        name: 'Invoice_810_INV505.edi',
        content: `ST*810*0003~\nBIG*20260912*INV-505-GAMMA*20260911*PO-ALPHA-101~\nN1*BT*BILL TO CORP*9*0098765430001~\nIT1*1*50*EA*35.00**VN*PART-A1~\nTDS*175000~\nSE*6*0003~`,
      },
    ]);
    setActiveMode('join');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Tool Header */}
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Mode Selector & Quick Actions */}
      <div
        className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('split')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeMode === 'split'
                ? 'bg-[var(--brand)] text-white shadow-sm'
                : 'border hover:bg-[var(--surface-2)] text-[var(--ink)]'
            }`}
            style={activeMode !== 'split' ? { borderColor: 'var(--line)' } : undefined}
          >
            <Scissors className="w-4 h-4" />
            <span>1. Batch Split & Extract</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('join')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeMode === 'join'
                ? 'bg-[var(--brand)] text-white shadow-sm'
                : 'border hover:bg-[var(--surface-2)] text-[var(--ink)]'
            }`}
            style={activeMode !== 'join' ? { borderColor: 'var(--line)' } : undefined}
          >
            <Layers className="w-4 h-4" />
            <span>2. Batch Join & Re-Envelope</span>
          </button>
        </div>

        {/* Preset Sample Loaders */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" /> Samples:
          </span>
          {activeMode === 'split' ? (
            <>
              <button
                type="button"
                onClick={loadMultiPoSample}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--surface-2)] text-[var(--ink)] cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                Multi-PO (850 x 3)
              </button>
              <button
                type="button"
                onClick={loadMixedBatchSample}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--surface-2)] text-[var(--ink)] cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                Mixed (850 PO + 810 Inv)
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={loadJoinSampleData}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--surface-2)] text-[var(--ink)] cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
            >
              Load 3 Files to Merge
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: SPLIT & EXTRACT */}
      {/* ========================================================= */}
      {activeMode === 'split' && (
        <div className="space-y-6">
          {/* Top Controls Grid */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Split Strategy & Filter Configuration
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Isolate each transaction set into a clean, compliant EDI document with valid outer envelopes.
                </p>
              </div>

              {/* Strategy Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSplitStrategy('transaction')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    splitStrategy === 'transaction'
                      ? 'bg-[var(--brand)] text-white'
                      : 'border hover:bg-[var(--surface-2)] text-[var(--ink)]'
                  }`}
                  style={splitStrategy !== 'transaction' ? { borderColor: 'var(--line)' } : undefined}
                >
                  By Transaction Set (ST/SE)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitStrategy('group')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    splitStrategy === 'group'
                      ? 'bg-[var(--brand)] text-white'
                      : 'border hover:bg-[var(--surface-2)] text-[var(--ink)]'
                  }`}
                  style={splitStrategy !== 'group' ? { borderColor: 'var(--line)' } : undefined}
                >
                  By Functional Group (GS/GE)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitStrategy('chunk')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    splitStrategy === 'chunk'
                      ? 'bg-[var(--brand)] text-white'
                      : 'border hover:bg-[var(--surface-2)] text-[var(--ink)]'
                  }`}
                  style={splitStrategy !== 'chunk' ? { borderColor: 'var(--line)' } : undefined}
                >
                  By Chunk Size (N per file)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitStrategy('filter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    splitStrategy === 'filter'
                      ? 'bg-[var(--brand)] text-white'
                      : 'border hover:bg-[var(--surface-2)] text-[var(--ink)]'
                  }`}
                  style={splitStrategy !== 'filter' ? { borderColor: 'var(--line)' } : undefined}
                >
                  Search & Extract Filter
                </button>
              </div>
            </div>

            {/* Dynamic Options depending on strategy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
              {splitStrategy === 'chunk' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                    Transactions per Output File:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 rounded-xl border text-xs bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  />
                </div>
              )}

              {splitStrategy === 'filter' && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                    Filter by PO #, Claim #, Control # or Value:
                  </label>
                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="e.g. PO-2026-9002 or 0001"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 sm:pt-4">
                <input
                  type="checkbox"
                  id="chk-reenvelope"
                  checked={reenvelope}
                  onChange={(e) => setReenvelope(e.target.checked)}
                  className="rounded text-[var(--brand)] cursor-pointer"
                />
                <label htmlFor="chk-reenvelope" className="text-xs font-medium text-[var(--ink)] cursor-pointer select-none">
                  Re-envelope each output with valid ISA/GS or UNB
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-4">
                <input
                  type="checkbox"
                  id="chk-seq-ctrl"
                  checked={sequentialControlNumbers}
                  onChange={(e) => setSequentialControlNumbers(e.target.checked)}
                  className="rounded text-[var(--brand)] cursor-pointer"
                />
                <label htmlFor="chk-seq-ctrl" className="text-xs font-medium text-[var(--ink)] cursor-pointer select-none">
                  Generate sequential control numbers (000000001...)
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Override Sender ID (optional):
                </label>
                <input
                  type="text"
                  placeholder="Original Sender"
                  value={overrideSender}
                  onChange={(e) => setOverrideSender(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border text-xs bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Override Receiver ID (optional):
                </label>
                <input
                  type="text"
                  placeholder="Original Receiver"
                  value={overrideReceiver}
                  onChange={(e) => setOverrideReceiver(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border text-xs bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>
          </div>

          {/* Raw Input Area */}
          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4" /> Multi-Transaction Batch Input
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setSplitInput((ev.target?.result as string) || '');
                      reader.readAsText(f);
                    }
                  }}
                  accept=".edi,.x12,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setSplitInput('')}
                  className="px-2.5 py-1 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>

            <textarea
              rows={7}
              value={splitInput}
              onChange={(e) => setSplitInput(e.target.value)}
              placeholder="Paste multi-transaction EDI payload here (e.g. file with multiple ST...SE or UNH...UNT blocks)..."
              className="w-full p-3 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none focus:ring-1 focus:ring-[var(--brand)]"
              style={{ borderColor: 'var(--line)' }}
            />
          </div>

          {/* Results Section */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    Extracted Files ({splitResults.length})
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    All transactions isolated into independent, envelope-compliant files.
                  </p>
                </div>
              </div>

              {splitResults.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--brand)] text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Archive className="w-4 h-4" />
                    {isZipping ? 'Archiving...' : 'Download All as ZIP (.zip)'}
                  </button>
                </div>
              )}
            </div>

            {splitResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)] italic border border-dashed rounded-xl" style={{ borderColor: 'var(--line)' }}>
                No transaction sets detected. Paste a multi-transaction EDI document above or click "Multi-PO (850 x 3)" to test.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* File List Table */}
                <div className="lg:col-span-6 overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--line)' }}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-[var(--surface-2)] text-[var(--muted)]" style={{ borderColor: 'var(--line)' }}>
                        <th className="py-2.5 px-3 font-semibold">File Name</th>
                        <th className="py-2.5 px-2 font-semibold">Type</th>
                        <th className="py-2.5 px-2 font-semibold">PO / Ref</th>
                        <th className="py-2.5 px-2 font-semibold">Segments</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                      {splitResults.map((file) => {
                        const isSelected = activeSelectedFile?.id === file.id;
                        return (
                          <tr
                            key={file.id}
                            onClick={() => setSelectedFileId(file.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[var(--brand)]/10 text-[var(--brand)] font-semibold' : 'hover:bg-[var(--surface-2)] text-[var(--ink)]'
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-[11px] truncate max-w-[160px]">
                              {file.filename}
                            </td>
                            <td className="py-2 px-2 whitespace-nowrap">{file.transactionType}</td>
                            <td className="py-2 px-2 font-mono text-[11px] text-[var(--muted)] truncate max-w-[110px]">
                              {file.referenceId}
                            </td>
                            <td className="py-2 px-2">{file.segmentCount}</td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile({ file: file.content, filename: file.filename });
                                }}
                                title="Download File"
                                className="p-1 rounded hover:bg-[var(--surface)] text-[var(--ink)] cursor-pointer mr-1"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(file.content, file.id);
                                }}
                                title="Copy Content"
                                className="p-1 rounded hover:bg-[var(--surface)] text-[var(--ink)] cursor-pointer"
                              >
                                {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Selected File Preview Panel */}
                <div className="lg:col-span-6 space-y-3">
                  {activeSelectedFile ? (
                    <div className="p-4 rounded-xl border bg-[var(--surface-2)] space-y-2.5" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-xs font-bold text-[var(--ink)]">
                            {activeSelectedFile.filename}
                          </div>
                          <div className="text-[11px] text-[var(--muted)]">
                            {activeSelectedFile.segmentCount} segments &bull; {activeSelectedFile.sizeBytes} bytes
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeSelectedFile.content, 'preview')}
                            className="px-2 py-1 rounded-lg border text-xs font-semibold bg-[var(--surface)] text-[var(--ink)] hover:opacity-80 flex items-center gap-1 cursor-pointer"
                            style={{ borderColor: 'var(--line)' }}
                          >
                            {copiedId === 'preview' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === 'preview' ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadFile({ file: activeSelectedFile.content, filename: activeSelectedFile.filename })}
                            className="px-2 py-1 rounded-lg border text-xs font-semibold bg-[var(--brand)] text-white hover:opacity-90 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>

                      <pre className="p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-[300px] bg-[var(--surface)] text-[var(--ink)] border" style={{ borderColor: 'var(--line)' }}>
                        {activeSelectedFile.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[var(--muted)] italic border rounded-xl" style={{ borderColor: 'var(--line)' }}>
                      Select a file from the list to preview its enveloped contents.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: JOIN & RE-ENVELOPE */}
      {/* ========================================================= */}
      {activeMode === 'join' && (
        <div className="space-y-6">
          {/* Join Settings Toolbar */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Target Interchange Envelope Settings
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Combine multiple transactions into a single valid ANSI X12 interchange with balanced counts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  ref={multiFileInputRef}
                  onChange={handleMultiFileUpload}
                  accept=".edi,.x12,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => multiFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <Upload className="w-4 h-4" /> Upload Multiple Files
                </button>
                <button
                  type="button"
                  onClick={handleAddJoinFile}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-[var(--brand)] text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Transaction Block
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink)] block mb-1">Sender Qual (ISA05):</label>
                <input
                  type="text"
                  maxLength={2}
                  value={joinSenderQual}
                  onChange={(e) => setJoinSenderQual(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono bg-[var(--surface-2)] text-[var(--ink)]"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--ink)] block mb-1">Sender ID (ISA06):</label>
                <input
                  type="text"
                  maxLength={15}
                  value={joinSenderId}
                  onChange={(e) => setJoinSenderId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono bg-[var(--surface-2)] text-[var(--ink)]"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--ink)] block mb-1">Receiver Qual (ISA07):</label>
                <input
                  type="text"
                  maxLength={2}
                  value={joinReceiverQual}
                  onChange={(e) => setJoinReceiverQual(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono bg-[var(--surface-2)] text-[var(--ink)]"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--ink)] block mb-1">Receiver ID (ISA08):</label>
                <input
                  type="text"
                  maxLength={15}
                  value={joinReceiverId}
                  onChange={(e) => setJoinReceiverId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono bg-[var(--surface-2)] text-[var(--ink)]"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--ink)] block mb-1">Interchange Ctrl #:</label>
                <input
                  type="text"
                  value={joinInterchangeCtrl}
                  onChange={(e) => setJoinInterchangeCtrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono bg-[var(--surface-2)] text-[var(--ink)]"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--ink)] block mb-1">Group Ctrl #:</label>
                <input
                  type="text"
                  value={joinGroupCtrl}
                  onChange={(e) => setJoinGroupCtrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono bg-[var(--surface-2)] text-[var(--ink)]"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-group-fc"
                  checked={groupByFunctionalCode}
                  onChange={(e) => setGroupByFunctionalCode(e.target.checked)}
                  className="rounded text-[var(--brand)] cursor-pointer"
                />
                <label htmlFor="chk-group-fc" className="text-xs font-medium text-[var(--ink)] cursor-pointer select-none">
                  Group transactions into separate GS/GE blocks by functional code (PO, IN, SH)
                </label>
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                <span>Delimiters:</span>
                <span className="font-mono bg-[var(--surface-2)] px-2 py-0.5 rounded border" style={{ borderColor: 'var(--line)' }}>
                  Element: *
                </span>
                <span className="font-mono bg-[var(--surface-2)] px-2 py-0.5 rounded border" style={{ borderColor: 'var(--line)' }}>
                  Segment: ~
                </span>
              </div>
            </div>
          </div>

          {/* Individual Transaction Files List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Transactions to Join ({joinFiles.length})
              </span>
              {joinFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setJoinFiles([])}
                  className="text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  Remove All Files
                </button>
              )}
            </div>

            {joinFiles.length === 0 ? (
              <div
                className="p-8 text-center text-xs text-[var(--muted)] italic border border-dashed rounded-xl space-y-2"
                style={{ borderColor: 'var(--line)' }}
              >
                <p>No transaction files added yet.</p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddJoinFile}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] cursor-pointer"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    + Add Transaction
                  </button>
                  <button
                    type="button"
                    onClick={loadJoinSampleData}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-[var(--brand)] text-white cursor-pointer"
                  >
                    Load Sample 3 Files
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {joinFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-xl border bg-[var(--surface)] space-y-2 relative"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={file.name}
                          onChange={(e) => handleUpdateJoinName(file.id, e.target.value)}
                          className="text-xs font-semibold text-[var(--ink)] bg-transparent border-b border-transparent hover:border-[var(--line)] focus:border-[var(--brand)] outline-none truncate"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveJoinFile(file.id)}
                        title="Remove transaction"
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={file.content}
                      onChange={(e) => handleUpdateJoinContent(file.id, e.target.value)}
                      placeholder="Paste ST...SE transaction segments here..."
                      className="w-full p-2 font-mono text-[11px] rounded-lg border bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Merged Document Output */}
          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Merged Valid EDI Interchange
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  All transaction segments united under a balanced ISA/IEA and GS/GE envelope.
                </p>
              </div>

              {mergedJoinOutput && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mergedJoinOutput, 'merged')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    {copiedId === 'merged' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedId === 'merged' ? 'Copied' : 'Copy Merged EDI'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFile({ file: mergedJoinOutput, filename: `merged_interchange_${joinInterchangeCtrl}.edi` })}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--brand)] text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download EDI File</span>
                  </button>
                </div>
              )}
            </div>

            {mergedJoinOutput ? (
              <pre
                className="w-full p-4 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] overflow-x-auto max-h-[350px]"
                style={{ borderColor: 'var(--line)' }}
              >
                {mergedJoinOutput}
              </pre>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--muted)] italic border rounded-xl" style={{ borderColor: 'var(--line)' }}>
                Add transaction files above to generate a merged ANSI X12 interchange.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
