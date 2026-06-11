import { useEffect, useRef, useCallback } from 'react';
import useSimulationStore from '../store/useSimulationStore';
import HeatDiffusionEngine from '../engine/HeatDiffusion';

export function useSimulation() {
  const {
    mode,
    grid,
    boundaryConditions,
    diffusionCoefficient,
    initialHeatSources,
    totalSteps,
    timeStep,
    playbackSpeed,
    currentStep,
    currentTemperature,
    temperatureHistory,
    setMode,
    setCurrentStep,
    setCurrentTemperature,
    addTemperatureToHistory,
    clearHistory,
  } = useSimulationStore();

  const engineRef = useRef<HeatDiffusionEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const totalStepsRef = useRef(totalSteps);
  const playbackSpeedRef = useRef(playbackSpeed);
  const stepFnRef = useRef<(() => number[][] | null) | null>(null);
  const stepsPerFrameRef = useRef<number>(1);

  useEffect(() => {
    totalStepsRef.current = totalSteps;
  }, [totalSteps]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  const initEngine = useCallback(() => {
    engineRef.current = new HeatDiffusionEngine(
      grid,
      diffusionCoefficient,
      boundaryConditions,
      initialHeatSources,
      timeStep
    );
    const initialTemp = engineRef.current.getTemperatureData();
    setCurrentTemperature(initialTemp);
    clearHistory();
    addTemperatureToHistory(initialTemp);
  }, [grid, diffusionCoefficient, boundaryConditions, initialHeatSources, timeStep, setCurrentTemperature, clearHistory, addTemperatureToHistory]);

  const step = useCallback(() => {
    if (!engineRef.current) return null;
    const newTemp = engineRef.current.step();
    setCurrentTemperature(newTemp);
    addTemperatureToHistory(newTemp);
    setCurrentStep(engineRef.current.getCurrentStep());
    return newTemp;
  }, [setCurrentTemperature, addTemperatureToHistory, setCurrentStep]);

  useEffect(() => {
    stepFnRef.current = step;
  }, [step]);

  const animate = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;
    
    const currentStepVal = engineRef.current?.getCurrentStep() ?? 0;
    if (currentStepVal >= totalStepsRef.current) {
      isRunningRef.current = false;
      setMode('finished');
      return;
    }

    const elapsed = timestamp - lastTimeRef.current;
    const frameInterval = 1000 / 60;
    
    if (elapsed >= frameInterval) {
      lastTimeRef.current = timestamp;
      
      const stepsToRun = Math.max(1, Math.floor(playbackSpeedRef.current / 60));
      stepsPerFrameRef.current = stepsToRun;
      
      for (let i = 0; i < stepsToRun; i++) {
        const s = engineRef.current?.getCurrentStep() ?? 0;
        if (s >= totalStepsRef.current) {
          isRunningRef.current = false;
          setMode('finished');
          return;
        }
        stepFnRef.current?.();
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [setMode]);

  const play = useCallback(() => {
    if (!engineRef.current) {
      initEngine();
    }
    const currentStepVal = engineRef.current?.getCurrentStep() ?? 0;
    if (currentStepVal >= totalStepsRef.current) {
      clearHistory();
      initEngine();
    }
    isRunningRef.current = true;
    setMode('running');
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [initEngine, setMode, animate, clearHistory]);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    setMode('paused');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [setMode]);

  const reset = useCallback(() => {
    isRunningRef.current = false;
    setMode('idle');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    clearHistory();
    initEngine();
  }, [clearHistory, initEngine, setMode]);

  const stepForward = useCallback(() => {
    if (!engineRef.current) {
      initEngine();
    }
    const currentStepVal = engineRef.current?.getCurrentStep() ?? 0;
    if (currentStepVal < totalStepsRef.current) {
      isRunningRef.current = false;
      setMode('paused');
      step();
    }
  }, [initEngine, step, setMode]);

  const goToStep = useCallback((targetStep: number) => {
    if (!engineRef.current || targetStep < 0 || targetStep >= temperatureHistory.length) return;
    
    isRunningRef.current = false;
    setMode('paused');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const targetTemp = temperatureHistory[targetStep];
    setCurrentTemperature(targetTemp);
    setCurrentStep(targetStep);
    engineRef.current.setTemperatureData(targetTemp);
    
    const tempStep = targetStep;
    Object.defineProperty(engineRef.current, 'currentStep', {
      value: tempStep,
      writable: true,
    });
  }, [temperatureHistory, setCurrentTemperature, setCurrentStep, setMode]);

  useEffect(() => {
    initEngine();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateBoundaryConditions(boundaryConditions);
    }
  }, [boundaryConditions]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateDiffusionCoefficient(diffusionCoefficient);
    }
  }, [diffusionCoefficient]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const getEngine = () => engineRef.current;

  return {
    play,
    pause,
    reset,
    stepForward,
    goToStep,
    initEngine,
    getEngine,
    isRunning: mode === 'running',
    isPaused: mode === 'paused',
    isFinished: mode === 'finished',
    isIdle: mode === 'idle',
    currentTemperature,
    currentStep,
    totalSteps,
    temperatureHistory,
    playbackSpeed,
  };
}

export default useSimulation;
