let sourceTable = base.getTable("tblDhUMOKPBzH8SrX");
let destinationTable = base.getTable("tbl6EeKPsNuEvt5yJ");

let sourceView = sourceTable.getView("viwA1IRNrT5Vzv01T");
let destinationView = destinationTable.getView("viwMlo3nM8JDCIMyV");

let eventIdField = "Event ID";
let titleField = "Title"; // in source
let lotAndCommunityField = "Lot Number and Community/Neighborhood"; // in destination

console.log("🔄 Fetching records...");
let sourceRecords = await sourceView.selectRecordsAsync();
let destinationRecords = await destinationView.selectRecordsAsync();

console.log(`📦 Source records: ${sourceRecords.records.length}`);
console.log(`🏠 Destination records: ${destinationRecords.records.length}`);

// Build a map: key = Title, value = Event ID
let sourceMap = new Map();
for (let record of sourceRecords.records) {
    let title = record.getCellValue(titleField);
    let eventId = record.getCellValue(eventIdField);
    if (title && eventId) {
        sourceMap.set(title.trim(), eventId);
        console.log(`🧩 Source mapped: "${title.trim()}" => ${eventId}`);
    }
}

let updates = [];

for (let record of destinationRecords.records) {
    let lotAndCommunity = record.getCellValue(lotAndCommunityField);
    let recordId = record.id;

    if (!lotAndCommunity) {
        console.log(`⚠️ Missing "Lot Number and Community/Neighborhood" in record ${recordId}`);
        continue;
    }

    let combinedKey = lotAndCommunity.trim();

    if (sourceMap.has(combinedKey)) {
        let sourceEventId = sourceMap.get(combinedKey);
        let currentEventId = record.getCellValue(eventIdField);

        if (currentEventId !== sourceEventId) {
            console.log(`✅ Updating "${combinedKey}" - Setting Event ID to ${sourceEventId}`);
            updates.push({
                id: recordId,
                fields: {
                    [eventIdField]: sourceEventId
                }
            });
        } else {
            console.log(`⏩ "${combinedKey}" already up to date`);
        }
    } else {
        console.log(`❌ No match for destination key "${combinedKey}"`);
    }
}

// Batch update (max 50 records at a time)
while (updates.length > 0) {
    console.log(`📤 Updating batch of ${Math.min(50, updates.length)} records...`);
    await destinationTable.updateRecordsAsync(updates.slice(0, 50));
    updates = updates.slice(50);
}

console.log("🎉 Event ID transfer complete.");
