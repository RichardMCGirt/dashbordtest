const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD

const filterFormula = `AND(
    {Activity} = "In Person",
    {Created} >= DATEADD(TODAY(), -90, 'days')
)`;

// Fetch Airtable Data with Logs
async function fetchAirtableData(apiKey, baseId, tableName, formula) {
    try {
        console.log(`Fetching Airtable data from Base: ${baseId}, Table: ${tableName}`);
        console.log(`Filter Formula: ${formula}`);

        let allRecords = [];
        let offset;
        const encodedFormula = encodeURIComponent(formula);

        do {
            const url = `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula=${encodedFormula}${
                offset ? `&offset=${offset}` : ''
            }`;
            console.log(`Requesting URL: ${url}`);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Airtable API Error:", errorText);
                throw new Error(`Airtable API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Fetched ${data.records.length} records. Offset: ${data.offset || 'None'}`);

            allRecords = allRecords.concat(data.records);
            offset = data.offset;

        } while (offset);

        console.log(`Total records fetched: ${allRecords.length}`);
        return allRecords;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

// Aggregate Activity Counts by 'Submitted By'
function aggregateBySubmittedBy(records) {
    const data = {};

    records.forEach(record => {
        const submittedBy = record.fields['Submitted By'] ? record.fields['Submitted By'].trim() : 'Unknown';

        if (!data[submittedBy]) {
            data[submittedBy] = { totalCount: 0 };
        }

        data[submittedBy].totalCount += 1;
    });

    return data;
}

// Populate Dropdown
function populateDropdown10(users, dropdownId, userActivityCounts) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.error(`Dropdown with ID '${dropdownId}' not found.`);
        return;
    }

    dropdown.innerHTML = '<option value="all">All Submitters</option>';

    const validUsers = users
        .filter(user => user.trim().toLowerCase() !== 'unknown') // Exclude "Unknown"
        .map(user => user.trim())
        .sort((a, b) => a.localeCompare(b));

    validUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = `${user}`;
        dropdown.appendChild(option);
    });

    dropdown.addEventListener('change', event => {
        const selectedUser = event.target.value.trim();

        const filteredData =
            selectedUser === 'all'
                ? userActivityCounts
                : userActivityCounts[selectedUser]
                ? { [selectedUser]: userActivityCounts[selectedUser] }
                : {};

        displayActivityCountsAsBarChart(filteredData, 'activity-chart');
    });
}

function displayActivityCountsAsBarChart(data, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID '${canvasId}' not found.`);
        return;
    }

    const ctx = canvas.getContext('2d');

    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    // Filter out "Unknown" values and sort data by total count (ascending order)
    let validData = Object.entries(data)
        .filter(([key, value]) => key !== "Unknown" && value.totalCount !== undefined)
        .sort((a, b) => a[1].totalCount - b[1].totalCount); // Ascending order

    if (!validData.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("No data available for the selected user.", canvas.width / 2, canvas.height / 2);
        return;
    }

    // Find the minimum value
    const minValue = validData[0][1].totalCount;

   // Ensure we don't remove valid data unnecessarily
if (validData.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No data available for the selected user.", canvas.width / 2, canvas.height / 2);
    return;
}

    const labels = validData.map(([key]) => key); // Names of users
    const totalCounts = validData.map(([_, value]) => value.totalCount); // Activity counts per user

    canvas.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'In-Person Meetings',
                data: totalCounts,
                backgroundColor: 'rgba(173, 13, 28, 0.8)',
                borderColor: 'rgba(173, 13, 28, 0.8)',
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: true } },
        },
    });
}

// Main Initialization Function
async function initializeApp() {

    displayLoadingMessages("Loading data, please wait...");

    const airtableApiKey = 'pat1Eu3iQYHDmLSWr.ecfb8470f9c2b8409a0017e65f5b8cf626208e4df1a06905a41019cb38a8534b';
    const airtableBaseId = 'appX1Saz7wMYh4hhm';
    const airtableTableName = 'tbl4CTO6s1j7kz06k';

    const records = await fetchAirtableData(airtableApiKey, airtableBaseId, airtableTableName, filterFormula);
    
   

    const userActivityCounts = aggregateBySubmittedBy(records);

    const sortedUsers = Object.keys(userActivityCounts).sort();
    populateDropdown10(sortedUsers, 'user-filter9', userActivityCounts);


    displayActivityCountsAsBarChart(userActivityCounts, 'activity-chart');

   
    hideLoadingMessages();
}

// Loading Messages
function hideLoadingMessages() {
    const fetchProgress = document.getElementById('fetch-progress');
    if (fetchProgress) fetchProgress.style.display = 'none';
}

function displayLoadingMessages(message) {
    const fetchProgress = document.getElementById('fetch-progress');
    if (fetchProgress) {
        fetchProgress.textContent = message;
        fetchProgress.style.display = 'block';
    }
}

// Run the initialization
document.addEventListener('DOMContentLoaded', initializeApp);
