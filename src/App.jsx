import { DecisionBrief } from './components/DecisionBrief.jsx';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  completeReferralPurchase, referralWallet,
  PRESETS_12M,
  REFERENCE_PLANS_24M,
  computeScenario,
  simulate24Months
} from '../shared/tuesteModel.js';
import {
  apiCheckHealth,
  apiListScenarios,
  apiCreateScenario,
  apiUpdateScenario,
  apiDeleteScenario
} from './api.js';
import { SavedScenariosPanel } from './components/SavedScenariosPanel.jsx';
import { CalculadoraSection } from './components/CalculadoraSection.jsx';
import { TableroSection } from './components/TableroSection.jsx';
import { Simulador24MSection } from './components/Simulador24MSection.jsx';

function stripPresetMeta(preset) {
  return {
    inversion: preset.inversion,
    precioBolsa: preset.precioBolsa,
    costoCafe: preset.costoCafe,
    costoEnvio: preset.costoEnvio,
    pctSusc: preset.pctSusc,
    churn: preset.churn,
    pedidosSuelto: preset.pedidosSuelto,
    feeAgencia: preset.feeAgencia,
    descuentoBF: preset.descuentoBF,
    polPack: preset.polPack,
    adopcionPack: preset.adopcionPack
  };
}

function defaultPlan24m() {
  return {
    id: 'propioB',
    name: 'Plan 4: Propio B (Editable — Meta + Política Pack/Envío)',
    shortName: 'Propio B (Editable)',
    investments: [...REFERENCE_PLANS_24M.propioB.investments],
    descBF: 0.0,
    bfMode: 'all_cohorts',
    polPack: true,
    mesActPack: 1,
    packScope: 'all_orders',
    adopPack: 20.0,
    buyTostadora: false,
    mesTostadora: 12
  };
}

const DRAFT_KEY = 'tueste.workbench.v1';
function readDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') || {}; }
  catch { return {}; }
}
const initialDraft = readDraft();

