import React from 'react';
import { RotateCcw } from 'lucide-react';
import { CapturedFrames, FinalPSAReport } from '../types/grading';

interface GradeReportProps {
  report: FinalPSAReport;
  frames: CapturedFrames;
  onResetOrRescan: () => void;
}

export const GradeReport: React.FC<GradeReportProps> = ({
  report,
  frames,
  onResetOrRescan,
}) => {
  const subgradeItems = [
    { label: '센터링', score: report.subgrades.centering },
    { label: '코너', score: report.subgrades.corners },
    { label: '엣지', score: report.subgrades.edges },
    { label: '표면', score: report.subgrades.surface },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4">
      {/* PSA Slab Container */}
      <div className="w-full rounded-3xl border-2 border-slate-700 bg-slate-900/95 p-4 shadow-2xl space-y-4">
        {/* PSA Classic Red/White Header Label */}
        <div className="rounded-2xl border-2 border-red-600 bg-white text-slate-900 p-3.5 flex items-center justify-between shadow-md">
          <div>
            <div className="inline-block rounded bg-red-600 px-2 py-0.5 text-[10px] font-black text-white mb-1">
              PSA 예상 등급
            </div>
            <div className="text-xl font-black text-red-600 leading-tight">
              {report.gradeInfo.code}
            </div>
            <div className="text-xs font-bold text-slate-700">
              {report.gradeInfo.titleKo}
            </div>
          </div>

          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${report.gradeInfo.badgeColor} flex flex-col items-center justify-center text-white shadow-lg shrink-0`}
          >
            <span className="text-[10px] font-bold uppercase opacity-90">PSA</span>
            <span className="text-3xl font-black leading-none">
              {report.predictedGrade}
            </span>
          </div>
        </div>

        {/* Captured Front Card Image */}
        {frames.front && (
          <div className="mx-auto w-[78%] aspect-[5/7] rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
            <img
              src={frames.front}
              alt="Scanned Card"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 4 Simple Subgrade Scores */}
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

        {/* Concise Summary Note */}
        <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3 text-xs text-slate-300 text-center leading-relaxed">
          {report.limitingFactor}
        </div>
      </div>

      {/* Single Rescan Button */}
      <button
        onClick={onResetOrRescan}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 py-4 text-sm font-extrabold text-white shadow-lg shadow-red-600/30 transition"
      >
        <RotateCcw className="w-4 h-4" />
        <span>새로운 카드 다시 스캔하기</span>
      </button>
    </div>
  );
};
