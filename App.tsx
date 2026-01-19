
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useCallback, useState, useEffect, useRef } from 'react';

import ControlTray from './components/ControlTray';
import ErrorScreen from './components/ErrorScreen';
import StreamingConsole from './components/streaming-console/StreamingConsole';
import PopUp from './components/popup/PopUp';
import Sidebar from './components/Sidebar';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
// FIX: Correctly import APIProvider as a named export.
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Map3D, Map3DCameraProps } from './components/map-3d';
import { Map2D } from './components/map-2d';
import MapToggle from './components/MapToggle';
import { useMapStore, useApiKeys, useUI } from './lib/state';
import { MapController } from './lib/map-controller';

// API keys are now loaded from localStorage via useApiKeys store

const INITIAL_VIEW_PROPS = {
  center: {
    lat: -6.2088,
    lng: 106.8456,
    altitude: 1000
  },
  range: 5000,
  heading: 0,
  tilt: 30,
  roll: 0
};

/**
 * The main application component. It serves as the primary view controller,
 * orchestrating the layout of UI components and reacting to global state changes
 * to update the 3D map.
 */
function AppComponent({ geminiApiKey }: { geminiApiKey: string }) {
  const [map, setMap] = useState<google.maps.maps3d.Map3DElement | null>(null);
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [viewProps, setViewProps] = useState(INITIAL_VIEW_PROPS);
  // Subscribe to marker and camera state from the global Zustand store.
  const { markers, cameraTarget, setCameraTarget, preventAutoFrame, mapMode } = useMapStore();
  const { isChatVisible } = useUI();
  const mapController = useRef<MapController | null>(null);

  const maps3dLib = useMapsLibrary('maps3d');
  const elevationLib = useMapsLibrary('elevation');

  const [showPopUp, setShowPopUp] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const consolePanelRef = useRef<HTMLDivElement>(null);
  const controlTrayRef = useRef<HTMLElement>(null);
  // Padding state is used to ensure map content isn't hidden by UI elements.
  const [padding, setPadding] = useState<[number, number, number, number]>([0.05, 0.05, 0.05, 0.05]);

  // Effect: Instantiate the Geocoder once the library is loaded.
  useEffect(() => {
    if (geocodingLib) {
      setGeocoder(new geocodingLib.Geocoder());
    }
  }, [geocodingLib]);

  // Effect: Detect user's current location and center the map there
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('User location detected:', latitude, longitude);
          setViewProps(prev => ({
            ...prev,
            center: {
              lat: latitude,
              lng: longitude,
              altitude: 1000
            }
          }));
        },
        (error) => {
          console.log('Geolocation error or denied:', error.message);
          // Keep default Jakarta position if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      );
    }
  }, []);

  // Effect: Instantiate the MapController.
  // This runs once all necessary map libraries and the map element itself are
  // loaded and available, creating a centralized controller for all map interactions.
  useEffect(() => {
    if (map && maps3dLib && elevationLib) {
      mapController.current = new MapController({
        map,
        maps3dLib,
        elevationLib,
      });
    }
    // Invalidate the controller if its dependencies change.
    return () => {
      mapController.current = null;
    };
  }, [map, maps3dLib, elevationLib]);

  // Effect: Calculate responsive padding.
  // This effect observes the size of the console and control tray to calculate
  // padding values. These values represent how much of the viewport is
  // covered by UI, ensuring that when the map frames content, nothing is hidden.
  // See `lib/look-at.ts` for how this padding is used.
  useEffect(() => {
    const calculatePadding = () => {
      const consoleEl = consolePanelRef.current;
      const trayEl = controlTrayRef.current;
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      if (!consoleEl || !trayEl) return;

      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      const top = 0.05;
      const right = 0.05;
      let bottom = 0.05;
      let left = 0.05;

      if (!isMobile) {
        // On desktop, console is on the left. The tray is now inside it.
        left = Math.max(left, (consoleEl.offsetWidth / vw) + 0.02); // add 2% buffer
        // The tray no longer covers the bottom of the map on desktop.
      }

      setPadding([top, right, bottom, left]);
    };

    // Use ResizeObserver for more reliable updates on the elements themselves.
    const observer = new ResizeObserver(calculatePadding);
    if (consolePanelRef.current) observer.observe(consolePanelRef.current);
    if (controlTrayRef.current) observer.observe(controlTrayRef.current);

    // Also listen to window resize
    window.addEventListener('resize', calculatePadding);

    // Initial calculation after a short delay to ensure layout is stable
    const timeoutId = setTimeout(calculatePadding, 100);

    return () => {
      window.removeEventListener('resize', calculatePadding);
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (map) {
      const banner = document.querySelector(
        '.vAygCK-api-load-alpha-banner',
      ) as HTMLElement;
      if (banner) {
        banner.style.display = 'none';
      }
    }
  }, [map]);


  // Effect: Reactively render markers and routes on the map.
  // This is the core of the component's "reactive" nature. It listens for
  // changes to the `markers` array in the global Zustand store.
  // Whenever a tool updates this state, this effect triggers, commanding the
  // MapController to clear the map, add the new entities, and then
  // intelligently frame them all in the camera's view, respecting UI padding.
  useEffect(() => {
    if (!mapController.current) return;

    const controller = mapController.current;
    controller.clearMap();

    if (markers.length > 0) {
      controller.addMarkers(markers);
    }

    // Combine all points from markers for framing
    const markerPositions = markers.map(m => m.position);
    const allEntities = [...markerPositions].map(p => ({ position: p }));

    if (allEntities.length > 0 && !preventAutoFrame) {
      controller.frameEntities(allEntities, padding);
    }
  }, [markers, padding, preventAutoFrame]); // Re-run when markers or padding change


  // Effect: Reactively handle direct camera movement requests.
  // This effect listens for changes to `cameraTarget`. Tools can set this state
  // to request a direct camera flight to a specific location or view. Once the
  // flight is initiated, the target is cleared to prevent re-triggering.
  useEffect(() => {
    if (cameraTarget && mapController.current) {
      mapController.current.flyTo(cameraTarget);
      // Reset the target so it doesn't re-trigger on re-renders
      setCameraTarget(null);
      // After a direct camera flight, reset the auto-frame prevention flag
      // to ensure subsequent marker updates behave as expected.
      useMapStore.getState().setPreventAutoFrame(false);
    }
  }, [cameraTarget, setCameraTarget]);

  // Handle popup close with optional location coordinates
  const handleClosePopUp = useCallback((coords?: { lat: number; lng: number }) => {
    setShowPopUp(false);
    if (coords) {
      setUserLocation(coords);
      // Update viewProps for Map2D initial render
      setViewProps(prev => ({
        ...prev,
        center: {
          lat: coords.lat,
          lng: coords.lng,
          altitude: 500
        }
      }));
      // Dispatch centerToLocation event for Map2D to pan to location
      window.dispatchEvent(new CustomEvent('centerToLocation', {
        detail: { lat: coords.lat, lng: coords.lng }
      }));
      // Use setCameraTarget to trigger actual camera flight for Map3D
      setCameraTarget({
        center: {
          lat: coords.lat,
          lng: coords.lng,
          altitude: 500
        },
        range: 2000,
        heading: 0,
        tilt: 45,
        roll: 0
      });
      console.log('Flying to user location:', coords);
    }
  }, [setCameraTarget]);


  const handleCameraChange = useCallback((props: Map3DCameraProps) => {
    setViewProps(oldProps => ({ ...oldProps, ...props }));
  }, []);

  return (
    <LiveAPIProvider
      apiKey={geminiApiKey}
      map={map}
      placesLib={placesLib}
      elevationLib={elevationLib}
      geocoder={geocoder}
      padding={padding}
    >
      <ErrorScreen />
      <Sidebar />
      {showPopUp && <PopUp onClose={handleClosePopUp} />}
      <div className={`streaming-console ${!isChatVisible ? 'chat-hidden' : ''}`}>
        {isChatVisible && (
          <div className="console-panel" ref={consolePanelRef}>
            <StreamingConsole />
          </div>
        )}
        <div className={`map-panel ${!isChatVisible ? 'full-screen' : ''}`}>
          <MapToggle />
          {mapMode === '3d' ? (
            <Map3D
              ref={element => setMap(element ?? null)}
              onCameraChange={handleCameraChange}
              {...viewProps}>
            </Map3D>
          ) : (
            <Map2D
              center={{ lat: viewProps.center.lat, lng: viewProps.center.lng }}
              zoom={15}
              showTraffic={true}
            />
          )}
        </div>
        <ControlTray trayRef={controlTrayRef} />
      </div>
    </LiveAPIProvider>
  );
}


