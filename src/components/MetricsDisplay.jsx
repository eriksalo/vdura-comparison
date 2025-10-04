import './MetricsDisplay.css';

function MetricsDisplay({ metrics, config }) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  };

  const formatCurrency = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatLargeNumber = (num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  // Cost calculations
  const ssdCostPerTB = 150; // $150/TB for enterprise SSD
  const hddCostPerTB = 18;  // $18/TB for enterprise HDD

  const vduraSsdCapacity = 12 * 3.84; // 12 SSDs × 3.84TB per VPOD
  const vduraHddCapacity = 78 * 30; // 78 HDDs × 30TB per JBOD = 2340TB
  const vduraTotalCost = (vduraSsdCapacity * ssdCostPerTB) + (vduraHddCapacity * hddCostPerTB);

  const competitorTotalCapacity = Math.max(12 * 3.84, config.checkpointSizeTB * 10);
  const competitorTotalCost = competitorTotalCapacity * ssdCostPerTB;

  const costSavings = competitorTotalCost - vduraTotalCost;
  const costSavingsPercent = ((costSavings / competitorTotalCost) * 100).toFixed(1);

  // Calculate annual savings based on checkpoints per year
  // Use realistic 30-minute checkpoint interval for calculations (not the demo speed)
  const realisticCheckpointIntervalMin = 30;
  const checkpointsPerYear = (365 * 24 * 60) / realisticCheckpointIntervalMin;
  const annualGpuHoursGained = checkpointsPerYear * (metrics.gpuHoursPerCheckpoint || 0);

  // Assume GPU compute cost of $2/hour (typical cloud GPU pricing)
  const gpuCostPerHour = 2;
  const annualComputeSavings = annualGpuHoursGained * gpuCostPerHour;
  const totalAnnualSavings = costSavings + annualComputeSavings;

  return (
    <div className="metrics-display">
      <h2>Performance Metrics</h2>

      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-icon">⚡</div>
          <div className="metric-value">{formatLargeNumber(metrics.gpuHoursGained)}</div>
          <div className="metric-label">GPU Hours Gained</div>
          <div className="metric-sublabel">VDURA Advantage</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{metrics.totalCheckpoints}</div>
          <div className="metric-label">Checkpoints Completed</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {formatTime(metrics.vduraCheckpointTime)}
            <span className="vs-text">vs</span>
            {formatTime(metrics.competitorCheckpointTime)}
          </div>
          <div className="metric-label">Checkpoint Duration</div>
          <div className="metric-sublabel">VDURA vs Competitor</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {((metrics.competitorCheckpointTime / metrics.vduraCheckpointTime) || 1).toFixed(2)}x
          </div>
          <div className="metric-label">Speed Advantage</div>
          <div className="metric-sublabel">VDURA Faster</div>
        </div>

        <div className="metric-card cost">
          <div className="metric-icon">💰</div>
          <div className="metric-value">{formatCurrency(costSavings)}</div>
          <div className="metric-label">Hardware Cost Savings</div>
          <div className="metric-sublabel">{costSavingsPercent}% Lower than All-Flash</div>
        </div>

        <div className="metric-card annual-savings">
          <div className="metric-icon">💵</div>
          <div className="metric-value">{formatCurrency(totalAnnualSavings)}</div>
          <div className="metric-label">Total Annual Savings</div>
          <div className="metric-sublabel">Hardware + Compute Time</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{formatCurrency(annualComputeSavings)}</div>
          <div className="metric-label">Annual Compute Savings</div>
          <div className="metric-sublabel">{formatLargeNumber(annualGpuHoursGained)} GPU hrs/yr @ 30min intervals</div>
        </div>

        <div className="metric-card productivity">
          <div className="metric-icon">📈</div>
          <div className="metric-value">
            {(metrics.gpuHoursGained * 0.1).toFixed(1)} days
          </div>
          <div className="metric-label">Time Saved</div>
          <div className="metric-sublabel">Based on {config.gpuCount} GPUs</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {(metrics.gpuHoursPerCheckpoint || 0).toFixed(3)} hrs
          </div>
          <div className="metric-label">Hours Gained per Checkpoint</div>
          <div className="metric-sublabel">Per {config.checkpointIntervalMin}min interval</div>
        </div>
      </div>

      <div className="summary-banner">
        <strong>Summary:</strong> VDURA delivers {((metrics.competitorCheckpointTime / metrics.vduraCheckpointTime) || 1).toFixed(1)}x faster checkpoints,
        saving {formatCurrency(totalAnnualSavings)}/year ({formatCurrency(costSavings)} in hardware + {formatCurrency(annualComputeSavings)} in compute time)
        through Flash First architecture with HDD capacity expansion.
      </div>
    </div>
  );
}

export default MetricsDisplay;
