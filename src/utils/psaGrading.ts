import {
  CenteringLines,
  CenteringMetrics,
  CornerAnalysis,
  EdgeAnalysis,
  FinalPSAReport,
  PSAGradeInfo,
  ScanStepMeta,
  SurfaceAnalysis,
} from '../types/grading';

export const SCAN_STEPS: ScanStepMeta[] = [
  {
    id: 'front',
    stepNumber: 1,
    title: 'STEP 1. 전면 수직 스캔 (0°)',
    subtitle: '카드를 바닥에 평평하게 놓고 정면 수직(0°)에서 촬영하세요',
    targetAngleLabel: '수직 0° (정면 센터링 & 일러스트 프레임)',
    recommendedPitch: [-6, 6],
    recommendedRoll: [-6, 6],
    focusArea: '전면 좌우/상하 테두리 비율(55:45~60:40) 및 전면 실버링',
    inspectionPoints: [
      '전면 좌·우, 상·하 테두리 두께 비율 정밀 측정 (PSA 10 기준 55:45 ~ 60:40)',
      '전면 4개 모서리 곡률(Rounding) 및 호일 들뜸(Silvering) 확인',
      '빛 반사가 일러스트를 가리지 않도록 수직 유지'
    ]
  },
  {
    id: 'back',
    stepNumber: 2,
    title: 'STEP 2. 후면 수직 스캔 (0°)',
    subtitle: '카드를 뒤집어 후면 파란 테두리와 모서리 백화(Whitening)를 촬영하세요',
    targetAngleLabel: '수직 0° (후면 센터링 75:25 & 백화 정밀 감지)',
    recommendedPitch: [-6, 6],
    recommendedRoll: [-6, 6],
    focusArea: '후면 모서리/엣지 백화(하얀 점) 및 후면 센터링',
    inspectionPoints: [
      '포켓몬카드 감정의 핵심인 후면 짙은 파란색 테두리의 백화(Whitening) 픽셀 추출',
      '후면 좌·우, 상·하 센터링 측정 (PSA 10 기준 75:25 이내)',
      '재단면 거칠기(Rough Cut) 및 코너 뭉개짐 분석'
    ]
  },
  {
    id: 'tilt_top',
    stepNumber: 3,
    title: 'STEP 3. 상·하단 20° 빛반사 스캔',
    subtitle: '카메라를 상/하 15°~25° 기울여 빛이 카드 표면을 스치게 촬영하세요',
    targetAngleLabel: '상하 기울기 15°~25° (홀로그램 미세 기스 & 눌림 감지)',
    recommendedPitch: [12, 30],
    recommendedRoll: [-10, 10],
    focusArea: '표면 가로 방향 스크래치, 미세 찍힘(Indent), 엠보싱 결',
    inspectionPoints: [
      '수직 촬영에서는 절대 보이지 않는 홀로그램 미세 스크래치 검출',
      '표면 눌림/찍힘(Indent/Dent) 유무 확인 (감지 시 PSA 6 이하로 즉시 제한)',
      '텍스처(SAR/UR 특수 가공) 손상 및 오염 확인'
    ]
  },
  {
    id: 'tilt_side',
    stepNumber: 4,
    title: 'STEP 4. 좌·우측 20° 사선 스캔',
    subtitle: '카메라를 좌/우 15°~25° 기울여 세로 프린트 라인과 엣지 단면을 비추세요',
    targetAngleLabel: '좌우 기울기 15°~25° (공장 프린트 라인 & 테두리 단면)',
    recommendedPitch: [-10, 10],
    recommendedRoll: [12, 30],
    focusArea: '세로 프린트 라인(Print Line), 호일 리프트, 기포',
    inspectionPoints: [
      '포켓몬 홀로그램 카드 특유의 수직/수평 공정 프린트 라인 검출',
      '사선 조명에서 드러나는 테두리 들뜸(Edge Lift) 확인',
      '다각도 합성 표면 히트맵(Surface Heatmap) 생성'
    ]
  }
];

