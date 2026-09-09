import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Copy, Check, Trash2, SlidersHorizontal, ArrowLeftRight, Sparkles } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface ImageMergeViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const ImageMergeView: React.FC<ImageMergeViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const [image1Src, setImage1Src] = useState<string | null>(null);
  const [image2Src, setImage2Src] = useState<string | null>(null);
  const [image1Name, setImage1Name] = useState<string | null>(null);
  const [image2Name, setImage2Name] = useState<string | null>(null);

  // Configuration options
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [gap, setGap] = useState(10);
  const [padding, setPadding] = useState(15);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [alignment, setAlignment] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>('center');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);

  const [mergedResultUrl, setMergedResultUrl] = useState<string | null>(null);
  const [mergedDimensions, setMergedDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [copied, setCopied] = useState(false);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File, slot: 1 | 2) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      if (slot === 1) {
        setImage1Src(res);
        setImage1Name(file.name);
      } else {
        setImage2Src(res);
        setImage2Name(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSwap = () => {
    setImage1Src(image2Src);
    setImage2Src(image1Src);
    setImage1Name(image2Name);
    setImage2Name(image1Name);
  };

  // Canvas processing & rendering
  useEffect(() => {
    if (!image1Src && !image2Src) {
      setMergedResultUrl(null);
      setMergedDimensions({ width: 0, height: 0 });
      return;
    }

    const img1 = new Image();
    const img2 = new Image();

    let loadedCount = 0;
    const totalImages = (image1Src ? 1 : 0) + (image2Src ? 1 : 0);

    const processCanvas = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w1 = image1Src ? img1.naturalWidth || img1.width : 0;
      const h1 = image1Src ? img1.naturalHeight || img1.height : 0;
      const w2 = image2Src ? img2.naturalWidth || img2.width : 0;
      const h2 = image2Src ? img2.naturalHeight || img2.height : 0;

      let targetWidth = 0;
      let targetHeight = 0;

      if (direction === 'horizontal') {
        targetWidth = padding * 2 + w1 + (image1Src && image2Src ? gap : 0) + w2;
        targetHeight = padding * 2 + Math.max(h1, h2, 1);
      } else {
        targetWidth = padding * 2 + Math.max(w1, w2, 1);
        targetHeight = padding * 2 + h1 + (image1Src && image2Src ? gap : 0) + h2;
      }

      canvas.width = targetWidth > 0 ? targetWidth : 100;
      canvas.height = targetHeight > 0 ? targetHeight : 100;

      setMergedDimensions({ width: canvas.width, height: canvas.height });

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let x1 = padding;
      let y1 = padding;
      let x2 = padding;
      let y2 = padding;

      if (direction === 'horizontal') {
        const maxHeight = Math.max(h1, h2);
        if (alignment === 'center') {
          y1 = padding + (maxHeight - h1) / 2;
          y2 = padding + (maxHeight - h2) / 2;
        } else if (alignment === 'bottom') {
          y1 = padding + (maxHeight - h1);
          y2 = padding + (maxHeight - h2);
        }
        x2 = padding + w1 + (image1Src && image2Src ? gap : 0);
      } else {
        const maxWidth = Math.max(w1, w2);
        if (alignment === 'center') {
          x1 = padding + (maxWidth - w1) / 2;
          x2 = padding + (maxWidth - w2) / 2;
        } else if (alignment === 'right') {
          x1 = padding + (maxWidth - w1);
          x2 = padding + (maxWidth - w2);
        }
        y2 = padding + h1 + (image1Src && image2Src ? gap : 0);
      }

      if (image1Src) ctx.drawImage(img1, x1, y1, w1, h1);
      if (image2Src) ctx.drawImage(img2, x2, y2, w2, h2);

      const mime = outputFormat === 'jpeg' ? 'image/jpeg' : outputFormat === 'webp' ? 'image/webp' : 'image/png';
      const dataUrl = canvas.toDataURL(mime, quality / 100);
      setMergedResultUrl(dataUrl);
    };

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) processCanvas();
    };

    if (image1Src) {
      img1.onload = checkLoaded;
      img1.src = image1Src;
    }
    if (image2Src) {
      img2.onload = checkLoaded;
      img2.src = image2Src;
    }
  }, [image1Src, image2Src, direction, gap, padding, bgColor, alignment, outputFormat, quality]);

  const handleDownload = () => {
    if (!mergedResultUrl) return;
    const a = document.createElement('a');
    a.href = mergedResultUrl;
    const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    a.download = `combined_image_${Date.now()}.${ext}`;
    a.click();
  };

  const handleCopy = async () => {
    if (!mergedResultUrl) return;
    try {
      const res = await fetch(mergedResultUrl);
      const blob = await res.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        await navigator.clipboard.writeText(mergedResultUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(mergedResultUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard unavailable
      }
    }
  };

  const loadPresetSamples = () => {
    const c1 = document.createElement('canvas');
    c1.width = 400; c1.height = 240;
    const ctx1 = c1.getContext('2d');
    if (ctx1) {
      const grad1 = ctx1.createLinearGradient(0, 0, 400, 240);
      grad1.addColorStop(0, '#2563eb');
      grad1.addColorStop(1, '#1d4ed8');
      ctx1.fillStyle = grad1;
      ctx1.fillRect(0, 0, 400, 240);

      ctx1.fillStyle = '#ffffff';
      ctx1.font = 'bold 22px system-ui, sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('CodePackr A', 200, 110);
      ctx1.font = '14px system-ui, sans-serif';
      ctx1.fillStyle = '#93c5fd';
      ctx1.fillText('Primary Component', 200, 140);
    }
    setImage1Src(c1.toDataURL('image/png'));
    setImage1Name('sample_component_a.png');

    const c2 = document.createElement('canvas');
    c2.width = 400; c2.height = 240;
    const ctx2 = c2.getContext('2d');
    if (ctx2) {
      const grad2 = ctx2.createLinearGradient(0, 0, 400, 240);
      grad2.addColorStop(0, '#059669');
      grad2.addColorStop(1, '#047857');
      ctx2.fillStyle = grad2;
      ctx2.fillRect(0, 0, 400, 240);

      ctx2.fillStyle = '#ffffff';
      ctx2.font = 'bold 22px system-ui, sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText('CodePackr B', 200, 110);
      ctx2.font = '14px system-ui, sans-serif';
      ctx2.fillStyle = '#a7f3d0';
      ctx2.fillText('Secondary Component', 200, 140);
    }
    setImage2Src(c2.toDataURL('image/png'));
    setImage2Name('sample_component_b.png');
  };

  const handleClearWorkspace = () => {
    setImage1Src(null);
    setImage2Src(null);
    setImage1Name(null);
    setImage2Name(null);
    setMergedResultUrl(null);
    setMergedDimensions({ width: 0, height: 0 });
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
      <div className="p-4 sm:p-5 rounded-2xl border space-y-4 text-xs" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--ink)' }}>
            <SlidersHorizontal className="w-4 h-4 text-[var(--brand)]" />
            <span>Image Combination &amp; Layout Configuration</span>
          </div>
          <div className="flex items-center gap-2">
            {(image1Src || image2Src) && (
              <button
                onClick={handleSwap}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                title="Swap Image 1 and Image 2 positions"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                <span>Swap Order</span>
              </button>
            )}
            <button
              onClick={loadPresetSamples}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer text-xs"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sample Images</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-[var(--muted)]">Layout Direction</label>
            <div className="flex rounded-xl border p-0.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <button
                onClick={() => setDirection('horizontal')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  direction === 'horizontal' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setDirection('vertical')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  direction === 'vertical' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                Top / Bottom
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--muted)]">Spacing / Gap ({gap}px)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full accent-[var(--brand)] cursor-pointer mt-2"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--muted)]">Outer Padding ({padding}px)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="w-full accent-[var(--brand)] cursor-pointer mt-2"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--muted)]">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full p-2 rounded-xl border font-mono text-xs uppercase"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--muted)]">Alignment</label>
            <select
              value={alignment}
              onChange={(e) => setAlignment(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border font-medium outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <option value="center">Center Aligned</option>
              {direction === 'horizontal' ? (
                <>
                  <option value="top">Top Aligned</option>
                  <option value="bottom">Bottom Aligned</option>
                </>
              ) : (
                <>
                  <option value="left">Left Aligned</option>
                  <option value="right">Right Aligned</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[var(--muted)]">Output Format</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border font-medium outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <option value="png">PNG (Lossless)</option>
              <option value="jpeg">JPEG (Compressed)</option>
              <option value="webp">WebP (Modern)</option>
            </select>
          </div>
        </div>

        {outputFormat !== 'png' && (
          <div className="pt-2 border-t flex items-center justify-between gap-4" style={{ borderColor: 'var(--line)' }}>
            <span className="font-semibold text-[var(--muted)]">Compression Quality: {quality}%</span>
            <input
              type="range"
              min={20}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-48 accent-[var(--brand)] cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Two Upload Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="p-5 rounded-2xl border flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all hover:border-[var(--brand)]"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          onClick={() => fileInput1Ref.current?.click()}
        >
          <input
            type="file"
            ref={fileInput1Ref}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, 1);
            }}
            className="hidden"
          />
          {image1Src ? (
            <div className="space-y-2 w-full">
              <div className="h-44 rounded-xl overflow-hidden flex items-center justify-center bg-slate-900/5 p-2">
                <img src={image1Src} alt="Image 1" className="max-h-full max-w-full object-contain rounded" />
              </div>
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--ink)' }}>
                  {image1Name || 'Image 1'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImage1Src(null);
                    setImage1Name(null);
                  }}
                  className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-2">
              <Upload className="w-8 h-8 mx-auto text-[var(--brand)] opacity-80" />
              <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Click or Drag Image 1 ({direction === 'horizontal' ? 'Left' : 'Top'})</p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Supports PNG, JPEG, WebP, SVG</p>
            </div>
          )}
        </div>

        <div
          className="p-5 rounded-2xl border flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all hover:border-[var(--brand)]"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          onClick={() => fileInput2Ref.current?.click()}
        >
          <input
            type="file"
            ref={fileInput2Ref}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, 2);
            }}
            className="hidden"
          />
          {image2Src ? (
            <div className="space-y-2 w-full">
              <div className="h-44 rounded-xl overflow-hidden flex items-center justify-center bg-slate-900/5 p-2">
                <img src={image2Src} alt="Image 2" className="max-h-full max-w-full object-contain rounded" />
              </div>
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--ink)' }}>
                  {image2Name || 'Image 2'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImage2Src(null);
                    setImage2Name(null);
                  }}
                  className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-2">
              <Upload className="w-8 h-8 mx-auto text-[var(--brand)] opacity-80" />
              <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Click or Drag Image 2 ({direction === 'horizontal' ? 'Right' : 'Bottom'})</p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Supports PNG, JPEG, WebP, SVG</p>
            </div>
          )}
        </div>
      </div>

      {/* Merged Result Section */}
      {mergedResultUrl && (
        <div
          className="p-6 rounded-2xl border space-y-4 shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Combined Merged Image Preview</span>
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Output Canvas: <strong className="font-mono text-[var(--ink)]">{mergedDimensions.width} &times; {mergedDimensions.height} px</strong> · Format: <strong className="font-mono uppercase text-[var(--ink)]">{outputFormat}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Image!' : 'Copy to Clipboard'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                <Download className="w-4 h-4" />
                <span>Download Combined Image</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border flex items-center justify-center bg-slate-900/10 min-h-[220px] max-h-[500px] overflow-auto" style={{ borderColor: 'var(--line)' }}>
            <img src={mergedResultUrl} alt="Merged Result" className="max-h-[460px] max-w-full object-contain shadow-md rounded" />
          </div>
        </div>
      )}
    </div>
  );
};
