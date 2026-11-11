import React, { useEffect, useState } from 'react';
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
} from './utils/psaGrading';
import {
  analyzeCornersAndEdges,
  analyzeSurfaceMultiAngle,
  autoDetectCenteringLines,
} from './utils/visionAnalyzer';
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

  const handleReset = () => {
    setFrames({});
    setActiveScanStep('front');
    setActiveTab('scan');
  };

  const frontCentering = calculateCenteringMetrics(frontLines, 'front');
  const backCentering = calculateCenteringMetrics(backLines, 'back');

  const finalReport: FinalPSAReport | null =
    frames.front && corners.length > 0 && surface
      ? computeFinalPSAReport({
          cardTitle: '포켓몬카드',
          frontCentering,
          backCentering,
          corners,
          edges,
          surface,
        })
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Minimal Step Indicator Bar */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-red-600 px-2 py-0.5 text-xs font-black text-white">
              PSA
            </span>
            <span className="text-sm font-extrabold text-white">PokéGrade</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span
              className={
                activeTab === 'scan' ? 'text-red-400' : 'text-slate-600'
              }
            >
              1.스캔
            </span>
            <span className="text-slate-700">›</span>
            <span
              className={
                activeTab === 'centering' ? 'text-red-400' : 'text-slate-600'
              }
            >
              2.센터링
            </span>
            <span className="text-slate-700">›</span>
            <span
              className={
                activeTab === 'report' ? 'text-red-400' : 'text-slate-600'
              }
            >
              3.등급결과
            </span>
          </div>
        </div>
      </header>

      {/* Single Focused Step Screen */}
      <main className="flex-1 flex flex-col justify-center px-4 py-4">
        {activeTab === 'scan' && (
          <CameraScanner
            frames={frames}
            activeStep={activeScanStep}
            onSelectStep={setActiveScanStep}
            onCaptureFrame={handleCaptureFrame}
            onCompleteAllScans={() => setActiveTab('centering')}
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
            onResetOrRescan={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
