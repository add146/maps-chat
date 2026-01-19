/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useMap, Map, Marker } from '@vis.gl/react-google-maps';
import { useMapStore } from '../../lib/state';

export interface Map2DProps {
    center: { lat: number; lng: number };
    zoom?: number;
    showTraffic?: boolean;
    showMyLocation?: boolean;
    onCenterChange?: (center: { lat: number; lng: number }) => void;
}

export interface Map2DRef {
    panTo: (position: { lat: number; lng: number }) => void;
}

export const Map2D = forwardRef<Map2DRef, Map2DProps>(
    ({ center, zoom = 14, showTraffic = true, showMyLocation = true, onCenterChange }, ref) => {
        const markers = useMapStore(state => state.markers);
        const mapRef = useRef<any>(null);
        const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

        // Get user's current location
        useEffect(() => {
            if (showMyLocation && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.log('Could not get user location:', error.message);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
                );
            }
        }, [showMyLocation]);

        useImperativeHandle(ref, () => ({
            panTo: (position) => {
                if (mapRef.current) {
                    mapRef.current.panTo(position);
                }
            }
        }));

        return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Map
                    defaultCenter={center}
                    defaultZoom={zoom}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    zoomControl={true}
                    mapTypeControl={true}
                    streetViewControl={false}
                    fullscreenControl={false}
                    style={{ width: '100%', height: '100%' }}
                >
                    <TrafficLayerComponent enabled={showTraffic} />
                    <CenterToLocationListener />

                    {/* User's current location marker */}
                    {userLocation && (
                        <MyLocationMarker position={userLocation} />
                    )}

                    {/* Other markers from store */}
                    {markers.map((marker, index) => (
                        <Marker
                            key={`marker-${index}`}
                            position={{ lat: marker.position.lat, lng: marker.position.lng }}
                            title={marker.label}
                        />
                    ))}
                </Map>
            </div>
        );
    }
);

Map2D.displayName = 'Map2D';

// Listen for centerToLocation events from ControlTray
function CenterToLocationListener() {
    const map = useMap();

    useEffect(() => {
        const handleCenterToLocation = (event: CustomEvent<{ lat: number; lng: number }>) => {
            if (map && event.detail) {
                map.panTo(event.detail);
                map.setZoom(16);
            }
        };

        window.addEventListener('centerToLocation', handleCenterToLocation as EventListener);
        return () => {
            window.removeEventListener('centerToLocation', handleCenterToLocation as EventListener);
        };
    }, [map]);

    return null;
}

// Red pin marker for user's current location
function MyLocationMarker({ position }: { position: { lat: number; lng: number } }) {
    const map = useMap();
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;

        // Create red pin marker for current location
        if (!markerRef.current) {
            // @ts-ignore - Marker constructor exists at runtime
            markerRef.current = new google.maps.Marker({
                position,
                map,
                title: 'Lokasi Anda',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    // @ts-ignore
                    scaledSize: { width: 48, height: 48 },
                    // @ts-ignore
                    anchor: { x: 24, y: 48 },
                },
                zIndex: 999,
            });
        } else {
            markerRef.current.setPosition(position);
        }

        return () => {
            if (markerRef.current) {
                markerRef.current.setMap(null);
                markerRef.current = null;
            }
        };
    }, [map, position]);

    return null;
}

// Separate component for traffic layer to use the map context
function TrafficLayerComponent({ enabled }: { enabled: boolean }) {
    const map = useMap();
    const trafficLayerRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;

        if (enabled) {
            if (!trafficLayerRef.current) {
                // @ts-ignore - TrafficLayer exists at runtime
                trafficLayerRef.current = new google.maps.TrafficLayer();
            }
            trafficLayerRef.current.setMap(map);
        } else {
            if (trafficLayerRef.current) {
                trafficLayerRef.current.setMap(null);
            }
        }

        return () => {
            if (trafficLayerRef.current) {
                trafficLayerRef.current.setMap(null);
            }
        };
    }, [map, enabled]);

    return null;
}

export default Map2D;
