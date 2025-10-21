import { useState, useEffect } from 'react';
import './VduraSystem.css';

function VduraSystem({ config, metrics, isRunning, checkpointTrigger, writeDuration }) {
  const [ssdActivity, setSsdActivity] = useState(0);
  const [hddActivity, setHddActivity] = useState(0);
  const [checkpointPhase, setCheckpointPhase] = useState('idle'); // idle, writing, migrating
  const [vpodFillLevel, setVpodFillLevel] = useState(0); // 0-100% fill level - accumulates
  const [jbodFillLevel, setJbodFillLevel] = useState(0); // 0-100% fill level
  const [checkpointsInVpod, setCheckpointsInVpod] = useState(0); // Track number of checkpoints stored
  const [gpuLabel, setGpuLabel] = useState('GPU Cluster Ready'); // GPU status label
  const [vpodStatus, setVpodStatus] = useState('Ready'); // VPOD status label
  const [jbodStatus, setJbodStatus] = useState('Standby'); // JBOD status label

  useEffect(() => {
    if (!isRunning || checkpointTrigger === 0) {
      return;
    }

    // Use current configuration values
    const ssdsPerNode = 12;
    const storageNodes = config.storageNodes;
    const ssdCapacityTB = config.vduraSsdCapacityTB;
    const totalVpodCapacity = storageNodes * ssdsPerNode * ssdCapacityTB;

    const hddPoolSizePB = config.vduraHddPoolSizePB;
    const totalJbodCapacity = hddPoolSizePB * 1000; // Convert PB to TB

    const cycle = () => {
      // Phase 1: Writing checkpoint to SSD
      setCheckpointPhase('writing');
      setSsdActivity(100);
      setHddActivity(0);
      setGpuLabel('GPU Cluster Writing Checkpoint');
      setVpodStatus('✓ Writing Checkpoint');
      setJbodStatus('Standby');

      // Calculate single checkpoint fill increment based on actual capacity
      const checkpointFillIncrement = (config.checkpointSizeTB / totalVpodCapacity) * 100;

      // Add checkpoint to current fill level
      setVpodFillLevel(prev => {
        const newLevel = Math.min(100, prev + checkpointFillIncrement);
        console.log(`VDURA: Writing checkpoint ${checkpointTrigger}. Fill: ${prev.toFixed(1)}% -> ${newLevel.toFixed(1)}%`);
        return newLevel;
      });

      const fillDuration = writeDuration;

      setTimeout(() => {
        setCheckpointsInVpod(prev => prev + 1);

        // Phase 2: Training phase - migrate data to HDD (longer pause to see the banner)
        setTimeout(() => {
          setCheckpointPhase('training');
          setSsdActivity(33); // Background migration
          setHddActivity(100);
          setGpuLabel('Training (GPUs Active)');
          setVpodStatus('Auto-tiering Data');
          setJbodStatus('✓ Receiving Data');

          // Migrate checkpoint to JBOD and remove from VPOD
          const migrationDuration = 30000; // 30 seconds for maximum visibility
          const jbodFillIncrement = (config.checkpointSizeTB / totalJbodCapacity) * 100;

          // Remove data from SSD and add to HDD
          setVpodFillLevel(prev => {
            const newLevel = Math.max(0, prev - checkpointFillIncrement);
            console.log(`VDURA: Migrating to HDD. SSD: ${prev.toFixed(1)}% -> ${newLevel.toFixed(1)}%`);
            return newLevel;
          });

          setJbodFillLevel(prev => {
            const newLevel = prev + jbodFillIncrement;
            console.log(`VDURA: Migrating to HDD. HDD: ${prev.toFixed(1)}% -> ${newLevel.toFixed(1)}%`);
            return newLevel;
          });

          setTimeout(() => {
            // Return to idle after training/migration
            setCheckpointPhase('idle');
            setSsdActivity(0);
            setHddActivity(0);
            setGpuLabel('GPU Cluster Ready');
            setVpodStatus('Ready');
            setJbodStatus('Standby');
          }, migrationDuration);
        }, 15000); // 15 seconds pause for maximum visibility
      }, fillDuration);
    };

    cycle();
  }, [checkpointTrigger, isRunning, config.checkpointSizeTB, config.storageNodes, config.vduraSsdCapacityTB, config.vduraHddPoolSizePB, writeDuration]);

  // Calculate storage distribution based on checkpoints to keep in flash
  const ssdsPerNode = 12;
  const storageNodes = config.storageNodes; // User-configurable number of nodes
  const ssdCapacityTB = config.vduraSsdCapacityTB;
  const totalVpodCapacity = storageNodes * ssdsPerNode * ssdCapacityTB;

  // Calculate realistic fill level based on checkpoint size
  const checkpointSizeTB = config.checkpointSizeTB;
  const vpodFillPercentage = Math.min(100, (checkpointSizeTB / totalVpodCapacity) * 100);

  // HDD pool configuration - use configured pool size
  const hddPoolSizePB = config.vduraHddPoolSizePB; // User configured pool size in PB
  const totalJbodCapacity = hddPoolSizePB * 1000; // Convert PB to TB

  // Calculate cylinder dimensions based on storage capacity
  // Width: based on total number of SSDs (nodes × SSDs per node)
  const totalSSDs = storageNodes * ssdsPerNode;
  const ssdWidth = 150 + (totalSSDs * 2.5); // Base 150px + 2.5px per SSD
  const ssdHeight = 80 + (ssdCapacityTB * 3); // Base 80px + 3px per TB

  // JBOD dimensions scale only with HDD pool size (independent of SSD/node configuration)
  // Base dimensions scale with the configured HDD pool size in PB
  const jbodWidth = 200 + (hddPoolSizePB * 15); // Base 200px + 15px per PB
  const jbodHeight = 120 + (hddPoolSizePB * 8); // Base 120px + 8px per PB

  return (
    <div className="system-container vdura-system">
      <h2>VDURA Flash First with HDD Capacity Expansion</h2>
      <div className="system-specs">
        <div className="spec">Write Speed: <strong>40 GB/s</strong></div>
        <div className="spec">Checkpoint Time: <strong>{metrics.vduraCheckpointTime.toFixed(1)}s</strong></div>
      </div>

      <div className="storage-visualization">
        {/* GPU to SSD Data Flow */}
        <div className="gpu-flow">
          <div className="gpu-source">
            <div className="gpu-label">
              {gpuLabel}
            </div>
            {checkpointPhase === 'writing' && (
              <div className="checkpoint-arrow">
                <div className="checkpoint-arrow-shape"></div>
                <div className="checkpoint-arrow-label">Checkpoint</div>
              </div>
            )}
          </div>
        </div>

        {/* VPOD Tier */}
        <div className="storage-tier">
          <h3>VPOD Flash Tier</h3>
          <div className="performance-badge">40 GB/s Write Speed</div>

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
                    <div className="banner-icon">🔄</div>
                    <div className="banner-text">
                      <div className="banner-title">TRAINING PHASE</div>
                      <div className="banner-subtitle">Auto-tiering data to HDD (GPUs continue training)</div>
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
              <div>{(totalVpodCapacity / 1000).toFixed(2)} PB</div>
              <div>{vpodFillLevel.toFixed(1)}% Full</div>
            </div>
            <div
              className={`storage-unit single-tank vpod ${ssdActivity > 0 ? 'active' : ''}`}
              style={{
                '--cylinder-width': `${ssdWidth}px`,
                '--cylinder-height': `${ssdHeight}px`,
                opacity: ssdActivity > 0 ? 1 : 0.8,
              }}
            >
              <div className="cylinder-body">
                <div className="fill-indicator" style={{ height: `${Math.max(0, (ssdHeight - 40) * (vpodFillLevel / 100))}px` }}></div>
              </div>
            </div>
          </div>
          <div className="tier-stats">
            <div className={`status ${vpodStatus.includes('Writing') ? 'active' : ''}`}>
              {vpodStatus}
            </div>
          </div>

          {/* Data Flow Animation - Inline */}
          {checkpointPhase === 'training' && (
            <div className="data-flow-inline">
              <div className="migration-arrows-inline">
                <div className="migration-arrow-inline">↓</div>
                <div className="migration-arrow-inline">↓</div>
                <div className="migration-arrow-inline">↓</div>
              </div>
              <div className="flow-label-inline">Auto-tiering to HDD</div>
            </div>
          )}

          {/* JBOD Tier - Directly Below SSD */}
          <h3 style={{ marginTop: '1rem' }}>JBOD Archive Tier</h3>
          <div className="cost-badge">8x Lower Cost</div>
          <div className="single-container-wrapper">
            <div
              className={`storage-unit single-tank jbod ${hddActivity > 0 ? 'active' : ''}`}
              style={{
                '--cylinder-width': `${jbodWidth}px`,
                '--cylinder-height': `${jbodHeight}px`,
                opacity: hddActivity > 0 ? 1 : 0.8,
              }}
            >
              <div className="cylinder-body">
                <div className="fill-indicator jbod-fill" style={{ height: `${Math.max(0, (jbodHeight - 40) * (jbodFillLevel / 100))}px` }}></div>
              </div>
              <div className="unit-label">
                <div>HDD Layer</div>
                <div>{hddPoolSizePB.toFixed(2)} PB</div>
                <div>{jbodFillLevel.toFixed(1)}% Full</div>
              </div>
            </div>
          </div>
          <div className="tier-stats">
            <div className={`status ${jbodStatus.includes('Receiving') ? 'active' : ''}`}>
              {jbodStatus}
            </div>
          </div>
        </div>
      </div>

      <div className="system-advantages">
        <div className="advantage">⚡ 2x Faster Writes</div>
        <div className="advantage">💰 Lower Cost per TB</div>
        <div className="advantage">🔄 Automatic Data Tiering</div>
      </div>
    </div>
  );
}

export default VduraSystem;
