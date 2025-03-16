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

    // Use a 4x4 grid (16 sample points)
    const gridSize = 4;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            let x = xStart + Math.floor((xEnd - xStart) * (i / (gridSize - 1)));
            let y = yStart + Math.floor((yEnd - yStart) * (j / (gridSize - 1)));
            let pixel = ctx.getImageData(x, y, 1, 1).data;
            colors.push([pixel[0], pixel[1], pixel[2]]);
        }
    }

    // Compute average RGB values
    let avgRGB = colors.reduce(
        (acc, color) => {
            acc[0] += color[0];
            acc[1] += color[1];
            acc[2] += color[2];
            return acc;
        },
        [0, 0, 0]
    ).map(val => val / colors.length);

    let status = detectSpirulinaHealth(avgRGB);
    resultText.textContent = `Status: ${status}`;
}

// **New Function: Normalize Green Ratio**
function greenRatio(r, g, b) {
    let total = r + g + b;
    return total === 0 ? 0 : g / total; // Avoid division by zero
}

// **Improved Spirulina Health Detection**
function detectSpirulinaHealth(rgb) {
    let [r, g, b] = rgb;
    let gRatio = greenRatio(r, g, b); // Get how green-dominant the sample is

    if (gRatio > 0.45 && g > 80) {
        return "Healthy!"; // Bright green, strong culture
    } else if (gRatio > 0.35 && g > 60) {
        return "Warning! Culture may be struggling."; // Less green, more yellow
    } else if (r > 180 && g > 180 && b > 180) {
        return "Culture crashed! White/cloudy detected."; // High brightness = dead
    } else if (gRatio < 0.3) {
        return "Time for a new refill!"; // Dark or brownish culture
    } else {
        return "Unknown Status";
    }
}

// Attach event listener to button
captureButton.addEventListener("click", analyzeColor);
