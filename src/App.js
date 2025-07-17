import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const SHEET_URL = "https://spreadsheets.google.com/feeds/list/1-J7mbZdqug14bh_F1KJYy-XgmQgQUeX4v7N8OcuunwI/od6/public/values?alt=json";

function App() {
  const [data, setData] = useState([]);
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(SHEET_URL)
      .then(res => res.json())
      .then(json => {
        const items = json.feed.entry.map(entry => ({
          barcode: entry['gsx$barcode']?.$t,
          name: entry['gsx$itemname']?.$t,
          price: entry['gsx$price']?.$t,
          sold: entry['gsx$sold']?.$t.toLowerCase() === 'true'
        }));
        setData(items);
      });
  }, []);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("scanner", { fps: 10, qrbox: 250 });
    scanner.render(onScanSuccess);
    return () => scanner.clear();
  }, [data]);

  const onScanSuccess = (decodedText) => {
    const match = data.find(d => d.barcode === decodedText);
    if (match) {
      setItem(match);
      setError("");
    } else {
      setItem(null);
      setError(`Barcode "${decodedText}" not found.`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Garage Sale Item Lookup</h1>
      <div id="scanner" />
      {item && (
        <div>
          <h2>Item Found:</h2>
          <p><strong>Name:</strong> {item.name}</p>
          <p><strong>Price:</strong> ${item.price}</p>
          <p><strong>Sold:</strong> {item.sold ? "Yes" : "No"}</p>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default App;
