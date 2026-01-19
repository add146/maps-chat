/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Added FC to the React import.
import React, { FC } from 'react';
import './PopUp.css';

interface PopUpProps {
  onClose: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Selamat Datang di Perencana Hari Interaktif</h2>
        <div className="popup-scrollable-content">
          <p>
            Demo interaktif ini menampilkan kemampuan Gemini dan Grounding dengan Google Maps untuk melakukan percakapan real-time berbasis suara.
            Rencanakan perjalanan sehari menggunakan bahasa natural dan rasakan bagaimana Gemini memanfaatkan Google Maps untuk memberikan informasi yang akurat dan terkini.
          </p>
          <p>Untuk memulai:</p>
          <ol>
            <li>
              <span className="icon">play_circle</span>
              <div>Tekan tombol <strong>&nbsp; Play &nbsp;</strong> untuk memulai percakapan.</div>
            </li>
            <li>
              <span className="icon">record_voice_over</span>
              <div><strong>Bicara dengan natural &nbsp;</strong>untuk merencanakan perjalanan. Coba katakan,
                "Ayo rencanakan perjalanan ke Bali."</div>
            </li>
            <li>
              <span className="icon">map</span>
              <div>Lihat bagaimana peta <strong>&nbsp; diperbarui secara dinamis &nbsp;</strong> dengan
                lokasi dari itinerary kamu.</div>
            </li>
            <li>
              <span className="icon">keyboard</span>
              <div>Atau, <strong>&nbsp; ketik permintaan kamu &nbsp;</strong> di kotak pesan.</div>
            </li>
            <li>
              <span className="icon">tune</span>
              <div>Klik ikon <strong>&nbsp; Pengaturan &nbsp;</strong> untuk menyesuaikan suara dan perilaku AI.</div>
            </li>
          </ol>
        </div>
        <button onClick={onClose}>Mengerti, Ayo Mulai!</button>
      </div>
    </div>
  );
};

export default PopUp;