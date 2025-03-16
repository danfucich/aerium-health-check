const video = document.getElementById("camera");
const captureButton = document.getElementById("capture");
const resultText = document.getElementById("result");

// Function to request camera access
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

    // Use a 4x4 grid (16 points) instead of just 3 random points
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

    // Determine spirulina health based on improved green detection
    let status = detectSpirulinaHealth(medianRGB);
    resultText.textContent = `Status: ${status}`;
}

// Function to get median RGB value (more stable than average)
function getMedianRGB(colors) {
    let sortedR = colors.map(c => c[0]).sort((a, b) => a - b);
    let sortedG = colors.map(c => c[1]).sort((a, b) => a - b);
    let sortedB = colors.map(c => c[2]).sort((a, b) => a - b);

    let mid = Math.floor(colors.length / 2);
    return [sortedR[mid], sortedG[mid], sortedB[mid]];
}

// Function to determine spirulina health based on improved RGB sensing
function detectSpirulinaHealth(rgb) {
    let [r, g, b] = rgb;
    let greenRatio = g / (r + g + b); // Normalize green intensity

    if (greenRatio > 0.45 && g > 80) {
        return "Healthy!"; // Bright green, strong culture
    } else if (greenRatio > 0.35 && g > 60) {
        return "Warning! Culture may be stressed"; // Less green, more yellowish
    } else if (r > 180 && g > 180 && b > 180) {
        return "Culture crash? White/cloudy detected"; // High brightness = dead culture
    } else if (greenRatio < 0.3) {
        return "Time for a new refill!"; // Dark or brownish culture
    } else {
        return "Unknown Status";
    }
}

// Attach event listener to button
captureButton.addEventListener("click", analyzeColor);
