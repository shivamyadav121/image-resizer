const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const lockAspect = document.getElementById('lockAspect');
const qualitySlider = document.getElementById('qualitySlider');
const qualityManual = document.getElementById('qualityManual');
const qualityPercent = document.getElementById('qualityPercent');
const formatSelect = document.getElementById('formatSelect');
const themeToggle = document.getElementById('themeToggle');
const presetSelect = document.getElementById('presetSelect');
const stripMetadata = document.getElementById('stripMetadata');
const downloadBtn = document.getElementById('downloadBtn');

const beforeImg = document.getElementById('beforeImg');
const afterImg = document.getElementById('afterImg');
const beforeSizeText = document.getElementById('beforeSize');
const afterSizeText = document.getElementById('afterSize');

let originalImage = new Image();
let aspectRatio = 1;

// --- 1. File Upload ---
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    beforeSizeText.innerText = formatBytes(file.size);
    const reader = new FileReader();
    reader.onload = (event) => {
        originalImage.src = event.target.result;
        beforeImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

originalImage.onload = () => {
    widthInput.value = originalImage.width;
    heightInput.value = originalImage.height;
    aspectRatio = originalImage.width / originalImage.height;
    updateImage();
};

// --- 2. Feature 3: Presets Logic ---
presetSelect.onchange = () => {
    if (presetSelect.value === 'custom') return;
    const [w, h] = presetSelect.value.split('x');
    widthInput.value = w;
    heightInput.value = h;
    aspectRatio = parseInt(w) / parseInt(h); // Keep the global ratio in sync
    updateImage();
};;

// --- 3. Core Processing & Feature 4: Privacy ---
function updateImage() {
    if (!originalImage.src) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // The dimensions the user typed in
    const targetWidth = parseInt(widthInput.value) || 1;
    const targetHeight = parseInt(heightInput.value) || 1;
    
    const quality = parseFloat(qualityManual.value) || 0.8;
    const format = formatSelect.value;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // --- CENTER CROP LOGIC START ---
    let sWidth, sHeight, sx, sy;
    const originalRatio = originalImage.width / originalImage.height;
    const targetRatio = targetWidth / targetHeight;

    if (originalRatio > targetRatio) {
        // Original is wider than the target shape (Crop the sides)
        sHeight = originalImage.height;
        sWidth = originalImage.height * targetRatio;
        sx = (originalImage.width - sWidth) / 2;
        sy = 0;
    } else {
        // Original is taller than the target shape (Crop the top/bottom)
        sWidth = originalImage.width;
        sHeight = originalImage.width / targetRatio;
        sx = 0;
        sy = (originalImage.height - sHeight) / 2;
    }
    // --- CENTER CROP LOGIC END ---

    // Draw using the 9-argument method: 
    // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    ctx.drawImage(originalImage, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

    const dataUrl = canvas.toDataURL(format, quality);
    afterImg.src = dataUrl;

    // Calculate New Size
    const head = `data:${format};base64,`;
    const sizeBytes = Math.floor((dataUrl.length - head.length) * 0.75);
    
    let badge = stripMetadata.checked ? " 🛡️" : "";
    afterSizeText.innerHTML = formatBytes(sizeBytes) + badge;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 KB';
    return (bytes / 1024).toFixed(2) + ' KB';
}

// --- 4. Controls & Sync ---
widthInput.oninput = () => {
    if (lockAspect.checked) heightInput.value = Math.round(widthInput.value / aspectRatio);
    updateImage();
};

heightInput.oninput = () => {
    if (lockAspect.checked) widthInput.value = Math.round(heightInput.value * aspectRatio);
    updateImage();
};

qualitySlider.oninput = () => {
    qualityPercent.innerText = qualitySlider.value + '%';
    qualityManual.value = (qualitySlider.value / 100).toFixed(1);
    updateImage();
};

qualityManual.oninput = () => {
    qualitySlider.value = qualityManual.value * 100;
    qualityPercent.innerText = Math.round(qualityManual.value * 100) + '%';
    updateImage();
};

formatSelect.onchange = updateImage;
stripMetadata.onchange = updateImage;

// --- 5. Theme Toggle ---
themeToggle.onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.querySelector('.switch-handle').innerText = isDark ? '☀️' : '🌙';
    themeToggle.querySelector('.switch-handle').style.transform = isDark ? 'translateX(0)' : 'translateX(24px)';
};

// --- 6. Download ---
downloadBtn.onclick = () => {
    if (!afterImg.src) return;
    const link = document.createElement('a');
    const ext = formatSelect.value.split('/')[1];
    link.download = `pro-resized.${ext}`;
    link.href = afterImg.src;
    link.click();
};
