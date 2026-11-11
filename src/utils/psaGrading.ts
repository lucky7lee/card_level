import {
  CenteringLines,
  CenteringMetrics,
  CornerAnalysis,
  EdgeAnalysis,
  FinalPSAReport,
  GradingCompany,
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
    focusArea: '전면 좌우/상하 테두리 비율 및 전면 실버링',
    inspectionPoints: [
      '전면 좌·우, 상·하 테두리 두께 비율 정밀 측정',
      '전면 4개 모서리 곡률(Rounding) 및 호일 들뜸(Silvering) 확인',
      '빛 반사가 일러스트를 가리지 않도록 수직 유지',
    ],
  },
  {
    id: 'back',
    stepNumber: 2,
    title: 'STEP 2. 후면 수직 스캔 (0°)',
    subtitle: '카드를 뒤집어 후면 파란 테두리와 모서리 백화(Whitening)를 촬영하세요',
    targetAngleLabel: '수직 0° (후면 센터링 & 백화 정밀 감지)',
    recommendedPitch: [-6, 6],
    recommendedRoll: [-6, 6],
    focusArea: '후면 모서리/엣지 백화(하얀 점) 및 후면 센터링',
    inspectionPoints: [
      '포켓몬카드 감정의 핵심인 후면 짙은 파란색 테두리의 백화(Whitening) 픽셀 추출',
      '후면 좌·우, 상·하 센터링 측정',
      '재단면 거칠기(Rough Cut) 및 코너 뭉개짐 분석',
    ],
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
      '표면 눌림/찍힘(Indent/Dent) 유무 확인',
      '텍스처(SAR/UR 특수 가공) 손상 및 오염 확인',
    ],
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
      '다각도 합성 표면 히트맵(Surface Heatmap) 생성',
    ],
  },
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
    badgeColor: 'from-amber-400 via-yellow-500 to-red-600',
  },
  9: {
    grade: 9,
    code: 'MINT 9',
    titleKo: '민트 (극미세 결점 1곳 이하)',
    frontCenteringRule: '60:40 ~ 65:35 이내',
    backCenteringRule: '90:10 이내',
    description:
      '언뜻 보기에 완벽해 보이나, 정밀 확대 시 후면 코너의 극미세한 백화 1점, 미세한 센터링 편차 또는 가벼운 표면 기스 중 1가지 결점이 있는 상태입니다.',
    badgeColor: 'from-emerald-400 to-teal-600',
  },
  8: {
    grade: 8,
    code: 'NM-MT 8',
    titleKo: '니어 민트-민트 (우수 상태)',
    frontCenteringRule: '65:35 ~ 70:30 이내',
    backCenteringRule: '90:10 이내',
    description:
      '2~3곳의 모서리에 경미한 백화나 마모가 있거나, 빛 반사 시 확인되는 가벼운 홀로그램 스크래치/프린트 라인이 존재하는 상태입니다.',
    badgeColor: 'from-sky-400 to-blue-600',
  },
  7: {
    grade: 7,
    code: 'NM 7',
    titleKo: '니어 민트 (육안 확인 가능한 마모)',
    frontCenteringRule: '70:30 ~ 75:25 이내',
    backCenteringRule: '90:10 이내',
    description:
      '모서리 백화와 테두리 까짐이 육안으로 확인되며, 표면 광택 저하나 복수의 홀로그램 스크래치가 관찰됩니다.',
    badgeColor: 'from-indigo-400 to-purple-600',
  },
  6: {
    grade: 6,
    code: 'EX-MT 6',
    titleKo: '엑설런트-민트 (미세 찍힘/눌림 제한 등급)',
    frontCenteringRule: '80:20 이내',
    backCenteringRule: '90:10 이내',
    description:
      '센터링과 코너가 완벽하더라도 빛 반사 각도에서 표면 미세 눌림(Indent/Dent)이나 손톱 자국이 발견되면 PSA 기준상 최대 6등급으로 제한됩니다.',
    badgeColor: 'from-orange-400 to-amber-700',
  },
  5: {
    grade: 5,
    code: 'EX 5',
    titleKo: '엑설런트 (뚜렷한 마모 및 주름)',
    frontCenteringRule: '85:15 이내',
    backCenteringRule: '90:10 이내',
    description:
      '모서리 뭉개짐, 테두리 다수 백화, 또는 얕은 표면 주름(Crease) 및 스크래치가 다수 존재하는 상태입니다.',
    badgeColor: 'from-slate-400 to-slate-600',
  },
};

