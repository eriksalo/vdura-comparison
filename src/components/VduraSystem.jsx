import { useState, useEffect } from 'react';
import './VduraSystem.css';

function VduraSystem({ config, metrics, isRunning }) {
  const [ssdActivity, setSsdActivity] = useState(0);
  const [hddActivity, setHddActivity] = useState(0);
  const [checkpointPhase, setCheckpointPhase] = useState('idle'); // idle, writing, migrating

  useEffect(() => {
    if (!isRunning) {
      setSsdActivity(0);
      setHddActivity(0);
      setCheckpointPhase('idle');
      return;
    }

    // Simulate checkpoint cycle
    const checkpointInterval = config.checkpointIntervalMin * 60 * 1000 / config.simulationSpeed;
    const writeTime = metrics.vduraCheckpointTime * 1000 / config.simulationSpeed;

    const cycle = () => {
      // Phase 1: Writing checkpoint to SSD
      setCheckpointPhase('writing');
      setSsdActivity(100);
      setHddActivity(0);

      setTimeout(() => {
        // Phase 2: Migrating old checkpoints to HDD
        setCheckpointPhase('migrating');
        setSsdActivity(33); // 1GB/s out of 3GB/s capacity
        setHddActivity(100);

        setTimeout(() => {
          // Phase 3: Idle until next checkpoint
          setCheckpointPhase('idle');
          setSsdActivity(0);
          setHddActivity(0);
        }, writeTime * 2); // Migration takes some time
      }, writeTime);
    };

    cycle();
    const interval = setInterval(cycle, checkpointInterval);

    return () => clearInterval(interval);
  }, [isRunning, config, metrics.vduraCheckpointTime]);

  // Calculate storage distribution
  const vpodCount = 1; // 1 VPOD = 12 SSDs
  const ssdsPerVpod = 12;
  const ssdCapacityTB = 3.84;
  const vpodCapacityTB = ssdsPerVpod * ssdCapacityTB; // 46.08 TB per VPOD

  const jbodCount = 1; // 1 JBOD
  const hddsPerJbod = 78;
  const hddCapacityTB = 30; // 30TB HDDs
  const jbodCapacityTB = hddsPerJbod * hddCapacityTB; // 2340 TB per JBOD

  return (
    <div className="system-container vdura-system">
      <h2>VDURA Flash First with HDD Capacity Expansion</h2>
      <div className="system-specs">
        <div className="spec">Write Speed: <strong>40 GB/s</strong></div>
        <div className="spec">Checkpoint Time: <strong>{metrics.vduraCheckpointTime.toFixed(1)}s</strong></div>
      </div>

      <div className="storage-visualization">
        {/* GPU to SSD Data Flow */}
        {checkpointPhase === 'writing' && (
          <div className="gpu-flow">
            <div className="gpu-source">
              <div className="gpu-label">GPU Cluster Writing Checkpoint</div>
              {Array.from({ length: 30 }).map((_, i) => (
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
        )}

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
            <div>Total Capacity: {vpodCapacityTB.toFixed(1)} TB</div>
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
            <div>Total Capacity: {jbodCapacityTB.toFixed(0)} TB</div>
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
