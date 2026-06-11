export interface Material {
  id: string;
  name: string;
  diffusionCoefficient: number;
  description: string;
}

export interface GridConfig {
  width: number;
  height: number;
  cellSize: number;
}

export interface BoundaryConditions {
  top: number;
  bottom: number;
  left: number;
  right: number;
  type: 'dirichlet' | 'neumann';
}

export interface HeatSource {
  x: number;
  y: number;
  temperature: number;
  radius: number;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  createdAt: number;
  grid: GridConfig;
  materialId: string;
  boundaryConditions: BoundaryConditions;
  initialHeatSources: HeatSource[];
  totalSteps: number;
  timeStep: number;
}

export interface TemperatureSnapshot {
  id: string;
  experimentId: string;
  step: number;
  timestamp: number;
  temperatureData: number[][];
  name?: string;
}

export interface ExperimentResult {
  id: string;
  config: ExperimentConfig;
  snapshots: TemperatureSnapshot[];
  isFavorite: boolean;
  completedAt: number;
}

export type SimulationMode = 'idle' | 'running' | 'paused' | 'finished';