export const BRG_GRADE_TABLE: Record<number, PSAGradeInfo> = {
  10: {
    grade: 10,
    code: 'BRG 10 GEM MINT',
    titleKo: '젬 민트 (골드/블랙 라벨급 최상위)',
    frontCenteringRule: '55:45 이내 (블랙라벨 50:50)',
    backCenteringRule: '70:30 이내',
    description:
      'BRG 최고 등급으로 4대 세부 항목(센터링·코너·엣지·표면) 중 최소 3개 항목이 10점이고 최저 항목이 9.5점 이상일 때 부여됩니다. 전면 55:45 이내의 엄격한 칼센터링이 요구됩니다.',
    badgeColor: 'from-amber-400 via-yellow-500 to-blue-700',
  },
  9.5: {
    grade: 9.5,
    code: 'BRG 9.5 MINT+',
    titleKo: '민트 플러스 (준완벽 상태)',
    frontCenteringRule: '58:42 이내',
    backCenteringRule: '75:25 이내',
    description:
      'BRG 특유의 0.5점 단위 상위 등급으로, PSA 10과 PSA 9 사이의 준완벽 컨디션입니다. 센터링이 56:44~58:42이거나 극미세 재단 점 1곳만 존재할 때 부여됩니다.',
    badgeColor: 'from-blue-400 via-indigo-500 to-blue-700',
  },
  9: {
    grade: 9,
    code: 'BRG 9 MINT',
    titleKo: '민트 (우수한 보존 상태)',
    frontCenteringRule: '60:40 이내',
    backCenteringRule: '80:20 이내',
    description:
      '전면 센터링이 60:40 이내이며, 확대 관찰 시 코너 백화 1~2점 또는 미세한 공정 프린트 라인이 존재하는 상태입니다.',
    badgeColor: 'from-emerald-400 to-teal-600',
  },
  8.5: {
    grade: 8.5,
    code: 'BRG 8.5 NM-MT+',
    titleKo: '니어 민트-민트 플러스',
    frontCenteringRule: '63:37 이내',
    backCenteringRule: '85:15 이내',
    description:
      '전면 센터링 편차 또는 후면 테두리에 경미한 백화와 가벼운 홀로그램 기스가 동반된 상태입니다.',
    badgeColor: 'from-sky-400 to-blue-600',
  },
  8: {
    grade: 8,
    code: 'BRG 8 NM-MT',
    titleKo: '니어 민트-민트',
    frontCenteringRule: '65:35 이내',
    backCenteringRule: '85:15 이내',
    description:
      '모서리 2~3곳의 백화 또는 사선 빛반사에서 확인되는 홀로그램 스크래치가 뚜렷한 상태입니다.',
    badgeColor: 'from-indigo-400 to-purple-600',
  },
  7: {
    grade: 7,
    code: 'BRG 7 NM',
    titleKo: '니어 민트 (육안 마모 확인)',
    frontCenteringRule: '70:30 이내',
    backCenteringRule: '90:10 이내',
    description:
      '코너 뭉개짐과 테두리 백화가 육안으로 쉽게 식별되며, 표면 광택 저하가 동반된 상태입니다.',
    badgeColor: 'from-purple-400 to-slate-600',
  },
  6: {
    grade: 6,
    code: 'BRG 6 EX-MT',
    titleKo: '엑설런트-민트 (표면 눌림/찍힘 제한)',
    frontCenteringRule: '75:25 이내',
    backCenteringRule: '90:10 이내',
    description:
      '빛 반사 스캔에서 표면 미세 눌림(Indent/Dent)이나 찍힘이 검출된 경우 BRG 규정상 다른 항목이 10점이어도 최대 6~6.5등급으로 제한됩니다.',
    badgeColor: 'from-orange-400 to-amber-700',
  },
};

