/* Rato — modo demo (abre la app con ?demo=1). Datos ficticios en memoria: nada se guarda.
   ?demo=out  → arranca sin sesión (pantalla de bienvenida). */
'use strict';

window.makeDemoApi = function (mode) {
  const H = 36e5;
  const day = (off, h, m = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); d.setHours(h, m, 0, 0); return d; };
  const iso = d => new Date(d).toISOString();
  const now = Date.now();

  let logged = mode !== 'out';
  const listeners = [];
  const me = { id: 'me', display_name: 'Ale', emoji: '🦊', color: 'sun', city: 'Málaga', onboarded: true };
  let phone = '34600111222';

  const people = {
    p1: { id: 'p1', name: 'Marta', emoji: '🌻', color: 'pink', city: 'Málaga', is_close: true },
    p2: { id: 'p2', name: 'Dani', emoji: '🐙', color: 'blue', city: 'Málaga', is_close: true },
    p3: { id: 'p3', name: 'Carmen', emoji: '🍋', color: 'sun', city: 'Málaga' },
    p4: { id: 'p4', name: 'Sergio', emoji: '🌵', color: 'mint', city: 'Málaga' },
    p5: { id: 'p5', name: 'Irene', emoji: '🦄', color: 'lilac', city: 'Málaga' },
    p6: { id: 'p6', name: 'Pablo', emoji: '🐳', color: 'coral', city: 'Bilbao' },
    p7: { id: 'p7', name: 'Nacho', emoji: '🥑', color: 'mint', city: 'Málaga' },
  };
  let contacts = Object.values(people).map(p => ({ ...p, nickname: '', is_close: !!p.is_close, hide_my_status: false }));
  let groups = [
    { id: 'g1', name: 'Uni', emoji: '🎓', code: 'demogrupo1', members: ['p1', 'p2', 'p4', 'p5'] },
    { id: 'g2', name: 'Fútbol', emoji: '⚽', code: 'demogrupo2', members: ['p2', 'p4', 'p7'] },
    { id: 'g3', name: 'Cuadrilla', emoji: '🌮', code: 'demogrupo3', members: ['p1', 'p3', 'p5', 'p6'] },
  ];
  const gname = ids => groups.filter(g => ids.includes(g.id)).map(g => g.name);
  const av = (uid, sid, st, en, note, extra = {}) => ({
    status_id: sid, user_id: uid, name: people[uid].name, emoji: people[uid].emoji, color: people[uid].color,
    city: people[uid].city, starts_at: iso(st), ends_at: iso(en), note: note || '', whatsapp: '3460000000' + uid.slice(1),
    is_close: !!people[uid].is_close, groups: gname(extra.g || []),
  });
  const avail = [
    av('p1', 's1', now - 0.4 * H, now + 3 * H, 'una caña', { g: ['g1', 'g3'] }),
    av('p4', 's2', now + 1 * H, now + 4.5 * H, '', { g: ['g1', 'g2'] }),
    av('p2', 's3', now + 2.5 * H, now + 5.5 * H, 'cenar', { g: ['g1', 'g2'] }),
    av('p3', 's4', day(1, 11), day(1, 14), 'vermut', { g: ['g3'] }),
    av('p5', 's5', day(1, 17), day(1, 21), 'pasear', { g: ['g1', 'g3'] }),
    { ...av('p6', 's6', day(1, 10), day(1, 20), 'paseo por la ría', { g: ['g3'] }), city: 'Bilbao' },
    { ...av('p6', 's7', day(3, 10), day(3, 20), 'de paso por aquí', { g: ['g3'] }), city: 'Málaga' },
    av('p7', 's8', day(2, 21), day(3, 2), 'cañas', { g: ['g2'] }),
  ];
  let my = [
    { id: 'm1', starts_at: iso(day(3, 18)), ends_at: iso(day(3, 22)), note: 'lo que surja', city: 'Málaga', audience: 'all', audience_group_id: null, excluded_ids: [], confirmed_at: null, created_at: iso(now - 5 * H) },
  ];
  let seq = 100;
  const wait = v => new Promise(r => setTimeout(() => r(v), 120));
  const fakeSession = () => (logged ? { user: { id: 'me', email: 'demo@rato.app' } } : null);

  return {
    async session() { return fakeSession(); },
    onAuth(cb) { listeners.push(cb); },
    async signInGoogle() { logged = true; listeners.forEach(cb => cb(fakeSession())); },
    async sendEmail() { return wait(); },
    async verifyEmail() { logged = true; listeners.forEach(cb => cb(fakeSession())); },
    async signOut() { logged = false; },
    async getMe() { return wait({ profile: { ...me }, phone, code: 'demoalex01' }); },
    async saveProfile(p) { Object.assign(me, p); return wait(); },
    async savePhone(w) { phone = w || ''; return wait(); },
    async getContacts() { return wait(contacts.map(c => ({ ...c }))); },
    async getGroups() { return wait(groups.map(g => ({ ...g, members: [...g.members] }))); },
    async getMyStatuses() { return wait(my.filter(s => +new Date(s.ends_at) > Date.now()).map(s => ({ ...s }))); },
    async getAvailable() {
      const hidden = new Set(contacts.filter(c => c.hide_my_status).map(c => c.id));
      return wait(avail.filter(a => +new Date(a.ends_at) > Date.now()).map(a => {
        const c = contacts.find(x => x.id === a.user_id);
        return { ...a, name: (c && c.nickname) || a.name, is_close: c ? c.is_close : false, _h: hidden.has(a.user_id) };
      }));
    },
    async createStatus(row) { my.push({ id: 'm' + (++seq), created_at: iso(Date.now()), confirmed_at: null, ...row }); return wait(); },
    async deleteStatus(id) { my = my.filter(s => s.id !== id); return wait(); },
    async confirmStatus(id) { const s = my.find(x => x.id === id); if (s) s.confirmed_at = iso(Date.now()); return wait(); },
    async updateContact(id, patch) { const c = contacts.find(x => x.id === id); if (c) Object.assign(c, patch, patch.nickname === null ? { nickname: '' } : {}); return wait(); },
    async removeContact(id) { contacts = contacts.filter(c => c.id !== id); return wait(); },
    async createGroup(name, emoji) { const g = { id: 'g' + (++seq), name, emoji, code: 'demonew' + seq, members: [] }; groups.push(g); return wait({ id: g.id, invite_code: g.code }); },
    async joinGroup() { return wait({ id: 'gx', name: 'Demo' }); },
    async leaveGroup(id) { groups = groups.filter(g => g.id !== id); return wait(); },
    async connect() { return wait({ id: 'pz', name: 'Ana' }); },
    async preview(code) {
      if (code === 'demoana') return wait({ kind: 'person', name: 'Ana', emoji: '🍒', color: 'coral' });
      if (code === 'demogrupo') return wait({ kind: 'group', name: 'Escalada', emoji: '🧗', members: 6 });
      return wait(null);
    },
    async deleteAccount() { logged = false; return wait(); },
  };
};
