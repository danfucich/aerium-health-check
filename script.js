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

// Function to start the loading animation
function startLoading(callback) {
    let duration = Math.random() * (500 - 250) + 250; // Random between 0.25s and 0.5s

    // Make sure the loading bar is visible
    loadingContainer.style.opacity = "1"; 
    loadingBar.style.width = "0%"; // Reset width

    captureButton.disabled = true; // Disable button during processing

    let interval = setInterval(() => {
        let progress = parseInt(loadingBar.style.width) || 0;
        if (progress < 100) {
            loadingBar.style.width = (progress + 20) + "%"; // Smooth progress
        } else {
            clearInterval(interval);
        }
    }, duration / 5);

    setTimeout(() => {
        loadingBar.style.width = "100%"; // Ensure full width before fading out
        setTimeout(() => {
            loadingContainer.style.opacity = "0"; // Fade out
            captureButton.disabled = false; // Re-enable button
            callback(); // Call the analysis function
        }, 300); // Small delay for fade-out
    }, duration);
}
// Function to analyze colors from the video feed and return a status
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
        "No aerium detected: Red": 0,
        "No aerium detected: Blue": 0,
        "No aerium detected: Purple": 0,
        "No aerium detected: Black": 0
    };

    // Sample 13 random points
    for (let i = 0; i < 13; i++) {
        let x = Math.floor(Math.random() * (xEnd - xStart) + xStart);
        let y = Math.floor(Math.random() * (yEnd - yStart) + yStart);
        let pixel = ctx.getImageData(x, y, 1, 1).data;
        let [r, g, b] = pixel; // Extract RGB values

        if (isWithinRange(pixel, { min: [0, 50, 0], max: [30, 140, 30] })) {
            statusCounts["Time for a new refill!"]++;
        } else if (isWithinRange(pixel, { min: [40, 90, 40], max: [120, 255, 120] })) {
            statusCounts["Healthy!"]++;
        } else if (isWithinRange(pixel, { min: [140, 100, 0], max: [255, 200, 120] })) {
            statusCounts["Warning! Culture may be stressed."]++;
        } else if (isWithinRange(pixel, { min: [230, 230, 230], max: [255, 255, 255] })) {
            statusCounts["Culture crash? White/cloudy detected."]++;
        } else if (r > 150 && g < 100 && b < 100) {  
            statusCounts["No aerium detected: Red"]++;  
        } else if (b > 150 && r < 100 && g < 100) {  
            statusCounts["No aerium detected: Blue"]++;  
        } else if (r > 120 && b > 120 && g < 90) {  
            statusCounts["No aerium detected: Purple"]++;  
        } else if (r < 35 && g < 35 && b < 35) {  
            statusCounts["No aerium detected: Black"]++;
        } else if (r < 40 && g > 50 && g < 110 && b < 40) {  
            // NEW: Dark green (mature algae) detection!
            statusCounts["Mature algae detected: Time to Change!"]++;
        }
    }

    // Select the most frequently detected status
    let highestCategory = Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);

    return statusCounts[highestCategory] === 0 ? "No valid reading detected." : highestCategory;
}

// Attach event listener to button with loading animation
captureButton.addEventListener("click", () => startLoading(analyzeColor));
    resultText.textContent = "Analyzing..."; // Show loading status
    startLoading(() => {
        let status = analyzeColor(); // Get status from analyzeColor()
        resultText.textContent = `Status: ${status}`; // Update after analysis
    });
});

// Function to check if color is within range
function isWithinRange(color, range) {
    return (
        color[0] >= range.min[0] && color[0] <= range.max[0] &&
        color[1] >= range.min[1] && color[1] <= range.max[1] &&
        color[2] >= range.min[2] && color[2] <= range.max[2]
    );
}

// Move analyze button and status inside video container
resultText.style.position = "absolute";
resultText.style.top = "30%"; // Move the status above the overlay
resultText.style.left = "50%";
resultText.style.transform = "translateX(-50%)";
resultText.style.background = "rgba(255, 255, 255, 0.8)";
resultText.style.padding = "5px 10px";
resultText.style.borderRadius = "8px";
resultText.style.zIndex = "10"; // Ensures it stays above the video

captureButton.style.position = "absolute";
captureButton.style.bottom = "2%";
captureButton.style.left = "50%";
captureButton.style.transform = "translateX(-50%)";
captureButton.style.width = "90%";
captureButton.style.fontSize = "16px";
captureButton.style.padding = "10px";
captureButton.style.zIndex = "10"; // Ensures it stays above the video
