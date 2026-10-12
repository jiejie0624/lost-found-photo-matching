import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, ArrowUpRight, Check, Clock3, Compass, LogOut, Mail, MapPin, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { authorizedFetch, currentSession, getAuthClient } from "./auth.js";
import { LanguageProvider, LanguageSelect, useLanguage } from "./language.jsx";
import "./styles.css";

function date(value, locale, unknown) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? unknown : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parsed);
}

function MyRecordsPage() {
  const { t, locale, categoryLabel, apiError } = useLanguage();
  const [records, setRecords] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [userLabel, setUserLabel] = useState("");

  const loadRecords = useCallback(async () => {
    setError(false); setLoading(true);
    try {
      const session = await currentSession();
      if (!session?.user) { window.location.replace("/login.html"); return; }
      const response = await authorizedFetch("/api/me/records");
      let payload = null; try { payload = await response.json(); } catch { /* Keep the API status. */ }
      if (!response.ok || !Array.isArray(payload)) throw new Error(payload?.detail || `HTTP ${response.status}`);
      const contactResponse = await authorizedFetch("/api/me/contact-requests");
      let contactPayload = null; try { contactPayload = await contactResponse.json(); } catch { /* Keep the API status. */ }
      if (!contactResponse.ok || !Array.isArray(contactPayload)) throw new Error(contactPayload?.detail || `HTTP ${contactResponse.status}`);
      setRecords(payload); setContactRequests(contactPayload); setUserLabel(session.user.name || session.user.email || ""); setStatus(t("mine_count", { count: payload.length }));
    } catch (problem) { setStatus(problem.message.startsWith("HTTP ") ? t("mine_error") : apiError(problem.message || t("mine_error"))); setError(true); }
    finally { setLoading(false); }
  }, [apiError, t]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  async function changeRecord(record, action) {
    if (action === "delete" && !window.confirm(t("mine_delete_confirm"))) return;
    setBusyId(record.id); setError(false);
    try {
      const url = `/api/records/${encodeURIComponent(record.id)}${action === "close" ? "/close" : ""}`;
      const response = await authorizedFetch(url, { method: action === "close" ? "PATCH" : "DELETE" });
      let payload = null; try { payload = await response.json(); } catch { /* Keep the API status. */ }
      if (!response.ok) throw new Error(payload?.detail || `HTTP ${response.status}`);
      await loadRecords();
    } catch (problem) { setStatus(problem.message.startsWith("HTTP ") ? (action === "close" ? t("mine_close_error") : t("mine_delete_error")) : apiError(problem.message)); setError(true); }
    finally { setBusyId(""); }
  }

  async function signOut() {
    try { const auth = await getAuthClient(); await auth.signOut(); }
    finally { window.location.assign("/login.html"); }
  }

  return <div className="records-page"><header className="site-header"><a className="brand" href="/"><span className="brand-mark">拾</span><span>拾见<span className="brand-dot">.</span></span></a><nav className="main-nav records-nav"><a href="/#board">{t("nav_board")}</a><a href="/#publish" className="button button-small button-primary">{t("nav_publish")} <ArrowUpRight size={16} /></a><button type="button" className="sign-out" onClick={signOut}><LogOut size={14} /><span>{t("signout")}</span></button></nav><div className="header-tools"><LanguageSelect /></div></header>
    <main className="my-records-main section-wrap"><div className="records-page-heading"><div><p className="eyebrow">{t("mine_kicker")}</p><h1>{t("mine_title")}<span className="title-period">.</span></h1><p className="records-welcome">{userLabel ? t("mine_welcome", { user: userLabel }) : t("mine_generic_welcome")}</p></div><a className="button button-primary" href="/#publish"><Plus size={17} />{t("mine_publish")}</a></div>
      <div className="records-privacy"><ShieldCheck size={18} /><p>{t("mine_privacy")}</p></div>
      {contactRequests.length > 0 && <section className="contact-requests"><h2>{t("contact_incoming_title", { count: contactRequests.length })}</h2><div className="contact-request-list">{contactRequests.map((request) => <article className="contact-request" key={request.id}><div className="contact-request-top"><strong>{t("contact_related_to", { title: request.record_title })}</strong><span>{date(request.created_at, locale, t("time_unknown"))}</span></div><p className="contact-request-message">{request.message}</p><a className="contact-request-reply" href={`mailto:${encodeURIComponent(request.sender_email)}?subject=${encodeURIComponent(t("contact_reply_subject", { title: request.record_title }))}`}><Mail size={14} />{request.sender_email}</a></article>)}</div></section>}
      <div className={`my-record-status ${error ? "is-error" : ""}`} role="status" aria-live="polite">{!error && !loading && <Check size={15} />}{loading ? t("mine_loading") : !error ? t("mine_count", { count: records.length }) : status}</div>
      {loading ? <div className="owned-records-grid">{[1, 2].map((key) => <div className="owned-skeleton" key={key}><div /><span /><span /></div>)}</div> : error ? <div className="empty-panel"><span className="empty-icon"><Compass /></span><b>{t("mine_error")}</b><p>{status}</p><button className="button button-secondary" onClick={loadRecords}>{t("reload")} <ArrowRight size={15} /></button></div> : records.length === 0 ? <div className="empty-panel records-empty"><span className="empty-icon"><Compass /></span><b>{t("mine_empty_title")}</b><p>{t("mine_empty_text")}</p><a className="button button-primary" href="/#publish"><Plus size={17} />{t("mine_first")}</a></div> : <div className="owned-records-grid">{records.map((record) => <article className={`owned-card ${record.status === "closed" ? "is-closed" : ""}`} key={record.id}>
        <div className="owned-image"><img src={record.image_url} alt={record.title} loading="lazy" /><span className={`record-type ${record.kind === "found" ? "is-found" : ""}`}>{t(record.kind === "found" ? "type_found" : "type_lost")}</span></div>
        <div className="owned-info"><div className="owned-topline"><span className={`owned-state ${record.status === "closed" ? "closed" : ""}`}><span />{t(record.status === "closed" ? "mine_closed" : "mine_open")}</span><small>{t("mine_published", { date: date(record.created_at, locale, t("time_unknown")) })}</small></div><h2>{record.title}</h2><p className="record-place"><MapPin size={14} />{record.location} · {categoryLabel(record.category)}</p><p className="owned-expiry"><Clock3 size={14} />{t("mine_expiry", { date: date(record.expires_at, locale, t("time_unknown")) })}</p><div className="owned-actions">{record.status !== "closed" && <button type="button" onClick={() => changeRecord(record, "close")} disabled={busyId === record.id}><Check size={15} />{t("mine_close")}</button>}<button type="button" className="delete-action" onClick={() => changeRecord(record, "delete")} disabled={busyId === record.id}><Trash2 size={15} />{busyId === record.id ? t("mine_delete_busy") : t("mine_delete")}</button></div></div>
      </article>)}</div>}
    </main><footer className="site-footer section-wrap"><a className="brand" href="/"><span className="brand-mark">拾</span><span>拾见<span className="brand-dot">.</span></span></a><p>{t("footer_short")}</p><a href="/">{t("nav_home")} <ArrowRight size={14} /></a></footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><LanguageProvider><MyRecordsPage /></LanguageProvider></React.StrictMode>);