export const PSA_GRADE_TABLE: Record<number, PSAGradeInfo> = {
  10: {
    grade: 10,
    code: 'GEM-MT 10',
    titleKo: '젬 민트 (완벽한 무결점 상태)',
    frontCenteringRule: '55:45 ~ 60:40 이내',
    backCenteringRule: '75:25 이내',
    description:
      '4개의 모서리가 완벽히 날카롭고 백화가 없으며, 원래의 광택과 표면이 보존된 최상위 등급입니다. 미세한 인쇄 오차만 허용됩니다.',
    badgeColor: 'from-amber-400 via-yellow-500 to-red-600'
  },
  9: {
    grade: 9,
    code: 'MINT 9',
    titleKo: '민트 (극미세 결점 1곳 이하)',
    frontCenteringRule: '60:40 ~ 65:35 이내',
    backCenteringRule: '90:10 이내',
    description:
      '언뜻 보기에 완벽해 보이나, 정밀 확대 시 후면 코너의 극미세한 백화 1점, 미세한 센터링 편차 또는 가벼운 표면 기스 중 1가지 결점이 있는 상태입니다.',
    badgeColor: 'from-emerald-400 to-teal-600'
  },
  8: {
    grade: 8,
    code: 'NM-MT 8',
    titleKo: '니어 민트-민트 (우수 상태)',
    frontCenteringRule: '65:35 ~ 70:30 이내',
    backCenteringRule: '90:10 이내',
    description:
      '2~3곳의 모서리에 경미한 백화나 마모가 있거나, 빛 반사 시 확인되는 가벼운 홀로그램 스크래치/프린트 라인이 존재하는 상태입니다.',
    badgeColor: 'from-sky-400 to-blue-600'
  },
  7: {
    grade: 7,
    code: 'NM 7',
    titleKo: '니어 민트 (육안 확인 가능한 마모)',
    frontCenteringRule: '70:30 ~ 75:25 이내',
    backCenteringRule: '90:10 이내',
    description:
      '모서리 백화와 테두리 까짐이 육안으로 확인되며, 표면 광택 저하나 복수의 홀로그램 스크래치가 관찰됩니다.',
    badgeColor: 'from-indigo-400 to-purple-600'
  },
  6: {
    grade: 6,
    code: 'EX-MT 6',
    titleKo: '엑설런트-민트 (미세 찍힘/눌림 제한 등급)',
    frontCenteringRule: '80:20 이내',
    backCenteringRule: '90:10 이내',
    description:
      '센터링과 코너가 완벽하더라도 빛 반사 각도에서 표면 미세 눌림(Indent/Dent)이나 손톱 자국이 발견되면 PSA 기준상 최대 6등급으로 제한됩니다.',
    badgeColor: 'from-orange-400 to-amber-700'
  },
  5: {
    grade: 5,
    code: 'EX 5',
    titleKo: '엑설런트 (뚜렷한 마모 및 주름)',
    frontCenteringRule: '85:15 이내',
    backCenteringRule: '90:10 이내',
    description:
      '모서리 뭉개짐, 테두리 다수 백화, 또는 얕은 표면 주름(Crease) 및 스크래치가 다수 존재하는 상태입니다.',
    badgeColor: 'from-slate-400 to-slate-600'
  }
};

export function calculateCenteringMetrics(
  lines: CenteringLines,
  side: 'front' | 'back'
): CenteringMetrics {
  const leftWidth = Math.max(0.002, lines.leftInner - lines.leftOuter);
  const rightWidth = Math.max(0.002, lines.rightOuter - lines.rightInner);
  const topWidth = Math.max(0.002, lines.topInner - lines.topOuter);
  const bottomWidth = Math.max(0.002, lines.bottomOuter - lines.bottomInner);

  const totalH = leftWidth + rightWidth;
  const totalV = topWidth + bottomWidth;

  const leftPercent = Number(((leftWidth / totalH) * 100).toFixed(1));
  const rightPercent = Number((100 - leftPercent).toFixed(1));
  const topPercent = Number(((topWidth / totalV) * 100).toFixed(1));
  const bottomPercent = Number((100 - topPercent).toFixed(1));

  const maxHorizontalRatio = Math.max(leftPercent, rightPercent);
  const maxVerticalRatio = Math.max(topPercent, bottomPercent);
  const worstRatio = Math.max(maxHorizontalRatio, maxVerticalRatio);

  let psaMaxGradeAllowed = 10;

  if (side === 'front') {
    // PSA Front Centering Standards:
    // PSA 10: 55/45 to 60/40 (strictly <= 60.0%, ideally <= 57.5%)
    // PSA 9: <= 65.0%
    // PSA 8: <= 70.0%
    // PSA 7: <= 75.0%
    // PSA 6: <= 80.0%
    if (worstRatio <= 58.5) {
      psaMaxGradeAllowed = 10;
    } else if (worstRatio <= 60.0) {
      psaMaxGradeAllowed = 9.5; // Borderline 10 / strong 9
    } else if (worstRatio <= 65.0) {
      psaMaxGradeAllowed = 9;
    } else if (worstRatio <= 70.0) {
      psaMaxGradeAllowed = 8;
    } else if (worstRatio <= 75.0) {
      psaMaxGradeAllowed = 7;
    } else if (worstRatio <= 80.0) {
      psaMaxGradeAllowed = 6;
    } else {
      psaMaxGradeAllowed = 5;
    }
  } else {
    // PSA Back Centering Standards:
    // PSA 10: <= 75/25
    // PSA 9: <= 90/10
    if (worstRatio <= 75.0) {
      psaMaxGradeAllowed = 10;
    } else if (worstRatio <= 90.0) {
      psaMaxGradeAllowed = 9;
    } else {
      psaMaxGradeAllowed = 7;
    }
  }

  return {
    leftPercent,
    rightPercent,
    topPercent,
    bottomPercent,
    maxHorizontalRatio,
    maxVerticalRatio,
    worstRatio,
    psaMaxGradeAllowed,
    ratioTextLR: `${Math.round(leftPercent)} : ${Math.round(rightPercent)}`,
    ratioTextTB: `${Math.round(topPercent)} : ${Math.round(bottomPercent)}`
  };
}

