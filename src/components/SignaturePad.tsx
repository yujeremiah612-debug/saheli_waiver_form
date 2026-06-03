import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSave: (base64Image: string) => void;
  onClear: () => void;
  savedSignature?: string;
}

export default function SignaturePad({ onSave, onClear, savedSignature }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = window.devicePixelRatio || 1;
      const width = parent.clientWidth;
      const height = parent.clientHeight || 200;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#171717'; // Rich dark onyx color for the signature

      // If there was previous signature, we don't redraw unless we make a full state storage.
      // But typically, resizing clears the canvas, so drawing needs to be saved or labeled.
      clearCanvasOnly();
    };

    const resizeObserver = new ResizeObserver(() => {
      // Small delay or normal resize
      resizeCanvas();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.releasePointerCapture(e.pointerId);
    setIsDrawing(false);

    // Save the signature representation to the parent
    const base64 = canvas.toDataURL('image/png');
    onSave(base64);
  };

  const clearCanvasOnly = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClear = () => {
    clearCanvasOnly();
    setHasSigned(false);
    onClear();
  };

  return (
    <div id="signature-section" className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline border-b border-[#C5A059]/40 pb-2 mb-2">
        <span className="label-caps">
          07. Digital Authorization Signature
        </span>
        <button
          type="button"
          id="btn-clear-signature"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-[9px] text-[#C5A059] hover:text-stone-900 font-bold uppercase tracking-widest transition-colors py-1 px-2 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Clear Pad
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[180px] bg-[#FCFAF7] border border-neutral-200/80 overflow-hidden touch-none"
        style={{ cursor: 'crosshair' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="block w-full h-full"
        />

        {/* Dynamic Stylized Background Help Indicator */}
        {!hasSigned && !savedSignature && (
          <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none select-none p-4 text-center">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
              Establish Signature
            </span>
            <div className="w-48 h-[1px] bg-neutral-200/80 mt-6 relative">
              <span className="absolute -top-3 left-0 text-[8px] uppercase text-[#C5A059] font-bold bg-[#FCFAF7] px-1.5 tracking-widest">
                X (Sign on line)
              </span>
            </div>
          </div>
        )}

        {/* If loaded from previous / preview state */}
        {savedSignature && !hasSigned && (
          <div className="absolute inset-0 bg-[#FCFAF7] flex justify-center items-center p-4">
            <div className="flex flex-col items-center gap-2">
              <img
                src={savedSignature}
                alt="Captured waiver signature"
                className="max-h-24 object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
              <span className="text-[9px] text-[#C5A059] font-bold uppercase tracking-widest">
                Signature captured successfully
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
