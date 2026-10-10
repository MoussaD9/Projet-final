'use strict';
let KEY = '';
const STATUSES = ['En attente', 'Confirmée', 'En livraison', 'Livrée', 'Annulée'];
const $ = (s) => document.querySelector(s);
let orders = [];
let view = 'dashboard';
let pendingDelete = null;

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR');
const calculateOrderTotal = (price, qty, ship) => price * qty + ship;
const getOrderById = (id) => orders.find((o) => o.id === id);
const newId = () => 'CF-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

/* ---------- Stockage ---------- */
function loadOrders() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((o) => o && o.id && STATUSES.includes(o.status)) : [];
  } catch (e) { toast('Données locales illisibles : démarrage à vide.', true); return []; }
}
function saveOrders() {
  try { localStorage.setItem(KEY, JSON.stringify(orders)); }
  catch (e) { toast('Enregistrement impossible : exportez vos données.', true); }
}

/* ---------- CRUD ---------- */
function createOrder(d) {
  orders.unshift({ id: newId(), createdAt: new Date().toISOString(), profileId: profile && profile.id, ...d, total: calculateOrderTotal(d.price, d.qty, d.ship) });
  saveOrders();
}
function updateOrder(id, d) {
  const o = getOrderById(id); if (!o) return;
  Object.assign(o, d, { total: calculateOrderTotal(d.price, d.qty, d.ship) });
  saveOrders();
}
function deleteOrder(id) { orders = orders.filter((o) => o.id !== id); saveOrders(); }

/* ---------- Utilitaires DOM sûrs ---------- */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function badge(status) { return el('span', 'badge s' + STATUSES.indexOf(status), status); }
function toast(msg, bad) {
  const t = $('#toast'); t.textContent = (bad ? 'Erreur : ' : '') + msg;
  t.classList.add('show'); clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 3200);
}
function emptyState(text, withBtn) {
  const d = el('div', 'empty', text);
  if (withBtn) { const b = el('button', 'btn primary', '+ Créer ma première commande'); b.type = 'button'; b.addEventListener('click', () => openForm()); d.append(document.createElement('br'), b); }
  return d;
}

/* ---------- WhatsApp ---------- */
function whatsappUrl(o) {
  const num = String(o.phone).replace(/\D/g, '');
  if (num.length < 10 || num.length > 15) return null;
  const msg = `Bonjour ${o.client}, concernant votre commande de ${o.product}, le montant total est de ${fmt(o.total)}. Le statut actuel de votre commande est : ${o.status}. Merci.`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}
function contact(o) {
  const url = whatsappUrl(o);
  if (!url) return toast('Numéro invalide : utilisez le format international sans « + », ex. 221771234567.', true);
  window.open(url, '_blank', 'noopener,noreferrer');
  toast('WhatsApp s\'ouvre avec le message : confirmez l\'envoi vous-même.');
}

