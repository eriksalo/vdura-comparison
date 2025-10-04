import { useState, useEffect } from 'react';
import './App.css';
import ConfigPanel from './components/ConfigPanel';
import VduraSystem from './components/VduraSystem';
import CompetitorSystem from './components/CompetitorSystem';
import MetricsDisplay from './components/MetricsDisplay';

function App() {
  const [config, setConfig] = useState({
    gpuCount: 1024,
    checkpointSizeTB: 85, // Scaled from 2.5TB for 12 GPUs -> ~85TB for 1024 GPUs
    checkpointIntervalMin: 30, // Realistic checkpoint interval in minutes
    simulationSpeed: 1, // 1x, 2x, 5x, 10x
    ssdCapacityTB: 3.84, // SSD capacity in TB
    vduraCheckpointsInFlash: 3, // Number of checkpoints to keep in VDURA flash
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

    // Total cycle time: 4s write + 1s pause + 2s migration + 1s pause = 8s base animation
    const baseCycleTime = 8000;

    // Speed up simulation to show realistic checkpoint intervals quickly
    // With 30 min intervals, speedup = 30*60*1000 / 8000 = 225x
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
  }, [isRunning, metrics.gpuHoursPerCheckpoint, config.checkpointIntervalMin, config.simulationSpeed]);

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

      <ConfigPanel
        config={config}
        setConfig={setConfig}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
      />

      <div className="comparison-container">
        <VduraSystem
          config={config}
          metrics={metrics}
          isRunning={isRunning}
          checkpointTrigger={checkpointTrigger}
        />

        <div className="vs-divider">VS</div>

        <CompetitorSystem
          config={config}
          metrics={metrics}
          isRunning={isRunning}
          checkpointTrigger={checkpointTrigger}
        />
      </div>

      <MetricsDisplay metrics={metrics} config={config} />
    </div>
  );
}

export default App;
