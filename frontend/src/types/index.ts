export type Modifier = 'idle' | 'low' | 'building' | 'surge' | 'peak';

export type Status = 'live' | 'connecting' | 'reconnecting';

export type Cell = {
  demand: number;
  supply: number;
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
