import { useState, useEffect } from 'react';
import './CompetitorSystem.css';

function CompetitorSystem({ config, metrics, isRunning, checkpointTrigger, setIsRunning }) {
  const [ssdActivity, setSsdActivity] = useState(0);
  const [checkpointPhase, setCheckpointPhase] = useState('idle');
  const [nodeFillLevel, setNodeFillLevel] = useState(0); // 0-100% fill level - accumulates over time
  const [baselineFillLevel, setBaselineFillLevel] = useState(0); // Persistent fill level from previous checkpoints

  useEffect(() => {
    if (!isRunning || checkpointTrigger === 0) {
      return;
    }

    // Calculate storage needed - all flash
    const storageNodeCount = 8;
    const ssdsPerNode = 12;
    const ssdCapacityTB = config.ssdCapacityTB;
    const nodeCapacityTB = ssdsPerNode * ssdCapacityTB;
    const totalNodeCapacity = storageNodeCount * nodeCapacityTB;
    const checkpointSizeTB = config.checkpointSizeTB;

    // Writing checkpoint to all-flash
    setCheckpointPhase('writing');
    setSsdActivity(100);

    // Animate node filling over 5 seconds (2x slower than VDURA) to realistic fill level
    const fillDuration = 5000;
    const checkpointFillIncrement = (checkpointSizeTB / totalNodeCapacity) * 100; // 85/368.64 = ~23% per checkpoint
    const newTargetFillLevel = Math.min(100, baselineFillLevel + checkpointFillIncrement);

    console.log(`Checkpoint ${checkpointTrigger} - Current: ${baselineFillLevel.toFixed(1)}%, Adding: ${checkpointFillIncrement.toFixed(1)}%, New Target: ${newTargetFillLevel.toFixed(1)}%`);

    // Start from current baseline
    setNodeFillLevel(baselineFillLevel);

    const fillInterval = setInterval(() => {
      setNodeFillLevel(prev => {
        if (prev >= newTargetFillLevel) {
          clearInterval(fillInterval);
          return newTargetFillLevel;
        }
        return Math.min(newTargetFillLevel, prev + (checkpointFillIncrement / (fillDuration / 50)));
      });
    }, 50);

    setTimeout(() => {
      clearInterval(fillInterval);
      setNodeFillLevel(newTargetFillLevel);

      // Pause for 2 seconds after fill completes
      setTimeout(() => {
        // Check if storage is full (>= 95%)
        if (newTargetFillLevel >= 95) {
          // Storage is full - pause simulation
          setCheckpointPhase('idle');
          setSsdActivity(0);
          console.log('Competitor storage full - pausing simulation');
          setIsRunning(false);
        } else {
          // Not full yet - update baseline and go idle
          setBaselineFillLevel(newTargetFillLevel);
          setCheckpointPhase('idle');
          setSsdActivity(0);
        }
      }, 2000);
    }, fillDuration);
  }, [checkpointTrigger, isRunning, config.checkpointSizeTB, config.ssdCapacityTB, baselineFillLevel]);

  // Calculate storage needed - all flash
  const storageNodeCount = 8; // 8 Storage Nodes for active writes
  const ssdsPerNode = 12;
  const ssdCapacityTB = config.ssdCapacityTB;
  const nodeCapacityTB = ssdsPerNode * ssdCapacityTB;
  const totalNodeCapacity = storageNodeCount * nodeCapacityTB;

  // Calculate realistic fill level based on checkpoint size
  const checkpointSizeTB = config.checkpointSizeTB; // 85 TB
  const nodeFillPercentage = Math.min(100, (checkpointSizeTB / totalNodeCapacity) * 100); // 85/368.64 = ~23%

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
        <div className="gpu-flow">
          <div className="gpu-source">
            <div className="gpu-label">
              {checkpointPhase === 'writing' ? 'GPU Cluster Writing Checkpoint' : 'GPU Cluster Ready'}
            </div>
            {checkpointPhase === 'writing' && Array.from({ length: 20 }).map((_, i) => (
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
                <div className="fill-indicator node-fill" style={{ height: `${nodeFillLevel}%` }}></div>
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
            <div>Capacity Used: {nodeFillLevel.toFixed(1)}% ({(nodeFillLevel * totalNodeCapacity / 100).toFixed(1)} TB / {totalNodeCapacity.toFixed(1)} TB)</div>
            <div className={`status ${checkpointPhase === 'writing' ? 'active' : ''} ${nodeFillLevel >= 95 ? 'full' : ''}`}>
              {nodeFillLevel >= 95 ? '⚠️ STORAGE FULL - Resetting' :
               checkpointPhase === 'writing' ? '✓ Writing Checkpoint' : 'Ready'}
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
