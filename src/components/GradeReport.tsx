import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Home,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { CapturedFrames, FinalPSAReport } from '../types/grading';

interface GradeReportProps {
  report: FinalPSAReport;
  frames: CapturedFrames;
  onResetOrRescan: () => void;
  onBackHome: () => void;
}

export const GradeReport: React.FC<GradeReportProps> = ({
  report,
  frames,
  onResetOrRescan,
  onBackHome,
}) => {
  const isPSA = report.company === 'PSA';

  const subgradeItems = [
    { label: '센터링', score: report.subgrades.centering },
    { label: '코너', score: report.subgrades.corners },
    { label: '엣지', score: report.subgrades.edges },
    { label: '표면', score: report.subgrades.surface },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 pb-8">
      {/* Slab Container */}
      <div className="w-full rounded-3xl border-2 border-slate-700 bg-slate-900/95 p-4 shadow-2xl space-y-4">
        {/* Slab Header Label */}
        <div
          className={`rounded-2xl border-2 p-3.5 flex items-center justify-between shadow-md ${
            isPSA
              ? 'border-red-600 bg-white text-slate-900'
              : 'border-blue-500 bg-slate-950 text-white'
          }`}
        >
          <div>
            <div
              className={`inline-block rounded px-2 py-0.5 text-[10px] font-black text-white mb-1 ${
                isPSA ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {report.company} 예상 등급
            </div>
            <div
              className={`text-xl font-black leading-tight ${
                isPSA ? 'text-red-600' : 'text-amber-400'
              }`}
            >
              {report.gradeInfo.code}
            </div>
            <div
              className={`text-xs font-bold ${
                isPSA ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              {report.gradeInfo.titleKo}
            </div>
          </div>

          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${report.gradeInfo.badgeColor} flex flex-col items-center justify-center text-white shadow-lg shrink-0`}
          >
            <span className="text-[10px] font-bold uppercase opacity-90">
              {report.company}
            </span>
            <span className="text-2xl font-black leading-none">
              {report.predictedGrade}
            </span>
          </div>
        </div>

        {/* Rectified Card Image (Clean background-free flattened preview) */}
        {frames.front && (
          <div className="mx-auto w-[76%] aspect-[5/7] rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
            <img
              src={frames.front}
              alt="Scanned Card"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 4 Core Subgrade Scores */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {subgradeItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-slate-950 border border-slate-800 p-2.5"
            >
              <div className="text-[11px] text-slate-400 font-semibold">
                {item.label}
              </div>
              <div className="text-base font-black text-white mt-0.5">
                {item.score.toFixed(1)}
              </div>
            </div>
          ))}
        </div>

        {/* Physical Defects Inspection Grid (앞·뒷면 스크래치, 찍힘, 구겨짐) */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-2.5">
          <div className="text-xs font-extrabold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>앞·뒷면 물리적 결함 정밀 분석 결과</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              다각도 비전 판독
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* 1. 구겨짐 / 주름 */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col justify-between ${
                report.creaseDetected
                  ? 'border-red-500/50 bg-red-950/20 text-red-300'
                  : 'border-slate-800/80 bg-slate-900/60 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">구겨짐/주름</span>
                {report.creaseDetected ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-[11px] mt-1 text-slate-400">
                {report.creaseDetected ? '⚠️ 주름 검출 (최대 5제한)' : '무결점 (없음)'}
              </div>
            </div>

            {/* 2. 미세 찍힘 / 눌림 */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col justify-between ${
                report.indentDetected
                  ? 'border-amber-500/50 bg-amber-950/20 text-amber-300'
                  : 'border-slate-800/80 bg-slate-900/60 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">미세 찍힘/눌림</span>
                {report.indentDetected ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-[11px] mt-1 text-slate-400">
                {report.indentDetected ? '⚠️ 찍힘 검출 (최대 6제한)' : '무결점 (없음)'}
              </div>
            </div>

            {/* 3. 홀로 / 표면 스크래치 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 flex flex-col justify-between text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold">표면 스크래치</span>
                {report.surface.scratchDensityIndex > 25 ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-[11px] mt-1 text-slate-400">
                {report.surface.scratchDensityIndex > 25 ? '미세 기스 관찰' : '무결점 (광택 양호)'}
              </div>
            </div>

            {/* 4. 후면 코너 백화 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 flex flex-col justify-between text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold">후면 코너 백화</span>
                {report.subgrades.corners < 9.0 ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-[11px] mt-1 text-slate-400">
                {report.subgrades.corners >= 9.5 ? '백화 없음 (Pristine)' : '미세 점 관찰'}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Defect Notes if any */}
        {report.surface.defects.length > 0 && (
          <div className="space-y-1.5">
            {report.surface.defects.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-red-500/30 bg-red-950/20 p-2.5 text-xs text-slate-300 flex items-start gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-300">{d.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {d.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Limiting Factor */}
        <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3 text-xs text-slate-300 text-center leading-relaxed">
          {report.limitingFactor}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          onClick={onBackHome}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-850 py-4 text-xs font-extrabold text-slate-200 transition"
        >
          <Home className="w-4 h-4" />
          <span>메인 화면</span>
        </button>
        <button
          onClick={onResetOrRescan}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl py-4 text-xs font-extrabold text-white shadow-lg transition ${
            isPSA
              ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>다시 스캔하기</span>
        </button>
      </div>
    </div>
  );
};
