import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Compass,
  Flashlight,
  ImagePlus,
  RefreshCw,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { CapturedFrames, ScanAngleId } from '../types/grading';
import { SCAN_STEPS } from '../utils/psaGrading';
import { DEMO_PRESETS, DemoPresetId } from '../utils/visionAnalyzer';

interface CameraScannerProps {
  frames: CapturedFrames;
  activeStep: ScanAngleId;
  onSelectStep: (step: ScanAngleId) => void;
  onCaptureFrame: (step: ScanAngleId, dataUrl: string) => void;
  onLoadDemoPreset: (presetId: DemoPresetId) => void;
  onProceedToCentering: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  frames,
  activeStep,
  onSelectStep,
  onCaptureFrame,
  onLoadDemoPreset,
  onProceedToCentering,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [pitch, setPitch] = useState<number>(0); // front/back tilt (beta)
  const [roll, setRoll] = useState<number>(0);  // left/right tilt (gamma)
  const [hasGyro, setHasGyro] = useState(false);

  const currentMeta = SCAN_STEPS.find((s) => s.id === activeStep) || SCAN_STEPS[0];

  // Check if current tilt angle matches the recommended range for the active step
  const isAngleOptimal =
    pitch >= currentMeta.recommendedPitch[0] &&
    pitch <= currentMeta.recommendedPitch[1] &&
    roll >= currentMeta.recommendedRoll[0] &&
    roll <= currentMeta.recommendedRoll[1];

