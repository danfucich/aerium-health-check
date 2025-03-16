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

// Define RGB thresholds (Basic Method)
const colorThresholds = {
    "White/Cloudy (Crash)": { min: [220, 220, 220], max: [255, 255, 255] },
    "Healthy Green": { min: [30, 150, 40], max: [110, 255, 180] },
    "Yellow-Stressed": { min: [100, 200, 0], max: [255, 255, 120] },
    "Mature Green": { min: [10, 140, 50], max: [70, 190, 100] },
};

// Output messages
const outputMessages = {
    "White/Cloudy (Crash)": "⚠️ Possible culture crash! White/cloudy detected.",
    "Healthy Green": "✅ Culture is healthy and thriving!",
    "Yellow-Stressed": "⚠️ Warning! Culture may be stressed.",
    "Mature Green": "🔄 Mature culture. Time for a change soon.",
    "Unknown Status": "❓ Unable to determine culture status."
};

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

// Function to check if a color is within a given threshold
function isWithinRange(color, range) {
    return (
        color[0] >= range.min[0] && color[0] <= range.max[0] &&
        color[1] >= range.min[1] && color[1] <= range.max[1] &&
        color[2] >= range.min[2] && color[2] <= range.max[2]
    );
}

// Function to analyze a single random pixel from the video feed (Basic RGB Detection)
function analyzeColor() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Pick a single random pixel from the center area
    const x = Math.floor(canvas.width * 0.5);
    const y = Math.floor(canvas.height * 0.5);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    
    // Determine spirulina health based on thresholds
    let status = "Unknown Status";
    for (const [category, range] of Object.entries(colorThresholds)) {
        if (isWithinRange(pixel, range)) {
            status = category;
            break;
        }
    }

    // Display the corresponding message
    resultText.textContent = outputMessages[status];
}

// Attach event listener to button with loading animation
captureButton.addEventListener("click", () => startLoading(analyzeColor));
