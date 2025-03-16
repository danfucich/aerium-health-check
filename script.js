const video = document.getElementById("camera");
const captureButton = document.getElementById("capture");
const resultText = document.getElementById("result");

// Define trained RGB thresholds with adjusted ranges
const colorThresholds = {
    "White/Cloudy (Crash)": { min: [220, 220, 220], max: [255, 255, 255] },
    "Healthy Green": { min: [20, 150, 40], max: [110, 255, 180] },
    "Yellow-Stressed": { min: [100, 200, 0], max: [255, 255, 120] },
    "Mature Green": { min: [10, 140, 50], max: [70, 190, 100] },
};

// Define messages for each category
const statusMessages = {
    "White/Cloudy (Crash)": "⚠️ Culture crash detected! White/cloudy appearance indicates a dead or contaminated culture.",
    "Healthy Green": "✅ Your spirulina is healthy! Keep maintaining the current conditions.",
    "Yellow-Stressed": "⚠️ Warning! Your culture may be stressed. Check nutrients, light, and temperature levels.",
    "Mature Green": "🔄 Time for a refill! The culture is mature and should be refreshed soon.",
    "Unknown Status": "❓ Unidentified color. Ensure proper lighting and check for contamination.",
};

// Function to check if a color is within a given threshold
function isWithinRange(color, range) {
    return (
        color[0] >= range.min[0] && color[0] <= range.max[0] &&
        color[1] >= range.min[1] && color[1] <= range.max[1] &&
        color[2] >= range.min[2] && color[2] <= range.max[2]
    );
}

// Function to analyze colors from the video feed
function analyzeColor() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Define the overlay region (7.5:4 aspect ratio)
    const xStart = Math.floor(canvas.width * 0.34);
    const yStart = Math.floor(canvas.height * 0.20);
    const xEnd = xStart + Math.floor(canvas.width * 0.32);
    const yEnd = yStart + Math.floor(canvas.height * 0.60);

    let colors = [];

    // Use a 4x4 grid (16 points)
    const gridSize = 4;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            let x = xStart + Math.floor((xEnd - xStart) * (i / (gridSize - 1)));
            let y = yStart + Math.floor((yEnd - yStart) * (j / (gridSize - 1)));
            let pixel = ctx.getImageData(x, y, 1, 1).data;
            colors.push([pixel[0], pixel[1], pixel[2]]);
        }
    }

    // Compute median RGB values to avoid outliers
    let medianRGB = getMedianRGB(colors);

    // **Updated Classification Logic**
    let status = "Unknown Status"; // Default fallback
    for (const [category, range] of Object.entries(colorThresholds)) {
        if (isWithinRange(medianRGB, range)) {
            status = category;
            break;
        }
    }

    // **Display Message Based on Detection**
    resultText.textContent = `Status: ${statusMessages[status]}`;
}

// Function to get median RGB value (more stable than average)
function getMedianRGB(colors) {
    let sortedR = colors.map(c => c[0]).sort((a, b) => a - b);
    let sortedG = colors.map(c => c[1]).sort((a, b) => a - b);
    let sortedB = colors.map(c => c[2]).sort((a, b) => a - b);

    let mid = Math.floor(colors.length / 2);
    return [sortedR[mid], sortedG[mid], sortedB[mid]];
}

// Attach event listener to button
captureButton.addEventListener("click", analyzeColor);
