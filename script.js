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

    // Define the overlay region (centered rectangle)
    // Define the overlay region (7.5:4 aspect ratio)
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

    // Determine status based on color
    let status = "Unknown";
    for (let color of colorResults) {
        if (isWithinRange(color, { min: [0, 50, 0], max: [30, 120, 30] })) {
            status = "Time for a new refill!";
            break;
        } else if (isWithinRange(color, { min: [30, 80, 30], max: [100, 255, 100] })) {
            status = "Healthy!";
        } else if (isWithinRange(color, { min: [150, 150, 0], max: [255, 255, 100] })) {
            status = "Warning! Culture may be struggling.";
        } else if (isWithinRange(color, { min: [200, 200, 200], max: [255, 255, 255] })) {
            status = "Culture crashed! White/cloudy detected.";
            break;
        }
    }

    resultText.textContent = `Status: ${status}`;
}

// Attach event listener to button
captureButton.addEventListener("click", analyzeColor);

// Function to check if color is within range
function isWithinRange(color, range) {
    return (
        color[0] >= range.min[0] && color[0] <= range.max[0] &&
        color[1] >= range.min[1] && color[1] <= range.max[1] &&
        color[2] >= range.min[2] && color[2] <= range.max[2]
    );
}
