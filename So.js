import {
  fetchDropboxToken,
  uploadFileToDropbox
} from './dropbox.js';

document.addEventListener("DOMContentLoaded", () => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;
    document.getElementById('csvDate').textContent = `Current as of: ${formattedDate}`;

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('csvFileInput');
    const tableBody = document.querySelector('#csvTable tbody');

    const airtableApiKey = 'patTGK9HVgF4n1zqK.cbc0a103ecf709818f4cd9a37e18ff5f68c7c17f893085497663b12f2c600054';
    const baseId = 'appD3QeLneqfNdX12';
    const tableId = 'tblvqHdBUZ6EQpcNM';
    const csvLabelMatch = 'SalesOrdersCreatedbyDateRangebyCounterPerson.csv';

    // Load current Airtable CSV
    fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
        headers: { Authorization: `Bearer ${airtableApiKey}` }
    })
    .then(res => res.json())
    .then(data => {
        const record = data.records.find(r =>
            r.fields['CSV file']?.trim() === csvLabelMatch &&
            r.fields['Attachments']?.[0]?.url
        );
        if (!record) throw new Error("Matching CSV file not found.");
        return fetch(record.fields['Attachments'][0].url);
    })
    .then(res => res.text())
    .then(csvData => parseCSV(csvData))
    .catch(error => console.warn("Could not load CSV from Airtable:", error.message));

    // Drag and drop
    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.style.backgroundColor = '#e6f7ff';
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.backgroundColor = '';
    });
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.style.backgroundColor = '';
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

    function handleFile(file) {
        if (!file || !file.name.endsWith('.csv')) {
            alert('⚠️ Please upload a valid CSV file.');
            return;
        }
        if (!file.name.includes('SalesOrdersCreatedbyDateRangebyCounterPerson')) {
            alert('⚠️ Filename must contain "SalesOrdersCreatedbyDateRangebyCounterPerson".');
            return;
        }
        uploadNewCSVToDropboxAndAirtable(file);
    }

    async function uploadNewCSVToDropboxAndAirtable(file) {
        try {
            const { token: dropboxToken, appKey, appSecret, refreshToken } = await fetchDropboxToken();
            const creds = { appKey, appSecret, refreshToken };
            const sharedUrl = await uploadFileToDropbox(file, dropboxToken, creds);

            if (!sharedUrl) throw new Error("Dropbox upload failed.");

            // Get matching Airtable record
            const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
            const data = await res.json();
            const record = data.records.find(r =>
                r.fields['CSV file']?.trim() === csvLabelMatch
            );

            if (!record) throw new Error("Matching record not found in Airtable.");
            const recordId = record.id;

            // Clear previous attachment
            await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ fields: { Attachments: [] } })
            });

            // Add new Dropbox link
            await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fields: {
                        Attachments: [{ url: sharedUrl }]
                    }
                })
            });

            alert("✅ File uploaded and replaced successfully.");
            location.reload();

        } catch (err) {
            console.error("❌ Upload error:", err);
            alert("⚠️ Upload failed. See console for details.");
        }
    }

    function parseCSV(csvData) {
        const lines = csvData.split('\n').slice(3);
        const counts = {};
        let total = 0;

        lines.forEach(line => {
            const value = line.split(',')[0]?.trim().replace(/['"]+/g, '');
            if (value) {
                counts[value] = (counts[value] || 0) + 1;
                total++;
            }
        });

        const avg = total / Object.keys(counts).length;
        const sorted = Object.entries(counts).map(([key, value]) => ({
            key,
            value,
            percentage: ((value / avg) * 100).toFixed(2)
        })).sort((a, b) => b.percentage - a.percentage || a.key.localeCompare(b.key));

        tableBody.innerHTML = '';
        sorted.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${item.key}</td><td>${item.value}</td><td>${item.percentage}%</td>`;
            tableBody.appendChild(row);
        });
    }
});
