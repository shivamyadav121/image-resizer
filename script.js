const upload = document.getElementById('upload');
const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const previewImg = document.getElementById('preview-img');
const processBtn = document.getElementById('process-btn');
const resetBtn = document.getElementById('reset-btn');

let originalImage = null;

// --- FILE LOADING LOGIC ---
function handleFile(file) {
    if (!file.type.startsWith('image/')) return alert("Please upload an image file.");
    
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage = new Image();
        originalImage.src = e.target.result;
        originalImage.onload = () => {
            // Pre-fill width/height with original values if empty
            document.getElementById('width').value = originalImage.width;
            document.getElementById('height').value = originalImage.height;
            updatePreview();
        };
    };
    reader.readAsDataURL(file);
}

// Drag & Drop Listeners
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
});

upload.addEventListener('change', (e) => handleFile(e.target.files[0]));

// --- CORE RESIZE LOGIC (CENTER CROP) ---
function updatePreview() {
    if (!originalImage) return;

    const targetWidth = parseInt(document.getElementById('width').value) || 100;
    const targetHeight = parseInt(document.getElementById('height').value) || 100;
    const quality = parseFloat(document.getElementById('quality').value);
    const format = document.getElementById('format').value;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // CENTER CROP MATH: Find source dimensions to prevent stretching
    const imgRatio = originalImage.width / originalImage.height;
    const targetRatio = targetWidth / targetHeight;
    let sx, sy, sWidth, sHeight;

    if (imgRatio > targetRatio) {
        sHeight = originalImage.height;
        sWidth = originalImage.height * targetRatio;
        sx = (originalImage.width - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = originalImage.width;
        sHeight = originalImage.width / targetRatio;
        sx = 0;
        sy = (originalImage.height - sHeight) / 2;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
    
    previewImg.src = canvas.toDataURL(format, quality);
    previewImg.style.display = 'block';
    document.getElementById('preview-text').innerText = `Live Preview (${targetWidth}x${targetHeight})`;
}

// Update live on any input change
['width', 'height', 'quality', 'format'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
});

// --- DOWNLOAD & RESET ---
processBtn.addEventListener('click', () => {
    if (!originalImage) return alert("Upload an image first!");
    const format = document.getElementById('format').value;
    const ext = format.split('/')[1];
    const link = document.createElement('a');
    link.download = `resized-image.${ext}`;
    link.href = previewImg.src;
    link.click();
});

resetBtn.addEventListener('click', () => {
    location.reload(); // Simplest way to clear state
});
