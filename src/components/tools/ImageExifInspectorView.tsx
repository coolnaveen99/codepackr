import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Download,
  Copy,
  Check,
  Trash2,
  FileImage,
  MapPin,
  Camera,
  Calendar,
  Sparkles,
  ExternalLink,
  Code,
  Info,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface ImageExifInspectorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

interface ExifTagRecord {
  tag: string;
  label: string;
  value: string;
  category: 'camera' | 'exposure' | 'gps' | 'general';
}

interface ParsedExifResult {
  hasExif: boolean;
  hasGps: boolean;
  gpsCoords?: {
    latitude: number;
    longitude: number;
    latRef: string;
    lngRef: string;
  };
  tags: ExifTagRecord[];
  rawStats: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    width: number;
    height: number;
    aspectRatio: string;
    megapixels: string;
  };
}

export const ImageExifInspectorView: React.FC<ImageExifInspectorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExifResult | null>(null);
  const [sanitizedUrl, setSanitizedUrl] = useState<string | null>(null);
  const [sanitizedSize, setSanitizedSize] = useState<number | null>(null);
  const [sanitizedFormat, setSanitizedFormat] = useState<'png' | 'jpeg' | 'webp'>('jpeg');
  const [sanitizedQuality, setSanitizedQuality] = useState<number>(92);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'camera' | 'exposure' | 'gps'>('all');
  const [showJson, setShowJson] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const parseExifFromBuffer = (buffer: ArrayBuffer, file: File): Promise<ParsedExifResult> => {
    return new Promise((resolve) => {
      const tags: ExifTagRecord[] = [];
      let hasGps = false;
      let gpsCoords: ParsedExifResult['gpsCoords'] | undefined = undefined;

      const view = new DataView(buffer);

      // Check for JPEG SOI marker (0xFFD8)
      let isJpeg = view.byteLength > 4 && view.getUint16(0, false) === 0xffd8;

      if (isJpeg) {
        let offset = 2;
        const length = view.byteLength;

        while (offset < length - 2) {
          const marker = view.getUint16(offset, false);
          offset += 2;

          // Stop at SOS (Start of Scan)
          if (marker === 0xffda || marker === 0xffd9) break;

          const sectionLength = view.getUint16(offset, false);
          // APP1 marker is 0xFFE1 (EXIF / XMP)
          if (marker === 0xffe1) {
            // Check for "Exif\0\0"
            if (offset + 8 <= length) {
              const exifHeader = String.fromCharCode(
                view.getUint8(offset + 2),
                view.getUint8(offset + 3),
                view.getUint8(offset + 4),
                view.getUint8(offset + 5)
              );
              if (exifHeader === 'Exif') {
                const tiffOffset = offset + 8;
                const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;

                const readTagValue = (type: number, count: number, valueOffset: number): string => {
                  try {
                    if (type === 2) {
                      // ASCII string
                      let str = '';
                      for (let i = 0; i < count - 1; i++) {
                        str += String.fromCharCode(view.getUint8(valueOffset + i));
                      }
                      return str.trim();
                    }
                    if (type === 3) {
                      // SHORT (16-bit)
                      return String(view.getUint16(valueOffset, littleEndian));
                    }
                    if (type === 4) {
                      // LONG (32-bit)
                      return String(view.getUint32(valueOffset, littleEndian));
                    }
                    if (type === 5) {
                      // RATIONAL (two 32-bit unsigned ints)
                      const num = view.getUint32(valueOffset, littleEndian);
                      const den = view.getUint32(valueOffset + 4, littleEndian);
                      if (den === 0) return String(num);
                      return `${(num / den).toFixed(2)}`;
                    }
                    if (type === 10) {
                      // SRATIONAL
                      const num = view.getInt32(valueOffset, littleEndian);
                      const den = view.getInt32(valueOffset + 4, littleEndian);
                      if (den === 0) return String(num);
                      return `${(num / den).toFixed(2)}`;
                    }
                  } catch {
                    return 'N/A';
                  }
                  return 'Binary Data';
                };

                const parseIFD = (ifdOffset: number, category: 'camera' | 'exposure' | 'gps' | 'general') => {
                  try {
                    if (ifdOffset + 2 > length) return;
                    const numEntries = view.getUint16(ifdOffset, littleEndian);
                    let curr = ifdOffset + 2;

                    for (let i = 0; i < numEntries; i++) {
                      if (curr + 12 > length) break;
                      const tagId = view.getUint16(curr, littleEndian);
                      const type = view.getUint16(curr + 2, littleEndian);
                      const count = view.getUint32(curr + 4, littleEndian);
                      const valOrOffset = curr + 8;
                      const resolvedOffset = count * (type === 3 ? 2 : type === 4 ? 4 : 1) > 4
                        ? tiffOffset + view.getUint32(valOrOffset, littleEndian)
                        : valOrOffset;

                      // Common tags dictionary
                      switch (tagId) {
                        case 0x010f:
                          tags.push({ tag: 'Make', label: 'Camera Manufacturer', value: readTagValue(type, count, resolvedOffset), category: 'camera' });
                          break;
                        case 0x0110:
                          tags.push({ tag: 'Model', label: 'Camera Model', value: readTagValue(type, count, resolvedOffset), category: 'camera' });
                          break;
                        case 0x0112:
                          tags.push({ tag: 'Orientation', label: 'Orientation', value: readTagValue(type, count, resolvedOffset), category: 'general' });
                          break;
                        case 0x0131:
                          tags.push({ tag: 'Software', label: 'Software / OS', value: readTagValue(type, count, resolvedOffset), category: 'general' });
                          break;
                        case 0x0132:
                          tags.push({ tag: 'DateTime', label: 'File Date & Time', value: readTagValue(type, count, resolvedOffset), category: 'general' });
                          break;
                        case 0x9003:
                          tags.push({ tag: 'DateTimeOriginal', label: 'Captured Date & Time', value: readTagValue(type, count, resolvedOffset), category: 'general' });
                          break;
                        case 0x829a: {
                          const val = readTagValue(type, count, resolvedOffset);
                          tags.push({ tag: 'ExposureTime', label: 'Exposure Time', value: `${val} sec`, category: 'exposure' });
                          break;
                        }
                        case 0x829d: {
                          const val = readTagValue(type, count, resolvedOffset);
                          tags.push({ tag: 'FNumber', label: 'Aperture (F-Stop)', value: `f/${val}`, category: 'exposure' });
                          break;
                        }
                        case 0x8827:
                          tags.push({ tag: 'ISOSpeedRatings', label: 'ISO Sensitivity', value: `ISO ${readTagValue(type, count, resolvedOffset)}`, category: 'exposure' });
                          break;
                        case 0x920a: {
                          const val = readTagValue(type, count, resolvedOffset);
                          tags.push({ tag: 'FocalLength', label: 'Focal Length', value: `${val} mm`, category: 'exposure' });
                          break;
                        }
                        case 0xa434:
                          tags.push({ tag: 'LensModel', label: 'Lens Specification', value: readTagValue(type, count, resolvedOffset), category: 'camera' });
                          break;
                        case 0x8769: {
                          // Exif SubIFD
                          const subIfdOffset = tiffOffset + view.getUint32(valOrOffset, littleEndian);
                          parseIFD(subIfdOffset, 'exposure');
                          break;
                        }
                        case 0x8825: {
                          // GPS IFD
                          hasGps = true;
                          const gpsIfdOffset = tiffOffset + view.getUint32(valOrOffset, littleEndian);
                          parseGpsIFD(gpsIfdOffset);
                          break;
                        }
                        default:
                          break;
                      }
                      curr += 12;
                    }
                  } catch {
                    // ignore malformed sub IFDs
                  }
                };

                const parseGpsIFD = (gpsOffset: number) => {
                  try {
                    const entries = view.getUint16(gpsOffset, littleEndian);
                    let curr = gpsOffset + 2;
                    let lat = 0;
                    let latRef = 'N';
                    let lng = 0;
                    let lngRef = 'W';

                    for (let i = 0; i < entries; i++) {
                      if (curr + 12 > length) break;
                      const tagId = view.getUint16(curr, littleEndian);
                      const type = view.getUint16(curr + 2, littleEndian);
                      const count = view.getUint32(curr + 4, littleEndian);
                      const valOrOffset = curr + 8;
                      const resolvedOffset = count * (type === 3 ? 2 : type === 4 ? 4 : 1) > 4
                        ? tiffOffset + view.getUint32(valOrOffset, littleEndian)
                        : valOrOffset;

                      if (tagId === 1) {
                        latRef = String.fromCharCode(view.getUint8(valOrOffset));
                      } else if (tagId === 2) {
                        // Lat Degrees, Min, Sec (Rationals)
                        const dNum = view.getUint32(resolvedOffset, littleEndian);
                        const dDen = view.getUint32(resolvedOffset + 4, littleEndian) || 1;
                        const mNum = view.getUint32(resolvedOffset + 8, littleEndian);
                        const mDen = view.getUint32(resolvedOffset + 12, littleEndian) || 1;
                        const sNum = view.getUint32(resolvedOffset + 16, littleEndian);
                        const sDen = view.getUint32(resolvedOffset + 20, littleEndian) || 1;
                        lat = (dNum / dDen) + (mNum / mDen) / 60 + (sNum / sDen) / 3600;
                      } else if (tagId === 3) {
                        lngRef = String.fromCharCode(view.getUint8(valOrOffset));
                      } else if (tagId === 4) {
                        const dNum = view.getUint32(resolvedOffset, littleEndian);
                        const dDen = view.getUint32(resolvedOffset + 4, littleEndian) || 1;
                        const mNum = view.getUint32(resolvedOffset + 8, littleEndian);
                        const mDen = view.getUint32(resolvedOffset + 12, littleEndian) || 1;
                        const sNum = view.getUint32(resolvedOffset + 16, littleEndian);
                        const sDen = view.getUint32(resolvedOffset + 20, littleEndian) || 1;
                        lng = (dNum / dDen) + (mNum / mDen) / 60 + (sNum / sDen) / 3600;
                      } else if (tagId === 6) {
                        const altNum = view.getUint32(resolvedOffset, littleEndian);
                        const altDen = view.getUint32(resolvedOffset + 4, littleEndian) || 1;
                        tags.push({ tag: 'GPSAltitude', label: 'Altitude', value: `${(altNum / altDen).toFixed(1)} m above sea level`, category: 'gps' });
                      }
                      curr += 12;
                    }

                    if (lat > 0 || lng > 0) {
                      const finalLat = latRef === 'S' ? -lat : lat;
                      const finalLng = lngRef === 'W' ? -lng : lng;
                      gpsCoords = { latitude: finalLat, longitude: finalLng, latRef, lngRef };
                      tags.push({ tag: 'GPSCoordinates', label: 'GPS Location', value: `${finalLat.toFixed(6)}, ${finalLng.toFixed(6)} (${latRef}, ${lngRef})`, category: 'gps' });
                    }
                  } catch {
                    // ignore
                  }
                };

                const firstIfdOffset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
                parseIFD(firstIfdOffset, 'camera');
              }
            }
          }
          offset += sectionLength;
        }
      }

      // Load Image for dimensions
      const img = new Image();
      img.onload = () => {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const divisor = gcd(img.naturalWidth || 1, img.naturalHeight || 1);
        const aspect = `${(img.naturalWidth || 1) / divisor}:${(img.naturalHeight || 1) / divisor}`;
        const mp = (((img.naturalWidth || 1) * (img.naturalHeight || 1)) / 1000000).toFixed(2);

        resolve({
          hasExif: tags.length > 0,
          hasGps,
          gpsCoords,
          tags,
          rawStats: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'image/jpeg',
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            aspectRatio: aspect,
            megapixels: `${mp} MP`,
          },
        });
      };
      img.onerror = () => {
        resolve({
          hasExif: tags.length > 0,
          hasGps,
          gpsCoords,
          tags,
          rawStats: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'image/jpeg',
            width: 0,
            height: 0,
            aspectRatio: 'N/A',
            megapixels: '0 MP',
          },
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const arrayBuffer = await file.arrayBuffer();
    const result = await parseExifFromBuffer(arrayBuffer, file);
    setParsedData(result);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset previous sanitize state
    setSanitizedUrl(null);
    setSanitizedSize(null);
  };

  // Strip EXIF securely via clean canvas rendering
  const stripExifAndSanitize = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw pure raw pixels onto pristine canvas (bypasses all EXIF markers)
      ctx.drawImage(img, 0, 0);

      const mime = sanitizedFormat === 'jpeg' ? 'image/jpeg' : sanitizedFormat === 'webp' ? 'image/webp' : 'image/png';
      const cleanDataUrl = canvas.toDataURL(mime, sanitizedQuality / 100);
      setSanitizedUrl(cleanDataUrl);

      // Estimate clean size
      const head = `data:${mime};base64,`;
      const base64Len = cleanDataUrl.length - head.length;
      const approxBytes = Math.floor((base64Len * 3) / 4);
      setSanitizedSize(approxBytes);
    };
    img.src = imageSrc;
  };

  const handleDownloadSanitized = () => {
    if (!sanitizedUrl) return;
    const a = document.createElement('a');
    a.href = sanitizedUrl;
    const origBase = parsedData?.rawStats.fileName.replace(/\.[^/.]+$/, '') || 'image';
    const ext = sanitizedFormat === 'jpeg' ? 'jpg' : sanitizedFormat;
    a.download = `${origBase}_sanitized_codepackr.${ext}`;
    a.click();
  };

  const handleCopySanitized = async () => {
    if (!sanitizedUrl) return;
    try {
      const res = await fetch(sanitizedUrl);
      const blob = await res.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } else {
        await navigator.clipboard.writeText(sanitizedUrl);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  const loadSampleExif = () => {
    // Generate an interactive sample simulation with realistic EXIF and GPS
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 800);

      // Mock landscape & camera framing
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, 1080, 680);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sample Camera Capture (EXIF & GPS Demo)', 600, 380);

      ctx.font = '20px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Captured on Apple iPhone 15 Pro Max · GPS Active', 600, 430);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setImageSrc(dataUrl);

    // Mock rich parsed EXIF tags
    const sampleTags: ExifTagRecord[] = [
      { tag: 'Make', label: 'Camera Manufacturer', value: 'Apple', category: 'camera' },
      { tag: 'Model', label: 'Camera Model', value: 'iPhone 15 Pro Max', category: 'camera' },
      { tag: 'LensModel', label: 'Lens Specification', value: 'iPhone 15 Pro Max back triple camera 6.78mm f/1.78', category: 'camera' },
      { tag: 'Software', label: 'Software / OS', value: 'iOS 18.2 (22C152)', category: 'general' },
      { tag: 'DateTimeOriginal', label: 'Captured Date & Time', value: '2026-05-14 17:42:19', category: 'general' },
      { tag: 'Orientation', label: 'Orientation', value: '1 (Horizontal Normal)', category: 'general' },
      { tag: 'ExposureTime', label: 'Exposure Time', value: '1/320 sec', category: 'exposure' },
      { tag: 'FNumber', label: 'Aperture (F-Stop)', value: 'f/1.78', category: 'exposure' },
      { tag: 'ISOSpeedRatings', label: 'ISO Sensitivity', value: 'ISO 64', category: 'exposure' },
      { tag: 'FocalLength', label: 'Focal Length', value: '24.00 mm (35mm equivalent)', category: 'exposure' },
      { tag: 'GPSCoordinates', label: 'GPS Location', value: '37.774929, -122.419416 (San Francisco, CA)', category: 'gps' },
      { tag: 'GPSAltitude', label: 'Altitude', value: '48.5 m above sea level', category: 'gps' },
    ];

    setParsedData({
      hasExif: true,
      hasGps: true,
      gpsCoords: { latitude: 37.774929, longitude: -122.419416, latRef: 'N', lngRef: 'W' },
      tags: sampleTags,
      rawStats: {
        fileName: 'IMG_4821_SAMPLE_LOCATION.jpg',
        fileSize: 3482910,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 800,
        aspectRatio: '3:2',
        megapixels: '0.96 MP',
      },
    });

    setSanitizedUrl(null);
    setSanitizedSize(null);
  };

  const filteredTags = parsedData?.tags.filter((t) => {
    if (activeTab === 'all') return true;
    return t.category === activeTab;
  }) || [];

  const handleClearWorkspace = () => {
    setImageSrc(null);
    setParsedData(null);
    setSanitizedUrl(null);
    setSanitizedSize(null);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleClearWorkspace}
        resetLabel="Clear Workspace"
      />

      {/* Upload & Action Bar */}
      <div
        className="p-5 rounded-2xl border space-y-4 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--ink)' }}>
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Client-Side Metadata Inspector &amp; Privacy Sanitizer</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSampleExif}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer text-xs"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sample with EXIF &amp; GPS</span>
            </button>
            {imageSrc && (
              <button
                onClick={() => {
                  setImageSrc(null);
                  setParsedData(null);
                  setSanitizedUrl(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold text-rose-500 hover:opacity-80 transition-opacity cursor-pointer text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        {!imageSrc && (
          <div
            className="p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all hover:border-[var(--brand)]"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-[var(--brand)]">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                Click to browse or drop your image here
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Inspect camera model, GPS coordinates, exposure settings, and strip metadata before sharing.
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              100% Client-Side: Zero files uploaded to any server
            </span>
          </div>
        )}
      </div>

      {/* Main Inspection View */}
      {parsedData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Image Preview & Stats Card */}
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl border space-y-3 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="h-56 rounded-xl overflow-hidden flex items-center justify-center bg-slate-900/5 p-2">
                <img src={imageSrc || ''} alt="Inspected" className="max-h-full max-w-full object-contain rounded" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold border-b pb-2" style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
                  <span className="truncate max-w-[200px]" title={parsedData.rawStats.fileName}>
                    {parsedData.rawStats.fileName}
                  </span>
                  <span className="font-mono text-[var(--muted)]">
                    {formatFileSize(parsedData.rawStats.fileSize)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
                    <span className="text-[var(--muted)] block">Dimensions</span>
                    <strong className="font-mono" style={{ color: 'var(--ink)' }}>
                      {parsedData.rawStats.width} &times; {parsedData.rawStats.height}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
                    <span className="text-[var(--muted)] block">Megapixels</span>
                    <strong className="font-mono" style={{ color: 'var(--ink)' }}>
                      {parsedData.rawStats.megapixels}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
                    <span className="text-[var(--muted)] block">Aspect Ratio</span>
                    <strong className="font-mono" style={{ color: 'var(--ink)' }}>
                      {parsedData.rawStats.aspectRatio}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
                    <span className="text-[var(--muted)] block">File Type</span>
                    <strong className="font-mono uppercase" style={{ color: 'var(--ink)' }}>
                      {parsedData.rawStats.mimeType.replace('image/', '')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* GPS & Privacy Risk Alert */}
            {parsedData.hasGps ? (
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Privacy Alert: Precise GPS Location Leaking</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This image embeds exact latitude &amp; longitude coordinates. Anyone with this photo can determine where it was captured.
                </p>
                {parsedData.gpsCoords && (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">
                      {parsedData.gpsCoords.latitude.toFixed(5)}, {parsedData.gpsCoords.longitude.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${parsedData.gpsCoords.latitude}&mlon=${parsedData.gpsCoords.longitude}#map=16/${parsedData.gpsCoords.latitude}/${parsedData.gpsCoords.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>View Map</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">No GPS Coordinates Detected</span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300">This image does not broadcast geographic coordinates.</span>
                </div>
              </div>
            )}

            {/* Sanitization Control Box */}
            <div
              className="p-4 sm:p-5 rounded-2xl border space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Metadata Stripper &amp; Cleaner</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  100% Sanitized
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--muted)]">Target Output Format</label>
                  <select
                    value={sanitizedFormat}
                    onChange={(e) => setSanitizedFormat(e.target.value as any)}
                    className="w-full p-2 rounded-xl border font-medium outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    <option value="jpeg">JPEG (Stripped)</option>
                    <option value="png">PNG (Lossless, Stripped)</option>
                    <option value="webp">WebP (Modern, Stripped)</option>
                  </select>
                </div>

                {sanitizedFormat !== 'png' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--muted)]">Quality</span>
                      <span className="font-mono font-bold" style={{ color: 'var(--ink)' }}>{sanitizedQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={sanitizedQuality}
                      onChange={(e) => setSanitizedQuality(Number(e.target.value))}
                      className="w-full accent-[var(--brand)] cursor-pointer"
                    />
                  </div>
                )}

                <button
                  onClick={stripExifAndSanitize}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Strip All EXIF &amp; GPS Data</span>
                </button>

                {sanitizedUrl && (
                  <div className="pt-2 space-y-2 border-t" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-600 font-bold">Sanitized Size:</span>
                      <span className="font-mono font-bold" style={{ color: 'var(--ink)' }}>
                        {sanitizedSize ? formatFileSize(sanitizedSize) : 'Ready'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleCopySanitized}
                        className="py-2 px-2 rounded-xl border font-semibold flex items-center justify-center gap-1 hover:opacity-80 transition-opacity cursor-pointer text-[11px]"
                        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                      >
                        {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedImage ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleDownloadSanitized}
                        className="py-2 px-2 rounded-xl text-white font-bold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity cursor-pointer text-[11px]"
                        style={{ backgroundColor: 'var(--brand)' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: EXIF Tags Table / Inspector */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                    Discovered Metadata Tags ({parsedData.tags.length})
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {parsedData.hasExif
                      ? 'Decoded from image markers (APP1/Exif, TIFF, GPS SubIFD)'
                      : 'No embedded EXIF tags found in this file.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJson(!showJson)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer text-xs"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    <Code className="w-3.5 h-3.5 text-blue-500" />
                    <span>{showJson ? 'Table View' : 'JSON Dump'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const jsonStr = JSON.stringify({ stats: parsedData.rawStats, exif: parsedData.tags }, null, 2);
                      navigator.clipboard.writeText(jsonStr);
                      setCopiedRaw(true);
                      setTimeout(() => setCopiedRaw(false), 2000);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer text-xs"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRaw ? 'Copied' : 'Copy Data'}</span>
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              {!showJson && (
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {(['all', 'camera', 'exposure', 'gps'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all cursor-pointer ${
                        activeTab === tab
                          ? 'bg-[var(--brand)] text-white shadow-xs'
                          : 'border hover:opacity-80'
                      }`}
                      style={activeTab === tab ? {} : { backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
                    >
                      {tab === 'all' ? `All Tags (${parsedData.tags.length})` : tab}
                    </button>
                  ))}
                </div>
              )}

              {/* Tag Content */}
              {showJson ? (
                <pre
                  className="p-4 rounded-xl border font-mono text-xs overflow-auto max-h-[460px] leading-relaxed"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {JSON.stringify({ stats: parsedData.rawStats, exif: parsedData.tags }, null, 2)}
                </pre>
              ) : filteredTags.length > 0 ? (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}>
                        <th className="p-3 font-semibold w-1/3">Tag Name</th>
                        <th className="p-3 font-semibold w-1/2">Decoded Value</th>
                        <th className="p-3 font-semibold text-right">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                      {filteredTags.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                          <td className="p-3">
                            <span className="font-bold block" style={{ color: 'var(--ink)' }}>{t.label}</span>
                            <span className="font-mono text-[10px] text-[var(--muted)]">{t.tag}</span>
                          </td>
                          <td className="p-3 font-mono font-medium" style={{ color: 'var(--ink)' }}>
                            {t.value}
                          </td>
                          <td className="p-3 text-right">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-500/10 text-[var(--muted)]">
                              {t.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[var(--muted)] space-y-2">
                  <Info className="w-6 h-6 mx-auto opacity-50" />
                  <p>No metadata tags found matching the selected category.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
