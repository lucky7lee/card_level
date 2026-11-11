import React, { useState } from 'react';
import { ChevronRight, RotateCcw, Ruler, CheckCircle2 } from 'lucide-react';
import { CenteringLines, CenteringMetrics, GradingCompany } from '../types/grading';
import { calculateCenteringMetrics } from '../utils/psaGrading';

interface CenteringToolProps {
  company: GradingCompany;
  frontImageUrl: string;
  backImageUrl?: string;
  frontLines: CenteringLines;
  backLines: CenteringLines;
  onChangeFrontLines: (lines: CenteringLines) => void;
  onChangeBackLines: (lines: CenteringLines) => void;
  onAutoDetect: (side: 'front' | 'back') => void;
  onProceedToReport: () => void;
}

export const CenteringTool: React.FC<CenteringToolProps> = ({
  company,
  frontImageUrl,
  backImageUrl,
  frontLines,
  backLines,
  onChangeFrontLines,
  onChangeBackLines,
  onAutoDetect,
  onProceedToReport,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [activeDragKey, setActiveDragKey] = useState<keyof CenteringLines | null>(null);

  const isPSA = company === 'PSA';

  const currentLines = activeSide === 'front' ? frontLines : backLines;
  const setLines = activeSide === 'front' ? onChangeFrontLines : onChangeBackLines;
  const currentImg =
    activeSide === 'front' ? frontImageUrl : backImageUrl || frontImageUrl;

  const activeMetrics: CenteringMetrics = calculateCenteringMetrics(
    currentLines,
    activeSide,
    company
  );

  const updateLine = (key: keyof CenteringLines, value: number) => {
    const clamped = Math.max(0.01, Math.min(0.99, Number(value.toFixed(4))));
    setLines({
      ...currentLines,
      [key]: clamped,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragKey) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    if (
      activeDragKey === 'leftOuter' ||
      activeDragKey === 'leftInner' ||
      activeDragKey === 'rightInner' ||
      activeDragKey === 'rightOuter'
    ) {
      updateLine(activeDragKey, normX);
    } else {
      updateLine(activeDragKey, normY);
    }
  };

  const handleNext = () => {
    if (activeSide === 'front' && backImageUrl) {
      setActiveSide('back');
    } else {
      onProceedToReport();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Title & Instructions */}
      <div className="w-full text-center mb-3 space-y-1">
        <div
          className={`text-xs font-black tracking-wide ${
            isPSA ? 'text-red-400' : 'text-blue-400'
          }`}
        >
          {company} {activeSide === 'front' ? '2-1 / 2 · 앞면 센터링 분석' : '2-2 / 2 · 뒷면 센터링 분석'}
        </div>
        <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center justify-center gap-1.5">
          <span>
            {activeSide === 'front'
              ? '원근 보정 및 테두리 두께 자동 측정 완료'
              : '뒷면 원근 보정 및 테두리 두께 자동 측정 완료'}
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </h2>
        <p className="text-xs text-slate-400">
          배경이 분리되어 정확한 카드 테두리(mm 및 비율)가 자동 산출되었습니다.
        </p>
      </div>

      {/* Card Viewport */}
      <div
        onPointerMove={handlePointerMove}
        onPointerUp={() => setActiveDragKey(null)}
        onPointerLeave={() => setActiveDragKey(null)}
        className="relative w-full aspect-[5/7] rounded-3xl overflow-hidden border-2 border-slate-700 bg-slate-950 select-none touch-none shadow-2xl"
      >
        <img
          src={currentImg}
          alt="Rectified Card Calibration"
          className="w-full h-full object-cover pointer-events-none"
        />

        {/* Vertical Lines (L-Out, L-In, R-In, R-Out) */}
        {(
          [
            { key: 'leftOuter', color: 'border-amber-400', label: '외곽' },
            { key: 'leftInner', color: 'border-cyan-400', label: '내부' },
            { key: 'rightInner', color: 'border-cyan-400', label: '내부' },
            { key: 'rightOuter', color: 'border-amber-400', label: '외곽' },
          ] as const
        ).map((line) => (
          <div
            key={line.key}
            onPointerDown={() => setActiveDragKey(line.key)}
            style={{ left: `${currentLines[line.key] * 100}%` }}
            className="absolute top-0 bottom-0 -ml-3 w-6 cursor-ew-resize flex justify-center group"
          >
            <div className={`h-full border-l-2 ${line.color} group-hover:border-white`} />
          </div>
        ))}

        {/* Horizontal Lines (T-Out, T-In, B-In, B-Out) */}
        {(
          [
            { key: 'topOuter', color: 'border-amber-400' },
            { key: 'topInner', color: 'border-cyan-400' },
            { key: 'bottomInner', color: 'border-cyan-400' },
            { key: 'bottomOuter', color: 'border-amber-400' },
          ] as const
        ).map((line) => (
          <div
            key={line.key}
            onPointerDown={() => setActiveDragKey(line.key)}
            style={{ top: `${currentLines[line.key] * 100}%` }}
            className="absolute left-0 right-0 -mt-3 h-6 cursor-ns-resize flex items-center group"
          >
            <div className={`w-full border-t-2 ${line.color} group-hover:border-white`} />
          </div>
        ))}

        {/* Auto Redetect Button */}
        <button
          onClick={() => onAutoDetect(activeSide)}
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-200 backdrop-blur-md active:scale-95 transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>자동 재분석</span>
        </button>

        {/* Real-time Thickness HUD Inside Card */}
        <div className="pointer-events-none absolute bottom-3 inset-x-3 rounded-2xl bg-slate-950/90 border border-slate-800 p-3 space-y-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-300">
              <Ruler className="w-3.5 h-3.5 text-cyan-400" />
              <span>좌우 두께:</span>
              <strong className="text-white font-mono">
                {activeMetrics.leftWidthMm}mm : {activeMetrics.rightWidthMm}mm
              </strong>
            </div>
            <div className="font-extrabold text-cyan-300 font-mono">
              {activeMetrics.ratioTextLR}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-1">
            <div className="flex items-center gap-1 text-slate-300">
              <Ruler className="w-3.5 h-3.5 text-amber-400" />
              <span>상하 두께:</span>
              <strong className="text-white font-mono">
                {activeMetrics.topWidthMm}mm : {activeMetrics.bottomWidthMm}mm
              </strong>
            </div>
            <div className="font-extrabold text-amber-300 font-mono">
              {activeMetrics.ratioTextTB}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={handleNext}
        className={`mt-4 w-full flex items-center justify-center gap-2 rounded-2xl py-4 px-5 text-sm font-extrabold text-white shadow-lg active:scale-[0.98] transition ${
          isPSA
            ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
        }`}
      >
        <span>
          {activeSide === 'front' && backImageUrl
            ? '다음: 뒷면 테두리 확인'
            : `최종 ${company} 등급 결과 보기`}
        </span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
