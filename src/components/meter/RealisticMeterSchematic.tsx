/**
 * RealisticMeterSchematic — Високоточний Цифровий двійник
 */

import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { PHASE_COLORS } from '../../utils/constants';
import {
  TERM_START_X,
  ikkTerminalCenterX,
  ikkWireBottomY,
  ikkWireTopY,
  mTermCenterX,
} from '../../utils/meterTerminalLayout';
import type {
  VafPhaseValues,
  CtPhasePair,
  Phase,
  ConnectionScheme as Scheme,
  CtModel,
  VtModel,
  MeterElements,
} from '../../types/vaf';
import { TerminalBlock } from './TerminalBlock';
import { TestTerminalBlock } from './TestTerminalBlock';
import { voltageUsesVoltageTransformers } from '../../utils/meterConnectionCatalog';

interface RealisticMeterSchematicProps {
  scheme: Scheme;
  voltage: string;
  Uabc?: VafPhaseValues;
  Iabc?: VafPhaseValues;
  phiDeg?: VafPhaseValues;
  ctPhasePair?: CtPhasePair;
  ctModel?: CtModel;
  vtModel?: VtModel;
  meterElements?: MeterElements;
  shunted: Set<string>;
  setShunted: Dispatch<SetStateAction<Set<string>>>;
  openVoltage: Set<Phase>;
  setOpenVoltage: Dispatch<SetStateAction<Set<Phase>>>;
  hasNeutral: boolean;
}

const BUS_Y = 80;
const BUS_GAP = 35;
const VT_Y = 240;
const CT_Y = 440;
const IKK_Y = 780;
const TB_Y = 1250; 
const TB_WIRE_Y = TB_Y - 20;
const VIEWBOX_H = 1550;
const PHASE_X: Record<Phase, number> = { A: 220, B: 500, C: 780 };

function GroundingSymbol({ x, y, color = "#94A3B8" }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={0} y1={0} x2={0} y2={15} stroke={color} strokeWidth={1.5} />
      <line x1={-10} y1={15} x2={10} y2={15} stroke={color} strokeWidth={1.5} />
      <line x1={-6} y1={19} x2={6} y2={19} stroke={color} strokeWidth={1.5} />
      <line x1={-3} y1={23} x2={3} y2={23} stroke={color} strokeWidth={1.5} />
    </g>
  );
}

function PrimaryDisconnector({ x, y, phase, isOpen }: { x: number; y: number; phase: Phase; isOpen: boolean }) {
  const col = PHASE_COLORS[phase];
  return (
    <g transform={`translate(${x}, ${y})`}>
       <circle cx={0} cy={0} r={3} fill={col} />
       <circle cx={20} cy={-12} r={3} fill={col} />
       <line x1={0} y1={0} x2={isOpen ? 10 : 20} y2={isOpen ? -20 : -12} stroke={col} strokeWidth={2.5} />
    </g>
  );
}

/** Пряме підключення напруги з шини (0,4 кВ без ТН): шина → запобіжник → точка з’єднання з ВПК (як після ТН). */
function DirectVoltageFromBus({
  phase,
  busY,
  tapY,
  uSec,
}: {
  phase: Phase;
  busY: number;
  tapY: number;
  uSec?: number;
}) {
  const col = PHASE_COLORS[phase];
  const x = PHASE_X[phase];
  const fuseY = tapY - 12;
  return (
    <g>
      <line x1={x} y1={busY} x2={x} y2={fuseY - 14} stroke={col} strokeWidth={2} strokeDasharray="4 3" opacity={0.85} />
      <FuseSymbol x={x} y={fuseY} phase={phase} />
      <line x1={x} y1={fuseY + 10} x2={x} y2={tapY} stroke={col} strokeWidth={1.5} />
      <text x={x + 38} y={fuseY - 6} fill="#94a3b8" fontSize="9" fontWeight="700">
        пряме Uф{uSec != null ? ` ≈${uSec.toFixed(0)}В` : ''}
      </text>
    </g>
  );
}

function FuseSymbol({ x, y, phase }: { x: number; y: number; phase: Phase }) {
  const col = PHASE_COLORS[phase];
  return (
    <g transform={`translate(${x}, ${y})`}>
       <rect x={-4} y={-10} width={8} height={20} fill="#0F172A" stroke={col} strokeWidth={1} rx={1} />
       <line x1={0} y1={-10} x2={0} y2={10} stroke={col} strokeWidth={0.5} strokeDasharray="2,1" />
    </g>
  );
}

function PrimaryBus({ phase, y }: { phase: Phase; y: number }) {
  const col = PHASE_COLORS[phase];
  return (
    <g>
      <rect x={50} y={y - 6} width={900} height={12} fill={col} opacity={0.4} rx={4} />
      <text x={965} y={y + 4} fill={col} fontSize="14" fontWeight="900" opacity={0.8}>L{phase === 'A' ? '1' : phase === 'B' ? '2' : '3'}</text>
    </g>
  );
}