export function computeFinalPSAReport(params: {
  cardTitle: string;
  frontCentering: CenteringMetrics;
  backCentering: CenteringMetrics;
  corners: CornerAnalysis[];
  edges: EdgeAnalysis[];
  surface: SurfaceAnalysis;
  aiExpertComment?: string;
}): FinalPSAReport {
  const { cardTitle, frontCentering, backCentering, corners, edges, surface, aiExpertComment } =
    params;

  // 1. Centering Subgrade
  const centeringSubgrade = Number(
    Math.min(frontCentering.psaMaxGradeAllowed, backCentering.psaMaxGradeAllowed).toFixed(1)
  );

  // 2. Corners Subgrade (weighted towards the weakest corner)
  const cornerGrades = corners.map((c) => c.estimatedGrade);
  const minCorner = Math.min(...cornerGrades);
  const avgCorner = cornerGrades.reduce((a, b) => a + b, 0) / cornerGrades.length;
  const cornersSubgrade = Number((minCorner * 0.65 + avgCorner * 0.35).toFixed(1));

  // 3. Edges Subgrade
  const edgeGrades = edges.map((e) => e.estimatedGrade);
  const minEdge = Math.min(...edgeGrades);
  const avgEdge = edgeGrades.reduce((a, b) => a + b, 0) / edgeGrades.length;
  const edgesSubgrade = Number((minEdge * 0.6 + avgEdge * 0.4).toFixed(1));

  // 4. Surface Subgrade
  const surfaceSubgrade = Number(surface.estimatedGrade.toFixed(1));

  // PSA Overall Grade Calculation Rule:
  // Overall grade cannot exceed the lowest subgrade by more than 0.5 (and if surface has indent/dent, hard cap at 6).
  const minSubgrade = Math.min(
    centeringSubgrade,
    cornersSubgrade,
    edgesSubgrade,
    surfaceSubgrade
  );

  const weightedAvg =
    centeringSubgrade * 0.25 +
    cornersSubgrade * 0.28 +
    edgesSubgrade * 0.20 +
    surfaceSubgrade * 0.27;

  let rawGrade = Math.min(weightedAvg, minSubgrade + 0.5);

  if (surface.indentOrCreaseDetected) {
    rawGrade = Math.min(rawGrade, 6.0);
  }

  const predictedGrade = Math.max(5, Math.min(10, Math.round(rawGrade)));
  const gradeInfo = PSA_GRADE_TABLE[predictedGrade] || PSA_GRADE_TABLE[5];

  // Calculate probability distribution around rawGrade
  let psa10 = 0;
  let psa9 = 0;
  let psa8 = 0;
  let psa7OrLower = 0;

  if (surface.indentOrCreaseDetected) {
    psa10 = 1;
    psa9 = 4;
    psa8 = 10;
    psa7OrLower = 85;
  } else if (rawGrade >= 9.65) {
    psa10 = Math.min(92, Math.round(65 + (rawGrade - 9.65) * 75));
    psa9 = Math.max(6, 98 - psa10);
    psa8 = 2;
    psa7OrLower = 0;
  } else if (rawGrade >= 8.7) {
    psa10 = Math.max(4, Math.round((rawGrade - 8.6) * 45));
    psa9 = Math.min(82, 92 - psa10);
    psa8 = Math.max(5, 100 - psa10 - psa9 - 1);
    psa7OrLower = 1;
  } else if (rawGrade >= 7.7) {
    psa10 = 2;
    psa9 = Math.max(10, Math.round((rawGrade - 7.6) * 30));
    psa8 = Math.min(78, 90 - psa9);
    psa7OrLower = Math.max(5, 100 - psa10 - psa9 - psa8);
  } else {
    psa10 = 1;
    psa9 = 5;
    psa8 = 22;
    psa7OrLower = 72;
  }

  // Determine limiting factor
  let limitingFactor = '4대 항목(센터링·코너·엣지·표면) 모두 PSA 10 허용 오차 범위 내에 있습니다.';
  if (surface.indentOrCreaseDetected) {
    limitingFactor =
      '다각도 빛 반사 스캔에서 표면 미세 찍힘/눌림(Indent)이 감지되었습니다. PSA 규정상 찍힘이 있으면 다른 요소가 완벽해도 최대 PSA 6으로 제한됩니다.';
  } else if (minSubgrade === centeringSubgrade && centeringSubgrade < 9.5) {
    limitingFactor = `전면 센터링 최대 편차(${frontCentering.worstRatio.toFixed(1)} : ${(
      100 - frontCentering.worstRatio
    ).toFixed(1)})가 PSA 10 기준(55:45~60:40)을 초과하여 등급 상한을 제한하고 있습니다.`;
  } else if (minSubgrade === cornersSubgrade && cornersSubgrade < 9.5) {
    const worstCorner = [...corners].sort((a, b) => a.estimatedGrade - b.estimatedGrade)[0];
    limitingFactor = `${worstCorner.label} 모서리의 미세 백화(${worstCorner.whiteningPercent.toFixed(
      1
    )}%) 및 마모가 감점 요인으로 작용했습니다.`;
  } else if (minSubgrade === surfaceSubgrade && surfaceSubgrade < 9.5) {
    limitingFactor = `사선(15°~25°) 빛 반사 스캔에서 표면 스크래치/프린트 라인(${surface.defects.length}건)이 감지되어 감점되었습니다.`;
  } else if (minSubgrade === edgesSubgrade && edgesSubgrade < 9.5) {
    limitingFactor = '테두리(Edge) 재단면 미세 백화 또는 전면 호일 실버링이 감점 요인입니다.';
  }

  // Submission advice
  let submissionAdvice = '';
  if (predictedGrade === 10) {
    submissionAdvice =
      '✅ PSA 감정 제출 강력 추천! PSA 10(Gem Mint) 확률이 매우 높으며, 슬랩 등록 시 카드 가치가 극대화됩니다. 투입 전 극세사 융으로 지문/먼지만 가볍게 제거하세요.';
  } else if (predictedGrade === 9) {
    submissionAdvice =
      '⚖️ 조건부 제출 추천. 고가 카드나 구버전(구뒷면/썬문 이전) 카드라면 PSA 9도 충분한 프리미엄이 붙지만, 현대 일반 SAR/AR 카드는 PSA 9 시세가 원가 수준일 수 있으니 시세를 먼저 확인하세요.';
  } else if (predictedGrade === 8) {
    submissionAdvice =
      '⚠️ 개인 소장용 슬랩 목적이 아니라면 제출 비추천. 현대 카드 기준 PSA 8은 싱글 원가(Raw)보다 낮게 거래되는 경우가 많습니다.';
  } else {
    submissionAdvice =
      '🛑 투자 목적 감정 제출 비추천. 빛 반사에서 확인된 표면 데미지 또는 백화로 인해 PSA 7 이하가 예상되므로 Raw 카드 상태 보관을 권장합니다.';
  }

  return {
    cardTitle,
    timestamp: new Date().toLocaleString('ko-KR'),
    predictedGrade,
    gradeInfo,
    confidenceScore: 91,
    probabilities: {
      psa10,
      psa9,
      psa8,
      psa7OrLower
    },
    subgrades: {
      centering: centeringSubgrade,
      corners: cornersSubgrade,
      edges: edgesSubgrade,
      surface: surfaceSubgrade
    },
    frontCentering,
    backCentering,
    corners,
    edges,
    surface,
    limitingFactor,
    submissionAdvice,
    aiExpertComment
  };
}
