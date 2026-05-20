import { useEffect, useState } from 'react';
import type { Cells, DataHook } from '@/types';

// Amsterdam hotspots with base surge tendency
const HOTSPOTS = [
  { name: 'Centraal Station', lat: 52.3791, lng: 4.9003, baseSurge: 2.2 },
  { name: 'Leidseplein', lat: 52.3638, lng: 4.883, baseSurge: 1.8 },
  { name: 'Rembrandtplein', lat: 52.3665, lng: 4.8963, baseSurge: 1.6 },
  { name: 'Schiphol', lat: 52.3105, lng: 4.7683, baseSurge: 2.0 },
  { name: 'Zuidas', lat: 52.3392, lng: 4.8727, baseSurge: 1.4 },
  { name: 'NDSM Wharf', lat: 52.401, lng: 4.8985, baseSurge: 1.2 },
  { name: 'Oost', lat: 52.3603, lng: 4.9345, baseSurge: 1.3 },
];

const gaussian = (mean: number, spread: number): number => {
  // Box-Muller
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * spread;
};

const generateCells = (): Cells => {
  const cells: Cells = [];

  for (const hs of HOTSPOTS) {
    // 5-8 cells per hotspot, scattered around it
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const lat = gaussian(hs.lat, 0.008);
      const lng = gaussian(hs.lng, 0.012);
      const modifier = Math.min(3.0, Math.max(1.0, gaussian(hs.baseSurge, 0.3)));
      const ratio = modifier;
      const demand = Math.round(modifier * 4 + Math.random() * 3);
      const supply = Math.max(1, Math.round(demand / modifier));
      cells.push({ index: `demo_${hs.name}_${i}`, lat, lng, demand, supply, ratio, modifier });
    }
  }

  return cells;
};

const evolveCells = (cells: Cells): Cells =>
  cells.map((cell) => {
    const delta = (Math.random() - 0.48) * 0.15;
    const modifier = Math.min(3.0, Math.max(1.0, cell.modifier + delta));
    const ratio = modifier;
    return { ...cell, modifier, ratio };
  });

export const useDemo = (): DataHook => {
  const [cells, setCells] = useState(() => generateCells());

  useEffect(() => {
    const interval = setInterval(() => {
      setCells((prev) => evolveCells(prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { cells, status: 'demo' };
};
