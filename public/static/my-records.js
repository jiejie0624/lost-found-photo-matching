import { getAccessToken, getAuthClient, currentSession } from "./auth.js";

const grid = document.querySelector("#my-records-grid");
const statusLine = document.querySelector("#records-status");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "日期未知" : new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(date);
}

function render(records) {
  if (!records.length) {
    grid.innerHTML = '<div class="empty-state">你还没有发布记录。需要寻找物品时，可以发布第一条线索。</div>';
    return;
  }
  grid.innerHTML = records.map((record) => {
    const closed = record.status === "closed";
    return `<article class="my-record-card">
      <img src="${escapeHtml(record.image_url)}" alt="${escapeHtml(record.title)}" loading="lazy">
      <div class="my-record-body"><div class="my-record-heading"><div><span class="my-record-kind ${record.kind === "found" ? "found" : ""}">${record.kind === "found" ? "已经拾获" : "正在寻找"}</span><span class="my-record-state">${closed ? "已关闭" : "公开中"}</span></div><small>发布于 ${formatDate(record.created_at)}</small></div>
      <h2>${escapeHtml(record.title)}</h2><p>${escapeHtml(record.location)} · ${escapeHtml(record.category)}</p><small>预计清理：${formatDate(record.expires_at)}</small>
      <div class="my-record-actions">${closed ? "" : `<button type="button" data-action="close" data-id="${escapeHtml(record.id)}">关闭线索</button>`}<button class="delete-record" type="button" data-action="delete" data-id="${escapeHtml(record.id)}">删除记录</button></div></div>
    </article>`;
  }).join("");
}

async function loadRecords() {
  let phase = "读取登录状态";
  try {
    const session = await currentSession();
    if (!session?.user) {
      window.location.replace("/login.html");
      return;
    }
    phase = "获取登录凭证";
    const token = await getAccessToken();
    phase = "读取个人记录";
    const response = await fetch("/api/me/records", {
      headers: { Authorization: `Bearer ${token}` },
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`记录接口返回了无法读取的内容（HTTP ${response.status}）。`);
    }
    if (!response.ok) {
      throw new Error(`读取记录接口失败（HTTP ${response.status}）：${payload.detail || "请稍后重试。"}`);
    }
    statusLine.textContent = `${session.user.name || session.user.email}，你有 ${payload.length} 条记录。`;
    render(payload);
  } catch (error) {
    statusLine.textContent = `${phase}失败：${error.message || "暂时无法读取记录。"}`;
    statusLine.classList.add("error");
  }
}

grid.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === "delete" && !window.confirm("删除后，记录和照片都会永久移除。确定继续吗？")) return;
  button.disabled = true;
  try {
    const response = await authorizedFetch(`/api/records/${encodeURIComponent(id)}${action === "close" ? "/close" : ""}`, {
      method: action === "close" ? "PATCH" : "DELETE",
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "操作失败，请稍后重试。");
    await loadRecords();
  } catch (error) {
    statusLine.textContent = error.message || "操作失败，请稍后重试。";
    statusLine.classList.add("error");
    button.disabled = false;
  }
});

document.querySelector("#sign-out").addEventListener("click", async () => {
  const button = document.querySelector("#sign-out");
  button.disabled = true;
  try {
    const auth = await getAuthClient();
    await auth.signOut();
  } finally {
    window.location.assign("/login.html");
  }
});

loadRecords();
