import React, { useState } from 'react';
import {
  Crosshair,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { CenteringLines, CenteringMetrics } from '../types/grading';
import { calculateCenteringMetrics } from '../utils/psaGrading';

interface CenteringToolProps {
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

  const currentLines = activeSide === 'front' ? frontLines : backLines;
  const setLines = activeSide === 'front' ? onChangeFrontLines : onChangeBackLines;
  const currentImg =
    activeSide === 'front' ? frontImageUrl : backImageUrl || frontImageUrl;

  const frontMetrics: CenteringMetrics = calculateCenteringMetrics(frontLines, 'front');
  const backMetrics: CenteringMetrics = calculateCenteringMetrics(backLines, 'back');
  const activeMetrics = activeSide === 'front' ? frontMetrics : backMetrics;

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

  return (
    <div className="space-y-5">
      {/* Side Switcher & Auto-detect bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSide('front')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSide === 'front'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            전면 센터링 (PSA 10 ≤ 55:45~60:40)
          </button>
          <button
            onClick={() => setActiveSide('back')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSide === 'back'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            후면 센터링 (PSA 10 ≤ 75:25)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAutoDetect(activeSide)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-sky-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>비전 자동 테두리 재검출</span>
          </button>
          <button
            onClick={onProceedToReport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-red-600/20 transition"
          >
            <span>최종 PSA 등급 리포트 보기</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Caliper Canvas Viewport (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            onPointerMove={handlePointerMove}
            onPointerUp={() => setActiveDragKey(null)}
            onPointerLeave={() => setActiveDragKey(null)}
            className="relative w-full max-w-[430px] aspect-[5/7] rounded-3xl overflow-hidden border-2 border-slate-700 bg-slate-950 select-none touch-none shadow-2xl"
          >
            <img
              src={currentImg}
              alt="Centering Calibration"
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Vertical Lines (Left Outer, Left Inner, Right Inner, Right Outer) */}
            {(
              [
                { key: 'leftOuter', color: 'border-amber-400', label: 'L-Out' },
                { key: 'leftInner', color: 'border-cyan-400', label: 'L-In' },
                { key: 'rightInner', color: 'border-cyan-400', label: 'R-In' },
                { key: 'rightOuter', color: 'border-amber-400', label: 'R-Out' },
              ] as const
            ).map((line) => (
              <div
                key={line.key}
                onPointerDown={() => setActiveDragKey(line.key)}
                style={{ left: `${currentLines[line.key] * 100}%` }}
                className={`absolute top-0 bottom-0 -ml-2 w-4 cursor-ew-resize flex justify-center group`}
              >
                <div
                  className={`h-full border-l-2 ${line.color} group-hover:border-white transition-colors`}
                />
                <span className="absolute top-2 rounded bg-slate-950/90 border border-slate-700 px-1 py-0.5 text-[9px] font-mono text-white pointer-events-none">
                  {line.label}
                </span>
              </div>
            ))}

            {/* Horizontal Lines (Top Outer, Top Inner, Bottom Inner, Bottom Outer) */}
            {(
              [
                { key: 'topOuter', color: 'border-amber-400', label: 'T-Out' },
                { key: 'topInner', color: 'border-cyan-400', label: 'T-In' },
                { key: 'bottomInner', color: 'border-cyan-400', label: 'B-In' },
                { key: 'bottomOuter', color: 'border-amber-400', label: 'B-Out' },
              ] as const
            ).map((line) => (
              <div
                key={line.key}
                onPointerDown={() => setActiveDragKey(line.key)}
                style={{ top: `${currentLines[line.key] * 100}%` }}
                className={`absolute left-0 right-0 -mt-2 h-4 cursor-ns-resize flex items-center group`}
              >
                <div
                  className={`w-full border-t-2 ${line.color} group-hover:border-white transition-colors`}
                />
                <span className="absolute left-2 rounded bg-slate-950/90 border border-slate-700 px-1 py-0.5 text-[9px] font-mono text-white pointer-events-none">
                  {line.label}
                </span>
              </div>
            ))}

            {/* Center HUD Badge */}
            <div className="pointer-events-none absolute bottom-3 inset-x-3 rounded-xl bg-slate-950/90 border border-slate-800 p-2.5 flex items-center justify-between text-xs backdrop-blur-md">
              <div>
                <span className="text-slate-400 mr-1.5">좌:우</span>
                <span className="font-extrabold text-cyan-300">
                  {activeMetrics.leftPercent}% : {activeMetrics.rightPercent}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 mr-1.5">상:하</span>
                <span className="font-extrabold text-amber-300">
                  {activeMetrics.topPercent}% : {activeMetrics.bottomPercent}%
                </span>
              </div>
              <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-2 py-0.5 font-bold text-red-300">
                상한 PSA {activeMetrics.psaMaxGradeAllowed}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              이미지 위의 노란선(외곽 엣지)과 하늘색선(내부 프레임)을 드래그하여 0.1% 단위로 미세 보정할 수 있습니다.
            </span>
          </p>
        </div>

        {/* Right: Live Centering Breakdown & Fine Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">
                {activeSide === 'front' ? '전면(Front)' : '후면(Back)'} 센터링 정밀 판정
              </h3>
              {activeMetrics.psaMaxGradeAllowed >= 10 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PSA 10 통과
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" /> 최대 PSA{' '}
                  {activeMetrics.psaMaxGradeAllowed}
                </span>
              )}
            </div>

            {/* Horizontal & Vertical Ratio Bars */}
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">좌 / 우 비율 (Left : Right)</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {activeMetrics.leftPercent}% : {activeMetrics.rightPercent}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${activeMetrics.leftPercent}%` }}
                    className="bg-gradient-to-r from-cyan-500 to-sky-400 h-full"
                  />
                  <div
                    style={{ width: `${activeMetrics.rightPercent}%` }}
                    className="bg-slate-700 h-full"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">상 / 하 비율 (Top : Bottom)</span>
                  <span className="font-mono font-bold text-amber-300">
                    {activeMetrics.topPercent}% : {activeMetrics.bottomPercent}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${activeMetrics.topPercent}%` }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full"
                  />
                  <div
                    style={{ width: `${activeMetrics.bottomPercent}%` }}
                    className="bg-slate-700 h-full"
                  />
                </div>
              </div>
            </div>

            {/* Official PSA Centering Reference Table */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs space-y-1.5">
              <div className="font-bold text-slate-200 mb-1">
                📏 PSA 공식 센터링 허용 기준표
              </div>
              <div className="flex justify-between text-slate-300">
                <span>PSA 10 (Gem Mint)</span>
                <span className="font-mono text-emerald-400">전면 55:45~60:40 / 후면 75:25</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>PSA 9 (Mint)</span>
                <span className="font-mono text-sky-400">전면 60:40~65:35 / 후면 90:10</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>PSA 8 (NM-MT)</span>
                <span className="font-mono text-amber-400">전면 65:35~70:30 / 후면 90:10</span>
              </div>
            </div>

            {/* Fine Calibration Sliders */}
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>내부 프레임 경계선 미세 조절</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <label className="text-slate-400 block mb-1">좌측 내부선 (L-In)</label>
                  <input
                    type="range"
                    min={currentLines.leftOuter + 0.01}
                    max={0.25}
                    step={0.001}
                    value={currentLines.leftInner}
                    onChange={(e) => updateLine('leftInner', Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">우측 내부선 (R-In)</label>
                  <input
                    type="range"
                    min={0.75}
                    max={currentLines.rightOuter - 0.01}
                    step={0.001}
                    value={currentLines.rightInner}
                    onChange={(e) => updateLine('rightInner', Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">상단 내부선 (T-In)</label>
                  <input
                    type="range"
                    min={currentLines.topOuter + 0.01}
                    max={0.22}
                    step={0.001}
                    value={currentLines.topInner}
                    onChange={(e) => updateLine('topInner', Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">하단 내부선 (B-In)</label>
                  <input
                    type="range"
                    min={0.78}
                    max={currentLines.bottomOuter - 0.01}
                    step={0.001}
                    value={currentLines.bottomInner}
                    onChange={(e) => updateLine('bottomInner', Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
