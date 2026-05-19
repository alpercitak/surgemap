export type CellState = {
  index: string;
  lat: number;
  lng: number;
  demand: number;
  supply: number;
  ratio: number;
  modifier: number;
};

export type SurgeMapProps = {
  cells: Array<CellState>;
};
