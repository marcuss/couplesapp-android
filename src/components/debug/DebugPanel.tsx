import React, { useEffect, useState, useCallback } from 'react';
import DebugPlugin, { type LogEntry, type DeviceInfo } from '../../plugins/DebugPlugin';

interface DebugPanelProps {
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'device'>('logs');

  const fetchData = useCallback(async () => {
    try {
      const [logsResult, info] = await Promise.all([
        DebugPlugin.getLogs(),
        DebugPlugin.getDeviceInfo(),
      ]);
      setLogs(logsResult.logs.slice().reverse());
      setDeviceInfo(info);
    } catch (e) {
      console.error('DebugPanel fetch error', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleClearLogs = async () => {
    await DebugPlugin.clearLogs();
    setLogs([]);
  };

  const levelColor: Record<string, string> = {
    error: '#ff4444',
    warn: '#ffaa00',
    info: '#44aaff',
    debug: '#aaaaaa',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#eee',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: '#1a1a2e', borderBottom: '1px solid #333' }}>
        <span style={{ flex: 1, fontWeight: 'bold', fontSize: 14 }}>🐛 Debug Panel</span>
        <button
          onClick={handleClearLogs}
          style={{ marginRight: 12, padding: '4px 10px', background: '#333', border: '1px solid #555', color: '#eee', borderRadius: 4, cursor: 'pointer' }}
        >
          Clear
        </button>
        <button
          onClick={onClose}
          style={{ padding: '4px 10px', background: '#c0392b', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#111', borderBottom: '1px solid #333' }}>
        {(['logs', 'device'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              background: activeTab === tab ? '#222' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #44aaff' : '2px solid transparent',
              color: activeTab === tab ? '#fff' : '#888',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {activeTab === 'logs' && (
          <div>
            {logs.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', paddingTop: 40 }}>No logs yet</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{ marginBottom: 8, borderLeft: `3px solid ${levelColor[log.level] ?? '#888'}`, paddingLeft: 8 }}
                >
                  <div style={{ color: '#888', fontSize: 10 }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div style={{ color: levelColor[log.level] ?? '#eee' }}>[{log.level.toUpperCase()}] {log.message}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'device' && deviceInfo && (
          <div style={{ lineHeight: '1.8' }}>
            {Object.entries(deviceInfo).map(([key, val]) => (
              <div key={key}>
                <span style={{ color: '#888' }}>{key}: </span>
                <span style={{ color: '#eee' }}>{String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
