document.addEventListener('DOMContentLoaded', async function () {
    const airtableApiKey = 'patXTUS9m8os14OO1.6a81b7bc4dd88871072fe71f28b568070cc79035bc988de3d4228d52239c8238';
    const airtableBaseId = 'appX1Saz7wMYh4hhm';
    const airtableTableName = 'tblfCPX293KlcKsdp';
    let expectedRevenueChartInstance = null;

    const exportButton = document.getElementById('export-button-new');
    exportButton.disabled = true;
    exportButton.textContent = "Fetching data...";
    exportButton.style.backgroundColor = "#ccc";
    exportButton.style.cursor = "not-allowed";

    async function fetchData(offset = null) {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?pageSize=100`;
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



  async function fetchAllData() {
    let allRecords = [];
    let offset = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time for comparison

    do {
        const data = await fetchData(offset);

       const filteredRecords = data.records.filter(record => {
    const bidValue = parseFloat(record.fields['Bid Value']) || 0;
    const anticipatedEndDate = record.fields['Anticipated End Date']
        ? new Date(record.fields['Anticipated End Date'])
        : null;
    const outcome = record.fields['Outcome'] || '';

    return (
        bidValue > 0 &&
        anticipatedEndDate &&
        anticipatedEndDate >= today &&
        outcome.toLowerCase() === 'win'
    );
});


        allRecords = allRecords.concat(filteredRecords);
        offset = data.offset;

        document.getElementById('record-countNew').textContent = `Records fetched: ${allRecords.length}`;
    } while (offset);

    return allRecords;
}


   async function processRecords(allRecords) {
    if (!allRecords || allRecords.length === 0) {
        console.warn("No records to process.");
        return;
    }

    const today = new Date();
    const revenueByDivision = {};
    const allMonths = new Set();

    console.log(`Processing ${allRecords.length} records...`);

    allRecords.forEach((record, idx) => {
        const divisionName = record.fields['Division'] || "Unknown Division";
        const bidValue = parseFloat(record.fields['Bid Value']) || 0;

        if (bidValue === 0) {
            console.log(`Skipping record ${idx + 1}: Bid Value is zero or invalid.`);
            return;
        }

        const anticipatedStartDate = record.fields['Anticipated Start Date'] ? new Date(record.fields['Anticipated Start Date']) : null;
        const anticipatedEndDate = record.fields['Anticipated End Date'] ? new Date(record.fields['Anticipated End Date']) : null;

        if (!anticipatedStartDate || !anticipatedEndDate || anticipatedEndDate < anticipatedStartDate) {
            console.log(`Skipping record ${idx + 1}: Invalid start/end dates.`, {
                anticipatedStartDate,
                anticipatedEndDate
            });
            return;
        }

        const monthsDiff = (anticipatedEndDate.getFullYear() - anticipatedStartDate.getFullYear()) * 12 +
                           (anticipatedEndDate.getMonth() - anticipatedStartDate.getMonth()) + 1;

        const avgPerMonth = bidValue / monthsDiff;

        for (let i = 0; i < monthsDiff; i++) {
            const monthDate = new Date(anticipatedStartDate.getFullYear(), anticipatedStartDate.getMonth() + i, 1);
            const monthName = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            allMonths.add(monthName);

            if (!revenueByDivision[divisionName]) {
                revenueByDivision[divisionName] = {};
            }

            if (!revenueByDivision[divisionName][monthName]) {
                revenueByDivision[divisionName][monthName] = 0;
            }

            revenueByDivision[divisionName][monthName] += avgPerMonth;
        }
    });

    let sortedMonths = Array.from(allMonths).sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA - dateB;
    });

   // 👉 Filter out past months, only keep current and future months
sortedMonths = sortedMonths.filter(monthName => {
    const [month, year] = monthName.split(' ');
    const monthDate = new Date(`${month} 1, ${year}`);
    monthDate.setHours(0, 0, 0, 0);
    return monthDate >= new Date(today.getFullYear(), today.getMonth(), 1);
});

// 👉 Limit to next six months
sortedMonths = sortedMonths.slice(0, 6);

console.log("Filtered months (next six months):", sortedMonths);


    createRevenueChart(revenueByDivision, sortedMonths);
}



    function createRevenueChart(revenueByDivision, months) {
        const divisions = Object.keys(revenueByDivision);
        const datasets = [];

        const colors = [
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
        ];

        divisions.forEach((division, index) => {
            const data = months.map(month => revenueByDivision[division][month] || 0);

            datasets.push({
                label: division,
                data: data,
                backgroundColor: colors[index % colors.length],
                borderWidth: 1
            });
        });

        const ctx = document.getElementById('expectedRevenueChart').getContext('2d');

        if (expectedRevenueChartInstance !== null) {
            expectedRevenueChartInstance.destroy();
        }

        expectedRevenueChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                stacked: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: ''
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: ''
                        },
                        ticks: {
                            callback: function (value) {
                                return `$${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                return `${tooltipItem.dataset.label}: $${tooltipItem.raw.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }

    const allRecords = await fetchAllData();
    await processRecords(allRecords);

    exportButton.disabled = false;
    exportButton.textContent = "Export";
    exportButton.style.backgroundColor = "";
    exportButton.style.cursor = "";
});
