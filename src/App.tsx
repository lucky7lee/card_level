import React, { useEffect, useState } from 'react';
import { Award, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import {
  CapturedFrames,
  CenteringLines,
  CornerAnalysis,
  EdgeAnalysis,
  FinalPSAReport,
  GradingCompany,
  ScanAngleId,
  SurfaceAnalysis,
} from './types/grading';
import {
  calculateCenteringMetrics,
  computeFinalPSAReport,
} from './utils/psaGrading';
import {
  analyzeCornersAndEdges,
  analyzeSurfaceMultiAngle,
  autoDetectCenteringLines,
} from './utils/visionAnalyzer';
import { CameraScanner } from './components/CameraScanner';
import { CenteringTool } from './components/CenteringTool';
import { GradeReport } from './components/GradeReport';
import { RulesGuide } from './components/RulesGuide';

type ScreenView = 'home' | 'scan' | 'centering' | 'report' | 'rules';

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
  const [currentView, setCurrentView] = useState<ScreenView>('home');
  const [company, setCompany] = useState<GradingCompany>('PSA');

  const [activeScanStep, setActiveScanStep] = useState<ScanAngleId>('front');
  const [frames, setFrames] = useState<CapturedFrames>({});
  const [frontLines, setFrontLines] = useState<CenteringLines>(DEFAULT_LINES);
  const [backLines, setBackLines] = useState<CenteringLines>(DEFAULT_LINES);

  const [corners, setCorners] = useState<CornerAnalysis[]>([]);
  const [edges, setEdges] = useState<EdgeAnalysis[]>([]);
  const [surface, setSurface] = useState<SurfaceAnalysis | null>(null);

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

  const handleStartGrading = (targetCompany: GradingCompany) => {
    setCompany(targetCompany);
    setFrames({});
    setActiveScanStep('front');
    setCurrentView('scan');
  };

  const handleOpenRules = (targetCompany: GradingCompany) => {
    setCompany(targetCompany);
    setCurrentView('rules');
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

  const handleResetOrRescan = () => {
    setFrames({});
    setActiveScanStep('front');
    setCurrentView('scan');
  };

  const handleBackHome = () => {
    setCurrentView('home');
  };

  const frontCentering = calculateCenteringMetrics(frontLines, 'front', company);
  const backCentering = calculateCenteringMetrics(backLines, 'back', company);

  const finalReport: FinalPSAReport | null =
    frames.front && corners.length > 0 && surface
      ? computeFinalPSAReport({
          company,
          cardTitle: '포켓몬카드',
          frontCentering,
          backCentering,
          corners,
          edges,
          surface,
        })
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBackHome}
            className="flex items-center gap-2 text-left group"
          >
            <span
              className={`rounded-lg px-2 py-0.5 text-xs font-black text-white shadow transition ${
                company === 'PSA' ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {currentView === 'home' ? 'AI' : company}
            </span>
            <span className="text-base font-black tracking-tight text-white group-hover:text-red-400 transition-colors">
              PokéGrade
            </span>
          </button>

          {currentView !== 'home' && (
            <button
              onClick={handleBackHome}
              className="text-xs font-bold text-slate-400 hover:text-white rounded-lg px-2.5 py-1 bg-slate-900 border border-slate-800 transition"
            >
              메인 홈
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-4 py-6">
        {/* 1. Main Home Screen */}
        {currentView === 'home' && (
          <div className="max-w-md mx-auto w-full flex flex-col items-center space-y-6">
            {/* Title & Badge */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1 text-xs font-black text-red-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>포켓몬카드 등급 판정 시뮬레이터</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                PokéGrade AI
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                스마트폰 카메라로 포켓몬카드를 다각도에서 비추어 PSA 및 BRG 예상 등급을 정밀 예측합니다.
              </p>
            </div>

            {/* Menu Buttons Group */}
            <div className="w-full space-y-3.5 pt-2">
              {/* Menu 1: PSA 예상등급 */}
              <button
                onClick={() => handleStartGrading('PSA')}
                className="w-full group rounded-3xl border-2 border-red-600/80 bg-gradient-to-r from-red-950/70 to-slate-900 hover:from-red-900/80 hover:to-slate-800 p-5 flex items-center justify-between shadow-xl shadow-red-950/50 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-base shadow-lg shrink-0">
                    PSA
                  </div>
                  <div>
                    <div className="text-base font-black text-white group-hover:text-red-300 transition-colors">
                      PSA 예상등급
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      PSA 1~10 정수 등급 및 55:45 센터링 기준
                    </div>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-red-600/20 flex items-center justify-center text-red-400 group-hover:bg-red-600 group-hover:text-white transition-all shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>

              {/* Menu 2: BRG 예상등급 */}
              <button
                onClick={() => handleStartGrading('BRG')}
                className="w-full group rounded-3xl border-2 border-blue-600/80 bg-gradient-to-r from-blue-950/70 to-slate-900 hover:from-blue-900/80 hover:to-slate-800 p-5 flex items-center justify-between shadow-xl shadow-blue-950/50 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shrink-0">
                    BRG
                  </div>
                  <div>
                    <div className="text-base font-black text-white group-hover:text-blue-300 transition-colors">
                      BRG 예상등급
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      BRG 0.5점 단위 채점 및 골드/블랙라벨 기준
                    </div>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>

              {/* Menu 3: Same line with 2 buttons (PSA 규정 & BRG 규정) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* PSA 규정 */}
                <button
                  onClick={() => handleOpenRules('PSA')}
                  className="group rounded-2xl border border-slate-700 bg-slate-900/90 hover:bg-slate-850 hover:border-red-500/70 p-4 flex flex-col items-start justify-between shadow-md active:scale-[0.98] transition-all"
                >
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="rounded-md bg-red-600/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 text-[10px] font-black">
                      PSA
                    </span>
                    <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-white group-hover:text-red-300 transition-colors">
                      PSA 규정
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      규격 및 등급 기준표
                    </div>
                  </div>
                </button>

                {/* BRG 규정 */}
                <button
                  onClick={() => handleOpenRules('BRG')}
                  className="group rounded-2xl border border-slate-700 bg-slate-900/90 hover:bg-slate-850 hover:border-blue-500/70 p-4 flex flex-col items-start justify-between shadow-md active:scale-[0.98] transition-all"
                >
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-black">
                      BRG
                    </span>
                    <Award className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-white group-hover:text-blue-300 transition-colors">
                      BRG 규정
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      규격 및 등급 기준표
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Step 1: Camera Scanner */}
        {currentView === 'scan' && (
          <CameraScanner
            company={company}
            frames={frames}
            activeStep={activeScanStep}
            onSelectStep={setActiveScanStep}
            onCaptureFrame={handleCaptureFrame}
            onCompleteAllScans={() => setCurrentView('centering')}
          />
        )}

        {/* 3. Step 2: Centering Tool */}
        {currentView === 'centering' && frames.front && (
          <CenteringTool
            company={company}
            frontImageUrl={frames.front}
            backImageUrl={frames.back}
            frontLines={frontLines}
            backLines={backLines}
            onChangeFrontLines={setFrontLines}
            onChangeBackLines={setBackLines}
            onAutoDetect={handleAutoDetectCentering}
            onProceedToReport={() => setCurrentView('report')}
          />
        )}

        {/* 4. Step 3: Final Report */}
        {currentView === 'report' && finalReport && (
          <GradeReport
            report={finalReport}
            frames={frames}
            onResetOrRescan={handleResetOrRescan}
            onBackHome={handleBackHome}
          />
        )}

        {/* 5. Rules & Guidelines View */}
        {currentView === 'rules' && (
          <RulesGuide
            company={company}
            onBackHome={handleBackHome}
            onStartGrading={handleStartGrading}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="py-3 text-center text-[11px] text-slate-600 border-t border-slate-900">
        PokéGrade AI · PSA & BRG Multi-Angle Vision Predictor
      </footer>
    </div>
  );
}

export default App;
