const imageFileInput = document.querySelector("#imageFileInput");
const canvas = document.querySelector("#meme");
const topTextInput = document.querySelector("#topTextInput");
const bottomTextInput = document.querySelector("#bottomTextInput");
const downloadMeme = document.querySelector("#downloadMeme");
const errorMessage = document.querySelector("#errorMessage");

let image = null;
let previousImageData = ""; // Store last valid image state (this is here for preventing the download of unchanged images)

//  image of 5 MB allowed
imageFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (!file) return; // Prevents error if no file is selected

    if (file.size >  5 * 1024 * 1024) { // 5MB limit
        errorMessage.textContent = "❌ File size too large! Please select an image under 5MB.";
        errorMessage.style.display = "block";
        return;
    }

    errorMessage.style.display = "none"; // Hide error when valid image is selected

    const imageDataUrl = URL.createObjectURL(file);
    image = new Image();
    image.src = imageDataUrl;

    image.onload = () => {
        updateMemeCanvas();
        previousImageData = canvas.toDataURL(); // Store initial image state
    };
});

// Live preview of text changes (only if an image is selected)
topTextInput.addEventListener("input", () => {
    if (image) updateMemeCanvas();
});

bottomTextInput.addEventListener("input", () => {
    if (image) updateMemeCanvas();
});

// Function for updating meme canvas 
function updateMemeCanvas() {
    if (!image) return; // Stop if no image is loaded

    const ctx = canvas.getContext("2d");
    const width = image.width > 500 ? 500 : image.width;
    const height = image.height > 500 ? 500 : image.height;
    const fontSize = Math.floor(width / 8);
    const yOffset = height / 15;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    // Funky text styles
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = Math.floor(fontSize / 5);
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.font = `${fontSize}px Impact, sans-serif`;
    ctx.shadowColor = "black";
    ctx.shadowBlur = 8; // Slight glow effect

    // Draw text function
    function drawText(text, x, y, maxWidth, textBaseline) {
        ctx.textBaseline = textBaseline;
        let words = text.split(" ");
        let line = "";
        let lines = [];

        words.forEach(word => {
            let testLine = line + word + " ";
            let testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth) {
                lines.push(line);
                line = word + " ";
            } else {
                line = testLine;
            }
        });
        lines.push(line);

        // Draw each line with a slight angle
        lines.forEach((line, i) => {
            let angle = (Math.random() * 4 - 2) * (Math.PI / 180);
            ctx.save();
            ctx.translate(x, y + i * fontSize);
            ctx.rotate(angle);
            ctx.strokeText(line, 0, 0);
            ctx.fillText(line, 0, 0);
            ctx.restore();
        });
    }

    drawText(topTextInput.value, width / 2, yOffset, width * 0.8, "top");
    drawText(bottomTextInput.value, width / 2, height - yOffset - fontSize, width * 0.8, "bottom");
}

// Download meme feature (only if image has changed and is present)
downloadMeme.addEventListener("click", () => {
    if (!image) { // Prevent download if no image is selected
        alert("⚠️ Please upload an image first!");
        return;
    }

    const currentImageData = canvas.toDataURL();

    if (currentImageData === previousImageData) {
        alert("⚠️ Please change the image or text before downloading!");
        return;
    }

    // Allow download only if image or text has changed
    const link = document.createElement("a");
    link.download = "funky-meme.png";
    link.href = currentImageData;
    link.click();

    previousImageData = currentImageData; // Update last saved state
});
