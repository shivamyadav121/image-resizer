# 📸 Pro Image Resizer & Compressor

A sleek, browser-based tool to resize and compress images locally without uploading them to a server. Built with a modern dark interface, futuristic motion effects, and a professional "Before vs. After" comparison slider.

## ✨ Features

* **Center-Crop Resizing:** Automatically crops from the center to prevent image distortion or stretching.
* **Optional Compression:** Choose between original quality or custom JPEG/WebP compression levels.
* **Live Comparison Slider:** Drag the handle to compare your original image with the processed version in real-time.
* **Futuristic UI:** Includes a "Scanning" animation, smooth transitions, and a drag-and-drop zone.
* **Privacy First:** All processing happens in your browser's memory. Your images are never sent to a server.
* **Format Conversion:** Export images as JPEG, PNG, or WebP.

## 🚀 Live Demo

****

## 🛠️ How to Use

1.  **Upload:** Drag and drop an image into the box or click "Browse Files."
2.  **Adjust:** Enter your target width and height in pixels.
3.  **Optimize:** Toggle "Enable Compression" and adjust the slider to reduce file size.
4.  **Compare:** Use the slider on the preview image to check for quality loss.
5.  **Download:** Click "Download Image" to save your result.

## 📂 Project Structure

* `index.html`: The structure and UI elements.
* `style.css`: The "Cool" dark-mode styling and motion animations.
* `script.js`: The engine handling the Canvas API, center-crop math, and slider logic.

## 📝 Technical Details

The tool uses the HTML5 `Canvas` API for image manipulation. To prevent distortion, it calculates the source-to-destination aspect ratio using:



