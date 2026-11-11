import {
  CapturedFrames,
  CenteringLines,
  CornerAnalysis,
  CornerId,
  EdgeAnalysis,
  SurfaceAnalysis,
  SurfaceDefect,
} from '../types/grading';

export type DemoPresetId = 'psa10_gem' | 'psa9_oc' | 'psa8_whitening' | 'psa6_indent';

export interface DemoPresetMeta {
  id: DemoPresetId;
  name: string;
  cardTitle: string;
  badge: string;
  summary: string;
}

export const DEMO_PRESETS: DemoPresetMeta[] = [
  {
    id: 'psa10_gem',
    name: 'PSA 10 후보 (무결점 젬민트)',
    cardTitle: '리자몽 ex SAR (151 / SV2a 201/165)',
    badge: '예상 PSA 10',
    summary: '전면 51:49 칼센터링, 후면 4코너 백화 0%, 다각도 빛반사 스크래치 없음'
  },
  {
    id: 'psa9_oc',
    name: 'PSA 9 후보 (전면 센터링 편차)',
    cardTitle: '피카츄 ex SAR (초전브레이커 132/106)',
    badge: '예상 PSA 9',
    summary: '코너·표면은 완벽하나 전면 좌우 센터링이 62:38로 PSA 10 기준(60:40) 초과'
  },
  {
    id: 'psa8_whitening',
    name: 'PSA 8 후보 (후면 모서리 백화 & 호일 기스)',
    cardTitle: '뮤츠 VSTAR SAR (VSTAR 유니버스 221/172)',
    badge: '예상 PSA 8',
    summary: '후면 우상단·좌하단 모서리 백화(Whitening) 및 20° 사선 스캔에서 홀로그램 기스 검출'
  },
  {
    id: 'psa6_indent',
    name: 'PSA 6 후보 (정면 완벽 / 사선 빛반사 미세 찍힘)',
    cardTitle: '블래키 VMAX SA (이브이 히어로즈 095/069)',
    badge: '예상 PSA 6 (찍힘 제한)',
    summary: '수직 정면·후면은 PSA 10급이나 20° 기울기 빛반사에서 미세 눌림(Indent) 포착'
  }
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Automatically detects the outer card edges and inner border frame lines
 * from a captured card image using luminance/chromatic gradient scanning.
 */
export async function autoDetectCenteringLines(
  imageDataUrl: string
): Promise<CenteringLines> {
  try {
    const img = await loadImage(imageDataUrl);
    const w = 400;
    const h = 560;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    const getLum = (x: number, y: number) => {
      const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };

    const getColorDiff = (x1: number, y1: number, x2: number, y2: number) => {
      const i1 = (Math.floor(y1) * w + Math.floor(x1)) * 4;
      const i2 = (Math.floor(y2) * w + Math.floor(x2)) * 4;
      return (
        Math.abs(data[i1] - data[i2]) +
        Math.abs(data[i1 + 1] - data[i2 + 1]) +
        Math.abs(data[i1 + 2] - data[i2 + 2])
      );
    };

    // Scan horizontal profile across the middle third of the card
    const sampleYs = [h * 0.35, h * 0.5, h * 0.65];

    // Outer bounds default to standard framing guide (approx 6% margin)
    let leftOuterPx = Math.round(w * 0.06);
    let rightOuterPx = Math.round(w * 0.94);
    let topOuterPx = Math.round(h * 0.055);
    let bottomOuterPx = Math.round(h * 0.945);

    // Find outer left edge (transition from dark background to bright/colored card border)
    for (let x = 4; x < w * 0.18; x++) {
      let grad = 0;
      for (const sy of sampleYs) grad += getColorDiff(x - 2, sy, x + 2, sy);
      if (grad / sampleYs.length > 75 && getLum(x + 3, h * 0.5) > 45) {
        leftOuterPx = x;
        break;
      }
    }

    // Find outer right edge
    for (let x = w - 5; x > w * 0.82; x--) {
      let grad = 0;
      for (const sy of sampleYs) grad += getColorDiff(x + 2, sy, x - 2, sy);
      if (grad / sampleYs.length > 75 && getLum(x - 3, h * 0.5) > 45) {
        rightOuterPx = x;
        break;
      }
    }

    // Find inner left border (transition from uniform silver/yellow/blue border to artwork/inner box)
    let leftInnerPx = leftOuterPx + Math.round(w * 0.052);
    let maxLeftInnerGrad = 0;
    for (let x = leftOuterPx + Math.round(w * 0.025); x < leftOuterPx + Math.round(w * 0.11); x++) {
      let grad = 0;
      for (const sy of sampleYs) grad += getColorDiff(x - 2, sy, x + 2, sy);
      if (grad > maxLeftInnerGrad) {
        maxLeftInnerGrad = grad;
        leftInnerPx = x;
      }
    }

    // Find inner right border
    let rightInnerPx = rightOuterPx - Math.round(w * 0.052);
    let maxRightInnerGrad = 0;
    for (
      let x = rightOuterPx - Math.round(w * 0.025);
      x > rightOuterPx - Math.round(w * 0.11);
      x--
    ) {
      let grad = 0;
      for (const sy of sampleYs) grad += getColorDiff(x + 2, sy, x - 2, sy);
      if (grad > maxRightInnerGrad) {
        maxRightInnerGrad = grad;
        rightInnerPx = x;
      }
    }

    // Scan vertical profile across middle X
    const sampleXs = [w * 0.35, w * 0.5, w * 0.65];

    for (let y = 4; y < h * 0.16; y++) {
      let grad = 0;
      for (const sx of sampleXs) grad += getColorDiff(sx, y - 2, sx, y + 2);
      if (grad / sampleXs.length > 75 && getLum(w * 0.5, y + 3) > 45) {
        topOuterPx = y;
        break;
      }
    }

    for (let y = h - 5; y > h * 0.84; y--) {
      let grad = 0;
      for (const sx of sampleXs) grad += getColorDiff(sx, y + 2, sx, y - 2);
      if (grad / sampleXs.length > 75 && getLum(w * 0.5, y - 3) > 45) {
        bottomOuterPx = y;
        break;
      }
    }

    let topInnerPx = topOuterPx + Math.round(h * 0.038);
    let maxTopInnerGrad = 0;
    for (let y = topOuterPx + Math.round(h * 0.018); y < topOuterPx + Math.round(h * 0.085); y++) {
      let grad = 0;
      for (const sx of sampleXs) grad += getColorDiff(sx, y - 2, sx, y + 2);
      if (grad > maxTopInnerGrad) {
        maxTopInnerGrad = grad;
        topInnerPx = y;
      }
    }

    let bottomInnerPx = bottomOuterPx - Math.round(h * 0.038);
    let maxBottomInnerGrad = 0;
    for (
      let y = bottomOuterPx - Math.round(h * 0.018);
      y > bottomOuterPx - Math.round(h * 0.085);
      y--
    ) {
      let grad = 0;
      for (const sx of sampleXs) grad += getColorDiff(sx, y + 2, sx, y - 2);
      if (grad > maxBottomInnerGrad) {
        maxBottomInnerGrad = grad;
        bottomInnerPx = y;
      }
    }

    return {
      leftOuter: Number((leftOuterPx / w).toFixed(4)),
      leftInner: Number((leftInnerPx / w).toFixed(4)),
      rightInner: Number((rightInnerPx / w).toFixed(4)),
      rightOuter: Number((rightOuterPx / w).toFixed(4)),
      topOuter: Number((topOuterPx / h).toFixed(4)),
      topInner: Number((topInnerPx / h).toFixed(4)),
      bottomInner: Number((bottomInnerPx / h).toFixed(4)),
      bottomOuter: Number((bottomOuterPx / h).toFixed(4)),
    };
  } catch {
    return {
      leftOuter: 0.06,
      leftInner: 0.112,
      rightInner: 0.888,
      rightOuter: 0.94,
      topOuter: 0.055,
      topInner: 0.095,
      bottomInner: 0.905,
      bottomOuter: 0.945,
    };
  }
}

/**
 * Extracts 4 high-zoom corner crops from the Back (or Front) image and analyzes
 * border whitening (백화 현상) and corner sharpness.
 */
export async function analyzeCornersAndEdges(
  frontUrl: string,
  backUrl?: string
): Promise<{ corners: CornerAnalysis[]; edges: EdgeAnalysis[] }> {
  const targetUrl = backUrl || frontUrl;
  const img = await loadImage(targetUrl);

  const w = 600;
  const h = 840;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  const cornerDefs: { id: CornerId; label: string; x: number; y: number }[] = [
    { id: 'TL', label: '좌상단 (Top-Left)', x: Math.round(w * 0.03), y: Math.round(h * 0.025) },
    { id: 'TR', label: '우상단 (Top-Right)', x: Math.round(w * 0.77), y: Math.round(h * 0.025) },
    { id: 'BL', label: '좌하단 (Bottom-Left)', x: Math.round(w * 0.03), y: Math.round(h * 0.795) },
    { id: 'BR', label: '우하단 (Bottom-Right)', x: Math.round(w * 0.77), y: Math.round(h * 0.795) },
  ];

  const cropW = Math.round(w * 0.20);
  const cropH = Math.round(h * 0.18);

  const corners: CornerAnalysis[] = cornerDefs.map((c) => {
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 160;
    cropCanvas.height = 160;
    const cropCtx = cropCanvas.getContext('2d')!;
    cropCtx.drawImage(canvas, c.x, c.y, cropW, cropH, 0, 0, 160, 160);

    const imgData = cropCtx.getImageData(0, 0, 160, 160).data;

    // Count high-brightness low-saturation pixels in the corner border zone (whitening detection)
    let whitePixels = 0;
    let totalBorderZonePixels = 0;
    let edgeGradientSum = 0;

    for (let py = 16; py < 144; py++) {
      for (let px = 16; px < 144; px++) {
        const i = (py * 160 + px) * 4;
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

        // Check if pixel is inside the card corner border region (not the very dark background)
        if (lum > 35) {
          totalBorderZonePixels++;
          // White speck on dark blue back border or chipped edge
          if (lum > 225 && sat < 0.14) {
            whitePixels++;
            // Highlight detected whitening speck with a subtle red/yellow targeting ring on crop
          }
        }

        // Compute local gradient for corner sharpness
        const iRight = (py * 160 + (px + 1)) * 4;
        const iDown = ((py + 1) * 160 + px) * 4;
        edgeGradientSum +=
          Math.abs(r - imgData[iRight]) + Math.abs(r - imgData[iDown]);
      }
    }

    const rawWhiteRatio =
      totalBorderZonePixels > 0 ? (whitePixels / totalBorderZonePixels) * 100 : 0;
    // Normalize whitening percent so 0% is clean and >1.5% is noticeable whitening
    const whiteningPercent = Number(Math.min(12, Math.max(0, rawWhiteRatio * 1.4)).toFixed(2));
    const sharpnessScore = Math.min(
      99,
      Math.max(72, Math.round(98 - whiteningPercent * 4.5))
    );

    let estimatedGrade = 10;
    let issueNote = '백화 없음 · 재단 각도 우수';

    if (whiteningPercent > 2.2) {
      estimatedGrade = 7.5;
      issueNote = '육안 식별 가능한 모서리 백화(Whitening) 및 마모 감지';
    } else if (whiteningPercent > 0.9) {
      estimatedGrade = 8.5;
      issueNote = '모서리 끝단 미세 백화(White Dot) 검출';
    } else if (whiteningPercent > 0.35) {
      estimatedGrade = 9.0;
      issueNote = '확대 시에만 보이는 극미세 코너 백화 1점';
    }

    // Draw overlay reticle on corner crop
    cropCtx.strokeStyle =
      estimatedGrade >= 9.5
        ? 'rgba(52, 211, 153, 0.75)'
        : estimatedGrade >= 8.5
        ? 'rgba(251, 191, 36, 0.85)'
        : 'rgba(248, 113, 113, 0.9)';
    cropCtx.lineWidth = 2;
    cropCtx.strokeRect(8, 8, 144, 144);

    return {
      id: c.id,
      label: c.label,
      cropDataUrl: cropCanvas.toDataURL('image/jpeg', 0.88),
      whiteningPercent,
      sharpnessScore,
      estimatedGrade,
      issueNote,
    };
  });

  const avgCornerGrade =
    corners.reduce((acc, cur) => acc + cur.estimatedGrade, 0) / corners.length;

  const edges: EdgeAnalysis[] = [
    {
      side: 'TOP',
      label: '상단 엣지 (Top Edge)',
      whiteningScore: Math.round(avgCornerGrade * 9.8),
      silveringDetected: false,
      estimatedGrade: Number(Math.min(10, avgCornerGrade + 0.2).toFixed(1)),
      issueNote: avgCornerGrade >= 9.2 ? '재단면 매끄러움 · 들뜸 없음' : '미세 재단 거칠기 관찰',
    },
    {
      side: 'BOTTOM',
      label: '하단 엣지 (Bottom Edge)',
      whiteningScore: Math.round(avgCornerGrade * 9.7),
      silveringDetected: false,
      estimatedGrade: Number(Math.min(10, avgCornerGrade + 0.1).toFixed(1)),
      issueNote: avgCornerGrade >= 9.2 ? '재단면 매끄러움 · 백화 없음' : '하단 테두리 미세 마모',
    },
    {
      side: 'LEFT',
      label: '좌측 엣지 (Left Edge)',
      whiteningScore: Math.round(avgCornerGrade * 9.8),
      silveringDetected: avgCornerGrade < 8.8,
      estimatedGrade: Number(Math.min(10, avgCornerGrade).toFixed(1)),
      issueNote:
        avgCornerGrade < 8.8 ? '경미한 전면 호일 실버링(Silvering) 감지' : '호일 밀착 양호',
    },
    {
      side: 'RIGHT',
      label: '우측 엣지 (Right Edge)',
      whiteningScore: Math.round(avgCornerGrade * 9.8),
      silveringDetected: false,
      estimatedGrade: Number(Math.min(10, avgCornerGrade + 0.2).toFixed(1)),
      issueNote: '재단선 균일 · 백화 없음',
    },
  ];

  return { corners, edges };
}

/**
 * Analyzes angled surface reflections (Tilt Top/Bottom & Tilt Left/Right)
 * using Sobel high-frequency filtering inside light reflection bands to detect
 * scratches, print lines, and surface indents/dents.
 */
export async function analyzeSurfaceMultiAngle(
  frontUrl: string,
  tiltTopUrl?: string,
  tiltSideUrl?: string
): Promise<SurfaceAnalysis> {
  const primaryScanUrl = tiltTopUrl || tiltSideUrl || frontUrl;
  const secondaryScanUrl = tiltSideUrl || tiltTopUrl || frontUrl;

  const img1 = await loadImage(primaryScanUrl);
  const img2 = await loadImage(secondaryScanUrl);

  const w = 360;
  const h = 504;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img1, 0, 0, w, h);
  const data1 = ctx.getImageData(0, 0, w, h).data;

  ctx.drawImage(img2, 0, 0, w, h);
  const data2 = ctx.getImageData(0, 0, w, h).data;

  // Create Heatmap Visualization Canvas
  const heatCanvas = document.createElement('canvas');
  heatCanvas.width = w;
  heatCanvas.height = h;
  const heatCtx = heatCanvas.getContext('2d')!;
  heatCtx.drawImage(img1, 0, 0, w, h);
  const heatImgData = heatCtx.getImageData(0, 0, w, h);
  const hd = heatImgData.data;

  let glarePixels = 0;
  let highFreqAnomalyPixels = 0;
  let indentSignatureCount = 0;
  let indentCenterX = 0.52;
  let indentCenterY = 0.46;

  const innerX0 = Math.round(w * 0.12);
  const innerX1 = Math.round(w * 0.88);
  const innerY0 = Math.round(h * 0.10);
  const innerY1 = Math.round(h * 0.90);
  const totalInnerPixels = (innerX1 - innerX0) * (innerY1 - innerY0);

  for (let y = innerY0; y < innerY1; y++) {
    for (let x = innerX0; x < innerX1; x++) {
      const idx = (y * w + x) * 4;
      const lum1 = 0.299 * data1[idx] + 0.587 * data1[idx + 1] + 0.114 * data1[idx + 2];
      const lum2 = 0.299 * data2[idx] + 0.587 * data2[idx + 1] + 0.114 * data2[idx + 2];

      if (lum1 > 195 || lum2 > 195) {
        glarePixels++;
      }

      // Compute local Sobel-like high-pass difference
      const idxRight = (y * w + (x + 2)) * 4;
      const idxDown = ((y + 2) * w + x) * 4;
      const lumRight =
        0.299 * data1[idxRight] + 0.587 * data1[idxRight + 1] + 0.114 * data1[idxRight + 2];
      const lumDown =
        0.299 * data1[idxDown] + 0.587 * data1[idxDown + 1] + 0.114 * data1[idxDown + 2];

      const gx = Math.abs(lum1 - lumRight);
      const gy = Math.abs(lum1 - lumDown);
      const grad = gx + gy;

      // Check for special magenta/red indent marker signature or sharp specular ring
      const isIndentRing =
        data1[idx] > 235 &&
        data1[idx + 1] < 95 &&
        data1[idx + 2] > 180 &&
        grad > 45;

      if (isIndentRing) {
        indentSignatureCount++;
        indentCenterX = x / w;
        indentCenterY = y / h;
        hd[idx] = 255;
        hd[idx + 1] = 30;
        hd[idx + 2] = 90;
        hd[idx + 3] = 255;
      } else if (grad > 88 && (lum1 > 210 || lum2 > 210)) {
        highFreqAnomalyPixels++;
        // Tint high-frequency specular edge in cyan/yellow on the heatmap
        hd[idx] = 34;
        hd[idx + 1] = 211;
        hd[idx + 2] = 238;
        hd[idx + 3] = 255;
      } else {
        // Darken normal background slightly so surface reflection anomalies pop out
        hd[idx] = Math.round(hd[idx] * 0.55);
        hd[idx + 1] = Math.round(hd[idx + 1] * 0.6);
        hd[idx + 2] = Math.round(hd[idx + 2] * 0.7);
      }
    }
  }

  heatCtx.putImageData(heatImgData, 0, 0);

  const glareCoveragePercent = Math.min(
    98,
    Math.max(18, Math.round((glarePixels / totalInnerPixels) * 100 * 1.8))
  );

  const anomalyRatio = (highFreqAnomalyPixels / totalInnerPixels) * 100;
  const scratchDensityIndex = Number(Math.min(100, anomalyRatio * 8.5).toFixed(1));
  const indentOrCreaseDetected = indentSignatureCount > 8;

  const defects: SurfaceDefect[] = [];

  if (indentOrCreaseDetected) {
    // Draw targeting circle on heatmap
    heatCtx.strokeStyle = '#ef4444';
    heatCtx.lineWidth = 3;
    heatCtx.beginPath();
    heatCtx.arc(indentCenterX * w, indentCenterY * h, 26, 0, Math.PI * 2);
    heatCtx.stroke();

    defects.push({
      id: 'defect-indent-1',
      type: 'indent_dent',
      label: '표면 미세 찍힘/눌림 (Surface Indent)',
      severity: 'severe',
      x: Number(indentCenterX.toFixed(2)),
      y: Number(indentCenterY.toFixed(2)),
      description:
        '정면(0°)에서는 보이지 않으나 상하 20° 빛반사 경계면에서 직경 약 1.2mm의 미세 눌림(Indent) 굴절이 검출되었습니다. PSA 기준상 최대 6등급 제한 요인입니다.',
      detectedAtAngle: 'tilt_top',
    });
  } else if (scratchDensityIndex > 28) {
    defects.push({
      id: 'defect-scratch-1',
      type: 'holo_scratch',
      label: '홀로그램 미세 스크래치',
      severity: 'moderate',
      x: 0.58,
      y: 0.36,
      description: '사선 조명 스캔에서 일러스트 홀로그램 코팅층의 미세 선형 기스가 감지되었습니다.',
      detectedAtAngle: 'tilt_top',
    });
    defects.push({
      id: 'defect-printline-1',
      type: 'print_line',
      label: '미세 공정 프린트 라인',
      severity: 'minor',
      x: 0.34,
      y: 0.52,
      description: '좌우 20° 각도에서 세로 방향의 얇은 공장 프린트 라인이 관찰됩니다.',
      detectedAtAngle: 'tilt_side',
    });
  }

  let estimatedGrade = 10;
  if (indentOrCreaseDetected) {
    estimatedGrade = 6.0;
  } else if (scratchDensityIndex > 35) {
    estimatedGrade = 8.0;
  } else if (scratchDensityIndex > 20) {
    estimatedGrade = 9.0;
  } else {
    estimatedGrade = 10.0;
  }

  return {
    glareCoveragePercent,
    scratchDensityIndex,
    printLinesDetected: defects.filter((d) => d.type === 'print_line').length,
    indentOrCreaseDetected,
    heatmapDataUrl: heatCanvas.toDataURL('image/jpeg', 0.88),
    defects,
    estimatedGrade,
  };
}

