const video = document.getElementById("camera");
const captureButton = document.getElementById("capture");
const resultText = document.getElementById("result");

// Create loading bar elements
const loadingContainer = document.createElement("div");
const loadingBar = document.createElement("div");

// Style Loading Bar
loadingContainer.style.width = "90%";
loadingContainer.style.maxWidth = "600px";
loadingContainer.style.height = "10px";
loadingContainer.style.backgroundColor = "#ddd";
loadingContainer.style.borderRadius = "5px";
loadingContainer.style.margin = "10px auto";
loadingContainer.style.display = "none"; // Hidden initially
loadingContainer.style.overflow = "hidden";
loadingContainer.style.position = "relative";

loadingBar.style.width = "0%";
loadingBar.style.height = "100%";
loadingBar.style.backgroundColor = "#27ae60";
loadingBar.style.transition = "width 0.1s linear";

loadingContainer.appendChild(loadingBar);
document.body.insertBefore(loadingContainer, resultText);

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

// Define trained RGB thresholds
const colorThresholds = {
    "White/Cloudy (Crash)": { min: [230, 230, 230], max: [255, 255, 255] },
    "Healthy Green": { min: [30, 175, 54], max: [100, 249, 179] },
    "Yellow-Stressed": { min: [45, 226, 0], max: [245, 247, 100] },
    "Mature Green": { min: [12, 156, 54], max: [50, 169, 80] },
};

// Function to check if a color is within a given threshold
function isWithinRange(color, range) {
    return (
        color[0] >= range.min[0] && color[0] <= range.max[0] &&
        color[1] >= range.min[1] && color[1] <= range.max[1] &&
        color[2] >= range.min[2] && color[2] <= range.max[2]
    );
}

// Function to start the loading animation
function startLoading(callback) {
    let duration = Math.random() * (500 - 250) + 250; // Random time between 0.25s and 0.5s
    loadingContainer.style.display = "block";
    loadingBar.style.width = "0%";
    captureButton.disabled = true; // Disable button during processing

    let interval = setInterval(() => {
        let progress = parseInt(loadingBar.style.width) || 0;
        if (progress < 100) {
            loadingBar.style.width = (progress + 10) + "%";
        } else {
            clearInterval(interval);
        }
    }, duration / 10);

    setTimeout(() => {
        loadingContainer.style.display = "none"; // Hide loading bar
        captureButton.disabled = false; // Re-enable button
        callback(); // Call the actual analysis function
    }, duration);
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

    // Determine spirulina health based on thresholds
    let status = "Unknown Status";
    for (const [category, range] of Object.entries(colorThresholds)) {
        if (isWithinRange(medianRGB, range)) {
            status = category;
            break;
        }
    }

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

// Attach event listener to button with loading animation
captureButton.addEventListener("click", () => startLoading(analyzeColor));

