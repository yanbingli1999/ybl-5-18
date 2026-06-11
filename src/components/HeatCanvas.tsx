import React, { useRef, useCallback, useEffect } from 'react';
import useSimulationStore from '../store/useSimulationStore';
import useSimulation from '../hooks/useSimulation';
import useHeatRenderer from '../hooks/useHeatRenderer';

export const HeatCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);

  const {
    grid,
    brushSize,
    brushTemperature,
    drawMode,
    setHoveredCell,
    setCurrentTemperature,
    addHeatSource,
    mode,
  } = useSimulationStore();

  const { getEngine, initEngine, isRunning } = useSimulation();
  const { render } = useHeatRenderer(canvasRef, {
    showGrid: true,
    showCellValues: true,
    showColorBar: true,
  });

  const getGridCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor(((e.clientX - rect.left) * scaleX) / grid.cellSize);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / grid.cellSize);

      if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
        return { x, y };
      }
      return null;
    },
    [grid]
  );

  const drawAtPosition = useCallback(
    (x: number, y: number) => {
      const engine = getEngine();
      if (!engine || isRunning) return;

      if (drawMode === 'heat') {
        engine.addHeatSource(x, y, brushTemperature, brushSize);
        addHeatSource({ x, y, temperature: brushTemperature, radius: brushSize });
      } else if (drawMode === 'erase') {
        engine.eraseHeat(x, y, brushSize);
      }

      const newTemp = engine.getTemperatureData();
      setCurrentTemperature(newTemp);
    },
    [getEngine, isRunning, drawMode, brushTemperature, brushSize, addHeatSource, setCurrentTemperature]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode === 'running') return;
      isDrawingRef.current = true;
      const coords = getGridCoordinates(e);
      if (coords) {
        drawAtPosition(coords.x, coords.y);
      }
    },
    [mode, getGridCoordinates, drawAtPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getGridCoordinates(e);
      setHoveredCell(coords);

      if (isDrawingRef.current && coords && !isRunning) {
        drawAtPosition(coords.x, coords.y);
      }
    },
    [getGridCoordinates, setHoveredCell, isRunning, drawAtPosition]
  );

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDrawingRef.current = false;
    setHoveredCell(null);
  }, [setHoveredCell]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    if (grid.width && grid.height) {
      initEngine();
    }
  }, [grid.width, grid.height]);

  const canvasWidth = grid.width * grid.cellSize;
  const canvasHeight = grid.height * grid.cellSize;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-slate-950 overflow-hidden relative"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(239, 68, 68, 0.05) 0%, transparent 50%)
        `,
      }}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="cursor-crosshair shadow-2xl shadow-black/50 rounded-lg"
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 200px)',
            imageRendering: 'pixelated',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        {isRunning && (
          <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full" />
            模拟运行中
          </div>
        )}
        {drawMode !== 'none' && !isRunning && (
          <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-slate-200 text-xs font-medium">
            {drawMode === 'heat' ? '🔥 点击添加热源' : '❄️ 点击冷却区域'}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeatCanvas;
