import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './App.css';

const SHEET_ID = process.env.REACT_APP_SHEET_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?alt=json&key=${API_KEY}`;

function App() {
  const [barcode, setBarcode] = useState('');
  const [item, setItem] = useState(null);
  const [data, setData] = useState([]);
  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);

  // Load Google Sheet data
  useEffect(() => {
    fetch(SHEET_URL)
      .then(res => res.json())
      .then(json => {
        const rows = json.values;
        const headers = rows[0];
        const items = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((key, index) => {
            obj[key.toLowerCase()] = row[index];
          });
          return obj;
        });
        setData(items);
      });
  }, []);

  // Setup scanner
  useEffect(() => {
    const html5QrCode = new Html5Qrcode('reader');
    html5QrCodeRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode
      .start(
        { facingMode: 'environment' },
        config,
        decodedText => {
          if (!isScanningRef.current) {
            isScanningRef.current = true;
            setBarcode(decodedText);
            setTimeout(() => {
              isScanningRef.current = false;
            }, 1500);
          }
        },
        error => {
          // Handle scan errors if needed
        }
      )
      .catch(err => console.error('Camera start error', err));

    return () => {
      html5QrCode.stop().then(() => {
        html5QrCode.clear();
      });
    };
  }, []);

  // Lookup item
  useEffect(() => {
    if (!barcode) {
      setItem(null);
      return;
    }
    const found = data.find(
      d => d['barcode']?.trim() === barcode.trim()
    );
    setItem(found || null);
  }, [barcode, data]);

  return (
    <div className="App">
      <h1>Barcode Lookup</h1>
      <div id="reader" style={{ width: '300px', margin: '0 auto' }}></div>

      <div className="input-wrapper">
        <input
          type="text"
          placeholder="Enter barcode"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
        />
        {barcode && (
          <button
            className="clear-button"
            onClick={() => setBarcode('')}
          >
            ×
          </button>
        )}
      </div>

      {item ? (
        <div className="result">
          <h2>{item.name}</h2>
          <p><strong>Asking:</strong> {item['asking price']}</p>
          <p><strong>Lowest:</strong> {item['lowest price']}</p>
          <p><strong>Sold:</strong> {item['sold']}</p>
        </div>
      ) : (
        barcode && <p>No match found.</p>
      )}
    </div>
  );
}

export default App;