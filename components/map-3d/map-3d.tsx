/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

'use client';

/**
 * Copyright 2025 Google LLC
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

import { useMapsLibrary } from '@vis.gl/react-google-maps';
import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useRef
} from 'react';
import { useMap3DCameraEvents } from './use-map-3d-camera-events';
import { useCallbackRef, useDeepCompareEffect } from './utility-hooks';
import { useMapStore } from '../../lib/state';

import './map-3d-types';

export type Map3DProps = google.maps.maps3d.Map3DElementOptions & {
  onCameraChange?: (cameraProps: Map3DCameraProps) => void;
};

export type Map3DCameraProps = {
  center: google.maps.LatLngAltitudeLiteral;
  range: number;
  heading: number;
  tilt: number;
  roll: number;
};

export const Map3D = forwardRef(
  (
    props: Map3DProps,
    forwardedRef: ForwardedRef<google.maps.maps3d.Map3DElement | null>
  ) => {
    useMapsLibrary('maps3d');

    const [map3DElement, map3dRef] =
      useCallbackRef<google.maps.maps3d.Map3DElement>();

    // Get markers from store
    const markers = useMapStore(state => state.markers);
    const markersRef = useRef<any[]>([]);

    useMap3DCameraEvents(map3DElement, p => {
      if (!props.onCameraChange) return;

      props.onCameraChange(p);
    });

    const [customElementsReady, setCustomElementsReady] = useState(false);
    useEffect(() => {
      customElements.whenDefined('gmp-map-3d').then(() => {
        setCustomElementsReady(true);
      });
    }, []);

    // Render 3D markers when markers change
    useEffect(() => {
      if (!map3DElement || !customElementsReady) return;

      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker.parentNode) {
          marker.parentNode.removeChild(marker);
        }
      });
      markersRef.current = [];

      // Add new markers
      markers.forEach((marker, index) => {
        try {
          const markerElement = document.createElement('gmp-marker-3d');
          markerElement.setAttribute('position', `${marker.position.lat},${marker.position.lng}`);
          markerElement.setAttribute('altitude-mode', 'RELATIVE_TO_GROUND');
          markerElement.setAttribute('extruded', 'true');
          if (marker.label) {
            markerElement.setAttribute('title', marker.label);
          }
          map3DElement.appendChild(markerElement);
          markersRef.current.push(markerElement);
        } catch (e) {
          console.error('Error creating 3D marker:', e);
        }
      });

      return () => {
        // Cleanup markers on unmount
        markersRef.current.forEach(marker => {
          if (marker.parentNode) {
            marker.parentNode.removeChild(marker);
          }
        });
        markersRef.current = [];
      };
    }, [map3DElement, markers, customElementsReady]);

    const { center, heading, tilt, range, roll, ...map3dOptions } = props;

    useDeepCompareEffect(() => {
      if (!map3DElement) return;

      // copy all values from map3dOptions to the map3D element itself
      Object.assign(map3DElement, map3dOptions);
    }, [map3DElement, map3dOptions]);

    useImperativeHandle<
      google.maps.maps3d.Map3DElement | null,
      google.maps.maps3d.Map3DElement | null
    >(forwardedRef, () => map3DElement, [map3DElement]);

    if (!customElementsReady) return null;

    return (
      <gmp-map-3d
        ref={map3dRef}
        center={center}
        range={range}
        heading={heading}
        tilt={tilt}
        roll={roll}
        defaultUIHidden={true}
        mode="SATELLITE"></gmp-map-3d>
    );
  }
);

Map3D.displayName = 'Map3D';