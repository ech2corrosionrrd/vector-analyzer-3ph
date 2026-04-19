import { useState, useEffect } from 'react';
import type { AngleMode, Scheme, VoltageType, DiagramMode, Measurements, LoadType } from '../types/vaf';

const STORAGE_KEY_CLASSIC = 'vector_analyzer_classic_state_v1';

export interface ClassicState {
  angleMode: AngleMode;
  scheme: Scheme;
  voltageType: VoltageType;
  diagramMode: DiagramMode;
  frequency: string;
  loadType: LoadType;
  measurements: Measurements;
  voltageLevel: string;
  IPrim: number;
  ISec: number;
  UPrim: number;
  USec: number;
  hasNeutral: boolean;
}

const DEFAULT_STATE: ClassicState = {
  angleMode: 'relative',
  scheme: 'star',
  voltageType: 'phase',
  diagramMode: 'combined',
  frequency: '50',
  loadType: 'mixed' as LoadType,
  measurements: {
    A: { U: 220, I: 5, angleU: 0, angleI: 330, phi: 30 },
    B: { U: 220, I: 5, angleU: 240, angleI: 210, phi: 30 },
    C: { U: 220, I: 5, angleU: 120, angleI: 90, phi: 30 },
  },
  voltageLevel: '0.4',
  IPrim: 200,
  ISec: 5,
  UPrim: 400,
  USec: 400,
  hasNeutral: true,
};

export function useClassicState() {
  const savedState = (() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY_CLASSIC);
      return item ? (JSON.parse(item) as Partial<ClassicState>) : null;
    } catch {
      return null;
    }
  })();

  const [angleMode, setAngleMode] = useState<AngleMode>(savedState?.angleMode ?? DEFAULT_STATE.angleMode);
  const [scheme, setScheme] = useState<Scheme>(savedState?.scheme ?? DEFAULT_STATE.scheme);
  const [voltageType, setVoltageType] = useState<VoltageType>(savedState?.voltageType ?? DEFAULT_STATE.voltageType);
  const [diagramMode, setDiagramMode] = useState<DiagramMode>(
    (savedState?.diagramMode as DiagramMode) ?? DEFAULT_STATE.diagramMode,
  );
  const [frequency, setFrequency] = useState(savedState?.frequency ?? DEFAULT_STATE.frequency);
  const [loadType, setLoadType] = useState(savedState?.loadType ?? DEFAULT_STATE.loadType);
  const [measurements, setMeasurements] = useState<Measurements>(
    savedState?.measurements ?? DEFAULT_STATE.measurements,
  );
  const [voltageLevel, setVoltageLevel] = useState(savedState?.voltageLevel ?? DEFAULT_STATE.voltageLevel);
  const [IPrim, setIPrim] = useState(savedState?.IPrim ?? DEFAULT_STATE.IPrim);
  const [ISec, setISec] = useState(savedState?.ISec ?? DEFAULT_STATE.ISec);
  const [UPrim, setUPrim] = useState(savedState?.UPrim ?? DEFAULT_STATE.UPrim);
  const [USec, setUSec] = useState(savedState?.USec ?? DEFAULT_STATE.USec);
  const [hasNeutral, setHasNeutral] = useState(savedState?.hasNeutral ?? DEFAULT_STATE.hasNeutral);
  const [trianglePhase, setTrianglePhase] = useState<'A' | 'B' | 'C'>('A');

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_CLASSIC,
      JSON.stringify({ 
        angleMode, scheme, voltageType, diagramMode, frequency, loadType, measurements,
        voltageLevel, IPrim, ISec, UPrim, USec, hasNeutral
      }),
    );
  }, [angleMode, scheme, voltageType, diagramMode, frequency, loadType, measurements, 
      voltageLevel, IPrim, ISec, UPrim, USec, hasNeutral]);

  const restoreState = (data: ClassicState) => {
    setAngleMode(data.angleMode);
    setScheme(data.scheme);
    setVoltageType(data.voltageType);
    setDiagramMode(data.diagramMode);
    setFrequency(data.frequency);
    setLoadType(data.loadType);
    setMeasurements(data.measurements);
    setVoltageLevel(data.voltageLevel || '0.4');
    setIPrim(data.IPrim || 200);
    setISec(data.ISec || 5);
    setUPrim(data.UPrim || 400);
    setUSec(data.USec || 400);
    setHasNeutral(data.hasNeutral ?? true);
  };

  return {
    angleMode, setAngleMode,
    scheme, setScheme,
    voltageType, setVoltageType,
    diagramMode, setDiagramMode,
    frequency, setFrequency,
    loadType, setLoadType,
    measurements, setMeasurements,
    voltageLevel, setVoltageLevel,
    IPrim, setIPrim,
    ISec, setISec,
    UPrim, setUPrim,
    USec, setUSec,
    hasNeutral, setHasNeutral,
    trianglePhase, setTrianglePhase,
    restoreState,
  };
}
