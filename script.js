
const video = document.getElementById("camera");
const captureButton = document.getElementById("capture");
const resultText = document.getElementById("result");

// Triangle sampling helpers
function isPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const areaOrig = Math.abs((bx - ax)*(cy - ay) - (cx - ax)*(by - ay));
    const area1 = Math.abs((ax - px)*(by - py) - (bx - px)*(ay - py));
    const area2 = Math.abs((bx - px)*(cy - py) - (cx - px)*(by - py));
    const area3 = Math.abs((cx - px)*(ay - py) - (ax - px)*(cy - py));
    return (area1 + area2 + area3) <= areaOrig;
}

// Request camera access
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
requestCameraAccess();

// Start loading animation
function startLoading(callback) {
    let duration = Math.random() * (500 - 250) + 250;
    loadingContainer.style.opacity = "1";
    loadingBar.style.width = "0%";
    captureButton.disabled = true;
    let progress = 0;
    let interval = setInterval(() => {
        if (progress < 100) {
            progress += 20;
            loadingBar.style.width = `${progress}%`;
        } else {
            clearInterval(interval);
        }
    }, duration / 5);
    setTimeout(() => {
        loadingBar.style.width = "100%";
        setTimeout(() => {
            loadingContainer.style.opacity = "0";
            captureButton.disabled = false;
            callback();
        }, 300);
    }, duration);
}

// Main color analysis
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

    const ax = xStart, ay = yStart;
    const bx = xEnd, by = yStart;
    const cx = (xStart + xEnd) / 2, cy = yStart + (yEnd - yStart) * 0.9;

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

    let samples = 0;
    while (samples < 13) {
        let x = Math.floor(Math.random() * (xEnd - xStart) + xStart);
        let y = Math.floor(Math.random() * ((cy) - yStart) + yStart);
        if (isPointInTriangle(x, y, ax, ay, bx, by, cx, cy)) {
            let pixel = ctx.getImageData(x, y, 1, 1).data;
            const [r, g, b] = pixel;

            if (isWithinRange(pixel, { min: [0, 50, 0], max: [30, 140, 30] })) {
                statusCounts["Time for a new refill!"]++;
            } else if (isWithinRange(pixel, { min: [50, 100, 50], max: [120, 255, 120] })) {
                statusCounts["Healthy!"]++;
            } else if (isWithinRange(pixel, { min: [160, 120, 0], max: [255, 180, 120] })) {
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
                statusCounts["No aerium detected: Black"]++;
            }
            samples++;
        }
    }

    let highestCategory = Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);
    resultText.textContent = statusCounts[highestCategory] > 0
        ? `Status: ${highestCategory}`
        : "Status: No valid reading detected.";
}

// Utilities
function isWithinRange(color, range) {
    return (
        color[0] >= range.min[0] && color[0] <= range.max[0] &&
        color[1] >= range.min[1] && color[1] <= range.max[1] &&
        color[2] >= range.min[2] && color[2] <= range.max[2]
    );
}

// Attach event
captureButton.addEventListener("click", () => {
    resultText.textContent = "Analyzing...";
    startLoading(analyzeColor);
});
