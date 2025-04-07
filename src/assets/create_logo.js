// Create a simple logo for Nasiq using SVG
const canvas = document.createElement('canvas');
canvas.width = 200;
canvas.height = 200;
const ctx = canvas.getContext('2d');

// Background circle
ctx.beginPath();
ctx.arc(100, 100, 90, 0, 2 * Math.PI);
ctx.fillStyle = '#8e44ad';
ctx.fill();

// Inner circle
ctx.beginPath();
ctx.arc(100, 100, 70, 0, 2 * Math.PI);
ctx.fillStyle = '#ffffff';
ctx.fill();

// Letter ن (stylized)
ctx.beginPath();
ctx.moveTo(70, 70);
ctx.lineTo(130, 70);
ctx.lineTo(130, 90);
ctx.lineTo(90, 90);
ctx.lineTo(90, 130);
ctx.lineTo(70, 130);
ctx.closePath();
ctx.fillStyle = '#8e44ad';
ctx.fill();

// Convert to PNG
const dataUrl = canvas.toDataURL('image/png');
const img = document.createElement('img');
img.src = dataUrl;
document.body.appendChild(img);

// Download the image
const link = document.createElement('a');
link.download = 'logo.png';
link.href = dataUrl;
link.click();
