export const VOLTAGE_LEVELS = [
  { value: '0.4', label: '0,4 кВ' },
  { value: '6', label: '6 кВ' },
  { value: '10', label: '10 кВ' },
  { value: '35', label: '35 кВ' },
  { value: '110', label: '110 кВ' },
];

export interface VoltagePreset {
  Usec: number;
  Imeas: number;
  phiTyp: number;
  UPrim: number;
  USec: number;
  IPrim: number;
  ISec: number;
  label: string;
}

export const VOLTAGE_PRESETS: Record<string, VoltagePreset> = {
  '0.4': { Usec: 220, Imeas: 3.2, phiTyp: 25, UPrim: 400, USec: 400, IPrim: 200, ISec: 5, label: 'Пряме підкл. (без ТН), Uф=220В, ТС 200/5' },
  '6': { Usec: 57.7, Imeas: 2.5, phiTyp: 30, UPrim: 6000, USec: 100, IPrim: 300, ISec: 5, label: 'ТН 6000/100, Uвт.ф=57,7В, ТС 300/5' },
  '10': { Usec: 57.7, Imeas: 2.5, phiTyp: 30, UPrim: 10000, USec: 100, IPrim: 300, ISec: 5, label: 'ТН 10000/100, Uвт.ф=57,7В, ТС 300/5' },
  '35': { Usec: 57.7, Imeas: 2.0, phiTyp: 28, UPrim: 35000, USec: 100, IPrim: 600, ISec: 5, label: 'ТН 35000/100, Uвт.ф=57,7В, ТС 600/5' },
  '110': { Usec: 57.7, Imeas: 1.5, phiTyp: 22, UPrim: 110000, USec: 100, IPrim: 1000, ISec: 5, label: 'ТН 110000/100, Uвт.ф=57,7В, ТС 1000/5' },
};
