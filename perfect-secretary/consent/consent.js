// 完璧秘書 保護者の同意ページ（2026-09-21）＝アプリから届いたメールのリンク（?t=合言葉）で開く。ログインは無し＝合言葉が鍵。
// 裏口＝Edge Function guardian-consent（info／confirm／revoke）。合言葉は7日で期限切れ・DBにはハッシュだけ。
// 公開キー（sb_publishable_…）はアプリのWeb版・アカウントページと同じ物＝秘密ではない。
const SB_URL = "https://qwsxionvojqnqnwccoij.supabase.co";
const SB_KEY = "sb_publishable_RjqVoCPAZehQEwqNXvBqLA_FniRc_Sd";

const $ = (id) => document.getElementById(id);
const show = (id, on = true) => { $(id).hidden = !on; };
let msgTimer = null;
const say = (t, ms = 3200) => { const m = $("msg"); m.textContent = t; m.classList.add("show"); clearTimeout(msgTimer); msgTimer = setTimeout(() => m.classList.remove("show"), ms); };
const token = new URLSearchParams(location.search).get("t") || "";

async function api(action) {
  const r = await fetch(`${SB_URL}/functions/v1/guardian-consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    body: JSON.stringify({ action, token }),
  });
  let body = {};
  try { body = await r.json(); } catch { /* 本文なし */ }
  if (!r.ok) throw Object.assign(new Error(body.error || "error"), { code: r.status, body });
  return body;
}

function render(info) {
  ["view-loading", "view-invalid", "view-ask", "view-done", "view-revoked", "revoke-confirm"].forEach((id) => show(id, false));
  if (!info) { show("view-invalid"); return; }
  if (info.minAge) $("ask-law").textContent = `Diostella〜完璧秘書〜では、${info.minAge}歳未満の方が秘書チャットのAI機能をお使いになる際、法律（個人情報の保護に関する法律 第40条の2）にもとづき、保護者（親権者など）の方の同意をいただいています。`;
  if (info.privacyUrl) $("privacy-link").href = info.privacyUrl;
  if (info.status === "consented") { show("view-done"); return; }
  if (info.expired) { $("invalid-msg").textContent = "このリンクは期限切れ（7日間）です。お手数ですが、お子さまのアプリからもう一度ご案内をお送りください。"; show("view-invalid"); return; }
  if (info.status === "revoked") { show("view-revoked"); return; }
  show("view-ask");
}

async function refresh() {
  if (!/^[0-9a-f]{64}$/.test(token)) { render(null); return; }
  try { render(await api("info")); }
  catch (e) { if (e.body?.error) $("invalid-msg").textContent = e.body.error; render(null); }
}

const syncConfirm = () => { $("btn-confirm").disabled = !($("chk-guardian").checked && $("chk-privacy").checked); };
$("chk-guardian").addEventListener("change", syncConfirm);
$("chk-privacy").addEventListener("change", syncConfirm);

$("btn-confirm").addEventListener("click", async () => {
  $("btn-confirm").disabled = true;
  try { await api("confirm"); say("同意を受け付けました"); await refresh(); }
  catch (e) { say(e.message, 5000); syncConfirm(); }
});
$("btn-reconfirm").addEventListener("click", async () => {
  try { await api("confirm"); say("同意を受け付けました"); await refresh(); } catch (e) { say(e.message, 5000); }
});
$("btn-revoke").addEventListener("click", () => { show("revoke-confirm"); });
$("btn-revoke-no").addEventListener("click", () => { show("revoke-confirm", false); });
$("btn-revoke-yes").addEventListener("click", async () => {
  try { await api("revoke"); say("同意を取り消しました"); await refresh(); } catch (e) { say(e.message, 5000); }
});

refresh();
