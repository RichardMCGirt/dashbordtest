import {
  fetchDropboxToken,
  uploadFileToDropbox
} from './dropbox.js';

  let airtableApiKey = 'patTGK9HVgF4n1zqK.cbc0a103ecf709818f4cd9a37e18ff5f68c7c17f893085497663b12f2c600054';
let baseId = 'appD3QeLneqfNdX12';
  let tableId = 'tblvqHdBUZ6EQpcNM';
  let csvLabel = 'SalesSummarybyPOSUDF1byLocation.csv';

document.addEventListener("DOMContentLoaded", function () {
  loadCSVFromAirtable();
});

// Extract date from filename: support MM-DD-YYYY or Unix timestamp
function extractDateFromCSV(content) {
  const lines = content.split('\n');
  for (let line of lines.slice(0, 5)) {
    const match = line.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/); // e.g. 06/18/2025
    if (match) {
      const [_, mm, dd, yyyy] = match;
return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    }
  }
  return null;
}

async function loadCSVFromAirtable() {
  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      headers: { Authorization: `Bearer ${airtableApiKey}` }
    });

    const data = await res.json();
    const record = data.records.find(r => r.fields['CSV file']?.trim() === csvLabel);
    const attachments = record?.fields?.Attachments;

    if (!attachments || attachments.length < 2) {
      throw new Error("❌ Need at least two files for comparison.");
    }

    // 📆 Parse and sort attachments
   const sorted = await Promise.all(
  attachments.map(async (file) => {
    try {
      const fileContent = await fetch(file.url).then(r => r.text());
      const parsedDate = extractDateFromCSV(fileContent);
      const fallbackDate = new Date(file.createdTime || file.lastModifiedTime || Date.now());
      const finalDate = parsedDate || fallbackDate;

      return { ...file, date: finalDate, content: fileContent };
    } catch (err) {
      console.warn("⚠️ Failed to parse content for", file.filename, err);
      return null;
    }
  })
);

const validSorted = sorted.filter(file => file && file.date instanceof Date && !isNaN(file.date));
validSorted.sort((a, b) => a.date - b.date);

if (validSorted.length < 2) {
  throw new Error("❌ Could not find two valid dated files.");
}

const [olderFile, newerFile] = validSorted;

const formatDate = date =>
  date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

const newerDateStr = formatDate(newerFile.date);
const olderDateStr = formatDate(olderFile.date);

const dateDisplayEl = document.getElementById("csvDateLabel");
dateDisplayEl.innerHTML = `
  <strong>Comparing Files:</strong><br>
  ✅ <strong></strong> ${newerFile.filename} (${newerDateStr})<br>
  🔄 <strong></strong> ${olderFile.filename} (${olderDateStr})
`;

    // 🧾 Fetch CSV contents
    const [newContent, oldContent] = await Promise.all([
      fetch(newerFile.url).then(r => r.text()),
      fetch(olderFile.url).then(r => r.text())
    ]);

    const comparisonData = compareCSVData(newContent, oldContent);
    renderComparisonTable(comparisonData);
    document.getElementById("hiddenContent").style.display = "block";

  } catch (error) {
    console.error("❌ Failed to load files from Airtable:", error);
  }
}