function CTSymbol({ x, y, phase, I, model, isShunted, hasCt }: { x: number; y: number; phase: Phase; I?: number; model: CtModel; isShunted: boolean; hasCt: boolean }) {
  if (!hasCt) return null;
  const col = PHASE_COLORS[phase];
  const isTFZM = model === 'TFZM';
  
  return (
    <g>
      <line x1={x} y1={y - 120} x2={x} y2={y - 45} stroke={col} strokeWidth={8} />
      <PrimaryDisconnector x={x} y={y-140} phase={phase} isOpen={false} />

      {isTFZM ? (
        <g>
          <ellipse cx={x} cy={y} rx={35} ry={45} fill="#1F2937" stroke={col} strokeWidth={2} />
          <rect x={x - 40} y={y - 5} width={80} height={10} fill="#374151" rx={2} />
          <text x={x+45} y={y} textAnchor="start" fill={col} fontSize="10" fontWeight="black" opacity={0.6}>ТФЗМ</text>
        </g>
      ) : (
        <g>
          <rect x={x - 30} y={y - 40} width="60" height="85" rx={4} fill="#312E81" stroke={col} strokeWidth={2} />
          <text x={x+35} y={y} textAnchor="start" fill={col} fontSize="10" fontWeight="black" opacity={0.6}>ТОЛ</text>
        </g>
      )}

      <g transform={`translate(${x}, ${y + 55})`}>
         <rect x={-25} y={-10} width={50} height={30} rx={4} fill="#0F172A" stroke={col} strokeWidth={1} />
         <circle cx={-12} cy={5} r={3.5} fill="#EAB308" />
         <circle cx={12} cy={5} r={3.5} fill="#EAB308" />
         <text x={-15} y={25} textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">И1</text>
         <text x={15} y={25} textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">И2</text>
         {isShunted && <line x1={-12} y1={5} x2={12} y2={5} stroke="#F59E0B" strokeWidth={5} strokeLinecap="round" />}
         <GroundingSymbol x={12} y={15} color={col} />
      </g>
      {I !== undefined && <text x={x} y={y + 115} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="black">{I.toFixed(2)} А</text>}
    </g>
  );
}

function VTSymbol({ x, y, phase, U, is3phModel }: { x: number; y: number; phase: Phase; U?: number; model: VtModel; is3phModel: boolean }) {
  const col = PHASE_COLORS[phase];
  const busY = BUS_Y + (phase === 'A' ? 0 : phase === 'B' ? BUS_GAP : BUS_GAP * 2);

  if (is3phModel) {
     if (phase !== 'B') return null;
     return (
       <g>
          <rect x={PHASE_X.A - 20} y={y - 10} width={PHASE_X.C - PHASE_X.A + 40} height="70" rx={6} fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <text x={PHASE_X.B} y={y + 35} textAnchor="middle" fill="#94A3B8" fontSize="20" fontWeight="black" opacity={0.3}>НТМІ / НАМІ</text>
          
          {(['A', 'B', 'C'] as Phase[]).map(p => {
             const px = PHASE_X[p];
              const pCol = PHASE_COLORS[p];
              return (
                <g key={p}>
                   <path d={`M${px},${BUS_Y + (p==='A'?0:p==='B'?BUS_GAP:BUS_GAP*2)} L${px},${y - 10}`} stroke={pCol} strokeWidth="1.5" strokeDasharray="3,3" />
                   <ellipse cx={px} cy={y-10} rx={8} ry={12} fill="#334155" stroke={pCol} />
                   <circle cx={px} cy={y + 60} r={5} fill="#EAB308" />
                   <FuseSymbol x={px} y={y + 100} phase={p} />
                   <text x={px} y={y+130} textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="black">{U?.toFixed(1)} В</text>
                </g>
              );
          })}
          <GroundingSymbol x={PHASE_X.C + 60} y={y + 50} />
       </g>
     );
  }

  return (
    <g>
      <path d={`M${x},${busY} L${x},${y - 20}`} stroke={col} strokeWidth="1.5" strokeDasharray="5,2" opacity={0.6} />
      <path d={`M${x-25},${y+50} L${x-15},${y-20} L${x+15},${y-20} L${x+25},${y+50} Z`} fill="#1E293B" stroke={col} strokeWidth={2} />
      <circle cx={x} cy={y-20} r={5} fill="#475569" stroke={col} />
      <circle cx={x} cy={y + 50} r={5} fill="#EAB308" />
      <FuseSymbol x={x} y={y + 100} phase={phase} />
      <GroundingSymbol x={x + 15} y={y + 55} color={col} />
      {U !== undefined && <text x={x} y={y + 130} textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="black">{U.toFixed(1)} В</text>}
    </g>
  );
}

