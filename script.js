// 전역 변수
let canvas = document.getElementById("미리보기");
let ctx = canvas.getContext("2d");
let 업로드이미지 = null;
let 템플릿이미지 = null;
let 현재모드 = "이동"; // 이동 / 그림
let 펜색 = document.getElementById("펜색상").value;
let 펜크기 = parseInt(document.getElementById("펜크기").value);
let 그림그리는중 = false;
let 드래그중 = false;
let 시작좌표 = { x: 0, y: 0 };
let 이미지위치 = { x: 0, y: 0 };
let 이미지스케일 = 1;

// 터치 확대 관련
let 초기거리 = 0;
let 초기스케일 = 1;

// 캔버스 기본 크기 (기본 해상도)
const 기본캔버스_가로 = 500;
const 기본캔버스_세로 = 700;

// 캔버스 반응형 처리 함수
function resizeCanvas() {
    const containerWidth = window.innerWidth - 40; // body padding 20*2 고려
    const maxCanvasWidth = Math.min(containerWidth * 0.9, 기본캔버스_가로);
    const aspectRatio = 기본캔버스_세로 / 기본캔버스_가로;

    canvas.width = 기본캔버스_가로;
    canvas.height = 기본캔버스_세로;

    // CSS 크기 조정
    canvas.style.width = `${maxCanvasWidth}px`;
    canvas.style.height = `${maxCanvasWidth * aspectRatio}px`;

    그리기();
}

// 이미지 업로드
document.getElementById("이미지업로드").addEventListener("change", (e) => {
    let file = e.target.files[0];
    if (!file) return console.error("E100: 이미지 파일이 선택되지 않았습니다.");
    let reader = new FileReader();
    reader.onload = (evt) => {
        업로드이미지 = new Image();
        업로드이미지.onload = () => {
            이미지위치 = { x: 0, y: 0 };
            이미지스케일 = 1;

            // 캔버스 기본 크기 기준으로 이미지 스케일 조정
            const scaleX = canvas.width / 업로드이미지.width;
            const scaleY = canvas.height / 업로드이미지.height;
            이미지스케일 = Math.min(scaleX, scaleY);

            // 가운데 정렬
            이미지위치.x = (canvas.width - 업로드이미지.width * 이미지스케일) / 2;
            이미지위치.y = (canvas.height - 업로드이미지.height * 이미지스케일) / 2;

            그리기();
        };
        업로드이미지.src = evt.target.result;
    };
});

// 템플릿 적용
document.querySelectorAll(".템플릿버튼").forEach(btn => {
    btn.addEventListener("click", () => {
        let src = btn.dataset.template;
        템플릿이미지 = new Image();
        템플릿이미지.onload = () => 그리기();
        템플릿이미지.src = src;
    });
});

// 모드 전환
document.getElementById("사진이동모드").addEventListener("click", () => 현재모드 = "이동");
document.getElementById("그림모드").addEventListener("click", () => 현재모드 = "그림");

// 그림 옵션 변경
document.getElementById("펜색상").addEventListener("input", (e) => 펜색 = e.target.value);
document.getElementById("펜크기").addEventListener("input", (e) => 펜크기 = parseInt(e.target.value));
document.getElementById("지우개").addEventListener("click", () => 펜색 = "#FFFFFF");
document.getElementById("전체지우기").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    그리기();
});

// 좌표 계산 (반응형 및 터치 보정 포함)
function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    } else {
        clientX = evt.clientX;
        clientY = evt.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// 시작
function startDrawOrMove(e) {
    e.preventDefault();
    if (e.touches && e.touches.length === 2) return; // 멀티터치 시 중지
    let pos = getPos(e);
    if (현재모드 === "이동") {
        드래그중 = true;
        시작좌표 = { x: pos.x - 이미지위치.x, y: pos.y - 이미지위치.y };
    } else {
        그림그리는중 = true;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
}

// 이동/그리기
function moveDrawOrMove(e) {
    e.preventDefault();
    if (e.touches && e.touches.length === 2) {
        // 멀티터치 확대/축소
        let t1 = e.touches[0], t2 = e.touches[1];
        let dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (초기거리 === 0) {
            초기거리 = dist;
            초기스케일 = 이미지스케일;
        } else {
            let scaleChange = dist / 초기거리;
            이미지스케일 = 초기스케일 * scaleChange;
            그리기();
        }
        return;
    }

    let pos = getPos(e);
    if (현재모드 === "이동" && 드래그중) {
        이미지위치.x = pos.x - 시작좌표.x;
        이미지위치.y = pos.y - 시작좌표.y;
        그리기();
    } else if (현재모드 === "그림" && 그림그리는중) {
        ctx.strokeStyle = 펜색;
        ctx.lineWidth = 펜크기;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
}

// 종료
function endDrawOrMove(e) {
    e.preventDefault();
    그림그리는중 = false;
    드래그중 = false;
    초기거리 = 0;
}

// 그리기 함수
function 그리기() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 템플릿
    if (템플릿이미지) {
        ctx.drawImage(템플릿이미지, 0, 0, canvas.width, canvas.height);
    } else {
        // 기본 배경색 또는 패턴 필요하면 추가 가능
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 업로드 이미지
    if (업로드이미지) {
        ctx.drawImage(
            업로드이미지,
            이미지위치.x,
            이미지위치.y,
            업로드이미지.width * 이미지스케일,
            업로드이미지.height * 이미지스케일
        );
    }
}

// 다운로드
document.getElementById("다운로드버튼").addEventListener("click", () => {
    // 임시 캔버스 생성 (실제 크기 기준)
    let exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    let exportCtx = exportCanvas.getContext("2d");

    // 템플릿
    if (템플릿이미지) {
        exportCtx.drawImage(템플릿이미지, 0, 0, exportCanvas.width, exportCanvas.height);
    } else {
        exportCtx.fillStyle = "#f0f0f0";
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    // 업로드 이미지
    if (업로드이미지) {
        exportCtx.drawImage(
            업로드이미지,
            이미지위치.x,
            이미지위치.y,
            업로드이미지.width * 이미지스케일,
            업로드이미지.height * 이미지스케일
        );
    }

    // 현재 캔버스에 그린 그림 (직접 복사)
    exportCtx.drawImage(canvas, 0, 0);

    // 다운로드
    let link = document.createElement("a");
    link.download = "photocard.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
});

// 캔버스 이벤트 연결
canvas.addEventListener("mousedown", startDrawOrMove);
canvas.addEventListener("mousemove", moveDrawOrMove);
canvas.addEventListener("mouseup", endDrawOrMove);
canvas.addEventListener("mouseout", endDrawOrMove);

canvas.addEventListener("touchstart", startDrawOrMove, { passive: false });
canvas.addEventListener("touchmove", moveDrawOrMove, { passive: false });
canvas.addEventListener("touchend", endDrawOrMove);
canvas.addEventListener("touchcancel", endDrawOrMove);

// 초기 세팅
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
