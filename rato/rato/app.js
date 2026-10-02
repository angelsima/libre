/* Rato — app.js
   Cambia CONFIG si usas otro proyecto de Supabase. La clave "publishable" es pública por diseño:
   la seguridad la ponen las reglas RLS de la base de datos. */
'use strict';

const CONFIG = {
  SUPABASE_URL: 'https://vjcdweiojvjwhtezabjn.supabase.co',
  SUPABASE_KEY: 'sb_publishable_52tD1d_h1pYwWEo2aMebRg_Yna9dap7',
};

const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
const COLORS = ['blue', 'coral', 'mint', 'lilac', 'sun', 'pink'];
const EMOJIS = ['🦊', '🐙', '🌵', '🍋', '🦄', '🐸', '🍉', '🦔', '🐝', '🌻', '🍒', '🐳', '🥑', '🪩', '🛼', '🌮', '🎸', '🐢', '🍕', '🌈', '🏄', '🪴', '🎲', '🍺'];
const GROUP_EMOJIS = ['👯', '🎓', '⚽', '🌮', '🍻', '🏖️', '🎮', '💼', '🎸', '🏠', '🧗', '🍕'];
const NOTE_IDEAS = ['una caña', 'un café', 'pasear', 'cenar', 'lo que surja'];
const PRESETS = {
  now: { label: 'Ahora' },
  tarde: { label: 'Tarde', from: '17:00', to: '21:00' },
  noche: { label: 'Noche', from: '21:00', to: '02:00' },
  dia: { label: 'Todo el día', from: '09:00', to: '23:00' },
};
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/* ============ Utilidades ============ */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const pad = n => String(n).padStart(2, '0');
const hhmm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
const first = n => String(n || '').trim().split(/\s+/)[0] || '';
const colorOf = c => (COLORS.includes(c) ? c : 'blue');

function startOfDay(off = 0) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d; }
function at(off, t) { const [h, m] = t.split(':').map(Number); const d = startOfDay(off); d.setHours(h, m, 0, 0); return d; }
function offsetOf(date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return Math.round((d - startOfDay(0)) / 864e5); }
function dayLabel(off) { if (off === 0) return 'Hoy'; if (off === 1) return 'Mañana'; const d = startOfDay(off); return DAYS[d.getDay()] + ' ' + d.getDate(); }
function dayWord(off) { if (off === 0) return 'hoy'; if (off === 1) return 'mañana'; return 'el ' + DAYS_LONG[startOfDay(off).getDay()]; }
function dayTitle(off) { if (off === 0) return 'hoy'; if (off === 1) return 'mañana'; return 'el ' + DAYS_LONG[startOfDay(off).getDay()] + ' ' + startOfDay(off).getDate(); }

function normPhone(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let d = s.replace(/\D/g, '');
  if (s.startsWith('00')) d = d.slice(2);
  const explicit = s.startsWith('+') || s.startsWith('00');
  if (!explicit && /^[6789]\d{8}$/.test(d)) d = '34' + d;
  return /^\d{8,15}$/.test(d) ? d : null;
}
function fmtPhone(d) {
  if (!d) return '';
  if (/^34\d{9}$/.test(d)) return '+34 ' + d.slice(2, 5) + ' ' + d.slice(5, 8) + ' ' + d.slice(8);
  return '+' + d;
}

const SHAPES = [
  '46% 54% 58% 42% / 52% 44% 56% 48%',
  '58% 42% 46% 54% / 44% 56% 44% 56%',
  '50% 50% 40% 60% / 60% 40% 60% 40%',
  '42% 58% 54% 46% / 56% 48% 52% 44%',
];
function avatar(emoji, color, size = 48, seed = '') {
  const h = [...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return `<span class="av" style="--s:${size}px;--bg:var(--t-${colorOf(color)});border-radius:${SHAPES[h % 4]}">${esc(emoji || '🙂')}</span>`;
}

const svg = p => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  sun: svg('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>'),
  people: svg('<circle cx="9" cy="8.5" r="3.3"/><path d="M2.8 20c.4-3.4 3-5.4 6.2-5.4s5.8 2 6.2 5.4"/><circle cx="17.2" cy="9.5" r="2.5"/><path d="M17.5 14.7c2.4.1 4.1 1.7 4.5 4.6"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.6-4 3.8-6 7.5-6s6.9 2 7.5 6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  chat: svg('<path d="M20.5 11.6a8 8 0 0 1-11.9 7L3.5 20l1.4-4.9A8 8 0 1 1 20.5 11.6z"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  star: '<svg class="ic star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.7 6 6.5.6-4.9 4.4 1.5 6.4L12 16.8 6.2 20.2l1.5-6.4L2.8 9.4l6.5-.6z"/></svg>',
  link: svg('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
  trash: svg('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>'),
  refresh: svg('<path d="M20 11a8 8 0 1 0-2.3 6.1M20 4.5V11h-6.5"/>'),
  eyeoff: svg('<path d="M3 3l18 18M10.6 5.2A9.6 9.6 0 0 1 12 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.2 2.5-2.4 3.7M6.5 7C4.5 8.4 3.2 10.4 2.5 12c1 2.8 4.5 7 9.5 7 1.5 0 2.8-.4 4-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  sunBig: '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#1B1464" stroke-width="4" stroke-linecap="round"><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12.2 12.2l5.7 5.7M46.1 46.1l5.7 5.7M51.8 12.2l-5.7 5.7M17.9 46.1l-5.7 5.7"/></g><circle cx="32" cy="32" r="12" fill="#fff" stroke="#1B1464" stroke-width="4"/></svg>',
  google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
};

/* ============ Estado ============ */
const S = {
  screen: 'loading', uid: null, email: '',
  tab: 'home', day: 0, city: 'mine',
  profile: null, phone: '', code: '',
  contacts: [], groups: [], myStatuses: [], available: [],
  auth: { step: 'choose', email: '', token: '', busy: false, error: '' },
  form: {}, ui: { q: '' }, sheet: null, pendingPreview: null,
};
let api = null;

/* ============ API real (Supabase) ============ */
function makeRealApi() {
  const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const redirect = location.origin + location.pathname;
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  return {
    async session() { const { data } = await sb.auth.getSession(); return data.session; },
    onAuth(cb) { sb.auth.onAuthStateChange((_e, s) => { setTimeout(() => cb(s), 0); }); },
    signInGoogle() { return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect } }).then(ok); },
    sendEmail(email) { return sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } }).then(ok); },
    verifyEmail(email, token) { return sb.auth.verifyOtp({ email, token, type: 'email' }).then(ok); },
    signOut() { return sb.auth.signOut({ scope: 'local' }); },
    async getMe() {
      const [p, pp] = await Promise.all([
        sb.from('profiles').select('*').eq('id', S.uid).single().then(ok),
        sb.from('profile_private').select('whatsapp,invite_code').eq('user_id', S.uid).single().then(ok),
      ]);
      return { profile: p, phone: pp.whatsapp || '', code: pp.invite_code };
    },
    saveProfile(patch) { return sb.from('profiles').update(patch).eq('id', S.uid).then(ok); },
    savePhone(w) { return sb.from('profile_private').update({ whatsapp: w || null }).eq('user_id', S.uid).then(ok); },
    async getContacts() {
      const rows = await sb.from('contacts')
        .select('friend_id,nickname,is_close,hide_my_status,friend:profiles!friend_id(display_name,emoji,color,city)').then(ok);
      return rows.filter(r => r.friend).map(r => ({
        id: r.friend_id, name: r.friend.display_name, emoji: r.friend.emoji, color: r.friend.color, city: r.friend.city || '',
        nickname: r.nickname || '', is_close: r.is_close, hide_my_status: r.hide_my_status,
      }));
    },
    async getGroups() {
      const rows = await sb.from('groups').select('id,name,emoji,invite_code,group_members(user_id)').then(ok);
      return rows.map(g => ({ id: g.id, name: g.name, emoji: g.emoji, code: g.invite_code, members: g.group_members.map(m => m.user_id) }));
    },
    getMyStatuses() { return sb.from('statuses').select('*').gt('ends_at', new Date().toISOString()).order('starts_at').then(ok); },
    async getAvailable() {
      const rows = await sb.rpc('available_friends').then(ok);
      return rows.map(r => ({
        status_id: r.status_id, user_id: r.user_id, name: r.display_name, emoji: r.emoji, color: r.color, city: r.city || '',
        starts_at: r.starts_at, ends_at: r.ends_at, note: r.note || '', whatsapp: r.whatsapp || '', is_close: r.is_close, groups: r.shared_groups || [],
      }));
    },
    createStatus(row) { return sb.from('statuses').insert(row).then(ok); },
    deleteStatus(id) { return sb.from('statuses').delete().eq('id', id).then(ok); },
    confirmStatus(id) { return sb.from('statuses').update({ confirmed_at: new Date().toISOString() }).eq('id', id).then(ok); },
    updateContact(fid, patch) { return sb.from('contacts').update(patch).eq('owner_id', S.uid).eq('friend_id', fid).then(ok); },
    removeContact(fid) { return sb.rpc('remove_contact', { p_friend: fid }).then(ok); },
    createGroup(name, emoji) { return sb.rpc('create_group', { p_name: name, p_emoji: emoji }).then(ok); },
    joinGroup(code) { return sb.rpc('join_group_by_code', { p_code: code }).then(ok); },
    leaveGroup(id) { return sb.rpc('leave_group', { p_group: id }).then(ok); },
    connect(code) { return sb.rpc('connect_by_code', { p_code: code }).then(ok); },
    preview(code) { return sb.rpc('preview_invite', { p_code: code }).then(ok); },
    async deleteAccount() { await sb.rpc('delete_my_account').then(ok); await sb.auth.signOut({ scope: 'local' }).catch(() => {}); },
  };
}

