import {
  fetchDropboxToken,
  uploadFileToDropbox
} from './dropbox.js';

document.addEventListener("DOMContentLoaded", function () {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const errorMessage = document.getElementById("errorMessage");
    const csvTable = document.getElementById("csvTable");
    const tableHead = csvTable.querySelector("thead");
    const tableBody = csvTable.querySelector("tbody");
    const csvDate = document.getElementById("csvDate");

    const formattedDate = new Date().toLocaleDateString();
    csvDate.textContent = formattedDate;
    tableHead.style.display = "none";

    // Airtable config
    const airtableApiKey = 'patTGK9HVgF4n1zqK.cbc0a103ecf709818f4cd9a37e18ff5f68c7c17f893085497663b12f2c600054';
    const baseId = 'appD3QeLneqfNdX12';
    const tableId = 'tblvqHdBUZ6EQpcNM';

    // Load CSV from Airtable
    fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
        headers: { Authorization: `Bearer ${airtableApiKey}` }
    })
    .then(res => res.json())
    .then(data => {
        const record = data.records.find(r =>
            r.fields['CSV file']?.trim() === 'OpenPOReportbyVendorSalesmanDateCreated.csv'
        );

        if (!record) throw new Error("Matching record not found in Airtable.");
        const attachment = record.fields['Attachments']?.[0];
        if (!attachment?.url) throw new Error("No attachment found for matching record.");
        return fetch(attachment.url);
    })
    .then(res => res.text())
    .then(csvData => {
        errorMessage.style.display = 'none';
        parseCSV(csvData);
    })
    .catch(error => {
        console.warn("Airtable CSV not loaded:", error.message);
        errorMessage.textContent = "Could not load CSV from Airtable.";
        errorMessage.style.display = 'block';
    });

    // Drag-and-drop and file input
    ['dragenter', 'dragover'].forEach(evt =>
        dropZone.addEventListener(evt, e => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        })
    );

    ['dragleave', 'drop'].forEach(evt =>
        dropZone.addEventListener(evt, e => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        })
    );

    dropZone.addEventListener('drop', e => {
        const files = e.dataTransfer.files;
        if (files.length) processFile(files[0]);
    });

    fileInput.addEventListener('change', e => {
        if (e.target.files.length) processFile(e.target.files[0]);
    });

    async function processFile(file) {
        if (!file.name.endsWith('.csv')) {
            errorMessage.textContent = `Invalid file selected. Please upload a CSV file.`;
            errorMessage.style.display = 'block';
            return;
        }

        errorMessage.style.display = 'none';

        const { token: dropboxToken, appKey, appSecret, refreshToken } = await fetchDropboxToken();

        const reader = new FileReader();
        reader.onload = async function (e) {
            const csvText = e.target.result;
            parseCSV(csvText);

            // Upload to Airtable
const creds = { appKey, appSecret, refreshToken };
const sharedUrl = await uploadFileToDropbox(file, dropboxToken, creds);
if (sharedUrl) {
    console.log("✅ Dropbox Upload Complete:", sharedUrl);
    await uploadNewCSVToAirtable(file, baseId, tableId, airtableApiKey, sharedUrl);
}


            // Upload to Dropbox
            if (!dropboxToken) {
                console.warn("⚠️ Dropbox token not available. Skipping Dropbox upload.");
                return;
            }

            try {
                const creds = { appKey, appSecret, refreshToken };
                const sharedUrl = await uploadFileToDropbox(file, dropboxToken, creds);
                if (sharedUrl) {
                    console.log("✅ Dropbox Upload Complete:", sharedUrl);
                } else {
                    console.error("❌ Dropbox upload failed.");
                }
            } catch (err) {
                console.error("❌ Dropbox upload error:", err);
            }
        };
        reader.readAsText(file);
    }

    function formatName(name) {
        return name.replace(/\./g, ' ')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    function parseCSV(csvData) {
        const lines = csvData.split('\n').slice(10); // skip headers
        const counts = {};
        let totalOccurrences = 0;

        lines.forEach(line => {
            const columns = line.split(',');
            let counterPerson = columns[9]?.trim().replace(/['"]+/g, '');
            if (counterPerson) {
                counterPerson = formatName(counterPerson);
                counts[counterPerson] = (counts[counterPerson] || 0) + 1;
                totalOccurrences++;
            }
        });

        populateTable(counts, totalOccurrences);
    }

    function populateTable(counts, totalOccurrences) {
        const average = totalOccurrences / Object.keys(counts).length;
        tableHead.style.display = average > 0 ? "" : "none";
        tableBody.innerHTML = "";

        Object.entries(counts)
            .map(([key, value]) => ({
                key,
                value,
                percentage: ((value / average) * 100).toFixed(2)
            }))
            .sort((a, b) => b.percentage - a.percentage || a.key.localeCompare(b.key))
            .forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `<td>${item.key}</td><td>${item.value}</td><td>${item.percentage}%</td>`;
                tableBody.appendChild(row);
            });
    }
});

function uploadNewCSVToAirtable(file, baseId, tableId, apiKey, dropboxUrl) {
    fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    })
    .then(res => res.json())
    .then(data => {
        const record = data.records.find(r =>
            r.fields['CSV file']?.trim() === 'OpenPOReportbyVendorSalesmanDateCreated.csv'
        );
        if (!record) throw new Error("Matching record not found to update.");

        return fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${record.id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fields: {
                    "Attachments": [{ url: dropboxUrl }]
                }
            })
        });
    })
    .then(() => console.log("✅ Airtable CSV record updated successfully."))
    .catch(err => console.error("❌ Upload error:", err));
}

