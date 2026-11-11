export type GradingCompany = 'PSA' | 'BRG';

export type ScanAngleId = 'front' | 'back' | 'tilt_top' | 'tilt_side';

export interface ScanStepMeta {
  id: ScanAngleId;
  stepNumber: number;
  title: string;
  subtitle: string;
  targetAngleLabel: string;
  recommendedPitch: [number, number];
  recommendedRoll: [number, number];
  focusArea: string;
  inspectionPoints: string[];
}

export interface CenteringLines {
  leftOuter: number;
  leftInner: number;
  rightInner: number;
  rightOuter: number;
  topOuter: number;
  topInner: number;
  bottomInner: number;
  bottomOuter: number;
}

export interface CenteringMetrics {
  leftPercent: number;
  rightPercent: number;
  topPercent: number;
  bottomPercent: number;
  maxHorizontalRatio: number;
  maxVerticalRatio: number;
  worstRatio: number;
  psaMaxGradeAllowed: number;
  ratioTextLR: string;
  ratioTextTB: string;
}

export type CornerId = 'TL' | 'TR' | 'BL' | 'BR';

export interface CornerAnalysis {
  id: CornerId;
  label: string;
  cropDataUrl: string;
  whiteningPercent: number;
  sharpnessScore: number;
  estimatedGrade: number;
  issueNote: string;
}

export interface EdgeAnalysis {
  side: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';
  label: string;
  whiteningScore: number;
  silveringDetected: boolean;
  estimatedGrade: number;
  issueNote: string;
}

export interface SurfaceDefect {
  id: string;
  type: 'holo_scratch' | 'print_line' | 'indent_dent' | 'stain_clouding';
  label: string;
  severity: 'minor' | 'moderate' | 'severe';
  x: number;
  y: number;
  description: string;
  detectedAtAngle: ScanAngleId;
}

export interface SurfaceAnalysis {
  glareCoveragePercent: number;
  scratchDensityIndex: number;
  printLinesDetected: number;
  indentOrCreaseDetected: boolean;
  heatmapDataUrl: string;
  defects: SurfaceDefect[];
  estimatedGrade: number;
}

export interface CapturedFrames {
  front?: string;
  back?: string;
  tilt_top?: string;
  tilt_side?: string;
}

export interface PSAGradeInfo {
  grade: number;
  code: string;
  titleKo: string;
  frontCenteringRule: string;
  backCenteringRule: string;
  description: string;
  badgeColor: string;
}

export interface FinalPSAReport {
  company: GradingCompany;
  cardTitle: string;
  timestamp: string;
  predictedGrade: number;
  gradeInfo: PSAGradeInfo;
  confidenceScore: number;
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