/* ============ Toast / errores ============ */
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
}
function errText(e) {
  const m = String(e?.message || e || '');
  if (/rate limit/i.test(m)) return 'Demasiados intentos. Espera un rato y vuelve a probar.';
  if (/(otp|token|code).*(expired|invalid)|(expired|invalid).*(otp|token|code)/i.test(m)) return 'El código no es válido o ha caducado.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'Sin conexión. Revisa tu internet.';
  return m || 'Algo ha fallado. Inténtalo otra vez.';
}
async function run(fn) {
  try { return await fn(); } catch (e) { console.error(e); toast(errText(e)); return undefined; }
}

/* ============ Cálculos ============ */
function myNow() {
  const n = Date.now();
  return S.myStatuses.find(s => +new Date(s.starts_at) <= n && +new Date(s.ends_at) > n);
}
function needsConfirm() {
  const d0 = +startOfDay(0), d1 = +startOfDay(1), n = Date.now();
  return S.myStatuses.filter(s => {
    const st = +new Date(s.starts_at);
    return st >= d0 && st < d1 && +new Date(s.ends_at) > n && !s.confirmed_at && +new Date(s.created_at) < d0;
  });
}
function cityList() {
  const mine = norm(S.profile?.city);
  const m = new Map();
  S.available.forEach(a => { if (a.city && norm(a.city) !== mine) m.set(norm(a.city), a.city); });
  return [...m.values()].sort((a, b) => a.localeCompare(b, 'es'));
}
function visibleAvail() {
  const mine = norm(S.profile?.city);
  return S.available.filter(a => {
    if (S.city === 'all') return true;
    if (S.city === 'mine') return !mine || !a.city || norm(a.city) === mine;
    return norm(a.city) === norm(S.city);
  });
}
function overlapsDay(a, off) {
  const d0 = +startOfDay(off), d1 = +startOfDay(off + 1);
  return +new Date(a.starts_at) < d1 && +new Date(a.ends_at) > d0 && +new Date(a.ends_at) > Date.now();
}
function timeInfo(a, off) {
  const st = new Date(a.starts_at), en = new Date(a.ends_at), d0 = startOfDay(off), d1 = startOfDay(off + 1);
  if (off === 0 && st <= new Date()) return { live: true, text: 'Ahora – ' + hhmm(en) + (en >= d1 ? ' (+1)' : '') };
  if (st < d0) return { text: 'Hasta las ' + hhmm(en) };
  return { text: hhmm(st) + ' – ' + hhmm(en) + (en > d1 ? ' (+1)' : '') };
}
function waLink(a) {
  const st = new Date(a.starts_at), en = new Date(a.ends_at);
  const note = a.note ? ' (' + a.note + ')' : '';
  let msg;
  if (st <= new Date()) msg = `¡Hola ${first(a.name)}! Vi en Rato que estás libre ahora hasta las ${hhmm(en)}${note}. ¿Quedamos?`;
  else msg = `¡Hola ${first(a.name)}! Vi en Rato que estás libre ${dayWord(offsetOf(st))} a las ${hhmm(st)}${note}. ¿Quedamos?`;
  return 'https://wa.me/' + a.whatsapp + '?text=' + encodeURIComponent(msg);
}
function audLabel(s) {
  let t = s.audience === 'close' ? 'Círculo cercano' : s.audience === 'group' ? (S.groups.find(g => g.id === s.audience_group_id)?.name || 'Un grupo') : 'Todos';
  const n = (s.excluded_ids || []).length;
  if (n) t += ` · sin ${n}`;
  return t;
}
function inviteUrl(code, kind) { return location.origin + location.pathname + (kind === 'group' ? '?g=' : '?u=') + code; }

/* ============ Vistas ============ */
function viewLoading() {
  return `<div class="loading">${ICON.sun}<span class="display">Rato</span></div>`;
}

function viewWelcome() {
  const a = S.auth, inv = S.pendingPreview;
  let block;
  if (a.step === 'choose') {
    block = `<div class="auth">
      <button class="btn btn-white" data-act="auth-google">${ICON.google}<span>Continuar con Google</span></button>
      <button class="btn" data-act="auth-email-mode">Usar mi email</button>
    </div>`;
  } else if (a.step === 'email') {
    block = `<form class="auth" data-form="send">
      <div class="field" style="margin-top:0"><label for="em">Tu email</label>
      <input id="em" class="input" type="email" inputmode="email" autocomplete="email" placeholder="tu@correo.com" required data-bind="auth.email" value="${esc(a.email)}"></div>
      ${a.error ? `<p class="err">${esc(a.error)}</p>` : ''}
      <button class="btn" type="submit" ${a.busy ? 'disabled' : ''}>${a.busy ? 'Enviando…' : 'Enviarme el acceso'}</button>
      <button class="btn-ghost" type="button" data-act="auth-back">${ICON.back}<span>Volver</span></button>
    </form>`;
  } else {
    block = `<form class="auth" data-form="verify">
      <p class="lead" style="font-size:17px">Te hemos escrito a <b>${esc(a.email)}</b>. Pulsa el enlace del correo o escribe aquí el código:</p>
      <input class="input code-input" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="••••••" aria-label="Código del correo" data-bind="auth.token" value="${esc(a.token)}">
      ${a.error ? `<p class="err">${esc(a.error)}</p>` : ''}
      <button class="btn" type="submit" ${a.busy ? 'disabled' : ''}>${a.busy ? 'Entrando…' : 'Entrar'}</button>
      <button class="btn-ghost" type="button" data-act="auth-resend">Reenviar correo</button>
      <button class="btn-ghost" type="button" data-act="auth-back">${ICON.back}<span>Cambiar email</span></button>
    </form>`;
  }
  const mini = (e, c, n, t, note, live) => `<div class="mini">${avatar(e, c, 44, n)}<div><b>${n}</b><span class="${live ? 'live' : ''}">${live ? '● ' : ''}${t}</span></div><span class="bubble" style="--tone:var(--t-${c})">${note}</span></div>`;
  return `<section class="welcome">
    <div class="brand">${ICON.sun}<span>Rato</span></div>
    <h1 class="hero-title">¿Quién tiene un rato?</h1>
    <p class="hero-sub">Marca cuándo estás libre y mira qué amigos lo están. Sin crear un grupo de WhatsApp para cada plan.</p>
    <div class="stack" aria-hidden="true">
      ${mini('🌻', 'pink', 'Marta', 'Libre ahora', 'una caña', true)}
      ${mini('🐙', 'blue', 'Dani', '20:30 – 23:30', 'cenar')}
      ${mini('🍋', 'sun', 'Carmen', 'Mañana · 11:00', 'vermut')}
    </div>
    ${inv ? `<div class="invite-banner">${avatar(inv.emoji, inv.color, 42, inv.name)}<p><b>${esc(inv.name)}</b> ${inv.kind === 'group' ? 'te invita a su grupo.' : 'te ha invitado.'} Entra para conectar.</p></div>` : ''}
    ${block}
    <p class="legal">Solo ven tus ratos las personas que tú elijas. Guardamos tu nombre, ciudad y WhatsApp para que tus amigos puedan escribirte, y puedes borrar tu cuenta cuando quieras.</p>
  </section>`;
}

