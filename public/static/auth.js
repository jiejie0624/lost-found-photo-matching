let clientPromise;
let authBaseUrl;
const PRODUCTION_ORIGIN = "https://lost-found-photo-matching-fyp.vercel.app";

export function showProductionNotice() {
  const hostname = window.location.hostname.toLowerCase();
  if (window.location.origin === PRODUCTION_ORIGIN || !hostname.endsWith(".vercel.app")) return;

  const notice = document.createElement("aside");
  notice.setAttribute("role", "status");
  notice.style.cssText = "max-width:1240px;margin:0 auto;padding:12px 24px;background:#fff2d5;color:#664b18;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;font-size:13px";
  const message = document.createElement("span");
  message.textContent = "你现在打开的是 Vercel 预览版；登录和正式数据请使用正式网站。";
  const link = document.createElement("a");
  link.textContent = "前往正式网站 ↗";
  link.style.cssText = "font-weight:700;text-decoration:underline;text-underline-offset:3px";
  link.href = new URL(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
    PRODUCTION_ORIGIN,
  ).href;
  notice.append(message, link);
  document.querySelector(".topbar")?.insertAdjacentElement("afterend", notice);
}

export async function getAuthClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const response = await fetch("/api/config");
      const config = await response.json();
      if (!response.ok || !config.auth_configured || !config.auth_url) {
        throw new Error("登录服务尚未启用。请先在 Neon 控制台启用 Auth，再部署网站。");
      }
      authBaseUrl = config.auth_url.replace(/\/+$/, "");
      const { createAuthClient } = await import("https://esm.sh/@neondatabase/auth@0.5.0-beta?bundle");
      return createAuthClient(authBaseUrl);
    })();
  }
  return clientPromise;
}

export async function getAccessToken() {
  await getAuthClient();
  if (!authBaseUrl) throw new Error("登录服务尚未配置。");

  // Neon Auth's browser session cookie is opaque; exchange it for the short-lived
  // JWT used by this app's API. `credentials: include` sends the Auth cookie.
  const response = await fetch(`${authBaseUrl}/token`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Keep the error below limited to the HTTP status; never expose token payloads.
  }
  const token = payload?.data?.token || payload?.token || payload?.data?.access_token;
  if (response.ok && typeof token === "string" && token.split(".").length === 3) {
    return token;
  }
  throw new Error(`获取登录凭证失败：Neon Auth HTTP ${response.status}。请重新登录后再试。`);
}

export async function authorizedFetch(url, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}

export async function currentSession() {
  const auth = await getAuthClient();
  const result = await auth.getSession();
  if (result?.error) throw new Error(result.error.message || "无法读取登录状态。");
  return result?.data || result;
}
