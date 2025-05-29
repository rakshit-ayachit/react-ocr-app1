import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

function App() {
  const [image, setImage] = useState(null);
  const [rawText, setRawText] = useState('');
  const [structuredData, setStructuredData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setRawText('');
      setStructuredData({});
    }
  };

  const parseTextWithRegex = (text) => {
  const data = {
    items: [],
    total_amount: null,
    cgst: null,
    sgst: null,
    vat: null,
    final_amount: null,
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Match items with at least quantity and amount (rate is optional)
  const itemLineRegex = /^(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/;

  lines.forEach(line => {
    const match = line.match(itemLineRegex);
    if (match) {
      const itemName = match[1].replace(/[^a-zA-Z0-9 ()&]/g, '').trim();
      const quantity = parseInt(match[2]);
      const rate = parseFloat(match[3]);
      const amount = parseFloat(match[4]);

      data.items.push({
        item: itemName,
        quantity,
        rate,
        amount
      });
    }
  });

  // Total, Taxes & Final Amounts
  const findNumberAfter = (pattern) => {
    const rgx = new RegExp(pattern + '\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)', 'i');
    const match = text.match(rgx);
    return match ? parseFloat(match[1].replace(',', '')) : null;
  };

  data.total_amount = findNumberAfter('Total\\s*(?:Amount)?');
  data.final_amount = findNumberAfter('Grand Total|Final Total|Final Amount');
  data.cgst = findNumberAfter('CGST');
  data.sgst = findNumberAfter('SGST');
  data.vat = findNumberAfter('VAT');

  return data;
};

  const handleOCR = () => {
    setIsProcessing(true);
    Tesseract.recognize(image, 'eng', {
      logger: m => console.log(m)
    })
      .then(({ data: { text } }) => {
        setRawText(text);
        const parsed = parseTextWithRegex(text);
        setStructuredData(parsed);
        setIsProcessing(false);
      })
      .catch(err => {
        console.error(err);
        setIsProcessing(false);
      });
  };

  return (
    <div className="container">
      <h2>Restaurant Bill OCR</h2>

      <input type="file" accept="image/*" onChange={handleImageChange} />
      <br /><br />

      {image && <img src={image} alt="Preview" className="preview" />}
      <br />

      <button onClick={handleOCR} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Extract Text'}
      </button>

      <h3>Raw OCR Output</h3>
      <textarea rows="8" value={rawText} readOnly></textarea>

      <h3>Structured Data</h3>
      <pre>{JSON.stringify(structuredData, null, 2)}</pre>
    </div>
  );
}

export default App;
