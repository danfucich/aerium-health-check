const video = document.getElementById("camera");
const captureButton = document.getElementById("capture");
const resultText = document.getElementById("result");
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

// Function to start the loading animation
function startLoading(callback) {
    let duration = Math.random() * (4000 - 500) + 500; // Random time between 0.5s and 4s
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
        callback(); // Call the actual analysis function
    }, duration);
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

// Function to determine spirulina health condition based on RGB
function detectSpirulinaHealth(rgb) {
    let [r, g, b] = rgb;

    if (g > r && g > b && g > 100) {
        return "Healthy!"; // Strong green
    } else if (g > r && g > b && g >= 60 && g <= 100) {
        return "Warning! Culture may be struggling."; // Yellow-green, losing vibrancy
    } else if (r >= 200 && g >= 200 && b >= 200) {
        return "Culture crashed! White/cloudy detected."; // Dead culture
    } else if (g < r || g < b) {
        return "Time for a new refill!"; // Older culture, turning brownish or dark
    } else {
        return "Unknown Status";
    }
}

// Attach event listener to button
captureButton.addEventListener("click", () => startLoading(analyzeColor));