/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  const { geminiApiKey, mapsApiKey } = useApiKeys();
  const isConfigured = geminiApiKey.length > 0 && mapsApiKey.length > 0;

  // Show configuration prompt if API keys are not set
  if (!isConfigured) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1a1a2e',
          color: '#fff',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h1 style={{ marginBottom: '20px', fontSize: '2rem' }}>Welcome to Chat with Maps Live</h1>
          <p style={{ marginBottom: '30px', maxWidth: '500px', color: '#aaa' }}>
            To use this application, you need to configure your API keys first.
          </p>
          <div style={{
            backgroundColor: '#252542',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '100%',
          }}>
            <h3 style={{ marginBottom: '20px' }}>Configure API Keys</h3>
            <ApiKeySetup />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <APIProvider
        version={'alpha'}
        apiKey={mapsApiKey}
        solutionChannel={"gmp_aistudio_itineraryapplet_v1.0.0"}>
        <AppComponentWithGeminiKey geminiApiKey={geminiApiKey} />
      </APIProvider>

    </div>
  );
}

/**
 * API Key setup component for initial configuration
 */
function ApiKeySetup() {
  const { setGeminiApiKey, setMapsApiKey } = useApiKeys();
  const [geminiKey, setGeminiKey] = React.useState('');
  const [mapsKey, setMapsKey] = React.useState('');
  const [showGemini, setShowGemini] = React.useState(false);
  const [showMaps, setShowMaps] = React.useState(false);

  const handleSave = () => {
    if (geminiKey && mapsKey) {
      setGeminiApiKey(geminiKey);
      setMapsApiKey(mapsKey);
      window.location.reload();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #444',
    borderRadius: '8px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontSize: '14px',
  };

  return (
    <div>
      <div style={{ marginBottom: '15px', textAlign: 'left' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Gemini API Key</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showGemini ? 'text' : 'password'}
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            placeholder="Enter Gemini API Key"
            style={{ ...inputStyle, paddingRight: '40px', marginBottom: 0 }}
          />
          <button
            type="button"
            onClick={() => setShowGemini(!showGemini)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
            }}
          >
            {showGemini ? '🙈' : '👁️'}
          </button>
        </div>
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '12px', color: '#4a9eff' }}>Get from AI Studio →</a>
      </div>
      <div style={{ marginBottom: '15px', textAlign: 'left' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Google Maps API Key</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showMaps ? 'text' : 'password'}
            value={mapsKey}
            onChange={e => setMapsKey(e.target.value)}
            placeholder="Enter Google Maps API Key"
            style={{ ...inputStyle, paddingRight: '40px', marginBottom: 0 }}
          />
          <button
            type="button"
            onClick={() => setShowMaps(!showMaps)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
            }}
          >
            {showMaps ? '🙈' : '👁️'}
          </button>
        </div>
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '12px', color: '#4a9eff' }}>Get from Google Cloud →</a>
      </div>
      <button
        onClick={handleSave}
        disabled={!geminiKey || !mapsKey}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: geminiKey && mapsKey ? '#4CAF50' : '#555',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: geminiKey && mapsKey ? 'pointer' : 'not-allowed',
          marginTop: '10px',
        }}
      >
        Save & Start
      </button>
    </div>
  );
}

/**
 * Wrapper component that receives Gemini API key as prop
 */
function AppComponentWithGeminiKey({ geminiApiKey }: { geminiApiKey: string }) {
  return <AppComponent geminiApiKey={geminiApiKey} />;
}

export default App;
