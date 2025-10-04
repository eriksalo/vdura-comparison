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
  const ssdCount = 12;
  const ssdCapacityTB = 3.84; // Typical enterprise SSD
  const hddCapacityTB = 20; // Typical enterprise HDD
  const hddCount = Math.ceil((config.checkpointSizeTB * 10) / hddCapacityTB); // Store ~10 checkpoints

  return (
    <div className="system-container vdura-system">
      <h2>VDURA Hybrid System</h2>
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

        {/* SSD Tier */}
        <div className="storage-tier">
          <h3>Fast SSD Cache (Write Tier)</h3>
          <div className="performance-badge">3 GB/s per SSD</div>
          <div className="storage-grid">
            {Array.from({ length: ssdCount }).map((_, i) => (
              <div
                key={`ssd-${i}`}
                className={`storage-unit ssd ${ssdActivity > 0 ? 'active' : ''}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: ssdActivity > 0 ? 1 : 0.6,
                }}
              >
                <div className="unit-label">SSD {i + 1}</div>
                <div className="unit-capacity">{ssdCapacityTB}TB</div>
                {ssdActivity > 0 && (
                  <div className="activity-indicator" style={{ width: `${ssdActivity}%` }} />
                )}
              </div>
            ))}
          </div>
          <div className="tier-stats">
            <div>Total: {(ssdCount * ssdCapacityTB).toFixed(1)} TB</div>
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

        {/* HDD Tier */}
        <div className="storage-tier">
          <h3>High-Capacity HDD (Archive Tier)</h3>
          <div className="cost-badge">8x Lower Cost</div>
          <div className="storage-grid hdd-grid">
            {Array.from({ length: Math.min(hddCount, 12) }).map((_, i) => (
              <div
                key={`hdd-${i}`}
                className={`storage-unit hdd ${hddActivity > 0 ? 'active' : ''}`}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  opacity: hddActivity > 0 ? 1 : 0.6,
                }}
              >
                <div className="unit-label">HDD {i + 1}</div>
                <div className="unit-capacity">{hddCapacityTB}TB</div>
                {hddActivity > 0 && (
                  <div className="activity-indicator" style={{ width: `${hddActivity}%` }} />
                )}
              </div>
            ))}
          </div>
          <div className="tier-stats">
            <div>Total: {(hddCount * hddCapacityTB).toFixed(0)} TB</div>
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