function profileFields(f, root) {
  const emojis = EMOJIS.map(e => `<button type="button" class="${f.emoji === e ? 'on' : ''}" data-act="pf-emoji" data-root="${root}" data-v="${e}" aria-label="Avatar ${e}">${e}</button>`).join('');
  const colors = COLORS.map(c => `<button type="button" class="${f.color === c ? 'on' : ''}" style="--bg:var(--t-${c})" data-act="pf-color" data-root="${root}" data-v="${c}" aria-label="Color ${c}"></button>`).join('');
  return `
    <div style="display:flex;justify-content:center;margin:6px 0 4px">${avatar(f.emoji, f.color, 84, f.name || 'x')}</div>
    <div class="field"><div class="lbl">Tu avatar</div><div class="emoji-grid">${emojis}</div></div>
    <div class="field"><div class="lbl">Tu color</div><div class="color-row">${colors}</div></div>
    <div class="field"><label for="pf-name">Nombre</label>
      <input id="pf-name" class="input" maxlength="40" autocomplete="given-name" placeholder="Como te verán tus amigos" data-bind="${root}.name" value="${esc(f.name)}"></div>
    <div class="field"><label for="pf-city">Ciudad</label>
      <input id="pf-city" class="input" maxlength="60" placeholder="Donde sueles quedar (Málaga, Madrid…)" data-bind="${root}.city" value="${esc(f.city)}"></div>
    <div class="field"><label for="pf-phone">WhatsApp</label>
      <input id="pf-phone" class="input" type="tel" inputmode="tel" autocomplete="tel" placeholder="612 345 678" data-bind="${root}.phone" value="${esc(f.phone)}">
      <p class="hint">Solo lo ven las personas que pueden verte libre, y solo sirve para que te escriban. Si no pones prefijo, usamos +34.</p></div>`;
}

function viewOnboarding() {
  return `<section>
    <h1 style="margin:6px 0 6px">Cuéntanos lo básico</h1>
    <p class="lead muted" style="margin-bottom:6px">Así te verán tus amigos en Rato. Podrás cambiarlo cuando quieras.</p>
    <form data-form="onboard">
      ${profileFields(S.form, 'form')}
      <button class="btn btn-block" style="margin-top:26px" type="submit" ${S.form.busy ? 'disabled' : ''}>${S.form.busy ? 'Guardando…' : 'Entrar en Rato'}</button>
    </form>
  </section>`;
}

function viewHome() {
  const P = S.profile;
  const cities = cityList();
  if (S.city !== 'mine' && S.city !== 'all' && !cities.some(c => norm(c) === norm(S.city))) S.city = 'mine';
  const vis = visibleAvail();
  const list = vis.filter(a => overlapsDay(a, S.day))
    .sort((a, b) => (+new Date(a.starts_at) <= Date.now() ? 0 : 1) - (+new Date(b.starts_at) <= Date.now() ? 0 : 1) || +new Date(a.starts_at) - +new Date(b.starts_at));
  const now = myNow();

  const hero = now ? `<section class="mynow">
      <div class="mynow-top">${ICON.sunBig}<div><b>Estás libre hasta las ${hhmm(new Date(now.ends_at))}</b><span>${esc([now.note, audLabel(now)].filter(Boolean).join(' · '))}</span></div></div>
      <div class="mynow-actions">
        <button class="btn btn-white btn-sm" data-act="end-status" data-id="${esc(now.id)}">Ya no estoy libre</button>
        <button class="btn-ghost" data-act="compose">${ICON.plus}<span>Otro rato</span></button>
      </div></section>`
    : `<button class="cta" data-act="compose">${ICON.sunBig}<span><b>Tengo un rato</b><small>Avísales en un toque</small></span></button>`;

  const asks = needsConfirm().map(s => `<div class="ask"><p>¿Sigues libre hoy de ${hhmm(new Date(s.starts_at))} a ${hhmm(new Date(s.ends_at))}?</p>
      <div class="row"><button class="btn btn-sm" data-act="confirm-yes" data-id="${esc(s.id)}">Sí, sigo libre</button><button class="btn-ghost" data-act="confirm-no" data-id="${esc(s.id)}">Ya no</button></div></div>`).join('');

  const chips = [0, 1, 2, 3, 4, 5, 6, 7].map(o => {
    const n = vis.filter(a => overlapsDay(a, o)).length;
    return `<button class="day ${S.day === o ? 'on' : ''}" data-act="day" data-v="${o}">${dayLabel(o)}${n ? `<i>${n}</i>` : ''}</button>`;
  }).join('');

  const showPick = !!P.city || cities.length > 0;
  const pick = showPick ? `<label class="city-pick">
      <select aria-label="Filtrar por ciudad" data-bind="city" data-render="main">
        ${P.city ? `<option value="mine" ${S.city === 'mine' ? 'selected' : ''}>📍 ${esc(P.city)}</option>` : ''}
        <option value="all" ${S.city === 'all' ? 'selected' : ''}>Todas las ciudades</option>
        ${cities.map(c => `<option value="${esc(c)}" ${norm(S.city) === norm(c) ? 'selected' : ''}>📍 ${esc(c)}</option>`).join('')}
      </select></label>` : '';

  let body;
  if (!S.loaded) {
    body = `<div class="loading" style="min-height:26dvh">${ICON.sun}</div>`;
  } else if (!S.contacts.length) {
    body = `<div class="empty">${avatar('👋', 'lilac', 84, 'hola')}<h3>Aquí aparecerán tus amigos</h3><p>Pásales tu enlace y verás quién tiene un rato libre.</p>
      <button class="btn" data-act="tab" data-v="people">Invitar a gente</button></div>`;
  } else if (!list.length) {
    body = `<div class="empty">${avatar('🌙', 'blue', 84, 'luna')}<h3>Nadie ha marcado un rato ${esc(dayWord(S.day))}</h3><p>Sé el primero: a lo mejor los demás también estaban esperando a que alguien diera el paso.</p>
      <button class="btn" data-act="compose">Tengo un rato</button></div>`;
  } else {
    body = `<div class="friends">${list.map(a => {
      const t = timeInfo(a, S.day);
      return `<article class="friend">
        ${avatar(a.emoji, a.color, 48, a.user_id)}
        <div class="f-main">
          <div class="f-name"><b>${esc(a.name)}</b>${a.is_close ? ICON.star : ''}</div>
          <div class="f-time ${t.live ? 'live' : ''}">${t.live ? '<i class="dot"></i>' : ''}<span>${esc(t.text)}</span></div>
          ${a.note ? `<div class="bubble" style="--tone:var(--t-${colorOf(a.color)})">${esc(a.note)}</div>` : ''}
          <div class="f-meta">${a.city && norm(a.city) !== norm(P.city) ? `<span class="tag city">📍 ${esc(a.city)}</span>` : ''}${(a.groups || []).slice(0, 3).map(g => `<span class="tag">${esc(g)}</span>`).join('')}</div>
        </div>
        ${a.whatsapp ? `<a class="btn btn-wa" href="${esc(waLink(a))}" target="_blank" rel="noopener" aria-label="Escribir a ${esc(first(a.name))} por WhatsApp">${ICON.chat}<span class="wa-label">Escribir</span></a>` : '<span class="no-wa">Sin WhatsApp</span>'}
      </article>`;
    }).join('')}</div>`;
  }

  return `<header class="top">
      <button class="me-btn" data-act="tab" data-v="me" aria-label="Mi perfil">${avatar(P.emoji, P.color, 46, P.id)}</button>
      <div class="grow"><p class="hello">Hola, ${esc(first(P.display_name))}</p><h1>¿Quién tiene un rato?</h1></div>
      <button class="icon-btn" data-act="refresh" aria-label="Actualizar">${ICON.refresh}</button>
    </header>
    ${hero}${asks}
    <div class="days" role="group" aria-label="Elegir día">${chips}</div>
    <div class="list-head"><h2>Libres ${esc(dayTitle(S.day))}${list.length ? ` · ${list.length}` : ''}</h2>${pick}</div>
    ${body}`;
}