/* ---------- Rendu ---------- */
function orderRow(o, full) {
  const r = el('article', 'order');
  const a = el('div'); a.append(el('div', 'who', o.client), el('div', 'sm2', o.phone));
  const b = el('div'); b.append(el('div', '', `${o.product} × ${o.qty}`), el('div', 'sm2', `${o.id} · ${fmtDate(o.createdAt)}`));
  r.append(a, b, el('strong', '', fmt(o.total)), badge(o.status));
  if (full) {
    const acts = el('div', 'acts');
    const sel = el('select'); sel.setAttribute('aria-label', 'Changer le statut de ' + o.client);
    STATUSES.forEach((s) => { const op = el('option', '', s); op.selected = s === o.status; sel.append(op); });
    sel.addEventListener('change', () => { updateOrder(o.id, { ...o, status: sel.value }); renderAll(); toast('Statut mis à jour.'); });
    const mk = (t, fn, c) => { const x = el('button', 'btn sm ' + (c || ''), t); x.type = 'button'; x.addEventListener('click', fn); return x; };
    acts.append(sel, mk('Détails', () => showDetail(o)), mk('Modifier', () => openForm(o)), mk('Contacter sur WhatsApp', () => contact(o)), mk('Supprimer', () => { pendingDelete = o.id; $('#confirm').showModal(); }));
    r.append(acts);
  }
  return r;
}
function renderOrders() {
  const q = $('#q').value.trim().toLowerCase(), fs = $('#fs').value;
  const res = orders.filter((o) => (!fs || o.status === fs) &&
    (!q || [o.client, o.phone, o.product, o.id, o.address].some((v) => String(v || '').toLowerCase().includes(q))));
  const box = $('#list'); box.replaceChildren();
  if (!orders.length) return box.append(emptyState('Aucune commande pour le moment.', true));
  if (!res.length) return box.append(emptyState('Aucune commande ne correspond à votre recherche'));
  if ($('#sort').value === 'asc') res.reverse();
  const w = el('div', 'orders'); res.forEach((o) => w.append(orderRow(o, true))); box.append(w);
}
function updateDashboard() {
  const n = (...s) => orders.filter((o) => s.includes(o.status)).length;
  const sum = (...s) => orders.filter((o) => s.includes(o.status)).reduce((t, o) => t + o.total, 0);
  const k = [
    ['Total commandes', orders.length], ['En attente', n('En attente')],
    ['En cours (confirmées + en livraison)', n('Confirmée', 'En livraison')], ['Livrées', n('Livrée')],
    ['Chiffre d\'affaires livré', fmt(sum('Livrée')), 'rev'], ['À encaisser (non livrées)', fmt(sum('En attente', 'Confirmée', 'En livraison'))]
  ];
  const box = $('#kpis'); box.replaceChildren();
  k.forEach(([l, v, c]) => { const d = el('div', 'kpi ' + (c || '')); d.append(el('div', 'n', String(v)), el('div', 'l', l)); box.append(d); });
  const rec = $('#recent'); rec.replaceChildren(); rec.className = 'recent';
  if (!orders.length) return rec.append(emptyState('Bienvenue ! Ajoutez votre première commande.', true));
  orders.slice(0, 5).forEach((o) => rec.append(orderRow(o, false)));
}
function renderAll() { updateDashboard(); renderOrders(); }

function showDetail(o) {
  const dl = $('#dl'); dl.replaceChildren();
  [['N°', o.id], ['Date', fmtDate(o.createdAt)], ['Client', o.client], ['Téléphone', o.phone], ['Livraison', o.address],
   ['Produit', o.product], ['Quantité', o.qty], ['Prix unitaire', fmt(o.price)], ['Frais de livraison', fmt(o.ship)],
   ['Total', fmt(o.total)], ['Statut', o.status], ['Source', o.source || '—'], ['Note', o.note || '—']].forEach(([a, b]) => dl.append(el('dt', '', a), el('dd', '', String(b))));
  document.querySelectorAll('.wa').forEach((x) => x.remove());
  const w = el('button', 'btn wa', 'Contacter sur WhatsApp'); w.type = 'button'; w.addEventListener('click', () => contact(o));
  $('#dclose').parentNode.prepend(w); $('#detail').showModal();
}

