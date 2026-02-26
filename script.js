const upload = document.getElementById('upload');
const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const previewImg = document.getElementById('preview-img');
const originalPreviewImg = document.getElementById('original-preview-img');
const loaderContainer = document.getElementById('loader-container');
const comparisonSlider = document.getElementById('comparison-slider');
const originalOverlay = document.getElementById('original-overlay');
const sliderHandle = document.getElementById('slider-handle');
const compressToggle = document.getElementById('compress-toggle');
const qualityWrapper = document.getElementById('quality-wrapper');
const processBtn = document.getElementById('process-btn');

let originalImage = null;

// --- Comparison Slider Logic ---
function moveSlider(e) {
    if (!comparisonSlider.offsetParent) return; // Only run if visible
    const rect = comparisonSlider.getBoundingClientRect();
    const x = ((e.pageX || e.touches?.[0].pageX) - rect.left);
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    originalOverlay.style.width = percent + "%";
    sliderHandle.style.left = percent + "%";
}

comparisonSlider.addEventListener('mousemove', moveSlider);
comparisonSlider.addEventListener('touchmove', (e) => { 
    moveSlider(e); 
    e.preventDefault(); 
}, {passive: false});

// --- File Handling ---
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

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
});
upload.addEventListener('change', (e) => handleFile(e.target.files[0]));

// --- Resizing Engine ---
function updatePreview() {
    if (!originalImage) return;
    
    loaderContainer.style.display = 'flex';
    comparisonSlider.style.display = 'none';

    // Small delay to allow the "Scanning" animation to be seen
    setTimeout(() => {
        const targetWidth = parseInt(document.getElementById('width').value) || 100;
        const targetHeight = parseInt(document.getElementById('height').value) || 100;
        const format = document.getElementById('format').value;
        const quality = compressToggle.checked ? parseFloat(document.getElementById('quality').value) : 1.0;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // --- Center Crop Logic (Anti-Distortion) ---
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
        
        // Update images
        previewImg.src = canvas.toDataURL(format, quality);
        originalPreviewImg.src = originalImage.src;
        
        // Finalize UI
        loaderContainer.style.display = 'none';
        comparisonSlider.style.display = 'block';
        
        // Crucial: Sync the "Before" image width to the current slider container width
        // 
        setTimeout(() => {
            originalPreviewImg.style.width = comparisonSlider.offsetWidth + "px";
        }, 50);

        processBtn.classList.add('download-ready');
    }, 600);
}

// --- UI Listeners ---
compressToggle.addEventListener('change', () => {
    qualityWrapper.classList.toggle('disabled', !compressToggle.checked);
    updatePreview();
});

['width', 'height', 'quality', 'format'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
});

processBtn.addEventListener('click', () => {
    if (!originalImage) return alert("Please upload an image first.");
    const format = document.getElementById('format').value;
    const ext = format.split('/')[1];
    const link = document.createElement('a');
    link.download = `resized-image.${ext}`;
    link.href = previewImg.src;
    link.click();
});

document.getElementById('reset-btn').addEventListener('click', () => location.reload());

// Keep images synced if user resizes the browser window
window.addEventListener('resize', () => {
    if (originalImage) {
        originalPreviewImg.style.width = comparisonSlider.offsetWidth + "px";
    }
});
