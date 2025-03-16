const video = document.getElementById("camera");
const captureButton = document.getElementById("capture");
const resultText = document.getElementById("result");

function requestCameraAccess() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Camera access denied:", err);
            resultText.textContent = "Error: Unable to access camera. Please allow permissions.";
        });
}

// Request camera access on page load
requestCameraAccess();

// Function to convert RGB to HSV
function rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0; // No hue
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, v * 100]; // Return HSV with Hue in degrees
}

// Function to analyze multiple pixels from video
function analyzeColor() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const xStart = Math.floor(canvas.width * 0.34);
    const yStart = Math.floor(canvas.height * 0.20);
    const xEnd = xStart + Math.floor(canvas.width * 0.32);
    const yEnd = yStart + Math.floor(canvas.height * 0.60);

    let colors = [];

    // Use a 4x4 grid (16 sample points) for better accuracy
    const gridSize = 4;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            let x = xStart + Math.floor((xEnd - xStart) * (i / (gridSize - 1)));
            let y = yStart + Math.floor((yEnd - yStart) * (j / (gridSize - 1)));
            let pixel = ctx.getImageData(x, y, 1, 1).data;
            let hsv = rgbToHsv(pixel[0], pixel[1], pixel[2]);
            colors.push(hsv);
        }
    }

    // Sort by Hue and take the median color to avoid outliers
    colors.sort((a, b) => a[0] - b[0]);
    let medianIndex = Math.floor(colors.length / 2);
    let medianColor = colors[medianIndex];

    let status = detectSpirulinaHealth(medianColor);
    resultText.textContent = `Status: ${status}`;
}

// Function to determine spirulina health condition based on HSV
function detectSpirulinaHealth(hsv) {
    let [h, s, v] = hsv;

    if (h >= 85 && h <= 150 && s >= 50) {
        return "Healthy!"; // Vibrant green
    } else if (h >= 60 && h < 85 && s >= 40) {
        return "Warning! Culture may be stressed."; // Yellow-green
    } else if (h < 60 || v > 80) {
        return "Culture crash? White/cloudy detected."; // High brightness means dead culture
    } else if (h > 150) {
        return "Time for a new refill!"; // Darker forest green (old spirulina)
    } else {
        return "Unknown Status";
    }
}

// Attach event listener to button
captureButton.addEventListener("click", analyzeColor);
