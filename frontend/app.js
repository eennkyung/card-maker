const API_URL = "/extract";
const COLOR_COUNT = 6;

const fileInput = document.getElementById("file-input");
const dropZone = document.getElementById("drop-zone");
const previewContainer = document.getElementById("preview-container");
const preview = document.getElementById("preview");
const emptyState = document.getElementById("empty-state");
const gradientOverlay = document.getElementById("gradient-overlay");
const cardText = document.getElementById("card-text");
const controls = document.getElementById("controls");
const swatches = document.getElementById("swatches");
const downloadBtn = document.getElementById("download-btn");

const inputTitle = document.getElementById("input-title");
const inputSubtitle = document.getElementById("input-subtitle");
const cardTitle = document.getElementById("card-title");
const cardSubtitle = document.getElementById("card-subtitle");
const countTitle = document.getElementById("count-title");
const countSubtitle = document.getElementById("count-subtitle");

const PLACEHOLDER_TITLE = "대표문구가 나타\n나는 자리입니다";
const PLACEHOLDER_SUBTITLE = "서브문구 나타나는 자리입니다";

let allColors = [];

// ── 텍스트 입력 → 카드 반영 ──
function syncText(textarea, cardEl, countEl, maxCharsPerLine, maxLines) {
  textarea.addEventListener("input", () => {
    const sel = textarea.selectionStart;
    const before = textarea.value;
    let lines = before.split("\n");

    // 줄 수 초과 제거
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
    }

    // 각 줄 처리: 초과 시 다음 줄로 넘기거나 자르기
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const chars = [...lines[i]];
      if (chars.length > maxCharsPerLine) {
        const current = chars.slice(0, maxCharsPerLine).join("");
        const overflow = chars.slice(maxCharsPerLine).join("");
        result.push(current);
        if (result.length < maxLines) {
          lines.splice(i + 1, 0, overflow);
        }
      } else {
        result.push(lines[i]);
      }
      if (result.length >= maxLines) break;
    }

    const after = result.join("\n");
    textarea.value = after;

    // 삽입된 \n 수만큼 커서 보정
    const addedNewlines = (after.match(/\n/g) || []).length - (before.match(/\n/g) || []).length;
    const newPos = Math.min(sel + addedNewlines, after.length);
    textarea.setSelectionRange(newPos, newPos);

    const total = [...after.replace(/\n/g, "")].length;
    countEl.textContent = `${total} / ${maxCharsPerLine * maxLines}`;
    cardEl.textContent = after;
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const lines = textarea.value.split("\n");
      if (lines.length >= maxLines) e.preventDefault();
    }
  });
}

syncText(inputTitle, cardTitle, countTitle, 9, 2);
syncText(inputSubtitle, cardSubtitle, countSubtitle, 17, 2);

// 입력 없으면 placeholder 문구 카드에 표시
function updateCardPlaceholder(textarea, cardEl, placeholder) {
  const val = textarea.value.trim();
  cardEl.textContent = val ? textarea.value : placeholder;
  cardEl.classList.toggle("card-placeholder", !val);
}

inputTitle.addEventListener("input", () => updateCardPlaceholder(inputTitle, cardTitle, PLACEHOLDER_TITLE));
inputSubtitle.addEventListener("input", () => updateCardPlaceholder(inputSubtitle, cardSubtitle, PLACEHOLDER_SUBTITLE));

// 이미지 업로드 후 placeholder 표시
function showCardPlaceholders() {
  if (!inputTitle.value.trim()) {
    cardTitle.textContent = PLACEHOLDER_TITLE;
    cardTitle.classList.add("card-placeholder");
  }
  if (!inputSubtitle.value.trim()) {
    cardSubtitle.textContent = PLACEHOLDER_SUBTITLE;
    cardSubtitle.classList.add("card-placeholder");
  }
}

// ── 업로드 ──
dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

async function handleFile(file) {
  if (!file.type.startsWith("image/")) return;

  preview.src = URL.createObjectURL(file);
  preview.style.transform = "translateY(-60px) scale(1.2)";
  preview.hidden = false;
  emptyState.hidden = true;
  clearGradient();
  showCardPlaceholders();

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}?count=${COLOR_COUNT}`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "오류가 발생했습니다.");
      return;
    }

    const data = await res.json();
    renderPalette(data.colors);
  } catch {
    alert("서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.");
  }
}

function renderPalette(colors) {
  allColors = colors;

  swatches.innerHTML = colors
    .map(
      (c, i) => `
      <div class="swatch${i === 0 ? " selected" : ""}" data-index="${i}">
        <div class="swatch-color" style="background:${c.hex}"></div>
        <span class="swatch-hex">${c.hex}</span>
      </div>
    `
    )
    .join("");

  swatches.querySelectorAll(".swatch").forEach((el) => {
    el.addEventListener("click", () => selectSwatch(el));
  });

  controls.hidden = false;
  downloadBtn.hidden = false;
  applyGradient(colors[0]);
}

function selectSwatch(el) {
  swatches.querySelectorAll(".swatch").forEach((s) => s.classList.remove("selected"));
  el.classList.add("selected");
  applyGradient(allColors[parseInt(el.dataset.index)]);
}

function clearGradient() {
  gradientOverlay.style.background = "";
}

function applyGradient(color) {
  gradientOverlay.style.background = `linear-gradient(to bottom, transparent 0%, ${color.hex} 100%)`;
}

// ── 다운로드 ──
downloadBtn.addEventListener("click", () => {
  const W = 232;
  const H = 309;
  const SCALE = 2;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // 1. 배경 흰색으로 채우기
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // 2. object-fit: cover 재현
  const imgW = preview.naturalWidth;
  const imgH = preview.naturalHeight;
  const coverScale = Math.max(W / imgW, H / imgH);
  const sw = W / coverScale;
  const sh = H / coverScale;
  const sx = (imgW - sw) / 2;
  const sy = (imgH - sh) / 2;

  // 3. CSS transform 재현: transform-origin center top, scale(1.2) 후 translateY(-60px)
  //    CSS는 scale → translate 순, Canvas는 역순으로 설정
  ctx.save();
  ctx.translate(W / 2, -60); // translateY(-60) + transform-origin x
  ctx.scale(1.2, 1.2);
  ctx.translate(-W / 2, 0);  // transform-origin 복원
  ctx.drawImage(preview, sx, sy, sw, sh, 0, 0, W, H);
  ctx.restore();

  // 3. 그라디언트: bottom: -8px, height: 154px
  //    top = 309 + 8 - 154 = 163, bottom edge = 317 (canvas 밖, 자연 클립)
  const selectedEl = swatches.querySelector(".swatch.selected");
  if (selectedEl) {
    const color = allColors[parseInt(selectedEl.dataset.index)];
    const r = parseInt(color.hex.slice(1, 3), 16);
    const g = parseInt(color.hex.slice(3, 5), 16);
    const b = parseInt(color.hex.slice(5, 7), 16);
    const gradTop = 163;
    const gradBottom = 317;
    const grad = ctx.createLinearGradient(0, gradTop, 0, gradBottom);
    grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},1)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, gradTop, W, H - gradTop);
  }

  const link = document.createElement("a");
  link.download = "card.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
