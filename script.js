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
    let duration = Math.random() * (500 - 250) + 250; // Random time between 0.25s and 0.5s
    loadingContainer.style.display = "block";
    loadingBar.style.width = "0%";
    captureButton.disabled = true; // Disable button during processing

    let interval = setInterval(() => {
        let progress = parseInt(loadingBar.style.width) || 0;
        if (progress < 100) {
            loadingBar.style.width = (progress + 20) + "%"; // Faster progress since delay is short
        } else {
            clearInterval(interval);
        }
    }, duration / 5);

    setTimeout(() => {
        loadingContainer.style.display = "none"; // Hide loading bar
        captureButton.disabled = false; // Re-enable button
        callback(); // Call the actual analysis function
    }, duration);
}

let statusCounts = {
        "Time for a new refill!": 0,
        "Healthy!": 0,
        "Warning! Culture may be stressed.": 0,
        "Culture crash? White/cloudy detected.": 0
    };

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

    function updateStatus() {
    let highestCategory = Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);

    if (statusCounts[highestCategory] === 0) {
        resultText.textContent = "Status: No valid reading detected.";
    } else {
        resultText.textContent = `Status: ${highestCategory}`;
    }
}

    // Sample 13 random points
    for (let i = 0; i < 13; i++) {
        let x = Math.floor(Math.random() * (xEnd - xStart) + xStart);
        let y = Math.floor(Math.random() * (yEnd - yStart) + yStart);
        let pixel = ctx.getImageData(x, y, 1, 1).data;

        if (isWithinRange(pixel, { min: [0, 50, 0], max: [30, 140, 30] })) {
            statusCounts["Time for a new refill!"]++;
        } else if (isWithinRange(pixel, { min: [50, 100, 50], max: [120, 255, 120] })) {
            statusCounts["Healthy!"]++;
        } else if (isWithinRange(pixel, { min: [160, 120, 0], max: [255, 180, 120] })) {  
            // Expanded Orange detection
            statusCounts["Warning! Culture may be stressed."]++;
        } else if (isWithinRange(pixel, { min: [230, 230, 230], max: [255, 255, 255] })) {
            statusCounts["Culture crash? White/cloudy detected."]++;
        } else if (r > 150 && g < 100 && b < 100) {  
            statusCounts["No aerium detected: Red"]++;  
        } else if (b > 150 && r < 100 && g < 100) {  
            statusCounts["No aerium detected: Blue"]++;  
        } else if (r > 120 && b > 120 && g < 90) {  
            statusCounts["No aerium detected: Purple"]++;  
        } else if (r < 50 && g < 50 && b < 50) {  
            // New Black Detection
            statusCounts["No aerium detected: Black"]++;
        }
    }

    // Select the most frequently detected status
    let highestCategory = Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);

if (statusCounts[highestCategory] === 0) {
    resultText.textContent = "Status: No valid reading detected.";
} else {
    resultText.textContent = `Status: ${highestCategory}`;
}
    
}

// Attach event listener to button with loading animation
captureButton.addEventListener("click", function() {
    resultText.textContent = "Analyzing..."; // Show loading status
    startLoading(() => {
        analyzeColor(); // Run the analysis
        setTimeout(() => {
            updateStatus(); // Ensure status updates after analysis
        }, 50); // Small delay to allow update
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
resultText.style.top = "25%"; // Move the status above the overlay
resultText.style.left = "50%";
resultText.style.transform = "translateX(-50%)";
resultText.style.background = "rgba(255, 255, 255, 0.8)";
resultText.style.padding = "5px 10px";
resultText.style.borderRadius = "8px";
resultText.style.zIndex = "10"; // Ensures it stays above the video

captureButton.style.position = "absolute";
captureButton.style.bottom = "5%";
captureButton.style.left = "50%";
captureButton.style.transform = "translateX(-50%)";
captureButton.style.width = "90%";
captureButton.style.fontSize = "16px";
captureButton.style.padding = "10px";
captureButton.style.zIndex = "10"; // Ensures it stays above the video
