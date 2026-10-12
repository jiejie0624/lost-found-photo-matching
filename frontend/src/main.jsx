import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronLeft,
  ChevronRight, Clock3, Compass, ImagePlus, Mail, MapPin, MessageCircle,
  Search, Send, ShieldCheck, Sparkles, Upload, X,
} from "lucide-react";
import { authorizedFetch, currentSession, PRODUCTION_ORIGIN } from "./auth.js";
import { LanguageProvider, LanguageSelect, useLanguage } from "./language.jsx";
import "./styles.css";

const CATEGORIES = ["电子产品", "证件与卡片", "钥匙", "包袋", "衣物", "水瓶与餐具", "书籍文具", "饰品", "其他"];

function PreviewNotice() {
  const { language } = useLanguage();
  if (window.location.origin === PRODUCTION_ORIGIN || !window.location.hostname.endsWith(".vercel.app")) return null;
  return <div className="preview-notice">{language === "zh" ? "你正在查看 Vercel 预览版。" : language === "ms" ? "Anda sedang melihat pratonton Vercel." : "You’re viewing a Vercel preview."}<a href={new URL(window.location.pathname, PRODUCTION_ORIGIN)}>{language === "zh" ? "前往正式网站" : language === "ms" ? "Buka laman rasmi" : "Open the live site"} <ArrowUpRight size={14} /></a></div>;
}

function Header() {
  const { t } = useLanguage();
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { currentSession().then((session) => setSignedIn(Boolean(session?.user))).catch(() => {}); }, []);
  return <>
    <PreviewNotice />
    <header className="site-header">
      <a className="brand" href="/" aria-label="拾见首页"><span className="brand-mark">拾</span><span>拾见<span className="brand-dot">.</span></span></a>
      <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="主导航">
        <a href="#board" onClick={() => setMenuOpen(false)}>{t("nav_board")}</a><a href="#how" onClick={() => setMenuOpen(false)}>{t("nav_how")}</a>
        <a className="nav-account" href={signedIn ? "/my-records.html" : "/login.html"}>{signedIn ? t("nav_mine") : t("nav_login")}</a>
        <a className="button button-small button-primary nav-publish" href="#publish" onClick={() => setMenuOpen(false)}>{t("nav_publish")} <ArrowUpRight size={16} /></a>
      </nav>
      <div className="header-tools"><LanguageSelect /><button className="mobile-menu-button" aria-label={menuOpen ? "关闭导航" : "打开导航"} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X /> : <Compass />}</button></div>
    </header>
  </>;
}

function HeroArt() {
  const { t } = useLanguage();
  return <div className="hero-visual" aria-label="一张物品照片和相似线索示意图">
    <div className="visual-glow" />
    <div className="visual-grid" />
    <div className="art-label art-label-top"><span className="art-label-icon"><Sparkles size={16} /></span><span><b>{t("art_top")}</b><small>{t("art_details")}</small></span></div>
    <div className="art-photo"><div className="art-photo-scene"><div className="art-sun" /><div className="art-bottle"><span className="bottle-cap" /><span className="bottle-shine" /><span className="bottle-label">DAY<br />TRIP</span></div><span className="art-shadow" /></div><div className="art-photo-caption"><span>{t("art_found")}</span><span>{t("art_today")}</span></div></div>
    <div className="art-match"><span className="art-match-check"><Check size={15} /></span><span><b>{t("art_match")}</b><small>{t("art_evidence")}</small></span><ArrowUpRight size={17} /></div>
    <span className="art-sparkle art-sparkle-one">✳</span><span className="art-sparkle art-sparkle-two">✦</span>
  </div>;
}

function Hero() {
  const { t } = useLanguage();
  return <section className="hero section-wrap">
    <div className="hero-copy">
      <p className="eyebrow"><span className="eyebrow-line" />{t("hero_kicker")}</p>
      <h1>{t("hero_title_a")}<br /><span>{t("hero_title_b")}</span></h1>
      <p className="hero-intro">{t("hero_intro")}</p>
      <div className="hero-actions"><a className="button button-primary" href="#publish">{t("hero_publish")} <ArrowUpRight size={17} /></a><a className="quiet-link" href="#board">{t("hero_browse")} <ArrowDown size={15} /></a></div>
      <div className="hero-trust"><span className="trust-icon"><ShieldCheck size={16} /></span><span>{t("hero_trust")}</span></div>
    </div>
    <HeroArt />
    <a href="#publish" className="hero-scroll" aria-label={t("scroll")}><span />{t("scroll")}</a>
  </section>;
}