const REFERRAL_KEY = 'tueste.referrals.v2';
function initialReferrals() {
  const empty = { people: [{ id: 'demo-camila', name: 'Camila', contact: 'camila@example.test', tried: false }], orders: [], redemptions: [], events: [] };
  try { const saved = JSON.parse(localStorage.getItem(REFERRAL_KEY)); return saved?.version === 2 && ['people','orders','redemptions','events'].every(k => Array.isArray(saved[k])) ? saved : empty; } catch { return empty; }
}
function ReferralInvite() {
  const motionRoot = useRef(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [state, setState] = useState(initialReferrals);
  const [personId, setPersonId] = useState('demo-camila');
  const [mode, setMode] = useState(() => new URLSearchParams(location.search).has('ref') ? 'friend' : 'invite');
  const [refId, setRefId] = useState(() => new URLSearchParams(location.search).get('ref') || 'demo-camila');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [product, setProduct] = useState('normal');
  const [notice, setNotice] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [persistError, setPersistError] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(REFERRAL_KEY, JSON.stringify({ ...state, version: 2 })); setPersistError(false); }
    catch { setPersistError(true); }
  }, [state]);
  useEffect(() => {
    const sync = e => { if (e.key === REFERRAL_KEY) setState(initialReferrals()); };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);
  const person = state.people.find(p => p.id === personId) || state.people[0];
  const inviter = state.people.find(p => p.id === refId);
  const wallet = referralWallet(state, person.id);
  useEffect(() => {
    const root = motionRoot.current;
    if (!root) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer, frame = 0;
    const reset = () => {
      observer?.disconnect(); cancelAnimationFrame(frame);
      root.classList.remove('motion-ready');
      root.style.setProperty('--pointer-x', '0px'); root.style.setProperty('--pointer-y', '0px');
    };
    const configure = () => {
      reset();
      if (preference.matches || motionPaused || !('IntersectionObserver' in window)) return;
      root.classList.add('motion-ready');
      const targets = root.querySelectorAll('.referral-layout, .referral-rewards article, .referral-checkout, .referral-owner > h2, .referral-log li');
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
      }), { threshold: 0.08 });
      targets.forEach((target, index) => {
        target.classList.add('reveal-item');
        target.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 90}ms`);
        observer.observe(target);
      });
    };
    const move = e => {
      if (preference.matches || motionPaused || e.pointerType === 'touch') return;
      const hero = root.querySelector('.referral-layout');
      if (!hero) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        root.style.setProperty('--pointer-x', `${Math.max(-8, Math.min(8, (e.clientX - rect.left - rect.width / 2) * .018))}px`);
        root.style.setProperty('--pointer-y', `${Math.max(-5, Math.min(5, (e.clientY - rect.top - rect.height / 2) * .018))}px`);
      });
    };
    const leave = () => { cancelAnimationFrame(frame); root.style.setProperty('--pointer-x','0px'); root.style.setProperty('--pointer-y','0px'); };
    configure(); preference.addEventListener('change', configure);
    root.addEventListener('pointermove', move, {passive:true}); root.addEventListener('pointerleave', leave);
    return () => { reset(); preference.removeEventListener('change', configure); root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave); };
  }, [mode, state.orders.length, motionPaused]);
  const uid = () => crypto.randomUUID();
  const event = (type, actor = person.id) => setState(s => ({ ...s, events: [...s.events, { id: uid(), type, actor, date: new Date().toISOString() }] }));
  const urlFor = id => { const url = new URL(location.pathname, location.origin); url.searchParams.set('tab','referidos'); url.searchParams.set('ref',id); return url.href; };
  const link = urlFor(person.id);
  const message = `${person.name} te invita a probar Tueste: una muestra de 100 g incluida con tu primera compra. ${link} — demostración simulada`;
  const openFriend = id => {
    setRefId(id); setReceipt(null); setName(''); setContact(''); setNotice(''); setMode('friend');
    event('friend_open', id);
    const url = new URL(location.href); url.searchParams.set('tab','referidos'); url.searchParams.set('ref',id); history.replaceState(null,'',url);
  };
  const purchase = e => {
    e.preventDefault();
    try {
      // Leer el último estado evita duplicar recompensas entre pestañas locales.
      const latest = initialReferrals();
      const next = completeReferralPurchase(latest, { id: uid(), inviterId: refId, name, contact, product, date: new Date().toISOString() });
      setState(next); setReceipt(next.orders.at(-1)); setNotice('Compra simulada completada. La recompensa ya aparece en la cuenta de quien te invitó.');
    } catch (error) { setNotice(error.message); }
  };
  const redeem = () => {
    if (!wallet.credit && !wallet.bags && !wallet.samples) return;
    if (!window.confirm('¿Simular el canje dentro de un nuevo pedido de dos bolsas? No se hará ningún cobro.')) return;
    const latest = initialReferrals(); const balance = referralWallet(latest, person.id);
    if (!balance.credit && !balance.bags && !balance.samples) { setState(latest); return; }
    const credit = Math.min(34, balance.credit);
    setState({ ...latest, redemptions: [...latest.redemptions, { id: uid(), personId: person.id, credit, bags: balance.bags, samples: balance.samples, date: new Date().toISOString() }] });
    setNotice(`Canje simulado: $${credit.toFixed(2)} de crédito, ${balance.bags} bolsa(s) y ${balance.samples} muestra(s). Pedido $34, envío incluido; importe después del crédito: $${(34-credit).toFixed(2)}. Los regalos viajan dentro del pedido.`);
  };
  const uniqueEvents = type => new Set(state.events.filter(e => e.type === type).map(e => e.actor)).size;
  return <section ref={motionRoot} className={`referral-page ${motionPaused ? 'motion-paused' : ''}`} aria-labelledby="referral-title">
    <div className="referral-heading"><span className="notebook-kicker">PARTE 2 / REGALA UNA PRIMERA TAZA</span><span className="referral-demo">PROTOTIPO · DATOS SIMULADOS</span></div>
    <nav className="referral-tabs" aria-label="Recorrido de referidos"><button aria-pressed={mode === 'invite'} className="btn" onClick={() => {setMode('invite'); setNotice('');}}>Quien invita</button><button aria-pressed={mode === 'friend'} className="btn" onClick={() => openFriend(person.id)} disabled={!person.tried}>Ver como amigo</button><button aria-pressed={mode === 'owner'} className="btn" onClick={() => setMode('owner')}>Panel de Diego</button><button className="btn referral-motion-toggle" aria-pressed={motionPaused} onClick={() => setMotionPaused(p => !p)}>{motionPaused ? 'Activar movimiento' : 'Pausar movimiento'}</button></nav>
    {persistError && <p role="alert">El navegador bloqueó el guardado local. Mantené esta pestaña abierta: el avance podría perderse al recargar.</p>}
    <div key={notice} role="status" aria-live="polite" className="referral-notice">{notice}</div>
    {mode === 'invite' && <>
      <label className="referral-person-label" htmlFor="ref-person">Estás viendo la cuenta de</label><select id="ref-person" value={person.id} onChange={e => {setPersonId(e.target.value);setNotice('');}}>{state.people.map(p => <option key={p.id} value={p.id}>{p.name} · simulado</option>)}</select>
      <div className="referral-layout"><div className="referral-story"><span className="referral-eyebrow">01 / DE TU TAZA A LA SUYA</span><h1 id="referral-title"><span>El buen café</span><br/><em>se comparte.</em></h1><p>Tu amigo recibe una muestra de 100 g con su primera compra. Vos ganás $5 para tu próximo pedido cuando compra.</p><p className="referral-story-note">Probalo. Disfrutalo. Compartilo.</p><svg className="referral-art" viewBox="0 0 460 150" role="img" aria-label="Dos bolsas de café Tueste, un regalo compartido"><ellipse cx="230" cy="80" rx="210" ry="60" fill="none" stroke="#B8D7CC" strokeOpacity=".22"/><circle cx="413" cy="53" r="5" fill="#D47A4A"/><path d="M22 132H438" stroke="#CFC3AF"/><g transform="translate(77 15) rotate(-7 55 55)"><path d="M10 8H112L120 114H0Z" fill="#DDD0BA" stroke="#9E8B70"/><path d="M10 8H112L107 23H16Z" fill="#BCA98B"/><rect x="18" y="41" width="85" height="46" fill="#F9F5EC"/><text x="60" y="62" textAnchor="middle" fill="#302820" fontSize="15" fontFamily="Georgia">TUESTE</text><text x="60" y="77" textAnchor="middle" fill="#566148" fontSize="7" letterSpacing="2">DE ORIGEN</text></g><path d="M231 48V96M207 72H255" stroke="#A78D6B" strokeWidth="1.5"/><g transform="translate(300 43) rotate(8 34 40)"><path d="M5 0H65L71 81H0Z" fill="#566148"/><path d="M5 0H65L61 13H9Z" fill="#3D4832"/><text x="35" y="39" textAnchor="middle" fill="#F5EBDD" fontSize="11" fontFamily="Georgia">TUESTE</text><text x="35" y="55" textAnchor="middle" fill="#F5EBDD" fontSize="8">100 g</text></g></svg><small className="referral-art-note">Ilustración de la propuesta · muestra incluida en un pedido</small></div><div className="referral-invite">
        {!person.tried ? <><h2>¿Ya recibiste y probaste tu café?</h2><p>Confirmá este momento en la demostración para habilitar tu invitación.</p><button className="btn btn-olive" onClick={() => setState(s => ({...s, people:s.people.map(p => p.id === person.id ? {...p,tried:true}:p),events:[...s.events,{id:uid(),type:'eligible',actor:person.id}]}))}>Confirmar entrega y prueba · simulado</button></> : <><h2>Una primera taza, de tu parte.</h2><div className="referral-message">{message}</div><a className="btn btn-olive referral-share" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" onClick={() => event('prepared')}>Preparar WhatsApp ↗</a><button className="btn" onClick={async () => {try{await navigator.clipboard.writeText(link);event('copied');setNotice('Enlace copiado.');}catch{setNotice('Seleccioná y copiá el enlace manualmente.');}}}>Copiar enlace</button><button className="btn" onClick={() => {event('shared');setNotice('Envío de invitación registrado como simulado.');}}>Simular invitación enviada</button><button className="btn" onClick={() => openFriend(person.id)}>Probar la página del amigo</button><label htmlFor="ref-link">Enlace personal · simulado</label><input id="ref-link" readOnly value={link} onFocus={e=>e.target.select()}/><p className="control-note">Preparar WhatsApp no confirma un envío. Enlaces locales solo funcionan en este equipo; identidades y compras se guardan en este navegador.</p></>}
      </div></div>
      <div className="referral-rewards"><article><h3>${wallet.credit.toFixed(2)} de crédito</h3><p>Pendiente para próximos pedidos. El crédito no es dinero retirado.</p></article><article><h3>{wallet.count} amigos compradores</h3><progress aria-label="Progreso al próximo premio" value={wallet.count%3} max="3"/><p>{wallet.count%3}/3 para el próximo premio. {Math.floor(wallet.count/3)} ciclo(s) completado(s).</p></article><article><h3>Regalos pendientes</h3><p>{wallet.bags} bolsa(s) de 340 g y {wallet.samples} muestra(s) por suscripción. Se incluyen en un próximo pedido.</p><button className="btn" disabled={!wallet.credit&&!wallet.bags&&!wallet.samples} onClick={redeem}>Simular canje en próximo pedido</button></article></div>
      <h2 className="referral-section-title">Lo que pasó con tus invitaciones <small>Notificaciones simuladas</small></h2>{state.orders.filter(o=>o.inviterId===person.id).length===0 ? <p>Todavía no hay compras de amigos. Compartir por sí solo no genera saldo.</p> : <ul className="referral-log">{state.orders.filter(o=>o.inviterId===person.id).map(o=><li key={o.id}>{o.name} compró {o.subscription?'una suscripción':'dos bolsas'} · ganaste $5{o.milestone?' y una bolsa de 340 g por completar tres amigos':''}{o.subscription?' y una muestra de 100 g por su suscripción':''}. Costo de recompensas de este referido: ${o.cost.toFixed(2)}. Simulado.</li>)}</ul>}
    </>}
    {mode === 'friend' && <div className="referral-checkout"><span className="decision-label">INVITACIÓN PERSONAL · SIMULADA</span><h1 id="referral-title">{inviter ? `${inviter.name} te regala una primera taza.`:'Esta invitación no está disponible.'}</h1>{!inviter || !inviter.tried ? <p>El enlace no existe en esta demostración o el cliente aún no ha probado el café. Volvé a «Quien invita» para crear una invitación válida.</p> : receipt ? <><h2>Tu compra simulada está lista</h2><p>Dos bolsas de 340 g + una muestra de 100 g. Total: ${receipt.amount.toFixed(2)}, envío incluido. No hubo cobro real.</p><p>El regalo se aplicó automáticamente y {inviter.name} recibió su recompensa.</p><button className="btn btn-olive" onClick={()=>{setPersonId(receipt.buyerId);setMode('invite');setNotice('Tu café aún no se ha probado. Confirmá entrega y prueba antes de invitar.');}}>Continuar el ciclo como {receipt.name}</button><button className="btn" onClick={()=>{setPersonId(inviter.id);setMode('invite');setNotice('Revisá el saldo y la notificación de la compra simulada.');}}>Ver recompensa de {inviter.name}</button></> : <form onSubmit={purchase}><p>Con tu primera compra recibís una muestra de 100 g, aplicada sin código y dentro del mismo paquete.</p><label htmlFor="friend-name">Nombre de ejemplo · simulado</label><input id="friend-name" required minLength="2" maxLength="80" value={name} onChange={e=>setName(e.target.value)}/><label htmlFor="friend-email">Correo de ejemplo para evitar duplicados</label><input id="friend-email" type="email" required placeholder="amigo@example.test" value={contact} onChange={e=>setContact(e.target.value)}/><small>Usá datos ficticios. El correo identifica al comprador únicamente en esta demo.</small><fieldset><legend>Elegí tu pedido</legend><label><input type="radio" name="product" value="normal" checked={product==='normal'} onChange={()=>setProduct('normal')}/> Dos bolsas · $34 · compra única</label><label><input type="radio" name="product" value="subscription" checked={product==='subscription'} onChange={()=>setProduct('subscription')}/> Dos bolsas al mes · $30,60 · suscripción cancelable</label></fieldset><p><strong>Regalo: muestra de 100 g · $0. Envío incluido.</strong></p><p>Total simulado: ${product==='normal'?'34,00':'30,60'}{product==='subscription'?' por mes; primer pago simulado al confirmar':''}.</p><button className="btn btn-olive" type="submit">Confirmar compra simulada</button><p>No se solicitan datos de tarjeta ni se procesa un pago real.</p></form>}</div>}
    {mode === 'owner' && <div className="referral-owner"><h1 id="referral-title">El ciclo, en números.</h1><h2>Histórico del caso · por 1.000 primeras compras</h2><div className="table-responsive"><table><thead><tr><th>Paso</th><th>Cantidad</th><th>Conversión y base</th></tr></thead><tbody>{[['Reciben correo',1000,'Base'],['Abren correo',350,'350/1.000 = 35%'],['Entran al programa',120,'120/350 = 34,29%'],['Personas que invitan',100,'100/120 = 83,33%'],['Invitaciones',300,'3 por persona; cambia la unidad'],['Amigos abren tienda',150,'150/300 = 50%'],['Amigos compran',60,'60/150 = 40%']].map(r=><tr key={r[0]}>{r.map((v,i)=><td key={i}>{v}</td>)}</tr>)}</tbody></table></div><p>Mayor pérdida proporcional: correo abierto → programa, 65,71%. Mayor pérdida absoluta: 650 no abren. El 70% de quienes invitaron desconoce su saldo según encuesta; no es una etapa adicional del embudo.</p>
      <h2>Actividad de esta demostración · simulada</h2><ul><li>Clientes que confirmaron entrega y prueba: {state.people.filter(p=>p.tried).length}.</li><li>Personas que prepararon WhatsApp: {uniqueEvents('prepared')}.</li><li>Personas que simularon enviar: {uniqueEvents('shared')}.</li><li>Aperturas simuladas del amigo: {state.events.filter(e=>e.type==='friend_open').length}; no equivalen a visitantes únicos.</li><li>Compradores referidos únicos: {state.orders.length}.</li><li>Recompensas comprometidas, incluido saldo sin canjear: ${state.orders.reduce((n,o)=>n+o.cost,0).toFixed(2)}.</li><li>Costo medio de recompensas: {state.orders.length ? '$'+(state.orders.reduce((n,o)=>n+o.cost,0)/state.orders.length).toFixed(2) : 'Sin compras; no aplica'} por referido. No es CAC total.</li></ul>
      <h2>Objetivo y experimento · propuesta</h2><p>Pasar de 6 a 10 compradores referidos por cada 100 compradores iniciales. Objetivo simulado: 1.000 reciben → 450 abren → 200 entran → 160 invitan → 480 invitaciones → 240 aperturas → 100 compras. No es un resultado observado.</p><p>A/B 50/50: piloto actual frente a invitación después de probar, enlace personal, regalo aplicado y aviso. Comparar cohortes durante una ventana propuesta de 30 días. Revisar semanalmente compradores referidos por 100 clientes elegibles, con igual madurez de cohorte.</p><p>Contramétricas: recompensas ≤ $25 por referido, contribución inicial después del regalo no negativa y devoluciones/cancelaciones sin empeorar frente al control. Si falla, revisar el paso afectado y repetir antes de ampliar.</p><h3>Ciclo</h3><p>Compra → recibe y prueba → invita → amigo compra con regalo → aviso y premio → amigo recibe y prueba → nueva invitación. No se promete crecimiento autosostenido.</p><h3>Canales a 90 días · propuesta</h3><div className="table-responsive"><table><thead><tr><th>Modo / control</th><th>Propio</th><th>Externo</th></tr></thead><tbody><tr><th>Pagado</th><td>Beneficios de referidos dentro del límite</td><td>Meta a $4.000 de base; no escalar antes de validar</td></tr><tr><th>Relacional</th><td>Página, experiencia postentrega y avisos</td><td>WhatsApp y fotos voluntarias con consentimiento</td></tr></tbody></table></div><p>Días 1–30: piloto e instrumentación. Días 31–60: observar y corregir. Días 61–90: ampliar si mejora la métrica y respeta costos.</p>
    </div>}
    <details className="notebook-details"><summary>Recompensas, condiciones y comprobación</summary><div className="table-responsive"><table><thead><tr><th>Premio</th><th>Costo</th></tr></thead><tbody><tr><td>Muestra del amigo dentro de su pedido</td><td>$1,60</td></tr><tr><td>Crédito del invitador</td><td>$5,00</td></tr><tr><td>Bolsa al completar 3 compradores distintos</td><td>$5,44 por ciclo</td></tr><tr><td>Muestra extra por amigo suscriptor</td><td>$1,60</td></tr></tbody></table></div><p>Máximo conservador para el referido que activa todos los premios: $13,64 ≤ $25. Meta cuesta ($4.000+$1.000)/100 = $50. El piloto $8+$8 también cumple: su problema es la experiencia.</p><p>Crédito nominal completo contado como costo aunque no se canjee; regalos en un pedido posterior, sin envío independiente. Demostración local sin validación real de identidad: detectar el mismo correo no sustituye protección antifraude de producción.</p><p>Contribución del primer pedido del amigo después de muestra: $14,29 en compra única y $11,043 en suscripción; ambos positivos, antes de recompensas del invitador y costos fijos.</p></details>
    <button className="btn btn-text" onClick={()=>{if(window.confirm('¿Borrar únicamente las compras y recompensas simuladas de referidos?')){localStorage.removeItem(REFERRAL_KEY);setState(initialReferrals());setPersonId('demo-camila');setRefId('demo-camila');setMode('invite');setReceipt(null);setNotice('Demo reiniciada. Parte 1 intacta.');const u=new URL(location.href);u.searchParams.delete('ref');history.replaceState(null,'',u);}}}>Reiniciar demo de referidos</button>
  </section>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t === 'calculadora' || t === 'tablero' || t === 'simulador24m' || t === 'todas' || t === 'referidos') {
        return t;
      }
    }
    return ['calculadora','tablero','simulador24m','todas','referidos'].includes(initialDraft.activeTab) ? initialDraft.activeTab : 'tablero';
  }); // 'calculadora' | 'tablero' | 'simulador24m' | 'todas'

  const [showScenariosPanel, setShowScenariosPanel] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('panel=open')) {
      return true;
    }
    return false;
  });

  const [activePresetKey, setActivePresetKey] = useState(initialDraft.activePresetKey === undefined ? 'actual' : initialDraft.activePresetKey);
  const [lastPresetKey, setLastPresetKey] = useState(initialDraft.lastPresetKey || 'actual');
  const [params12m, setParams12m] = useState(() => ({ ...stripPresetMeta(PRESETS_12M.actual), ...initialDraft.params12m }));
  const [plan24m, setPlan24m] = useState(() => ({ ...defaultPlan24m(), ...initialDraft.plan24m }));

  // Estado de guardado y conexión
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [activeSavedId, setActiveSavedId] = useState(null);
  const [saveFormName, setSaveFormName] = useState(initialDraft.saveFormName || '');
  const [saveFormNote, setSaveFormNote] = useState(initialDraft.saveFormNote || '');
  const [operationState, setOperationState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'saving' | 'success' | 'error'
    message: '',
    details: []
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ activeTab, activePresetKey, lastPresetKey, params12m, plan24m, saveFormName, saveFormNote }));
    } catch { /* La aplicación sigue calculando si el navegador bloquea el almacenamiento. */ }
  }, [activeTab, activePresetKey, lastPresetKey, params12m, plan24m, saveFormName, saveFormNote]);

  // Cálculo instantáneo en vivo
  const liveRes12m = computeScenario(params12m);
  const liveSim24m = simulate24Months({
    ...plan24m,
    id: 'propioB',
    name: 'Plan 4: Propio B (Editable — Meta + Política Pack/Envío)',
    shortName: 'Propio B (Editable)'
  });

  const activeSavedObj = savedScenarios.find(sc => sc.id === activeSavedId) || null;

  const refreshSavedScenarios = useCallback(async (showSuccessBanner = false) => {
    setBackendStatus('checking');
    try {
      await apiCheckHealth();
      const res = await apiListScenarios();
      if (res.ok && res.data.ok) {
        setSavedScenarios(res.data.scenarios || []);
        setBackendStatus('online');
        if (showSuccessBanner) {
          setOperationState({
            status: 'success',
            message: 'Guardado disponible nuevamente.',
            details: []
          });
        }
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      setBackendStatus('offline');
      if (showSuccessBanner) {
        setOperationState({
          status: 'error',
          message: err.message || 'Guardado no disponible en este momento.',
          details: []
        });
      }
    }
  }, []);

  useEffect(() => {
    refreshSavedScenarios(false);
  }, [refreshSavedScenarios]);

  const handleSelectPreset12m = presetKey => {
    const p = PRESETS_12M[presetKey];
    if (!p) return;
    setActivePresetKey(presetKey);
    setLastPresetKey(presetKey);
    setActiveSavedId(null);
    setParams12m(stripPresetMeta(p));

    setPlan24m(prev => ({
      ...prev,
      investments: Array(24).fill(p.inversion),
      descBF: p.descuentoBF,
      polPack: p.polPack,
      adopPack: p.adopcionPack
    }));
  };

  const handleRestoreDefaults = () => {
    setActivePresetKey('actual');
    setLastPresetKey('actual');
    setActiveSavedId(null);
    setParams12m(stripPresetMeta(PRESETS_12M.actual));
    setPlan24m(defaultPlan24m());
    setOperationState({
      status: 'info',
      message: 'Se han restaurado los datos originales del caso Tueste.',
      details: []
    });
  };

  const handleChangeParam12m = (key, value) => {
    setActivePresetKey(null);
    setParams12m(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveNewScenario = async () => {
    const trimmedName = saveFormName.trim();
    if (!trimmedName) {
      setOperationState({
        status: 'error',
        message: 'Ingresa un nombre para guardar el escenario.',
        details: []
      });
      return;
    }

    setOperationState({
      status: 'saving',
      message: `Guardando "${trimmedName}"...`,
      details: []
    });

    try {
      const res = await apiCreateScenario({
        name: trimmedName,
        note: saveFormNote.trim(),
        params12m,
        plan24m
      });

      if (!res.ok || !res.data.ok) {
        setOperationState({
          status: 'error',
          message: res.data?.error || 'No se pudo guardar el escenario.',
          details: res.data?.details || []
        });
        return;
      }

      const created = res.data.scenario;
      setBackendStatus('online');
      setActiveSavedId(created.id);
      const listRes = await apiListScenarios();
      if (listRes.ok && listRes.data.ok) {
        setSavedScenarios(listRes.data.scenarios || []);
      }

      const viableMsg = created.planViable24m
        ? 'Plan de 24 meses viable.'
        : `Guardado como plan de 24 meses inviable (${created.motivosInvalidez24m?.join('; ')}).`;

      setOperationState({
        status: 'success',
        message: `Escenario "${created.name}" guardado correctamente. ${viableMsg}`,
        details: []
      });
    } catch (err) {
      setBackendStatus('offline');
      setOperationState({
        status: 'error',
        message:
          err.message ||
          'No se pueden guardar cambios en este momento. Tus datos siguen intactos en pantalla.',
        details: []
      });
    }
  };

  const handleUpdateActiveScenario = async () => {
    if (!activeSavedId) return;
    const trimmedName = saveFormName.trim();
    if (!trimmedName) {
      setOperationState({
        status: 'error',
        message: 'El nombre del escenario no puede estar vacío.',
        details: []
      });
      return;
    }

    setOperationState({
      status: 'saving',
      message: `Guardando cambios en "${trimmedName}"...`,
      details: []
    });

    try {
      const res = await apiUpdateScenario(activeSavedId, {
        name: trimmedName,
        note: saveFormNote.trim(),
        params12m,
        plan24m
      });

      if (!res.ok || !res.data.ok) {
        setOperationState({
          status: 'error',
          message: res.data?.error || 'No se pudo actualizar el escenario.',
          details: res.data?.details || []
        });
        return;
      }

      const updated = res.data.scenario;
      setBackendStatus('online');
      const listRes = await apiListScenarios();
      if (listRes.ok && listRes.data.ok) {
        setSavedScenarios(listRes.data.scenarios || []);
      }

      setOperationState({
        status: 'success',
        message: `Cambios guardados en "${updated.name}".`,
        details: []
      });
    } catch (err) {
      setBackendStatus('offline');
      setOperationState({
        status: 'error',
        message:
          err.message ||
          'No se pueden guardar cambios en este momento. Tus datos siguen intactos en pantalla.',
        details: []
      });
    }
  };

  const handleLoadSavedScenario = sc => {
    if (!sc) return;
    setActivePresetKey(null);
    setActiveSavedId(sc.id);
    setSaveFormName(sc.name);
    setSaveFormNote(sc.note || '');
    if (sc.params12m) {
      setParams12m(stripPresetMeta(sc.params12m));
    }
    if (sc.plan24m) {
      setPlan24m({
        ...defaultPlan24m(),
        ...sc.plan24m,
        investments: [...sc.plan24m.investments]
      });
    }
    setOperationState({
      status: 'success',
      message: `Escenario "${sc.name}" cargado en el cuaderno.`,
      details: []
    });
  };

  const handleDuplicateSavedScenario = async sc => {
    if (!sc) return;
    setOperationState({
      status: 'saving',
      message: `Duplicando "${sc.name}"...`,
      details: []
    });

    try {
      const res = await apiCreateScenario({
        name: `${sc.name} (Copia)`,
        note: sc.note || '',
        params12m: sc.params12m,
        plan24m: sc.plan24m
      });

      if (!res.ok || !res.data.ok) {
        setOperationState({
          status: 'error',
          message: res.data?.error || 'No se pudo duplicar el escenario.',
          details: res.data?.details || []
        });
        return;
      }

      setBackendStatus('online');
      const listRes = await apiListScenarios();
      if (listRes.ok && listRes.data.ok) {
        setSavedScenarios(listRes.data.scenarios || []);
      }
      setOperationState({
        status: 'success',
        message: `Escenario duplicado como "${res.data.scenario.name}".`,
        details: []
      });
    } catch (err) {
      setBackendStatus('offline');
      setOperationState({
        status: 'error',
        message: err.message || 'No se pueden guardar cambios en este momento.',
        details: []
      });
    }
  };

  const handleDeleteSavedScenario = async id => {
    setOperationState({
      status: 'saving',
      message: 'Eliminando escenario...',
      details: []
    });

    try {
      const res = await apiDeleteScenario(id);
      if (!res.ok || !res.data.ok) {
        setOperationState({
          status: 'error',
          message: res.data?.error || 'No se pudo eliminar el escenario.',
          details: res.data?.details || []
        });
        return;
      }

      if (activeSavedId === id) {
        setActiveSavedId(null);
      }
      setBackendStatus('online');
      const listRes = await apiListScenarios();
      if (listRes.ok && listRes.data.ok) {
        setSavedScenarios(listRes.data.scenarios || []);
      }
      setOperationState({
        status: 'success',
        message: 'Escenario eliminado correctamente.',
        details: []
      });
    } catch (err) {
      setBackendStatus('offline');
      setOperationState({
        status: 'error',
        message: err.message || 'No se pueden guardar cambios en este momento.',
        details: []
      });
    }
  };

  return (
    <div>
      {/* 1. ENCABEZADO COMPACTO EDITORIAL */}
      <header className="roaster-header">
        <div className="roaster-header-inner">
          <div className="roaster-brand">
            <span className="roaster-wordmark">TUESTE</span>
            <span className="roaster-descriptor">Origen y balance</span>
          </div>

          <nav className="roaster-nav" aria-label="Secciones principales">
            <button
              id="navTabCalculadora"
              type="button"
              className={`roaster-nav-btn ${activeTab === 'calculadora' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculadora')}
            >
              Calculadora
            </button>
            <button
              id="navTabTablero"
              type="button"
              className={`roaster-nav-btn ${activeTab === 'tablero' ? 'active' : ''}`}
              onClick={() => setActiveTab('tablero')}
            >
              Tablero
            </button>
            <button
              id="navTabSimulador24m"
              type="button"
              className={`roaster-nav-btn ${activeTab === 'simulador24m' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulador24m')}
            >
              Caja a 24 meses
            </button>
            <button type="button" className={`roaster-nav-btn ${activeTab === 'referidos' ? 'active' : ''}`} onClick={() => setActiveTab('referidos')}>Referidos</button>
          </nav>

          <div className="roaster-actions">
            <span className={`save-status-discrete ${backendStatus}`} id="headerSaveStatus">
              <span className="save-status-dot" />
              {backendStatus === 'online' && 'Guardado disponible'}
              {backendStatus === 'offline' && 'Guardado no disponible'}
              {backendStatus === 'checking' && 'Comprobando...'}
            </span>
            <button
              id="btnToggleMisEscenarios"
              type="button"
              className="btn"
              aria-expanded={showScenariosPanel}
              onClick={() => setShowScenariosPanel(prev => !prev)}
            >
              Mis escenarios ({savedScenarios.length})
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Aviso visible si se pierde la conexión para guardar */}
        {backendStatus === 'offline' && !showScenariosPanel && (
          <div className="status-banner error" role="alert" id="offlineWarningBanner">
            <div>
              <strong>Aviso:</strong> El guardado no está disponible en este momento. La calculadora, el tablero y el simulador siguen funcionando con normalidad, pero <strong>no se pueden guardar cambios</strong> hasta reconectar.
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => refreshSavedScenarios(true)}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Panel lateral desplegable de Mis escenarios */}
        {showScenariosPanel && (
          <SavedScenariosPanel
            backendStatus={backendStatus}
            savedScenarios={savedScenarios}
            activeSavedId={activeSavedId}
            saveFormName={saveFormName}
            saveFormNote={saveFormNote}
            onChangeName={setSaveFormName}
            onChangeNote={setSaveFormNote}
            onSaveNew={handleSaveNewScenario}
            onUpdateActive={handleUpdateActiveScenario}
            onLoadSaved={handleLoadSavedScenario}
            onDuplicateSaved={handleDuplicateSavedScenario}
            onDeleteSaved={handleDeleteSavedScenario}
            onLoadReferencePreset={handleSelectPreset12m}
            onRetryConnection={() => refreshSavedScenarios(true)}
            operationState={operationState}
            onClosePanel={() => setShowScenariosPanel(false)}
          />
        )}

        {(activeTab === 'tablero' || activeTab === 'todas') && <DecisionBrief onExplore={() => document.getElementById('seccion-tablero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />}

        {activeTab === 'referidos' && <ReferralInvite />}
        {/* Sección 1: Calculadora */}
        {(activeTab === 'calculadora' || activeTab === 'todas') && (
          <CalculadoraSection
            params12m={params12m}
            liveRes={liveRes12m}
            activePresetKey={activePresetKey}
            lastPresetKey={lastPresetKey}
            activeSavedName={activeSavedObj ? activeSavedObj.name : null}
            onSelectPreset={handleSelectPreset12m}
            onRestore={handleRestoreDefaults}
            onChangeParam={handleChangeParam12m}
          />
        )}

        {/* Sección 2: Tablero */}
        {(activeTab === 'tablero' || activeTab === 'todas') && (
          <TableroSection
            params12m={params12m}
            liveRes={liveRes12m}
            activePresetKey={activePresetKey}
            lastPresetKey={lastPresetKey}
            activeSavedName={activeSavedObj ? activeSavedObj.name : null}
            onSelectPreset={handleSelectPreset12m}
            onRestore={handleRestoreDefaults}
            onChangeParam={handleChangeParam12m}
          />
        )}

        {/* Sección 3: Caja a 24 meses */}
        {(activeTab === 'simulador24m' || activeTab === 'todas') && (
          <Simulador24MSection
            plan24m={plan24m}
            liveSim24m={liveSim24m}
            savedScenarios={savedScenarios}
            onChangePlan24m={setPlan24m}
            onResetPlan24m={() => setPlan24m(defaultPlan24m())}
          />
        )}

        {/* Sección secundaria al pie: Fuentes, supuestos y verificación */}
        <details className="notebook-details" id="seccion-informacion-tecnica">
          <summary>Fuentes del caso, supuestos y verificación técnica</summary>
          <div className="info-columns">
            <div className="info-box">
              <h4>Fuentes del caso Tueste y reglas de negocio</h4>
              <ul>
                <li>
                  <strong>Datos históricos verificados:</strong> bolsa de 340 g a $17 (pedido típico de 2 bolsas = $34), café tostado $5,44/bolsa, empaque $1,20 (2 bolsas) / $1,40 (3 bolsas), envío $4,50, pasarela 4,5%, suscripción mensual $30,60 (-10%) con permanencia del 91%/mes, y curva de clientes nuevos en Meta: (0,0), ($4k, 100), ($8k, 165), ($12k, 210), ($16k, 235), ($20k, 250).
                </li>
                <li>
                  <strong>Supuestos sujetos a validación comercial:</strong> el Pack degustación de 3 bolsas ($48) y el cobro de $4,50 de envío en pedidos sueltos bajo $45 son propuestas comerciales cuyos beneficios no están garantizados sin una prueba piloto.
                </li>
              </ul>
            </div>
            <div className="info-box">
              <h4>Información técnica del sistema</h4>
              <ul>
                <li>
                  <strong>Cálculo unificado:</strong> las tres vistas y el guardado local comparten el mismo motor matemático sin redondeos intermedios.
                </li>
                <li>
                  <strong>Persistencia local:</strong> los escenarios creados en "Mis escenarios" se almacenan localmente en base de datos SQLite para consulta y comparación sin requerir servicios externos.
                </li>
              </ul>
            </div>
          </div>
        </details>
      </main>

      <footer className="footer-note">
        TUESTE · Cuaderno de decisiones para crecer · Análisis de publicidad, contribución por cliente y caja de la empresa.
      </footer>
    </div>
  );
}
