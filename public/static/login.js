import { getAuthClient, currentSession, showProductionNotice } from "./auth.js";

showProductionNotice();

const form = document.querySelector("#auth-form");
const statusLine = document.querySelector("#auth-status");
const submit = document.querySelector("#auth-submit");
const title = document.querySelector("#auth-title");
const nameField = document.querySelector("#name-field");
const switchCopy = document.querySelector("#switch-copy");
const switchMode = document.querySelector("#switch-mode");
let mode = "sign-in";
const PRODUCTION_ORIGIN = "https://lost-found-photo-matching-fyp.vercel.app";

function friendlyAuthError(error) {
  const message = error?.message || "暂时无法完成操作，请稍后再试。";
  if (/invalid origin/i.test(message)) {
    const currentOrigin = window.location.origin;
    if (currentOrigin !== PRODUCTION_ORIGIN && currentOrigin.endsWith(".vercel.app")) {
      return `当前是 Vercel 预览网址，登录服务不接受这个来源。请打开正式网站：${PRODUCTION_ORIGIN}/login.html`;
    }
    return `Neon Auth 拒绝了这个网站来源：${currentOrigin}。请使用正式网址 ${PRODUCTION_ORIGIN}/login.html；如果你已经在正式网址，请检查 Vercel 当前部署连接的 Neon Auth 分支是否信任这个来源。`;
  }
  return message;
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "sign-up";
  title.textContent = registering ? "创建账号" : "欢迎回来";
  nameField.hidden = !registering;
  form.elements.name.required = registering;
  form.elements.password.autocomplete = registering ? "new-password" : "current-password";
  submit.innerHTML = registering ? "注册并继续 <span>↗</span>" : "登录 <span>↗</span>";
  switchCopy.textContent = registering ? "已经有账号？" : "还没有账号？";
  switchMode.textContent = registering ? "返回登录" : "创建账号";
  statusLine.textContent = "";
  statusLine.classList.remove("error");
}

switchMode.addEventListener("click", () => setMode(mode === "sign-in" ? "sign-up" : "sign-in"));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusLine.classList.remove("error");
  statusLine.textContent = mode === "sign-up" ? "正在创建账号…" : "正在登录…";
  submit.disabled = true;
  try {
    const auth = await getAuthClient();
    const credentials = {
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
    };
    const result = mode === "sign-up"
      ? await auth.signUp.email({ ...credentials, name: form.elements.name.value.trim() })
      : await auth.signIn.email(credentials);
    if (result?.error) throw new Error(result.error.message || "认证失败，请检查邮箱和密码。");
    const session = await currentSession();
    if (!session?.user) throw new Error("账号已创建，但还未完成登录。请登录后继续。");
    statusLine.textContent = "登录成功，正在打开你的记录…";
    window.location.assign("/my-records.html");
  } catch (error) {
    statusLine.textContent = friendlyAuthError(error);
    statusLine.classList.add("error");
  } finally {
    submit.disabled = false;
  }
});

try {
  const configResponse = await fetch("/api/config");
  const config = await configResponse.json();
  if (!config.auth_configured) {
    statusLine.textContent = "登录还未启用：请在 Neon 控制台开启 Auth 并配置后端环境变量。";
    statusLine.classList.add("error");
    submit.disabled = true;
  } else {
    const session = await currentSession();
    if (session?.user) {
      window.location.replace("/my-records.html");
    }
  }
} catch (error) {
  statusLine.textContent = error.message || "暂时无法连接登录服务。";
  statusLine.classList.add("error");
  submit.disabled = true;
}
