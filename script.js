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

// 이미지 업로드
document.getElementById("이미지업로드").addEventListener("change", (e) => {
    let file = e.target.files[0];
    if (!file) return console.error("E100: 이미지 파일이 선택되지 않았습니다.");
    let reader = new FileReader();
    reader.onload = (evt) => {
        업로드이미지 = new Image();
        업로드이미지.onload = () => {
            // 캔버스 크기에 맞춰 이미지 스케일 조정
            이미지위치 = { x: 0, y: 0 };
            이미지스케일 = 1; 
            
            // 가로세로 비율 유지하면서 캔버스 500x700 안에 맞추기
            const canvasW = canvas.width;
            const canvasH = canvas.height;
            const scaleX = canvasW / 업로드이미지.width;
            const scaleY = canvasH / 업로드이미지.height;
            이미지스케일 = Math.min(scaleX, scaleY);

            // 가운데 정렬
            이미지위치.x = (canvasW - 업로드이미지.width * 이미지스케일) / 2;
            이미지위치.y = (canvasH - 업로드이미지.height * 이미지스케일) / 2;

            그리기();
        };
        업로드이미지.src = evt.target.result;
    };
    reader.readAsDataURL(file);
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

// 좌표 계산
function getPos(evt) {
    let rect = canvas.getBoundingClientRect();
    if (evt.touches) {
        return { x: evt.touches[0].clientX - rect.left, y: evt.touches[0].clientY - rect.top };
    }
    return { x: evt.offsetX, y: evt.offsetY };
}

// 시작
function startDrawOrMove(e) {
    e.preventDefault();
    if (e.touches && e.touches.length === 2) return; // 멀티터치 시 이동/그리기 중지
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
            이미지스케일 = 초기스케일 * (dist / 초기거리);
            if (이미지스케일 < 0.01) 이미지스케일 = 0.01;
            if (이미지스케일 > 5) 이미지스케일 = 5;
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
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
}

// 종료
function endDrawOrMove(e) {
    드래그중 = false;
    그림그리는중 = false;
    if (!e.touches || e.touches.length < 2) 초기거리 = 0;
}

// 이벤트 등록
canvas.addEventListener("mousedown", startDrawOrMove);
canvas.addEventListener("mousemove", moveDrawOrMove);
canvas.addEventListener("mouseup", endDrawOrMove);
canvas.addEventListener("mouseleave", endDrawOrMove);

canvas.addEventListener("touchstart", startDrawOrMove, { passive: false });
canvas.addEventListener("touchmove", moveDrawOrMove, { passive: false });
canvas.addEventListener("touchend", endDrawOrMove);

// 마우스 휠 확대/축소
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const scaleAmount = e.deltaY < 0 ? 1.1 : 0.9;
    이미지스케일 *= scaleAmount;
    if (이미지스케일 < 0.1) 이미지스케일 = 0.1;
    if (이미지스케일 > 5) 이미지스케일 = 5;
    그리기();
}, { passive: false });

// 다운로드
document.getElementById("다운로드버튼").addEventListener("click", () => {
    try {
        let link = document.createElement("a");
        link.download = "포토카드.png";
        link.href = canvas.toDataURL();
        link.click();
    } catch (err) {
        console.error("E200: 다운로드 실패", err);
        alert("다운로드 중 오류가 발생했습니다. (코드: E200)");
    }
});

// 그리기
function 그리기() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (업로드이미지) {
        let w = 업로드이미지.width * 이미지스케일;
        let h = 업로드이미지.height * 이미지스케일;
        ctx.drawImage(업로드이미지, 이미지위치.x, 이미지위치.y, w, h);
    }
    if (템플릿이미지) {
        ctx.drawImage(템플릿이미지, 0, 0, canvas.width, canvas.height);
    }
}



