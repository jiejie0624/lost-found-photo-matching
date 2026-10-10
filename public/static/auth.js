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
  let result = null;
  let tokenError = null;
  try {
    // @neondatabase/auth exposes getJWTToken() for the API bearer JWT.
    // The session's `token` is only an opaque session identifier.
    if (typeof auth.getJWTToken === "function") {
      result = await auth.getJWTToken();
    }
  } catch (error) {
    tokenError = error instanceof Error ? error.message : String(error);
  }
  if (result?.error) {
    tokenError = result.error.message || "Neon Auth 暂时无法签发 API 凭证。";
  }

  const directToken = typeof result === "string"
    ? result
    : result?.data?.token || result?.data?.access_token || result?.token;
  if (typeof directToken === "string" && directToken.split(".").length === 3) {
    return directToken;
  }

  // Some SDK versions include the bearer JWT in getSession() instead.
  try {
    const sessionResult = await currentSession();
    const sessionToken = sessionResult?.session?.access_token
      || sessionResult?.session?.accessToken
      || sessionResult?.access_token
      || sessionResult?.accessToken;
    if (typeof sessionToken === "string" && sessionToken.split(".").length === 3) {
      return sessionToken;
    }
  } catch (error) {
    tokenError ||= error instanceof Error ? error.message : String(error);
  }

  throw new Error(`获取登录凭证失败：${tokenError || "请重新登录后再试。"}`);
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