export function calculateCenteringMetrics(
  lines: CenteringLines,
  side: 'front' | 'back',
  company: GradingCompany = 'PSA'
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

  if (company === 'BRG') {
    // BRG Centering Standards (Stricter 55:45 front & 70:30 back for BRG 10, 0.5 step increments)
    if (side === 'front') {
      if (worstRatio <= 55.5) {
        psaMaxGradeAllowed = 10;
      } else if (worstRatio <= 58.0) {
        psaMaxGradeAllowed = 9.5;
      } else if (worstRatio <= 60.5) {
        psaMaxGradeAllowed = 9;
      } else if (worstRatio <= 63.0) {
        psaMaxGradeAllowed = 8.5;
      } else if (worstRatio <= 66.0) {
        psaMaxGradeAllowed = 8;
      } else if (worstRatio <= 70.0) {
        psaMaxGradeAllowed = 7;
      } else {
        psaMaxGradeAllowed = 6;
      }
    } else {
      if (worstRatio <= 70.0) {
        psaMaxGradeAllowed = 10;
      } else if (worstRatio <= 75.0) {
        psaMaxGradeAllowed = 9.5;
      } else if (worstRatio <= 80.0) {
        psaMaxGradeAllowed = 9;
      } else {
        psaMaxGradeAllowed = 8;
      }
    }
  } else {
    // Official PSA Centering Standards
    if (side === 'front') {
      if (worstRatio <= 58.5) {
        psaMaxGradeAllowed = 10;
      } else if (worstRatio <= 60.0) {
        psaMaxGradeAllowed = 9.5;
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
      if (worstRatio <= 75.0) {
        psaMaxGradeAllowed = 10;
      } else if (worstRatio <= 90.0) {
        psaMaxGradeAllowed = 9;
      } else {
        psaMaxGradeAllowed = 7;
      }
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
    ratioTextTB: `${Math.round(topPercent)} : ${Math.round(bottomPercent)}`,
  };
}

export function computeFinalPSAReport(params: {
  company?: GradingCompany;
  cardTitle: string;
  frontCentering: CenteringMetrics;
  backCentering: CenteringMetrics;
  corners: CornerAnalysis[];
  edges: EdgeAnalysis[];
  surface: SurfaceAnalysis;
  aiExpertComment?: string;
}): FinalPSAReport {
  const {
    company = 'PSA',
    cardTitle,
    frontCentering,
    backCentering,
    corners,
    edges,
    surface,
    aiExpertComment,
  } = params;

  const centeringSubgrade = Number(
    Math.min(frontCentering.psaMaxGradeAllowed, backCentering.psaMaxGradeAllowed).toFixed(1)
  );

  const cornerGrades = corners.map((c) => c.estimatedGrade);
  const minCorner = Math.min(...cornerGrades);
  const avgCorner = cornerGrades.reduce((a, b) => a + b, 0) / cornerGrades.length;
  const cornersSubgrade = Number((minCorner * 0.65 + avgCorner * 0.35).toFixed(1));

  const edgeGrades = edges.map((e) => e.estimatedGrade);
  const minEdge = Math.min(...edgeGrades);
  const avgEdge = edgeGrades.reduce((a, b) => a + b, 0) / edgeGrades.length;
  const edgesSubgrade = Number((minEdge * 0.6 + avgEdge * 0.4).toFixed(1));

  const surfaceSubgrade = Number(surface.estimatedGrade.toFixed(1));

  const minSubgrade = Math.min(
    centeringSubgrade,
    cornersSubgrade,
    edgesSubgrade,
    surfaceSubgrade
  );

  const weightedAvg =
    centeringSubgrade * 0.25 +
    cornersSubgrade * 0.28 +
    edgesSubgrade * 0.2 +
    surfaceSubgrade * 0.27;

  let rawGrade = Math.min(weightedAvg, minSubgrade + 0.5);

  if (surface.indentOrCreaseDetected) {
    rawGrade = Math.min(rawGrade, 6.0);
  }

  let predictedGrade: number;
  let gradeInfo: PSAGradeInfo;

  if (company === 'BRG') {
    // BRG uses 0.5 step grades (10, 9.5, 9, 8.5, 8, 7, 6)
    const snapped = Math.round(rawGrade * 2) / 2;
    if (snapped >= 9.75) predictedGrade = 10;
    else if (snapped >= 9.25) predictedGrade = 9.5;
    else if (snapped >= 8.75) predictedGrade = 9;
    else if (snapped >= 8.25) predictedGrade = 8.5;
    else if (snapped >= 7.5) predictedGrade = 8;
    else if (snapped >= 6.5) predictedGrade = 7;
    else predictedGrade = 6;

    gradeInfo = BRG_GRADE_TABLE[predictedGrade] || BRG_GRADE_TABLE[6];
  } else {
    predictedGrade = Math.max(5, Math.min(10, Math.round(rawGrade)));
    gradeInfo = PSA_GRADE_TABLE[predictedGrade] || PSA_GRADE_TABLE[5];
  }

  let limitingFactor =
    company === 'BRG'
      ? '4대 서브그레이드(센터링·코너·엣지·표면) 모두 BRG 10 허용 기준 내에 있습니다.'
      : '4대 항목(센터링·코너·엣지·표면) 모두 PSA 10 허용 오차 범위 내에 있습니다.';

  if (surface.indentOrCreaseDetected) {
    limitingFactor = `다각도 빛 반사 스캔에서 표면 미세 찍힘/눌림(Indent)이 감지되어 ${company} 규정상 최대 6등급으로 제한됩니다.`;
  } else if (minSubgrade === centeringSubgrade && centeringSubgrade < 9.8) {
    limitingFactor = `전면 센터링 편차(${frontCentering.ratioTextLR})가 ${company} 10 기준(${
      company === 'BRG' ? '55:45 이내' : '55:45~60:40 이내'
    })을 초과하여 등급이 제한되었습니다.`;
  } else if (minSubgrade === cornersSubgrade && cornersSubgrade < 9.5) {
    const worstCorner = [...corners].sort((a, b) => a.estimatedGrade - b.estimatedGrade)[0];
    limitingFactor = `${worstCorner.label} 모서리 미세 백화(${worstCorner.whiteningPercent.toFixed(
      1
    )}%)가 감점 요인입니다.`;
  } else if (minSubgrade === surfaceSubgrade && surfaceSubgrade < 9.5) {
    limitingFactor = `사선(20°) 빛 반사 스캔에서 표면 미세 스크래치/프린트 라인이 감지되어 감점되었습니다.`;
  }

  return {
    company,
    cardTitle,
    timestamp: new Date().toLocaleString('ko-KR'),
    predictedGrade,
    gradeInfo,
    confidenceScore: 91,
    probabilities: {
      psa10: 70,
      psa9: 20,
      psa8: 8,
      psa7OrLower: 2,
    },
    subgrades: {
      centering: centeringSubgrade,
      corners: cornersSubgrade,
      edges: edgesSubgrade,
      surface: surfaceSubgrade,
    },
    frontCentering,
    backCentering,
    corners,
    edges,
    surface,
    limitingFactor,
    submissionAdvice: '',
    aiExpertComment,
  };
}
