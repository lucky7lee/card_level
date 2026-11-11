import React, { useState } from 'react';
import {
  Award,
  Bot,
  CheckCircle2,
  Eye,
  Flame,
  KeyRound,
  Layers,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { CapturedFrames, FinalPSAReport } from '../types/grading';

interface GradeReportProps {
  report: FinalPSAReport;
  frames: CapturedFrames;
  cardTitle: string;
  onChangeCardTitle: (title: string) => void;
  onRunAIAnalysis: (apiKey: string) => Promise<void>;
  aiLoading: boolean;
  aiError: string | null;
  onResetOrRescan: () => void;
}

export const GradeReport: React.FC<GradeReportProps> = ({
  report,
  frames,
  cardTitle,
  onChangeCardTitle,
  onRunAIAnalysis,
  aiLoading,
  aiError,
  onResetOrRescan,
}) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('pokegrade_gemini_key') || ''
  );

  const handleTriggerAI = async () => {
    if (!apiKey.trim()) {
      alert('Gemini API Key를 입력해 주세요.');
      return;
    }
    localStorage.setItem('pokegrade_gemini_key', apiKey.trim());
    await onRunAIAnalysis(apiKey.trim());
  };

  const subgradeItems = [
    {
      label: '센터링 (Centering)',
      score: report.subgrades.centering,
      detail: `전면 ${report.frontCentering.ratioTextLR} / 후면 ${report.backCentering.ratioTextLR}`,
    },
    {
      label: '코너 (Corners)',
      score: report.subgrades.corners,
      detail: '4대 모서리 백화 및 곡률 마모도',
    },
    {
      label: '엣지 (Edges)',
      score: report.subgrades.edges,
      detail: '4면 테두리 재단면 및 전면 호일 실버링',
    },
    {
      label: '표면 (Surface)',
      score: report.subgrades.surface,
      detail: report.surface.indentOrCreaseDetected
        ? '⚠️ 미세 찍힘(Indent) 감지 (최대 6등급 제한)'
        : `사선 빛반사 기스 지수 ${report.surface.scratchDensityIndex}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top PSA Slab Header Card */}
      <div className="rounded-3xl border-2 border-red-600 bg-white text-slate-900 p-4 sm:p-5 shadow-2xl shadow-red-950/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-red-600 pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-600 px-3 py-1.5 text-white font-black tracking-tighter text-lg shadow">
              PSA
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                PokéGrade Multi-Angle Vision Predictor
              </div>
              <input
                type="text"
                value={cardTitle}
                onChange={(e) => onChangeCardTitle(e.target.value)}
                className="text-base sm:text-lg font-black text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-red-600 focus:outline-none w-full sm:w-80"
                placeholder="카드 이름 입력 (예: 리자몽 ex SAR)"
              />
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-500">예상 감정 등급</div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-red-600">
                {report.gradeInfo.code}
              </div>
              <div className="text-xs font-bold text-slate-700">
                {report.gradeInfo.titleKo}
              </div>
            </div>
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${report.gradeInfo.badgeColor} flex flex-col items-center justify-center text-white shadow-lg`}
            >
              <span className="text-[10px] font-bold uppercase opacity-90">PSA</span>
              <span className="text-2xl font-black leading-none">
                {report.predictedGrade}
              </span>
            </div>
          </div>
        </div>

        {/* Barcode & Limiting Factor Summary */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>핵심 판정 근거:</strong> {report.limitingFactor}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 shrink-0">
            |||| |||| ||| ||||| · {report.timestamp}
          </div>
        </div>
      </div>

      {/* Main Grid: Left (4 Subgrades & Probabilities) / Right (Submission ROI & AI Grader) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4 Core PSA Subgrades (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>PSA 4대 핵심 요소 세부 채점표</span>
              </h3>
              <span className="text-xs text-slate-400">
                최저 항목 기준 상한 제한(Weakest-Link Cap) 적용
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subgradeItems.map((item) => {
                const isTen = item.score >= 9.5;
                const isWarn = item.score < 8.5;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-200">{item.label}</span>
                      <span
                        className={`text-sm font-black px-2 py-0.5 rounded-md ${
                          isTen
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isWarn
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {item.score.toFixed(1)} / 10
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.detail}</p>
                    <div className="mt-2.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${(item.score / 10) * 100}%` }}
                        className={`h-full rounded-full ${
                          isTen
                            ? 'bg-emerald-400'
                            : isWarn
                            ? 'bg-red-500'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grade Probability Distribution */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-200">
                📊 실제 PSA 제출 시 예상 등급 확률 분포
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                  <div className="text-[11px] text-slate-400">PSA 10</div>
                  <div className="text-base font-black text-emerald-400">
                    {report.probabilities.psa10}%
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                  <div className="text-[11px] text-slate-400">PSA 9</div>
                  <div className="text-base font-black text-sky-400">
                    {report.probabilities.psa9}%
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                  <div className="text-[11px] text-slate-400">PSA 8</div>
                  <div className="text-base font-black text-amber-400">
                    {report.probabilities.psa8}%
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                  <div className="text-[11px] text-slate-400">PSA 7 이하</div>
                  <div className="text-base font-black text-rose-400">
                    {report.probabilities.psa7OrLower}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Corners 4x Macro Inspection */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>4대 모서리(Corners) 4배율 확대 및 백화(Whitening) 검출</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                후면 파란 테두리 하얀 점 정밀 스캔
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {report.corners.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex flex-col"
                >
                  <img
                    src={c.cropDataUrl}
                    alt={c.label}
                    className="w-full aspect-square object-cover rounded-lg border border-slate-800 mb-2"
                  />
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{c.id} 코너</span>
                    <span
                      className={
                        c.estimatedGrade >= 9.5
                          ? 'text-emerald-400'
                          : c.estimatedGrade >= 8.5
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }
                    >
                      {c.estimatedGrade.toFixed(1)}점
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    백화율: {c.whiteningPercent}%
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1 line-clamp-2">
                    {c.issueNote}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Surface Glare Heatmap & AI Multimodal Grader (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Multi-Angle Surface Glare Heatmap */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <span>다각도 빛반사 표면 히트맵 (Surface Glare)</span>
              </h3>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-sky-300"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showHeatmap ? '원본 사선 사진 보기' : '결점 히트맵 보기'}</span>
              </button>
            </div>

            <div className="relative mx-auto w-full max-w-[280px] aspect-[5/7] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
              <img
                src={
                  showHeatmap
                    ? report.surface.heatmapDataUrl
                    : frames.tilt_top || frames.front
                }
                alt="Surface Reflection Heatmap"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 inset-x-2 rounded-lg bg-slate-950/90 border border-slate-800 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center justify-between">
                <span>빛반사 스캔 영역: {report.surface.glareCoveragePercent}%</span>
                <span className="font-bold text-cyan-300">
                  기스 지수 {report.surface.scratchDensityIndex}
                </span>
              </div>
            </div>

            {report.surface.defects.length > 0 ? (
              <div className="space-y-2">
                {report.surface.defects.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-red-500/40 bg-red-950/25 p-3 text-xs space-y-1"
                  >
                    <div className="font-bold text-red-300 flex items-center justify-between">
                      <span>⚠️ {d.label}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-red-500/30">
                        {d.detectedAtAngle === 'tilt_top' ? '상하 20° 검출' : '좌우 20° 검출'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {d.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  상·하·좌·우 사선 빛반사 스캔에서 치명적인 홀로그램 기스나 표면 찍힘(Indent)이 발견되지 않았습니다.
                </span>
              </div>
            )}
          </div>

          {/* Submission Recommendation Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              PSA 그레이딩 제출 가이드
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {report.submissionAdvice}
            </p>
          </div>

          {/* Optional Gemini Multimodal AI Expert Grader */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-300">
              <Bot className="w-4 h-4" />
              <span>AI 멀티모달 수석 그레이더 정밀 소견 (선택)</span>
            </div>
            <p className="text-xs text-slate-400">
              Gemini Vision API 키를 입력하면 촬영된 다각도(정면·후면·빛반사) 이미지를 AI에 직접 전송하여 카드 식별 및 수석 그레이더 총평을 추가로 생성합니다.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Gemini API Key 입력 (AIza...)"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-8 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleTriggerAI}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white shrink-0 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? '분석 중...' : 'AI 정밀 판정'}</span>
              </button>
            </div>

            {aiError && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg p-2.5">
                {aiError}
              </div>
            )}

            {report.aiExpertComment && (
              <div className="rounded-xl bg-slate-950/90 border border-indigo-500/40 p-3.5 text-xs text-slate-200 leading-relaxed space-y-1">
                <div className="font-bold text-indigo-300">
                  🤖 Gemini 멀티모달 그레이더 리포트
                </div>
                <p>{report.aiExpertComment}</p>
              </div>
            )}
          </div>

          <button
            onClick={onResetOrRescan}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3 text-xs font-bold text-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다른 포켓몬카드 스캔하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
