// colorpicker.js

export function setupChartColor(chartId, chartInstance) {
    const pickerId = `color-picker-${chartId}`;
    let picker = document.getElementById(pickerId);

    if (!picker) {
        // Create and insert color picker if not present in HTML
        const canvas = document.getElementById(chartId);
        if (!canvas) return;

        picker = document.createElement("input");
        picker.type = "color";
        picker.id = pickerId;
        picker.style.margin = "10px 0";

        const label = document.createElement("label");
        label.htmlFor = pickerId;
        label.textContent = "🎨 Chart Color: ";
        label.style.marginRight = "8px";

        canvas.parentNode.insertBefore(label, canvas);
        canvas.parentNode.insertBefore(picker, canvas);
    }

    // Load saved color if it exists
    const savedColor = localStorage.getItem(`color-${chartId}`);
    if (savedColor) {
        picker.value = savedColor;
        updateChartColor(chartInstance, savedColor);
    }

    // Event listener for color changes
    picker.addEventListener("input", (e) => {
        const newColor = e.target.value;
        localStorage.setItem(`color-${chartId}`, newColor);
        updateChartColor(chartInstance, newColor);
    });
}

function updateChartColor(chartInstance, color) {
    if (
        chartInstance &&
        chartInstance.data &&
        chartInstance.data.datasets &&
        chartInstance.data.datasets.length
    ) {
        chartInstance.data.datasets.forEach(ds => {
            ds.backgroundColor = color;
            if (ds.borderColor) ds.borderColor = color;
        });
        chartInstance.update();
    }
}