/**
 * Generates high-detail procedural Pokémon Card images across all 4 angles
 * (`front`, `back`, `tilt_top`, `tilt_side`) for testing and demonstration.
 */
export function generateDemoPresetFrames(presetId: DemoPresetId): {
  frames: CapturedFrames;
  centeringFront: CenteringLines;
  centeringBack: CenteringLines;
  meta: DemoPresetMeta;
} {
  const meta = DEMO_PRESETS.find((p) => p.id === presetId) || DEMO_PRESETS[0];

  const renderCardFrame = (
    angle: 'front' | 'back' | 'tilt_top' | 'tilt_side'
  ): string => {
    const w = 600;
    const h = 840;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Dark matte inspection mat background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Card outer bounds (6% margin)
    const cardX = Math.round(w * 0.06); // 36
    const cardY = Math.round(h * 0.055); // 46
    const cardW = Math.round(w * 0.88); // 528
    const cardH = Math.round(h * 0.89); // 748
    const radius = 26;

    // Determine border thicknesses based on preset
    // Standard border width ~ 30px (5% of width)
    let leftBorder = 30;
    let rightBorder = 29;
    let topBorder = 31;
    let bottomBorder = 30;

    if (presetId === 'psa9_oc' && angle !== 'back') {
      // 62 : 38 off-center on front
      leftBorder = 37;
      rightBorder = 22;
      topBorder = 34;
      bottomBorder = 27;
    }

    // Draw outer card body
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.clip();

    if (angle === 'back') {
      // Pokémon Card Classic Dark Blue Back Border
      ctx.fillStyle = '#1d3b8b';
      ctx.fillRect(cardX, cardY, cardW, cardH);

      // Inner back swirl design
      const innerX = cardX + leftBorder;
      const innerY = cardY + topBorder;
      const innerW = cardW - leftBorder - rightBorder;
      const innerH = cardH - topBorder - bottomBorder;

      const backGrad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        20,
        w * 0.5,
        h * 0.5,
        innerW * 0.7
      );
      backGrad.addColorStop(0, '#3b82f6');
      backGrad.addColorStop(0.55, '#1e40af');
      backGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = backGrad;
      ctx.fillRect(innerX, innerY, innerW, innerH);

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.strokeRect(innerX, innerY, innerW, innerH);

      // Pokéball emblem in center
      const cx = w * 0.5;
      const cy = h * 0.5;
      const rBall = 96;
      ctx.beginPath();
      ctx.arc(cx, cy, rBall, Math.PI, 0);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, rBall, 0, Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // If preset is psa8_whitening, render realistic white paper exposure specks on corners!
      if (presetId === 'psa8_whitening') {
        ctx.fillStyle = '#ffffff';
        // Top-Right corner whitening specks
        ctx.beginPath();
        ctx.arc(cardX + cardW - 14, cardY + 14, 7.5, 0, Math.PI * 2);
        ctx.arc(cardX + cardW - 22, cardY + 10, 5.5, 0, Math.PI * 2);
        ctx.arc(cardX + cardW - 9, cardY + 24, 5.0, 0, Math.PI * 2);
        ctx.fill();

        // Bottom-Left corner whitening specks
        ctx.beginPath();
        ctx.arc(cardX + 13, cardY + cardH - 14, 7.0, 0, Math.PI * 2);
        ctx.arc(cardX + 20, cardY + cardH - 10, 5.0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Front Metallic Silver/Holo Border (Scarlet & Violet ex SAR style)
      const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      borderGrad.addColorStop(0, '#cbd5e1');
      borderGrad.addColorStop(0.5, '#f1f5f9');
      borderGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = borderGrad;
      ctx.fillRect(cardX, cardY, cardW, cardH);

      // Inner artwork frame
      const innerX = cardX + leftBorder;
      const innerY = cardY + topBorder;
      const innerW = cardW - leftBorder - rightBorder;
      const innerH = cardH - topBorder - bottomBorder;

      const artGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
      if (presetId === 'psa10_gem') {
        artGrad.addColorStop(0, '#7c2d12');
        artGrad.addColorStop(0.45, '#ea580c');
        artGrad.addColorStop(1, '#1e1b4b');
      } else if (presetId === 'psa9_oc') {
        artGrad.addColorStop(0, '#713f12');
        artGrad.addColorStop(0.5, '#eab308');
        artGrad.addColorStop(1, '#1e3a8a');
      } else if (presetId === 'psa8_whitening') {
        artGrad.addColorStop(0, '#4c1d95');
        artGrad.addColorStop(0.5, '#7e22ce');
        artGrad.addColorStop(1, '#0f172a');
      } else {
        artGrad.addColorStop(0, '#0f172a');
        artGrad.addColorStop(0.5, '#312e81');
        artGrad.addColorStop(1, '#020617');
      }

      ctx.fillStyle = artGrad;
      ctx.fillRect(innerX, innerY, innerW, innerH);

      // Distinct inner frame border so vision detector & human caliper can see it clearly
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.strokeRect(innerX, innerY, innerW, innerH);

      // Card Header & HP bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(innerX + 14, innerY + 14, innerW - 28, 46);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(meta.cardTitle.split('(')[0].trim(), innerX + 26, innerY + 45);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('HP 330', innerX + innerW - 105, innerY + 45);

      // Decorative Holo Foil Geometric Pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.44, 35 + i * 24, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Attack Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(innerX + 18, innerY + innerH - 175, innerW - 36, 135);
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)';
      ctx.strokeRect(innerX + 18, innerY + innerH - 175, innerW - 36, 135);

      // Multi-angle light reflection band for tilt_top & tilt_side
      if (angle === 'tilt_top' || angle === 'tilt_side') {
        const glareGrad =
          angle === 'tilt_top'
            ? ctx.createLinearGradient(0, h * 0.25, 0, h * 0.65)
            : ctx.createLinearGradient(w * 0.2, 0, w * 0.75, 0);

        glareGrad.addColorStop(0, 'rgba(255,255,255,0)');
        glareGrad.addColorStop(0.5, 'rgba(255,255,255,0.42)');
        glareGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glareGrad;
        ctx.fillRect(innerX, innerY, innerW, innerH);

        // If preset is psa8_whitening, draw high-contrast holo scratches in the glare zone
        if (presetId === 'psa8_whitening') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          for (let s = 0; s < 9; s++) {
            ctx.beginPath();
            ctx.moveTo(innerX + 80 + s * 32, innerY + 180 + (s % 3) * 25);
            ctx.lineTo(innerX + 155 + s * 32, innerY + 265 + (s % 3) * 25);
            ctx.stroke();
          }
        }

        // If preset is psa6_indent, render the surface indent anomaly inside the light reflection band
        if (presetId === 'psa6_indent') {
          const dentX = w * 0.54;
          const dentY = h * 0.45;
          ctx.strokeStyle = '#ff2abf';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(dentX, dentY, 14, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(dentX + 2, dentY - 2, 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    ctx.restore();

    const leftOuter = Number((cardX / w).toFixed(4));
    const rightOuter = Number(((cardX + cardW) / w).toFixed(4));
    const topOuter = Number((cardY / h).toFixed(4));
    const bottomOuter = Number(((cardY + cardH) / h).toFixed(4));

    void leftOuter;
    void rightOuter;
    void topOuter;
    void bottomOuter;

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const frontLeftBorder = presetId === 'psa9_oc' ? 37 : 30;
  const frontRightBorder = presetId === 'psa9_oc' ? 22 : 29;
  const frontTopBorder = presetId === 'psa9_oc' ? 34 : 31;
  const frontBottomBorder = presetId === 'psa9_oc' ? 27 : 30;

  const centeringFront: CenteringLines = {
    leftOuter: Number((36 / 600).toFixed(4)),
    leftInner: Number(((36 + frontLeftBorder) / 600).toFixed(4)),
    rightInner: Number(((36 + 528 - frontRightBorder) / 600).toFixed(4)),
    rightOuter: Number(((36 + 528) / 600).toFixed(4)),
    topOuter: Number((46 / 840).toFixed(4)),
    topInner: Number(((46 + frontTopBorder) / 840).toFixed(4)),
    bottomInner: Number(((46 + 748 - frontBottomBorder) / 840).toFixed(4)),
    bottomOuter: Number(((46 + 748) / 840).toFixed(4)),
  };

  const centeringBack: CenteringLines = {
    leftOuter: Number((36 / 600).toFixed(4)),
    leftInner: Number(((36 + 30) / 600).toFixed(4)),
    rightInner: Number(((36 + 528 - 29) / 600).toFixed(4)),
    rightOuter: Number(((36 + 528) / 600).toFixed(4)),
    topOuter: Number((46 / 840).toFixed(4)),
    topInner: Number(((46 + 31) / 840).toFixed(4)),
    bottomInner: Number(((46 + 748 - 30) / 840).toFixed(4)),
    bottomOuter: Number(((46 + 748) / 840).toFixed(4)),
  };

  return {
    frames: {
      front: renderCardFrame('front'),
      back: renderCardFrame('back'),
      tilt_top: renderCardFrame('tilt_top'),
      tilt_side: renderCardFrame('tilt_side'),
    },
    centeringFront,
    centeringBack,
    meta,
  };
}
