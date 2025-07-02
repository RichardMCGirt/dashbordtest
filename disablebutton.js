document.addEventListener('DOMContentLoaded', function() {
    const exportButton = document.getElementById('export-button');
    let isFetching = true; // Variable to track fetching status
    let allRecords = []; // Array to store all fetched records
    let currentOffset = ''; // Initial offset is empty


    // Disable export button initially with important style override
    exportButton.disabled = true;
    exportButton.textContent = `Please wait... Fetching data...`;
    exportButton.style.cssText = "background-color: #ccc !important; cursor: not-allowed !important; pointer-events: none !important;";

    // Function to enable export button after data fetch is complete
    function enableExportButton() {
        exportButton.disabled = false;
        exportButton.textContent = "Export to CSV";
        exportButton.style.cssText = ""; // Restore button to its original style
    }

    // Example fetch function for data fetching
    async function fetchData(url, recordCountElement, offset = '') {
        try {
            const response = await fetch(`${url}${offset ? `&offset=${offset}` : ''}`, {
                headers: {
                    'Authorization': `Bearer patTGK9HVgF4n1zqK.cbc0a103ecf709818f4cd9a37e18ff5f68c7c17f893085497663b12f2c600054` // Ensure you include your Airtable API key
                }
            });
            const data = await response.json();
            if (response.ok) {
                allRecords = allRecords.concat(data.records); // Append fetched records to the allRecords array
                document.getElementById(recordCountElement).textContent = `Records fetched: ${allRecords.length}`;

                if (data.offset) {
                    // If there's more data to fetch, call fetchData again with the new offset
                    fetchData(url, recordCountElement, data.offset);
                } else {
                    // No more records to fetch
                    isFetching = false;
                    enableExportButton();
                }
            } else {
                console.error('Error fetching data:', data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // List all fetch requests with corresponding record count elements
    const airtableBaseId = 'appeNSp44fJ8QYeY5'; // Replace with your actual Airtable Base ID
    const airtableTableName = 'tblRp5bukUiw9tX9j'; // Replace with your actual Airtable Table Name
    const pageSize = 100; // Number of records to fetch per page

    // Initialize data fetching with the base URL and parameters
    fetchData(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?pageSize=${pageSize}`, 'record-count', currentOffset);

});
