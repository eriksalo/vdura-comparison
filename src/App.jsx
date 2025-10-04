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
    checkpointIntervalMin: 0.0833, // ~5 seconds (0.0833 min = 5 sec)
    simulationSpeed: 1, // 1x, 2x, 5x, 10x
  });

  const [metrics, setMetrics] = useState({
    vduraCheckpointTime: 0,
    competitorCheckpointTime: 0,
    gpuHoursGained: 0,
    totalCheckpoints: 0,
    vduraCostPerTB: 0,
    competitorCostPerTB: 0,
  });

  const [isRunning, setIsRunning] = useState(false);

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

  // Simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalCheckpoints: prev.totalCheckpoints + 1,
        gpuHoursGained: prev.gpuHoursGained + prev.gpuHoursPerCheckpoint,
      }));
    }, (config.checkpointIntervalMin * 60 * 1000) / config.simulationSpeed);

    return () => clearInterval(interval);
  }, [isRunning, config.checkpointIntervalMin, config.simulationSpeed, metrics.gpuHoursPerCheckpoint]);

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
        />

        <div className="vs-divider">VS</div>

        <CompetitorSystem
          config={config}
          metrics={metrics}
          isRunning={isRunning}
        />
      </div>

      <MetricsDisplay metrics={metrics} config={config} />
    </div>
  );
}

export default App;
