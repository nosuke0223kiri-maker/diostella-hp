// 完璧秘書 アカウントページ（2026-09-20）＝ブラウザから「プラン確認・お支払いの管理・解約・利用の一時停止」だけ。
// 退会・全端末ログアウト・端末の承認リセットは置かない（AppleかGoogleを奪った相手が本人を締め出せるため＝2026-09-10 こうくん確定）。
// ログイン＝アプリと同じ Apple/Google（Supabase Auth のOAuth・戻り先はこのページ）。裏口＝Edge Function account-web（読み書きは全部そちら）。
// 公開キー（sb_publishable_…）はアプリのWeb版が全ブラウザに配っている物と同じ＝秘密ではない（秘密鍵はサーバーにしか無い）。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const SB_URL = "https://qwsxionvojqnqnwccoij.supabase.co";
const SB_KEY = "sb_publishable_RjqVoCPAZehQEwqNXvBqLA_FniRc_Sd";
const TURNSTILE_SITEKEY = "0x4AAAAAAE9_NHF8sN51gu75"; // Cloudflare Turnstile のサイトキー（空＝出さない。サーバー側 TURNSTILE_SECRET と対で入れる）
const sb = createClient(SB_URL, SB_KEY, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } });

const $ = (id) => document.getElementById(id);
const show = (id, on = true) => { $(id).hidden = !on; };
let msgTimer = null;
const say = (t, ms = 3200) => { const m = $("msg"); m.textContent = t; m.classList.add("show"); clearTimeout(msgTimer); msgTimer = setTimeout(() => m.classList.remove("show"), ms); };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" }) : "—";

// ── 裏口（account-web）＝本人のトークン付きで呼ぶ。401＝ログインし直し／404 notfound＝アプリの垢が無い ──
async function api(action, extra = {}) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw Object.assign(new Error("unauthorized"), { code: 401 });
  const r = await fetch(`${SB_URL}/functions/v1/account-web`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SB_KEY, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, ...extra }),
  });
  let body = {};
  try { body = await r.json(); } catch { /* 本文なし */ }
  if (!r.ok) throw Object.assign(new Error(body.message || body.error || "error"), { code: r.status, body });
  return body;
}

// ── Turnstile（サイトキーがある時だけ）＝押す直前に token を取る ──
let tsWidget = null;
function turnstileToken() {
  if (!TURNSTILE_SITEKEY || !window.turnstile) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    if (tsWidget != null) window.turnstile.remove(tsWidget);
    tsWidget = window.turnstile.render("#turnstile-box", { sitekey: TURNSTILE_SITEKEY, callback: (t) => resolve(t), "error-callback": () => resolve(undefined), theme: "dark" });
  });
}
function loadTurnstile() {
  if (!TURNSTILE_SITEKEY || document.getElementById("ts-script")) return;
  const s = document.createElement("script"); s.id = "ts-script"; s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; s.async = true; document.head.appendChild(s);
}

