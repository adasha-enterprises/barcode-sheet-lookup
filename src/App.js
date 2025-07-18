import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './App.css';

const SHEET_ID = process.env.REACT_APP_SHEET_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?alt=json&key=${API_KEY}`;

function App() {
  const [items, setItems] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [foundItem, setFoundItem] = useState(null);

  useEffect(() => {
    fetch(SHEET_URL)
      .then(res => res.json())
      .then(data => {
        const rows = data.values;
        const headers = rows[0];
        const items = rows.slice(1).map(row => {
          const item = {};
          headers.forEach((header, i) => {
            item[header.trim().toLowerCase()] = row[i] || '';
          });
          return item;
        });
        setItems(items);
      })
      .catch(err => console.error('Error fetching sheet data:', err));
  }, []);

  useEffect(() => {
    if (!document.getElementById('reader')) return;
  
    const scanned = new Set(); // In-memory store to prevent fast duplicate reads
  
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: 250
    });
  
    scanner.render(
      (decodedText) => {
        if (!scanned.has(decodedText)) {
          scanned.add(decodedText);
          setBarcode(decodedText);
  
          // Optionally clear after a few seconds to allow rescanning same code
          setTimeout(() => scanned.delete(decodedText), 3000);
        }
      },
      (error) => {
        // Optional: console.warn(`Scan error: ${error}`);
      }
    );
  
    return () => {
      scanner.clear().catch(console.error); // only on component unmount
    };
  }, []);  

  useEffect(() => {
    if (barcode && items.length > 0) {
      const item = items.find(i => i.barcode === barcode);
      setFoundItem(item || null);
    }
  }, [barcode, items]);

  return (
    <div className="App">
      <h1>Barcode Lookup</h1>

      <div id="reader" style={{ width: '300px', margin: 'auto' }}></div>

      <div className="input-wrapper">
        <input
          type="text"
          placeholder="Enter barcode"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
        />
        {barcode && (
          <button
            type="button"
            className="clear-button"
            onClick={() => setBarcode('')}
          >
            ×
          </button>
        )}
      </div>

      {foundItem ? (
        <div style={{ marginTop: '1.5rem' }}>
          <h2>{foundItem.name}</h2>
          <p><strong>Asking Price:</strong> {foundItem['asking price']}</p>
          <p><strong>Lowest Price:</strong> {foundItem['lowest price']}</p>
          <p><strong>Sold:</strong> {foundItem.sold?.toLowerCase() === 'true' ? 'Yes' : 'No'}</p>
        </div>
      ) : (
        barcode && <p style={{ marginTop: '1.5rem' }}>Item not found</p>
      )}
    </div>
  );
}

export default App;