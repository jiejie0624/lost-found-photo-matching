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
  let token;
  try {
    token = await auth.getJWTToken?.();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`获取登录凭证失败：${detail}`);
  }
  if (!token) throw new Error("请先登录后再发布记录。");
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