function viewPeople() {
  const q = norm(S.ui.q);
  const contacts = S.contacts.filter(c => !q || norm(c.nickname || c.name).includes(q));
  const url = inviteUrl(S.code, 'person');
  const rows = contacts.map(c => {
    const gs = S.groups.filter(g => g.members.includes(c.id)).map(g => g.name);
    return `<button class="row-item" data-act="open-contact" data-id="${esc(c.id)}">
      ${avatar(c.emoji, c.color, 44, c.id)}
      <span class="grow"><b>${esc(c.nickname || c.name)}</b><span class="sub">${esc([c.nickname ? c.name : '', c.city, ...gs].filter(Boolean).join(' · ') || 'Sin grupos en común')}</span></span>
      <span class="flags">${c.hide_my_status ? ICON.eyeoff : ''}${c.is_close ? ICON.star : ''}</span></button>`;
  }).join('');
  return `<header class="top"><div class="grow"><h1>Tu gente</h1></div></header>
    <section class="share-card">
      <h2>Tu enlace</h2><p>Pásalo a quien quieras ver en Rato. Cuando lo abra, quedaréis conectados.</p>
      <div class="row">
        <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Añádeme en Rato para ver cuándo tenemos un rato libre 👉 ' + url)}">${ICON.chat}<span>Enviar por WhatsApp</span></a>
        <button class="btn-ghost" data-act="copy-link" data-url="${esc(url)}">${ICON.link}<span>Copiar</span></button>
      </div></section>
    <section class="sec"><div class="sec-head"><h2>Grupos</h2></div>
      <div class="groups">
        ${S.groups.map(g => `<button class="g-tile" data-act="open-group" data-id="${esc(g.id)}"><span class="em">${esc(g.emoji)}</span><b>${esc(g.name)}</b><span>${g.members.length} ${g.members.length === 1 ? 'persona' : 'personas'}</span></button>`).join('')}
        <button class="g-tile add" data-act="new-group">${ICON.plus}<span>Nuevo grupo</span></button>
      </div>
      <button class="link-btn small" style="margin-top:10px" data-act="join-link">Tengo un enlace o código</button>
    </section>
    <section class="sec"><div class="sec-head"><h2>Contactos${S.contacts.length ? ` · ${S.contacts.length}` : ''}</h2></div>
      ${S.contacts.length > 8 ? `<input class="search" type="search" placeholder="Buscar" aria-label="Buscar contactos" data-bind="ui.q" data-render="people-list" value="${esc(S.ui.q)}">` : ''}
      ${contacts.length ? `<div class="rows" id="contact-rows">${rows}</div>` : `<div class="empty" style="padding-top:10px"><p>${S.contacts.length ? 'Nadie con ese nombre.' : 'Aún no tienes contactos. Comparte tu enlace o entra a un grupo.'}</p></div>`}
      ${S.contacts.length ? '<p class="small muted" style="margin-top:12px">Toca a alguien para marcarlo como cercano, ponerle apodo o dejar de mostrarle tus ratos.</p>' : ''}
    </section>`;
}

function viewMe() {
  const P = S.profile;
  const mine = S.myStatuses;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const rows = mine.map(s => {
    const st = new Date(s.starts_at), en = new Date(s.ends_at);
    const off = offsetOf(st);
    return `<div class="status-row"><div class="grow"><b>${st <= new Date() ? 'Ahora' : dayLabel(off)} · ${hhmm(st)} – ${hhmm(en)}</b>
      <span>${esc([s.note, audLabel(s), s.city].filter(Boolean).join(' · '))}</span></div>
      <button class="icon-btn" data-act="del-status" data-id="${esc(s.id)}" aria-label="Borrar este rato">${ICON.trash}</button></div>`;
  }).join('');
  return `${DEMO ? '<div class="demo-flag">Modo demo · los datos no se guardan</div>' : ''}
    <header class="top"><div class="grow"><h1>Yo</h1></div></header>
    <section class="profile-card">${avatar(P.emoji, P.color, 72, P.id)}
      <div class="grow"><h2>${esc(P.display_name)}</h2><p class="muted small">${esc(P.city || 'Sin ciudad')} · ${S.phone ? esc(fmtPhone(S.phone)) : 'Sin WhatsApp'}</p>
      <button class="btn-ghost" style="margin-top:10px;min-height:38px;padding:4px 14px" data-act="edit-profile">Editar perfil</button></div></section>
    <section class="sec"><div class="sec-head"><h2>Mis ratos</h2><button class="btn btn-sm" data-act="compose">${ICON.plus}<span>Añadir</span></button></div>
      ${mine.length ? `<div class="rows">${rows}</div>` : '<p class="muted">No tienes ningún rato marcado.</p>'}</section>
    <section class="sec"><div class="note-card"><b>Tu privacidad:</b> solo ven cada rato las personas que elijas al crearlo. Tu WhatsApp solo se muestra a quien puede verte libre en ese momento.</div></section>
    ${standalone ? '' : `<section class="sec"><div class="note-card" style="background:var(--t-sun)"><b>Ábrela como una app:</b> en el móvil, usa «Compartir → Añadir a pantalla de inicio» (iPhone) o el menú ⋮ → «Instalar app» (Android).</div></section>`}
    <div class="stack-btns"><button class="btn-ghost" data-act="logout">Cerrar sesión</button>
      <button class="link-btn small btn-danger" data-act="delete-account" style="margin-top:8px">Borrar mi cuenta</button></div>`;
}

function render() {
  const root = $('#app'), tabs = $('#tabs');
  let html;
  const main = S.screen === 'main';
  if (S.screen === 'loading') html = viewLoading();
  else if (S.screen === 'welcome') html = viewWelcome();
  else if (S.screen === 'onboarding') html = viewOnboarding();
  else html = S.tab === 'home' ? viewHome() : S.tab === 'people' ? viewPeople() : viewMe();
  root.classList.toggle('bare', !main);
  root.innerHTML = html;
  tabs.hidden = !main;
  if (main) {
    const tab = (id, icon, label) => `<button class="tab ${S.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></button>`;
    tabs.innerHTML = tab('home', ICON.sun, 'Libres') + tab('people', ICON.people, 'Gente') + tab('me', ICON.user, 'Yo');
  }
}

