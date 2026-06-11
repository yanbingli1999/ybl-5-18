import type { GridConfig, BoundaryConditions, HeatSource } from '@shared/types';

export class HeatDiffusionEngine {
  private width: number;
  private height: number;
  private diffusionCoefficient: number;
  private boundaryConditions: BoundaryConditions;
  private temperature: number[][];
  private nextTemperature: number[][];
  private timeStep: number;
  private gridSpacing: number = 1;
  private currentStep: number = 0;

  constructor(
    grid: GridConfig,
    diffusionCoefficient: number,
    boundaryConditions: BoundaryConditions,
    initialHeatSources: HeatSource[],
    timeStep: number = 0.1
  ) {
    this.width = grid.width;
    this.height = grid.height;
    this.diffusionCoefficient = diffusionCoefficient;
    this.boundaryConditions = boundaryConditions;
    this.timeStep = timeStep;

    this.temperature = this.createGrid();
    this.nextTemperature = this.createGrid();

    this.initializeTemperature(initialHeatSources);
  }

  private createGrid(): number[][] {
    const grid: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = new Array(this.width).fill(25);
    }
    return grid;
  }

  private initializeTemperature(heatSources: HeatSource[]): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.temperature[y][x] = 25;
      }
    }

    for (const source of heatSources) {
      for (let dy = -source.radius; dy <= source.radius; dy++) {
        for (let dx = -source.radius; dx <= source.radius; dx++) {
          const x = Math.floor(source.x) + dx;
          const y = Math.floor(source.y) + dy;
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= source.radius) {
              const factor = 1 - dist / (source.radius + 1);
              this.temperature[y][x] = 25 + (source.temperature - 25) * factor;
            }
          }
        }
      }
    }

    this.applyBoundaryConditions(this.temperature);
  }

  private applyBoundaryConditions(grid: number[][]): void {
    if (this.boundaryConditions.type === 'dirichlet') {
      for (let x = 0; x < this.width; x++) {
        grid[0][x] = this.boundaryConditions.top;
        grid[this.height - 1][x] = this.boundaryConditions.bottom;
      }
      for (let y = 0; y < this.height; y++) {
        grid[y][0] = this.boundaryConditions.left;
        grid[y][this.width - 1] = this.boundaryConditions.right;
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        grid[0][x] = grid[1][x];
        grid[this.height - 1][x] = grid[this.height - 2][x];
      }
      for (let y = 0; y < this.height; y++) {
        grid[y][0] = grid[y][1];
        grid[y][this.width - 1] = grid[y][this.width - 2];
      }
    }
  }

  public step(): number[][] {
    const alpha = this.diffusionCoefficient;
    const dt = this.timeStep;
    const h = this.gridSpacing;
    const r = (alpha * dt) / (h * h);

    const maxStableR = 0.25;
    const actualR = Math.min(r, maxStableR);

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const tCenter = this.temperature[y][x];
        const tUp = this.temperature[y - 1][x];
        const tDown = this.temperature[y + 1][x];
        const tLeft = this.temperature[y][x - 1];
        const tRight = this.temperature[y][x + 1];

        this.nextTemperature[y][x] = 
          tCenter + actualR * (tUp + tDown + tLeft + tRight - 4 * tCenter);
      }
    }

    this.applyBoundaryConditions(this.nextTemperature);

    const temp = this.temperature;
    this.temperature = this.nextTemperature;
    this.nextTemperature = temp;

    this.currentStep++;

    return this.getTemperatureData();
  }

  public getTemperatureData(): number[][] {
    return this.temperature.map(row => [...row]);
  }

  public setTemperatureData(data: number[][]): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.temperature[y][x] = data[y][x] ?? 25;
      }
    }
    this.applyBoundaryConditions(this.temperature);
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public reset(heatSources: HeatSource[]): void {
    this.currentStep = 0;
    this.initializeTemperature(heatSources);
  }

  public updateBoundaryConditions(bc: BoundaryConditions): void {
    this.boundaryConditions = bc;
    this.applyBoundaryConditions(this.temperature);
  }

  public updateDiffusionCoefficient(alpha: number): void {
    this.diffusionCoefficient = alpha;
  }

  public addHeatSource(x: number, y: number, temperature: number, radius: number = 2): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x) + dx;
        const py = Math.floor(y) + dy;
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const factor = 1 - dist / (radius + 1);
            this.temperature[py][px] = Math.max(
              this.temperature[py][px],
              25 + (temperature - 25) * factor
            );
          }
        }
      }
    }
  }

  public eraseHeat(x: number, y: number, radius: number = 2): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x) + dx;
        const py = Math.floor(y) + dy;
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const factor = 1 - dist / (radius + 1);
            this.temperature[py][px] = this.temperature[py][px] * (1 - factor) + 25 * factor;
          }
        }
      }
    }
  }

  public clearAll(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.temperature[y][x] = 25;
      }
    }
    this.applyBoundaryConditions(this.temperature);
  }

  public resize(grid: GridConfig): void {
    this.width = grid.width;
    this.height = grid.height;
    this.temperature = this.createGrid();
    this.nextTemperature = this.createGrid();
    this.currentStep = 0;
    this.applyBoundaryConditions(this.temperature);
  }
}

export default HeatDiffusionEngine;
