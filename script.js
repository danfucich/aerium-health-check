const video = document.getElementById("camera");
const overlay = document.getElementById("overlay");
const captureButton = document.getElementById("capture");
const resultText = document.getElementById("result");

// Color thresholds
const thresholds = {
    green: { min: [30, 80, 30], max: [100, 255, 100] },
    yellow: { min: [150, 150, 0], max: [255, 255, 100] },
    white: { min: [200, 200, 200], max: [255, 255, 255] },
    darkGreen: { min: [0, 50, 0], max: [30, 120, 30] } // "Time for a new refill!"
};

// Access the camera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Camera access denied:", err);
        resultText.textContent = "Error: Unable to access camera.";
    });

// Capture and analyze pixels
captureButton.addEventListener("click", function() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame on canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get overlay position
    const xStart = Math.floor(canvas.width * 0.25);
    const yStart = Math.floor(canvas.height * 0.35);
    const xEnd = xStart + Math.floor(canvas.width * 0.50);
    const yEnd = yStart + Math.floor(canvas.height * 0.30);

    // Sample 3 random pixels inside the rectangle
    let colorResults = [];
    for (let i = 0; i < 3; i++) {
        let x = Math.floor(Math.random() * (xEnd - xStart) + xStart);
        let y = Math.floor(Math.random() * (yEnd - yStart) + yStart);
        let pixel = ctx.getImageData(x, y, 1, 1).data;
        colorResults.push([pixel[0], pixel[1], pixel[2]]);
    }

    // Determine health status
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
});

// Function to check if color is within range
function isWithinRange(color, range) {
    return (
        color[0] >= range.min[0] && color[0] <= range.max[0] &&
        color[1] >= range.min[1] && color[1] <= range.max[1] &&
        color[2] >= range.min[2] && color[2] <= range.max[2]
    );
}
