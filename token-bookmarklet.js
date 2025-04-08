(async function () {
  // Extract token data and fetch pricing from CoinGecko
  const tokenDivs = document.querySelectorAll('div.mt-2.p-3.py-1.rounded.bg-no-repeat.bg-cover');
  const extractedData = [];
  const tokenNames = [];
  const tokenIdMap = {
    "$VIPER": "viper-2",
    "$SUGAR": "sugar-bush",
    "$BBSNEK": "babysnek",
    "$FREN": "ada-peepos",
    "$COCK": "cockcardano"
  };
  
  // Extract token names
  tokenDivs.forEach(div => {
    const tokenName = div.querySelector('div.text-white > div')?.textContent.trim();
    if (tokenName && tokenIdMap[tokenName]) {
      const mappedId = tokenIdMap[tokenName];
      if (!tokenNames.includes(mappedId)) {
        tokenNames.push(mappedId);
      }
    }
  });
  
  // Fetch ADA/USD rate
  let adaToUsdRate = 0.55;
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd');
    const json = await res.json();
    adaToUsdRate = json.cardano.usd;
  } catch (e) {
    console.error('Could not fetch ADA/USD rate:', e);
  }
  
  // Fetch token prices
  let tokenPrices = {};
  try {
    const ids = tokenNames.join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=ada,usd`);
    tokenPrices = await res.json();
  } catch (e) {
    console.error('Could not fetch token prices:', e);
  }
  
  // Build display data
  tokenDivs.forEach(div => {
    try {
      const tokenName = div.querySelector('div.text-white > div')?.textContent.trim();
      const tokenValueRaw = div.querySelector('div.text-white div.ml-auto div:last-child')?.textContent.trim();
      const tokenValue = parseFloat(tokenValueRaw.replace(/,/g, ''));
      const mappedId = tokenIdMap[tokenName];
  
      if (!mappedId || !tokenValue) {
        extractedData.push({ name: tokenName, value: tokenValueRaw || '-', ada: 'unknown', usd: 'unknown' });
        return;
      }
  
      const price = tokenPrices[mappedId] || {};
      let adaPrice = price.ada || 0;
      const usdPrice = price.usd || 0;
  
      if (!adaPrice && usdPrice && adaToUsdRate) {
        adaPrice = usdPrice / adaToUsdRate;
      }
  
      const adaTotal = (tokenValue * adaPrice).toFixed(6);
      const usdTotal = (tokenValue * usdPrice).toFixed(4);
  
      extractedData.push({ name: tokenName, value: tokenValueRaw, ada: adaTotal, usd: usdTotal });
    } catch (e) {
      console.error('Error parsing token div:', e);
    }
  });
  
  // Build UI overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '10%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translateX(-50%)';
  overlay.style.background = 'white';
  overlay.style.border = '1px solid #ccc';
  overlay.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
  overlay.style.zIndex = 9999;
  overlay.style.maxHeight = '80%';
  overlay.style.overflowY = 'auto';
  overlay.style.padding = '20px';
  overlay.style.fontFamily = 'monospace';
  overlay.style.whiteSpace = 'normal';
  overlay.style.borderRadius = '8px';
  overlay.style.minWidth = '300px';
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '✖';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '10px';
  closeButton.style.border = 'none';
  closeButton.style.background = 'transparent';
  closeButton.style.fontSize = '16px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => overlay.remove();
  overlay.appendChild(closeButton);
  
  // Table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '10px';
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Token', 'Value', 'ADA', 'USD'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    th.style.borderBottom = '1px solid #ccc';
    th.style.padding = '6px';
    th.style.textAlign = 'left';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  if (extractedData.length > 0) {
    extractedData.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.style.backgroundColor = index % 2 === 0 ? '#e6e6e6' : '#ffffff';
      [row.name, row.value, row.ada, row.usd].forEach(cellText => {
        const td = document.createElement('td');
        td.textContent = cellText;
        td.style.padding = '6px';
        td.style.borderBottom = '1px solid #eee';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = 'No matching DIVs found.';
    td.colSpan = 4;
    td.style.padding = '10px';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  overlay.appendChild(table);
  
  // Export JSON
  const exportJsonButton = document.createElement('button');
  exportJsonButton.textContent = '⬇ Export JSON';
  exportJsonButton.style.marginTop = '15px';
  exportJsonButton.style.marginRight = '10px';
  exportJsonButton.style.padding = '6px 10px';
  exportJsonButton.style.border = '1px solid #ccc';
  exportJsonButton.style.borderRadius = '4px';
  exportJsonButton.style.cursor = 'pointer';
  exportJsonButton.onclick = () => {
    const json = JSON.stringify(extractedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tokens.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  overlay.appendChild(exportJsonButton);
  
  // Export CSV
  const exportCsvButton = document.createElement('button');
  exportCsvButton.textContent = '⬇ Export CSV';
  exportCsvButton.style.marginTop = '15px';
  exportCsvButton.style.padding = '6px 10px';
  exportCsvButton.style.border = '1px solid #ccc';
  exportCsvButton.style.borderRadius = '4px';
  exportCsvButton.style.cursor = 'pointer';
  exportCsvButton.onclick = () => {
    const csvHeader = 'Token,Value,ADA,USD\\n';
    const csvRows = extractedData.map(row => `${row.name},${row.value},${row.ada},${row.usd}`).join('\\n');
    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tokens.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  overlay.appendChild(exportCsvButton);
  
  // Footer links
  const footer = document.createElement('div');
  footer.style.marginTop = '15px';
  footer.style.fontSize = '14px';
  footer.style.textAlign = 'center';
  
  const viperLink = document.createElement('a');
  viperLink.href = 'https://x.com/vipercoincto';
  viperLink.innerHTML = '🐍 Presented with love by $VIPER';
  viperLink.style.display = 'block';
  viperLink.style.marginTop = '10px';
  viperLink.style.textDecoration = 'none';
  viperLink.style.color = '#0077cc';
  viperLink.target = '_blank';
  
  const swapLink = document.createElement('a');
  swapLink.href = 'https://viperswap.co/';
  swapLink.innerHTML = '🔁 Swap your tokens here';
  swapLink.style.display = 'block';
  swapLink.style.marginTop = '5px';
  swapLink.style.textDecoration = 'none';
  swapLink.style.color = '#0077cc';
  swapLink.target = '_blank';
  
  footer.appendChild(viperLink);
  footer.appendChild(swapLink);
  overlay.appendChild(footer);
  
  document.body.appendChild(overlay);
})();
