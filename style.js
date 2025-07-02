function adjustSections() {
    const chartSections = document.querySelectorAll('.chart-section');
    const canvasElements = document.querySelectorAll('canvas');

    chartSections.forEach(section => {
        const aspectRatio = window.innerWidth > 768 ? 16 / 9 : window.innerWidth > 480 ? 4 / 3 : 1;
        section.style.height = `${section.offsetWidth / aspectRatio}px`;
    });

    canvasElements.forEach(canvas => {
        canvas.style.height = window.innerWidth > 768 ? '400px' : window.innerWidth > 480 ? '300px' : '200px';
    });
}

// Run on resize and load
window.addEventListener('resize', adjustSections);
window.addEventListener('load', adjustSections);
