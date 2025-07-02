// Example: fetch Airtable data and convert to CSV in JavaScript
async function downloadAirtableCSV() {
    const apiKey = 'patXTUS9m8os14OO1.6a81b7bc4dd88871072fe71f28b568070cc79035bc988de3d4228d52239c8238';
    const baseId = 'appULLKTBuhk539mu';
    const tableName = 'tblVrmq2waEpElxt4';
  
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
  
    const data = await response.json();
    const records = data.records;
  
    const fields = Object.keys(records[0].fields);
    const csvRows = [
      fields.join(","),
      ...records.map(rec => fields.map(f => JSON.stringify(rec.fields[f] || "")).join(","))
    ];
  
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${tableName}.csv`;
    a.click();
  }
  