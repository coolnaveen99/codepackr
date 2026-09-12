import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Maximize2,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Sliders,
  Shield,
  FileImage,
  Info,
  Ruler,
  Image as ImageIcon,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { SmartDownload } from '../common/SmartDownload';

export type DimensionUnit = 'px' | 'cm' | 'mm' | 'inch';

interface ImageTargetCompressorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

interface Preset {
  label: string;
  badge: string;
  unit: DimensionUnit;
  w: number;
  h: number;
  dpi?: number;
}

// Unit conversion helpers
export function unitToPixels(val: number, unit: DimensionUnit, currentDpi: number): number {
  if (!val || val <= 0) return 1;
  if (unit === 'px') return Math.max(1, Math.round(val));
  if (unit === 'inch') return Math.max(1, Math.round(val * currentDpi));
  if (unit === 'cm') return Math.max(1, Math.round((val / 2.54) * currentDpi));
  if (unit === 'mm') return Math.max(1, Math.round((val / 25.4) * currentDpi));
  return Math.max(1, Math.round(val));
}

export function pixelsToUnit(px: number, targetUnit: DimensionUnit, currentDpi: number): number {
  if (!px || px <= 0) return 1;
  if (targetUnit === 'px') return Math.max(1, Math.round(px));
  if (targetUnit === 'inch') {
    return Math.max(0.01, Math.round((px / currentDpi) * 100) / 100);
  }
  if (targetUnit === 'cm') {
    return Math.max(0.01, Math.round(((px * 2.54) / currentDpi) * 100) / 100);
  }
  if (targetUnit === 'mm') {
    return Math.max(0.1, Math.round(((px * 25.4) / currentDpi) * 10) / 10);
  }
  return Math.max(1, Math.round(px));
}

function roundForUnit(val: number, unit: DimensionUnit): number {
  if (unit === 'px') return Math.max(1, Math.round(val));
  if (unit === 'mm') return Math.max(0.1, Math.round(val * 10) / 10);
  if (unit === 'cm') return Math.max(0.01, Math.round(val * 100) / 100);
  if (unit === 'inch') return Math.max(0.01, Math.round(val * 100) / 100);
  return val;
}

