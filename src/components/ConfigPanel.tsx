import React from 'react';
import { Grid, Thermometer, Flame, Settings, Gauge, Square } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';

export const ConfigPanel: React.FC = () => {
  const {
    grid,
    boundaryConditions,
    materialId,
    materials,
    diffusionCoefficient,
    totalSteps,
    playbackSpeed,
    minTemp,
    maxTemp,
    brushSize,
    brushTemperature,
    drawMode,
    setGrid,
    setBoundaryConditions,
    setMaterialId,
    setTotalSteps,
    setPlaybackSpeed,
    setTempRange,
    setBrushSize,
    setBrushTemperature,
    setDrawMode,
    setDiffusionCoefficient,
  } = useSimulationStore();

  const handleGridSizeChange = (dimension: 'width' | 'height', value: number) => {
    const clamped = Math.max(10, Math.min(100, value));
    setGrid({ ...grid, [dimension]: clamped });
  };

  const handleBoundaryChange = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    setBoundaryConditions({ ...boundaryConditions, [side]: value });
  };

  const formatDiffusion = (alpha: number) => {
    if (alpha >= 0.01) return alpha.toFixed(3);
    if (alpha >= 0.0001) return alpha.toFixed(6);
    return alpha.toExponential(2);
  };

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 h-full overflow-y-auto p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          实验参数配置
        </h2>
        <div className="h-px bg-slate-700" />
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Grid className="w-4 h-4 text-blue-400" />
            网格设置
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>网格宽度</span>
                <span className="font-mono">{grid.width}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={grid.width}
                onChange={(e) => handleGridSizeChange('width', Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>网格高度</span>
                <span className="font-mono">{grid.height}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={grid.height}
                onChange={(e) => handleGridSizeChange('height', Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-400" />
            边界温度 (°C)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
              <div key={side} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    {side === 'top' ? '上' : side === 'bottom' ? '下' : side === 'left' ? '左' : '右'}
                  </span>
                  <span className="font-mono">{boundaryConditions[side].toFixed(0)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={boundaryConditions[side]}
                  onChange={(e) => handleBoundaryChange(side, Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Square className="w-4 h-4 text-purple-400" />
            材料选择
          </h3>
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (α = {formatDiffusion(m.diffusionCoefficient)} m²/s)
              </option>
            ))}
          </select>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>扩散系数 α</span>
              <span className="font-mono">{formatDiffusion(diffusionCoefficient)}</span>
            </div>
            <input
              type="range"
              min="0.00000001"
              max="0.0002"
              step="0.00000001"
              value={diffusionCoefficient}
              onChange={(e) => setDiffusionCoefficient(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          {materials.find(m => m.id === materialId)?.description && (
            <p className="text-xs text-slate-500 italic">
              {materials.find(m => m.id === materialId)?.description}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-green-400" />
            模拟控制
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>总迭代步数</span>
                <span className="font-mono">{totalSteps}</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={totalSteps}
                onChange={(e) => setTotalSteps(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>播放速度 (步/秒)</span>
                <span className="font-mono">{playbackSpeed}</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            温度显示范围
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>最小值</span>
                <span className="font-mono">{minTemp}°</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={minTemp}
                onChange={(e) => setTempRange(Number(e.target.value), maxTemp)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>最大值</span>
                <span className="font-mono">{maxTemp}°</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={maxTemp}
                onChange={(e) => setTempRange(minTemp, Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400" />
            绘制工具
          </h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setDrawMode('heat')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  drawMode === 'heat'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                加热
              </button>
              <button
                onClick={() => setDrawMode('erase')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  drawMode === 'erase'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                冷却
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>画笔大小</span>
                <span className="font-mono">{brushSize}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>画笔温度</span>
                <span className="font-mono">{brushTemperature}°C</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="5"
                value={brushTemperature}
                onChange={(e) => setBrushTemperature(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
