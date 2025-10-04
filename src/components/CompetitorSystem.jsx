import { useState, useEffect } from 'react';
import './CompetitorSystem.css';

function CompetitorSystem({ config, metrics, isRunning }) {
  const [ssdActivity, setSsdActivity] = useState(0);
  const [checkpointPhase, setCheckpointPhase] = useState('idle');

  useEffect(() => {
    if (!isRunning) {
      setSsdActivity(0);
      setCheckpointPhase('idle');
      return;
    }

    // Simulate checkpoint cycle
    const checkpointInterval = config.checkpointIntervalMin * 60 * 1000 / config.simulationSpeed;
    const writeTime = metrics.competitorCheckpointTime * 1000 / config.simulationSpeed;

    const cycle = () => {
      // Writing checkpoint to all-flash
      setCheckpointPhase('writing');
      setSsdActivity(100);

      setTimeout(() => {
        // Idle until next checkpoint
        setCheckpointPhase('idle');
        setSsdActivity(0);
      }, writeTime);
    };

    cycle();
    const interval = setInterval(cycle, checkpointInterval);

    return () => clearInterval(interval);
  }, [isRunning, config, metrics.competitorCheckpointTime]);

  // Calculate storage needed - all flash
  const ssdCount = 12;
  const ssdCapacityTB = 3.84;
  const totalCheckpoints = 10; // Store same number of checkpoints
  const totalCapacityNeeded = config.checkpointSizeTB * totalCheckpoints;
  const totalSsdsNeeded = Math.ceil(totalCapacityNeeded / ssdCapacityTB);

  return (
    <div className="system-container competitor-system">
      <h2>All-Flash Competitor</h2>
      <div className="system-specs">
        <div className="spec">Write Speed: <strong>20 GB/s</strong></div>
        <div className="spec">Checkpoint Time: <strong>{metrics.competitorCheckpointTime.toFixed(1)}s</strong></div>
      </div>

      <div className="storage-visualization">
        {/* GPU to SSD Data Flow */}
        {checkpointPhase === 'writing' && (
          <div className="gpu-flow">
            <div className="gpu-source">
              <div className="gpu-label">GPU Cluster Writing Checkpoint</div>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={`gpu-particle-${i}`}
                  className="data-stream slower"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: `${2 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* All SSD - Write Tier */}
        <div className="storage-tier">
          <h3>All-Flash Storage</h3>
          <div className="performance-badge slower">1.67 GB/s per SSD</div>
          <div className="storage-grid">
            {Array.from({ length: ssdCount }).map((_, i) => (
              <div
                key={`comp-ssd-${i}`}
                className={`storage-unit ssd competitor ${ssdActivity > 0 ? 'active' : ''}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: ssdActivity > 0 ? 1 : 0.6,
                }}
              >
                <div className="unit-label">SSD {i + 1}</div>
                <div className="unit-capacity">{ssdCapacityTB}TB</div>
                {ssdActivity > 0 && (
                  <div className="activity-indicator slower" style={{ width: `${ssdActivity}%` }} />
                )}
              </div>
            ))}
          </div>
          <div className="tier-stats">
            <div>Active: {(ssdCount * ssdCapacityTB).toFixed(1)} TB</div>
            <div className={`status ${checkpointPhase === 'writing' ? 'active' : ''}`}>
              {checkpointPhase === 'writing' ? '✓ Writing Checkpoint' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Additional SSDs needed for capacity */}
        {totalSsdsNeeded > ssdCount && (
          <>
            <div className="capacity-note">
              <div className="note-icon">⚠️</div>
              <div>Additional SSDs Required for Capacity</div>
            </div>
            <div className="storage-tier">
              <h3>Additional Flash Storage</h3>
              <div className="cost-badge warning">High Cost</div>
              <div className="storage-grid">
                {Array.from({ length: Math.min(totalSsdsNeeded - ssdCount, 12) }).map((_, i) => (
                  <div
                    key={`comp-extra-ssd-${i}`}
                    className="storage-unit ssd competitor extra"
                  >
                    <div className="unit-label">SSD {ssdCount + i + 1}</div>
                    <div className="unit-capacity">{ssdCapacityTB}TB</div>
                  </div>
                ))}
              </div>
              <div className="tier-stats">
                <div>Total: {(totalSsdsNeeded * ssdCapacityTB).toFixed(1)} TB</div>
                <div className="status">Archive Storage</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="system-limitations">
        <div className="limitation">⏱️ 2x Slower Writes</div>
        <div className="limitation">💸 8x Higher Storage Cost</div>
        <div className="limitation">📦 All-Flash Required</div>
      </div>
    </div>
  );
}

export default CompetitorSystem;