/* ============ Hojas ============ */
function openSheet(name, data) {
  S.sheet = { name, data };
  if (!$('#sheet')) {
    $('#sheet-root').innerHTML = '<div class="sheet-wrap"><div class="scrim" data-act="close-sheet"></div><section class="sheet" id="sheet" role="dialog" aria-modal="true"></section></div>';
    document.body.classList.add('noscroll');
  }
  renderSheet();
  $('#sheet').scrollTop = 0;
}
function renderSheet() {
  const sh = $('#sheet');
  if (!sh || !S.sheet) return;
  const keep = sh.scrollTop;
  sh.setAttribute('aria-label', S.sheet.name);
  sh.innerHTML = '<div class="grab"></div>' + SHEETS[S.sheet.name](S.sheet.data);
  sh.scrollTop = keep;
}
function closeSheet() {
  S.sheet = null;
  $('#sheet-root').innerHTML = '';
  document.body.classList.remove('noscroll');
}

/* --- Composer --- */
function openComposer() {
  let last = {};
  try { last = JSON.parse(localStorage.getItem('rato.aud') || '{}'); } catch (_) {}
  const now = new Date();
  const st = {
    preset: 'now', day: 0, from: hhmm(now), to: hhmm(new Date(+now + 2 * 36e5)), note: '', city: S.profile.city || '',
    audience: last.audience || 'all', groupId: last.groupId || '', excluded: [], showExcl: false, busy: false,
  };
  if (st.audience === 'group' && !S.groups.some(g => g.id === st.groupId)) st.audience = 'all';
  if (st.audience === 'group' && !st.groupId) st.groupId = S.groups[0]?.id || '';
  openSheet('composer', st);
}
function range(st) {
  const a = at(st.day, st.from);
  let b = at(st.day, st.to);
  if (b <= a) b = new Date(+b + 864e5);
  return [a, b];
}
function audienceIds(st) {
  let list = S.contacts.filter(c => !c.hide_my_status);
  if (st.audience === 'close') list = list.filter(c => c.is_close);
  if (st.audience === 'group') { const g = S.groups.find(x => x.id === st.groupId); const m = new Set(g ? g.members : []); list = list.filter(c => m.has(c.id)); }
  return list.filter(c => !st.excluded.includes(c.id));
}
function sheetComposer(st) {
  const days = [0, 1, 2, 3, 4, 5, 6, 7].map(o => `<button type="button" class="chip ${st.day === o ? 'on' : ''}" data-act="c-day" data-v="${o}">${dayLabel(o)}</button>`).join('');
  const presets = Object.entries(PRESETS).filter(([k]) => k !== 'now' || st.day === 0)
    .map(([k, p]) => `<button type="button" class="chip ${st.preset === k ? 'on' : ''}" data-act="c-preset" data-v="${k}">${p.label}</button>`).join('');
  const [a, b] = range(st);
  const crosses = offsetOf(b) > offsetOf(a);
  const ids = audienceIds(st);
  const notes = NOTE_IDEAS.map(n => `<button type="button" class="chip ${st.note === n ? 'on' : ''}" data-act="c-note" data-v="${esc(n)}">${esc(n)}</button>`).join('');
  const aud = [['all', 'Todos'], ['close', 'Cercanos'], ['group', 'Un grupo']]
    .map(([k, l]) => `<button type="button" class="${st.audience === k ? 'on' : ''}" data-act="c-aud" data-v="${k}">${l}</button>`).join('');
  const groupSel = st.audience === 'group'
    ? (S.groups.length
      ? `<select class="input" style="margin-top:10px" aria-label="Grupo" data-bind="sheet.data.groupId" data-render="sheet">${S.groups.map(g => `<option value="${esc(g.id)}" ${g.id === st.groupId ? 'selected' : ''}>${esc(g.emoji)} ${esc(g.name)}</option>`).join('')}</select>`
      : '<p class="hint">Aún no tienes grupos. Créalos en la pestaña Gente.</p>') : '';
  const excl = st.showExcl
    ? `<div class="chips box" style="margin-top:10px">${S.contacts.map(c => `<button type="button" class="chip ${st.excluded.includes(c.id) ? 'off' : ''}" data-act="c-excl" data-id="${esc(c.id)}">${esc(c.nickname || c.name)}</button>`).join('') || '<span class="hint">Aún no tienes contactos.</span>'}</div>`
    : '';
  return `<h2>Tengo un rato</h2>
    <p class="lead">Elige cuándo y quién puede verlo.</p>
    <div class="field" style="margin-top:6px"><div class="lbl">¿Cuándo?</div>
      <div class="chips scroll" style="margin-bottom:10px">${days}</div>
      <div class="chips" style="margin-bottom:10px">${presets}</div>
      <div class="row2">
        <div><label class="small muted" for="c-from">De</label><input id="c-from" class="input" type="time" required data-bind="sheet.data.from" data-render="sheet" value="${st.from}"></div>
        <div><label class="small muted" for="c-to">A</label><input id="c-to" class="input" type="time" required data-bind="sheet.data.to" data-render="sheet" value="${st.to}"></div>
      </div>
      ${crosses ? `<p class="hint">Termina a las ${hhmm(b)} del día siguiente.</p>` : ''}</div>
    <div class="field"><label for="c-note">¿Qué te apetece? <span class="muted" style="font-weight:500">(opcional)</span></label>
      <input id="c-note" class="input" maxlength="80" placeholder="Una caña, pasear, lo que sea…" data-bind="sheet.data.note" value="${esc(st.note)}">
      <div class="chips scroll" style="margin-top:10px">${notes}</div></div>
    <div class="field"><label for="c-city">¿Dónde?</label>
      <input id="c-city" class="input" maxlength="60" placeholder="Ciudad" data-bind="sheet.data.city" value="${esc(st.city)}">
      <p class="hint">Cámbiala si vas a estar en otra ciudad ese día.</p></div>
    <div class="field"><div class="lbl">¿Quién puede verlo?</div>
      <div class="seg">${aud}</div>${groupSel}
      <button type="button" class="link-btn small" style="margin-top:12px" data-act="c-showexcl">${st.showExcl ? 'Ocultar' : (st.excluded.length ? `Excepto ${st.excluded.length} persona${st.excluded.length === 1 ? '' : 's'}…` : 'Excepto…')}</button>${excl}
      <p class="summary ${ids.length ? '' : 'warn'}">${ids.length ? `Lo verán ${ids.length} ${ids.length === 1 ? 'persona' : 'personas'}` : 'Ahora mismo no lo vería nadie'}</p></div>
    <button class="btn btn-block" data-act="c-publish" ${st.busy ? 'disabled' : ''}>${st.busy ? 'Publicando…' : 'Avisar a mis amigos'}</button>`;
}