/* ---------- Formulaire ---------- */
const F = ['client', 'phone', 'address', 'product', 'qty', 'price', 'ship', 'status', 'source', 'note'];
function liveTotal() {
  const t = calculateOrderTotal(+$('#price').value || 0, +$('#qty').value || 0, +$('#ship').value || 0);
  $('#total').textContent = fmt(t);
}
function openForm(o) {
  $('#form').reset(); clearErrors();
  $('#dtitle').textContent = o ? 'Modifier la commande' : 'Nouvelle commande';
  $('#id').value = o ? o.id : '';
  if (o) F.forEach((f) => { $('#' + f).value = o[f] ?? ''; }); else $('#status').value = STATUSES[0];
  liveTotal(); $('#dlg').showModal(); $('#client').focus();
}
function clearErrors() { document.querySelectorAll('.err').forEach((e) => (e.textContent = '')); document.querySelectorAll('.bad').forEach((e) => e.classList.remove('bad')); }
function validate() {
  clearErrors(); const errs = {};
  const v = (f) => $('#' + f).value.trim();
  if (!v('client')) errs.client = 'Indiquez le nom du client.';
  if (!v('phone')) errs.phone = 'Indiquez un numéro de téléphone.';
  if (!v('address')) errs.address = 'Indiquez l\'adresse ou la zone de livraison.';
  if (!v('product')) errs.product = 'Indiquez le produit.';
  if (!/^\d+$/.test(v('qty')) || +v('qty') < 1) errs.qty = 'La quantité doit être un entier supérieur à 0.';
  if (v('price') === '' || isNaN(+v('price')) || +v('price') < 0) errs.price = 'Indiquez un prix valide (0 ou plus).';
  if (v('ship') !== '' && (isNaN(+v('ship')) || +v('ship') < 0)) errs.ship = 'Les frais ne peuvent pas être négatifs.';
  Object.entries(errs).forEach(([f, m]) => { document.querySelector(`.err[data-for="${f}"]`).textContent = m; $('#' + f).classList.add('bad'); });
  const first = Object.keys(errs)[0]; if (first) $('#' + first).focus();
  return !first;
}
function onSubmit(e) {
  e.preventDefault(); if (!validate()) return;
  const v = (f) => $('#' + f).value.trim();
  const d = { client: v('client'), phone: v('phone'), address: v('address'), product: v('product'), qty: +v('qty'), price: +v('price'), ship: +v('ship') || 0, status: $('#status').value, source: $('#source').value, note: v('note') };
  const id = $('#id').value;
  if (id) updateOrder(id, d); else createOrder(d);
  $('#dlg').close(); renderAll(); toast(id ? 'Commande modifiée.' : 'Commande enregistrée.');
}

