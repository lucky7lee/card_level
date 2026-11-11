import React from 'react';
import { ArrowLeft, Award, CheckCircle2, Layers, Ruler, ShieldAlert } from 'lucide-react';
import { GradingCompany } from '../types/grading';
import { BRG_GRADE_TABLE, PSA_GRADE_TABLE } from '../utils/psaGrading';

interface RulesGuideProps {
  company: GradingCompany;
  onBackHome: () => void;
  onStartGrading: (company: GradingCompany) => void;
}

export const RulesGuide: React.FC<RulesGuideProps> = ({
  company,
  onBackHome,
  onStartGrading,
}) => {
  const isPSA = company === 'PSA';
  const gradeList = Object.values(isPSA ? PSA_GRADE_TABLE : BRG_GRADE_TABLE).sort(
    (a, b) => b.grade - a.grade
  );

  return (
    <div className="max-w-lg mx-auto w-full space-y-5 pb-8">
      {/* Header Banner */}
      <div
        className={`rounded-3xl p-5 border-2 shadow-xl ${
          isPSA
            ? 'border-red-600/80 bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-950'
            : 'border-blue-500/80 bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-950'
        }`}
      >
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider mb-2 bg-white/10 text-white">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>{isPSA ? 'PSA 공식 감정 가이드북' : 'BRG 공식 감정 가이드북'}</span>
        </div>
        <h2 className="text-xl font-black text-white">
          {isPSA
            ? 'PSA 포켓몬카드 등급 규정 및 규격 안내'
            : 'BRG 포켓몬카드 등급 규정 및 규격 안내'}
        </h2>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
          {isPSA
            ? '세계 최대 트레이딩 카드 감정기관 PSA(Professional Sports Authenticator)의 1~10점 정수제 심사 기준과 4대 핵심 평가 항목입니다.'
            : '대한민국 대표 TCG 전문 감정기관 BRG(Break & Grading)의 0.5점 단위 정밀 채점 규정 및 4대 서브그레이드 심사 기준입니다.'}
        </p>
      </div>

      {/* Card & Slab Specifications */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <Ruler className="w-4 h-4 text-sky-400" />
          <span>포켓몬카드 및 {company} 슬랩 표준 규격</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <div className="text-slate-400 text-[11px]">포켓몬카드 표준 크기</div>
            <div className="font-extrabold text-white mt-0.5">63.0 × 88.0 mm</div>
            <div className="text-[10px] text-slate-500 mt-0.5">표준 비율 5 : 7 (모서리 곡률 3mm)</div>
          </div>
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <div className="text-slate-400 text-[11px]">{company} 슬랩 케이스 크기</div>
            <div className="font-extrabold text-white mt-0.5">
              {isPSA ? '80.0 × 135.0 mm' : '82.0 × 135.0 mm'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {isPSA ? '초음파 밀봉 아크릴 · 레드 라벨' : 'UV 차단 고투명 케이스 · 블루/골드 라벨'}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Evaluation Criteria */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{company} 4대 핵심 심사 기준</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
            <div className="font-bold text-cyan-300">1. 센터링 (Centering - 상하/좌우 대칭)</div>
            <p className="text-slate-300 leading-relaxed">
              {isPSA
                ? '전면 테두리 좌:우 및 상:하 비율이 PSA 10은 55:45 ~ 60:40 이내, 후면은 75:25 이내여야 합니다.'
                : 'BRG 10(Gem Mint)은 전면 55:45 이내, 후면 70:30 이내여야 하며, BRG 9.5는 전면 58:42 이내를 요구합니다.'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
            <div className="font-bold text-emerald-300">2. 코너 (Corners - 4개 모서리)</div>
            <p className="text-slate-300 leading-relaxed">
              4개 모서리(좌상·우상·좌하·우하)의 직각 및 곡률 유지 상태와 특히 포켓몬카드 후면 파란색 테두리의 하얀 종이 노출(백화 현상, Whitening) 유무를 고배율로 검사합니다.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
            <div className="font-bold text-amber-300">3. 엣지 (Edges - 4면 테두리 단면)</div>
            <p className="text-slate-300 leading-relaxed">
              상·하·좌·우 4면 재단면의 매끄러움, 테두리 까짐, 그리고 홀로그램 카드 전면 테두리가 들떠 은색으로 빛나는 실버링(Silvering) 현상을 평가합니다.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
            <div className="font-bold text-rose-300">4. 표면 (Surface - 다각도 빛반사 검사)</div>
            <p className="text-slate-300 leading-relaxed">
              정면(0°)에서는 보이지 않는 홀로그램 미세 스크래치, 공장 프린트 라인(Print Line), 그리고 **표면 미세 눌림/찍힘(Indent/Dent)**을 15°~25° 사선 조명 반사로 검출합니다.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-3 text-xs text-amber-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>최저 항목 제한 규칙 (Weakest-Link Cap):</strong> 센터링·코너·엣지가 완벽(10점)하더라도, 사선 빛반사에서 <strong>표면 미세 찍힘(눌림)</strong>이 발견되면 {company} 규정상 최종 등급은 즉시 <strong>6등급 이하</strong>로 제한됩니다.
          </span>
        </div>
      </div>

      {/* Detailed Grade Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{company} 등급별 상세 기준표</span>
        </div>

        <div className="space-y-2.5">
          {gradeList.map((g) => (
            <div
              key={g.grade}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-black ${
                    isPSA ? 'text-red-400' : 'text-blue-400'
                  }`}
                >
                  {g.code}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  전면 {g.frontCenteringRule} · 후면 {g.backCenteringRule}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200">{g.titleKo}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{g.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={onBackHome}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 py-3.5 text-xs font-extrabold text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>메인 화면으로</span>
        </button>
        <button
          onClick={() => onStartGrading(company)}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-extrabold text-white shadow-lg transition ${
            isPSA
              ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
          }`}
        >
          <span>{company} 예상등급 측정 시작</span>
        </button>
      </div>
    </div>
  );
};
