const canvas = document.getElementById('미리보기');
const ctx = canvas.getContext('2d');

let uploadedImg = null;
let templateImg = null;
let scale = 1;
let offsetX = 0, offsetY = 0;
let isDragging = false;
let lastX, lastY;
let drawing = false;
let currentMode = 'move'; // 'move' or 'draw'

const penColorInput = document.getElementById('펜색상');
const penSizeInput = document.getElementById('펜크기');

let drawCanvas = document.createElement('canvas');
drawCanvas.width = canvas.width;
drawCanvas.height = canvas.height;
let drawCtx = drawCanvas.getContext('2d');

// 이미지 업로드
document.getElementById('이미지업로드').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    uploadedImg = new Image();
    uploadedImg.onload = () => {
      scale = Math.min(canvas.width / uploadedImg.width, canvas.height / uploadedImg.height);
      offsetX = (canvas.width - uploadedImg.width * scale) / 2;
      offsetY = (canvas.height - uploadedImg.height * scale) / 2;
      drawAll();
    };
    uploadedImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// 템플릿 선택
document.querySelectorAll('.템플릿버튼').forEach(btn => {
  btn.addEventListener('click', () => {
    templateImg = new Image();
    templateImg.onload = drawAll;
    templateImg.src = btn.dataset.template;
  });
});

// 모드 전환
document.getElementById('사진이동모드').addEventListener('click', () => currentMode = 'move');
document.getElementById('그림모드').addEventListener('click', () => currentMode = 'draw');

// 그리기 옵션
document.getElementById('지우개').addEventListener('click', () => penColorInput.value = '#ffffff');
document.getElementById('전체지우기').addEventListener('click', () => {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawAll();
});

// 마우스 이벤트
canvas.addEventListener('mousedown', e => {
  if (currentMode === 'move') {
    isDragging = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
  } else {
    drawing = true;
    drawCtx.strokeStyle = penColorInput.value;
    drawCtx.lineWidth = penSizeInput.value;
    drawCtx.lineCap = 'round';
    drawCtx.beginPath();
    drawCtx.moveTo(e.offsetX, e.offsetY);
  }
});
canvas.addEventListener('mousemove', e => {
  if (currentMode === 'move' && isDragging) {
    offsetX += e.offsetX - lastX;
    offsetY += e.offsetY - lastY;
    lastX = e.offsetX;
    lastY = e.offsetY;
    drawAll();
  } else if (currentMode === 'draw' && drawing) {
    drawCtx.lineTo(e.offsetX, e.offsetY);
    drawCtx.stroke();
    drawAll();
  }
});
canvas.addEventListener('mouseup', () => {
  isDragging = false;
  drawing = false;
});
canvas.addEventListener('wheel', e => {
  if (currentMode === 'move') {
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 1.05 : 0.95;
    scale *= zoom;
    drawAll();
  }
});

// 터치 이벤트 (모바일 지원)
let lastTouchDist = null;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1 && currentMode === 'draw') {
    drawing = true;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    drawCtx.strokeStyle = penColorInput.value;
    drawCtx.lineWidth = penSizeInput.value;
    drawCtx.lineCap = 'round';
    drawCtx.beginPath();
    drawCtx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  } else if (e.touches.length === 2 && currentMode === 'move') {
    lastTouchDist = getTouchDist(e);
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  const rect = canvas.getBoundingClientRect();
  if (e.touches.length === 1 && currentMode === 'draw' && drawing) {
    const touch = e.touches[0];
    drawCtx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    drawCtx.stroke();
    drawAll();
  } else if (e.touches.length === 2 && currentMode === 'move') {
    const dist = getTouchDist(e);
    if (lastTouchDist) {
      scale *= dist / lastTouchDist;
      drawAll();
    }
    lastTouchDist = dist;
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  drawing = false;
  lastTouchDist = null;
});

function getTouchDist(e) {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// 다운로드
document.getElementById('다운로드버튼').addEventListener('click', () => {
  let finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  let finalCtx = finalCanvas.getContext('2d');
  
  if (uploadedImg) finalCtx.drawImage(uploadedImg, offsetX, offsetY, uploadedImg.width * scale, uploadedImg.height * scale);
  if (templateImg) finalCtx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
  finalCtx.drawImage(drawCanvas, 0, 0);

  const link = document.createElement('a');
  link.download = 'photocard.png';
  link.href = finalCanvas.toDataURL();
  link.click();

});

// 그리기 함수
function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (uploadedImg) ctx.drawImage(uploadedImg, offsetX, offsetY, uploadedImg.width * scale, uploadedImg.height * scale);
  if (templateImg) ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(drawCanvas, 0, 0);
}