function Field({ label, hint, children, className = "" }) {
  return <label className={`field ${className}`}><span className="field-label">{label}{hint && <small>{hint}</small>}</span>{children}</label>;
}

function DateTimePicker({ value, onChange }) {
  const { locale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const [yearText, monthText] = value.slice(0, 10).split("-");
  const selected = new Date(Number(yearText), Number(monthText) - 1, Number(value.slice(8, 10)));
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const monthName = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(month);
  const selectedLabel = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(selected);
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, 7 + index)));
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = new Date();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

  useEffect(() => {
    if (!open) return undefined;
    function dismiss(event) {
      if (event.type === "keydown" && event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
      if (event.type === "pointerdown" && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", dismiss); };
  }, [open]);

  function chooseDay(day) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(`${datePart}T${value.slice(11, 16)}`);
  }
  function shiftMonth(amount) { setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1)); }
  function chooseToday() {
    const datePart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    onChange(`${datePart}T${value.slice(11, 16)}`);
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return <div className="datetime-picker" ref={rootRef}>
    <button ref={triggerRef} className="datetime-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <CalendarDays size={17} aria-hidden="true" /><span>{selectedLabel}</span><span className="datetime-time">{value.slice(11, 16)}</span><ChevronRight className={open ? "datetime-chevron is-open" : "datetime-chevron"} size={16} aria-hidden="true" />
    </button>
    {open && <div className="calendar-popover" role="dialog" aria-label={t("field_time")}>
      <div className="calendar-heading"><button type="button" aria-label={t("previous_month")} onClick={() => shiftMonth(-1)}><ChevronLeft size={17} /></button><strong>{monthName}</strong><button type="button" aria-label={t("next_month")} onClick={() => shiftMonth(1)}><ChevronRight size={17} /></button></div>
      <div className="calendar-grid calendar-weekdays" aria-hidden="true">{weekdays.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}</div>
      <div className="calendar-grid">{cells.map((day, index) => {
        if (!day) return <span className="calendar-empty" key={`empty-${index}`} />;
        const isSelected = selected.getFullYear() === month.getFullYear() && selected.getMonth() === month.getMonth() && selected.getDate() === day;
        const isToday = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && today.getDate() === day;
        return <button type="button" key={day} className={`calendar-day ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`} aria-pressed={isSelected} onClick={() => chooseDay(day)}>{day}</button>;
      })}</div>
      <div className="calendar-footer"><button type="button" className="calendar-today" onClick={chooseToday}>{t("calendar_today")}</button><label><Clock3 size={15} aria-hidden="true" /><input type="time" value={value.slice(11, 16)} aria-label={t("field_time")} onChange={(event) => { if (event.target.value) onChange(`${value.slice(0, 10)}T${event.target.value}`); }} /></label><button type="button" className="calendar-done" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}>{t("calendar_done")}</button></div>
    </div>}
  </div>;
}

async function prepareImage(file) {
  if (file.size <= 4 * 1024 * 1024) return file;
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error("err_photo_read"); }
  try {
    let longest = Math.min(1800, Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const scale = longest / Math.max(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("err_photo_process");
      context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.84, 0.74, 0.64, 0.54]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= 4 * 1024 * 1024) return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "item-photo"}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
      }
      longest = Math.floor(longest * 0.8);
    }
  } finally { bitmap.close(); }
  throw new Error("err_photo_compress");
}

function ImageDropzone({ file, onFile, error, clearError }) {
  const { t } = useLanguage();
  const [dragging, setDragging] = useState(false);
  const preview = React.useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function choose(candidate) {
    if (!candidate) return;
    clearError();
    if (!/^image\/(jpeg|png|webp)$/.test(candidate.type)) { onFile(null, "err_photo_type"); return; }
    if (candidate.size > 8 * 1024 * 1024) { onFile(null, "err_photo_size"); return; }
    onFile(candidate, "");
  }
  return <div className={`dropzone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""} ${error ? "has-error" : ""}`}
    onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
    onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0]); }}>
    <input id="item-image" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choose(event.target.files?.[0])} />
    {file ? <><img className="dropzone-preview" src={preview} alt={t("field_title")} /><div className="dropzone-file"><span className="drop-icon"><ImagePlus size={18} /></span><span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></span><label className="change-photo" htmlFor="item-image">{t("replace_photo")}</label></div></> : <label className="dropzone-prompt" htmlFor="item-image"><span className="drop-icon"><Upload size={19} /></span><b>{t("upload_prompt")} <u>{t("upload_choose")}</u></b><small>{t("upload_hint")}</small></label>}
  </div>;
}

function SectionTitle({ kicker, title, text, children }) {
  return <div className="section-title"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div>{children || (text && <p className="section-description">{text}</p>)}</div>;
}