function compareCSVData(newContent, oldContent) {
 const parse = (content, label) => {
  const rows = content.split("\n");

  const parsed = rows.map(row => {
    const [city, type, net, gross] = row.split(",").map(c => c.replace(/[$,"\r]/g, '').trim());

    const netParsed = parseFloat(net);
    const grossParsed = parseFloat(gross);

    if (!city || !type || isNaN(netParsed) || isNaN(grossParsed)) {
      return null; // skip junk
    }

    return {
      city,
      type,
      netSales: netParsed,
      grossProfit: grossParsed
    };
  }).filter(Boolean);

  return parsed;
};

  const newData = parse(newContent, '📥 New File');
  const oldData = parse(oldContent, '📦 Old File');

  const key = r => `${r.city}|${r.type}`;
  const mapOld = Object.fromEntries(oldData.map(r => [key(r), r]));

  const tableRows = newData.map(r => {
    const rowKey = key(r);
    const prev = mapOld[rowKey] || { netSales: 0, grossProfit: 0 };
    const netDiff = r.netSales - prev.netSales;
    const grossDiff = r.grossProfit - prev.grossProfit;

    return {
      ...r,
      netDiff,
      grossDiff
    };
  });

  return tableRows;
}

function renderComparisonTable(data) {
  // Group rows by city
  const groupedByCity = {};
  for (const row of data) {
    if (!groupedByCity[row.city]) groupedByCity[row.city] = [];
    groupedByCity[row.city].push(row);
  }

  let totalNet = 0;
  let totalGross = 0;

  let html = `<table class="styled-table">
    <tr>
      <th>City</th>
      <th>Type</th>
      <th>Net Sales</th>
      <th>Gross Profit</th>
    </tr>`;

  for (const city in groupedByCity) {
    const rows = groupedByCity[city];
    const rowspan = rows.length;

    rows.forEach((row, index) => {
      const { type, netSales, grossProfit, netDiff, grossDiff } = row;
      const netClass = netDiff > 0 ? 'pos' : netDiff < 0 ? 'neg' : '';
      const grossClass = grossDiff > 0 ? 'pos' : grossDiff < 0 ? 'neg' : '';

      totalNet += netSales;
      totalGross += grossProfit;

      html += `<tr${index === 0 ? ` class="city-border"` : ""}>`;

      if (index === 0) {
        html += `<td rowspan="${rowspan}">${city}</td>`;
      }

      html += `
        <td>${type}</td>
        <td>
          $${netSales.toLocaleString()}<br>
          ${netDiff !== 0 ? `<small class="${netClass}">${netDiff > 0 ? '+' : ''}$${netDiff.toLocaleString()}</small>` : ''}
        </td>
        <td>
          $${grossProfit.toLocaleString()}<br>
          ${grossDiff !== 0 ? `<small class="${grossClass}">${grossDiff > 0 ? '+' : ''}$${grossDiff.toLocaleString()}</small>` : ''}
        </td>
      </tr>`;
    });
  }

  // 🔻 Total row with top border
  html += `
    <tr style="border-top: 3px solid #000; font-weight: bold;">
      <td colspan="2" style="text-align: right;">Total:</td>
      <td>$${totalNet.toLocaleString()}</td>
      <td>$${totalGross.toLocaleString()}</td>
    </tr>`;

  html += `</table>`;
  document.getElementById("rawDataTable").innerHTML = html;
}

async function replaceCSVInAirtableViaDropbox(file) {


  try {
    const creds = await fetchDropboxToken();
    if (!creds || !creds.token) throw new Error("❌ Dropbox token not available");

    const dropboxUrl = await uploadFileToDropbox(file, creds.token, creds);
    if (!dropboxUrl) throw new Error("❌ Dropbox upload failed");


    // Step 2: Find Airtable record
    const recordsRes = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      headers: { Authorization: `Bearer ${airtableApiKey}` }
    });

    const data = await recordsRes.json();
    const record = data.records.find(
      r => r.fields['CSV file']?.trim() === csvLabel
    );

    if (!record) throw new Error("❌ Airtable record not found");

    const recordId = record.id;
    const currentAttachments = record.fields.Attachments || [];

    // Step 3: Keep only the newest existing file + new upload
    const sortedExisting = [...currentAttachments].sort((a, b) =>
      new Date(b.createdTime) - new Date(a.createdTime)
    );

    const updatedAttachments = [
      { url: dropboxUrl, filename: csvLabel }
    ];

    if (sortedExisting.length > 0) {
      updatedAttachments.push(sortedExisting[0]); // Keep most recent existing one
    }

    // Step 4: Patch Airtable with updated attachment list
    const patchRes = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Attachments: updatedAttachments
        }
      })
    });

    const patchData = await patchRes.json();
    if (patchData.id) {
        await loadCSVFromAirtable(); // Refresh full comparison UI with new file included
    } else {
      throw new Error("❌ Airtable PATCH failed.");
    }

  } catch (err) {
    console.error("❌ Failed to replace file via Dropbox:", err);
    alert("❌ File update failed. See console.");
  }
}

document.getElementById("fileInputSummary").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  replaceCSVInAirtableViaDropbox(file);
});

