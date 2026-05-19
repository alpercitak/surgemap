export type Modifier = 'idle' | 'low' | 'building' | 'surge' | 'peak';

export type Status = 'live' | 'connecting' | 'reconnecting';

export type Cell = {
  index: string;
  lat: number;
  lng: number;
  demand: number;
  supply: number;
  ratio: number;
  modifier: number;
};

export type Cells = Array<Cell>;

export type Stats = {
  surging: number;
  maxMod: number;
  totalDemand: number;
  totalSupply: number;
  total: number;
};