/* ---------- Export / démo ---------- */
function download(name, text, type) {
  const a = el('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
function exportCsv() {
  const cols = ['id', 'createdAt', 'client', 'phone', 'address', 'product', 'qty', 'price', 'ship', 'total', 'status', 'note'];
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  download('commandes.csv', '\ufeff' + [cols.join(','), ...orders.map((o) => cols.map((c) => esc(o[c])).join(','))].join('\n'), 'text/csv');
}
function addDemo() {
  if (!confirm('Ajouter 3 commandes d\'exemple (marquées « EXEMPLE ») ?')) return;
  [['Awa Diop', '221771234567', 'Dakar, Plateau', 'Robe wax', 2, 15000, 2000, 'Livrée'],
   ['Moussa Fall', '221781112233', 'Thiès', 'Baskets', 1, 25000, 3000, 'En livraison'],
   ['Fatou Sow', '221765554433', 'Dakar, Médina', 'Crème karité', 3, 4000, 1000, 'En attente']]
    .forEach(([client, phone, address, product, qty, price, ship, status]) => createOrder({ client, phone, address, product, qty, price, ship, status, note: 'EXEMPLE' }));
  renderAll(); toast('Exemples ajoutés.');
}

/* ---------- Navigation & init ---------- */
const TITLES = { profile: ['Mon profil', 'Gérez les informations de votre boutique.'], dashboard: ['Tableau de bord', 'Un aperçu clair de votre activité.'], orders: ['Commandes', 'Recherchez, suivez et contactez vos clients.'], settings: ['Paramètres', 'Exportez et gérez vos données.'] };
function show(v) {
  view = v;
  document.querySelectorAll('.view').forEach((s) => (s.hidden = s.id !== 'v-' + v));
  document.querySelectorAll('.nav').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
  $('#title').textContent = TITLES[v][0]; $('#sub').textContent = TITLES[v][1];
}
function init() {
  $('#fs').append(new Option('Tous les statuts', ''), ...STATUSES.map((s) => new Option(s, s)));
  STATUSES.forEach((s) => $('#status').append(new Option(s, s)));
  document.querySelectorAll('.nav').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
  $('#newBtn').addEventListener('click', () => openForm());
  $('#form').addEventListener('submit', onSubmit);
  ['price', 'qty', 'ship'].forEach((f) => $('#' + f).addEventListener('input', liveTotal));
  $('#cancel').addEventListener('click', () => $('#dlg').close());
  $('#dclose').addEventListener('click', () => $('#detail').close());
  $('#no').addEventListener('click', () => $('#confirm').close());
  $('#yes').addEventListener('click', () => { deleteOrder(pendingDelete); $('#confirm').close(); renderAll(); toast('Commande supprimée.'); });
  $('#q').addEventListener('input', renderOrders); $('#fs').addEventListener('change', renderOrders); $('#sort').addEventListener('change', renderOrders);
  $('#reset').addEventListener('click', () => { $('#q').value = ''; $('#fs').value = ''; $('#sort').value = 'desc'; renderOrders(); });
  $('#expJson').addEventListener('click', () => download('commandes.json', JSON.stringify(orders, null, 2), 'application/json'));
  $('#expCsv').addEventListener('click', exportCsv);
  $('#demo').addEventListener('click', addDemo);
  wireAccount(); boot();
}

/* ---------- Compte de démonstration (local, NON sécurisé) ---------- */
const PK = 'cf.profiles', SK = 'cf.session';
const SECTORS = ['Mode', 'Beauté/Cosmétiques', 'Accessoires', 'Alimentation', 'Électronique', 'Autre'];
const SOURCES = ['WhatsApp', 'Instagram', 'Facebook', 'Téléphone', 'Boutique', 'Autre'];
let profile = null;
const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast('Enregistrement impossible sur cet appareil.', true); return false; } };
const profiles = () => { const p = jget(PK, []); return Array.isArray(p) ? p : []; };
const req = (e) => e.value.trim() !== '';
const mail = (e) => /^\S+@\S+\.\S+$/.test(e.value.trim());
async function hashPw(pw, salt) {
  if (!(window.crypto && crypto.subtle)) return null; // pas de vérification possible : mode démo
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function check(rules) {
  clearErrors(); let ok = true;
  rules.forEach(([id, t, m]) => { if (!t($('#' + id))) { ok = false; const e = document.querySelector(`.err[data-for="${id}"]`); if (e && !e.textContent) e.textContent = m; $('#' + id).classList.add('bad'); } });
  return ok;
}
function showAuth(mode) { $('#loginForm').hidden = mode !== 'login'; $('#regForm').hidden = mode !== 'register'; clearErrors(); }
function startSession(p) { jset(SK, p.id); boot(); }
async function onRegister(e) {
  e.preventDefault();
  if (!check([['r_name', req, 'Indiquez votre nom.'], ['r_shop', req, 'Indiquez le nom de la boutique.'], ['r_email', mail, 'E-mail invalide.'], ['r_phone', req, 'Indiquez un téléphone.'],
    ['r_pw', (x) => x.value.length >= 6, '6 caractères minimum.'], ['r_pw2', (x) => x.value === $('#r_pw').value, 'Les mots de passe diffèrent.'], ['r_ok', (x) => x.checked, 'Veuillez cocher cette case.']])) return;
  const email = $('#r_email').value.trim().toLowerCase();
  if (profiles().some((p) => p.email === email)) { check([['r_email', () => false, 'Cet e-mail est déjà utilisé.']]); return; }
  const salt = Math.random().toString(36).slice(2);
  const p = { id: 'P' + Date.now().toString(36), name: $('#r_name').value.trim(), shop: $('#r_shop').value.trim(), email, phone: $('#r_phone').value.trim(), city: $('#r_city').value.trim(), sector: $('#r_sector').value, bio: '', createdAt: new Date().toISOString(), salt, hash: await hashPw($('#r_pw').value, salt) };
  if (jset(PK, [...profiles(), p])) { startSession(p); toast('Compte créé (démo locale).'); }
}
async function onLogin(e) {
  e.preventDefault();
  if (!check([['l_email', mail, 'E-mail invalide.'], ['l_pw', req, 'Saisissez votre mot de passe.']])) return;
  const p = profiles().find((x) => x.email === $('#l_email').value.trim().toLowerCase());
  const h = p && p.hash ? await hashPw($('#l_pw').value, p.salt) : null;
  if (!p || (p.hash && h !== p.hash)) { check([['l_pw', () => false, 'E-mail ou mot de passe incorrect.']]); return; }
  startSession(p);
}
function enterDemo() {
  let p = profiles().find((x) => x.id === 'demo');
  if (!p) { p = { id: 'demo', name: 'Awa Démo', shop: 'Boutique Démo', email: 'demo@local', phone: '221770000000', city: 'Dakar', sector: 'Mode', bio: 'Profil de démonstration.', createdAt: new Date().toISOString(), hash: null }; jset(PK, [...profiles(), p]); }
  startSession(p);
}
const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
function applyProfile() {
  const p = profile;
  $('#uname').textContent = p.name; $('#hello').textContent = `Bienvenue, ${p.name} — ${p.shop}`;
  $('#avatar').textContent = $('#avatar2').textContent = initials(p.name);
  $('#pshop').textContent = p.shop; $('#since').textContent = 'Compte créé le ' + fmtDate(p.createdAt);
  [['name', 'name'], ['shop', 'shop'], ['email', 'email'], ['phone', 'phone'], ['city', 'city'], ['sector', 'sector'], ['bio', 'bio']].forEach(([f, k]) => { $('#p_' + f).value = p[k] || ''; });
  clearErrors();
}
function boot() {
  const id = jget(SK, null);
  profile = profiles().find((p) => p.id === id) || null;
  $('#auth').hidden = !!profile; $('#app').hidden = !profile;
  if (!profile) { showAuth(profiles().length ? 'login' : 'register'); return; }
  KEY = 'cf.orders.' + profile.id; orders = loadOrders();
  const pr = jget('cf.prefs.' + profile.id, {});
  document.documentElement.dataset.theme = pr.theme === 'light' ? 'light' : 'dark'; $('#theme').value = document.documentElement.dataset.theme;
  applyProfile(); show('dashboard'); renderAll();
}
function onProfileSave(e) {
  e.preventDefault();
  if (!check([['p_name', req, 'Indiquez votre nom.'], ['p_shop', req, 'Indiquez la boutique.'], ['p_email', mail, 'E-mail invalide.'], ['p_phone', req, 'Indiquez un téléphone.']])) return;
  const email = $('#p_email').value.trim().toLowerCase();
  if (profiles().some((p) => p.id !== profile.id && p.email === email)) { check([['p_email', () => false, 'Cet e-mail est déjà utilisé.']]); return; }
  Object.assign(profile, { name: $('#p_name').value.trim(), shop: $('#p_shop').value.trim(), email, phone: $('#p_phone').value.trim(), city: $('#p_city').value.trim(), sector: $('#p_sector').value, bio: $('#p_bio').value.trim() });
  if (jset(PK, profiles().map((p) => (p.id === profile.id ? profile : p)))) { applyProfile(); toast('Profil mis à jour.'); }
}
function wireAccount() {
  [$('#r_sector'), $('#p_sector')].forEach((s) => SECTORS.forEach((x) => s.append(new Option(x, x))));
  SOURCES.forEach((x) => $('#source').append(new Option(x, x)));
  document.querySelectorAll('[data-auth]').forEach((b) => b.addEventListener('click', () => showAuth(b.dataset.auth)));
  $('#regForm').addEventListener('submit', onRegister); $('#loginForm').addEventListener('submit', onLogin);
  $('#demoIn').addEventListener('click', enterDemo); $('#profForm').addEventListener('submit', onProfileSave);
  $('#pcancel').addEventListener('click', () => { applyProfile(); toast('Modifications annulées.'); });
  const menu = $('#menu'), setMenu = (o) => { menu.hidden = !o; $('#avBtn').setAttribute('aria-expanded', String(o)); };
  $('#avBtn').addEventListener('click', (e) => { e.stopPropagation(); setMenu(menu.hidden); });
  document.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  menu.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { show(b.dataset.go); setMenu(false); }));
  $('#logout').addEventListener('click', () => { try { localStorage.removeItem(SK); } catch (e) {} setMenu(false); boot(); });
  $('#theme').addEventListener('change', (e) => { document.documentElement.dataset.theme = e.target.value; jset('cf.prefs.' + profile.id, { theme: e.target.value }); });
  $('#wipe').addEventListener('click', () => { if (confirm('Supprimer toutes les commandes de ce profil ?')) { orders = []; saveOrders(); renderAll(); toast('Commandes réinitialisées.'); } });
  $('#delProf').addEventListener('click', () => {
    if (!confirm('Supprimer ce profil local et toutes ses commandes ?')) return;
    try { localStorage.removeItem(KEY); localStorage.removeItem('cf.prefs.' + profile.id); localStorage.removeItem(SK); } catch (e) {}
    jset(PK, profiles().filter((p) => p.id !== profile.id)); boot();
  });
}

document.addEventListener('DOMContentLoaded', init);