export const ImageTargetCompressorView: React.FC<ImageTargetCompressorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  // Source Image State
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const [sourceDimensions, setSourceDimensions] = useState<{ width: number; height: number } | null>(null);
  const [sourceBytes, setSourceBytes] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Dimension Controls & Unit
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>('px');
  const [dpi, setDpi] = useState<number>(300);
  const [isCustomDpi, setIsCustomDpi] = useState<boolean>(false);
  const [customDpiVal, setCustomDpiVal] = useState<number>(300);

  const [inputWidth, setInputWidth] = useState<number>(600);
  const [inputHeight, setInputHeight] = useState<number>(800);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(600 / 800);

  // File Size Controls
  const [maxSizeValue, setMaxSizeValue] = useState<number>(150);
  const [maxSizeUnit, setMaxSizeUnit] = useState<'KB' | 'MB'>('KB');

  // Output Format & Options
  const [outputFormat, setOutputFormat] = useState<'auto' | 'jpeg' | 'webp' | 'png'>('auto');
  const [autoReduceDimensions, setAutoReduceDimensions] = useState<boolean>(false);

  // Processing & Result State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [processedDimensions, setProcessedDimensions] = useState<{ width: number; height: number } | null>(null);
  const [processedBytes, setProcessedBytes] = useState<number>(0);
  const [appliedQuality, setAppliedQuality] = useState<number>(0);
  const [resolvedFormat, setResolvedFormat] = useState<string>('jpeg');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute actual pixel dimensions
  const pixelWidth = useMemo(
    () => unitToPixels(inputWidth, dimensionUnit, dpi),
    [inputWidth, dimensionUnit, dpi]
  );
  const pixelHeight = useMemo(
    () => unitToPixels(inputHeight, dimensionUnit, dpi),
    [inputHeight, dimensionUnit, dpi]
  );

  // Target byte limit
  const targetBytes = maxSizeUnit === 'KB' ? maxSizeValue * 1024 : maxSizeValue * 1024 * 1024;

  // Presets
  const dimensionPresets: Preset[] = [
    { label: 'US Passport / Visa', badge: '2 × 2 in', unit: 'inch', w: 2, h: 2, dpi: 300 },
    { label: 'Indian Passport / OCI', badge: '3.5 × 4.5 cm', unit: 'cm', w: 3.5, h: 4.5, dpi: 300 },
    { label: 'Schengen / Europe Visa', badge: '35 × 45 mm', unit: 'mm', w: 35, h: 45, dpi: 300 },
    { label: 'UK Passport Photo', badge: '3.5 × 4.5 cm', unit: 'cm', w: 3.5, h: 4.5, dpi: 300 },
    { label: 'Canadian Passport', badge: '5 × 7 cm', unit: 'cm', w: 5, h: 7, dpi: 300 },
    { label: 'Standard Photo Print', badge: '4 × 6 in', unit: 'inch', w: 4, h: 6, dpi: 300 },
    { label: 'Web HD Landscape', badge: '1200 × 800 px', unit: 'px', w: 1200, h: 800 },
    { label: 'Square Avatar', badge: '600 × 600 px', unit: 'px', w: 600, h: 600 },
  ];

  // File Size Presets
  const sizePresets = [
    { label: '50 KB', value: 50, unit: 'KB' as const },
    { label: '100 KB', value: 100, unit: 'KB' as const },
    { label: '150 KB (Gov/Visa)', value: 150, unit: 'KB' as const },
    { label: '200 KB', value: 200, unit: 'KB' as const },
    { label: '300 KB', value: 300, unit: 'KB' as const },
    { label: '500 KB', value: 500, unit: 'KB' as const },
    { label: '1 MB', value: 1, unit: 'MB' as const },
  ];

  // Handle Image File Input
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }

    setSourceFile(file);
    setSourceBytes(file.size);
    setErrorMessage(null);
    setWarningMessage(null);
    setProcessedBlob(null);
    setProcessedDataUrl(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSourceDataUrl(result);

      const img = new Image();
      img.onload = () => {
        setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setAspectRatio(img.naturalWidth / img.naturalHeight);

        // If maintainAspectRatio is on, adjust height based on natural aspect ratio
        if (maintainAspectRatio) {
          const newH = roundForUnit(inputWidth / (img.naturalWidth / img.naturalHeight), dimensionUnit);
          setInputHeight(newH);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Demo sample portrait generator
  const handleLoadSampleImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clean neutral gradient studio backdrop
    const grad = ctx.createLinearGradient(0, 0, 0, 1600);
    grad.addColorStop(0, '#F1F5F9');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1600);

    // Subtle vignette
    ctx.fillStyle = '#475569';
    // Torso / shoulders
    ctx.beginPath();
    ctx.ellipse(600, 1420, 440, 260, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(520, 950, 160, 220);

    // Head
    ctx.beginPath();
    ctx.ellipse(600, 750, 250, 320, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E1';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#64748B';
    ctx.stroke();

    // Sample watermark text
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText('CODEPACKR DEMO PORTRAIT PHOTO', 600, 220);
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('1200 × 1600 px • High Resolution Portrait Asset', 600, 270);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'demo_passport_photo.jpg', { type: 'image/jpeg' });
        handleImageFile(file);
      }
    }, 'image/jpeg', 0.95);
  };

  // Unit switch handler (preserves current physical / pixel size)
  const handleUnitChange = (newUnit: DimensionUnit) => {
    if (newUnit === dimensionUnit) return;
    const newW = pixelsToUnit(pixelWidth, newUnit, dpi);
    const newH = pixelsToUnit(pixelHeight, newUnit, dpi);
    setDimensionUnit(newUnit);
    setInputWidth(newW);
    setInputHeight(newH);
  };

  // DPI change handler
  const handleDpiSelect = (val: string) => {
    if (val === 'custom') {
      setIsCustomDpi(true);
    } else {
      setIsCustomDpi(false);
      const newDpi = Number(val);
      setDpi(newDpi);
    }
  };

  // Width change handler with aspect ratio sync
  const handleWidthChange = (val: number) => {
    const safeVal = Math.max(0.01, val);
    setInputWidth(safeVal);
    if (maintainAspectRatio && aspectRatio > 0) {
      setInputHeight(roundForUnit(safeVal / aspectRatio, dimensionUnit));
    }
  };

  // Height change handler with aspect ratio sync
  const handleHeightChange = (val: number) => {
    const safeVal = Math.max(0.01, val);
    setInputHeight(safeVal);
    if (maintainAspectRatio && aspectRatio > 0) {
      setInputWidth(roundForUnit(safeVal * aspectRatio, dimensionUnit));
    }
  };

  // Apply preset
  const applyPreset = (p: Preset) => {
    setMaintainAspectRatio(false);
    setDimensionUnit(p.unit);
    if (p.dpi) setDpi(p.dpi);
    setInputWidth(p.w);
    setInputHeight(p.h);
    setAspectRatio(p.w / p.h);
  };

  // Binary search compression algorithm
  const processImage = async () => {
    if (!sourceDataUrl || !sourceDimensions) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setWarningMessage(null);
    setProcessingStage('Loading image and initializing canvas...');

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to decode source image'));
        img.src = sourceDataUrl;
      });

      // Determine output MIME format
      let formatMime = 'image/jpeg';
      let formatExt = 'jpg';

      if (outputFormat === 'auto') {
        if (sourceFile?.type === 'image/png' || sourceFile?.name.endsWith('.png')) {
          formatMime = 'image/webp';
          formatExt = 'webp';
        } else {
          formatMime = 'image/jpeg';
          formatExt = 'jpg';
        }
      } else if (outputFormat === 'webp') {
        formatMime = 'image/webp';
        formatExt = 'webp';
      } else if (outputFormat === 'png') {
        formatMime = 'image/png';
        formatExt = 'png';
      } else {
        formatMime = 'image/jpeg';
        formatExt = 'jpg';
      }

      setResolvedFormat(formatExt);

      let curW = pixelWidth;
      let curH = pixelHeight;
      let bestBlob: Blob | null = null;
      let bestQuality = 0.85;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('HTML5 2D Canvas not supported by browser');

      const encodeCanvas = (w: number, h: number, quality: number, mime: string): Promise<Blob | null> => {
        canvas.width = w;
        canvas.height = h;

        if (mime === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.clearRect(0, 0, w, h);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        return new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), mime, quality);
        });
      };

      setProcessingStage(`Rendering image to target resolution (${curW} × ${curH} px)...`);

      if (formatExt === 'png') {
        const blob = await encodeCanvas(curW, curH, 1.0, 'image/png');
        if (blob) {
          bestBlob = blob;
          bestQuality = 1.0;
          if (blob.size > targetBytes) {
            setWarningMessage(
              `PNG is a lossless format and produced ${(blob.size / 1024).toFixed(1)} KB (exceeding your ${maxSizeValue} ${maxSizeUnit} target). Consider choosing JPEG or WebP for optimal compression under strict limits.`
            );
          }
        }
      } else {
        setProcessingStage('Performing binary search for optimal visual quality...');

        let low = 0.05;
        let high = 0.95;
        let optimalBlob: Blob | null = null;
        let optimalQuality = 0.85;

        for (let iteration = 0; iteration < 8; iteration++) {
          const midQuality = (low + high) / 2;
          const candidateBlob = await encodeCanvas(curW, curH, midQuality, formatMime);

          if (!candidateBlob) break;

          if (candidateBlob.size <= targetBytes) {
            optimalBlob = candidateBlob;
            optimalQuality = midQuality;
            low = midQuality;
          } else {
            high = midQuality;
          }

          if (high - low < 0.03) break;
        }

        if (optimalBlob) {
          bestBlob = optimalBlob;
          bestQuality = optimalQuality;
        } else {
          const floorBlob = await encodeCanvas(curW, curH, 0.05, formatMime);

          if (floorBlob && floorBlob.size > targetBytes && autoReduceDimensions) {
            setProcessingStage('File size still exceeds target. Progressively stepping down dimensions...');
            let scale = 0.9;
            while (scale >= 0.3) {
              const scaledW = Math.max(50, Math.round(curW * scale));
              const scaledH = Math.max(50, Math.round(curH * scale));
              const scaledBlob = await encodeCanvas(scaledW, scaledH, 0.7, formatMime);

              if (scaledBlob && scaledBlob.size <= targetBytes) {
                bestBlob = scaledBlob;
                bestQuality = 0.7;
                curW = scaledW;
                curH = scaledH;
                setWarningMessage(
                  `Dimensions automatically reduced to ${curW} × ${curH} px to satisfy your strict ${maxSizeValue} ${maxSizeUnit} ceiling.`
                );
                break;
              }
              scale -= 0.1;
            }
          }

          if (!bestBlob) {
            bestBlob = floorBlob;
            bestQuality = 0.05;
            setWarningMessage(
              `Target file size limit (${maxSizeValue} ${maxSizeUnit}) is very compact for ${pixelWidth} × ${pixelHeight} px. Best compressed result is ${(floorBlob ? floorBlob.size / 1024 : 0).toFixed(1)} KB. Check "Reduce dimensions if required" to auto-fit.`
            );
          }
        }
      }

      if (bestBlob) {
        setProcessedBlob(bestBlob);
        setProcessedBytes(bestBlob.size);
        setProcessedDimensions({ width: curW, height: curH });
        setAppliedQuality(Math.round(bestQuality * 100));

        const previewUrl = URL.createObjectURL(bestBlob);
        setProcessedDataUrl(previewUrl);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during compression');
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // Run automatically when source, dimensions or target size change
  useEffect(() => {
    if (sourceDataUrl) {
      const timer = setTimeout(() => {
        processImage();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [sourceDataUrl, pixelWidth, pixelHeight, maxSizeValue, maxSizeUnit, outputFormat, autoReduceDimensions]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (processedDataUrl) {
        URL.revokeObjectURL(processedDataUrl);
      }
    };
  }, [processedDataUrl]);

  // Reduction percentage
  const reductionPercent =
    sourceBytes > 0 && processedBytes > 0
      ? Math.max(0, ((sourceBytes - processedBytes) / sourceBytes) * 100).toFixed(1)
      : '0';

  const isWithinLimit = processedBytes > 0 && processedBytes <= targetBytes;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Purpose Banner */}
      <div
        className="p-5 rounded-2xl border space-y-2"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl text-white"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
              Image Resizer & Target Size Compressor
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Configure exact dimensions in <strong>Pixels (px)</strong>, <strong>Centimeters (cm)</strong>, <strong>Millimeters (mm)</strong>, or <strong>Inches (in)</strong> with DPI control and strict maximum file size (KB/MB).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs pt-2 flex-wrap" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Client-Side In-Browser</span>
          </span>
          <span>•</span>
          <span>Physical & Digital Unit Conversions</span>
          <span>•</span>
          <span>DPI Print & Passport Standard</span>
          <span>•</span>
          <span>Multi-Pass Binary Search Optimization</span>
        </div>
      </div>

      {/* Upload Zone / Active Image Bar */}
      {!sourceDataUrl ? (
        <div
          className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
            isDragging ? 'ring-2 ring-[var(--brand)] bg-[var(--surface-2)]' : ''
          }`}
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleImageFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
            }}
            className="hidden"
          />
          <div
            className="w-12 h-12 mx-auto mb-2 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--brand)' }}
          >
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--ink)' }}>
            Choose an Image or Drag & Drop Here
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            Supports PNG, JPEG, WebP, AVIF, and GIF. Photos, documents, signatures, and passport images.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Select Image File
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSampleImage();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80 cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sample Portrait Photo</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 flex-wrap shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-3 text-xs">
            <div className="w-10 h-10 rounded-lg overflow-hidden border bg-slate-900/10 shrink-0" style={{ borderColor: 'var(--line)' }}>
              <img src={sourceDataUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--ink)' }}>
                <FileImage className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>{sourceFile?.name || 'Selected Image'}</span>
              </div>
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                Original: {sourceDimensions?.width} × {sourceDimensions?.height} px • {(sourceBytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:opacity-80 flex items-center gap-1 cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Replace Image</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                setSourceFile(null);
                setSourceDataUrl(null);
                setProcessedBlob(null);
                setProcessedDataUrl(null);
                setSourceDimensions(null);
                setSourceBytes(0);
              }}
              className="px-2.5 py-1.5 text-xs text-rose-500 hover:opacity-80 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFIGURATION TOOLBOX - ALWAYS VISIBLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Target Dimensions */}
        <div
          className="p-5 rounded-2xl border space-y-4 shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
                1. Target Dimensions
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
              className={`text-xs flex items-center gap-1 font-medium px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                maintainAspectRatio ? 'border-[var(--brand)] text-[var(--brand)]' : 'border-[var(--line)] text-[var(--muted)]'
              }`}
              style={{ backgroundColor: 'var(--surface-2)' }}
              title={maintainAspectRatio ? 'Aspect ratio locked' : 'Arbitrary exact dimensions'}
            >
              {maintainAspectRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{maintainAspectRatio ? 'Ratio Locked' : 'Ratio Unlocked'}</span>
            </button>
          </div>

          {/* Unit Selector Tabs */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
              MEASUREMENT UNIT:
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              {[
                { id: 'px', label: 'Pixels (px)' },
                { id: 'cm', label: 'Centimeters (cm)' },
                { id: 'mm', label: 'Millimeters (mm)' },
                { id: 'inch', label: 'Inches (in)' },
              ].map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleUnitChange(u.id as DimensionUnit)}
                  className={`py-1 px-1.5 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                    dimensionUnit === u.id ? 'shadow-xs text-white' : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: dimensionUnit === u.id ? 'var(--brand)' : 'transparent',
                    color: dimensionUnit === u.id ? '#ffffff' : 'var(--ink)',
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Width & Height Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                WIDTH ({dimensionUnit.toUpperCase()})
              </label>
              <input
                type="number"
                step={dimensionUnit === 'px' || dimensionUnit === 'mm' ? '1' : '0.01'}
                min="0.01"
                value={inputWidth}
                onChange={(e) => handleWidthChange(Number(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border text-xs font-mono outline-none focus:ring-2 focus:ring-[var(--brand)]"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                HEIGHT ({dimensionUnit.toUpperCase()})
              </label>
              <input
                type="number"
                step={dimensionUnit === 'px' || dimensionUnit === 'mm' ? '1' : '0.01'}
                min="0.01"
                value={inputHeight}
                onChange={(e) => handleHeightChange(Number(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border text-xs font-mono outline-none focus:ring-2 focus:ring-[var(--brand)]"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          {/* DPI Resolution Selector (shown for cm, mm, inch or for print clarity) */}
          <div
            className="p-3 rounded-xl border space-y-2"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--ink)' }}>
                <span>Print & Scan Resolution (DPI / PPI):</span>
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={isCustomDpi ? 'custom' : dpi}
                  onChange={(e) => handleDpiSelect(e.target.value)}
                  className="p-1 rounded-lg border text-xs outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <option value="300">300 DPI (Passport & High Print)</option>
                  <option value="200">200 DPI (Standard Print)</option>
                  <option value="150">150 DPI (Medium Quality Scan)</option>
                  <option value="96">96 DPI (Web & Screen Standard)</option>
                  <option value="72">72 DPI (Legacy Screen)</option>
                  <option value="custom">Custom DPI...</option>
                </select>

                {isCustomDpi && (
                  <input
                    type="number"
                    min="10"
                    max="2400"
                    value={customDpiVal}
                    onChange={(e) => {
                      const v = Math.max(10, Number(e.target.value));
                      setCustomDpiVal(v);
                      setDpi(v);
                    }}
                    className="w-16 p-1 rounded-lg border text-xs font-mono"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  />
                )}
              </div>
            </div>

            {/* Computed pixel badge */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
              <span>Effective Digital Resolution:</span>
              <span className="font-mono font-bold" style={{ color: 'var(--brand)' }}>
                {pixelWidth} × {pixelHeight} px @ {dpi} DPI
              </span>
            </div>
          </div>

          {/* Dimension Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium block" style={{ color: 'var(--muted)' }}>
              Popular Passport & Portal Presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {dimensionPresets.map((p) => {
                const isSelected =
                  dimensionUnit === p.unit && inputWidth === p.w && inputHeight === p.h;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 rounded-lg text-[11px] border hover:opacity-80 transition-all cursor-pointer flex items-center gap-1"
                    style={{
                      backgroundColor: isSelected ? 'var(--surface-2)' : 'var(--bg)',
                      borderColor: isSelected ? 'var(--brand)' : 'var(--line)',
                      color: isSelected ? 'var(--brand)' : 'var(--ink)',
                    }}
                  >
                    <span>{p.label}</span>
                    <span className="opacity-70 text-[10px]">({p.badge})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Maximum File Size & Format */}
        <div
          className="p-5 rounded-2xl border space-y-4 shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
                2. Maximum File Size & Format
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">
              ≤ {maxSizeValue} {maxSizeUnit}
            </span>
          </div>

          {/* Size Input with Unit Selector */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                MAXIMUM FILE SIZE
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxSizeValue}
                onChange={(e) => setMaxSizeValue(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border text-xs font-mono outline-none focus:ring-2 focus:ring-[var(--brand)]"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                UNIT
              </label>
              <select
                value={maxSizeUnit}
                onChange={(e) => setMaxSizeUnit(e.target.value as 'KB' | 'MB')}
                className="w-full p-2.5 rounded-xl border text-xs outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="KB">KB</option>
                <option value="MB">MB</option>
              </select>
            </div>
          </div>

          {/* Size Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium block" style={{ color: 'var(--muted)' }}>
              Upload portal presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sizePresets.map((sp) => (
                <button
                  key={sp.label}
                  type="button"
                  onClick={() => {
                    setMaxSizeValue(sp.value);
                    setMaxSizeUnit(sp.unit);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] border hover:opacity-80 transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      maxSizeValue === sp.value && maxSizeUnit === sp.unit ? 'var(--surface-2)' : 'var(--bg)',
                    borderColor:
                      maxSizeValue === sp.value && maxSizeUnit === sp.unit ? 'var(--brand)' : 'var(--line)',
                    color:
                      maxSizeValue === sp.value && maxSizeUnit === sp.unit ? 'var(--brand)' : 'var(--ink)',
                  }}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Output Format Selector */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                OUTPUT FORMAT
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
                className="w-full p-2 rounded-xl border text-xs outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="auto">Auto (Best Match)</option>
                <option value="jpeg">JPEG (Compressed)</option>
                <option value="webp">WebP (Modern)</option>
                <option value="png">PNG (Lossless)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs mb-2 select-none" style={{ color: 'var(--ink)' }}>
                <input
                  type="checkbox"
                  checked={autoReduceDimensions}
                  onChange={(e) => setAutoReduceDimensions(e.target.checked)}
                  className="rounded accent-[var(--brand)]"
                />
                <span>Reduce dimensions if required</span>
              </label>
            </div>
          </div>

          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            CodePackr uses binary search to compute the highest visual quality score (1-100%) that strictly guarantees file size ≤ {maxSizeValue} {maxSizeUnit}.
          </p>
        </div>
      </div>

      {/* Output / Results Section */}
      {!sourceDataUrl ? (
        /* Pre-upload Ready Card */
        <div
          className="p-6 rounded-2xl border text-center space-y-3"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: 'var(--brand)' }}>
            <Sparkles className="w-4 h-4" />
            <span>CONFIGURED & READY FOR OPTIMIZATION</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--ink)' }}>
            Target: <strong>{inputWidth} {dimensionUnit} × {inputHeight} {dimensionUnit}</strong>{' '}
            <span className="font-mono text-emerald-600">({pixelWidth} × {pixelHeight} px @ {dpi} DPI)</span> • Limit:{' '}
            <strong>≤ {maxSizeValue} {maxSizeUnit}</strong> • Format: <strong>{outputFormat.toUpperCase()}</strong>
          </div>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
            Upload your photo or document above to generate your resized, size-compliant image instantly in your browser.
          </p>
          <div className="pt-1 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Select Image to Compress
            </button>
            <button
              type="button"
              onClick={handleLoadSampleImage}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border hover:opacity-80 cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              Test with Sample Photo
            </button>
          </div>
        </div>
      ) : (
        /* Active Processing & Results */
        <div className="space-y-6">
          {isProcessing && (
            <div
              className="p-4 rounded-2xl border flex items-center justify-center gap-3 animate-pulse"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--brand)' }}
            >
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--brand)]" />
              <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                {processingStage || 'Searching optimal compression quality...'}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {warningMessage && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{warningMessage}</span>
            </div>
          )}

          {processedBlob && (
            <div className="space-y-6">
              {/* Metrics Summary Card */}
              <div
                className="p-5 rounded-2xl border shadow-sm space-y-4"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-5 h-5 ${isWithinLimit ? 'text-emerald-500' : 'text-amber-500'}`}
                    />
                    <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                      {isWithinLimit
                        ? `✓ Successfully optimized to ≤ ${maxSizeValue} ${maxSizeUnit}`
                        : `Optimized result (${(processedBytes / 1024).toFixed(1)} KB)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                      style={{
                        backgroundColor: 'var(--surface-2)',
                        borderColor: 'var(--line)',
                        color: 'var(--brand)',
                      }}
                    >
                      Reduction: {reductionPercent}%
                    </span>
                  </div>
                </div>

                {/* Side-by-side Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                      Original Size
                    </span>
                    <span className="font-bold text-sm block" style={{ color: 'var(--ink)' }}>
                      {(sourceBytes / 1024).toFixed(1)} KB
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {sourceDimensions?.width} × {sourceDimensions?.height} px
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                      Output Size
                    </span>
                    <span
                      className={`font-bold text-sm block ${
                        isWithinLimit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                      }`}
                    >
                      {(processedBytes / 1024).toFixed(1)} KB
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {processedDimensions?.width} × {processedDimensions?.height} px
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                      Format & Quality
                    </span>
                    <span className="font-bold text-sm block uppercase" style={{ color: 'var(--ink)' }}>
                      {resolvedFormat}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      Quality: {appliedQuality}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                      Constraint Status
                    </span>
                    <span
                      className={`font-bold text-sm block ${
                        isWithinLimit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                      }`}
                    >
                      {isWithinLimit ? 'PASS (≤ Limit)' : 'LIMIT EXCEEDED'}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      Target: ≤ {maxSizeValue} {maxSizeUnit}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Visual Comparison Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold flex items-center justify-between" style={{ color: 'var(--muted)' }}>
                      <span>ORIGINAL ({sourceDimensions?.width} × {sourceDimensions?.height})</span>
                      <span>{(sourceBytes / 1024).toFixed(1)} KB</span>
                    </span>
                    <div
                      className="p-3 rounded-xl border flex items-center justify-center max-h-64 overflow-hidden bg-slate-900/5 dark:bg-black/20"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      {sourceDataUrl && (
                        <img
                          src={sourceDataUrl}
                          alt="Original"
                          className="max-h-56 object-contain rounded-lg"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold flex items-center justify-between" style={{ color: 'var(--muted)' }}>
                      <span>OUTPUT ({processedDimensions?.width} × {processedDimensions?.height})</span>
                      <span className="text-emerald-500 font-bold">{(processedBytes / 1024).toFixed(1)} KB</span>
                    </span>
                    <div
                      className="p-3 rounded-xl border flex items-center justify-center max-h-64 overflow-hidden bg-slate-900/5 dark:bg-black/20"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      {processedDataUrl && (
                        <img
                          src={processedDataUrl}
                          alt="Processed Result"
                          className="max-h-56 object-contain rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CodePackr Global Smart File Name & Download Component */}
              <SmartDownload
                file={processedBlob}
                extension={resolvedFormat}
                originalName={sourceFile?.name}
                operation="resize-compress"
                toolContext="image"
                metadata={{
                  width: processedDimensions?.width,
                  height: processedDimensions?.height,
                  maxBytes: targetBytes,
                  actualBytes: processedBytes,
                }}
                label={`Download Resized Image (${(processedBytes / 1024).toFixed(1)} KB)`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
