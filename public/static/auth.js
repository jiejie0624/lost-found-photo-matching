let clientPromise;
let authBaseUrl;

export async function getAuthClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const response = await fetch("/api/config");
      const config = await response.json();
      if (!response.ok || !config.auth_configured || !config.auth_url) {
        throw new Error("登录服务尚未启用。请先在 Neon 控制台启用 Auth，再部署网站。");
      }
      authBaseUrl = config.auth_url.replace(/\/+$/, "");
      const originalFetch = globalThis.fetch;
      const authOrigin = new URL(authBaseUrl).origin;
      const tracedFetch = async (input, init) => {
        const requestUrl = new URL(input instanceof Request ? input.url : String(input), authBaseUrl);
        try {
          const result = await originalFetch.call(globalThis, input, init);
          if (requestUrl.origin === authOrigin && !result.ok) {
            console.warn(`[Neon Auth] ${requestUrl.pathname} returned HTTP ${result.status}`);
          }
          return result;
        } catch (error) {
          if (requestUrl.origin === authOrigin) {
            console.warn(`[Neon Auth] ${requestUrl.pathname} request failed (${error?.name || "Error"})`);
          }
          throw error;
        }
      };
      globalThis.fetch = tracedFetch;
      try {
        const { createAuthClient } = await import("https://esm.sh/@neondatabase/auth@0.5.0-beta?bundle");
        return createAuthClient(authBaseUrl);
      } finally {
        globalThis.fetch = originalFetch;
      }
    })();
  }
  return clientPromise;
}

export async function getAccessToken() {
  const auth = await getAuthClient();
  if (typeof auth.getJWTToken !== "function") {
    throw new Error("当前 Neon Auth SDK 不支持获取登录凭证，请刷新页面或联系管理员。");
  }
  const token = await auth.getJWTToken();
  if (typeof token === "string" && token.split(".").length === 3) return token;
  throw new Error("没有取得有效登录凭证，请重新登录后再试。");
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
