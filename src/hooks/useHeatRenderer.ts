import { useRef, useEffect, useCallback } from 'react';
import { temperatureToColor, drawColorBar } from '../engine/ColorMap';
import useSimulationStore from '../store/useSimulationStore';

interface RenderOptions {
  showGrid?: boolean;
  showCellValues?: boolean;
  showColorBar?: boolean;
}

export function useHeatRenderer(canvasRef: React.RefObject<HTMLCanvasElement>, options: RenderOptions = {}) {
  const {
    grid,
    currentTemperature,
    minTemp,
    maxTemp,
    hoveredCell,
    boundaryConditions,
  } = useSimulationStore();

  const {
    showGrid = true,
    showCellValues = false,
    showColorBar = true,
  } = options;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentTemperature) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, cellSize } = grid;
    const canvasWidth = width * cellSize;
    const canvasHeight = height * cellSize;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const temp = currentTemperature[y]?.[x] ?? 25;
        ctx.fillStyle = temperatureToColor(temp, minTemp, maxTemp);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    if (showGrid && cellSize >= 6) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvasHeight);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvasWidth, y * cellSize);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

    if (boundaryConditions.type === 'dirichlet') {
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'center';
      
      ctx.fillText(`${boundaryConditions.top.toFixed(0)}°C`, canvasWidth / 2, 14);
      ctx.fillText(`${boundaryConditions.bottom.toFixed(0)}°C`, canvasWidth / 2, canvasHeight - 4);
      
      ctx.save();
      ctx.translate(14, canvasHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${boundaryConditions.left.toFixed(0)}°C`, 0, 0);
      ctx.restore();
      
      ctx.save();
      ctx.translate(canvasWidth - 14, canvasHeight / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(`${boundaryConditions.right.toFixed(0)}°C`, 0, 0);
      ctx.restore();
    }

    if (hoveredCell && showCellValues) {
      const { x, y } = hoveredCell;
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const temp = currentTemperature[y]?.[x] ?? 25;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x * cellSize + 1,
          y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );

        if (cellSize >= 20) {
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `${temp.toFixed(1)}°`,
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2
          );
        }
      }
    }

    if (showColorBar) {
      const barWidth = 200;
      const barHeight = 16;
      const barX = canvasWidth - barWidth - 16;
      const barY = canvasHeight - barHeight - 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 8, barY - 28, barWidth + 16, barHeight + 40);

      drawColorBar(ctx, barX, barY, barWidth, barHeight, minTemp, maxTemp);

      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(`${minTemp.toFixed(0)}°C`, barX, barY - 8);
      ctx.textAlign = 'right';
      ctx.fillText(`${maxTemp.toFixed(0)}°C`, barX + barWidth, barY - 8);
      ctx.textAlign = 'center';
      ctx.fillText('温度 (°C)', barX + barWidth / 2, barY + barHeight + 14);
    }
  }, [
    canvasRef,
    grid,
    currentTemperature,
    minTemp,
    maxTemp,
    hoveredCell,
    boundaryConditions,
    showGrid,
    showCellValues,
    showColorBar,
  ]);

  useEffect(() => {
    render();
  }, [render]);

  return { render };
}

export default useHeatRenderer;
