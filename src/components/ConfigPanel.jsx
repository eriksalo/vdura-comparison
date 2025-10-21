import './ConfigPanel.css';

function ConfigPanel({ isRunning, setIsRunning }) {
  return (
    <div className="config-panel control-panel">
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
