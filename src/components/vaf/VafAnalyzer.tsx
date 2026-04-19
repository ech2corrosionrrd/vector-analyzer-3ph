import { useMemo, useState, useCallback, useEffect } from 'react';
import { Gauge, RotateCcw, Layout, FileText } from 'lucide-react';
import { RealisticMeterSchematic } from '../meter/RealisticMeterSchematic';
import { VafPowerSection } from './VafPowerSection';
import { VafDiagnosticsSection } from './VafDiagnosticsSection';
import { MeterConnectionSchematic } from '../meter/MeterConnectionSchematic';
import {
  computeCurrentPhasors,
  runVafDiagnostics,
  buildVafTextReport,
  buildMeterWireHighlights,
  buildPhaseAnalysisSummary,
  computeTransformationK,
} from '../../utils/vafAnalysis';
import { VOLTAGE_PRESETS } from '../../utils/ratios';
import { calculatePhasePower, measurementsToPhiDeg } from '../../utils/calculations';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ConnectionVariantPanel } from '../meter/ConnectionVariantPanel';
import { WiringTable } from '../meter/WiringTable';
import { getVoltagePreset } from '../../utils/meterConnectionCatalog';
import type {
  ConnectionScheme,
  VafPhaseValues,
  Phase,
  TransformerRatios,
  EnergyFlow,
  CtModel,
  VtModel,
  Measurements,
  VafExportData,
  VafPowerResults,
  CtPhasePair,
  MeterElements,
  AngleMode,
} from '../../types/vaf';

interface VafAnalyzerProps {
  onExportDataChange?: (data: VafExportData) => void;
  linkedMeasurements?: Measurements;
  /** Узгоджує φ з класичним режимом кутів (відносні / φ). */
  angleMode?: AngleMode;
  linkedScheme?: ConnectionScheme;
  voltageLevel?: string;
  ratios?: TransformerRatios;
  hasNeutral?: boolean;
  onLinkedChange?: (
    measurements?: Measurements, 
    scheme?: ConnectionScheme, 
    voltageLevel?: string, 
    ratios?: TransformerRatios,
    hasNeutral?: boolean
  ) => void;

  // Metadata Props (Unified State)
  objectName: string; setObjectName: (v: string) => void;
  feeder: string; setFeeder: (v: string) => void;
  meterType: string; setMeterType: (v: string) => void;
  meterNumber: string; setMeterNumber: (v: string) => void;
  transformerTs: string; setTransformerTs: (v: string) => void;
  transformerTn: string; setTransformerTn: (v: string) => void;
  dateStr: string; setDateStr: (v: string) => void;
  energyFlow: EnergyFlow; setEnergyFlow: (v: EnergyFlow) => void;
  ctPhasePair: CtPhasePair; setCtPhasePair: (v: CtPhasePair) => void;
  ctModel: CtModel; setCtModel: (v: CtModel) => void;
  vtModel: VtModel; setVtModel: (v: VtModel) => void;
  meterElements: MeterElements; setMeterElements: (v: MeterElements) => void;
}

