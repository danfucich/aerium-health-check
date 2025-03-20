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
loadingBar.style.backgroundColor = "#27ae60"; // Green loading bar
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

    let statusCounts = {
        "Time for a new refill!": 0,
        "Healthy!": 0,
        "Warning! Culture may be stressed.": 0,
        "Culture crash? White/cloudy detected.": 0,
        "No aerium detected": 0
    };

    let detectedColors = [];

    // Sample 13 random points
    for (let i = 0; i < 13; i++) {
        let x = Math.floor(Math.random() * (xEnd - xStart) + xStart);
        let y = Math.floor(Math.random() * (yEnd - yStart) + yStart);
        let pixel = ctx.getImageData(x, y, 1, 1).data;
        let colorName = classifyColor(pixel[0], pixel[1], pixel[2]);
        detectedColors.push(colorName);

        if (isWithinRange(pixel, { min: [0, 50, 0], max: [30, 140, 30] })) {
            statusCounts["Time for a new refill!"]++;
        } else if (isWithinRange(pixel, { min: [50, 100, 50], max: [120, 255, 120] })) {
            statusCounts["Healthy!"]++;
        } else if (isWithinRange(pixel, { min: [160, 100, 0], max: [255, 200, 120] })) {
            statusCounts["Warning! Culture may be stressed."]++;
        } else if (isWithinRange(pixel, { min: [230, 230, 230], max: [255, 255, 255] })) {
            statusCounts["Culture crash? White/cloudy detected."]++;
        }
    }

    let mostCommonColor = detectedColors.sort((a,b) =>
        detectedColors.filter(v => v===a).length - detectedColors.filter(v => v===b).length
    ).pop();

    if (mostCommonColor && !statusCounts["Time for a new refill!"] &&
        !statusCounts["Healthy!"] && !statusCounts["Warning! Culture may be stressed."] &&
        !statusCounts["Culture crash? White/cloudy detected."]) {
        resultText.textContent = `No aerium detected: ${mostCommonColor}`;
    } else {
        let status = Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);
        resultText.textContent = `Status: ${status}`;
    }
}

// Function to classify colors into readable names
function classifyColor(r, g, b) {
    if (r > 150 && g < 100 && b < 100) return "Red";
    if (b > 150 && r < 100 && g < 100) return "Blue";
    if (r > 100 && b > 100 && g < 100) return "Purple";
    if (r < 50 && g < 50 && b < 50) return "Black";
    if (g > 150 && r < 100 && b < 100) return "Green";
    if (r > 150 && g > 150 && b < 100) return "Yellow";
    if (r > 180 && g > 100 && b < 80) return "Orange";
    if (r > 200 && g > 200 && b > 200) return "White";
    return "Unknown";
}

// Attach event listener to button with loading animation
captureButton.addEventListener("click", () => startLoading(analyzeColor));
