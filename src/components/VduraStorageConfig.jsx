import './ConfigPanel.css';

function VduraStorageConfig({ config, setConfig, isRunning, setIsRunning, resetSimulation }) {
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
    <div className="storage-config vdura-config">
      <h3>VDURA Storage Configuration</h3>

      <div className="config-grid-inline">
        <div className="config-item">
          <label>SSD Capacity (TB)</label>
          <select
            value={config.vduraSsdCapacityTB}
            onChange={(e) => handleConfigChange({ ...config, vduraSsdCapacityTB: parseFloat(e.target.value) })}
          >
            <option value="3.84">3.84 TB</option>
            <option value="7.68">7.68 TB</option>
            <option value="15.36">15.36 TB</option>
            <option value="30.72">30.72 TB</option>
            <option value="61.44">61.44 TB</option>
          </select>
        </div>

        <div className="config-item">
          <label>HDD Pool Size (PB)</label>
          <input
            type="number"
            min="3"
            max="50"
            step="0.5"
            value={config.vduraHddPoolSizePB}
            onChange={(e) => handleConfigChange({ ...config, vduraHddPoolSizePB: parseFloat(e.target.value) })}
          />
        </div>

        <div className="config-item">
          <label>Checkpoints in Flash</label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.vduraCheckpointsInFlash}
            onChange={(e) => handleConfigChange({ ...config, vduraCheckpointsInFlash: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

export default VduraStorageConfig;
