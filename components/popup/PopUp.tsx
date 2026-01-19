/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import './PopUp.css';

interface PopUpProps {
  onClose: (coords?: { lat: number; lng: number }) => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolocation');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        // Keep loading state for a moment to let map update
        setTimeout(() => {
          setIsLoading(false);
          onClose(coords);
        }, 500);
      },
      (err) => {
        setIsLoading(false);
        setError('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content location-popup">
        <div className="popup-icon">
          <span className="material-symbols-outlined">location_on</span>
        </div>
        <h2>Halo! 👋</h2>
        <p>Izinkan saya mengetahui lokasimu untuk memberikan rekomendasi tempat menarik dan makanan enak di sekitarmu.</p>

        {error && <p className="error-text">{error}</p>}

        <button
          onClick={handleGetLocation}
          disabled={isLoading}
          className="location-button"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined spinning">sync</span>
              Mencari lokasi...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">my_location</span>
              Cari Posisiku
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PopUp;