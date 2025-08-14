// 전역 변수
let canvas = document.getElementById("미리보기");
let ctx = canvas.getContext("2d");
let 업로드이미지 = null;
let 템플릿이미지 = null;
let 현재모드 = "이동"; // 이동 / 그림
let 펜색 = document.getElementById("펜색상").value;
let 펜크기 = parseInt(document.getElementById("펜크기").value);
let 그림그리는중 = false;
let 이미지위치 = { x: 0, y: 0 };
let 드래그중 = false;
let 시작좌표 = { x: 0, y: 0 };

// 이미지 업로드
document.getElementById("이미지업로드").addEventListener("change", (e) => {
    let file = e.target.files[0];
    if (!file) {
        console.error("E100: 이미지 파일이 선택되지 않았습니다.");
        return;
    }
    let reader = new FileReader();
    reader.onload = (evt) => {
        업로드이미지 = new Image();
        업로드이미지.onload = () => {
            이미지위치 = { x: 0, y: 0 };
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
        템플릿이미지.onload = () => {
            그리기();
        };
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

// 캔버스 이동 & 그림
canvas.addEventListener("mousedown", (e) => {
    if (현재모드 === "이동") {
        드래그중 = true;
        시작좌표 = { x: e.offsetX - 이미지위치.x, y: e.offsetY - 이미지위치.y };
    } else {
        그림그리는중 = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (현재모드 === "이동" && 드래그중) {
        이미지위치.x = e.offsetX - 시작좌표.x;
        이미지위치.y = e.offsetY - 시작좌표.y;
        그리기();
    } else if (현재모드 === "그림" && 그림그리는중) {
        ctx.strokeStyle = 펜색;
        ctx.lineWidth = 펜크기;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
});

canvas.addEventListener("mouseup", () => {
    드래그중 = false;
    그림그리는중 = false;
});

// 최종 다운로드
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

// 그리기 함수
function 그리기() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (업로드이미지) {
        ctx.drawImage(업로드이미지, 이미지위치.x, 이미지위치.y);
    }
    if (템플릿이미지) {
        ctx.drawImage(템플릿이미지, 0, 0, canvas.width, canvas.height);
    }
}
