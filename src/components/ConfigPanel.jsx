import './ConfigPanel.css';

function ConfigPanel({ config, setConfig, isRunning, setIsRunning }) {
  return (
    <div className="config-panel">
      <h2>Configuration</h2>

      <div className="config-grid">
        <div className="config-item">
          <label>GPU Count</label>
          <input
            type="number"
            min="1"
            max="128"
            value={config.gpuCount}
            onChange={(e) => setConfig({ ...config, gpuCount: parseInt(e.target.value) })}
            disabled={isRunning}
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
            onChange={(e) => setConfig({ ...config, checkpointSizeTB: parseFloat(e.target.value) })}
            disabled={isRunning}
          />
        </div>

        <div className="config-item">
          <label>Checkpoint Interval (min)</label>
          <input
            type="number"
            min="15"
            max="120"
            step="5"
            value={config.checkpointIntervalMin}
            onChange={(e) => setConfig({ ...config, checkpointIntervalMin: parseInt(e.target.value) })}
            disabled={isRunning}
          />
        </div>

        <div className="config-item">
          <label>Simulation Speed</label>
          <select
            value={config.simulationSpeed}
            onChange={(e) => setConfig({ ...config, simulationSpeed: parseInt(e.target.value) })}
          >
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="100">100x</option>
          </select>
        </div>
      </div>

      <div className="control-buttons">
        <button
          className={isRunning ? "stop-btn" : "start-btn"}
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? "Stop Simulation" : "Start Simulation"}
        </button>
        {!isRunning && (
          <button
            className="reset-btn"
            onClick={() => window.location.reload()}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default ConfigPanel;
