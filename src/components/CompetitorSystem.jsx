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
  const storageNodeCount = 8; // 8 Storage Nodes for active writes
  const ssdsPerNode = 12;
  const ssdCapacityTB = 3.84;
  const nodeCapacityTB = ssdsPerNode * ssdCapacityTB; // 46.08 TB per node
  const totalNodeCapacity = storageNodeCount * nodeCapacityTB; // 368.64 TB total

  const totalCheckpoints = 10; // Store same number of checkpoints
  const totalCapacityNeeded = config.checkpointSizeTB * totalCheckpoints;
  const additionalNodesNeeded = Math.max(0, Math.ceil((totalCapacityNeeded - totalNodeCapacity) / nodeCapacityTB));

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

        {/* Storage Node - Write Tier */}
        <div className="storage-tier">
          <h3>Storage Node (All-Flash)</h3>
          <div className="performance-badge slower">20 GB/s per Node</div>
          <div className="storage-grid node-grid">
            {Array.from({ length: storageNodeCount }).map((_, i) => (
              <div
                key={`node-${i}`}
                className={`storage-unit node competitor ${ssdActivity > 0 ? 'active' : ''}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: ssdActivity > 0 ? 1 : 0.6,
                }}
              >
                <div className="unit-label">Storage Node {i + 1}</div>
                <div className="unit-detail">{ssdsPerNode} × {ssdCapacityTB}TB SSDs</div>
                <div className="unit-capacity">{nodeCapacityTB.toFixed(1)} TB</div>
                {ssdActivity > 0 && (
                  <div className="activity-indicator slower" style={{ width: `${ssdActivity}%` }} />
                )}
              </div>
            ))}
          </div>
          <div className="tier-stats">
            <div>Total Capacity: {totalNodeCapacity.toFixed(1)} TB ({storageNodeCount} Nodes)</div>
            <div className={`status ${checkpointPhase === 'writing' ? 'active' : ''}`}>
              {checkpointPhase === 'writing' ? '✓ Writing Checkpoint' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Additional Storage Nodes needed for capacity */}
        {additionalNodesNeeded > 0 && (
          <>
            <div className="capacity-note">
              <div className="note-icon">⚠️</div>
              <div>Additional All-Flash Nodes Required for Capacity</div>
            </div>
            <div className="storage-tier">
              <h3>Additional Storage Nodes</h3>
              <div className="cost-badge warning">High Cost</div>
              <div className="storage-grid node-grid">
                {Array.from({ length: Math.min(additionalNodesNeeded, 3) }).map((_, i) => (
                  <div
                    key={`node-extra-${i}`}
                    className="storage-unit node competitor extra"
                  >
                    <div className="unit-label">Storage Node {storageNodeCount + i + 1}</div>
                    <div className="unit-detail">{ssdsPerNode} × {ssdCapacityTB}TB SSDs</div>
                    <div className="unit-capacity">{nodeCapacityTB.toFixed(1)} TB</div>
                  </div>
                ))}
              </div>
              <div className="tier-stats">
                <div>Total: {(totalCapacityNeeded).toFixed(1)} TB</div>
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
