document.addEventListener('DOMContentLoaded', async function () {
    const airtableApiKey = 'patXTUS9m8os14OO1.6a81b7bc4dd88871072fe71f28b568070cc79035bc988de3d4228d52239c8238';
    const airtableBaseId = 'appK9gZS77OmsIK50';
    const airtableTableName = 'tblQo2148s04gVPq1';
    let chartInstance = null; 

    let projectType = "Commercial".trim();
    let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?pageSize=100&filterByFormula=AND({Project Type}='${projectType}',{Outcome}='Win')`;

    const exportButton = document.getElementById('export-button');
    const currentYear = new Date().getFullYear();

    exportButton.disabled = true;
    exportButton.textContent = "Fetching data...";
    exportButton.style.backgroundColor = "#ccc"; 
    exportButton.style.cursor = "not-allowed"; 

    async function fetchData(offset = null) {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?pageSize=100&filterByFormula=AND(%7BProject%20Type%7D%3D'Commercial',%7BOutcome%7D%3D'Win')&sort%5B0%5D%5Bfield%5D=Project%20Type&sort%5B0%5D%5Bdirection%5D=asc`;
        if (offset) url += `&offset=${offset}`;

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                console.error('Error fetching data from Airtable:', errorDetails);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data from Airtable:', error.message);
            return { records: [] };
        }
    }

    async function fetchDivisionNames(divisionIds) {
        const uniqueIds = [...new Set(divisionIds.filter(id => id))]; 
        if (uniqueIds.length === 0) {
            console.warn("No unique division IDs found. Returning empty map.");
            return {};
        }
    
        const divisionUrl = `https://api.airtable.com/v0/${airtableBaseId}/Vanir Offices?fields[]=Office Name`;

        try {
            const response = await fetch(divisionUrl, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            if (!response.ok) {
                console.error(`Error fetching division names: ${response.status} ${response.statusText}`);
                throw new Error(`Error fetching division names: ${response.statusText}`);
            }

            const data = await response.json();
            const divisionMap = {};

            data.records.forEach(record => {
                divisionMap[record.id] = record.fields['Office Name']; 
            });

            return divisionMap;
        } catch (error) {
            console.error("Failed to fetch division names:", error);
            return {};
        }
    }
    
    async function fetchAllData() {
        let allRecords = [];
        let offset = null;
        const today = new Date();
        const sixMonthsLater = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());

        do {
            const data = await fetchData(offset);
            const filteredRecords = data.records.filter(record => {
                const anticipatedEndDate = new Date(record.fields['Anticipated Start Date']);
                return anticipatedEndDate >= today && anticipatedEndDate <= sixMonthsLater;
            });

            allRecords = allRecords.concat(filteredRecords);
            offset = data.offset;

            document.getElementById('record-countC6').textContent = `Records fetched: ${allRecords.length}`;
        } while (offset);

        return allRecords;
    }

    async function processRecords(allRecords) {
        if (!allRecords || allRecords.length === 0) {
            console.warn("No records to process.");
            return;
        }

        const divisionIds = allRecords.flatMap(record => 
            Array.isArray(record.fields['Division']) ? record.fields['Division'] : [record.fields['Division']]
        );

        const divisionMap = await fetchDivisionNames(divisionIds);

        const revenueByDivision = {};
        allRecords.forEach(record => {
            let divisionId = Array.isArray(record.fields['Division']) ? record.fields['Division'][0] : record.fields['Division'];
            let divisionName = divisionMap[divisionId] || "Unknown Division";

            const bidValue = parseFloat(record.fields['Bid Value']) || 0;

            if (divisionName && divisionName !== "Test Division") {
                if (!revenueByDivision[divisionName]) {
                    revenueByDivision[divisionName] = 0;
                }
                revenueByDivision[divisionName] += bidValue;
            }
        });

        createBarChart(revenueByDivision);
    }

    function createBarChart(revenueByDivision) {
        const sortedData = Object.entries(revenueByDivision)
            .filter(([division, revenue]) => division !== "Nashville")
            .sort((a, b) => a[1] - b[1]);

        const divisionNames = sortedData.map(entry => entry[0]);
        const revenueValues = sortedData.map(entry => entry[1]);

        const ctx = document.getElementById('6monthsChart').getContext('2d');

        if (chartInstance !== null) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: divisionNames,
                datasets: [{
                    label: 'Projected Revenue',
                    data: revenueValues,
                    backgroundColor: 'rgba(161, 9, 4, 0.8)',
                    borderColor: 'rgba(161, 9, 4, 0.8)',
                    borderWidth: 2,
                    barThickness: 50
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return `$${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return `Projected Revenue: $${tooltipItem.raw.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Fetch data and process records
    const allRecords = await fetchAllData();
    await processRecords(allRecords);
});
