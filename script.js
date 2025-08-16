// --- DOM Element Selection ---
const imageFileInput = document.querySelector("#imageFileInput");
const canvas = document.querySelector("#meme");
const memeTextInput = document.querySelector("#memeTextInput"); // Updated selector
const fetchMemeBtn = document.querySelector("#fetchMemeBtn");
const downloadMemeBtn = document.querySelector("#downloadMemeBtn");
const resetBtn = document.querySelector("#resetBtn");
const errorMessage = document.querySelector("#errorMessage");

// Customization Controls
const fontColorInput = document.querySelector("#fontColor");
const strokeColorInput = document.querySelector("#strokeColor");
const fontSizeSlider = document.querySelector("#fontSize");
const fontFamilySelect = document.querySelector("#fontFamily");
const filterSelect = document.querySelector("#filter");

// --- State Variables ---
let image = null;
let isDragging = false;
let textX, textY; // To store text coordinates
let dragStartX, dragStartY; // To store the initial click offset

// --- Event Listeners ---

// Handle local image file upload
imageFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        showError("❌ File too large! Please select an image under 5MB.");
        return;
    }
    hideError();
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result);
    reader.readAsDataURL(file);
});

// Fetch random meme from API
fetchMemeBtn.addEventListener("click", async () => {
    try {
        const response = await fetch("https://api.imgflip.com/get_memes");
        const json = await response.json();
        const randomMeme = json.data.memes[Math.floor(Math.random() * json.data.memes.length)];
        loadImage(randomMeme.url);
    } catch (error) {
        showError("😢 Could not fetch a meme. Please try again!");
        console.error("API Error:", error);
    }
});

// Update canvas when any control changes
[memeTextInput, fontColorInput, strokeColorInput, fontSizeSlider, fontFamilySelect, filterSelect].forEach(input => {
    input.addEventListener("input", () => {
        if (image) updateMemeCanvas();
    });
});

// Download meme
downloadMemeBtn.addEventListener("click", () => {
    if (!image) {
        alert("⚠️ Please create a meme first!");
        return;
    }
    const link = document.createElement("a");
    link.download = "funky-meme.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Reset everything
resetBtn.addEventListener("click", resetAll);


// --- Draggable Text Event Listeners ---

// Get mouse/touch position relative to the canvas
function getClientOffset(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) { // Touch event
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    } else { // Mouse event
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}

canvas.addEventListener('mousedown', (e) => handleDragStart(getClientOffset(e)));
canvas.addEventListener('touchstart', (e) => handleDragStart(getClientOffset(e)));

canvas.addEventListener('mousemove', (e) => handleDragMove(getClientOffset(e)));
canvas.addEventListener('touchmove', (e) => handleDragMove(getClientOffset(e)));

canvas.addEventListener('mouseup', () => (isDragging = false));
canvas.addEventListener('touchend', () => (isDragging = false));
canvas.addEventListener('mouseleave', () => (isDragging = false));


// --- Core Functions ---

function handleDragStart({ x, y }) {
    if (!image) return;
    // Check if the click is inside the text's bounding box
    const textMetrics = getTextMetrics();
    if (x > textMetrics.left && x < textMetrics.right && y > textMetrics.top && y < textMetrics.bottom) {
        isDragging = true;
        // Store the offset from the text's corner to the click point
        dragStartX = x - textX;
        dragStartY = y - textY;
    }
}

function handleDragMove({ x, y }) {
    if (isDragging) {
        // Update text position based on mouse move and initial offset
        textX = x - dragStartX;
        textY = y - dragStartY;
        updateMemeCanvas();
    }
}

function loadImage(src) {
    image = new Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    image.onload = () => {
        // Set initial text position to the center
        textX = canvas.width / 2;
        textY = canvas.height / 2;
        updateMemeCanvas();
    };
    image.onerror = () => showError("Could not load the selected image.");
}

function getTextMetrics() {
    const ctx = canvas.getContext("2d");
    const baseFontSize = Math.floor(image.width / 10);
    const fontSize = baseFontSize * (fontSizeSlider.value / 50);
    ctx.font = `${fontSize}px ${fontFamilySelect.value}`;

    const metrics = ctx.measureText(memeTextInput.value);
    const textWidth = metrics.width;
    const textHeight = fontSize; // Approximate height

    return {
        left: textX - textWidth / 2,
        right: textX + textWidth / 2,
        top: textY - textHeight / 2,
        bottom: textY + textHeight / 2
    };
}


function updateMemeCanvas() {
    if (!image) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = image;
    canvas.width = width;
    canvas.height = height;

    // Apply image filter
    ctx.filter = filterSelect.value;
    ctx.drawImage(image, 0, 0);
    ctx.filter = 'none'; // Reset filter so it doesn't affect text

    // Set text styles
    const baseFontSize = Math.floor(width / 10);
    const fontSize = baseFontSize * (fontSizeSlider.value / 50);
    ctx.fillStyle = fontColorInput.value;
    ctx.strokeStyle = strokeColorInput.value;
    ctx.lineWidth = Math.floor(fontSize / 15);
    ctx.font = `${fontSize}px ${fontFamilySelect.value}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // Center text vertically on its coordinate
    ctx.lineJoin = "round";

    // Draw the single, draggable text
    ctx.strokeText(memeTextInput.value, textX, textY);
    ctx.fillText(memeTextInput.value, textX, textY);
}

function resetAll() {
    image = null;
    isDragging = false;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    imageFileInput.value = '';
    memeTextInput.value = '';
    fontColorInput.value = '#FFFFFF';
    strokeColorInput.value = '#000000';
    fontSizeSlider.value = '50';
    fontFamilySelect.value = 'Impact';
    filterSelect.value = 'none';
    hideError();
}

// --- Utility Functions ---
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}

function hideError() {
    errorMessage.style.display = "none";
}