/* --- Contacto --- */
function sheetContact(d) {
  const c = S.contacts.find(x => x.id === d.id);
  if (!c) return '<p>Este contacto ya no existe.</p>';
  const gs = S.groups.filter(g => g.members.includes(c.id)).map(g => g.name);
  return `<div class="sheet-head">${avatar(c.emoji, c.color, 64, c.id)}<div class="grow"><h2>${esc(c.nickname || c.name)}</h2><p class="muted small">${esc([c.nickname ? c.name : '', c.city, ...gs].filter(Boolean).join(' · '))}</p></div></div>
    <div class="field" style="margin-top:0"><label for="c-nick">Apodo <span class="muted" style="font-weight:500">(solo lo ves tú)</span></label>
      <input id="c-nick" class="input" maxlength="40" placeholder="${esc(c.name)}" data-bind="sheet.data.nickname" data-save="nick" value="${esc(d.nickname)}"></div>
    <div class="toggle-row" style="margin-top:12px"><div class="grow"><b>Círculo cercano</b><span>Para ratos que solo quieres compartir con tu gente más cercana.</span></div>
      <button class="switch" role="switch" aria-checked="${c.is_close}" aria-label="Círculo cercano" data-act="c-toggle" data-k="is_close"></button></div>
    <div class="toggle-row"><div class="grow"><b>No mostrarme disponible</b><span>${esc(first(c.name))} nunca verá tus ratos. No se entera.</span></div>
      <button class="switch warn" role="switch" aria-checked="${c.hide_my_status}" aria-label="No mostrarme disponible" data-act="c-toggle" data-k="hide_my_status"></button></div>
    <button class="btn-ghost btn-block btn-danger" data-act="c-remove">Quitar de mis contactos</button>`;
}

/* --- Grupo --- */
function sheetGroup(d) {
  const g = S.groups.find(x => x.id === d.id);
  if (!g) return '<p>Este grupo ya no existe.</p>';
  const url = inviteUrl(g.code, 'group');
  const members = S.contacts.filter(c => g.members.includes(c.id));
  return `<div class="sheet-head"><span class="display" style="font-size:44px;line-height:1">${esc(g.emoji)}</span><div class="grow"><h2>${esc(g.name)}</h2><p class="muted small">${g.members.length} ${g.members.length === 1 ? 'persona' : 'personas'}</p></div></div>
    <p class="lead small">Un grupo es solo una etiqueta: no tiene chat ni notificaciones. Quien entre con el enlace quedará conectado con todos.</p>
    <div class="share-card" style="padding:16px"><div class="row" style="display:flex;gap:10px;flex-wrap:wrap">
      <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Entra a «' + g.name + '» en Rato para ver quién tiene un rato libre 👉 ' + url)}">${ICON.chat}<span>Enviar por WhatsApp</span></a>
      <button class="btn-ghost" data-act="copy-link" data-url="${esc(url)}">${ICON.link}<span>Copiar enlace</span></button></div></div>
    ${members.length ? `<div class="field"><div class="lbl">Contactos en este grupo</div><div class="chips">${members.map(m => `<span class="tag" style="font-size:13px;padding:4px 10px">${esc(m.nickname || m.name)}</span>`).join('')}</div></div>` : ''}
    <button class="btn-ghost btn-block btn-danger" data-act="g-leave">Salir del grupo</button>`;
}
function sheetNewGroup(d) {
  const em = GROUP_EMOJIS.map(e => `<button type="button" class="${d.emoji === e ? 'on' : ''}" data-act="ng-emoji" data-v="${e}" aria-label="Icono ${e}">${e}</button>`).join('');
  return `<h2>Nuevo grupo</h2><p class="lead">Pásale el enlace a tu gente y entrarán de golpe.</p>
    <form data-form="newgroup">
      <div class="field" style="margin-top:0"><label for="ng-name">Nombre</label>
        <input id="ng-name" class="input" maxlength="40" placeholder="Los de la uni, Fútbol, Cuadrilla…" required data-bind="sheet.data.name" value="${esc(d.name)}"></div>
      <div class="field"><div class="lbl">Icono</div><div class="emoji-grid">${em}</div></div>
      <button class="btn btn-block" type="submit" ${d.busy ? 'disabled' : ''}>${d.busy ? 'Creando…' : 'Crear grupo'}</button>
    </form>`;
}

/* --- Invitación --- */
function sheetInvite(d) {
  if (!d.preview) {
    return `<h2>Unirme con un enlace</h2><p class="lead">Pega el enlace o el código que te han pasado.</p>
      <form data-form="invite-next">
        <input class="input" placeholder="https://… o código" aria-label="Enlace o código" required data-bind="sheet.data.text" value="${esc(d.text)}">
        ${d.error ? `<p class="err" style="margin-top:8px">${esc(d.error)}</p>` : ''}
        <button class="btn btn-block" type="submit" ${d.busy ? 'disabled' : ''}>Continuar</button>
      </form>`;
  }
  const p = d.preview, isGroup = p.kind === 'group';
  return `<div style="text-align:center;padding:6px 0 4px">
      ${isGroup ? `<span class="display" style="font-size:60px;line-height:1">${esc(p.emoji)}</span>` : `<div style="display:flex;justify-content:center">${avatar(p.emoji, p.color, 84, p.name)}</div>`}
      <h2 style="margin-top:12px">${isGroup ? `Grupo «${esc(p.name)}»` : esc(p.name)}</h2>
      <p class="lead" style="max-width:32ch;margin:6px auto 0">${isGroup
        ? `Si entras, te conectarás con ${p.members > 1 ? 'sus ' + p.members + ' miembros' : 'su creador'} y podréis veros cuando alguien tenga un rato.`
        : `Si os conectáis, podréis veros cuando alguno tenga un rato libre.`}</p></div>
    <button class="btn btn-block" data-act="inv-accept" ${d.busy ? 'disabled' : ''}>${d.busy ? 'Conectando…' : (isGroup ? 'Entrar al grupo' : 'Conectar')}</button>
    <button class="btn-ghost btn-block" data-act="close-sheet">Ahora no</button>`;
}

/* --- Perfil --- */
function sheetProfile(d) {
  return `<h2>Editar perfil</h2>
    <form data-form="profile">${profileFields(d, 'sheet.data')}
      <button class="btn btn-block" type="submit" ${d.busy ? 'disabled' : ''}>${d.busy ? 'Guardando…' : 'Guardar'}</button></form>`;
}

/* --- Confirmación genérica --- */
function sheetConfirm(d) {
  return `<h2>${esc(d.title)}</h2><p class="lead">${esc(d.text)}</p>
    <button class="btn btn-block" style="${d.danger ? 'background:var(--coral)' : ''}" data-act="confirm-ok">${esc(d.okLabel)}</button>
    <button class="btn-ghost btn-block" data-act="close-sheet">Cancelar</button>`;
}
const SHEETS = { composer: sheetComposer, contact: sheetContact, group: sheetGroup, newgroup: sheetNewGroup, invite: sheetInvite, profile: sheetProfile, confirm: sheetConfirm };
function askConfirm(title, text, okLabel, onOk, danger = true) { openSheet('confirm', { title, text, okLabel, onOk, danger }); }

/* ============ Carga de datos ============ */
async function loadAll(manual) {
  const r = await run(async () => {
    const [contacts, groups, my, avail] = await Promise.all([api.getContacts(), api.getGroups(), api.getMyStatuses(), api.getAvailable()]);
    contacts.sort((a, b) => (b.is_close - a.is_close) || (a.nickname || a.name).localeCompare(b.nickname || b.name, 'es'));
    my.sort((x, y) => +new Date(x.starts_at) - +new Date(y.starts_at));
    S.contacts = contacts; S.groups = groups; S.myStatuses = my; S.available = avail; S.loaded = true;
    return true;
  });
  if (r && S.screen === 'main') { render(); if (manual) toast('Actualizado'); }
}

async function loadMe() {
  let me;
  for (let i = 0; i < 3 && !me; i++) {
    try { me = await api.getMe(); } catch (e) { if (i === 2) throw e; await new Promise(r => setTimeout(r, 600)); }
  }
  S.profile = me.profile; S.phone = me.phone; S.code = me.code;
}