  useEffect(() => {
    // Set default simulated angle when switching steps if no hardware gyroscope is firing
    if (!hasGyro) {
      if (activeStep === 'front' || activeStep === 'back') {
        setPitch(0);
        setRoll(0);
      } else if (activeStep === 'tilt_top') {
        setPitch(20);
        setRoll(0);
      } else if (activeStep === 'tilt_side') {
        setPitch(0);
        setRoll(20);
      }
    }
  }, [activeStep, hasGyro]);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        setHasGyro(true);
        setPitch(Math.round(e.beta));
        setRoll(Math.round(e.gamma));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const startCamera = async (preferredMode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Request iOS 13+ DeviceOrientation permission without blocking getUserMedia
    try {
      const DevOrient = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DevOrient.requestPermission === 'function') {
        DevOrient.requestPermission().catch(() => {});
      }
    } catch {
      // Ignore if not iOS
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // Fallback for devices/webcams that reject resolution or facingMode constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCameraError(
        '카메라 권한을 사용할 수 없거나 연결된 카메라가 없습니다. 아래 [사진 업로드] 또는 [샘플 카드로 즉시 테스트]를 이용해 보세요.'
      );
      setCameraActive(false);
      void err;
    }
  };

  // Ensure stream is attached if videoRef updates after cameraActive becomes true
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  const switchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({
        // @ts-expect-error torch is supported on mobile browsers
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      alert('이 기기/브라우저에서는 카메라 플래시(Torch) 제어를 지원하지 않습니다.');
    }
  };

  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = 600;
    const h = 840;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center-crop to 600x840 (5:7 Pokémon card aspect ratio)
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const targetRatio = w / h;
    const videoRatio = vw / vh;

    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;

    if (videoRatio > targetRatio) {
      sw = vh * targetRatio;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / targetRatio;
      sy = (vh - sh) / 2;
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCaptureFrame(activeStep, dataUrl);

    // Automatically advance to next uncaptured step
    const currentIndex = SCAN_STEPS.findIndex((s) => s.id === activeStep);
    if (currentIndex < SCAN_STEPS.length - 1) {
      onSelectStep(SCAN_STEPS[currentIndex + 1].id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCaptureFrame(activeStep, reader.result);
        const currentIndex = SCAN_STEPS.findIndex((s) => s.id === activeStep);
        if (currentIndex < SCAN_STEPS.length - 1) {
          onSelectStep(SCAN_STEPS[currentIndex + 1].id);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const capturedCount = Object.values(frames).filter(Boolean).length;
  const activeFrameUrl = frames[activeStep];

  return (
    <div className="space-y-5">
      {/* Demo Quick Presets Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>원클릭 다각도 시뮬레이션 샘플 (실물 카드 없이 즉시 테스트)</span>
          </div>
          <span className="text-[11px] text-slate-400">4개 각도 자동 로드</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onLoadDemoPreset(preset.id)}
              className="group text-left rounded-xl border border-slate-800 bg-slate-950/80 hover:border-red-500/60 hover:bg-slate-900 p-3 transition-all"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  {preset.name}
                </span>
                <span className="shrink-0 rounded-md bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                  {preset.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{preset.summary}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 4-Step Angle Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SCAN_STEPS.map((step) => {
          const isSelected = step.id === activeStep;
          const isDone = Boolean(frames[step.id]);
          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-red-500 bg-red-950/30 shadow-md shadow-red-950/40'
                  : isDone
                  ? 'border-emerald-500/40 bg-emerald-950/15 hover:bg-slate-900'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-bold text-slate-400">
                  STEP {step.stepNumber}
                </span>
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 완료
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">미촬영</span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-100">{step.title.split('. ')[1]}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {step.targetAngleLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Camera & Multi-Angle Guide Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Viewport (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-[420px] aspect-[5/7] rounded-3xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl">
            {/* Always-mounted Video Element so ref is ready immediately on permission grant */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cameraActive ? 'w-full h-full object-cover' : 'hidden'}
            />

            {/* Captured Frame or Placeholder when Camera is Off */}
            {!cameraActive &&
              (activeFrameUrl ? (
                <img
                  src={activeFrameUrl}
                  alt={currentMeta.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-slate-950">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{currentMeta.title}</h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-5">{currentMeta.subtitle}</p>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    <button
                      onClick={() => startCamera()}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition"
                    >
                      <Camera className="w-4 h-4" />
                      스마트폰 카메라 켜기
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition"
                    >
                      <ImagePlus className="w-4 h-4" />
                      사진 파일 선택
                    </button>
                  </div>
                </div>
              ))}

            {/* Pokémon Card 63x88mm Overlay Guide Frame */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className={`relative w-[88%] h-[89%] rounded-2xl border-2 transition-colors duration-300 ${
                  isAngleOptimal
                    ? 'border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.25)]'
                    : 'border-amber-400/80'
                }`}
              >
                {/* Inner Centering Border Reference Box */}
                <div className="absolute inset-[5.5%] rounded-lg border border-dashed border-sky-400/60" />

                {/* 4 Corner Precision Reticles */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />

                {/* Simulated Light Glare Sweep Guide for Step 3 & Step 4 */}
                {(activeStep === 'tilt_top' || activeStep === 'tilt_side') && (
                  <div
                    className={`absolute inset-0 rounded-2xl ${
                      activeStep === 'tilt_top'
                        ? 'bg-gradient-to-b from-transparent via-sky-300/20 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-amber-300/20 to-transparent'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* Top HUD: Angle / Gyroscope Indicator */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-md border ${
                  isAngleOptimal
                    ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-950/85 border-amber-500/50 text-amber-300'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>
                  기울기 상하 {pitch}° / 좌우 {roll}°{' '}
                  {isAngleOptimal ? '(적정 각도 OK)' : '(각도 조절 필요)'}
                </span>
              </div>

              {cameraActive && (
                <div className="pointer-events-auto flex items-center gap-1.5">
                  <button
                    onClick={switchCameraFacing}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md border bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800"
                  >
                    <RefreshCw className="w-3 h-3" />
                    전환
                  </button>
                  <button
                    onClick={toggleTorch}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md border ${
                      torchOn
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-900/80 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    조명
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Camera Action Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md"
              >
                <ImagePlus className="w-4 h-4 text-sky-400" />
                <span>사진 업로드</span>
              </button>

              {cameraActive ? (
                <button
                  onClick={captureFromVideo}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-500 border-2 border-white px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-red-600/50 active:scale-95 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>현재 각도 캡처</span>
                </button>
              ) : (
                <button
                  onClick={() => startCamera()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>카메라 연결</span>
                </button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {cameraError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200 max-w-[420px]">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Right: Multi-Angle Inspection Guide & Captured Thumbnails (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-300">
              <span>{currentMeta.targetAngleLabel}</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">{currentMeta.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{currentMeta.subtitle}</p>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 space-y-2">
              <div className="text-xs font-bold text-sky-400">
                🔍 이 각도에서 측정하는 PSA 핵심 기준
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {currentMeta.inspectionPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Angle Simulation Slider for Desktop testing */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>각도 센서 시뮬레이터 (PC/수동 테스트용)</span>
                <span className="font-mono text-slate-200">
                  Pitch {pitch}° / Roll {roll}°
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    상하 기울기 (Pitch)
                  </label>
                  <input
                    type="range"
                    min={-30}
                    max={40}
                    value={pitch}
                    onChange={(e) => setPitch(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    좌우 기울기 (Roll)
                  </label>
                  <input
                    type="range"
                    min={-30}
                    max={40}
                    value={roll}
                    onChange={(e) => setRoll(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4-Angle Captured Thumbnail Matrix */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-200">
                다각도 스캔 현황 ({capturedCount} / 4 완료)
              </span>
              {capturedCount > 0 && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  전면 스캔만으로도 즉시 분석 가능
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SCAN_STEPS.map((s) => {
                const thumb = frames[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectStep(s.id)}
                    className={`group relative aspect-[5/7] rounded-lg overflow-hidden border ${
                      activeStep === s.id
                        ? 'border-red-500 ring-2 ring-red-500/40'
                        : thumb
                        ? 'border-emerald-500/50'
                        : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 p-1 text-center">
                        STEP {s.stepNumber}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 py-0.5 text-[9px] font-bold text-center text-slate-200">
                      {s.id === 'front'
                        ? '정면 0°'
                        : s.id === 'back'
                        ? '후면 0°'
                        : s.id === 'tilt_top'
                        ? '상하 20°'
                        : '좌우 20°'}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              disabled={!frames.front}
              onClick={onProceedToCentering}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none py-3 px-4 text-sm font-extrabold text-white shadow-lg shadow-red-600/25 transition"
            >
              <span>센터링 캘리퍼 측정 및 PSA 등급 분석으로 이동</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
