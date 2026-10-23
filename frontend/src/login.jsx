import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowUpRight, Check, CircleHelp, Eye, EyeOff, Leaf, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { currentSession, friendlyAuthError, getAuthClient, requestPasswordReset, resetPassword } from "./auth.js";
import { LanguageProvider, LanguageSelect, useLanguage } from "./language.jsx";
import "./styles.css";

function errorCode(error) {
  return String(error?.code || error?.error?.code || "").toUpperCase();
}

function errorStatus(error) {
  return Number(error?.status || error?.statusCode || error?.error?.status || 0);
}

function isInvalidCredentials(error) {
  const code = errorCode(error);
  return ["INVALID_EMAIL_OR_PASSWORD", "INVALID_PASSWORD", "USER_NOT_FOUND", "CREDENTIAL_ACCOUNT_NOT_FOUND"].includes(code)
    || errorStatus(error) === 401
    || /invalid email or password|invalid credentials|user not found/i.test(String(error?.message || ""));
}

function isEmailUnverified(error) {
  return errorCode(error) === "EMAIL_NOT_VERIFIED"
    || (errorStatus(error) === 403 && /verif/i.test(String(error?.message || "")));
}

function isExistingAccount(error) {
  return ["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "EMAIL_ALREADY_EXISTS"].includes(errorCode(error))
    || /already exists|already registered|email is taken/i.test(String(error?.message || ""));
}

async function attemptEmailSignIn(auth, credentials) {
  try {
    const result = await auth.signIn.email(credentials);
    if (!result?.error) return { signedIn: true };
    if (isEmailUnverified(result.error)) return { unverified: true };
    if (isInvalidCredentials(result.error)) return { signedIn: false };
    throw result.error;
  } catch (error) {
    if (isEmailUnverified(error)) return { unverified: true };
    if (isInvalidCredentials(error)) return { signedIn: false };
    throw error;
  }
}

function accountNameFromEmail(email) {
  return email.split("@")[0].replace(/[._+-]+/g, " ").trim().slice(0, 80) || "Shijian User";
}

function LoginPage() {
  const { t } = useLanguage();
  const query = new URLSearchParams(window.location.search);
  const resetToken = query.get("token");
  const resetFlow = query.get("reset") === "1";
  const [mode, setMode] = useState(() => resetToken || resetFlow ? "reset-password" : "sign-in");
  const [status, setStatus] = useState(() => resetFlow && !resetToken ? { key: "auth_reset_link_invalid" } : null);
  const [error, setError] = useState(() => resetFlow && !resetToken);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [configured, setConfigured] = useState(null);
  const forgotPassword = mode === "forgot-password";
  const resettingPassword = mode === "reset-password";

  useEffect(() => {
    let active = true;
    fetch("/api/config").then((response) => response.json()).then(async (config) => {
      if (!active) return;
      setConfigured(Boolean(config.auth_configured));
      if (!config.auth_configured) { setStatus({ key: "auth_not_configured" }); setError(true); return; }
      const session = await currentSession();
      if (active && session?.user) window.location.replace("/my-records.html");
    }).catch(() => { if (active) { setStatus({ key: "auth_service_error" }); setError(true); } });
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(false); setStatus({ key: forgotPassword || resettingPassword ? "auth_loading" : "auth_login_busy" });
    const form = new FormData(event.currentTarget);
    try {
      const email = String(form.get("email") || "").trim();
      if (forgotPassword) {
        const redirectTo = `${window.location.origin}/login.html?reset=1`;
        await requestPasswordReset(email, redirectTo);
        setStatus({ key: "auth_reset_email_sent" });
        setError(false);
        return;
      }
      if (resettingPassword) {
        const password = String(form.get("password") || "");
        const confirmation = String(form.get("confirm-password") || "");
        if (!resetToken) throw new Error("auth_reset_link_invalid");
        if (password !== confirmation) throw new Error("auth_reset_password_mismatch");
        await resetPassword(resetToken, password);
        window.history.replaceState({}, "", "/login.html");
        setMode("sign-in");
        setStatus({ key: "auth_reset_success" });
        setError(false);
        return;
      }
      const auth = await getAuthClient();
      const credentials = { email, password: String(form.get("password")) };
      let createdAccount = false;
      const signInResult = await attemptEmailSignIn(auth, credentials);
      if (signInResult.unverified) {
        setStatus({ key: "auth_email_not_verified" }); setError(false); return;
      }
      if (!signInResult.signedIn) {
        setStatus({ key: "auth_signup_busy" });
        let signUpResult;
        try { signUpResult = await auth.signUp.email({ ...credentials, name: accountNameFromEmail(email) }); }
        catch (signupError) {
          if (isExistingAccount(signupError)) throw new Error("auth_credentials_or_reset");
          throw signupError;
        }
        if (signUpResult?.error) {
          if (isExistingAccount(signUpResult.error)) throw new Error("auth_credentials_or_reset");
          throw new Error(signUpResult.error.message || t("auth_failed"));
        }
        createdAccount = true;
      }
      let session = await currentSession();
      if (createdAccount && !session?.user) {
        const retryResult = await attemptEmailSignIn(auth, credentials);
        if (retryResult.unverified) {
          setStatus({ key: "auth_email_not_verified" }); setError(false); return;
        }
        if (retryResult.signedIn) session = await currentSession();
      }
      if (!session?.user) {
        if (createdAccount) { setStatus({ key: "auth_signup_created" }); setError(false); return; }
        throw new Error(t("auth_incomplete"));
      }
      setStatus({ key: "auth_success" }); window.location.assign("/my-records.html");
    } catch (problem) {
      const known = ["auth_reset_failed", "auth_reset_link_invalid", "auth_reset_password_mismatch", "auth_credentials_or_reset"].includes(problem?.message);
      setStatus(known ? { key: problem.message } : { text: friendlyAuthError(problem, t) });
      setError(true);
    }
    finally { setBusy(false); }
  }

  return <div className="auth-page"><header className="site-header auth-header"><a className="brand" href="/"><span className="brand-mark">拾</span><span>拾见<span className="brand-dot">.</span></span></a><div className="header-tools"><LanguageSelect /><a className="back-link" href="/"><ArrowLeft size={15} />{t("nav_home")}</a></div></header>
    <main className="auth-main">
      <div className="auth-art"><div className="auth-art-circle"><span className="auth-art-leaf"><Leaf size={34} /></span><span className="auth-art-spark">✳</span></div><p className="eyebrow">{t("auth_art_kicker")}</p><h1>{t("auth_art_a")}<br /><em>{t("auth_art_b")}</em></h1><p className="auth-art-text">{t("auth_art_text")}</p><div className="auth-benefit"><span><ShieldCheck size={17} /></span>{t("auth_benefit")}</div></div>
      <section className="auth-card"><div className="auth-card-heading"><span className="auth-card-icon"><LockKeyhole size={18} /></span><div><p className="eyebrow">{t("auth_tag")}</p><h2>{forgotPassword ? t("auth_forgot_title") : resettingPassword ? t("auth_reset_title") : t("auth_welcome")}</h2></div></div>
        <p className="auth-description">{forgotPassword ? t("auth_forgot_intro") : resettingPassword ? t("auth_reset_intro") : t("auth_intro_login")}</p>
        <form className="auth-form" onSubmit={submit}>
          {!resettingPassword && <label className="auth-field"><span>{t("auth_email")}</span><div className="input-shell"><Mail size={17} /><input name="email" type="email" autoComplete="email" maxLength={254} required placeholder={t("auth_email_placeholder")} /></div></label>}
          {!forgotPassword && <label className="auth-field"><span>{t("auth_password")}</span><div className="input-shell"><LockKeyhole size={17} /><input name="password" type={showPassword ? "text" : "password"} autoComplete={resettingPassword ? "new-password" : "current-password"} minLength={8} maxLength={128} required placeholder={t("auth_password_placeholder")} /><button className="password-toggle" type="button" aria-label={showPassword ? t("hide_password") : t("show_password")} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}
          {resettingPassword && <label className="auth-field"><span>{t("auth_confirm_password")}</span><div className="input-shell"><LockKeyhole size={17} /><input name="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required placeholder={t("auth_confirm_password_placeholder")} /></div></label>}
          {!forgotPassword && !resettingPassword && <button className="auth-forgot-link" type="button" onClick={() => { setMode("forgot-password"); setStatus(null); setError(false); }}>{t("auth_forgot_link")}</button>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy || configured === false}>{busy ? <><span className="spinner" />{t("auth_loading")}</> : <>{forgotPassword ? t("auth_send_reset") : resettingPassword ? t("auth_save_password") : t("auth_login")}<ArrowUpRight size={17} /></>}</button>
        </form>
        {status && <p className={`auth-status ${error ? "is-error" : ""}`} role="status" aria-live="polite">{!error && <Check size={15} />}{status.key ? t(status.key) : status.text}</p>}
        {(forgotPassword || resettingPassword) && <p className="auth-switch">{t("auth_has_account")}<button type="button" onClick={() => { setMode("sign-in"); setStatus(null); setError(false); }}>{t("auth_switch_login")}</button></p>}
        <div className="auth-safe"><ShieldCheck size={15} /><span>{t("auth_safe")}</span></div>
      </section>
    </main><footer className="auth-footer"><span>拾见 · {t("hero_kicker")}</span><span><CircleHelp size={14} />{t("auth_help")}</span></footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><LanguageProvider><LoginPage /></LanguageProvider></React.StrictMode>);
