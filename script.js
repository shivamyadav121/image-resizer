const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const previewImg = document.getElementById('preview-img');
const originalPreviewImg = document.getElementById('original-preview-img');
const comparisonSlider = document.getElementById('comparison-slider');
const sliderHandle = document.getElementById('slider-handle');
const loaderContainer = document.getElementById('loader-container');
const compressToggle = document.getElementById('compress-toggle');

let originalImage = null;

// --- Hold to Compare Logic (Optimized for PC & Mobile) ---
const startAction = (e) => {
    if (e.cancelable) e.preventDefault(); 
    comparisonSlider.classList.add('active');
};

const stopAction = () => {
    comparisonSlider.classList.remove('active');
};

// PC Click & Hold
sliderHandle.addEventListener('mousedown', startAction);
window.addEventListener('mouseup', stopAction);

// Mobile Touch & Hold
sliderHandle.addEventListener('touchstart', startAction, { passive: false });
window.addEventListener('touchend', stopAction);

// Prevent default dragging ghost image on PC
sliderHandle.addEventListener('dragstart', (e) => e.preventDefault());

// --- File Handling ---
function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    
    loaderContainer.style.display = 'flex';
    comparisonSlider.style.display = 'none';

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage = new Image();
        originalImage.onload = () => {
            document.getElementById('width').value = originalImage.width;
            document.getElementById('height').value = originalImage.height;
            updatePreview();
        };
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updatePreview() {
    if (!originalImage) return;

    const targetWidth = parseInt(document.getElementById('width').value) || originalImage.width;
    const targetHeight = parseInt(document.getElementById('height').value) || originalImage.height;
    const format = document.getElementById('format').value;
    const quality = compressToggle.checked ? parseFloat(document.getElementById('quality').value) : 1.0;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Center-Crop Calculation
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
    
    // Result display
    previewImg.src = canvas.toDataURL(format, quality);
    originalPreviewImg.src = originalImage.src;

    loaderContainer.style.display = 'none';
    comparisonSlider.style.display = 'block';
}

// Global Event Listeners
upload.addEventListener('change', (e) => handleFile(e.target.files[0]));
compressToggle.addEventListener('change', () => {
    document.getElementById('quality-wrapper').classList.toggle('disabled', !compressToggle.checked);
    updatePreview();
});

['width', 'height', 'quality', 'format'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
});

document.getElementById('process-btn').addEventListener('click', () => {
    if (!previewImg.src) return;
    const link = document.createElement('a');
    link.download = `resized-${Date.now()}`;
    link.href = previewImg.src;
    link.click();
});

document.getElementById('reset-btn').addEventListener('click', () => location.reload());
