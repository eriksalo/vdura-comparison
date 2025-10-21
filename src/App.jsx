import { useState, useEffect } from 'react';
import './App.css';
import ConfigPanel from './components/ConfigPanel';
import CheckpointConfig from './components/CheckpointConfig';
import VduraStorageConfig from './components/VduraStorageConfig';
import CompetitorStorageConfig from './components/CompetitorStorageConfig';
import VduraSystem from './components/VduraSystem';
import CompetitorSystem from './components/CompetitorSystem';
import MetricsDisplay from './components/MetricsDisplay';

function App() {
  const [config, setConfig] = useState({
    gpuCount: 1024,
    checkpointSizeTB: 85, // Scaled from 2.5TB for 12 GPUs -> ~85TB for 1024 GPUs
    checkpointIntervalMin: 30, // Realistic checkpoint interval in minutes
    simulationSpeed: 1, // 1x, 2x, 5x, 10x
    storageNodes: 8, // Number of storage nodes (minimum 5, each has 12 SSDs) - shared between both systems
    vduraSsdCapacityTB: 15.36, // VDURA SSD capacity in TB
    vduraHddPoolSizePB: 7.02, // VDURA HDD pool size in PB (3-50 PB)
    vduraCheckpointsInFlash: 3, // Number of checkpoints to keep in VDURA flash
    competitorSsdCapacityTB: 15.36, // Competitor SSD capacity in TB
  });

  const [metrics, setMetrics] = useState({
    vduraCheckpointTime: 0,
    competitorCheckpointTime: 0,
    gpuHoursGained: 0,
    totalCheckpoints: 0,
    vduraCostPerTB: 0,
    competitorCostPerTB: 0,
  });

  const [isRunning, setIsRunning] = useState(true); // Auto-start simulation
  const [checkpointTrigger, setCheckpointTrigger] = useState(0); // Shared checkpoint trigger for both systems
  const [writeDurations, setWriteDurations] = useState({ vdura: 5000, competitor: 5000 }); // Animation durations in ms

  // Function to reset simulation state
  const resetSimulation = () => {
    setCheckpointTrigger(0);
    setMetrics({
      vduraCheckpointTime: 0,
      competitorCheckpointTime: 0,
      gpuHoursGained: 0,
      totalCheckpoints: 0,
      vduraCostPerTB: 0,
      competitorCostPerTB: 0,
      gpuHoursPerCheckpoint: 0,
    });
  };

  // Calculate checkpoint times based on configuration
  useEffect(() => {
    // VDURA: 40 GB/s per node (12 SSDs)
    const vduraNodeBandwidth = 40; // GB/s

    // Competitor: 20 GB/s per node (12 SSDs)
    const competitorNodeBandwidth = 20; // GB/s

    // Calculate write time in seconds
    const checkpointSizeGB = config.checkpointSizeTB * 1024;
    const vduraTime = checkpointSizeGB / vduraNodeBandwidth;
    const competitorTime = checkpointSizeGB / competitorNodeBandwidth;

    // Time saved per checkpoint (in hours)
    const timeSavedHours = (competitorTime - vduraTime) / 3600;

    // GPU hours gained = time saved × number of GPUs
    const gpuHoursPerCheckpoint = timeSavedHours * config.gpuCount;

    // Calculate animation durations (scale real times to visual duration)
    // Use a base animation time and scale proportionally
    const baseAnimationTime = 60000; // 60 seconds (1 minute) for competitor - very slow for maximum visibility
    const vduraAnimationTime = baseAnimationTime * (vduraTime / competitorTime); // ~30s (half of competitor)

    setWriteDurations({
      vdura: vduraAnimationTime,
      competitor: baseAnimationTime
    });

    setMetrics(prev => ({
      ...prev,
      vduraCheckpointTime: vduraTime,
      competitorCheckpointTime: competitorTime,
      gpuHoursPerCheckpoint: gpuHoursPerCheckpoint,
    }));
  }, [config]);

  // Simulation loop - triggers synchronized checkpoints
  useEffect(() => {
    if (!isRunning) return;

    // Total cycle time: competitor write + pause + migration + pause
    // competitor write (60s) + pause (15s) + migration (30s) + pause (15s) = 120s (2 minutes)
    const baseCycleTime = writeDurations.competitor + 15000 + 30000 + 15000;

    // Speed up simulation to show realistic checkpoint intervals quickly
    const autoSpeedupFactor = (config.checkpointIntervalMin * 60 * 1000) / baseCycleTime;
    const effectiveCycleTime = baseCycleTime / (config.simulationSpeed * autoSpeedupFactor);

    const interval = setInterval(() => {
      setCheckpointTrigger(prev => prev + 1); // Trigger checkpoint in both systems
      setMetrics(prev => ({
        ...prev,
        totalCheckpoints: prev.totalCheckpoints + 1,
        gpuHoursGained: prev.gpuHoursGained + prev.gpuHoursPerCheckpoint,
      }));
    }, effectiveCycleTime);

    return () => clearInterval(interval);
  }, [isRunning, metrics.gpuHoursPerCheckpoint, config.checkpointIntervalMin, config.simulationSpeed, writeDurations]);

  return (
    <div className="app">
      <header>
        <img
          src="https://www.vdura.com/wp-content/uploads/2023/12/vdura-rgb-amber.png"
          alt="VDURA Logo"
          className="vdura-logo"
        />
        <h1>Storage Performance Comparison</h1>
        <p>GPU Checkpoint Optimization Analysis</p>
      </header>

      <CheckpointConfig
        config={config}
        setConfig={setConfig}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        resetSimulation={resetSimulation}
      />

      <ConfigPanel
        isRunning={isRunning}
        setIsRunning={setIsRunning}
      />

      <div className="comparison-container">
        <div className="system-column">
          <VduraStorageConfig
            config={config}
            setConfig={setConfig}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            resetSimulation={resetSimulation}
          />
          <VduraSystem
            config={config}
            metrics={metrics}
            isRunning={isRunning}
            checkpointTrigger={checkpointTrigger}
            writeDuration={writeDurations.vdura}
          />
        </div>

        <div className="vs-divider">VS</div>

        <div className="system-column">
          <CompetitorStorageConfig
            config={config}
            setConfig={setConfig}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            resetSimulation={resetSimulation}
          />
          <CompetitorSystem
            config={config}
            metrics={metrics}
            isRunning={isRunning}
            checkpointTrigger={checkpointTrigger}
            setIsRunning={setIsRunning}
            resetSimulation={resetSimulation}
            writeDuration={writeDurations.competitor}
          />
        </div>
      </div>

      <MetricsDisplay metrics={metrics} config={config} />
    </div>
  );
}

export default App;
