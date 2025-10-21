import { useState, useEffect } from 'react';
import './CompetitorSystem.css';

function CompetitorSystem({ config, metrics, isRunning, checkpointTrigger, setIsRunning, resetSimulation, writeDuration }) {
  const [ssdActivity, setSsdActivity] = useState(0);
  const [checkpointPhase, setCheckpointPhase] = useState('idle');
  const [nodeFillLevel, setNodeFillLevel] = useState(0); // 0-100% fill level - accumulates over time
  const [displayFillLevel, setDisplayFillLevel] = useState(0); // For displaying in text (updates less frequently)
  const [displayStatus, setDisplayStatus] = useState('Ready'); // For status text (updates less frequently)

  useEffect(() => {
    if (!isRunning || checkpointTrigger === 0) {
      return;
    }

    // Calculate storage needed - all flash using current config
    const storageNodes = config.storageNodes;
    const ssdsPerNode = 12;
    const ssdCapacityTB = config.competitorSsdCapacityTB;
    const totalNodeCapacity = storageNodes * ssdsPerNode * ssdCapacityTB;
    const checkpointSizeTB = config.checkpointSizeTB;

    // Writing checkpoint to all-flash
    setCheckpointPhase('writing');
    setSsdActivity(100);
    setDisplayStatus('✓ Writing Checkpoint');

    // Calculate checkpoint fill increment based on actual capacity
    const fillDuration = writeDuration;
    const checkpointFillIncrement = (checkpointSizeTB / totalNodeCapacity) * 100;

    // Add checkpoint to current fill level
    setNodeFillLevel(prev => {
      const newLevel = Math.min(100, prev + checkpointFillIncrement);
      console.log(`Competitor: Writing checkpoint ${checkpointTrigger}. Fill: ${prev.toFixed(1)}% -> ${newLevel.toFixed(1)}%`);
      return newLevel;
    });

    setTimeout(() => {
      setDisplayFillLevel(prev => {
        const newLevel = Math.min(100, prev + checkpointFillIncrement);

        // Pause for 15 seconds after fill completes (maximum visibility)
        setTimeout(() => {
          // Check if storage is full (>= 95%)
          if (newLevel >= 95) {
            // Storage is full - restart simulation
            setCheckpointPhase('idle');
            setSsdActivity(0);
            setDisplayStatus('⚠️ STORAGE FULL - Restarting...');
            console.log('Competitor storage full - restarting simulation');

            // Wait 3 seconds to show the "STORAGE FULL" message, then restart
            setTimeout(() => {
              setIsRunning(false);
              resetSimulation();
              setTimeout(() => {
                setIsRunning(true);
              }, 100);
            }, 3000);
          } else {
            // Not full yet - show training phase (competitor does nothing during training)
            setCheckpointPhase('training');
            setSsdActivity(0);
            setDisplayStatus('Training (No Data Movement)');

            // Training phase lasts 30 seconds (matches VDURA migration)
            setTimeout(() => {
              setCheckpointPhase('idle');
              setDisplayStatus('Ready');
            }, 30000);
          }
        }, 15000);

        return newLevel;
      });
    }, fillDuration);
  }, [checkpointTrigger, isRunning, config.checkpointSizeTB, config.competitorSsdCapacityTB, config.storageNodes, writeDuration, setIsRunning, resetSimulation]);

  // Calculate storage needed - all flash
  const storageNodes = config.storageNodes; // Use same node count as VDURA
  const ssdsPerNode = 12;
  const ssdCapacityTB = config.competitorSsdCapacityTB;
  const nodeCapacityTB = ssdsPerNode * ssdCapacityTB;
  const totalNodeCapacity = storageNodes * nodeCapacityTB;

  // Calculate realistic fill level based on checkpoint size
  const checkpointSizeTB = config.checkpointSizeTB;
  const nodeFillPercentage = Math.min(100, (checkpointSizeTB / totalNodeCapacity) * 100);

  const totalCheckpoints = 10; // Store same number of checkpoints
  const totalCapacityNeeded = config.checkpointSizeTB * totalCheckpoints;
  const additionalNodesNeeded = Math.max(0, Math.ceil((totalCapacityNeeded - totalNodeCapacity) / nodeCapacityTB));

  // Calculate cylinder dimensions based on storage capacity
  // Width: same as VDURA (same SSD count across both systems)
  const totalSSDs = storageNodes * ssdsPerNode;
  const ssdWidth = 150 + (totalSSDs * 2.5); // Same width calculation as VDURA
  const ssdHeight = 80 + (ssdCapacityTB * 3); // Same height calculation as VDURA (based on capacity)

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
            {checkpointPhase === 'writing' && (
              <div className="checkpoint-arrow">
                <div className="checkpoint-arrow-shape"></div>
                <div className="checkpoint-arrow-label">Checkpoint</div>
              </div>
            )}
          </div>
        </div>

        {/* Storage Node - Write Tier */}
        <div className="storage-tier">
          <h3>All-Flash Storage</h3>
          <div className="performance-badge slower">20 GB/s Write Speed</div>

          {/* Phase Banner */}
          {checkpointPhase !== 'idle' && (
            <div className={`phase-banner ${checkpointPhase}`}>
              <div className="banner-content">
                {checkpointPhase === 'writing' && (
                  <>
                    <div className="banner-icon">📝</div>
                    <div className="banner-text">
                      <div className="banner-title">CHECKPOINT WRITE PHASE</div>
                      <div className="banner-subtitle">Writing checkpoint data to flash storage</div>
                    </div>
                  </>
                )}
                {checkpointPhase === 'training' && (
                  <>
                    <div className="banner-icon">⏸️</div>
                    <div className="banner-text">
                      <div className="banner-title">TRAINING PHASE</div>
                      <div className="banner-subtitle">No data movement (all data remains in flash)</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="single-container-wrapper">
            <div className="unit-label unit-label-top">
              <div>SSD Layer</div>
              <div>{storageNodes} Nodes</div>
              <div>{(totalNodeCapacity / 1000).toFixed(2)} PB</div>
              <div>{nodeFillLevel.toFixed(1)}% Full</div>
            </div>
            <div
              className={`storage-unit single-tank competitor ${ssdActivity > 0 ? 'active' : ''}`}
              style={{
                '--cylinder-width': `${ssdWidth}px`,
                '--cylinder-height': `${ssdHeight}px`,
                opacity: ssdActivity > 0 ? 1 : 0.8,
              }}
            >
              <div className="cylinder-body">
                <div className="fill-indicator node-fill" style={{ height: `${Math.max(0, (ssdHeight - 40) * (nodeFillLevel / 100))}px` }}></div>
              </div>
            </div>
          </div>
          <div className="tier-stats">
            <div className={`status ${displayStatus.includes('Writing') ? 'active' : ''} ${displayFillLevel >= 95 ? 'full' : ''}`}>
              {displayStatus}
            </div>
          </div>
        </div>

        {/* Additional Storage Nodes needed for capacity */}
        {additionalNodesNeeded > 0 && (
          <>
            <div className="capacity-note">
              <div className="note-icon">⚠️</div>
              <div>Additional All-Flash Storage Required for Capacity</div>
            </div>
            <div className="storage-tier">
              <h3>Additional Flash Storage</h3>
              <div className="cost-badge warning">High Cost</div>
              <div className="single-container-wrapper">
                <div className="storage-unit single-tank node competitor extra">
                  <div className="unit-label">Additional Storage</div>
                  <div className="unit-detail">{additionalNodesNeeded} More Nodes Required</div>
                  <div className="unit-capacity">{(additionalNodesNeeded * nodeCapacityTB).toFixed(1)} TB</div>
                </div>
              </div>
              <div className="tier-stats">
                <div>Total Needed: {(totalCapacityNeeded).toFixed(1)} TB</div>
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
