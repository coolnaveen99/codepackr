import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  GitCompare,
  Upload,
  Download,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Sliders,
  Eye,
  Layers,
  Split,
  Maximize2,
  AlertTriangle,
  Play,
  Pause,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface ImageDiffViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

type DiffMode = 'slider' | 'diff' | 'side-by-side' | 'blend' | 'flicker';

interface DiffMetrics {
  totalPixels: number;
  differingPixels: number;
  diffPercentage: number;
  matchPercentage: number;
  widthA: number;
  heightA: number;
  widthB: number;
  heightB: number;
}

export const ImageDiffView: React.FC<ImageDiffViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const [imageASrc, setImageASrc] = useState<string | null>(null);
  const [imageBSrc, setImageBSrc] = useState<string | null>(null);
  const [imageAName, setImageAName] = useState<string | null>(null);
  const [imageBName, setImageBName] = useState<string | null>(null);

  const [mode, setMode] = useState<DiffMode>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0-100
  const [tolerance, setTolerance] = useState<number>(10); // 0-50
  const [blendOpacity, setBlendOpacity] = useState<number>(50); // 0-100
  const [isFlickering, setIsFlickering] = useState<boolean>(false);
  const [flickerActiveA, setFlickerActiveA] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<DiffMetrics | null>(null);
  const [diffImageUrl, setDiffImageUrl] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSliderRef = useRef<boolean>(false);

  const handleImageUpload = (file: File, slot: 'A' | 'B') => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      if (slot === 'A') {
        setImageASrc(res);
        setImageAName(file.name);
      } else {
        setImageBSrc(res);
        setImageBName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Compute pixel-level difference using Canvas ImageData
  const computeDiff = useCallback(() => {
    if (!imageASrc || !imageBSrc) {
      setMetrics(null);
      setDiffImageUrl(null);
      return;
    }

    const imgA = new Image();
    const imgB = new Image();

    let loaded = 0;
    const onBothLoaded = () => {
      loaded++;
      if (loaded < 2) return;

      const wA = imgA.naturalWidth || imgA.width;
      const hA = imgA.naturalHeight || imgA.height;
      const wB = imgB.naturalWidth || imgB.width;
      const hB = imgB.naturalHeight || imgB.height;

      const maxW = Math.max(wA, wB);
      const maxH = Math.max(hA, hB);

      const canvasA = document.createElement('canvas');
      canvasA.width = maxW; canvasA.height = maxH;
      const ctxA = canvasA.getContext('2d');
      if (!ctxA) return;
      ctxA.drawImage(imgA, 0, 0, wA, hA);

      const canvasB = document.createElement('canvas');
      canvasB.width = maxW; canvasB.height = maxH;
      const ctxB = canvasB.getContext('2d');
      if (!ctxB) return;
      ctxB.drawImage(imgB, 0, 0, wB, hB);

      const dataA = ctxA.getImageData(0, 0, maxW, maxH);
      const dataB = ctxB.getImageData(0, 0, maxW, maxH);

      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = maxW; diffCanvas.height = maxH;
      const diffCtx = diffCanvas.getContext('2d');
      if (!diffCtx) return;

      const diffImgData = diffCtx.createImageData(maxW, maxH);
      const pixA = dataA.data;
      const pixB = dataB.data;
      const pixDiff = diffImgData.data;

      const totalPixels = maxW * maxH;
      let diffPixels = 0;
      const tolThreshold = (tolerance / 100) * 255;

      for (let i = 0; i < pixA.length; i += 4) {
        const rDiff = Math.abs(pixA[i] - pixB[i]);
        const gDiff = Math.abs(pixA[i + 1] - pixB[i + 1]);
        const bDiff = Math.abs(pixA[i + 2] - pixB[i + 2]);
        const aDiff = Math.abs(pixA[i + 3] - pixB[i + 3]);

        const delta = (rDiff + gDiff + bDiff + aDiff) / 4;

        if (delta > tolThreshold) {
          diffPixels++;
          // Highlight in vivid crimson/magenta
          pixDiff[i] = 239;     // R
          pixDiff[i + 1] = 68;  // G
          pixDiff[i + 2] = 68;  // B
          pixDiff[i + 3] = 255; // Alpha
        } else {
          // Dim original pixel to neutral grayscale backdrop
          const gray = Math.round(pixA[i] * 0.299 + pixA[i + 1] * 0.587 + pixA[i + 2] * 0.114);
          pixDiff[i] = Math.round(gray * 0.35);
          pixDiff[i + 1] = Math.round(gray * 0.35);
          pixDiff[i + 2] = Math.round(gray * 0.35);
          pixDiff[i + 3] = 160;
        }
      }

      diffCtx.putImageData(diffImgData, 0, 0);
      setDiffImageUrl(diffCanvas.toDataURL('image/png'));

      const diffPct = (diffPixels / totalPixels) * 100;
      setMetrics({
        totalPixels,
        differingPixels: diffPixels,
        diffPercentage: Number(diffPct.toFixed(2)),
        matchPercentage: Number((100 - diffPct).toFixed(2)),
        widthA: wA,
        heightA: hA,
        widthB: wB,
        heightB: hB,
      });
    };

    imgA.onload = onBothLoaded;
    imgB.onload = onBothLoaded;
    imgA.src = imageASrc;
    imgB.src = imageBSrc;
  }, [imageASrc, imageBSrc, tolerance]);

  useEffect(() => {
    computeDiff();
  }, [computeDiff]);

  // Flicker interval effect
  useEffect(() => {
    if (!isFlickering) return;
    const interval = setInterval(() => {
      setFlickerActiveA((prev) => !prev);
    }, 450);
    return () => clearInterval(interval);
  }, [isFlickering]);

  // Mouse / Touch handlers for split slider
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handleMouseDown = () => {
    isDraggingSliderRef.current = true;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingSliderRef.current) return;
      handleSliderMove(e.clientX);
    };
    const handleGlobalMouseUp = () => {
      isDraggingSliderRef.current = false;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const loadPresetSamples = () => {
    // Generate Sample A (Baseline UI)
    const cA = document.createElement('canvas');
    cA.width = 640; cA.height = 420;
    const ctxA = cA.getContext('2d');
    if (ctxA) {
      ctxA.fillStyle = '#0f172a';
      ctxA.fillRect(0, 0, 640, 420);

      // Card 1
      ctxA.fillStyle = '#1e293b';
      ctxA.roundRect(40, 40, 560, 340, 16);
      ctxA.fill();

      // Heading
      ctxA.fillStyle = '#f8fafc';
      ctxA.font = 'bold 24px system-ui, sans-serif';
      ctxA.fillText('CodePackr Production v1.0', 70, 95);

      // Status Badge (Green)
      ctxA.fillStyle = '#10b981';
      ctxA.roundRect(70, 120, 100, 28, 8);
      ctxA.fill();
      ctxA.fillStyle = '#ffffff';
      ctxA.font = 'bold 12px system-ui, sans-serif';
      ctxA.fillText('STABLE', 98, 138);

      // Mock Text Lines
      ctxA.fillStyle = '#94a3b8';
      ctxA.font = '14px system-ui, sans-serif';
      ctxA.fillText('Client-side zero-knowledge security verified.', 70, 185);
      ctxA.fillText('Running 48 local dev tools in browser memory.', 70, 215);

      // Action Button
      ctxA.fillStyle = '#2563eb';
      ctxA.roundRect(70, 260, 160, 44, 10);
      ctxA.fill();
      ctxA.fillStyle = '#ffffff';
      ctxA.font = 'bold 14px system-ui, sans-serif';
      ctxA.fillText('Run Diagnostics', 95, 287);
    }
    setImageASrc(cA.toDataURL('image/png'));
    setImageAName('production_baseline_v1.png');

    // Generate Sample B (Modified with visual regressions: changed badge color, shifted button, altered text)
    const cB = document.createElement('canvas');
    cB.width = 640; cB.height = 420;
    const ctxB = cB.getContext('2d');
    if (ctxB) {
      ctxB.fillStyle = '#0f172a';
      ctxB.fillRect(0, 0, 640, 420);

      // Card 1
      ctxB.fillStyle = '#1e293b';
      ctxB.roundRect(40, 40, 560, 340, 16);
      ctxB.fill();

      // Heading (Changed to v2.0)
      ctxB.fillStyle = '#f8fafc';
      ctxB.font = 'bold 24px system-ui, sans-serif';
      ctxB.fillText('CodePackr Production v2.0', 70, 95);

      // Status Badge (Changed color to Amber & label)
      ctxB.fillStyle = '#f59e0b';
      ctxB.roundRect(70, 120, 120, 28, 8);
      ctxB.fill();
      ctxB.fillStyle = '#ffffff';
      ctxB.font = 'bold 12px system-ui, sans-serif';
      ctxB.fillText('CANDIDATE', 92, 138);

      // Mock Text Lines
      ctxB.fillStyle = '#94a3b8';
      ctxB.font = '14px system-ui, sans-serif';
      ctxB.fillText('Client-side zero-knowledge security verified.', 70, 185);
      ctxB.fillText('Running 51 local dev tools in browser memory.', 70, 215);

      // Action Button (Shifted position and color to emerald)
      ctxB.fillStyle = '#059669';
      ctxB.roundRect(85, 260, 180, 44, 10);
      ctxB.fill();
      ctxB.fillStyle = '#ffffff';
      ctxB.font = 'bold 14px system-ui, sans-serif';
      ctxB.fillText('Execute Analysis', 115, 287);
    }
    setImageBSrc(cB.toDataURL('image/png'));
    setImageBName('staging_candidate_v2.png');
  };

  const handleDownloadDiff = () => {
    if (!diffImageUrl) return;
    const a = document.createElement('a');
    a.href = diffImageUrl;
    a.download = `pixel_diff_${Date.now()}.png`;
    a.click();
  };

  const handleCopyReport = () => {
    if (!metrics) return;
    const report = [
      `=== CodePackr Visual Regression Diff Report ===`,
      `Image A (Baseline): ${imageAName || 'Image A'} (${metrics.widthA}x${metrics.heightA} px)`,
      `Image B (Candidate): ${imageBName || 'Image B'} (${metrics.widthB}x${metrics.heightB} px)`,
      `Comparison Grid: ${Math.max(metrics.widthA, metrics.widthB)}x${Math.max(metrics.heightA, metrics.heightB)} px (${metrics.totalPixels.toLocaleString()} total pixels)`,
      `Tolerance Threshold: ${tolerance}%`,
      `Differing Pixels: ${metrics.differingPixels.toLocaleString()} (${metrics.diffPercentage}%)`,
      `Visual Match Rate: ${metrics.matchPercentage}%`,
      `Generated locally at www.codepackr.com (100% Client-Side Privacy)`,
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleClearWorkspace = () => {
    setImageASrc(null);
    setImageBSrc(null);
    setImageAName(null);
    setImageBName(null);
    setMetrics(null);
    setDiffImageUrl(null);
    setSliderPos(50);
    setIsFlickering(false);
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

      {/* Control Bar */}
      <div
        className="p-5 rounded-2xl border space-y-4 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--ink)' }}>
            <GitCompare className="w-4 h-4 text-emerald-500" />
            <span>Visual Image Comparator &amp; Pixel Diff Inspector</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPresetSamples}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer text-xs"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sample UI Regression</span>
            </button>
            {(imageASrc || imageBSrc) && (
              <button
                onClick={() => {
                  setImageASrc(null);
                  setImageBSrc(null);
                  setImageAName(null);
                  setImageBName(null);
                  setMetrics(null);
                  setDiffImageUrl(null);
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

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-xl border p-0.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <button
              onClick={() => setMode('slider')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'slider' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)]'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Curtain Slider</span>
            </button>
            <button
              onClick={() => setMode('diff')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'diff' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)]'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Pixel Heatmap</span>
            </button>
            <button
              onClick={() => setMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'side-by-side' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setMode('blend')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'blend' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Onion Blend</span>
            </button>
            <button
              onClick={() => setMode('flicker')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'flicker' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Rapid Flicker</span>
            </button>
          </div>

          {/* Sub-controls based on mode */}
          <div className="flex items-center gap-4">
            {mode === 'diff' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--muted)]">Tolerance: {tolerance}%</span>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-28 accent-[var(--brand)] cursor-pointer"
                />
              </div>
            )}

            {mode === 'blend' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--muted)]">Opacity: {blendOpacity}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={blendOpacity}
                  onChange={(e) => setBlendOpacity(Number(e.target.value))}
                  className="w-28 accent-[var(--brand)] cursor-pointer"
                />
              </div>
            )}

            {mode === 'flicker' && (
              <button
                onClick={() => setIsFlickering(!isFlickering)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-white cursor-pointer"
                style={{ backgroundColor: isFlickering ? '#e11d48' : 'var(--brand)' }}
              >
                {isFlickering ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isFlickering ? 'Stop Flicker' : 'Start Flicker'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dual Dropzone */}
      {(!imageASrc || !imageBSrc) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all hover:border-[var(--brand)]"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            onClick={() => fileInputARef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputARef}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'A');
              }}
              className="hidden"
            />
            {imageASrc ? (
              <div className="space-y-2 w-full">
                <div className="h-36 rounded-xl overflow-hidden flex items-center justify-center bg-slate-900/5 p-2">
                  <img src={imageASrc} alt="Baseline" className="max-h-full max-w-full object-contain rounded" />
                </div>
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--ink)' }}>
                    {imageAName || 'Image A (Baseline)'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageASrc(null);
                      setImageAName(null);
                    }}
                    className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <Upload className="w-8 h-8 mx-auto text-[var(--brand)] opacity-80" />
                <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Upload Image A (Baseline / Before)</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Supports PNG, JPEG, WebP</p>
              </div>
            )}
          </div>

          <div
            className="p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all hover:border-[var(--brand)]"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            onClick={() => fileInputBRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputBRef}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'B');
              }}
              className="hidden"
            />
            {imageBSrc ? (
              <div className="space-y-2 w-full">
                <div className="h-36 rounded-xl overflow-hidden flex items-center justify-center bg-slate-900/5 p-2">
                  <img src={imageBSrc} alt="Candidate" className="max-h-full max-w-full object-contain rounded" />
                </div>
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--ink)' }}>
                    {imageBName || 'Image B (Candidate)'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageBSrc(null);
                      setImageBName(null);
                    }}
                    className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <Upload className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Upload Image B (Modified / After)</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Supports PNG, JPEG, WebP</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Workspace & Metrics */}
      {imageASrc && imageBSrc && metrics && (
        <div className="space-y-6">
          {/* Metrics Overview Bar */}
          <div
            className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Visual Match</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {metrics.matchPercentage}%
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Differing Pixels</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {metrics.differingPixels.toLocaleString()}{' '}
                  <span className="text-xs font-semibold text-[var(--muted)]">({metrics.diffPercentage}%)</span>
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Dimensions</span>
                <span className="font-mono font-bold" style={{ color: 'var(--ink)' }}>
                  {metrics.widthA}&times;{metrics.heightA} vs {metrics.widthB}&times;{metrics.heightB} px
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="px-3.5 py-2 rounded-xl border font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? 'Report Copied!' : 'Copy Summary'}</span>
              </button>
              {diffImageUrl && (
                <button
                  onClick={handleDownloadDiff}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Diff Mask</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Viewer Box */}
          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            {/* Mode: Split Curtain Slider */}
            {mode === 'slider' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[var(--muted)] px-1">
                  <span>&larr; Image A ({imageAName || 'Baseline'})</span>
                  <span>Drag slider or click image</span>
                  <span>Image B ({imageBName || 'Candidate'}) &rarr;</span>
                </div>

                <div
                  ref={containerRef}
                  className="relative w-full h-[480px] rounded-xl overflow-hidden border select-none cursor-ew-resize bg-slate-900/10 flex items-center justify-center"
                  style={{ borderColor: 'var(--line)' }}
                  onClick={(e) => handleSliderMove(e.clientX)}
                >
                  {/* Under layer (Image B) */}
                  <img
                    src={imageBSrc}
                    alt="Image B"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />

                  {/* Over layer clipped (Image A) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={imageASrc}
                      alt="Image A"
                      className="absolute inset-0 max-w-none h-full object-contain pointer-events-none"
                      style={{ width: containerRef.current?.clientWidth || '100%' }}
                    />
                  </div>

                  {/* Divider Line & Handle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-10 flex items-center justify-center pointer-events-auto"
                    style={{ left: `${sliderPos}%` }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl border border-slate-300 flex items-center justify-center font-bold text-xs">
                      &harr;
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode: Pixel Diff Heatmap */}
            {mode === 'diff' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-[var(--muted)] px-1">
                  <span className="flex items-center gap-1.5 font-bold text-rose-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Highlighted Differing Pixels (Red Overlay)
                  </span>
                  <span>Sensitivity Tolerance: {tolerance}%</span>
                </div>

                <div className="w-full h-[480px] rounded-xl overflow-auto border bg-slate-950 flex items-center justify-center p-2" style={{ borderColor: 'var(--line)' }}>
                  {diffImageUrl ? (
                    <img src={diffImageUrl} alt="Pixel Diff" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">Computing diff...</span>
                  )}
                </div>
              </div>
            )}

            {/* Mode: Side by Side (2-Up) */}
            {mode === 'side-by-side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold block truncate" style={{ color: 'var(--ink)' }}>
                    Image A: {imageAName || 'Baseline'} ({metrics.widthA}x{metrics.heightA} px)
                  </span>
                  <div className="h-[440px] rounded-xl overflow-hidden border bg-slate-900/10 flex items-center justify-center p-2" style={{ borderColor: 'var(--line)' }}>
                    <img src={imageASrc} alt="Image A" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold block truncate" style={{ color: 'var(--ink)' }}>
                    Image B: {imageBName || 'Candidate'} ({metrics.widthB}x{metrics.heightB} px)
                  </span>
                  <div className="h-[440px] rounded-xl overflow-hidden border bg-slate-900/10 flex items-center justify-center p-2" style={{ borderColor: 'var(--line)' }}>
                    <img src={imageBSrc} alt="Image B" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              </div>
            )}

            {/* Mode: Onion Skin Blend */}
            {mode === 'blend' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[var(--muted)] px-1">
                  <span>Image A (0%)</span>
                  <span>Blended Opacity: {blendOpacity}%</span>
                  <span>Image B (100%)</span>
                </div>

                <div className="relative w-full h-[480px] rounded-xl overflow-hidden border bg-slate-900/10 flex items-center justify-center" style={{ borderColor: 'var(--line)' }}>
                  <img src={imageASrc} alt="Image A" className="absolute inset-0 w-full h-full object-contain" />
                  <img
                    src={imageBSrc}
                    alt="Image B"
                    className="absolute inset-0 w-full h-full object-contain transition-opacity"
                    style={{ opacity: blendOpacity / 100 }}
                  />
                </div>
              </div>
            )}

            {/* Mode: Rapid Flicker */}
            {mode === 'flicker' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-[var(--muted)] px-1">
                  <span>Currently Showing: <strong className="font-bold text-[var(--brand)]">{flickerActiveA ? 'Image A' : 'Image B'}</strong></span>
                  <span>Alternating every 450ms</span>
                </div>

                <div className="relative w-full h-[480px] rounded-xl overflow-hidden border bg-slate-900/10 flex items-center justify-center" style={{ borderColor: 'var(--line)' }}>
                  <img
                    src={flickerActiveA ? imageASrc : imageBSrc}
                    alt="Flicker Image"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
