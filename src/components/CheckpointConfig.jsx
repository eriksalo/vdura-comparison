import './ConfigPanel.css';

function CheckpointConfig({ config, setConfig, isRunning, setIsRunning, resetSimulation }) {
  const handleConfigChange = (newConfig) => {
    const wasRunning = isRunning;

    // Pause simulation
    if (wasRunning) {
      setIsRunning(false);
    }

    // Reset metrics
    resetSimulation();

    // Update config
    setConfig(newConfig);

    // Restart simulation after a brief delay
    if (wasRunning) {
      setTimeout(() => {
        setIsRunning(true);
      }, 100);
    }
  };

  return (
    <div className="config-panel checkpoint-config">
      <h2>Checkpoint Configuration</h2>

      <div className="config-grid">
        <div className="config-item">
          <label>GPU Count</label>
          <input
            type="number"
            min="1"
            max="128"
            value={config.gpuCount}
            onChange={(e) => handleConfigChange({ ...config, gpuCount: parseInt(e.target.value) })}
          />
        </div>

        <div className="config-item">
          <label>Checkpoint Size (TB)</label>
          <input
            type="number"
            min="1"
            max="10"
            step="0.5"
            value={config.checkpointSizeTB}
            onChange={(e) => handleConfigChange({ ...config, checkpointSizeTB: parseFloat(e.target.value) })}
          />
        </div>

        <div className="config-item">
          <label>Checkpoint Interval (min)</label>
          <input
            type="number"
            min="15"
            max="90"
            step="5"
            value={config.checkpointIntervalMin}
            onChange={(e) => handleConfigChange({ ...config, checkpointIntervalMin: parseInt(e.target.value) })}
          />
        </div>

        <div className="config-item">
          <label>Number of Storage Nodes</label>
          <input
            type="number"
            min="5"
            max="20"
            value={config.storageNodes}
            onChange={(e) => handleConfigChange({ ...config, storageNodes: Math.max(5, parseInt(e.target.value)) })}
          />
        </div>

        <div className="config-item">
          <label>Simulation Speed</label>
          <select
            value={config.simulationSpeed}
            onChange={(e) => handleConfigChange({ ...config, simulationSpeed: parseInt(e.target.value) })}
          >
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="100">100x</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default CheckpointConfig;
