import './ConfigPanel.css';

function CompetitorStorageConfig({ config, setConfig, isRunning, setIsRunning, resetSimulation }) {
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
    <div className="storage-config competitor-config">
      <h3>Competitor Storage Configuration</h3>

      <div className="config-grid-inline">
        <div className="config-item">
          <label>SSD Capacity (TB)</label>
          <select
            value={config.competitorSsdCapacityTB}
            onChange={(e) => handleConfigChange({ ...config, competitorSsdCapacityTB: parseFloat(e.target.value) })}
          >
            <option value="3.84">3.84 TB</option>
            <option value="7.68">7.68 TB</option>
            <option value="15.36">15.36 TB</option>
            <option value="30.72">30.72 TB</option>
            <option value="61.44">61.44 TB</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default CompetitorStorageConfig;
