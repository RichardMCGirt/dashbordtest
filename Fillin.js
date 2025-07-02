document.addEventListener('DOMContentLoaded', async function () {

    const airtableApiKey = 'patTGK9HVgF4n1zqK.cbc0a103ecf709818f4cd9a37e18ff5f68c7c17f893085497663b12f2c600054';
    const airtableBaseId = 'appeNSp44fJ8QYeY5';
    const airtableTableName = 'tblRp5bukUiw9tX9j';
    const exportButton = document.getElementById('export-button2');
    const dropdown = document.getElementById('branch-dropdown');
    const totalCostDisplay = document.getElementById('total-cost-display');
    let chartInstance = null;

    async function fetchData(offset = null) {
        const now = new Date();
        const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));
        const isoDate = lastYear.toISOString(); // e.g., "2024-05-19T14:00:00.000Z"
    
        const filterFormula = `filterByFormula=IS_AFTER({Created}, "${isoDate}")`;
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?pageSize=100&${filterFormula}`;
        if (offset) url += `&offset=${offset}`;
    
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
    
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data from Airtable:', error);
            return { records: [] };
        }
    }
    

    async function fetchAllData() {
        let allRecords = [];
        let offset = null;
    
        // Get the container element to display real-time updates
        const liveUpdateContainer = document.getElementById('live-update-container');
        if (liveUpdateContainer) liveUpdateContainer.innerHTML = ''; // Clear previous updates if any
    
        do {
            const data = await fetchData(offset);
            allRecords = allRecords.concat(data.records);
            
            // Log and display the number of records fetched so far
            
            // Update the container with the latest count (overwrite content)
            if (liveUpdateContainer) {
                liveUpdateContainer.innerHTML = `Fetched ${allRecords.length} records so far...`;
            }
    
            offset = data.offset; // Update the offset for the next batch
        } while (offset);
    
    
        // Final update to indicate completion
        if (liveUpdateContainer) {
            liveUpdateContainer.innerHTML = `Total records: ${allRecords.length}`;
        }
    
        return allRecords;
    }
    
    

    function populateDropdown(records) {
        const uniqueBranches = [...new Set(records.map(record => record.fields['VanirOffice']).filter(Boolean))];

        uniqueBranches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch;
            option.textContent = branch;
            dropdown.appendChild(option);
        });

        // Default to "Raleigh" if it exists in the data
        if (uniqueBranches.includes("Raleigh")) {
            dropdown.value = "Raleigh";
        }

    }

    function calculateTotalCostForBranch(records, branch) {
        const totalCost = records
            .filter(record => record.fields['VanirOffice'] === branch)
            .reduce((sum, record) => sum + (parseFloat(record.fields['Total Cost of Fill In']) || 0), 0);

        return totalCost;
    }

    function createBarChart(records, branch) {

        const branchRecords = records.filter(record => record.fields['VanirOffice'] === branch);
        const branchMonthlySums = {};
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        
        branchRecords.forEach(record => {
            const cost = parseFloat(record.fields['Total Cost of Fill In']) || 0;
            const dateCreated = record.fields['Date Created'];

            const date = new Date(dateCreated);
            if (isNaN(date.getTime())) {
                console.warn(`Invalid or missing date encountered: ${dateCreated}`);
                return;
            }

            const monthName = monthNames[date.getMonth()];
            const year = date.getFullYear();
            const monthYear = `${monthName} ${year}`;

            if (!branchMonthlySums[monthYear]) {
                branchMonthlySums[monthYear] = 0;
            }
            branchMonthlySums[monthYear] += cost;
        });

        const months = Object.keys(branchMonthlySums).sort((a, b) => new Date(a) - new Date(b));
        const data = months.map(month => branchMonthlySums[month] || 0);

        // Destroy the existing chart instance if it exists
        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = document.getElementById('fillInChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: branch,
                    data,
                    backgroundColor: 'rgba(2, 20, 104, 0.8)',
                    borderColor: 'rgba(2, 20, 104, 0.8)',
                    borderWidth: 1,
                }]
            },
            options: {
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: ''
                        }
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Total Cost ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return `$${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return `$${tooltipItem.raw.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });

    }

   
    
    // Fetch data and populate dropdown
    const allRecords = await fetchAllData();
    populateDropdown(allRecords);

   

    // Default chart and total cost display for "Raleigh"
    const defaultBranch = "Raleigh";
    if (allRecords.some(record => record.fields['VanirOffice'] === defaultBranch)) {
        const totalCost = calculateTotalCostForBranch(allRecords, defaultBranch);
        totalCostDisplay.textContent = `Total Cost for ${defaultBranch}: $${totalCost.toLocaleString()}`;
        createBarChart(allRecords, defaultBranch);
    }

    dropdown.addEventListener('change', function () {
        const selectedBranch = dropdown.value;
        
        // Calculate and display total cost for the selected branch
        const totalCost = calculateTotalCostForBranch(allRecords, selectedBranch);
        totalCostDisplay.textContent = `Total Cost for ${selectedBranch}: $${totalCost.toLocaleString()}`;

        // Create chart for the selected branch
        createBarChart(allRecords, selectedBranch);
    });

});
