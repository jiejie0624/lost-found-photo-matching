let clientPromise;
let authBaseUrl;
export const PRODUCTION_ORIGIN = "https://lost-found-photo-matching.vercel.app";

export async function getAuthClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      let response;
      try { response = await fetch("/api/config"); }
      catch { throw new Error("auth_service_error"); }
      let config;
      try { config = await response.json(); }
      catch { throw new Error("auth_service_error"); }
      if (!response.ok || !config || typeof config !== "object") throw new Error("auth_service_error");
      if (!response.ok || !config.auth_configured || !config.auth_url) {
        throw new Error("auth_not_configured");
      }
      authBaseUrl = config.auth_url.replace(/\/+$/, "");
      const { createAuthClient } = await import("https://esm.sh/@neondatabase/auth@0.5.0-beta?bundle");
      return createAuthClient(authBaseUrl);
    })();
  }
  return clientPromise;
}

export async function currentSession() {
  const auth = await getAuthClient();
  const result = await auth.getSession();
  if (result?.error) throw new Error(result.error.message || "无法读取登录状态。");
  return result?.data || result;
}

async function authPost(path, payload) {
  await getAuthClient();
  let response;
  try {
    response = await fetch(`${authBaseUrl}/${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("auth_service_error");
  }
  let result;
  try { result = await response.json(); } catch { result = null; }
  if (!response.ok || result?.error) {
    const message = result?.message || result?.error?.message || "auth_reset_failed";
    throw new Error(message);
  }
  return result;
}

export function requestPasswordReset(email, redirectTo) {
  return authPost("request-password-reset", { email, redirectTo });
}

export function resetPassword(token, newPassword) {
  return authPost("reset-password", { token, newPassword });
}

export async function getAccessToken() {
  await getAuthClient();
  const response = await fetch(`${authBaseUrl}/token`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  let payload = null;
  try { payload = await response.json(); } catch { /* Keep provider response details private. */ }
  const token = payload?.data?.token || payload?.token || payload?.data?.access_token;
  if (response.ok && typeof token === "string" && token.split(".").length === 3) return token;
  throw new Error("auth_failed");
}

export async function authorizedFetch(url, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}

export function friendlyAuthError(error, t = (_key, _values) => error?.message || "") {
  const message = error?.message || "暂时无法完成操作，请稍后再试。";
  if (/invalid origin/i.test(message)) {
    const currentOrigin = window.location.origin;
    if (currentOrigin !== PRODUCTION_ORIGIN && currentOrigin.endsWith(".vercel.app")) {
      return t("auth_preview_error", { url: `${PRODUCTION_ORIGIN}/login.html` });
    }
    return t("auth_origin_error", { url: `${PRODUCTION_ORIGIN}/login.html` });
  }
  return message;
}
