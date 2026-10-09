let clientPromise;

export async function getAuthClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const response = await fetch("/api/config");
      const config = await response.json();
      if (!response.ok || !config.auth_configured || !config.auth_url) {
        throw new Error("登录服务尚未启用。请先在 Neon 控制台启用 Auth，再部署网站。");
      }
      const { createAuthClient } = await import("https://esm.sh/@neondatabase/auth@0.5.0-beta?bundle");
      return createAuthClient(config.auth_url);
    })();
  }
  return clientPromise;
}

export async function getAccessToken() {
  const auth = await getAuthClient();
  let result;
  try {
    // Neon Auth's Better Auth client exposes the JWT plugin as `token()`.
    // `getSession()` returns session metadata; its `session.token` is not a
    // bearer JWT and must not be sent to our API.
    result = await auth.token();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`获取登录凭证失败：${detail}`);
  }
  if (result?.error) {
    throw new Error(`获取登录凭证失败：${result.error.message || "请重新登录。"}`);
  }
  const token = result?.data?.token
    || (typeof result?.data === "string" ? result.data : null)
    || result?.data?.session?.access_token
    || result?.data?.session?.token
    || result?.token;
  if (typeof token !== "string" || token.split(".").length !== 3) {
    throw new Error("无法取得有效登录凭证，请重新登录后再试。");
  }
  return token;
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
