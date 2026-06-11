import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Clock, Bookmark, Trash2, Play, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import useSimulation from '../hooks/useSimulation';
import api from '../services/api';

export const Timeline: React.FC = () => {
  const {
    currentStep,
    totalSteps,
    temperatureHistory,
    snapshots,
    removeSnapshot,
    minTemp,
    maxTemp,
    timelineViewStart,
    timelineViewEnd,
    setTimelineView,
    resetTimelineView,
  } = useSimulationStore();

  const { goToStep, isRunning } = useSimulation();
  const [hoveredSnapshot, setHoveredSnapshot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartView, setDragStartView] = useState({ start: 0, end: 0 });
  const timelineRef = useRef<HTMLDivElement>(null);

  const viewRange = timelineViewEnd - timelineViewStart;

  const clampStep = useCallback((step: number) => {
    return Math.max(0, Math.min(step, totalSteps));
  }, [totalSteps]);

  const getStepFromX = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return clampStep(Math.floor(timelineViewStart + ratio * viewRange));
  }, [timelineViewStart, viewRange, clampStep]);

  const getXFromStep = useCallback((step: number) => {
    if (viewRange === 0) return 0;
    const ratio = (step - timelineViewStart) / viewRange;
    return Math.max(0, Math.min(1, ratio)) * 100;
  }, [timelineViewStart, viewRange]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isRunning || isDragging) return;
    const targetStep = getStepFromX(e.clientX);
    if (targetStep >= 0 && targetStep < temperatureHistory.length) {
      goToStep(targetStep);
    }
  }, [isRunning, isDragging, getStepFromX, temperatureHistory.length, goToStep]);

  const handleSnapshotClick = useCallback((snapshot: typeof snapshots[0]) => {
    if (isRunning) return;
    if (snapshot.step < temperatureHistory.length) {
      goToStep(snapshot.step);
    }
  }, [isRunning, temperatureHistory.length, goToStep]);

  const handleDeleteSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.snapshots.delete(id);
      removeSnapshot(id);
    } catch (error) {
      console.error('删除快照失败:', error);
    }
  };

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isRunning) return;
    e.preventDefault();

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseRatio = (e.clientX - rect.left) / rect.width;
    const mouseStep = timelineViewStart + mouseRatio * viewRange;

    const zoomFactor = e.deltaY > 0 ? 1.25 : 0.8;
    let newRange = viewRange * zoomFactor;

    const minRange = Math.max(10, Math.floor(totalSteps * 0.01));
    const maxRange = totalSteps;
    newRange = Math.max(minRange, Math.min(maxRange, newRange));

    const newStart = clampStep(Math.floor(mouseStep - mouseRatio * newRange));
    const newEnd = clampStep(newStart + newRange);

    setTimelineView(newStart, newEnd);
  }, [timelineViewStart, viewRange, isRunning, totalSteps, clampStep, setTimelineView]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isRunning) return;
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartView({ start: timelineViewStart, end: timelineViewEnd });
  }, [isRunning, timelineViewStart, timelineViewEnd]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaRatio = deltaX / rect.width;
    const deltaSteps = deltaRatio * (dragStartView.end - dragStartView.start);

    const currentRange = dragStartView.end - dragStartView.start;
    let newStart = clampStep(Math.floor(dragStartView.start - deltaSteps));
    let newEnd = newStart + currentRange;

    if (newEnd > totalSteps) {
      newEnd = totalSteps;
      newStart = Math.max(0, newEnd - currentRange);
    }

    setTimelineView(newStart, newEnd);
  }, [isDragging, dragStartX, dragStartView, totalSteps, clampStep, setTimelineView]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleZoomIn = () => {
    if (isRunning) return;
    const currentRange = timelineViewEnd - timelineViewStart;
    const center = (timelineViewStart + timelineViewEnd) / 2;
    const newRange = Math.max(10, Math.floor(currentRange * 0.6));
    let newStart = clampStep(Math.floor(center - newRange / 2));
    const newEnd = clampStep(newStart + newRange);
    if (newEnd - newStart < newRange) {
      newStart = Math.max(0, newEnd - newRange);
    }
    setTimelineView(newStart, newEnd);
  };

  const handleZoomOut = () => {
    if (isRunning) return;
    const currentRange = timelineViewEnd - timelineViewStart;
    const center = (timelineViewStart + timelineViewEnd) / 2;
    const newRange = Math.min(totalSteps, Math.floor(currentRange * 1.67));
    let newStart = clampStep(Math.floor(center - newRange / 2));
    const newEnd = clampStep(newStart + newRange);
    if (newEnd - newStart < newRange) {
      newStart = Math.max(0, newEnd - newRange);
    }
    setTimelineView(newStart, newEnd);
  };

  const formatTime = (step: number) => {
    return `${(step * 0.1).toFixed(1)}s`;
  };

  const getSnapshotColor = (step: number) => {
    const temp = temperatureHistory[step]?.[Math.floor(useSimulationStore.getState().grid.height / 2)]?.[
      Math.floor(useSimulationStore.getState().grid.width / 2)
    ] ?? 25;
    const ratio = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
    
    if (ratio < 0.25) return 'bg-blue-600';
    if (ratio < 0.5) return 'bg-cyan-500';
    if (ratio < 0.75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const generateMarks = () => {
    const range = timelineViewEnd - timelineViewStart;
    const targetMarks = 10;
    const rawStep = range / targetMarks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let markInterval;
    if (residual <= 1) markInterval = magnitude;
    else if (residual <= 2) markInterval = 2 * magnitude;
    else if (residual <= 5) markInterval = 5 * magnitude;
    else markInterval = 10 * magnitude;

    const firstMark = Math.ceil(timelineViewStart / markInterval) * markInterval;
    const marks: { step: number; label: string }[] = [];
    for (let step = firstMark; step <= timelineViewEnd; step += markInterval) {
      marks.push({ step, label: `${step}` });
    }
    return marks;
  };

  const marks = generateMarks();
  const zoomPercent = Math.round((totalSteps / viewRange) * 100);

  return (
    <div className="h-32 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-6 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">时间轴</span>
          {viewRange < totalSteps && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full ml-2">
              {zoomPercent}% 缩放
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={isRunning || viewRange >= totalSteps}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="缩小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={isRunning || viewRange <= Math.max(10, Math.floor(totalSteps * 0.01))}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-0.5" />
            <button
              onClick={resetTimelineView}
              disabled={isRunning || viewRange >= totalSteps}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="重置视图"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Move className={`w-3.5 h-3.5 ${isDragging ? 'text-blue-400' : ''}`} />
            <span className="text-xs">拖拽平移</span>
          </div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-slate-400">{snapshots.length} 个快照</span>
          </div>
        </div>
      </div>

      <div
        ref={timelineRef}
        className={`relative h-8 bg-slate-800 rounded-lg cursor-pointer group select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onClick={handleTimelineClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {currentStep >= timelineViewStart && currentStep <= timelineViewEnd && (
          <div
            className="absolute h-full bg-gradient-to-r from-blue-600/30 to-green-600/30 rounded-l-lg transition-all"
            style={{
              left: 0,
              width: `${getXFromStep(currentStep)}%`,
            }}
          />
        )}

        {marks.map((mark) => (
          <div
            key={mark.step}
            className="absolute top-0 h-full w-px bg-slate-600/50"
            style={{ left: `${getXFromStep(mark.step)}%` }}
          >
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-slate-500">
              {mark.label}
            </span>
          </div>
        ))}

        {snapshots
          .filter((s) => s.step >= timelineViewStart && s.step <= timelineViewEnd)
          .map((snapshot) => (
            <div
              key={snapshot.id}
              className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-slate-900 cursor-pointer transition-all hover:scale-125 flex items-center justify-center ${
                hoveredSnapshot === snapshot.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 z-10' : ''
              } ${getSnapshotColor(snapshot.step)}`}
              style={{ left: `calc(${getXFromStep(snapshot.step)}% - 10px)` }}
              onClick={(e) => {
                e.stopPropagation();
                handleSnapshotClick(snapshot);
              }}
              onMouseEnter={() => setHoveredSnapshot(snapshot.id)}
              onMouseLeave={() => setHoveredSnapshot(null)}
            >
              <Play className="w-2.5 h-2.5 text-white" fill="white" />

              {hoveredSnapshot === snapshot.id && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap z-20">
                  <div className="text-xs font-medium text-white">{snapshot.name}</div>
                  <div className="text-xs text-slate-400">
                    第 {snapshot.step} 步 · {formatTime(snapshot.step)}
                  </div>
                  <button
                    onClick={(e) => handleDeleteSnapshot(snapshot.id, e)}
                    className="mt-1 w-full flex items-center justify-center gap-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>
              )}
            </div>
          ))}

        {currentStep >= timelineViewStart && currentStep <= timelineViewEnd && (
          <div
            className="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg shadow-white/50 transition-all z-10"
            style={{ left: `${getXFromStep(currentStep)}%` }}
          />
        )}

        {viewRange < totalSteps && (
          <>
            {timelineViewStart > 0 && (
              <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-slate-900/80 to-transparent pointer-events-none flex items-center justify-center">
                <span className="text-xs text-slate-400">←</span>
              </div>
            )}
            {timelineViewEnd < totalSteps && (
              <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-slate-900/80 to-transparent pointer-events-none flex items-center justify-center">
                <span className="text-xs text-slate-400">→</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>第 {timelineViewStart} 步</span>
        <span className="text-blue-400 font-medium">
          当前: 第 {currentStep} 步 ({formatTime(currentStep)})
        </span>
        <span>第 {timelineViewEnd} 步 / 共 {totalSteps} 步</span>
      </div>
    </div>
  );
};

export default Timeline;