// ── 画面 ──
let me = null;
// 再開だけの表示（アプリの停止中画面から来た時＝`?mode=resume`）。Apple 3.1.1＝アプリ内からIAP以外の支払い管理へ誘導しないため、
// プランの区画（お支払いの管理・解約）を出さず「今の状態＋再開する」だけにする（2026-09-21 こうくん確定）。
// OAuth の往復で ?mode が消えるので sessionStorage に控える（このタブの間だけ）
const MODE_KEY = "acct-mode";
try { if (new URLSearchParams(location.search).get("mode") === "resume") sessionStorage.setItem(MODE_KEY, "resume"); } catch { /* 保存できない環境は通常表示 */ }
const resumeOnly = () => { try { return sessionStorage.getItem(MODE_KEY) === "resume"; } catch { return false; } };
function renderNav() {
  const inner = document.querySelector(".nav-inner");
  let box = inner.querySelector(".nav-account");
  if (!me) { if (box) box.remove(); return; }
  if (!box) {
    box = document.createElement("div"); box.className = "nav-account";
    const nm = document.createElement("span"); nm.className = "nav-account-name";
    const out = document.createElement("a"); out.className = "nav-logout"; out.href = "#"; out.textContent = "ログアウト";
    out.addEventListener("click", (e) => { e.preventDefault(); $("btn-logout").click(); });
    box.append(nm, out); inner.appendChild(box);
  }
  box.querySelector(".nav-account-name").textContent = (me.name || "").trim() || me.email || "";
}
function render() {
  show("view-loading", false); show("view-login", !me); show("view-account", !!me);
  renderNav();
  if (!me) return;
  // ログイン方法＝アプリの設定「アカウント」と同じ行（Google／Apple）。どちらも無い垢（開発垢）はメールだけ
  const logins = Array.isArray(me.logins) ? me.logins : [];
  const esc = (t) => String(t || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  $("v-logins").innerHTML = logins.map((l) => `<div class="acct-row"><span class="k">${l.provider === "google" ? "Google" : "Apple"}でログイン</span><span class="v">${esc(l.email) || "—"}</span></div>`).join("");
  show("row-email", logins.length === 0);
  $("v-email").textContent = me.email || "—";
  try { localStorage.setItem("ps-account-name", me.name || ""); } catch { /* LPのメニュー表示用（無くても困らない） */ }
  const nm = (me.name || "").trim();
  $("acct-name").textContent = nm; $("acct-name").hidden = !nm;
  $("v-state").innerHTML = me.paused ? '<span class="acct-badge warn">利用を一時停止中</span>' : '<span class="acct-badge">利用中</span>';
  $("v-plan").textContent = me.planName || "フリー";
  const route = me.route;
  $("v-route").textContent = route === "stripe" ? "カード（クレジット／デビット）" : route === "iap" ? "App Store" : "なし（フリープラン）";
  show("plan-stripe", route === "stripe"); show("plan-iap", route === "iap"); show("plan-none", route === "none");
  if (route === "stripe") {
    show("row-renew", !!me.stripe.renewAt);
    $("k-renew").textContent = me.stripe.cancelAtPeriodEnd ? "解約予定（この日まで利用可）" : "次回の更新";
    $("v-renew").textContent = fmtDate(me.stripe.renewAt);
    show("btn-cancel", !me.stripe.cancelAtPeriodEnd); show("btn-uncancel", !!me.stripe.cancelAtPeriodEnd); show("confirm-cancel", false);
  } else if (route === "iap") {
    show("row-renew", !!me.iap.expiresAt); $("k-renew").textContent = "有効期限"; $("v-renew").textContent = fmtDate(me.iap.expiresAt);
  } else show("row-renew", false);
  $("v-pause").textContent = me.paused ? `一時停止中（${fmtDate(me.pausedAt)}から）` : "利用中";
  show("card-plan", !resumeOnly()); // 再開だけの表示＝プランの区画（支払い管理・解約）を出さない
  if (resumeOnly()) $("acct-lead").textContent = "利用の一時停止・再開";
  show("btn-pause", !me.paused && !resumeOnly()); show("btn-resume", !!me.paused); show("confirm-pause", false);
  $("pause-left").textContent = `※一時停止の切り替えは24時間に5回までです（あと${me.pauseLeft ?? 5}回）`;
  if (me.turnstile) loadTurnstile();
}

async function refresh() {
  try {
    me = await api("me");
    render();
  } catch (e) {
    me = null;
    if (e.code === 404 && e.body?.notfound) { await sb.auth.signOut({ scope: "local" }); render(); say(e.message, 7000); return; }
    if (e.code === 401) { await sb.auth.signOut({ scope: "local" }); render(); return; }
    render();
    say(e.message === "rate" ? "操作が多すぎます。しばらくしてからお試しください" : "読み込めませんでした。時間をおいてお試しください", 5000);
  }
}

// ── ログイン（アプリのWeb版と同じ＝URLだけ作らせて自分で遷移。ライブラリに遷移させるとiOS Safariに止められる） ──
async function login(provider) {
  const redirectTo = location.origin + location.pathname;
  const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true, ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}) } });
  if (error || !data?.url) { say("ログイン画面を開けませんでした。時間をおいてお試しください", 5000); return; }
  location.assign(data.url);
}
$("btn-apple").addEventListener("click", () => login("apple"));
$("btn-google").addEventListener("click", () => login("google"));
$("btn-logout").addEventListener("click", async () => { await sb.auth.signOut({ scope: "local" }); try { localStorage.removeItem("ps-account-name"); sessionStorage.removeItem(MODE_KEY); } catch { /* noop */ } me = null; render(); say("ログアウトしました"); });

// ── お支払いの管理（Stripe の管理画面へ） ──
$("btn-portal").addEventListener("click", async () => {
  try { const r = await api("portal"); if (r.url) location.assign(r.url); } catch (e) { say(e.message, 5000); }
});
// ── 解約・取り消し ──
$("btn-cancel").addEventListener("click", () => show("confirm-cancel", true));
$("btn-cancel-no").addEventListener("click", () => show("confirm-cancel", false));
$("btn-cancel-yes").addEventListener("click", async () => {
  $("btn-cancel-yes").disabled = true;
  try { await api("cancel", { turnstile: await turnstileToken() }); say("解約を受け付けました。更新日までは今のプランのままお使いいただけます", 6000); await refresh(); }
  catch (e) { say(e.message, 5000); } finally { $("btn-cancel-yes").disabled = false; }
});
$("btn-uncancel").addEventListener("click", async () => {
  try { await api("uncancel", { turnstile: await turnstileToken() }); say("解約を取り消しました"); await refresh(); } catch (e) { say(e.message, 5000); }
});
// ── 一時停止・再開 ──
$("btn-pause").addEventListener("click", () => show("confirm-pause", true));
$("btn-pause-no").addEventListener("click", () => show("confirm-pause", false));
$("btn-pause-yes").addEventListener("click", async () => {
  $("btn-pause-yes").disabled = true;
  try { await api("pause", { turnstile: await turnstileToken() }); say("利用を一時停止しました。再開はこのページから行えます", 6000); await refresh(); }
  catch (e) { say(e.message, 5000); } finally { $("btn-pause-yes").disabled = false; }
});
$("btn-resume").addEventListener("click", async () => {
  $("btn-resume").disabled = true;
  try { await api("resume", { turnstile: await turnstileToken() }); say("再開しました。アプリを開き直してお使いください", 6000); await refresh(); }
  catch (e) { say(e.message, 5000); } finally { $("btn-resume").disabled = false; }
});

// ── 起動＝OAuthの戻り（?code=）はライブラリが処理。URLの残りは消して見た目を整える ──
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (location.search.includes("code=") || location.hash.includes("access_token")) history.replaceState(null, "", location.pathname);
  if (!session) { me = null; render(); return; }
  await refresh();
})();