async function onSession(sess) {
  const uid = sess?.user?.id || null;
  if (uid && uid === S.uid) return;            // evento duplicado o refresco de token
  if (!uid && S.screen === 'welcome') return;
  S.uid = uid;
  S.loaded = false;
  if (!uid) {
    S.screen = 'welcome'; S.profile = null;
    S.auth = { step: 'choose', email: '', token: '', busy: false, error: '' };
    loadPendingPreview();
    render();
    return;
  }
  S.email = sess.user.email || '';
  const ok = await run(async () => { await loadMe(); return true; });
  if (!ok) { S.uid = null; S.screen = 'welcome'; render(); return; }
  if (!S.profile.onboarded) {
    S.form = { name: S.profile.display_name, city: S.profile.city || '', phone: S.phone ? fmtPhone(S.phone) : '', emoji: S.profile.emoji, color: S.profile.color, busy: false };
    S.screen = 'onboarding';
    render();
    return;
  }
  S.screen = 'main'; S.tab = 'home';
  render();
  await loadAll();
  handlePending();
}

/* ============ Invitaciones pendientes ============ */
function initPending() {
  const code = params.get('u') || params.get('g');
  if (code) {
    try { localStorage.setItem('rato.pending', code.toLowerCase().replace(/[^a-z0-9]/g, '')); } catch (_) {}
    history.replaceState(null, '', location.pathname + (DEMO ? '?demo=' + (params.get('demo') || '1') : ''));
  }
}
function pendingCode() { try { return localStorage.getItem('rato.pending') || ''; } catch (_) { return ''; } }
function clearPending() { try { localStorage.removeItem('rato.pending'); } catch (_) {} }
async function loadPendingPreview() {
  const code = pendingCode();
  if (!code) { S.pendingPreview = null; return; }
  try { S.pendingPreview = await api.preview(code); } catch (_) { S.pendingPreview = null; }
  if (S.screen === 'welcome') render();
}
async function handlePending() {
  const code = pendingCode();
  if (!code) return;
  const p = await run(() => api.preview(code));
  clearPending();
  if (!p) { toast('Ese enlace de invitación ya no es válido.'); return; }
  openSheet('invite', { text: '', code, preview: p, busy: false, error: '' });
}
function parseInvite(text) {
  const t = String(text || '').trim();
  try { const u = new URL(t); return (u.searchParams.get('u') || u.searchParams.get('g') || '').toLowerCase(); } catch (_) {}
  const m = t.match(/[?&](?:u|g)=([a-z0-9]+)/i);
  if (m) return m[1].toLowerCase();
  return t.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

/* ============ Acciones ============ */
function getRoot(root) { return root === 'form' ? S.form : S.sheet.data; }
function rerenderRoot(root) { if (root === 'form') render(); else renderSheet(); }

const ACTIONS = {
  tab(t) { S.tab = t.dataset.v; render(); window.scrollTo(0, 0); },
  day(t) { S.day = +t.dataset.v; render(); },
  refresh() { loadAll(true); },
  compose() { openComposer(); },
  'close-sheet'() { closeSheet(); },

  async 'end-status'(t) {
    const r = await run(async () => { await api.deleteStatus(t.dataset.id); return true; });
    if (r) { toast('Listo, ya no apareces como libre'); await loadAll(); }
  },
  async 'confirm-yes'(t) { const r = await run(async () => { await api.confirmStatus(t.dataset.id); return true; }); if (r) { toast('¡Genial!'); await loadAll(); } },
  async 'confirm-no'(t) { const r = await run(async () => { await api.deleteStatus(t.dataset.id); return true; }); if (r) { toast('Rato quitado'); await loadAll(); } },
  async 'del-status'(t) { const r = await run(async () => { await api.deleteStatus(t.dataset.id); return true; }); if (r) { toast('Rato borrado'); await loadAll(); } },

  /* composer */
  'c-day'(t) {
    const d = S.sheet.data; d.day = +t.dataset.v;
    if (d.day > 0 && d.preset === 'now') { d.preset = 'tarde'; d.from = PRESETS.tarde.from; d.to = PRESETS.tarde.to; }
    renderSheet();
  },
  'c-preset'(t) {
    const d = S.sheet.data, k = t.dataset.v; d.preset = k;
    if (k === 'now') { const n = new Date(); d.day = 0; d.from = hhmm(n); d.to = hhmm(new Date(+n + 2 * 36e5)); } else { d.from = PRESETS[k].from; d.to = PRESETS[k].to; }
    renderSheet();
  },
  'c-note'(t) { const d = S.sheet.data; d.note = d.note === t.dataset.v ? '' : t.dataset.v; renderSheet(); },
  'c-aud'(t) {
    const d = S.sheet.data; d.audience = t.dataset.v;
    if (d.audience === 'group' && !d.groupId) d.groupId = S.groups[0]?.id || '';
    renderSheet();
  },
  'c-showexcl'() { S.sheet.data.showExcl = !S.sheet.data.showExcl; renderSheet(); },
  'c-excl'(t) {
    const d = S.sheet.data, id = t.dataset.id;
    d.excluded = d.excluded.includes(id) ? d.excluded.filter(x => x !== id) : [...d.excluded, id];
    renderSheet();
  },
  async 'c-publish'() {
    const d = S.sheet.data;
    const [a0, b] = range(d);
    const a = d.preset === 'now' && d.day === 0 ? new Date() : a0;
    if (b <= new Date()) { toast('Ese rato ya ha pasado. Cambia la hora.'); return; }
    if (d.audience === 'group' && !d.groupId) { toast('Elige un grupo o cambia la audiencia.'); return; }
    d.busy = true; renderSheet();
    const row = {
      starts_at: a.toISOString(), ends_at: b.toISOString(), note: d.note.trim() || null, city: d.city.trim() || null,
      audience: d.audience, audience_group_id: d.audience === 'group' ? d.groupId : null, excluded_ids: d.excluded,
    };
    const r = await run(async () => { await api.createStatus(row); return true; });
    if (!r) { d.busy = false; renderSheet(); return; }
    try { localStorage.setItem('rato.aud', JSON.stringify({ audience: d.audience, groupId: d.groupId })); } catch (_) {}
    closeSheet();
    S.tab = 'home';
    toast('¡Listo! Tus amigos ya pueden verte');
    await loadAll();
  },

  /* contactos */
  'open-contact'(t) { const c = S.contacts.find(x => x.id === t.dataset.id); if (c) openSheet('contact', { id: c.id, nickname: c.nickname }); },
  async 'c-toggle'(t) {
    const c = S.contacts.find(x => x.id === S.sheet.data.id), k = t.dataset.k;
    if (!c) return;
    const prev = c[k]; c[k] = !prev; renderSheet();
    const r = await run(async () => { await api.updateContact(c.id, { [k]: c[k] }); return true; });
    if (!r) { c[k] = prev; renderSheet(); return; }
    if (k === 'hide_my_status' && c[k]) toast(`${first(c.name)} ya no verá tus ratos`);
    render();
  },
  'c-remove'() {
    const c = S.contacts.find(x => x.id === S.sheet.data.id);
    if (!c) return;
    askConfirm(`¿Quitar a ${first(c.name)}?`, 'Dejaréis de veros mutuamente. Podéis volver a conectar con un enlace.', 'Quitar', async () => {
      const r = await run(async () => { await api.removeContact(c.id); return true; });
      if (r) { closeSheet(); toast('Contacto quitado'); await loadAll(); }
    });
  },

  /* grupos */
  'open-group'(t) { openSheet('group', { id: t.dataset.id }); },
  'new-group'() { openSheet('newgroup', { name: '', emoji: GROUP_EMOJIS[0], busy: false }); },
  'ng-emoji'(t) { S.sheet.data.emoji = t.dataset.v; renderSheet(); },
  'g-leave'() {
    const g = S.groups.find(x => x.id === S.sheet.data.id);
    if (!g) return;
    askConfirm(`¿Salir de «${g.name}»?`, 'Seguiréis conectados como contactos, pero se borrarán tus ratos que solo veía este grupo.', 'Salir del grupo', async () => {
      const r = await run(async () => { await api.leaveGroup(g.id); return true; });
      if (r) { closeSheet(); toast('Has salido del grupo'); await loadAll(); }
    });
  },
  'join-link'() { openSheet('invite', { text: '', preview: null, busy: false, error: '' }); },
  async 'inv-accept'() {
    const d = S.sheet.data;
    d.busy = true; renderSheet();
    const r = await run(async () => (d.preview.kind === 'group' ? api.joinGroup(d.code) : api.connect(d.code)));
    if (!r) { d.busy = false; renderSheet(); return; }
    closeSheet();
    toast(d.preview.kind === 'group' ? `Has entrado en «${d.preview.name}»` : `Ya estás conectado con ${first(d.preview.name)}`);
    S.tab = 'people';
    await loadAll();
  },

  /* compartir */
  async 'copy-link'(t) {
    const url = t.dataset.url;
    try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
    catch (_) { window.prompt('Copia este enlace:', url); }
  },

  /* perfil */
  'edit-profile'() {
    const P = S.profile;
    openSheet('profile', { name: P.display_name, city: P.city || '', phone: S.phone ? fmtPhone(S.phone) : '', emoji: P.emoji, color: P.color, busy: false });
  },
  'pf-emoji'(t) { getRoot(t.dataset.root).emoji = t.dataset.v; rerenderRoot(t.dataset.root); },
  'pf-color'(t) { getRoot(t.dataset.root).color = t.dataset.v; rerenderRoot(t.dataset.root); },
  logout() {
    askConfirm('¿Cerrar sesión?', 'Tus datos se quedan guardados. Volverás a entrar con Google o con tu email.', 'Cerrar sesión', async () => {
      closeSheet();
      await api.signOut();
      S.uid = null; S.screen = 'loading';
      await onSession(null);
    }, false);
  },
  'delete-account'() {
    askConfirm('¿Borrar tu cuenta?', 'Se eliminarán tu perfil, tus ratos y tus conexiones. No se puede deshacer.', 'Borrar mi cuenta', async () => {
      const r = await run(async () => { await api.deleteAccount(); return true; });
      if (r) { closeSheet(); S.uid = null; S.screen = 'loading'; await onSession(null); toast('Cuenta borrada'); }
    });
  },
  async 'confirm-ok'() { const fn = S.sheet?.data?.onOk; if (fn) await fn(); },

  /* acceso */
  async 'auth-google'() { await run(() => api.signInGoogle()); },
  'auth-email-mode'() { S.auth.step = 'email'; S.auth.error = ''; render(); },
  'auth-back'() { S.auth.step = S.auth.step === 'code' ? 'email' : 'choose'; S.auth.error = ''; render(); },
  async 'auth-resend'() { await sendEmailCode(true); },
};

async function sendEmailCode(resend) {
  const a = S.auth;
  const email = a.email.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) { a.error = 'Escribe un email válido.'; render(); return; }
  a.email = email; a.busy = true; a.error = ''; render();
  try { await api.sendEmail(email); a.step = 'code'; a.token = ''; if (resend) toast('Correo reenviado'); }
  catch (e) { console.error(e); a.error = errText(e); }
  a.busy = false; render();
}

