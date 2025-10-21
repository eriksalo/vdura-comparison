import { useState, useEffect } from 'react';
import './VduraSystem.css';

function VduraSystem({ config, metrics, isRunning, checkpointTrigger, writeDuration, competitorWriteDuration }) {
  const [ssdActivity, setSsdActivity] = useState(0);
  const [hddActivity, setHddActivity] = useState(0);
  const [checkpointPhase, setCheckpointPhase] = useState('idle'); // idle, writing, migrating
  const [vpodFillLevel, setVpodFillLevel] = useState(0); // 0-100% fill level - accumulates
  const [jbodFillLevel, setJbodFillLevel] = useState(0); // 0-100% fill level
  const [checkpointsInVpod, setCheckpointsInVpod] = useState(0); // Track number of checkpoints stored
  const [gpuLabel, setGpuLabel] = useState('GPU Cluster Ready'); // GPU status label
  const [vpodStatus, setVpodStatus] = useState('Ready'); // VPOD status label
  const [jbodStatus, setJbodStatus] = useState('Standby'); // JBOD status label

  // Reset all storage when simulation is reset (checkpointTrigger becomes 0)
  useEffect(() => {
    if (checkpointTrigger === 0) {
      setVpodFillLevel(0);
      setJbodFillLevel(0);
      setCheckpointsInVpod(0);
      setCheckpointPhase('idle');
      setSsdActivity(0);
      setHddActivity(0);
      setGpuLabel('GPU Cluster Ready');
      setVpodStatus('Ready');
      setJbodStatus('Standby');
    }
  }, [checkpointTrigger]);

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
        // Checkpoint write is complete - update checkpoint count
        setCheckpointsInVpod(prev => prev + 1);

        // Wait for competitor to finish writing before transitioning to model run
        // This ensures banners are synchronized
        const waitForCompetitor = Math.max(0, competitorWriteDuration - fillDuration);

        setTimeout(() => {
          // Model Run Phase - check if we need to migrate
          const currentCheckpointCount = checkpointsInVpod + 1; // Already incremented above
          const shouldMigrate = currentCheckpointCount > config.vduraCheckpointsInFlash;

          if (shouldMigrate) {
            // Migrate oldest checkpoint to HDD during model run
            setCheckpointPhase('training');
            setSsdActivity(33); // Background migration
            setHddActivity(100);
            setGpuLabel('Model Running');
            setVpodStatus('Auto-tiering Data');
            setJbodStatus('✓ Receiving Data');

            // Migrate checkpoint to JBOD and remove from VPOD
            const jbodFillIncrement = (config.checkpointSizeTB / totalJbodCapacity) * 100;

            // Remove one checkpoint worth of data from SSD and add to HDD
            setVpodFillLevel(prev => {
              const newLevel = Math.max(0, prev - checkpointFillIncrement);
              console.log(`VDURA: Migrating to HDD during model run. SSD: ${prev.toFixed(1)}% -> ${newLevel.toFixed(1)}%`);
              return newLevel;
            });

            setJbodFillLevel(prev => {
              const newLevel = prev + jbodFillIncrement;
              console.log(`VDURA: Migrating to HDD. HDD: ${prev.toFixed(1)}% -> ${newLevel.toFixed(1)}%`);
              return newLevel;
            });

            setCheckpointsInVpod(config.vduraCheckpointsInFlash); // Keep count at max

            // Return to idle after migration + training (45 seconds)
            setTimeout(() => {
              setCheckpointPhase('idle');
              setSsdActivity(0);
              setHddActivity(0);
              setGpuLabel('GPU Cluster Ready');
              setVpodStatus('Ready');
              setJbodStatus('Standby');
            }, 45000);
          } else {
            // Just model running, no migration yet (haven't reached checkpoint limit)
            setCheckpointPhase('training');
            setSsdActivity(0);
            setHddActivity(0);
            setGpuLabel('Model Running');
            setVpodStatus('Ready');
            setJbodStatus('Standby');

            // Return to ready after training period (45 seconds)
            setTimeout(() => {
              setCheckpointPhase('idle');
              setGpuLabel('GPU Cluster Ready');
            }, 45000);
          }
        }, waitForCompetitor);
      }, fillDuration);
    };

    cycle();
  }, [checkpointTrigger, isRunning, config.checkpointSizeTB, config.storageNodes, config.vduraSsdCapacityTB, config.vduraHddPoolSizePB, config.vduraCheckpointsInFlash, writeDuration, competitorWriteDuration, checkpointsInVpod]);

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

  // JBOD dimensions: make VOLUME proportional to capacity
  // Cylinders are 3D objects, so viewers perceive volume, not area
  // For cylinder: Volume = π × r² × h
  // We want: (jbodVolume / ssdVolume) = (totalJbodCapacity / totalVpodCapacity)

  const capacityRatio = totalJbodCapacity / totalVpodCapacity;

  // SSD cylinder volume
  const ssdRadius = ssdWidth / 2;
  const ssdVolume = Math.PI * ssdRadius * ssdRadius * ssdHeight;

  // Target HDD volume based on capacity ratio
  const targetJbodVolume = ssdVolume * capacityRatio;

  // For proportional 3D scaling with aesthetic (taller and narrower)
  // Choose height first (taller), then calculate width to maintain volume ratio
  const scaleFactor = Math.cbrt(capacityRatio);

  // Make it 30% taller than uniform scaling would suggest
  const jbodHeight = ssdHeight * scaleFactor * 1.3;

  // Calculate width needed to achieve target volume with this height
  // V = π × r² × h, so r² = V / (π × h), and width = 2r
  const targetRadiusSquared = targetJbodVolume / (Math.PI * jbodHeight);
  const jbodWidth = 2 * Math.sqrt(targetRadiusSquared);

  // Debug: verify volumes are proportional
  const jbodRadius = jbodWidth / 2;
  const actualJbodVolume = Math.PI * jbodRadius * jbodRadius * jbodHeight;
  const volumeRatio = actualJbodVolume / ssdVolume;

  console.log('VDURA Volume Check:', {
    ssdCapacityTB: totalVpodCapacity.toFixed(0),
    hddCapacityTB: totalJbodCapacity.toFixed(0),
    capacityRatio: capacityRatio.toFixed(2),
    ssdDimensions: { width: ssdWidth.toFixed(0), height: ssdHeight.toFixed(0) },
    hddDimensions: { width: jbodWidth.toFixed(0), height: jbodHeight.toFixed(0) },
    ssdVolume: ssdVolume.toFixed(0),
    hddVolume: actualJbodVolume.toFixed(0),
    volumeRatio: volumeRatio.toFixed(2),
    shouldBe: capacityRatio.toFixed(2)
  });

  return (
    <div className="system-container vdura-system">
      <h2>VDURA Flash First with HDD Capacity Expansion</h2>
      <div className="system-specs">
        <div className="spec">Total Write Speed: <strong>{(40 * storageNodes)} GB/s</strong></div>
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
          <div className="performance-badge">{(40 * storageNodes)} GB/s Total Write Speed</div>

          {/* Phase Banner */}
          {(checkpointPhase !== 'idle' || gpuLabel === 'Model Running') && (
            <div className={`phase-banner ${checkpointPhase === 'idle' ? 'training' : checkpointPhase}`}>
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
                {(checkpointPhase === 'training' || (checkpointPhase === 'idle' && gpuLabel === 'Model Running')) && (
                  <>
                    <div className="banner-icon">{checkpointPhase === 'training' ? '🔄' : '▶️'}</div>
                    <div className="banner-text">
                      <div className="banner-title">MODEL RUNNING</div>
                      <div className="banner-subtitle">
                        {checkpointPhase === 'training'
                          ? 'Auto-tiering data to HDD (GPUs continue training)'
                          : 'GPUs processing model training'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="single-container-wrapper">
            <div className="unit-label unit-label-top">
              <div>SSD Layer</div>
              <div>{storageNodes} Nodes × 40 GB/s = {(storageNodes * 40)} GB/s</div>
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

          {/* Data Flow Animation - Inline - Always visible, animates when migrating */}
          <div className={`data-flow-inline ${checkpointPhase === 'training' && hddActivity > 0 ? 'active-migration' : ''}`}>
            <div className="migration-arrows-inline">
              <div className="migration-arrow-inline">⬇</div>
              <div className="migration-arrow-inline">⬇</div>
              <div className="migration-arrow-inline">⬇</div>
              <div className="migration-arrow-inline">⬇</div>
              <div className="migration-arrow-inline">⬇</div>
            </div>
            {checkpointPhase === 'training' && hddActivity > 0 && (
              <div className="flow-label-inline">
                <div className="flow-icon">🔄</div>
                <div>Auto-tiering to HDD</div>
                <div className="flow-subtext">Data Migration in Progress</div>
              </div>
            )}
          </div>

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