function RecordCard({ record, matched = false }) {
  const { t, locale, categoryLabel, evidenceLabel, apiError } = useLanguage();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  const [contactNeedsLogin, setContactNeedsLogin] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const found = record.kind === "found";
  const date = new Date(record.occurred_at);
  const formatted = Number.isNaN(date.getTime()) ? t("time_unknown") : new Intl.DateTimeFormat(locale, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  async function sendContactRequest(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setContactNeedsLogin(false); setContactStatus(""); setContactBusy(true);
    try {
      const session = await currentSession();
      if (!session?.user) { setContactNeedsLogin(true); setContactStatus(t("contact_login_required")); return; }
      const data = new FormData(formElement);
      const response = await authorizedFetch(`/api/records/${encodeURIComponent(record.id)}/contact`, { method: "POST", body: data });
      let result = null; try { result = await response.json(); } catch { /* Keep the HTTP status if the API has no JSON body. */ }
      if (response.status === 401) { setContactNeedsLogin(true); throw new Error("contact_login_required"); }
      if (!response.ok) throw new Error(result?.detail || `HTTP ${response.status}`);
      setContactStatus(t("contact_sent")); formElement.reset();
    } catch (error) {
      const code = error.message;
      const authError = code === "auth_service_error" || code === "auth_not_configured" || code === "auth_failed";
      const translated = authError ? t("local_auth_unavailable") : code === "CONTACT_OWN_RECORD" ? t("contact_self_error") : code === "CONTACT_RECORD_UNAVAILABLE" ? t("contact_record_unavailable") : code === "CONTACT_EMAIL_INVALID" ? t("contact_email_invalid") : code === "CONTACT_MESSAGE_INVALID" ? t("contact_message_invalid") : code === "contact_login_required" ? t("contact_login_required") : apiError(code || "");
      setContactStatus(translated);
    } finally { setContactBusy(false); }
  }
  return <article className="record-card">
    <div className="record-image-wrap"><img className="record-image" src={record.image_url} alt={record.title} loading="lazy" /><span className={`record-type ${found ? "is-found" : ""}`}>{t(found ? "type_found" : "type_lost")}</span>{matched && <span className="score-pill">{t("score", { score: record.match_score })}</span>}</div>
    <div className="record-info"><div className="record-kicker"><span>{categoryLabel(record.category)}</span><span><Clock3 size={13} />{formatted}</span></div><h3>{record.title}</h3><p className="record-place"><MapPin size={14} />{record.location}</p>{record.color && <p className="record-color"><span />{record.color}</p>}{matched && record.match_evidence?.length > 0 && <div className="match-evidence">{record.match_evidence.map((item) => <span key={item}><Check size={12} />{evidenceLabel(item)}</span>)}</div>}{record.description && !matched && <p className="record-description">{record.description}</p>}
      <button type="button" className="record-contact-toggle" aria-expanded={contactOpen} onClick={() => { setContactOpen((value) => !value); setContactStatus(""); setContactNeedsLogin(false); }}><MessageCircle size={15} />{contactOpen ? t("contact_hide") : t("contact_button")}</button>
      {contactOpen && <form className="contact-form" onSubmit={sendContactRequest}><p>{t("contact_private_notice")}</p><label>{t("contact_email")}<input name="sender_email" type="email" maxLength={254} required placeholder={t("auth_email_placeholder")} /></label><label>{t("contact_message")}<textarea name="message" minLength={10} maxLength={1000} rows={3} required placeholder={t("contact_message_placeholder")} /></label><button className="button button-primary" type="submit" disabled={contactBusy}>{contactBusy ? <><span className="spinner" />{t("contact_sending")}</> : <>{t("contact_send")} <Send size={14} /></>}</button>{contactStatus && <div className={`contact-status ${contactNeedsLogin ? "is-error" : ""}`} role="status" aria-live="polite">{contactStatus}{contactNeedsLogin && <> <a href="/login.html" target="_blank" rel="noreferrer">{t("login_action")}</a></>}</div>}</form>}
    </div>
  </article>;
}

function PublishSection({ onPublished }) {
  const { t, apiError, categoryLabel } = useLanguage();
  const [kind, setKind] = useState("lost");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [consent, setConsent] = useState(false);
  const [dateTime, setDateTime] = useState(() => { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); return now.toISOString().slice(0, 16); });
  const [values, setValues] = useState({ title: "", category: "", color: "", location: "", description: "" });
  function setValue(event) { setValues((previous) => ({ ...previous, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setIsError(false); setNeedsLogin(false); setMatches(null); setBusy(true); setStatus(t("status_saving"));
    try {
      const session = await currentSession();
      if (!session?.user) { setNeedsLogin(true); setStatus(t("login_required")); setIsError(true); return; }
      if (!file) throw new Error("err_choose_photo");
      const data = new FormData();
      data.set("kind", kind); Object.entries(values).forEach(([key, value]) => data.set(key, value));
      data.set("occurred_at", dateTime); data.set("ai_processing_consent", consent ? "yes" : "no"); data.set("image", await prepareImage(file));
      const response = await authorizedFetch("/api/records", { method: "POST", body: data });
      let result = null; try { result = await response.json(); } catch { /* Keep HTTP status for platform errors. */ }
      if (response.status === 401) { setNeedsLogin(true); throw new Error("err_login_publish"); }
      if (!response.ok) throw new Error(result?.detail ? apiError(result.detail) : t("err_http", { code: response.status }));
      if (!result || typeof result.id !== "string") throw new Error("err_bad_response");
      setMatches(Array.isArray(result.matches) ? result.matches : []);
      const aiMessage = result.analysis_status === "analyzed" ? t("ai_done") : consent ? t("ai_unavailable") : t("ai_not_sent");
      setStatus(`${t("status_published")}${aiMessage}`); onPublished();
      setFile(null); setFileError(""); setValues({ title: "", category: "", color: "", location: "", description: "" }); setConsent(false);
    } catch (error) {
      const authError = error.message === "auth_service_error" || error.message === "auth_not_configured" || error.message === "auth_failed";
      setStatus(authError ? t("local_auth_unavailable") : t(error.message) === error.message ? error.message : t(error.message)); setIsError(true);
    }
    finally { setBusy(false); }
  }
  return <section className="publish-section section-wrap reveal" id="publish">
    <SectionTitle kicker={t("form_kicker")} title={t("form_title")} text={t("form_intro")} />
    <div className="publish-layout">
      <aside className="publish-aside"><h3>{t("aside_title_a")}<br /><em>{t("aside_title_b")}</em></h3><p>{t("aside_warning")}</p><div className="aside-policy"><ShieldCheck size={17} /><span>{t("public_note")}<br /><small>{t("manage_note")}</small></span></div></aside>
      <form className="publish-form" onSubmit={submit}>
        <div className="kind-selector" role="group" aria-label="选择线索类型">
          <button type="button" className={`kind-choice ${kind === "lost" ? "selected" : ""}`} onClick={() => setKind("lost")} aria-pressed={kind === "lost"}><span className="kind-symbol lost-symbol"><Search size={18} /></span><span><b>{t("lost_title")}</b><small>{t("lost_sub")}</small></span><span className="radio-mark" /></button>
          <button type="button" className={`kind-choice ${kind === "found" ? "selected" : ""}`} onClick={() => setKind("found")} aria-pressed={kind === "found"}><span className="kind-symbol found-symbol"><Sparkles size={17} /></span><span><b>{t("found_title")}</b><small>{t("found_sub")}</small></span><span className="radio-mark" /></button>
        </div>
        <ImageDropzone file={file} onFile={(next, error) => { setFile(next); setFileError(error); }} error={fileError} clearError={() => setFileError("")} />
        {fileError && <p className="field-error">{t(fileError)}</p>}
        <div className="field-grid">
          <Field label={t("field_title")}><input name="title" value={values.title} onChange={setValue} maxLength={80} required placeholder={t("placeholder_title")} /></Field>
          <Field label={t("field_category")}><select name="category" value={values.category} onChange={setValue} required><option value="" disabled>{t("choose_category")}</option>{CATEGORIES.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}</select></Field>
          <Field label={t("field_color")} hint={t("optional")}><input name="color" value={values.color} onChange={setValue} maxLength={40} placeholder={t("placeholder_color")} /></Field>
          <Field label={t("field_location")}><input name="location" value={values.location} onChange={setValue} maxLength={120} required placeholder={t("placeholder_location")} /></Field>
          <Field label={t("field_time")}><DateTimePicker value={dateTime} onChange={setDateTime} /></Field>
          <Field label={t("field_description")} hint={t("optional")} className="field-wide"><textarea name="description" value={values.description} onChange={setValue} maxLength={400} rows={3} placeholder={t("placeholder_description")} /></Field>
        </div>
        <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span className="consent-check"><Check size={12} /></span><span>{t("consent")}</span></label>
        <div className="submit-row"><p><ShieldCheck size={15} />{t("match_disclaimer")}</p><button className="button button-primary submit-button" disabled={busy}>{busy ? <><span className="spinner" />{t("submitting")}</> : <>{t("submit_match")} <ArrowUpRight size={17} /></>}</button></div>
        {status && <div className={`form-status ${isError ? "is-error" : "is-success"}`} role="status" aria-live="polite">{!isError && <Check size={15} />}{status}{needsLogin && <> <a href="/login.html" target="_blank" rel="noreferrer">{t("login_action")}</a></>}</div>}
        {matches && <section className="match-results" aria-live="polite"><div className="match-results-heading"><div><span className="eyebrow">{t("match_heading")}</span><h3>{matches.length ? t("match_count", { count: matches.length }) : t("no_match_title")}</h3></div><p>{matches.length ? t("match_hint") : t("no_match_hint")}</p></div>{matches.length > 0 && <div className="match-grid">{matches.map((record) => <RecordCard key={record.id} record={record} matched />)}</div>}</section>}
      </form>
    </div>
  </section>;
}

function useReveal() {
  useEffect(() => {
    const elements = [...document.querySelectorAll(".reveal")];
    if (!("IntersectionObserver" in window)) { elements.forEach((element) => element.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function Board({ refreshKey }) {
  const { t } = useLanguage();
  const [kind, setKind] = useState("all");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true; setLoading(true); setError("");
    fetch("/api/records").then(async (response) => {
      let result = null; try { result = await response.json(); } catch { /* Report HTTP status below. */ }
      if (!response.ok || !Array.isArray(result)) throw new Error(result?.detail || `HTTP ${response.status}`);
      if (alive) setRecords(result);
  }).catch(() => { if (alive) setError(t("load_failed")); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey]);
  const visible = kind === "all" ? records : records.filter((record) => record.kind === kind);
  return <section className="board-section section-wrap reveal" id="board">
    <SectionTitle kicker={t("board_kicker")} title={t("board_title")} text={t("board_sub")}>
      <div className="filter-tabs" role="group" aria-label={t("filter_all")}>{[["all", t("filter_all"), records.length], ["lost", t("filter_lost")], ["found", t("filter_found")]].map(([value, label, count]) => <button type="button" key={value} className={kind === value ? "active" : ""} aria-pressed={kind === value} onClick={() => setKind(value)}>{label}{value === "all" && <span>{count}</span>}</button>)}</div>
    </SectionTitle>
    {loading ? <div className="record-grid">{[1, 2, 3].map((item) => <div className="record-skeleton" key={item}><div /><span /><span /></div>)}</div> : error ? <div className="empty-panel"><span className="empty-icon"><Compass /></span><b>{t("load_failed")}</b><p>{error}</p><button className="button button-secondary" onClick={() => window.location.reload()}>{t("reload")} <ArrowRight size={15} /></button></div> : visible.length ? <div className="record-grid">{visible.map((record) => <RecordCard key={record.id} record={record} />)}</div> : <div className="empty-panel"><span className="empty-icon"><Search /></span><b>{t(kind === "all" ? "empty_all" : "empty_filter")}</b><p>{t("empty_hint")}</p><a className="button button-secondary" href="#publish">{t("hero_publish")} <ArrowRight size={15} /></a></div>}
    <div className="board-foot"><span><span className="board-live-dot" />{t("public_browse")}</span><span>{t("count_records", { count: visible.length })}</span></div>
  </section>;
}

function HowItWorks() {
  const { t } = useLanguage();
  const steps = [["01", t("step1_title"), t("step1_text"), <ImagePlus key="photo" />], ["02", t("step2_title"), t("step2_text"), <Compass key="compass" />], ["03", t("step3_title"), t("step3_text"), <Check key="check" />]];
  return <section className="how-section section-wrap reveal" id="how"><div className="how-intro"><p className="eyebrow">{t("how_kicker")}</p><h2>{t("how_title_a")}<br /><span>{t("how_title_b")}</span></h2><p>{t("how_intro")}</p></div><div className="how-steps">{steps.map(([number, title, text, icon]) => <article className="how-step" key={number}><div className="how-step-top"><span>{number}</span><span className="how-step-icon">{icon}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>;
}

function Footer() {
  const { t } = useLanguage();
  return <footer className="site-footer section-wrap"><a className="brand" href="#top"><span className="brand-mark">拾</span><span>拾见<span className="brand-dot">.</span></span></a><p>{t("footer_line")}</p><a href="#top">{t("back_top")} <ArrowUpRight size={14} /></a></footer>;
}

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  useReveal();
  return <><Header /><main id="top"><Hero /><PublishSection onPublished={() => setRefreshKey((key) => key + 1)} /><Board refreshKey={refreshKey} /><HowItWorks /></main><Footer /></>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><LanguageProvider><App /></LanguageProvider></React.StrictMode>);