export function VafAnalyzer({ 
  onExportDataChange, 
  linkedMeasurements, 
  angleMode = 'phi',
  linkedScheme,
  voltageLevel = '0.4',
  ratios = { IPrim: 200, ISec: 5, UPrim: 400, USec: 400 },
  hasNeutral = true,
  onLinkedChange,

  objectName, setObjectName,
  feeder, setFeeder,
  meterType, setMeterType,
  meterNumber, setMeterNumber,
  transformerTs, setTransformerTs,
  transformerTn, setTransformerTn,
  dateStr,
  energyFlow, setEnergyFlow,
  ctPhasePair, setCtPhasePair,
  ctModel, setCtModel,
  vtModel, setVtModel,
  meterElements, setMeterElements
}: VafAnalyzerProps) {
  
  // Input states synchronized with props
  const [Uabc, setUabc] = useState<VafPhaseValues>({ A: 220, B: 220, C: 220 });
  const [Iabc, setIabc] = useState<VafPhaseValues>({ A: 3.2, B: 3.2, C: 3.2 });
  const [phiDeg, setPhiDeg] = useState<VafPhaseValues>({ A: 25, B: 25, C: 25 });

  const [shunted, setShunted] = useState<Set<string>>(new Set());
  const [openVoltage, setOpenVoltage] = useState<Set<Phase>>(new Set());

  const [copyHint, setCopyHint] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Sync from props when they change (external state -> local mirror for the analyzer panel).
  // This is an intentional prop-to-state sync; plain deriving via useMemo is not an option because
  // the user can still edit these values locally in the form when no linkedMeasurements are provided.
  useEffect(() => {
    if (linkedMeasurements) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUabc({ A: linkedMeasurements.A.U, B: linkedMeasurements.B.U, C: linkedMeasurements.C.U });
      setIabc({ A: linkedMeasurements.A.I, B: linkedMeasurements.B.I, C: linkedMeasurements.C.I });
      setPhiDeg(measurementsToPhiDeg(linkedMeasurements, angleMode));
    }
  }, [linkedMeasurements, angleMode]);

  const updateGlobalParam = useCallback((params: {
    measurements?: Measurements,
    scheme?: ConnectionScheme,
    voltageLevel?: string,
    ratios?: TransformerRatios,
    hasNeutral?: boolean
  }) => {
    onLinkedChange?.(
      params.measurements ?? linkedMeasurements, 
      params.scheme ?? linkedScheme, 
      params.voltageLevel ?? voltageLevel, 
      params.ratios ?? ratios, 
      params.hasNeutral ?? hasNeutral
    );
  }, [onLinkedChange, linkedMeasurements, linkedScheme, voltageLevel, ratios, hasNeutral]);

  const handlePanelVoltageLevel = useCallback(
    (level: string, r: TransformerRatios) => {
      const preset = getVoltagePreset(level);
      if (preset) {
        setUabc({ A: preset.Usec, B: preset.Usec, C: preset.Usec });
      }
      if (linkedMeasurements && preset) {
        updateGlobalParam({
          voltageLevel: level,
          ratios: r,
          measurements: {
            A: { ...linkedMeasurements.A, U: preset.Usec },
            B: { ...linkedMeasurements.B, U: preset.Usec },
            C: { ...linkedMeasurements.C, U: preset.Usec },
          },
        });
      } else {
        updateGlobalParam({ voltageLevel: level, ratios: r });
      }
    },
    [linkedMeasurements, updateGlobalParam],
  );

  const handleSchemeFromPanel = useCallback(
    (s: ConnectionScheme) => {
      updateGlobalParam({ scheme: s });
    },
    [updateGlobalParam],
  );

  const handleHasNeutralFromPanel = useCallback(
    (v: boolean) => {
      updateGlobalParam({ hasNeutral: v });
    },
    [updateGlobalParam],
  );

  // Handle local cell changes
  const setPhaseField = (obj: VafPhaseValues, setObj: (v: VafPhaseValues) => void, phase: Phase, val: number) => {
    const nextVaf = { ...obj, [phase]: val };
    setObj(nextVaf);

    if (linkedMeasurements) {
      const nextMeasurements: Measurements = { ...linkedMeasurements };
      const cur = nextMeasurements[phase];
      let nextPhase = {
        ...cur,
        U: obj === Uabc ? val : cur.U,
        I: obj === Iabc ? val : cur.I,
        phi: obj === phiDeg ? val : cur.phi,
      };
      if (obj === phiDeg && angleMode === 'relative') {
        nextPhase = { ...nextPhase, angleI: nextPhase.angleU - val };
      }
      nextMeasurements[phase] = nextPhase;
      updateGlobalParam({ measurements: nextMeasurements });
    }
  };

  const currentPhasorsRect = useMemo(() => {
    return computeCurrentPhasors(
      linkedScheme || '3_TS',
      Iabc,
      phiDeg,
      ctPhasePair,
      energyFlow
    );
  }, [linkedScheme, Iabc, phiDeg, ctPhasePair, energyFlow]);

  const diagnostics = useMemo(() => {
    return runVafDiagnostics({
      scheme: linkedScheme || '3_TS',
      Iabc,
      phiDeg,
      currentPhasorsRect,
      energyFlow
    });
  }, [linkedScheme, Iabc, phiDeg, currentPhasorsRect, energyFlow]);

  const wireHighlights = useMemo(() => buildMeterWireHighlights(diagnostics), [diagnostics]);
  const phaseSummary = useMemo(() => buildPhaseAnalysisSummary(diagnostics, wireHighlights), [diagnostics, wireHighlights]);

  const powerResults = useMemo((): VafPowerResults => {
    const K = computeTransformationK(ratios);
    const results: VafPowerResults = {
      phases: {
        A: { P: 0, Q: 0, S: 0, cosPhi: 1, Ppri: 0, Qpri: 0, Spri: 0 },
        B: { P: 0, Q: 0, S: 0, cosPhi: 1, Ppri: 0, Qpri: 0, Spri: 0 },
        C: { P: 0, Q: 0, S: 0, cosPhi: 1, Ppri: 0, Qpri: 0, Spri: 0 },
      },
      totalPsec: 0,
      totalQsec: 0,
      totalSsec: 0,
      totalPpri: 0,
      totalQpri: 0,
      totalSpri: 0,
      avgCosPhi: 0,
      Ktotal: K,
    };
    
    (['A', 'B', 'C'] as Phase[]).forEach(p => {
      const pwr = calculatePhasePower(Uabc[p], Iabc[p], phiDeg[p]);
      results.phases[p] = {
        P: pwr.P,
        Q: pwr.Q,
        S: pwr.S,
        cosPhi: pwr.cosPhi,
        Ppri: pwr.P * K,
        Qpri: pwr.Q * K,
        Spri: pwr.S * K,
      };
      results.totalPsec += pwr.P;
      results.totalQsec += pwr.Q;
      results.totalSsec += pwr.S;
    });
    
    results.totalPpri = results.totalPsec * K;
    results.totalQpri = results.totalQsec * K;
    results.totalSpri = results.totalSsec * K;
    results.avgCosPhi = results.totalSsec > 0 ? results.totalPsec / results.totalSsec : 1;
    
    return results;
  }, [Uabc, Iabc, phiDeg, ratios]);

  const reportText = useMemo(() => {
    return buildVafTextReport({
      objectName,
      dateStr,
      voltageLevel,
      hasNeutral,
      scheme: linkedScheme || '3_TS',
      energyFlow,
      ratios,
      Uabc,
      Iabc,
      phiDeg,
      K: computeTransformationK(ratios),
      verdicts: diagnostics,
      power: powerResults,
      ctPhasePair,
      vtModel,
      meterElements,
    });
  }, [objectName, dateStr, voltageLevel, hasNeutral, linkedScheme, energyFlow, ratios, Uabc, Iabc, phiDeg, diagnostics, powerResults, ctPhasePair, vtModel, meterElements]);

  useEffect(() => {
    if (onExportDataChange) {
      onExportDataChange({
        objectName, feeder, meterType, meterNumber, transformerTs, transformerTn, dateStr,
        voltageLevel, hasNeutral, scheme: linkedScheme || '3_TS', energyFlow, ctPhasePair,
        ctModel, vtModel, meterElements, ratios, Uabc, Iabc, phiDeg, K: computeTransformationK(ratios),
        verdicts: diagnostics, power: powerResults
      });
    }
  }, [
    objectName, feeder, meterType, meterNumber, transformerTs, transformerTn, dateStr,
    voltageLevel, hasNeutral, linkedScheme, energyFlow, ctPhasePair,
    ctModel, vtModel, meterElements, ratios, Uabc, Iabc, phiDeg, diagnostics, powerResults, onExportDataChange
  ]);

  const handleCopyReport = useCallback(() => {
    navigator.clipboard.writeText(reportText).then(() => {
      setCopyHint('Звіт скопійовано!');
      setTimeout(() => setCopyHint(''), 3000);
    });
  }, [reportText]);

  const handleReset = () => {
    const preset = VOLTAGE_PRESETS['0.4'];
    const resetMeasurements: Measurements = {
      A: { U: 220, I: 3.2, angleU: 0, angleI: 335, phi: 25 },
      B: { U: 220, I: 3.2, angleU: 240, angleI: 215, phi: 25 },
      C: { U: 220, I: 3.2, angleU: 120, angleI: 95, phi: 25 },
    };
    updateGlobalParam({
      measurements: resetMeasurements,
      scheme: '3_TS',
      voltageLevel: '0.4',
      ratios: { IPrim: preset.IPrim, ISec: preset.ISec, UPrim: preset.UPrim, USec: preset.USec },
      hasNeutral: true
    });
    setShunted(new Set());
    setOpenVoltage(new Set());
    
    // Exhaustive metadata reset
    setObjectName('');
    setFeeder('');
    setMeterType('');
    setMeterNumber('');
    setTransformerTs('');
    setTransformerTn('');
    setCtModel('TOL');
    setVtModel('3x1ph');
    setMeterElements(3);
    setEnergyFlow('consumption');
    setCtPhasePair('AC');

    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-full overflow-x-hidden">
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="Скинути всі дані?"
        message="Це видалить всі введені виміри та налаштування трансформаторів."
      />

      <section className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-4 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
               <Layout className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Схема та Звіт
              </h2>
              <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">Цифровий відбиток вузла обліку</p>
            </div>
          </div>
          <button 
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 px-4 py-2 rounded-xl border border-slate-700 hover:border-red-500/50 transition-all font-bold text-xs sm:text-sm shadow-lg whitespace-nowrap"
          >
            <RotateCcw size={18} />
            Скинути виміри
          </button>
        </div>

        <div className="space-y-8">
          <ConnectionVariantPanel
            voltageLevel={voltageLevel}
            onVoltageLevelChange={handlePanelVoltageLevel}
            scheme={linkedScheme || '3_TS'}
            onSchemeChange={handleSchemeFromPanel}
            ctPhasePair={ctPhasePair}
            onCtPhasePairChange={setCtPhasePair}
            vtModel={vtModel}
            onVtModelChange={setVtModel}
            meterElements={meterElements}
            onMeterElementsChange={setMeterElements}
            hasNeutral={hasNeutral}
            onHasNeutralChange={handleHasNeutralFromPanel}
            energyFlow={energyFlow}
            onEnergyFlowChange={setEnergyFlow}
          />

          {/* Top Section: Identification & Metadata */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
             <div className="xl:col-span-4 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                   <FileText size={18} className="text-blue-500" />
                   <h3 className="text-xs uppercase tracking-widest font-black text-slate-400">Ідентифікація</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 bg-slate-950/30 p-5 rounded-2xl border border-slate-800/50">
                  <label className="block space-y-1.5">
                    <span className="text-xs uppercase tracking-wide text-slate-500 font-bold ml-1">Об'єкт</span>
                    <input type="text" className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-700" value={objectName} onChange={e => setObjectName(e.target.value)} placeholder="Назва ПС / Об'єкта" />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs uppercase tracking-wide text-slate-500 font-bold ml-1">Фідер</span>
                    <input type="text" className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-700" value={feeder} onChange={e => setFeeder(e.target.value)} placeholder="Диспетчерське найменування" />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                      <label className="block space-y-1.5">
                        <span className="text-xs uppercase tracking-wide text-slate-500 font-bold ml-1">Тип ЛМ</span>
                        <input type="text" className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-700 text-xs" value={meterType} onChange={e => setMeterType(e.target.value)} placeholder="ACE 6000..." />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs uppercase tracking-wide text-slate-500 font-bold ml-1">№ ЛМ</span>
                        <input type="text" className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-700 text-xs" value={meterNumber} onChange={e => setMeterNumber(e.target.value)} placeholder="000123..." />
                      </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-5 bg-slate-950/50 border border-slate-700/50 rounded-2xl font-mono text-[11px]">
                    <div className="space-y-1">
                        <span className="text-slate-500 uppercase block">I перв: {ratios.IPrim} А</span>
                        <span className="text-slate-500 uppercase block">I втор: {ratios.ISec} А</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-slate-500 uppercase block">U перв: {ratios.UPrim} В</span>
                        <span className="text-slate-500 uppercase block">U втор: {ratios.USec} В</span>
                    </div>
                </div>
             </div>

             <div className="xl:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                      <Gauge size={18} className="text-cyan-400" />
                      <h3 className="text-xs uppercase tracking-widest font-black text-slate-400">Виміри та Налаштування</h3>
                   </div>
                   <div className="flex items-center gap-4 text-xs font-bold">
                       <span className={hasNeutral ? "text-blue-400" : "text-slate-600"}>{hasNeutral ? "З НУЛЕМ" : "БЕЗ НУЛЯ"}</span>
                       <span className="text-cyan-500">{linkedScheme === '2_TS' ? "АРОН" : "ЗІРКА"}</span>
                       <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">{voltageLevel} кВ</span>
                   </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-950/30">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-widest font-black">
                      <tr>
                        <th className="px-4 py-4 text-center">Фаза</th>
                        <th className="px-4 py-4 text-center">U (В)</th>
                        <th className="px-4 py-4 text-center">I (А)</th>
                        <th className="px-4 py-4 text-center">φ (°)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(['A', 'B', 'C'] as Phase[]).map(p => (
                        <tr key={p} className="hover:bg-slate-800/10 transition-colors">
                          <td className="px-4 py-4 font-black text-slate-300 text-center">{p}</td>
                          <td className="px-2 py-2">
                            <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-1.5 text-center outline-none font-mono" value={Uabc[p]} onChange={e => setPhaseField(Uabc, setUabc, p, Number(e.target.value))} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-1.5 text-center outline-none font-mono text-cyan-400" value={Iabc[p]} onChange={e => setPhaseField(Iabc, setIabc, p, Number(e.target.value))} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" step="1" className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-1.5 text-center outline-none font-mono text-purple-400" value={phiDeg[p]} onChange={e => setPhaseField(phiDeg, setPhiDeg, p, Number(e.target.value))} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <VafDiagnosticsSection 
                      verdicts={diagnostics} 
                      reportText={reportText}
                      copyReport={handleCopyReport}
                      copyHint={copyHint}
                   />
                   <div className="bg-slate-950/20 border border-slate-800/50 rounded-2xl p-4 flex flex-col justify-between">
                       <span className="text-[10px] text-slate-500 uppercase font-bold mb-2">Конструкція ТС (вигляд)</span>
                       <select
                          className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 rounded-lg px-2 py-2 text-xs text-slate-200 transition-colors"
                          value={ctModel}
                          onChange={(e) => setCtModel(e.target.value as CtModel)}
                       >
                          <option value="TOL">ТС: ТОЛ (литі кільця)</option>
                          <option value="TFZM">ТС: ТФЗМ (масляні)</option>
                       </select>
                       <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                         Схему вторинних кіл, ТН і тип лічильника задайте у блоці «Варіанти підключення» вище.
                       </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Bottom Section: Full Width Schematic */}
          <div className="w-full mt-10">
             <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="text-lg font-black text-slate-100 italic uppercase">Digital Twin Connection Schematic</h3>
             </div>
             
             <div className="relative w-full min-h-[800px] bg-slate-950/90 rounded-[40px] border border-slate-800 shadow-2xl flex items-start justify-center p-4 sm:p-8 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 pointer-events-none" />
                <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-1 opacity-50 z-10">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Active Verification Engine v2.1</span>
                    <span className="text-[9px] font-mono text-blue-500 uppercase tracking-widest animate-pulse">Syncing with Physical Model...</span>
                </div>
                
                <div className="w-full max-w-[1200px]">
                  <RealisticMeterSchematic 
                    scheme={linkedScheme || '3_TS'} 
                    voltage={voltageLevel}
                    Uabc={Uabc}
                    Iabc={Iabc}
                    phiDeg={phiDeg}
                    shunted={shunted}
                    setShunted={setShunted}
                    openVoltage={openVoltage}
                    setOpenVoltage={setOpenVoltage}
                    ctPhasePair={ctPhasePair}
                    ctModel={ctModel}
                    vtModel={vtModel}
                    meterElements={meterElements}
                    hasNeutral={hasNeutral}
                  />
                </div>
             </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <VafPowerSection 
              powerResults={powerResults} 
              Uabc={Uabc} 
              ratios={ratios} 
            />
        </div>
        
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-700/50 rounded-3xl p-6">
           <div className="flex items-center gap-3 mb-6">
             <Gauge size={24} className="text-blue-400" />
             <h3 className="text-xl font-black text-slate-100">Вторинні кола (ІКК)</h3>
           </div>
           <MeterConnectionSchematic 
              connectionScheme={linkedScheme || '3_TS'}
              voltageLevel={voltageLevel}
              wireHighlights={wireHighlights}
              phaseSummary={phaseSummary}
              ctPhasePair={ctPhasePair}
           />
           <div className="mt-8">
             <h4 className="text-sm font-bold text-slate-300 mb-3">Таблиця клем (відповідність джерел)</h4>
             <WiringTable
               scheme={linkedScheme || '3_TS'}
               ctPhasePair={ctPhasePair}
               Uabc={Uabc}
               Iabc={Iabc}
               phiDeg={phiDeg}
               highlights={{}}
               voltageLevel={voltageLevel}
             />
           </div>
        </div>
      </section>
    </div>
  );
}
