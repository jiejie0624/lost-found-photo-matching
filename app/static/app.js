const form = document.querySelector("#record-form");
const statusLine = document.querySelector("#form-status");
const fileInput = form.elements.image;
const imagePreview = document.querySelector("#image-preview");
const uploadZone = document.querySelector("#upload-zone");
const recordsGrid = document.querySelector("#records-grid");
const resultRegion = document.querySelector("#match-results");
let activeFilter = "all";
let currentRecords = [];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未注明";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function card(record, showScore = false) {
  const found = record.kind === "found";
  const badge = found ? "已经拾获" : "正在寻找";
  const score = showScore ? `<span class="match-score">${record.match_score}% 接近</span>` : "";
  const evidence = showScore && record.match_evidence?.length
    ? `<p class="record-description">${record.match_evidence.map(escapeHtml).join(" · ")}</p>`
    : (record.description ? `<p class="record-description">${escapeHtml(record.description)}</p>` : "");
  return `<article class="record-card">
    <div class="record-image"><img src="${escapeHtml(record.image_url)}" alt="${escapeHtml(record.title)}" loading="lazy"><span class="kind-badge ${found ? "found" : ""}">${badge}</span></div>
    <div class="record-content"><div class="record-meta"><strong>${escapeHtml(record.category)}</strong><span>${formatDate(record.occurred_at)} ${score}</span></div>
    <h3>${escapeHtml(record.title)}</h3><div class="record-detail"><span>⌖</span>${escapeHtml(record.location)}</div>
    ${record.color ? `<div class="record-detail"><span>◉</span>${escapeHtml(record.color)}</div>` : ""}${evidence}</div>
  </article>`;
}

function renderRecords() {
  const visible = activeFilter === "all" ? currentRecords : currentRecords.filter((record) => record.kind === activeFilter);
  document.querySelector("#record-count").textContent = String(visible.length);
  recordsGrid.innerHTML = visible.length
    ? visible.map((record) => card(record)).join("")
    : `<div class="empty-state">这里还没有记录。发布第一条线索，帮社区开始寻找。</div>`;
}

async function loadRecords() {
  try {
    const response = await fetch("/api/records");
    if (!response.ok) throw new Error("记录暂时无法加载");
    currentRecords = await response.json();
    renderRecords();
  } catch (error) {
    recordsGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}，请稍后刷新页面。</div>`;
  }
}

document.querySelectorAll(".kind-option").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".kind-option").forEach((option) => option.classList.remove("active"));
    button.classList.add("active");
    form.elements.kind.value = button.dataset.kind;
  });
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((filter) => filter.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderRecords();
  });
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) {
    uploadZone.classList.remove("has-image");
    imagePreview.removeAttribute("src");
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    fileInput.value = "";
    statusLine.textContent = "图片不能超过 8 MB。";
    statusLine.classList.add("error");
    return;
  }
  imagePreview.src = URL.createObjectURL(file);
  uploadZone.classList.add("has-image");
  document.querySelector("#upload-title").textContent = file.name;
  statusLine.textContent = "";
  statusLine.classList.remove("error");
});

uploadZone.addEventListener("dragover", (event) => { event.preventDefault(); uploadZone.classList.add("dragover"); });
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
uploadZone.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadZone.classList.remove("dragover");
  const file = event.dataTransfer.files?.[0];
  if (!file) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;
  fileInput.dispatchEvent(new Event("change"));
});

form.elements.occurred_at.value = (() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
})();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusLine.classList.remove("error");
  resultRegion.innerHTML = "";
  const submit = form.querySelector(".submit-button");
  submit.disabled = true;
  submit.innerHTML = "正在整理线索… <span>✦</span>";
  statusLine.textContent = "正在保存记录并寻找相似线索。";
  try {
    const response = await fetch("/api/records", { method: "POST", body: new FormData(form) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "提交失败，请检查填写内容。");
    const results = payload.matches || [];
    const analysisText = payload.analysis_status === "analyzed"
      ? "照片特征分析完成"
      : payload.analysis_status === "unavailable"
        ? "照片分析暂不可用，已用表单信息继续匹配"
        : "未配置视觉 API，已用表单信息完成基础匹配";
    statusLine.textContent = `记录已发布。${analysisText}。`;
    resultRegion.innerHTML = `<div class="result-heading"><h3>${results.length ? "找到的可能线索" : "记录已保存"}</h3><p>${results.length ? "这些只是参考，请结合物品细节自行确认。" : "之后有相反类型的新记录时，可以再次查看。"}</p></div>${results.length ? `<div class="result-grid">${results.map((record) => card(record, true)).join("")}</div>` : ""}`;
    form.reset();
    form.elements.kind.value = "lost";
    document.querySelectorAll(".kind-option").forEach((option) => option.classList.toggle("active", option.dataset.kind === "lost"));
    uploadZone.classList.remove("has-image");
    imagePreview.removeAttribute("src");
    document.querySelector("#upload-title").textContent = "拖放照片到这里，或点击上传";
    form.elements.occurred_at.value = (() => {
      const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); return now.toISOString().slice(0, 16);
    })();
    await loadRecords();
    resultRegion.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    statusLine.textContent = error.message;
    statusLine.classList.add("error");
  } finally {
    submit.disabled = false;
    submit.innerHTML = "寻找可能的匹配 <span>↗</span>";
  }
});

loadRecords();
