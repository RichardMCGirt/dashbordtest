document.addEventListener('DOMContentLoaded', function () {
    initializeFMReturns();
});

async function initializeFMReturns() {

    displayLoadingMessages("Loading FM Returns, please wait...", "fetch-progress2");

    const airtableApiKey = 'pat1Eu3iQYHDmLSWr.ecfb8470f9c2b8409a0017e65f5b8cf626208e4df1a06905a41019cb38a8534b';
    const airtableBaseId = 'appeNSp44fJ8QYeY5';
    const airtableTableName = 'tbl6eZYBPK79a8qqo';

    const filterFormula = `AND(
        IS_AFTER({Created}, DATEADD(TODAY(), -7, 'days')),
        {Field Manager} != ''
    )`;

    const fmRecords = await fetchAirtableDatas(airtableApiKey, airtableBaseId, airtableTableName, filterFormula);


    const fmData = processFMData(fmRecords);

    // Populate FM dropdown
    populateDropdown2(Object.keys(fmData), 'user-filter2', fmData);

    // Display FM returns chart
    displayFMReturnsAsBarChart(fmData, 'FMR');

    hideLoadingMessages("fetch-progress2");
}

async function fetchAirtableDatas(apiKey, baseId, tableName) {
    try {
        let allRecords = [];
        let offset;

        // Filter formula to fetch records where Date Created is within the last 7 days
        const filterFormula = `IS_AFTER({Date Created}, DATEADD(TODAY(), -7, 'days'))`;
        const encodedFormula = encodeURIComponent(filterFormula);

        do {
            const url = `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula=${encodedFormula}${
                offset ? `&offset=${offset}` : ''
            }`;


            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Airtable API Error:", errorText);
                throw new Error(`Airtable API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            // Log each record's fields
            data.records.forEach(record => {
            });

            allRecords = allRecords.concat(data.records);
            offset = data.offset;
        } while (offset);

        return allRecords;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}


function processFMData(records) {
    const data = {};

    records.forEach(record => {
        // Log all fields for each record

        const fieldManager = record.fields['FM'] || 'Unknown';
        if (!data[fieldManager]) {
            data[fieldManager] = 0;
        }
        data[fieldManager] += 1;
    });

    return data;
}


function populateDropdown2(items, dropdownId, data) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.error(`Dropdown with ID '${dropdownId}' not found.`);
        return;
    }

    dropdown.innerHTML = '<option value="all">All Field Managers</option>';

    // Sort items alphabetically
    const sortedItems = items.sort((a, b) => a.localeCompare(b));

    sortedItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = `${item} (${data[item]})`;
        dropdown.appendChild(option);
    });

    dropdown.addEventListener('change', event => {
        const selectedFM = event.target.value;
        if (selectedFM === 'all') {
            displayFMReturnsAsBarChart(data, 'FMR');
        } else {
            const filteredData = { [selectedFM]: data[selectedFM] };
            displayFMReturnsAsBarChart(filteredData, 'FMR');
        }
    });
}


function displayFMReturnsAsBarChart(data, canvasId2) {
    const canvas = document.getElementById(canvasId2);
    if (!canvas) {
        console.error(`Canvas with ID '${canvasId2}' not found.`);
        return;
    }

    const ctx = canvas.getContext('2d');

    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    // Sort the data by values in ascending order
    const sortedData = Object.entries(data).sort((a, b) => a[1] - b[1]);

    // Extract sorted labels and values
    const labels = sortedData.map(item => item[0]);
    const values = sortedData.map(item => item[1]);

    canvas.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Returns',
                    data: values,
                    backgroundColor: 'rgba(1, 16, 115, 0.8)',
                    borderColor: 'rgba(1, 16, 115, 0.8)',
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}


function displayLoadingMessages(message, elementId) {
    const fetchProgress = document.getElementById(elementId);
    if (fetchProgress) {
        fetchProgress.textContent = message;
        fetchProgress.style.display = 'block';
    } else {
        console.warn(`Fetch progress element with ID '${elementId}' not found.`);
    }
}

function hideLoadingMessages(elementId) {
    const fetchProgress = document.getElementById(elementId);
    if (fetchProgress) {
        fetchProgress.style.display = 'none';
    }
}
