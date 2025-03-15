const video = document.getElementById("camera");
const captureButton = document.getElementById("capture");
const resultText = document.getElementById("result");
const loadingContainer = document.getElementById("loading-container");
const loadingBar = document.getElementById("loading-bar");

// Create a retry button (hidden by default)
const retryButton = document.createElement("button");
retryButton.textContent = "Retry Camera Access";
retryButton.classList.add("retry-btn");
retryButton.style.display = "none";
retryButton.onclick = requestCameraAccess;
document.body.appendChild(retryButton);

// Function to request camera access
function requestCameraAccess() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            video.srcObject = stream;
            retryButton.style.display = "none"; // Hide retry button if successful
        })
        .catch(err => {
            console.error("Camera access denied:", err);
            resultText.textContent = "Error: Unable to access camera. Please allow permissions.";
            retryButton.style.display = "block"; // Show retry button
        });
}

// Initial attempt to get camera access
requestCameraAccess();

// Capture and analyze pixels
captureButton.addEventListener("click", function() {
    // Show loading bar with random duration between 2-4 seconds
    let duration = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
    loadingContainer.style.display = "block";
    loadingBar.style.width = "0%";

    let interval = setInterval(() => {
        let progress = parseInt(loadingBar.style.width) || 0;
        if (progress < 100) {
            loadingBar.style.width = (progress + 5) + "%";
        } else {
            clearInterval(interval);
        }
    }, duration / 20);

    setTimeout(() => {
        loadingContainer.style.display = "none"; // Hide loading bar
        analyzeColor();
    }, duration);
});

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

    let colorResults = [];
    for (let i = 0; i < 3; i++) {
        let x = Math.floor(Math.random() * (xEnd - xStart) + xStart);
        let y = Math.floor(Math.random() * (yEnd - yStart) + yStart);
        let pixel = ctx.getImageData(x, y, 1, 1).data;
        colorResults.push([pixel[0], pixel[1], pixel[2]]);
    }

    let status = "Unknown";
    for (let color of colorResults) {
        if (isWithinRange(color, thresholds.darkGreen)) {
            status = "Time for a new refill!";
            break;
        } else if (isWithinRange(color, thresholds.green)) {
            status = "Healthy!";
        } else if (isWithinRange(color, thresholds.yellow)) {
            status = "Warning! Culture may be struggling.";
        } else if (isWithinRange(color, thresholds.white)) {
            status = "Culture crashed! White/cloudy detected.";
            break;
        }
    }

    resultText.textContent = `Status: ${status}`;
}

// Function to check if color is within range
function isWithinRange(color, range) {
    return (
        color[0] >= range.min[0] && color[0] <= range.max[0] &&
        color[1] >= range.min[1] && color[1] <= range.max[1] &&
        color[2] >= range.min[2] && color[2] <= range.max[2]
    );
}

