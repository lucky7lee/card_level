export type ScanAngleId = 'front' | 'back' | 'tilt_top' | 'tilt_side';

export interface ScanStepMeta {
  id: ScanAngleId;
  stepNumber: number;
  title: string;
  subtitle: string;
  targetAngleLabel: string;
  recommendedPitch: [number, number]; // min, max degrees
  recommendedRoll: [number, number];  // min, max degrees
  focusArea: string;
  inspectionPoints: string[];
}

export interface CenteringLines {
  leftOuter: number;   // 0..1 normalized X
  leftInner: number;   // 0..1 normalized X
  rightInner: number;  // 0..1 normalized X
  rightOuter: number;  // 0..1 normalized X
  topOuter: number;    // 0..1 normalized Y
  topInner: number;    // 0..1 normalized Y
  bottomInner: number; // 0..1 normalized Y
  bottomOuter: number; // 0..1 normalized Y
}

export interface CenteringMetrics {
  leftPercent: number;
  rightPercent: number;
  topPercent: number;
  bottomPercent: number;
  maxHorizontalRatio: number; // e.g., 53.5 means 53.5 : 46.5
  maxVerticalRatio: number;   // e.g., 55.2 means 55.2 : 44.8
  worstRatio: number;         // max(maxHorizontalRatio, maxVerticalRatio)
  psaMaxGradeAllowed: number; // 10, 9, 8, 7, 6, 5...
  ratioTextLR: string;        // "53 : 47"
  ratioTextTB: string;        // "55 : 45"
}

export type CornerId = 'TL' | 'TR' | 'BL' | 'BR';

export interface CornerAnalysis {
  id: CornerId;
  label: string;
  cropDataUrl: string;
  whiteningPercent: number; // 0..100 (percentage of border edge pixels showing white paper core)
  sharpnessScore: number;   // 0..100
  estimatedGrade: number;   // 1..10
  issueNote: string;
}

export interface EdgeAnalysis {
  side: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';
  label: string;
  whiteningScore: number;   // 0..100 (100 = pristine)
  silveringDetected: boolean;
  estimatedGrade: number;   // 1..10
  issueNote: string;
}

export interface SurfaceDefect {
  id: string;
  type: 'holo_scratch' | 'print_line' | 'indent_dent' | 'stain_clouding';
  label: string;
  severity: 'minor' | 'moderate' | 'severe';
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  description: string;
  detectedAtAngle: ScanAngleId;
}

export interface SurfaceAnalysis {
  glareCoveragePercent: number;
  scratchDensityIndex: number; // 0..100 (lower is better)
  printLinesDetected: number;
  indentOrCreaseDetected: boolean;
  heatmapDataUrl: string;
  defects: SurfaceDefect[];
  estimatedGrade: number; // 1..10
}

export interface CapturedFrames {
  front?: string;
  back?: string;
  tilt_top?: string;
  tilt_side?: string;
}

export interface PSAGradeInfo {
  grade: number;
  code: string;        // e.g. "GEM-MT 10", "MINT 9", "NM-MT 8"
  titleKo: string;     // e.g. "젬민트 (완벽 상태)"
  frontCenteringRule: string;
  backCenteringRule: string;
  description: string;
  badgeColor: string;
}

export interface FinalPSAReport {
  cardTitle: string;
  timestamp: string;
  predictedGrade: number;
  gradeInfo: PSAGradeInfo;
  confidenceScore: number; // 0..100
  probabilities: {
    psa10: number;
    psa9: number;
    psa8: number;
    psa7OrLower: number;
  };
  subgrades: {
    centering: number;
    corners: number;
    edges: number;
    surface: number;
  };
  frontCentering: CenteringMetrics;
  backCentering: CenteringMetrics;
  corners: CornerAnalysis[];
  edges: EdgeAnalysis[];
  surface: SurfaceAnalysis;
  limitingFactor: string;
  submissionAdvice: string;
  aiExpertComment?: string;
}