export function RealisticMeterSchematic({
  scheme, voltage, Uabc, Iabc, phiDeg, ctPhasePair = 'AC', ctModel = 'TOL', vtModel = '3x1ph', 
  meterElements = 3, shunted, setShunted, openVoltage, setOpenVoltage, hasNeutral
}: RealisticMeterSchematicProps) {
  const is3 = scheme === '3_TS';
  const isAron = scheme === '2_TS';
  const hasVt = voltageUsesVoltageTransformers(voltage);
  
  const currentPhasesSet = useMemo(() => {
    if (is3) return new Set<Phase>(['A', 'B', 'C']);
    const p = new Set<Phase>();
    ctPhasePair.split('').forEach(char => p.add(char as Phase));
    return p;
  }, [is3, ctPhasePair]);

  const toggleShunt = (shuntId: string) => {
    setShunted(prev => {
      const n = new Set(prev);
      if (n.has(shuntId)) n.delete(shuntId); else n.add(shuntId);
      return n;
    });
  };

  const toggleVoltage = (ph: Phase) => {
    setOpenVoltage(prev => {
      const n = new Set(prev);
      if (n.has(ph)) n.delete(ph); else n.add(ph);
      return n;
    });
  };

  const renderWiring = () => {
    const wires: React.ReactNode[] = [];
    const IKK_TOP = ikkWireTopY(IKK_Y);
    const IKK_BOTTOM = ikkWireBottomY(IKK_Y);

    const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string, width: number, dashed = false) => (
      <path key={`wire-${x1}-${y1}-${x2}-${y2}`} 
            d={`M ${x1},${y1} C ${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`}
            stroke={color} strokeWidth={width} fill="none" strokeDasharray={dashed ? "5,5" : ""} />
    );

    // MAPPING LOGIC FOR METER PINS
    const getMeterPinX = (id: number) => {
       if (meterElements === 3) {
          return mTermCenterX(id);
       } else {
          // 2-element linear mapping inside the TerminalBlock
          // Step matches (t.n - 1) * (W+GAP) in TerminalBlock.tsx
          // Fixed start at (TERM_START_X)
          return TERM_START_X + (id - 1) * (52 + 4) + 26; // mTermCenterX equivalent
       }
    };
    
    (['A', 'B', 'C'] as Phase[]).map(ph => {
      const col = PHASE_COLORS[ph];
      const baseVpcId = ph === 'A' ? 1 : ph === 'B' ? 5 : 9;

      const xU = ikkTerminalCenterX(baseVpcId);
      const xI1 = ikkTerminalCenterX(baseVpcId + 1);
      const xI2 = ikkTerminalCenterX(baseVpcId + 2);

      const hasCt = currentPhasesSet.has(ph);

      // 1. VT Secondary (after fuse) to VPC Top
      const vtOutX = PHASE_X[ph];
      const vtOutY = VT_Y + 110;
      wires.push(drawLine(vtOutX, vtOutY, xU, IKK_TOP, col, 1.5, openVoltage.has(ph)));

      // 2. CT Secondary to VPC Top
      if (hasCt) {
        wires.push(drawLine(PHASE_X[ph] - 12, CT_Y + 60, xI1, IKK_TOP, col, 2.5));
        wires.push(drawLine(PHASE_X[ph] + 12, CT_Y + 60, xI2, IKK_TOP, col, 2.5, true));
      }

      // 3. VPC Bottom to Meter TB (Dynamic Mapping)
      const opU = openVoltage.has(ph) ? 0.2 : 1;
      const opI = shunted.has(`${ph}-23`) ? 0.2 : 1;

      let mPinU = 0;
      let mPinI1 = 0;
      let mPinI2 = 0;

      if (meterElements === 3) {
         mPinU = ph === 'A' ? 2 : ph === 'B' ? 5 : 8;
         mPinI1 = ph === 'A' ? 1 : ph === 'B' ? 4 : 7;
         mPinI2 = ph === 'A' ? 3 : ph === 'B' ? 6 : 9;
      } else {
         // 2-element (SL7000 style)
         if (ph === 'A') { mPinU = 2; mPinI1 = 1; mPinI2 = 3; }
         if (ph === 'B') { mPinU = 4; } // Common ref
         if (ph === 'C') { mPinU = 5; mPinI1 = 6; mPinI2 = 7; }
      }

      const hasCurrentMapping = mPinI1 > 0 && hasCt;

      if (mPinU > 0) {
        wires.push(<g key={`b-u-${ph}`} opacity={opU}>
          {drawLine(xU, IKK_BOTTOM, getMeterPinX(mPinU), TB_WIRE_Y, col, 1.5)}
        </g>);
      }

      if (hasCurrentMapping) {
        wires.push(<g key={`b-i-${ph}`} opacity={opI}>
          {drawLine(xI1, IKK_BOTTOM, getMeterPinX(mPinI1), TB_WIRE_Y, col, 2.5)}
          {drawLine(xI2, IKK_BOTTOM, getMeterPinX(mPinI2), TB_WIRE_Y, col, 2.5)}
        </g>);
      }
    });

    // 4. Final Common Neutral to Meter Pin 10 or 8
    if (hasNeutral) {
      const pinN = meterElements === 3 ? 10 : 8;
      wires.push(drawLine(ikkTerminalCenterX(13), IKK_BOTTOM, getMeterPinX(pinN), TB_WIRE_Y, "#3B82F6", 2));
    }

    return wires;
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-2 sm:p-4 shadow-2xl overflow-hidden transition-all duration-700">
      <div className="overflow-x-auto w-full">
        <svg viewBox={`0 0 1000 ${VIEWBOX_H}`} width="100%" className="w-full h-auto bg-slate-900/40 rounded-3xl" style={{ minWidth: 800 }}>
           {/* Grid Background */}
           <defs>
             <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
               <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1E293B" strokeWidth="0.5" />
             </pattern>
           </defs>
           <rect width="1000" height={VIEWBOX_H} fill="url(#grid)" />

           <PrimaryBus phase="A" y={BUS_Y} />
           <PrimaryBus phase="B" y={BUS_Y + BUS_GAP} />
           <PrimaryBus phase="C" y={BUS_Y + BUS_GAP * 2} />
           
           {hasVt && vtModel === '1x3ph' ? (
             <VTSymbol x={PHASE_X.B} y={VT_Y} phase="B" model={vtModel} is3phModel U={Uabc?.B} />
           ) : hasVt ? (
             (['A', 'B', 'C'] as Phase[]).map((ph) => (
               <VTSymbol key={ph} x={PHASE_X[ph]} y={VT_Y} phase={ph} model={vtModel} is3phModel={false} U={Uabc?.[ph]} />
             ))
           ) : (
             (['A', 'B', 'C'] as Phase[]).map((ph) => (
               <DirectVoltageFromBus
                 key={`dv-${ph}`}
                 phase={ph}
                 busY={BUS_Y + (ph === 'A' ? 0 : ph === 'B' ? BUS_GAP : BUS_GAP * 2)}
                 tapY={VT_Y + 110}
                 uSec={Uabc?.[ph]}
               />
             ))
           )}

           {(['A', 'B', 'C'] as Phase[]).map(ph => (
             <CTSymbol key={ph} x={PHASE_X[ph]} y={CT_Y} phase={ph} I={Iabc?.[ph]} model={ctModel} isShunted={shunted.has(`${ph}-23`)} hasCt={currentPhasesSet.has(ph)} />
           ))}

           <TestTerminalBlock x={TERM_START_X} y={IKK_Y} shunted={shunted} openVoltagePhases={openVoltage} onToggleShunt={toggleShunt} onToggleVoltage={toggleVoltage} />
           <TerminalBlock x={TERM_START_X} y={TB_Y} highlights={{}} scheme={scheme} ctPhasePair={ctPhasePair} meterElements={meterElements} Uabc={Uabc} Iabc={Iabc} phiDeg={phiDeg} />
           <g>{renderWiring()}</g>
           
           {/* Detailed Labels for nodes */}
           <text x="50" y={VT_Y} fill="#64748B" fontSize="12" fontWeight="bold" className="italic">Трансформатори напруги (ТН)</text>
           <text x="50" y={CT_Y} fill="#64748B" fontSize="12" fontWeight="bold" className="italic">Трансформатори струму (ТС)</text>
           <text x="50" y={IKK_Y - 20} fill="#64748B" fontSize="12" fontWeight="bold" className="italic">Випробувальна колодка (ВПК)</text>
           <text x="50" y={TB_Y - 50} fill="#64748B" fontSize="12" fontWeight="bold" className="italic">Лічильник ({meterElements}-ЕЛ)</text>
        </svg>
      </div>
      <div className="flex flex-col sm:flex-row justify-between mt-8 items-center border-t border-slate-800 pt-6 gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter italic">Digital Twin: Unified Diagnostic Engine</h3>
          <p className="text-[11px] text-blue-400 font-bold uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            {voltage} кВ • {isAron ? 'Схема Арона' : 'Схема Зірка'} • {meterElements}-ЕЛ Лічильник
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-mono">
           ENGINE_STATE: SYNCED | SVG_MODE: VECTOR_FULL
        </div>
      </div>
    </div>
  );
}
