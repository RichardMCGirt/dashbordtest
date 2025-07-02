console.log("🧪 revision.js loaded");
const airtableApiKey = 'patXTUS9m8os14OO1.6a81b7bc4dd88871072fe71f28b568070cc79035bc988de3d4228d52239c8238';
const airtableBaseId = 'appK9gZS77OmsIK50';
const airtableTableName = 'tblQo2148s04gVPq1';
const airtableView = 'viw6WmfanCTsMU9xA';

async function fetchAirtableData9() {
  console.log("📡 Fetching from Airtable with pagination using specific view...");
  const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
  const headers = {
    Authorization: `Bearer ${airtableApiKey}`
  };

  let allRecords = [];
  let offset = null;

  do {
    const fetchUrl = `${url}?pageSize=100&view=${airtableView}${offset ? `&offset=${offset}` : ''}`;
    console.log("🔗 Fetching URL:", fetchUrl);

    const response = await fetch(fetchUrl, { headers });
    const data = await response.json();

    if (data.records) {
      allRecords.push(...data.records);
    }

    offset = data.offset;
  } while (offset);

  console.log("✅ Total records fetched:", allRecords.length);
  return allRecords;
}

async function createChart() {
    const records = await fetchAirtableData9();
  
    const filtered = records.filter(
      rec => rec.fields["#of Elevations and/or Options"] !== undefined && rec.fields["Estimator formula"]
    );
  
    // Aggregate totals by Estimator formula
    const totalsByEstimator = {};
    for (const rec of filtered) {
      const name = rec.fields["Estimator formula"];
      const value = rec.fields["#of Elevations and/or Options"];
      if (!totalsByEstimator[name]) {
        totalsByEstimator[name] = 0;
      }
      totalsByEstimator[name] += value;
    }
  
// Convert to array and sort by value ascending, then alphabetically if same
const sortedEntries = Object.entries(totalsByEstimator).sort((a, b) => {
    if (a[1] === b[1]) {
      return a[0].localeCompare(b[0]); // Alphabetical tiebreaker
    }
    return a[1] - b[1]; // Numerical ascending
  });
    
    const labels = sortedEntries.map(entry => entry[0]);
    const data = sortedEntries.map(entry => entry[1]);
  
    const ctx = document.getElementById('revisionsChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
            label: '#of Elevations and/or Options',
            data,
            backgroundColor: 'rgba(1, 16, 115, 0.8)',
            borderColor: 'grey',
            borderWidth: 1
          }]          
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        elements: {
          bar: {
            borderWidth: 1,
            hoverBorderWidth: 3,
            hoverBackgroundColor: 'rgba(1, 16, 115, 1)' 
        }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: ''
            },
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return Number.isInteger(value) ? value : null;
              }
            }
          },
          x: {
            title: {
              display: true,
              text: ''
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.y ?? context.parsed}`;
              }
            }
          }
        }
      }
    });
  }
  
createChart();
