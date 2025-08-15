const canvas = document.getElementById('미리보기');
const ctx = canvas.getContext('2d');

let uploadedImg = null;
let templateImg = null;

let scale = 1, targetScale = 1;
let offsetX = 0, offsetY = 0;
let isDragging = false, lastX = 0, lastY = 0;

let drawing = false;
let currentMode = 'move'; // 'move' or 'draw'

const penColorInput = document.getElementById('펜색상');
const penSizeInput = document.getElementById('펜크기');

let drawCanvas = document.createElement('canvas');
drawCanvas.width = canvas.width;
drawCanvas.height = canvas.height;
let drawCtx = drawCanvas.getContext('2d');

let lastTouchDist = null;

// ================== 이미지 업로드 ==================
document.getElementById('이미지업로드').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        uploadedImg = new Image();
        uploadedImg.onload = () => {
            scale = targetScale = Math.min(canvas.width / uploadedImg.width, canvas.height / uploadedImg.height);
            offsetX = (canvas.width - uploadedImg.width * scale) / 2;
            offsetY = (canvas.height - uploadedImg.height * scale) / 2;
            drawAll();
        };
        uploadedImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

// ================== 템플릿 선택 ==================
document.querySelectorAll('.템플릿버튼').forEach(btn => {
    btn.addEventListener('click', () => {
        templateImg = new Image();
        templateImg.onload = drawAll;
        templateImg.onerror = () => alert("템플릿 이미지를 불러올 수 없습니다.");
        templateImg.src = btn.dataset.template;
    });
});

// ================== 모드 전환 ==================
document.getElementById('사진이동모드').addEventListener('click', () => currentMode = 'move');
document.getElementById('그림모드').addEventListener('click', () => currentMode = 'draw');

// ================== 그리기 옵션 ==================
document.getElementById('지우개').addEventListener('click', () => penColorInput.value = '#ffffff');
document.getElementById('전체지우기').addEventListener('click', () => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawAll();
});

// ================== 좌표 계산 (모바일 터치 보정) ==================
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.touches) {
        // 터치 이벤트 좌표를 캔버스 크기에 맞춰 보정
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }

    return { x, y };
}

// ================== 시작 ==================
function startPointer(e) {
    e.preventDefault();
    const pos = getPointerPos(e);

    if (currentMode === 'draw') {
        drawing = true;
        drawCtx.strokeStyle = penColorInput.value;
        drawCtx.lineWidth = penSizeInput.value;
        drawCtx.lineCap = 'round';
        drawCtx.beginPath();
        drawCtx.moveTo(pos.x, pos.y);
    } else {
        isDragging = true;
        lastX = pos.x;
        lastY = pos.y;
    }
}

canvas.addEventListener('mousedown', startPointer);
canvas.addEventListener('touchstart', startPointer, { passive: false });

// ================== 이동 / 그림 ==================
function movePointer(e) {
    e.preventDefault();
    const pos = getPointerPos(e);

    if (currentMode === 'draw' && drawing) {
        drawCtx.lineTo(pos.x, pos.y);
        drawCtx.stroke();
        drawAll();
    } else if (currentMode === 'move' && isDragging) {
        offsetX += pos.x - lastX;
        offsetY += pos.y - lastY;
        lastX = pos.x;
        lastY = pos.y;
        drawAll();
    }
}

canvas.addEventListener('mousemove', movePointer);
canvas.addEventListener('touchmove', movePointer, { passive: false });

// ================== 종료 ==================
function endPointer() {
    isDragging = false;
    drawing = false;
}

canvas.addEventListener('mouseup', endPointer);
canvas.addEventListener('mouseleave', endPointer);
canvas.addEventListener('touchend', endPointer);

// ================== 확대/축소 ==================
canvas.addEventListener('wheel', e => {
    if (currentMode !== 'move') return;
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 1.05 : 0.95;
    targetScale *= zoom;
});

canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && currentMode === 'move') {
        const rect = canvas.getBoundingClientRect();
        const x1 = e.touches[0].clientX - rect.left;
        const y1 = e.touches[0].clientY - rect.top;
        const x2 = e.touches[1].clientX - rect.left;
        const y2 = e.touches[1].clientY - rect.top;

        const dist = Math.hypot(x2 - x1, y2 - y1);
        const centerX = (x1 + x2)/2;
        const centerY = (y1 + y2)/2;

        if (lastTouchDist) {
            const zoom = dist / lastTouchDist;

            offsetX = centerX - (centerX - offsetX) * zoom;
            offsetY = centerY - (centerY - offsetY) * zoom;
            targetScale *= zoom;
        }
        lastTouchDist = dist;
    } else if (e.touches.length < 2) {
        lastTouchDist = null;
    }
}, { passive: false });

// ================== 다운로드 ==================
document.getElementById('다운로드버튼').addEventListener('click', () => {
    if (!uploadedImg) { alert("업로드한 이미지가 없습니다."); return; }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d');

    finalCtx.drawImage(uploadedImg, offsetX, offsetY, uploadedImg.width * scale, uploadedImg.height * scale);

    if (templateImg) {
        if (!templateImg.complete) {
            templateImg.onload = () => {
                finalCtx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
                finalCtx.drawImage(drawCanvas, 0, 0);
                triggerDownload(finalCanvas);
            };
            return;
        } else {
            finalCtx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
        }
    }

    finalCtx.drawImage(drawCanvas, 0, 0);
    triggerDownload(finalCanvas);
});

function triggerDownload(c) {
    const link = document.createElement('a');
    link.download = 'photocard.png';
    link.href = c.toDataURL();
    link.click();
}

// ================== 그리기 ==================
function drawAll() {
    scale += (targetScale - scale) * 0.2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (uploadedImg) ctx.drawImage(uploadedImg, offsetX, offsetY, uploadedImg.width * scale, uploadedImg.height * scale);
    if (templateImg) ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(drawCanvas, 0, 0);
    requestAnimationFrame(drawAll);
}

drawAll();
