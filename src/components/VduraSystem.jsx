import { useState, useEffect } from 'react';
import './VduraSystem.css';

function VduraSystem({ config, metrics, isRunning, checkpointTrigger }) {
  const [ssdActivity, setSsdActivity] = useState(0);
  const [hddActivity, setHddActivity] = useState(0);
  const [checkpointPhase, setCheckpointPhase] = useState('idle'); // idle, writing, migrating
  const [vpodFillLevel, setVpodFillLevel] = useState(0); // 0-100% fill level - accumulates
  const [jbodFillLevel, setJbodFillLevel] = useState(0); // 0-100% fill level
  const [checkpointsInVpod, setCheckpointsInVpod] = useState(0); // Track number of checkpoints stored

  useEffect(() => {
    if (!isRunning || checkpointTrigger === 0) {
      return;
    }

    // Calculate storage distribution based on checkpoints to keep in flash
    const ssdsPerVpod = 12;
    const ssdCapacityTB = config.ssdCapacityTB;
    const vpodCapacityTB = ssdsPerVpod * ssdCapacityTB;
    const vpodCount = 3; // Fixed at 3 VPODs
    const totalVpodCapacity = vpodCount * vpodCapacityTB;

    const jbodCount = 3;
    const hddsPerJbod = 78;
    const hddCapacityTB = 30;
    const jbodCapacityTB = hddsPerJbod * hddCapacityTB;

    const cycle = () => {
      // Phase 1: Writing checkpoint to SSD (VPODs accumulate)
      setCheckpointPhase('writing');
      setSsdActivity(100);
      setHddActivity(0);

      // Animate VPOD filling over 5 seconds - adds one checkpoint
      const fillDuration = 5000;
      const checkpointFillIncrement = (config.checkpointSizeTB / totalVpodCapacity) * 100;
      const newCheckpointCount = checkpointsInVpod + 1;
      const newTargetFillLevel = Math.min(100, (config.checkpointSizeTB * newCheckpointCount / totalVpodCapacity) * 100);

      const fillInterval = setInterval(() => {
        setVpodFillLevel(prev => {
          if (prev >= newTargetFillLevel) {
            clearInterval(fillInterval);
            return newTargetFillLevel;
          }
          return Math.min(newTargetFillLevel, prev + (checkpointFillIncrement / (fillDuration / 50)));
        });
      }, 50);

      setTimeout(() => {
        clearInterval(fillInterval);
        setVpodFillLevel(newTargetFillLevel);
        setCheckpointsInVpod(newCheckpointCount);

        console.log(`VDURA: ${newCheckpointCount} checkpoints in flash (${newTargetFillLevel.toFixed(1)}% full)`);

        // Pause for 2 seconds
        setTimeout(() => {
          // Check if we need to migrate to HDD
          if (newCheckpointCount >= config.vduraCheckpointsInFlash) {
            // Phase 2: Migrate ALL checkpoints to HDD (VPODs empty completely)
            console.log(`VDURA: Migrating ${newCheckpointCount} checkpoints to JBOD`);
            setCheckpointPhase('migrating');
            setSsdActivity(33); // 1GB/s out of 3GB/s capacity
            setHddActivity(100);

            // Animate VPOD emptying and JBOD filling
            const migrationDuration = 3000;
            const jbodFillIncrement = (config.checkpointSizeTB * newCheckpointCount / (jbodCount * jbodCapacityTB)) * 100;

            const emptyInterval = setInterval(() => {
              setVpodFillLevel(prev => Math.max(0, prev - (newTargetFillLevel / (migrationDuration / 50))));
              setJbodFillLevel(prev => prev + (jbodFillIncrement / (migrationDuration / 50)));
            }, 50);

            setTimeout(() => {
              clearInterval(emptyInterval);
              setVpodFillLevel(0); // VPODs completely empty
              setCheckpointsInVpod(0); // Reset checkpoint counter

              // Pause for 2 seconds before next cycle
              setTimeout(() => {
                setCheckpointPhase('idle');
                setSsdActivity(0);
                setHddActivity(0);
              }, 2000);
            }, migrationDuration);
          } else {
            // Not full yet - just go idle, keep checkpoints in flash
            setCheckpointPhase('idle');
            setSsdActivity(0);
            setHddActivity(0);
          }
        }, 2000);
      }, fillDuration);
    };

    cycle();
  }, [checkpointTrigger, isRunning, config.checkpointSizeTB]);

  // Calculate storage distribution based on checkpoints to keep in flash
  const ssdsPerVpod = 12;
  const ssdCapacityTB = config.ssdCapacityTB;
  const vpodCapacityTB = ssdsPerVpod * ssdCapacityTB;
  const vpodCount = 3; // Fixed at 3 VPODs
  const totalVpodCapacity = vpodCount * vpodCapacityTB;

  // Calculate realistic fill level based on checkpoint size
  const checkpointSizeTB = config.checkpointSizeTB; // 85 TB
  const vpodFillPercentage = Math.min(100, (checkpointSizeTB / totalVpodCapacity) * 100); // 85/138.24 = ~61.5%

  const jbodCount = 3; // 3 JBODs minimum
  const hddsPerJbod = 78;
  const hddCapacityTB = 30; // 30TB HDDs
  const jbodCapacityTB = hddsPerJbod * hddCapacityTB; // 2340 TB per JBOD
  const totalJbodCapacity = jbodCount * jbodCapacityTB; // 7020 TB total

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
              {checkpointPhase === 'writing' ? 'GPU Cluster Writing Checkpoint' : 'GPU Cluster Ready'}
            </div>
            {checkpointPhase === 'writing' && Array.from({ length: 30 }).map((_, i) => (
              <div
                key={`gpu-particle-${i}`}
                className="data-stream"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${1 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* VPOD Tier */}
        <div className="storage-tier">
          <h3>VPOD (Fast SSD Write Tier)</h3>
          <div className="performance-badge">40 GB/s per VPOD</div>
          <div className="storage-grid vpod-grid">
            {Array.from({ length: vpodCount }).map((_, i) => (
              <div
                key={`vpod-${i}`}
                className={`storage-unit vpod ${ssdActivity > 0 ? 'active' : ''}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: ssdActivity > 0 ? 1 : 0.6,
                }}
              >
                <div className="fill-indicator" style={{ height: `${vpodFillLevel}%` }}></div>
                <div className="unit-label">VPOD {i + 1}</div>
                <div className="unit-detail">{ssdsPerVpod} × {ssdCapacityTB}TB SSDs</div>
                <div className="unit-capacity">{vpodCapacityTB.toFixed(1)} TB</div>
                {ssdActivity > 0 && (
                  <div className="activity-indicator" style={{ width: `${ssdActivity}%` }} />
                )}
              </div>
            ))}
          </div>
          <div className="tier-stats">
            <div>Total Capacity: {totalVpodCapacity.toFixed(1)} TB ({vpodCount} VPODs)</div>
            <div className={`status ${checkpointPhase === 'writing' ? 'active' : ''}`}>
              {checkpointPhase === 'writing' ? '✓ Writing Checkpoint' :
               checkpointPhase === 'migrating' ? 'Migrating Data' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Data Flow Animation */}
        <div className={`data-flow ${checkpointPhase === 'migrating' ? 'active' : ''}`}>
          <div className="flow-container">
            {checkpointPhase === 'migrating' && (
              <>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={`particle-${i}`}
                    className="data-particle"
                    style={{
                      left: `${(i * 5) % 100}%`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  />
                ))}
              </>
            )}
            <div className="flow-arrow">↓</div>
            <div className="flow-label">Auto-tiering to HDD</div>
          </div>
        </div>

        {/* JBOD Tier */}
        <div className="storage-tier">
          <h3>JBOD (Archive Tier)</h3>
          <div className="cost-badge">8x Lower Cost</div>
          <div className="storage-grid jbod-grid">
            {Array.from({ length: jbodCount }).map((_, i) => (
              <div
                key={`jbod-${i}`}
                className={`storage-unit jbod ${hddActivity > 0 ? 'active' : ''}`}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  opacity: hddActivity > 0 ? 1 : 0.6,
                }}
              >
                <div className="fill-indicator jbod-fill" style={{ height: `${jbodFillLevel}%` }}></div>
                <div className="unit-label">JBOD {i + 1}</div>
                <div className="unit-detail">{hddsPerJbod} × {hddCapacityTB}TB HDDs</div>
                <div className="unit-capacity">{jbodCapacityTB.toFixed(0)} TB</div>
                {hddActivity > 0 && (
                  <div className="activity-indicator" style={{ width: `${hddActivity}%` }} />
                )}
              </div>
            ))}
          </div>
          <div className="tier-stats">
            <div>Total Capacity: {totalJbodCapacity.toFixed(0)} TB ({jbodCount} JBODs)</div>
            <div className={`status ${checkpointPhase === 'migrating' ? 'active' : ''}`}>
              {checkpointPhase === 'migrating' ? '✓ Receiving Data' : 'Standby'}
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
