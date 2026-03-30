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

const beforeImg = document.getElementById('beforeImg');
const afterImg = document.getElementById('afterImg');
const beforeSizeText = document.getElementById('beforeSize');
const afterSizeText = document.getElementById('afterSize');

let originalImage = new Image();
let aspectRatio = 1;

// --- Upload Logic ---
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

// --- Processing Logic ---
function updateImage() {
    if (!originalImage.src) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const w = parseInt(widthInput.value) || 1;
    const h = parseInt(heightInput.value) || 1;
    const quality = parseFloat(qualityManual.value) || 0.8;
    const format = formatSelect.value;

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(originalImage, 0, 0, w, h);

    const dataUrl = canvas.toDataURL(format, quality);
    afterImg.src = dataUrl;

    // Size calculation logic
    const head = `data:${format};base64,`;
    const sizeBytes = Math.floor((dataUrl.length - head.length) * 0.75);
    afterSizeText.innerText = formatBytes(sizeBytes);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    return kb.toFixed(2) + ' KB';
}

// --- Event Listeners ---
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

formatSelect.onchange = updateImage;

// --- Theme Toggle ---
themeToggle.onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.querySelector('.switch-handle').innerText = isDark ? '☀️' : '🌙';
    themeToggle.querySelector('.switch-handle').style.left = isDark ? '2px' : '26px';
};
