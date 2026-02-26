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

// --- Touch & Hold Logic ---
const startAction = () => comparisonSlider.classList.add('active');
const endAction = () => comparisonSlider.classList.remove('active');

// For Desktop
sliderHandle.addEventListener('mousedown', startAction);
window.addEventListener('mouseup', endAction);

// For Mobile
sliderHandle.addEventListener('touchstart', (e) => {
    startAction();
    e.preventDefault();
}, {passive: false});
window.addEventListener('touchend', endAction);

// --- Image Processing ---
function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    loaderContainer.style.display = 'flex';
    comparisonSlider.style.display = 'none';

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage = new Image();
        originalImage.src = e.target.result;
        originalImage.onload = () => {
            document.getElementById('width').value = originalImage.width;
            document.getElementById('height').value = originalImage.height;
            updatePreview();
        };
    };
    reader.readAsDataURL(file);
}

function updatePreview() {
    if (!originalImage) return;
    loaderContainer.style.display = 'flex';
    comparisonSlider.style.display = 'none';

    setTimeout(() => {
        const targetWidth = parseInt(document.getElementById('width').value);
        const targetHeight = parseInt(document.getElementById('height').value);
        const format = document.getElementById('format').value;
        const quality = compressToggle.checked ? parseFloat(document.getElementById('quality').value) : 1.0;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Center Crop
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
        originalPreviewImg.src = originalImage.src;
        
        loaderContainer.style.display = 'none';
        comparisonSlider.style.display = 'block';
    }, 600);
}

// Event Listeners
upload.addEventListener('change', (e) => handleFile(e.target.files[0]));
compressToggle.addEventListener('change', () => {
    document.getElementById('quality-wrapper').classList.toggle('disabled', !compressToggle.checked);
    updatePreview();
});
['width', 'height', 'quality', 'format'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
});

document.getElementById('process-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'resized-image';
    link.href = previewImg.src;
    link.click();
});
document.getElementById('reset-btn').addEventListener('click', () => location.reload());