const FORMS = {
  send() { sendEmailCode(false); },
  async verify() {
    const a = S.auth, token = a.token.replace(/\s/g, '');
    if (token.length < 6) { a.error = 'Escribe el código completo.'; render(); return; }
    a.busy = true; a.error = ''; render();
    try { await api.verifyEmail(a.email, token); }
    catch (e) { console.error(e); a.busy = false; a.error = errText(e); render(); }
  },
  async onboard() { await saveProfileFrom(S.form, true); },
  async profile() { await saveProfileFrom(S.sheet.data, false); },
  async newgroup() {
    const d = S.sheet.data;
    if (!d.name.trim()) return;
    d.busy = true; renderSheet();
    const r = await run(() => api.createGroup(d.name.trim(), d.emoji));
    if (!r) { d.busy = false; renderSheet(); return; }
    await loadAll();
    openSheet('group', { id: r.id });
  },
  async 'invite-next'() {
    const d = S.sheet.data, code = parseInvite(d.text);
    if (!code) { d.error = 'Pega un enlace o código válido.'; renderSheet(); return; }
    d.busy = true; d.error = ''; renderSheet();
    const p = await run(() => api.preview(code));
    d.busy = false;
    if (!p) { d.error = 'No encuentro ese enlace. Revisa que esté completo.'; renderSheet(); return; }
    d.code = code; d.preview = p; renderSheet();
  },
};

async function saveProfileFrom(f, onboarding) {
  const name = f.name.trim();
  if (!name) { toast('Escribe tu nombre.'); return; }
  const phone = normPhone(f.phone);
  if (phone === null) { toast('Ese WhatsApp no parece válido. Prueba con el prefijo, por ejemplo +34 612 345 678.'); return; }
  f.busy = true; rerenderRoot(onboarding ? 'form' : 'sheet');
  const r = await run(async () => {
    await api.saveProfile({ display_name: name, city: f.city.trim() || null, emoji: f.emoji, color: f.color, onboarded: true });
    await api.savePhone(phone);
    await loadMe();
    return true;
  });
  f.busy = false;
  if (!r) { rerenderRoot(onboarding ? 'form' : 'sheet'); return; }
  if (onboarding) {
    S.screen = 'main'; S.tab = 'home'; render(); await loadAll(); handlePending();
  } else { closeSheet(); toast('Perfil guardado'); render(); }
}

/* ============ Eventos ============ */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const fn = ACTIONS[t.dataset.act];
  if (fn) { e.preventDefault(); fn(t, e); }
});
document.addEventListener('submit', e => {
  const f = e.target.dataset?.form;
  if (f && FORMS[f]) { e.preventDefault(); FORMS[f](e); }
});
function setPath(path, val) {
  const keys = path.split('.');
  let o = S;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = val;
}
function onField(e) {
  const t = e.target, path = t.dataset?.bind;
  if (!path) return;
  setPath(path, t.value);
  if (e.type !== 'change') {
    if (t.dataset.render === 'people-list') { renderPeopleList(); }
    return;
  }
  if (path === 'sheet.data.from' || path === 'sheet.data.to') S.sheet.data.preset = 'custom';
  if (t.dataset.render === 'sheet') renderSheet();
  if (t.dataset.render === 'main') render();
  if (t.dataset.save === 'nick') saveNick();
}
document.addEventListener('input', onField);
document.addEventListener('change', onField);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.sheet) closeSheet(); });

function renderPeopleList() {
  const keepPos = document.activeElement?.selectionStart;
  render();
  const s = $('.search');
  if (s) { s.focus(); try { s.setSelectionRange(keepPos, keepPos); } catch (_) {} }
}
async function saveNick() {
  const d = S.sheet.data, c = S.contacts.find(x => x.id === d.id);
  if (!c) return;
  const nick = d.nickname.trim();
  if (nick === (c.nickname || '')) return;
  const r = await run(async () => { await api.updateContact(c.id, { nickname: nick || null }); return true; });
  if (r) { c.nickname = nick; renderSheet(); render(); toast('Apodo guardado'); }
}

/* ============ Arranque ============ */
async function boot() {
  initPending();
  if (DEMO) api = window.makeDemoApi(params.get('demo'));
  else if (window.supabase) api = makeRealApi();
  else { $('#app').innerHTML = '<div class="loading"><p>No se ha podido cargar el servicio. Revisa tu conexión y recarga.</p></div>'; return; }
  render();
  api.onAuth(s => onSession(s));
  await onSession(await api.session());
  setInterval(() => {
    if (document.visibilityState === 'visible' && S.screen === 'main' && !S.sheet) loadAll();
  }, 45000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && S.screen === 'main' && !S.sheet) loadAll();
  });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !DEMO) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
