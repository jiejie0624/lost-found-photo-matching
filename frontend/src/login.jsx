import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowUpRight, Check, CircleHelp, Eye, EyeOff, Leaf, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { currentSession, friendlyAuthError, getAuthClient } from "./auth.js";
import { LanguageProvider, LanguageSelect, useLanguage } from "./language.jsx";
import "./styles.css";

function LoginPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState("sign-in");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [configured, setConfigured] = useState(null);
  const registering = mode === "sign-up";

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
    event.preventDefault(); setBusy(true); setError(false); setStatus({ key: registering ? "auth_signup_busy" : "auth_login_busy" });
    const form = new FormData(event.currentTarget);
    try {
      const auth = await getAuthClient();
      const credentials = { email: String(form.get("email")).trim(), password: String(form.get("password")) };
      const result = registering
        ? await auth.signUp.email({ ...credentials, name: String(form.get("name")).trim() })
        : await auth.signIn.email(credentials);
      if (result?.error) throw new Error(result.error.message || t("auth_failed"));
      const session = await currentSession();
      if (!session?.user) throw new Error(t("auth_incomplete"));
      setStatus({ key: "auth_success" }); window.location.assign("/my-records.html");
    } catch (problem) { setStatus({ text: friendlyAuthError(problem, t) }); setError(true); }
    finally { setBusy(false); }
  }

  return <div className="auth-page"><header className="site-header auth-header"><a className="brand" href="/"><span className="brand-mark">拾</span><span>拾见<span className="brand-dot">.</span></span></a><div className="header-tools"><LanguageSelect /><a className="back-link" href="/"><ArrowLeft size={15} />{t("nav_home")}</a></div></header>
    <main className="auth-main">
      <div className="auth-art"><div className="auth-art-circle"><span className="auth-art-leaf"><Leaf size={34} /></span><span className="auth-art-spark">✳</span></div><p className="eyebrow">{t("auth_art_kicker")}</p><h1>{t("auth_art_a")}<br /><em>{t("auth_art_b")}</em></h1><p className="auth-art-text">{t("auth_art_text")}</p><div className="auth-benefit"><span><ShieldCheck size={17} /></span>{t("auth_benefit")}</div></div>
      <section className="auth-card"><div className="auth-card-heading"><span className="auth-card-icon"><LockKeyhole size={18} /></span><div><p className="eyebrow">{t("auth_tag")}</p><h2>{registering ? t("auth_create") : t("auth_welcome")}</h2></div></div>
        <p className="auth-description">{registering ? t("auth_intro_signup") : t("auth_intro_login")}</p>
        <form className="auth-form" onSubmit={submit}>
          {registering && <label className="auth-field"><span>{t("auth_name")}</span><div className="input-shell"><Sparkles size={17} /><input name="name" autoComplete="name" maxLength={80} required placeholder={t("auth_name_placeholder")} /></div></label>}
          <label className="auth-field"><span>{t("auth_email")}</span><div className="input-shell"><Mail size={17} /><input name="email" type="email" autoComplete="email" maxLength={254} required placeholder={t("auth_email_placeholder")} /></div></label>
          <label className="auth-field"><span>{t("auth_password")}</span><div className="input-shell"><LockKeyhole size={17} /><input name="password" type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} minLength={8} maxLength={128} required placeholder={t("auth_password_placeholder")} /><button className="password-toggle" type="button" aria-label={showPassword ? t("hide_password") : t("show_password")} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <button className="button button-primary auth-submit" type="submit" disabled={busy || configured === false}>{busy ? <><span className="spinner" />{t("auth_loading")}</> : <>{registering ? t("auth_signup") : t("auth_login")}<ArrowUpRight size={17} /></>}</button>
        </form>
        {status && <p className={`auth-status ${error ? "is-error" : ""}`} role="status" aria-live="polite">{!error && <Check size={15} />}{status.key ? t(status.key) : status.text}</p>}
        <p className="auth-switch">{registering ? t("auth_has_account") : t("auth_no_account")}<button type="button" onClick={() => { setMode(registering ? "sign-in" : "sign-up"); setStatus(null); setError(false); }}>{registering ? t("auth_switch_login") : t("auth_switch_signup")}</button></p>
        <div className="auth-safe"><ShieldCheck size={15} /><span>{t("auth_safe")}</span></div>
      </section>
    </main><footer className="auth-footer"><span>拾见 · {t("hero_kicker")}</span><span><CircleHelp size={14} />{t("auth_help")}</span></footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><LanguageProvider><LoginPage /></LanguageProvider></React.StrictMode>);
