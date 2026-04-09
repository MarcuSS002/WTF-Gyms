import React, { useEffect, useState } from 'react';
import { startSimulator, stopSimulator, resetSimulator, getSimulatorStatus } from '../services/api';

export default function SimulatorControls(){
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function syncStatus() {
    try {
      const s = await getSimulatorStatus();
      setRunning(Boolean(s.running));
      if ([1, 5, 10].includes(Number(s.speed))) {
        setSpeed(Number(s.speed));
      }
    } catch (_) {
      // no-op: keep UI responsive even if status endpoint is temporarily unavailable
    }
  }

  async function handleStart(){
    setBusy(true);
    setMessage('Starting simulator...');
    try {
      await startSimulator(speed);
      await syncStatus();
      setMessage(`Running at ${speed}x`);
    } finally {
      setBusy(false);
    }
  }

  async function handlePause(){
    setBusy(true);
    setMessage('Pausing simulator...');
    try {
      await stopSimulator();
      await syncStatus();
      setMessage('Paused');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(){
    setBusy(true);
    setMessage('Resetting simulator...');
    try {
      await resetSimulator();
      await syncStatus();
      setMessage('Reset complete');
    } finally {
      setBusy(false);
    }
  }

  async function handleSpeed(nextSpeed) {
    setSpeed(nextSpeed);
    if (running) {
      setBusy(true);
      setMessage(`Switching to ${nextSpeed}x...`);
      try {
        await startSimulator(nextSpeed);
        await syncStatus();
        setMessage(`Running at ${nextSpeed}x`);
      } finally {
        setBusy(false);
      }
    }
  }

  useEffect(() => {
    syncStatus();
  }, []);

  useEffect(() => {
    const timer = setInterval(syncStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card simulator-card">
      <div className="simulator-header">
        <h3 className="card-title side-title">Simulator</h3>
        <div className={`simulator-state ${running ? 'is-running' : 'is-paused'}`}>
          {running ? 'Running' : 'Paused'}
        </div>
      </div>
      <div className="simulator-subtext">{message || `Speed ${speed}x`}</div>
      <div className="simulator-actions">
        <button type="button" className="simulator-btn primary" onClick={handleStart} disabled={busy}>Start</button>
        <button type="button" className="simulator-btn" onClick={handlePause} disabled={busy}>Pause</button>
        <button type="button" className="simulator-btn" onClick={handleReset} disabled={busy}>Reset</button>
      </div>
      <div className="simulator-speed-row">
        <span className="muted-label">Speed</span>
        {[1, 5, 10].map((s) => (
          <button
            key={s}
            type="button"
            className={`simulator-chip ${speed === s ? 'active' : ''}`}
            onClick={() => handleSpeed(s)}
            aria-pressed={speed === s}
            disabled={busy}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
