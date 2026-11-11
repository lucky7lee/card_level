import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { CapturedFrames, ScanAngleId } from '../types/grading';

interface CameraScannerProps {
  frames: CapturedFrames;
  activeStep: ScanAngleId;
  onSelectStep: (step: ScanAngleId) => void;
  onCaptureFrame: (step: ScanAngleId, dataUrl: string) => void;
  onCompleteAllScans: () => void;
}

const SIMPLE_STEPS: {
  id: ScanAngleId;
  badge: string;
  instruction: string;
  subHint: string;
}[] = [
  {
    id: 'front',
    badge: '1 / 4',
    instruction: '카드 앞면을 가이드에 맞춰 찍어주세요',
    subHint: '수직(0°) 정면 스캔',
  },
  {
    id: 'back',
    badge: '2 / 4',
    instruction: '카드를 뒤집어 뒷면을 찍어주세요',
    subHint: '수직(0°) 후면 스캔',
  },
  {
    id: 'tilt_top',
    badge: '3 / 4',
    instruction: '카드를 위·아래로 살짝 기울여 찍어주세요',
    subHint: '상하 약 20° 빛반사 스캔',
  },
  {
    id: 'tilt_side',
    badge: '4 / 4',
    instruction: '카드를 좌·우로 살짝 기울여 찍어주세요',
    subHint: '좌우 약 20° 빛반사 스캔',
  },
];

export const CameraScanner: React.FC<CameraScannerProps> = ({
  frames,
  activeStep,
  onSelectStep,
  onCaptureFrame,
  onCompleteAllScans,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  const currentIdx = Math.max(
    0,
    SIMPLE_STEPS.findIndex((s) => s.id === activeStep)
  );
  const currentStep = SIMPLE_STEPS[currentIdx];

  const startCamera = async () => {
    if (streamRef.current && cameraActive) return;

    try {
      const DevOrient = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DevOrient.requestPermission === 'function') {
        DevOrient.requestPermission().catch(() => {});
      }
    } catch {
      // ignore
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
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
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Automatically attempt to start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  const handleRoundCameraButton = async () => {
    // If camera is not yet active, turn it on immediately
    if (!cameraActive || !videoRef.current) {
      await startCamera();
      return;
    }

    const video = videoRef.current;
    const w = 600;
    const h = 840;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Visual shutter flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 150);

    onCaptureFrame(activeStep, dataUrl);

    // Advance to next step or move to Step 2 (Centering)
    if (currentIdx < SIMPLE_STEPS.length - 1) {
      onSelectStep(SIMPLE_STEPS[currentIdx + 1].id);
    } else {
      stopCamera();
      onCompleteAllScans();
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto">
      {/* Step Progress & Clear One-Line Instruction */}
      <div className="w-full text-center mb-3 space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          {SIMPLE_STEPS.map((s, idx) => {
            const done = Boolean(frames[s.id]);
            const active = idx === currentIdx;
            return (
              <button
                key={s.id}
                onClick={() => onSelectStep(s.id)}
                className={`h-2 rounded-full transition-all ${
                  active
                    ? 'w-8 bg-red-500'
                    : done
                    ? 'w-4 bg-emerald-400'
                    : 'w-4 bg-slate-800'
                }`}
                aria-label={s.badge}
              />
            );
          })}
        </div>
        <div className="text-xs font-extrabold text-red-400 tracking-wide">
          STEP {currentStep.badge} · {currentStep.subHint}
        </div>
        <h2 className="text-base sm:text-lg font-extrabold text-white">
          {currentStep.instruction}
        </h2>
      </div>

      {/* Large Full-Focus Card Viewport */}
      <div className="relative w-full aspect-[5/7] rounded-3xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl">
        {/* Always-mounted live video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cameraActive ? 'w-full h-full object-cover' : 'hidden'}
        />

        {/* If camera hasn't started yet, show captured preview or clean prompt */}
        {!cameraActive && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900">
            {frames[activeStep] ? (
              <img
                src={frames[activeStep]}
                alt="Captured card"
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <p className="text-sm text-slate-400">
                아래 동그란 카메라 버튼을 눌러 스캔을 시작하세요
              </p>
            )}
          </div>
        )}

        {/* Shutter Flash Effect */}
        {flashEffect && <div className="absolute inset-0 bg-white/80 pointer-events-none" />}

        {/* Clean Card Guide Frame Overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`relative w-[86%] h-[88%] rounded-2xl border-2 border-white/80 transition-transform duration-300 ${
              activeStep === 'tilt_top'
                ? 'scale-y-95 border-sky-400'
                : activeStep === 'tilt_side'
                ? 'scale-x-95 border-amber-400'
                : ''
            }`}
          >
            {/* 4 Corner Guides */}
            <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-red-500 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-red-500 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-red-500 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-red-500 rounded-br-xl" />

            {/* Subtle light reflection band hint on tilt steps */}
            {activeStep === 'tilt_top' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-sky-300/20 to-transparent" />
            )}
            {activeStep === 'tilt_side' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-amber-300/20 to-transparent" />
            )}
          </div>
        </div>

        {/* Single Circular Camera Button at Bottom Center */}
        <div className="absolute bottom-5 inset-x-0 flex justify-center">
          <button
            onClick={handleRoundCameraButton}
            aria-label="카메라 스캔"
            className="w-18 h-18 p-5 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 border-4 border-white shadow-[0_0_25px_rgba(220,38,38,0.7)] flex items-center justify-center text-white transition-all"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};
