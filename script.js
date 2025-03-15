document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById("camera");
    const captureButton = document.getElementById("capture");
    const resultText = document.getElementById("result");
    const loadingContainer = document.getElementById("loading-container");
    const loadingBar = document.getElementById("loading-bar");

    // Ensure elements exist before using them
    if (!video || !captureButton || !resultText || !loadingContainer || !loadingBar) {
        console.error("One or more elements are missing in the HTML.");
        return;
    }

    captureButton.addEventListener("click", function() {
        console.log("Analyze button clicked!");

        // Show loading bar with random delay (2-4 seconds)
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

    // Function to analyze colors (same as before)
    function analyzeColor() {
        resultText.textContent = "Status: Healthy!"; // Placeholder result
    }
});
