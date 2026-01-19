/**
 * Map Toggle Component
 * Toggle between 3D and 2D map views
 */

import React from 'react';
import { useMapStore } from '../lib/state';

export default function MapToggle() {
    const { mapMode, toggleMapMode } = useMapStore();

    return (
        <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            display: 'flex',
            gap: '4px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '4px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
            <button
                onClick={() => useMapStore.getState().setMapMode('2d')}
                style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: mapMode === '2d' ? '#4285f4' : 'transparent',
                    color: mapMode === '2d' ? 'white' : '#aaa',
                    transition: 'all 0.2s ease',
                }}
                title="Peta 2D dengan Traffic"
            >
                <span className="icon" style={{ fontSize: '18px' }}>map</span>
                2D + Traffic
            </button>
            <button
                onClick={() => useMapStore.getState().setMapMode('3d')}
                style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: mapMode === '3d' ? '#4285f4' : 'transparent',
                    color: mapMode === '3d' ? 'white' : '#aaa',
                    transition: 'all 0.2s ease',
                }}
                title="Peta 3D Satelit"
            >
                <span className="icon" style={{ fontSize: '18px' }}>view_in_ar</span>
                3D Satelit
            </button>
        </div>
    );
}
