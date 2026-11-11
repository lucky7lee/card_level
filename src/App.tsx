import React, { useEffect, useState } from 'react';
import { Camera, Crosshair, Award, ShieldCheck, Info } from 'lucide-react';
import {
  CapturedFrames,
  CenteringLines,
  CornerAnalysis,
  EdgeAnalysis,
  FinalPSAReport,
  ScanAngleId,
  SurfaceAnalysis,
} from './types/grading';
import {
  calculateCenteringMetrics,
  computeFinalPSAReport,
  PSA_GRADE_TABLE,
} from './utils/psaGrading';
import {
  analyzeCornersAndEdges,
  analyzeSurfaceMultiAngle,
  autoDetectCenteringLines,
  DemoPresetId,
  generateDemoPresetFrames,
} from './utils/visionAnalyzer';
import { runGeminiMultiAngleAnalysis } from './utils/aiVisionService';
import { CameraScanner } from './components/CameraScanner';
import { CenteringTool } from './components/CenteringTool';
import { GradeReport } from './components/GradeReport';

type ActiveTab = 'scan' | 'centering' | 'report';

const DEFAULT_LINES: CenteringLines = {
  leftOuter: 0.06,
  leftInner: 0.11,
  rightInner: 0.89,
  rightOuter: 0.94,
  topOuter: 0.055,
  topInner: 0.092,
  bottomInner: 0.908,
  bottomOuter: 0.945,
};

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan');
  const [activeScanStep, setActiveScanStep] = useState<ScanAngleId>('front');
  const [cardTitle, setCardTitle] = useState<string>('리자몽 ex SAR (SV2a 201/165)');
  const [frames, setFrames] = useState<CapturedFrames>({});
  const [frontLines, setFrontLines] = useState<CenteringLines>(DEFAULT_LINES);
  const [backLines, setBackLines] = useState<CenteringLines>(DEFAULT_LINES);

  const [corners, setCorners] = useState<CornerAnalysis[]>([]);
  const [edges, setEdges] = useState<EdgeAnalysis[]>([]);
  const [surface, setSurface] = useState<SurfaceAnalysis | null>(null);
  const [aiComment, setAiComment] = useState<string | undefined>(undefined);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  // Load initial PSA 10 Demo Preset on first mount so user sees a working showcase immediately
  useEffect(() => {
    handleLoadDemoPreset('psa10_gem');
  }, []);

  // Re-run corner, edge, and multi-angle surface vision analysis whenever frames change
  useEffect(() => {
    if (!frames.front) return;
    let cancelled = false;

    (async () => {
      const ceResult = await analyzeCornersAndEdges(frames.front!, frames.back);
      const surfResult = await analyzeSurfaceMultiAngle(
        frames.front!,
        frames.tilt_top,
        frames.tilt_side
      );
      if (!cancelled) {
        setCorners(ceResult.corners);
        setEdges(ceResult.edges);
        setSurface(surfResult);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [frames]);

  const handleLoadDemoPreset = (presetId: DemoPresetId) => {
    const preset = generateDemoPresetFrames(presetId);
    setCardTitle(preset.meta.cardTitle);
    setFrames(preset.frames);
    setFrontLines(preset.centeringFront);
    setBackLines(preset.centeringBack);
    setAiComment(undefined);
    setAiError(null);
  };

  const handleCaptureFrame = async (step: ScanAngleId, dataUrl: string) => {
    setFrames((prev) => ({ ...prev, [step]: dataUrl }));
    if (step === 'front') {
      const detected = await autoDetectCenteringLines(dataUrl);
      setFrontLines(detected);
    } else if (step === 'back') {
      const detected = await autoDetectCenteringLines(dataUrl);
      setBackLines(detected);
    }
  };

  const handleAutoDetectCentering = async (side: 'front' | 'back') => {
    const url = side === 'front' ? frames.front : frames.back || frames.front;
    if (!url) return;
    const detected = await autoDetectCenteringLines(url);
    if (side === 'front') {
      setFrontLines(detected);
    } else {
      setBackLines(detected);
    }
  };

  const frontCentering = calculateCenteringMetrics(frontLines, 'front');
  const backCentering = calculateCenteringMetrics(backLines, 'back');

  const finalReport: FinalPSAReport | null =
    frames.front && corners.length > 0 && surface
      ? computeFinalPSAReport({
          cardTitle,
          frontCentering,
          backCentering,
          corners,
          edges,
          surface,
          aiExpertComment: aiComment,
        })
      : null;

  const handleRunAIAnalysis = async (apiKey: string) => {
    if (!finalReport) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await runGeminiMultiAngleAnalysis(apiKey, frames, finalReport);
      if (res.cardNameDetected) {
        setCardTitle(res.cardNameDetected);
      }
      setAiComment(res.expertSummary);
    } catch (err: unknown) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'AI 분석 중 오류가 발생했습니다. API 키를 확인해 주세요.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-red-600/30">
              PSA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  PokéGrade AI
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-300">
                  <ShieldCheck className="w-3 h-3" /> 다각도 PSA 등급 예측기
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                스마트폰 다각도 빛반사 스캔 · 센터링 캘리퍼 · 코너 백화 비전 판독
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCriteriaModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>PSA 등급 기준표</span>
          </button>
        </div>

        {/* Navigation Step Bar */}
        <div className="max-w-6xl mx-auto px-4 pb-2.5 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-extrabold transition ${
              activeTab === 'scan'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>1. 다각도 카메라 스캔</span>
          </button>

          <button
            onClick={() => setActiveTab('centering')}
            disabled={!frames.front}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-extrabold transition disabled:opacity-40 ${
              activeTab === 'centering'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>2. 센터링 캘리퍼 측정</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            disabled={!finalReport}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-extrabold transition disabled:opacity-40 ${
              activeTab === 'report'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>
              3. 예상 등급 리포트{' '}
              {finalReport ? `(PSA ${finalReport.predictedGrade})` : ''}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {activeTab === 'scan' && (
          <CameraScanner
            frames={frames}
            activeStep={activeScanStep}
            onSelectStep={setActiveScanStep}
            onCaptureFrame={handleCaptureFrame}
            onLoadDemoPreset={(presetId) => {
              handleLoadDemoPreset(presetId);
              setActiveTab('report');
            }}
            onProceedToCentering={() => setActiveTab('centering')}
          />
        )}

        {activeTab === 'centering' && frames.front && (
          <CenteringTool
            frontImageUrl={frames.front}
            backImageUrl={frames.back}
            frontLines={frontLines}
            backLines={backLines}
            onChangeFrontLines={setFrontLines}
            onChangeBackLines={setBackLines}
            onAutoDetect={handleAutoDetectCentering}
            onProceedToReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'report' && finalReport && (
          <GradeReport
            report={finalReport}
            frames={frames}
            cardTitle={cardTitle}
            onChangeCardTitle={setCardTitle}
            onRunAIAnalysis={handleRunAIAnalysis}
            aiLoading={aiLoading}
            aiError={aiError}
            onResetOrRescan={() => setActiveTab('scan')}
          />
        )}
      </main>

      {/* Official PSA Grading Criteria Reference Modal */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-white">
                PSA 포켓몬카드 공식 감정 기준 요약 (PSA 10 ~ 5)
              </h2>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                닫기
              </button>
            </div>

            <div className="space-y-3">
              {Object.values(PSA_GRADE_TABLE)
                .sort((a, b) => b.grade - a.grade)
                .map((g) => (
                  <div
                    key={g.grade}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-red-400">
                        {g.code} — {g.titleKo}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        전면 {g.frontCenteringRule} / 후면 {g.backCenteringRule}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {g.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
