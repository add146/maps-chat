
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// FIX: Added missing React imports.
import React, { useEffect, useMemo, useState } from 'react';
import { useSettings, useUI, useLogStore, useTools, personas, useApiKeys } from '@/lib/state';
import c from 'classnames';
import {
  AVAILABLE_VOICES_FULL,
  AVAILABLE_VOICES_LIMITED,
  MODELS_WITH_LIMITED_VOICES,
  DEFAULT_VOICE,
} from '@/lib/constants';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';

const AVAILABLE_MODELS = [
  'gemini-2.5-flash-native-audio-preview-09-2025',
  'gemini-2.5-flash-native-audio-preview-12-2025',
  'gemini-live-2.5-flash',
  'gemini-live-2.5-flash-preview',
];

export default function Sidebar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    showSystemMessages,
    toggleShowSystemMessages,
  } = useUI();
  const {
    systemPrompt,
    model,
    voice,
    setSystemPrompt,
    setModel,
    setVoice,
    isEasterEggMode,
    activePersona,
    setPersona,
  } = useSettings();
  const { connected } = useLiveAPIContext();

  // API Keys state
  const { geminiApiKey, mapsApiKey, setGeminiApiKey, setMapsApiKey } = useApiKeys();
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [tempGeminiKey, setTempGeminiKey] = useState(geminiApiKey);
  const [tempMapsKey, setTempMapsKey] = useState(mapsApiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveApiKeys = () => {
    setGeminiApiKey(tempGeminiKey);
    setMapsApiKey(tempMapsKey);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
    // Reload the page to apply new API keys
    if (tempGeminiKey && tempMapsKey) {
      window.location.reload();
    }
  };

  const availableVoices = useMemo(() => {
    return MODELS_WITH_LIMITED_VOICES.includes(model)
      ? AVAILABLE_VOICES_LIMITED
      : AVAILABLE_VOICES_FULL;
  }, [model]);

  useEffect(() => {
    if (!availableVoices.some(v => v.name === voice)) {
      setVoice(DEFAULT_VOICE);
    }
  }, [availableVoices, voice, setVoice]);

  const handleExportLogs = () => {
    const { systemPrompt, model } = useSettings.getState();
    const { tools } = useTools.getState();
    const { turns } = useLogStore.getState();

    const logData = {
      configuration: {
        model,
        systemPrompt,
      },
      tools,
      conversation: turns.map(turn => ({
        ...turn,
        // Convert Date object to ISO string for JSON serialization
        timestamp: turn.timestamp.toISOString(),
      })),
    };

    const jsonString = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `live-api-logs-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <aside className={c('sidebar', { open: isSidebarOpen })}>
        <div className="sidebar-header">
          <h3>Settings</h3>
          <button onClick={toggleSidebar} className="close-button">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="sidebar-content">
          {/* API Keys Section */}
          <div className="sidebar-section">
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>API Keys</h4>
            <fieldset disabled={connected}>
              <label>
                Gemini API Key
                <div style={{ position: 'relative' }}>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={tempGeminiKey}
                    onChange={e => setTempGeminiKey(e.target.value)}
                    placeholder="Enter Gemini API Key"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={showGeminiKey ? 'Hide' : 'Show'}
                  >
                    <span className="icon" style={{ fontSize: '18px' }}>
                      {showGeminiKey ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </label>
              <label>
                Google Maps API Key
                <div style={{ position: 'relative' }}>
                  <input
                    type={showMapsKey ? 'text' : 'password'}
                    value={tempMapsKey}
                    onChange={e => setTempMapsKey(e.target.value)}
                    placeholder="Enter Google Maps API Key"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapsKey(!showMapsKey)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={showMapsKey ? 'Hide' : 'Show'}
                  >
                    <span className="icon" style={{ fontSize: '18px' }}>
                      {showMapsKey ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </label>
              <button
                onClick={handleSaveApiKeys}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  backgroundColor: apiKeySaved ? '#4CAF50' : undefined,
                }}
              >
                <span className="icon">{apiKeySaved ? 'check' : 'save'}</span>
                {apiKeySaved ? 'Saved! Reloading...' : 'Save API Keys'}
              </button>
            </fieldset>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
              Get Gemini key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff' }}>AI Studio</a>
              {' | '}
              Maps key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff' }}>Google Cloud</a>
            </p>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '16px 0' }} />
          <div className="sidebar-section">
            <fieldset disabled={connected}>
              {isEasterEggMode && (
                <label>
                  Persona
                  <select
                    value={activePersona}
                    onChange={e => setPersona(e.target.value)}
                  >
                    {Object.keys(personas).map(personaName => (
                      <option key={personaName} value={personaName}>
                        {personaName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                System Prompt
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  rows={10}
                  placeholder="Describe the role and personality of the AI..."
                  disabled={isEasterEggMode}
                />
              </label>
              <label>
                Model
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                >
                  {/* This list includes models supported for the Live API experience. */}
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Voice
                <select
                  value={voice}
                  onChange={e => setVoice(e.target.value)}
                >
                  {availableVoices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.description})
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
            <div className="settings-toggle-item">
              <label className="tool-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="system-message-toggle"
                  checked={showSystemMessages}
                  onChange={toggleShowSystemMessages}
                />
                <span className="checkbox-visual"></span>
              </label>
              <label
                htmlFor="system-message-toggle"
                className="settings-toggle-label"
              >
                Show system messages
              </label>
            </div>
          </div>
          <div className="sidebar-actions">
            <button onClick={handleExportLogs} title="Export session logs">
              <span className="icon">download</span>
              Export Logs
            </button>
            <button
              onClick={useLogStore.getState().clearTurns}
              title="Reset session logs"
            >
              <span className="icon">refresh</span>
              Reset Session
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
