import { CapturedFrames, FinalPSAReport } from '../types/grading';

export interface AIVisionResponse {
  cardNameDetected?: string;
  expertSummary: string;
  recommendedGradeOverride?: number;
}

function stripDataUrlPrefix(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    return { mimeType: 'image/jpeg', base64: dataUrl };
  }
  return { mimeType: match[1], base64: match[2] };
}

export async function runGeminiMultiAngleAnalysis(
  apiKey: string,
  frames: CapturedFrames,
  onDeviceDraft: FinalPSAReport
): Promise<AIVisionResponse> {
  const parts: Array<Record<string, unknown>> = [
    {
      text: `당신은 PSA(Professional Sports Authenticator) 포켓몬카드 수석 그레이더입니다.
사용자가 스마트폰으로 촬영한 다각도 포켓몬카드 이미지(정면 0°, 후면 0°, 상하 20° 빛반사, 좌우 20° 사선 스캔)와 온디바이스 비전 측정치를 바탕으로 정밀 PSA 예상 등급 소견을 작성해 주세요.

[온디바이스 비전 측정 데이터]
- 전면 센터링 좌우: ${onDeviceDraft.frontCentering.ratioTextLR}, 상하: ${onDeviceDraft.frontCentering.ratioTextTB}
- 후면 센터링 좌우: ${onDeviceDraft.backCentering.ratioTextLR}, 상하: ${onDeviceDraft.backCentering.ratioTextTB}
- 코너 평균 서브그레이드: ${onDeviceDraft.subgrades.corners}
- 표면 서브그레이드: ${onDeviceDraft.subgrades.surface} (찍힘 감지 여부: ${
        onDeviceDraft.surface.indentOrCreaseDetected ? '감지됨' : '없음'
      })
- 온디바이스 예상 등급: PSA ${onDeviceDraft.predictedGrade}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "cardNameDetected": "식별된 포켓몬카드 이름 및 번호",
  "expertSummary": "센터링, 후면 파란 테두리 코너 백화, 사선 빛반사에서 관찰된 홀로그램 스크래치/프린트라인/찍힘 여부에 대한 3~4문장의 전문적인 감정 총평",
  "recommendedGradeOverride": 10
}`
    }
  ];

  const orderedAngles: Array<keyof CapturedFrames> = ['front', 'back', 'tilt_top', 'tilt_side'];
  for (const key of orderedAngles) {
    const dataUrl = frames[key];
    if (dataUrl) {
      const { mimeType, base64 } = stripDataUrlPrefix(dataUrl);
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64
        }
      });
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey.trim()
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API 오류 (${response.status}): ${errText.slice(0, 140)}`);
  }

  const json = await response.json();
  const rawText =
    json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(rawText);

  return {
    cardNameDetected: parsed.cardNameDetected,
    expertSummary:
      parsed.expertSummary ||
      '다각도 이미지 분석이 완료되었습니다. 센터링 및 코너/표면 상태를 종합하여 등급을 산출했습니다.',
    recommendedGradeOverride:
      typeof parsed.recommendedGradeOverride === 'number'
        ? parsed.recommendedGradeOverride
        : undefined
  };
}
