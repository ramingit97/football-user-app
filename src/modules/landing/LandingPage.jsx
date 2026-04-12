import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetGamesQuery } from '../../store/gamesApi';
import { useGetTournamentsQuery } from '../../store/tournamentsApi';

/* ─────────────────────────────────────────────────────────
   GLOBAL STYLES  (injected once)
───────────────────────────────────────────────────────── */
const STYLES = `
@keyframes orb-pulse {
  0%,100% { transform:scale(1); opacity:.55; }
  50%      { transform:scale(1.12); opacity:.75; }
}
@keyframes orb-drift {
  0%,100% { transform:translateY(0) translateX(0); }
  33%     { transform:translateY(-28px) translateX(14px); }
  66%     { transform:translateY(18px) translateX(-10px); }
}
@keyframes fade-up {
  from { opacity:0; transform:translateY(32px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes shimmer {
  0%   { background-position:-200% center; }
  100% { background-position:200% center; }
}
@keyframes blink-dot {
  0%,100% { opacity:1; } 50% { opacity:.3; }
}
@keyframes swap-flash {
  0%   { box-shadow:0 0 0 0 rgba(0,232,122,0); }
  30%  { box-shadow:0 0 0 8px rgba(0,232,122,0.35); }
  100% { box-shadow:0 0 0 0 rgba(0,232,122,0); }
}
@keyframes player-exit {
  0%   { opacity:1; transform:scale(1) translateX(0); }
  50%  { opacity:0; transform:scale(0.7) translateX(var(--exit-dir, 60px)); }
  100% { opacity:0; transform:scale(0.7) translateX(var(--exit-dir, 60px)); }
}
@keyframes player-enter {
  0%   { opacity:0; transform:scale(0.7) translateX(var(--enter-dir, -60px)); }
  50%  { opacity:0; transform:scale(0.7) translateX(var(--enter-dir, -60px)); }
  100% { opacity:1; transform:scale(1) translateX(0); }
}
@keyframes badge-pop {
  0%  { transform:scale(0.5); opacity:0; }
  70% { transform:scale(1.15); }
  100%{ transform:scale(1); opacity:1; }
}
@keyframes float-up {
  0%  { opacity:0; transform:translateY(6px); }
  20% { opacity:1; }
  80% { opacity:1; }
  100%{ opacity:0; transform:translateY(-18px); }
}
@keyframes bar-grow {
  from { width:0; }
  to   { width:var(--bar-w,60%); }
}
@keyframes carousel-progress {
  from { width:0%; }
  to   { width:100%; }
}
.lp-btn-primary {
  transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
}
.lp-btn-primary:hover {
  transform:translateY(-2px);
  box-shadow:0 8px 32px rgba(0,232,122,.45)!important;
  background:#33f090!important;
}
.lp-btn-secondary {
  transition:transform .18s ease, border-color .18s ease, color .18s ease;
}
.lp-btn-secondary:hover {
  transform:translateY(-2px);
  border-color:var(--green)!important;
  color:var(--green)!important;
}
@keyframes dotBlink {
  0%,100% { opacity:1; } 50% { opacity:.25; }
}
.lp-nav { transition:background .3s,border-color .3s,backdrop-filter .3s; }
.lp-stat-card {
  transition:transform .22s ease, border-color .22s ease, box-shadow .22s ease;
  cursor:default;
}
.lp-stat-card:hover {
  transform:translateY(-4px);
  border-color:rgba(0,232,122,.28)!important;
  box-shadow:0 12px 40px rgba(0,232,122,.12)!important;
}
.lp-step-card {
  transition:transform .22s ease, border-color .22s ease;
  cursor:default;
}
.lp-step-card:hover {
  transform:translateY(-4px);
  border-color:rgba(0,232,122,.22)!important;
}
.lp-faq-item { transition:border-color .2s ease; }
.lp-faq-item:hover { border-color:rgba(0,232,122,.2)!important; }
.lp-carousel-dot { transition:width .3s ease, background .3s ease, opacity .3s ease; }
.swap-animating { animation:swap-flash .7s ease forwards; }
`;

/* ─────────────────────────────────────────────────────────
   HOOKS & HELPERS
───────────────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

const FadeSection = ({ children, delay = 0, style = {} }) => {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity .72s ease ${delay}s, transform .72s cubic-bezier(.22,1,.36,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
};

/* ─────────────────────────────────────────────────────────
   CAROUSEL SLIDE 1 — Game Discovery Mockup
───────────────────────────────────────────────────────── */
const MOCK_GAMES = [
  { id:1, stadium:'Neftçi Arena', time:'Bu gün, 19:00', players:'8/12', price:'6 AZN', district:'Nərimanov', open:true },
  { id:2, stadium:'Olympic Complex', time:'Sabah, 10:00', players:'5/10', price:'8 AZN', district:'Binəqədi', open:true },
  { id:3, stadium:'Lokomotiv Sahəsi', time:'Bu gün, 21:00', players:'10/10', price:'5 AZN', district:'Sabunçu', open:false },
];
const SlideGameList = () => (
  <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:10 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
      <span style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>Bakıda oyunlar</span>
      <span style={{ fontSize:11, color:'var(--green)', fontFamily:'Outfit,sans-serif', fontWeight:600 }}>3 aktiv oyun</span>
    </div>
    {MOCK_GAMES.map((g, i) => (
      <div key={g.id} style={{
        background:'var(--bg-raised)',
        border:`1px solid ${g.open ? 'rgba(0,232,122,0.15)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius:12,
        padding:'12px 14px',
        animation:`fade-up .5s ease ${i*0.1}s both`,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
          <span style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>{g.stadium}</span>
          <span style={{
            background: g.open ? 'rgba(0,232,122,0.12)' : 'rgba(255,255,255,0.06)',
            color: g.open ? 'var(--green)' : 'var(--text-tertiary)',
            borderRadius:20, padding:'2px 9px', fontSize:10, fontWeight:700,
            fontFamily:'Outfit,sans-serif', whiteSpace:'nowrap',
          }}>{g.open ? 'Açıqdır' : 'Dolu'}</span>
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          {[{icon:'🕐', v:g.time},{icon:'📍', v:g.district},{icon:'👥', v:g.players},{icon:'💳', v:g.price}].map(it => (
            <span key={it.icon} style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'Outfit,sans-serif', display:'flex', alignItems:'center', gap:3 }}>
              <span>{it.icon}</span>{it.v}
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────
   CAROUSEL SLIDE 2 — SVG Football Field + Position Selection
───────────────────────────────────────────────────────── */
const POSITIONS = [
  { id:'GK',  label:'GK',  x:50,  y:88, taken:true,  name:'Murad' },
  { id:'LB',  label:'LB',  x:18,  y:72, taken:true,  name:'Rauf' },
  { id:'CB1', label:'CB',  x:36,  y:74, taken:false, name:'' },
  { id:'CB2', label:'CB',  x:64,  y:74, taken:true,  name:'Tural' },
  { id:'RB',  label:'RB',  x:82,  y:72, taken:false, name:'' },
  { id:'LM',  label:'LM',  x:14,  y:52, taken:true,  name:'Kamil' },
  { id:'CM1', label:'CM',  x:38,  y:50, taken:false, name:'' },
  { id:'CM2', label:'CM',  x:62,  y:50, taken:true,  name:'Elnur' },
  { id:'RM',  label:'RM',  x:86,  y:52, taken:false, name:'' },
  { id:'ST1', label:'ST',  x:35,  y:28, taken:true,  name:'Anar' },
  { id:'ST2', label:'ST',  x:65,  y:28, taken:false, name:'' },
];
const SlideField = () => {
  const [hoveredPos, setHoveredPos] = useState(null);
  return (
    <div style={{ padding:'12px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Mövqeyini seç</span>
        <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'Outfit,sans-serif' }}>
          <span style={{ color:'var(--green)', fontWeight:600 }}>5</span>/11 boş
        </span>
      </div>
      <svg viewBox="0 0 300 200" style={{ width:'100%', borderRadius:10, display:'block' }}>
        {/* Field background */}
        <defs>
          <linearGradient id="fieldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a5c1a"/>
            <stop offset="50%" stopColor="#1e6b1e"/>
            <stop offset="100%" stopColor="#1a5c1a"/>
          </linearGradient>
          {/* Stripes */}
          <pattern id="stripes" x="0" y="0" width="30" height="200" patternUnits="userSpaceOnUse">
            <rect width="15" height="200" fill="rgba(255,255,255,0.03)"/>
          </pattern>
        </defs>
        <rect width="300" height="200" fill="url(#fieldGrad)" rx="8"/>
        <rect width="300" height="200" fill="url(#stripes)" rx="8"/>

        {/* Outer boundary */}
        <rect x="8" y="8" width="284" height="184" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" rx="3"/>

        {/* Center line */}
        <line x1="8" y1="100" x2="292" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>

        {/* Center circle */}
        <circle cx="150" cy="100" r="26" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        <circle cx="150" cy="100" r="2" fill="rgba(255,255,255,0.5)"/>

        {/* Top penalty area */}
        <rect x="88" y="8" width="124" height="38" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
        <rect x="118" y="8" width="64" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
        <semicircle/>

        {/* Bottom penalty area */}
        <rect x="88" y="154" width="124" height="38" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
        <rect x="118" y="174" width="64" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>

        {/* Corner arcs */}
        {[[8,8],[292,8],[8,192],[292,192]].map(([cx,cy],i) => (
          <path key={i}
            d={`M ${cx + (cx<150?6:-6)} ${cy} A 6 6 0 0 ${cx<150?1:0} ${cx} ${cy + (cy<100?6:-6)}`}
            fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"
          />
        ))}

        {/* Penalty spots */}
        <circle cx="150" cy="30" r="1.5" fill="rgba(255,255,255,0.5)"/>
        <circle cx="150" cy="170" r="1.5" fill="rgba(255,255,255,0.5)"/>

        {/* Player positions */}
        {POSITIONS.map(pos => {
          const cx = pos.x * 3;
          const cy = pos.y * 2;
          const isHovered = hoveredPos === pos.id;
          const isFree = !pos.taken;
          return (
            <g key={pos.id}
              style={{ cursor: isFree ? 'pointer' : 'default' }}
              onMouseEnter={() => isFree && setHoveredPos(pos.id)}
              onMouseLeave={() => setHoveredPos(null)}
            >
              {/* Glow for free positions */}
              {isFree && (
                <circle cx={cx} cy={cy} r={isHovered ? 12 : 9}
                  fill="rgba(0,232,122,0.15)"
                  style={{ transition:'r .2s ease' }}
                />
              )}
              {/* Main dot */}
              <circle cx={cx} cy={cy} r={isHovered ? 8 : 7}
                fill={pos.taken ? 'rgba(237,242,255,0.25)' : isHovered ? 'var(--green)' : 'rgba(0,232,122,0.8)'}
                stroke={pos.taken ? 'rgba(255,255,255,0.3)' : 'rgba(0,232,122,0.9)'}
                strokeWidth="1.5"
                style={{ transition:'all .2s ease' }}
              />
              {/* Position label */}
              <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="5.5" fontWeight="700" fontFamily="Outfit,sans-serif"
                fill={pos.taken ? 'rgba(255,255,255,0.5)' : '#060c18'}
              >{pos.label}</text>
              {/* Player name or "+" */}
              {pos.taken && pos.name && (
                <text x={cx} y={cy + 13} textAnchor="middle"
                  fontSize="4.5" fontFamily="Outfit,sans-serif"
                  fill="rgba(255,255,255,0.55)"
                >{pos.name}</text>
              )}
              {!pos.taken && !isHovered && (
                <text x={cx} y={cy + 13} textAnchor="middle"
                  fontSize="4.5" fontFamily="Outfit,sans-serif"
                  fill="rgba(0,232,122,0.7)"
                >boş</text>
              )}
              {!pos.taken && isHovered && (
                <text x={cx} y={cy + 13} textAnchor="middle"
                  fontSize="4.5" fontFamily="Outfit,sans-serif" fontWeight="700"
                  fill="var(--green)"
                >Seç!</text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ display:'flex', gap:16, marginTop:10, justifyContent:'center' }}>
        {[{color:'rgba(0,232,122,0.8)',label:'Boş mövqe'},{color:'rgba(237,242,255,0.3)',label:'Tutulmuş'}].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:l.color, border:'1.5px solid rgba(255,255,255,0.2)' }}/>
            <span style={{ fontSize:10, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   CAROUSEL SLIDE 3 — Team Swap Animation
───────────────────────────────────────────────────────── */
const INITIAL_PLAYERS = [
  { id:1, name:'Anar K.',  rating:82, team:'A', color:'#00e87a' },
  { id:2, name:'Rauf M.',  rating:71, team:'A', color:'#00e87a' },
  { id:3, name:'Kamil H.', rating:88, team:'A', color:'#00e87a' },
  { id:4, name:'Tural N.', rating:69, team:'A', color:'#00e87a' },
  { id:5, name:'Elnur S.', rating:79, team:'A', color:'#00e87a' },
  { id:6, name:'Orxan A.', rating:84, team:'B', color:'#4f86f7' },
  { id:7, name:'Vüsal R.', rating:72, team:'B', color:'#4f86f7' },
  { id:8, name:'Rəşad T.', rating:80, team:'B', color:'#4f86f7' },
  { id:9, name:'Fərid Q.', rating:70, team:'B', color:'#4f86f7' },
  { id:10,name:'Murad L.', rating:76, team:'B', color:'#4f86f7' },
];

const avgRating = (players, team) => {
  const t = players.filter(p => p.team === team);
  return t.length ? Math.round(t.reduce((s, p) => s + p.rating, 0) / t.length) : 0;
};

const PlayerRow = ({ player, isSwapping, teamSide }) => {
  const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const color = player.team === 'A' ? '#00e87a' : '#4f86f7';
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'6px 8px', borderRadius:9,
      background: isSwapping ? (player.team === 'A' ? 'rgba(0,232,122,0.1)' : 'rgba(79,134,247,0.1)') : 'transparent',
      border: isSwapping ? `1px solid ${color}40` : '1px solid transparent',
      animation: isSwapping ? 'swap-flash .7s ease' : 'none',
      transition: 'background .3s ease, border-color .3s ease',
      justifyContent: teamSide === 'B' ? 'flex-end' : 'flex-start',
    }}>
      {teamSide === 'A' && <>
        <div style={{
          width:28, height:28, borderRadius:'50%',
          background:`${color}22`, border:`1.5px solid ${color}66`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:9.5,
          color, flexShrink:0,
        }}>{initials}</div>
        <div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:11, color:'var(--text-primary)', lineHeight:1.2 }}>{player.name}</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--text-tertiary)' }}>MMR: {player.rating}</div>
        </div>
        {isSwapping && <div style={{ marginLeft:'auto', fontSize:14 }}>⇄</div>}
      </>}
      {teamSide === 'B' && <>
        {isSwapping && <div style={{ marginRight:'auto', fontSize:14 }}>⇄</div>}
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:11, color:'var(--text-primary)', lineHeight:1.2 }}>{player.name}</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--text-tertiary)' }}>MMR: {player.rating}</div>
        </div>
        <div style={{
          width:28, height:28, borderRadius:'50%',
          background:`${color}22`, border:`1.5px solid ${color}66`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:9.5,
          color, flexShrink:0,
        }}>{initials}</div>
      </>}
    </div>
  );
};

const SlideTeamSwap = () => {
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [swappingIds, setSwappingIds] = useState([]);
  const [swapCount, setSwapCount] = useState(0);
  const [floatMsg, setFloatMsg] = useState(null);
  const playersRef = useRef(INITIAL_PLAYERS);

  useEffect(() => {
    const tick = () => {
      const current = playersRef.current;
      const tA = current.filter(p => p.team === 'A');
      const tB = current.filter(p => p.team === 'B');
      if (!tA.length || !tB.length) return;
      const pA = tA[Math.floor(Math.random() * tA.length)];
      const pB = tB[Math.floor(Math.random() * tB.length)];
      setSwappingIds([pA.id, pB.id]);
      setFloatMsg({ text:'Dəyişdirilir...', id: Date.now() });
      setTimeout(() => {
        const next = current.map(p => {
          if (p.id === pA.id) return { ...p, team:'B', color:'#4f86f7' };
          if (p.id === pB.id) return { ...p, team:'A', color:'#00e87a' };
          return p;
        });
        playersRef.current = next;
        setPlayers(next);
        setSwappingIds([]);
        setSwapCount(c => c + 1);
      }, 750);
    };
    const iv = setInterval(tick, 2400);
    return () => clearInterval(iv);
  }, []);

  const teamA = players.filter(p => p.team === 'A');
  const teamB = players.filter(p => p.team === 'B');
  const avgA = avgRating(players, 'A');
  const avgB = avgRating(players, 'B');
  const diff = Math.abs(avgA - avgB);

  return (
    <div style={{ padding:'14px 16px', position:'relative' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>
          Komanda Balansı
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{
            width:7, height:7, borderRadius:'50%', background:'var(--green)',
            animation:'blink-dot 1.5s ease infinite',
          }}/>
          <span style={{ fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--green)', fontWeight:600 }}>
            {swapCount} dəyişim
          </span>
        </div>
      </div>

      {/* Balance bar */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontSize:10, color:'#00e87a', fontFamily:'Outfit,sans-serif', fontWeight:700 }}>A: {avgA}</span>
          <span style={{ fontSize:9, color: diff <= 2 ? 'var(--green)' : 'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>
            {diff <= 2 ? '✓ Balanslaşdırıldı' : `Fərq: ${diff}`}
          </span>
          <span style={{ fontSize:10, color:'#4f86f7', fontFamily:'Outfit,sans-serif', fontWeight:700 }}>B: {avgB}</span>
        </div>
        <div style={{ height:4, borderRadius:2, background:'var(--bg-base)', overflow:'hidden', display:'flex' }}>
          <div style={{
            height:'100%', background:'linear-gradient(90deg,#00e87a,#33f090)',
            width:`${(avgA / (avgA + avgB)) * 100}%`,
            transition:'width .6s cubic-bezier(.22,1,.36,1)',
          }}/>
          <div style={{
            height:'100%', background:'linear-gradient(90deg,#4f86f7,#7aa9ff)',
            flex:1,
            transition:'all .6s cubic-bezier(.22,1,.36,1)',
          }}/>
        </div>
      </div>

      {/* Teams */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:6, alignItems:'start' }}>
        {/* Team A */}
        <div>
          <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:11, color:'#00e87a', marginBottom:5, letterSpacing:.5 }}>KOMANDA A</div>
          {teamA.map(p => (
            <PlayerRow key={p.id} player={p} isSwapping={swappingIds.includes(p.id)} teamSide="A"/>
          ))}
        </div>

        {/* Center divider */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, paddingTop:20 }}>
          <div style={{ width:1, flex:1, background:'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }}/>
          <div style={{
            width:22, height:22, borderRadius:'50%',
            background:'var(--bg-raised)', border:'1px solid var(--border-color)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, color:'var(--text-tertiary)',
          }}>⇄</div>
          <div style={{ width:1, flex:1, background:'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }}/>
        </div>

        {/* Team B */}
        <div>
          <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:11, color:'#4f86f7', marginBottom:5, textAlign:'right', letterSpacing:.5 }}>KOMANDA B</div>
          {teamB.map(p => (
            <PlayerRow key={p.id} player={p} isSwapping={swappingIds.includes(p.id)} teamSide="B"/>
          ))}
        </div>
      </div>

      {/* Float message */}
      {floatMsg && (
        <div key={floatMsg.id} style={{
          position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
          background:'rgba(0,232,122,0.15)', border:'1px solid rgba(0,232,122,0.3)',
          borderRadius:20, padding:'3px 12px',
          fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--green)', fontWeight:600,
          animation:'float-up 1.5s ease forwards', pointerEvents:'none',
          whiteSpace:'nowrap',
        }}>⚡ {floatMsg.text}</div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   CAROUSEL SLIDE 4 — Post-Game / Ratings
───────────────────────────────────────────────────────── */
const SlidePostGame = () => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 400); return () => clearTimeout(t); }, []);
  const badges = ['⚡ Sürətli', '🎯 Dəqiq', '👑 MVP'];
  return (
    <div style={{ padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Oyun Nəticəsi</span>
        <span style={{ fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--text-tertiary)' }}>Neftçi Arena · 60 dəq</span>
      </div>

      {/* Score */}
      <div style={{
        display:'flex', justifyContent:'center', alignItems:'center', gap:20,
        background:'var(--bg-raised)', borderRadius:12, padding:'14px 20px', marginBottom:12,
      }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:11, color:'#00e87a', marginBottom:2 }}>KOMANDA A</div>
          <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:40, color:'var(--text-primary)', lineHeight:1 }}>3</div>
        </div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, color:'var(--text-tertiary)', fontWeight:600 }}>:</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:11, color:'#4f86f7', marginBottom:2 }}>KOMANDA B</div>
          <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:40, color:'var(--text-primary)', lineHeight:1 }}>2</div>
        </div>
      </div>

      {/* MVP */}
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        background:'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
        border:'1px solid rgba(245,158,11,0.25)',
        borderRadius:10, padding:'10px 12px', marginBottom:10,
        animation: revealed ? 'badge-pop .5s ease .2s both' : 'none',
      }}>
        <div style={{ fontSize:24 }}>👑</div>
        <div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:9, color:'rgba(245,158,11,0.8)', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>MVP</div>
          <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>Kamil H.</div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:16, color:'#f59e0b' }}>+12</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:9, color:'var(--text-tertiary)', textAlign:'right' }}>MMR</div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {badges.map((b, i) => (
          <div key={b} style={{
            background:'rgba(0,232,122,0.08)', border:'1px solid rgba(0,232,122,0.2)',
            borderRadius:20, padding:'4px 10px',
            fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--green)', fontWeight:600,
            animation: revealed ? `badge-pop .4s ease ${.1+i*.1}s both` : 'none',
          }}>{b}</div>
        ))}
      </div>

      {/* Rating bars */}
      <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
        {[
          { label:'Hücum', val:78, color:'#f59e0b' },
          { label:'Müdafiə', val:65, color:'#4f86f7' },
          { label:'Sürət', val:88, color:'var(--green)' },
        ].map((s, i) => (
          <div key={s.label}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--text-tertiary)' }}>{s.label}</span>
              <span style={{ fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--text-secondary)', fontWeight:600 }}>{s.val}</span>
            </div>
            <div style={{ height:3, borderRadius:2, background:'var(--bg-base)', overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:2, background:s.color,
                '--bar-w': `${s.val}%`,
                animation: revealed ? `bar-grow .8s ease ${.3+i*.1}s both` : 'none',
                width:`${s.val}%`,
              }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   CAROUSEL WRAPPER
───────────────────────────────────────────────────────── */
const SLIDES = [
  { id:0, title:'Oyunları kəşf et',    subtitle:'Bakıda ən yaxın oyunları tap', component:SlideGameList },
  { id:1, title:'Mövqeyini seç',        subtitle:'İnteraktiv sahə sxemi ilə', component:SlideField },
  { id:2, title:'Komanda balansı',      subtitle:'MMR algoritmilə avtomatik', component:SlideTeamSwap },
  { id:3, title:'Oyun statistikası',    subtitle:'MVP, reytinq, badcelər', component:SlidePostGame },
];
const SLIDE_DURATION = 5500;

const Carousel = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef(null);

  const goTo = useCallback((idx) => {
    setActive(idx);
    setProgressKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setActive(a => { const next = (a + 1) % SLIDES.length; return next; });
      setProgressKey(k => k + 1);
    }, SLIDE_DURATION);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const Slide = SLIDES[active].component;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position:'relative' }}
    >
      {/* Tab headers */}
      <div style={{ display:'flex', gap:4, marginBottom:0, overflowX:'auto', paddingBottom:0 }}>
        {SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => goTo(i)} style={{
            flex:'1 1 0',
            background: active === i ? 'var(--bg-card)' : 'transparent',
            border: `1px solid ${active === i ? 'rgba(0,232,122,0.2)' : 'var(--border-color)'}`,
            borderBottom: active === i ? '1px solid var(--bg-card)' : '1px solid var(--border-color)',
            borderRadius:'10px 10px 0 0',
            padding:'9px 8px 10px',
            cursor:'pointer',
            textAlign:'center',
            transition:'all .2s ease',
            minWidth:0,
          }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:13, color: active === i ? 'var(--green)' : 'var(--text-tertiary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {s.title}
            </div>
          </button>
        ))}
      </div>

      {/* Slide content */}
      <div style={{
        background:'var(--bg-card)',
        border:'1px solid rgba(0,232,122,0.15)',
        borderRadius:'0 0 16px 16px',
        minHeight:320,
        overflow:'hidden',
        position:'relative',
      }}>
        <Slide key={active}/>

        {/* Progress bar */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'var(--bg-raised)' }}>
          <div key={`${active}-${progressKey}`} style={{
            height:'100%',
            background:'var(--green)',
            animation: paused ? 'none' : `carousel-progress ${SLIDE_DURATION}ms linear forwards`,
            borderRadius:1,
          }}/>
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:12 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className="lp-carousel-dot" style={{
            width: active === i ? 20 : 7,
            height:7, borderRadius:4,
            background: active === i ? 'var(--green)' : 'var(--bg-raised)',
            border: active === i ? 'none' : '1px solid var(--border-color)',
            cursor:'pointer', padding:0,
          }}/>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   FAQ DATA
───────────────────────────────────────────────────────── */
const FAQS = [
  {
    q:'Ödəniş necə edilir?',
    a:'Tətbiqdaxili pul kisəsi vasitəsilə. Kartla AZN ilə balansı artırın — bron zamanı avtomatik silinir.',
  },
  {
    q:'Bronu ləğv etmək mümkündürmü?',
    a:'Bəli. Oyundan 24 saat əvvəl ləğv etsəniz pul kisəyə tam qaytarılır. 24 saatdan az qalan halda geri qaytarılmır.',
  },
  {
    q:'Komandalar necə formalaşır?',
    a:'Team Balancer alqoritmi oyunçuları MMR reytinqinə görə snake-draft metodu ilə iki bərabər komandaya bölür.',
  },
  {
    q:'Oyunçu sayı çatmırsa nə olur?',
    a:'Smart Invite funksiyası avtomatik olaraq sizə yaxın, lazımi səviyyəli oyunçuları tapır və onlara dəvət göndərir.',
  },
];

/* ─────────────────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────────────────── */
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn, { passive:true });
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const winW = useWindowWidth();
  const isMobile = winW < 768;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Save referral code for after registration
    const ref = params.get('ref');
    if (ref) localStorage.setItem('pendingRef', ref);

    // Collect UTM params if present
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
      const v = params.get(k); if (v) utm[k] = v;
    });

    fetch('/api/analytics/landing-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrer: document.referrer, utm }),
    }).catch(() => {});
  }, []);

  const isLoggedIn = !!localStorage.getItem('token');
  const goLogin = (page='games') => navigate(`/${page}`);
  const goLoginPage = () => navigate('/login');

  const { data: openGamesData } = useGetGamesQuery({ page: 1, limit: 6, status: 'open' });
  const openGames = openGamesData?.data || [];

  const { data: tournamentsData } = useGetTournamentsQuery({ page: 1, limit: 3 });
  const liveTournaments = (tournamentsData?.tournaments || tournamentsData?.data || []).slice(0, 3);

  return (
    <>
      <style>{STYLES}</style>

      {/* ══════════════════════════ NAVBAR ══════════════════════════ */}
      <nav className="lp-nav" style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px clamp(20px,5vw,64px)', height:'auto',
        background: scrolled ? 'rgba(6,12,24,0.94)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
      }}>
        <div style={{ marginLeft:28, cursor:'pointer' }} onClick={() => navigate('/')}>
          <img
            src="/logo.png"
            alt="logo"
            style={{ height:85, width:'auto', objectFit:'contain', filter:'brightness(0) invert(1)' }}
          />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {!isMobile && (
            <button className="lp-btn-secondary" onClick={() => navigate('/leaderboard')} style={{
              background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-color)',
              borderRadius:10, padding:'9px 18px',
              fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:13,
              cursor:'pointer',
            }}>🏆 Liderboard</button>
          )}
          <button className="lp-btn-primary" onClick={goLoginPage} style={{
            background:'var(--green)', color:'#060c18', border:'none',
            borderRadius:10, padding:'9px 22px',
            fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:14,
            cursor:'pointer', boxShadow:'0 2px 14px var(--green-glow)',
          }}>{isLoggedIn ? 'Oyunlara keç →' : 'Daxil ol'}</button>
        </div>
      </nav>

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section style={{
        position:'relative', minHeight:'100vh',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        textAlign:'center', overflow:'hidden',
        padding:'80px clamp(20px,5vw,80px) 60px',
      }}>
        {/* Grid overlay */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`linear-gradient(rgba(0,232,122,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,232,122,0.03) 1px,transparent 1px)`,
          backgroundSize:'60px 60px', pointerEvents:'none',
        }}/>
        {/* Circles */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:560, height:560, borderRadius:'50%', border:'1px solid rgba(0,232,122,0.05)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:200, height:200, borderRadius:'50%', border:'1px solid rgba(0,232,122,0.08)', pointerEvents:'none' }}/>
        {/* Orbs */}
        <div style={{ position:'absolute', top:'15%', left:'55%', width:560, height:560, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,232,122,0.16) 0%,transparent 65%)', animation:'orb-pulse 6s ease-in-out infinite,orb-drift 12s ease-in-out infinite', pointerEvents:'none', filter:'blur(4px)' }}/>
        <div style={{ position:'absolute', bottom:'10%', right:'60%', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle,rgba(79,134,247,0.09) 0%,transparent 65%)', animation:'orb-drift 16s ease-in-out infinite reverse', pointerEvents:'none' }}/>

        {/* City pill */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:7,
          background:'rgba(0,232,122,0.07)', border:'1px solid rgba(0,232,122,0.18)',
          borderRadius:100, padding:'5px 14px', marginBottom:28,
          animation:'fade-up .7s cubic-bezier(.22,1,.36,1) .08s both',
        }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 8px var(--green)', display:'inline-block', animation:'blink-dot 2s ease-in-out infinite' }}/>
          <span style={{ fontFamily:'Outfit,sans-serif', fontSize:12, color:'var(--green)', fontWeight:600, letterSpacing:.5 }}>Bakı, Azərbaycan</span>
        </div>

        {/* Headline */}
        <h1 className="landing-hero-headline" style={{
          fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800,
          fontSize:'clamp(40px,8vw,86px)', lineHeight:1.1,
          letterSpacing:'-0.5px', color:'var(--text-primary)',
          maxWidth:880, marginBottom:26,
        }}>
          Oyun tap.{' '}
          <span style={{
            background:'linear-gradient(135deg,var(--green) 0%,#33f090 50%,#00c868 100%)',
            backgroundSize:'200% auto',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
            animation:'shimmer 3s linear infinite',
          }}>Meydana</span>{' '}çıx. Qol vur.
        </h1>

        {/* Subtext */}
        <p className="landing-hero-sub" style={{
          fontFamily:'Outfit,sans-serif', fontSize:'clamp(15px,2.5vw,19px)',
          color:'var(--text-secondary)', maxWidth:520, lineHeight:1.7, marginBottom:16,
        }}>
          Bakıda həvəskar futbol üçün ilk platforma.
          Oyunlar tap, komandaya qoşul, reytinqini artır.
        </p>

        {/* CTAs */}
        <div className="landing-hero-ctas" style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
          <button className="lp-btn-primary" onClick={goLogin} style={{
            background:'var(--green)', color:'#060c18', border:'none',
            borderRadius:12, padding:'15px 36px',
            fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:16,
            cursor:'pointer', boxShadow:'0 4px 24px var(--green-glow)',
          }}>Oynamağa başla →</button>
          <button className="lp-btn-secondary" onClick={goLogin} style={{
            background:'transparent', color:'var(--text-secondary)',
            border:'1px solid var(--border-color)',
            borderRadius:12, padding:'15px 36px',
            fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:16,
            cursor:'pointer',
          }}>Oyunlara bax</button>
        </div>

        {/* Scroll hint */}
        <div style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:5, opacity:.3 }}>
          <span style={{ fontFamily:'Outfit', fontSize:10, letterSpacing:'1.5px', color:'var(--text-tertiary)', textTransform:'uppercase' }}>Scroll</span>
          <div style={{ width:1, height:36, background:'linear-gradient(to bottom,var(--green),transparent)' }}/>
        </div>
      </section>

      {/* ══════════════════════════ STATS ══════════════════════════ */}
      <section style={{ padding:'0 clamp(20px,5vw,80px) 80px' }}>
        <FadeSection>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, maxWidth:1100, margin:'0 auto' }}>
            {[
              { icon:'🏟️', value:'10+',   label:'Bakıda stadion' },
              { icon:'⚽', value:'Hər gün', label:'Aktiv oyunlar' },
              { icon:'🤖', value:'Smart',  label:'Komanda seçimi' },
              { icon:'⭐', value:'MMR',    label:'Oyunçu reytinqi' },
            ].map((s,i) => (
              <div key={i} className="lp-stat-card" style={{
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                borderRadius:16, padding:'26px 20px', textAlign:'center',
              }}>
                <div style={{ fontSize:30, marginBottom:10 }}>{s.icon}</div>
                <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:26, color:'var(--green)', letterSpacing:'-1px', marginBottom:5, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ LIVE GAMES ══════════════════════════ */}
      {openGames.length > 0 && (
        <section style={{ padding:'0 clamp(20px,5vw,80px) 80px' }}>
          <FadeSection>
            <div style={{ maxWidth:1100, margin:'0 auto' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:8 }}>
                <div>
                  <h2 style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:800, fontSize:22, color:'var(--text-primary)', margin:0, letterSpacing:'-0.3px' }}>
                    ⚽ Oyunlar indi açıqdır
                  </h2>
                  <p style={{ color:'var(--text-tertiary)', fontSize:13, margin:'4px 0 0' }}>
                    Qeydiyyat olmadan baxın — qoşulmaq üçün hesab açın
                  </p>
                </div>
                <button
                  onClick={() => navigate('/games')}
                  style={{
                    background:'transparent', border:'1px solid var(--border-color)',
                    borderRadius:10, padding:'8px 18px',
                    color:'var(--text-secondary)', fontFamily:'Outfit,sans-serif',
                    fontWeight:600, fontSize:13, cursor:'pointer',
                    transition:'border-color 0.15s, color 0.15s',
                    whiteSpace:'nowrap',
                  }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--green)'; e.currentTarget.style.color='var(--green)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.color='var(--text-secondary)'; }}
                >
                  Hamısına bax →
                </button>
              </div>

              <div style={{
                display:'flex', gap:14, overflowX:'auto', paddingBottom:10,
                scrollbarWidth:'none', msOverflowStyle:'none',
                WebkitOverflowScrolling:'touch', width:'100%', minWidth:0,
              }}>
                {openGames.map(game => {
                  const spots = (game.maxPlayers || 10) - (game.players?.length || 0);
                  return (
                    <div
                      key={game.id}
                      onClick={() => navigate('/register')}
                      style={{
                        minWidth:220, maxWidth:260, flexShrink:0,
                        background:'var(--bg-card)',
                        border:'1px solid var(--border-color)',
                        borderRadius:14, padding:'14px 16px',
                        cursor:'pointer', transition:'border-color 0.15s, transform 0.15s',
                      }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--green-border)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.transform='translateY(0)'; }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <span style={{
                          fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6,
                          background:'var(--green-dim)', color:'var(--green)',
                        }}>
                          {game.format}
                        </span>
                        <span style={{
                          fontSize:11, fontWeight:600,
                          color: spots <= 2 ? '#f04438' : spots <= 4 ? '#f59e0b' : '#48bb78',
                        }}>
                          {spots} yer
                        </span>
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:6, lineHeight:1.3 }}>
                        {game.location || game.stadiumName || 'Bakı'}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-tertiary)' }}>
                        {game.date} · {game.time}
                      </div>
                      <div style={{
                        marginTop:12, paddingTop:10, borderTop:'1px solid var(--border-color)',
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                      }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
                          {game.pricePerSlot > 0 ? `${game.pricePerSlot} ₼` : 'Pulsuz'}
                        </span>
                        <span style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>
                          Qoşul →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeSection>
        </section>
      )}

      {/* ══════════════════════════ FREE PROMO BANNER ══════════════════════════ */}
      <section style={{ padding:'0 clamp(20px,5vw,80px) 80px' }}>
        <FadeSection>
          <div style={{
            maxWidth:1100, margin:'0 auto',
            background:'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)',
            border:'1px solid rgba(245,158,11,0.3)',
            borderRadius:20, padding:'clamp(28px,4vw,44px) clamp(24px,5vw,60px)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:24, position:'relative', overflow:'hidden',
          }}>
            {/* BG decoration */}
            <div style={{ position:'absolute', right:-40, top:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)', pointerEvents:'none' }}/>

            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <div style={{ fontSize:52 }}>🎁</div>
              <div>
                <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:'clamp(20px,3vw,28px)', color:'var(--text-primary)', lineHeight:1.2, marginBottom:6 }}>
                  İlk <span style={{ color:'#f59e0b' }}>5 oyun</span> tamamilə pulsuz!
                </div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, color:'var(--text-secondary)', lineHeight:1.6 }}>
                  Qeydiyyatdan keçin, oyunlara qoşulun. Heç bir ödəniş yoxdur — 5 oyuna qədər.
                </div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
              <div style={{ display:'flex', gap:6 }}>
                {['1','2','3','4','5'].map(n => (
                  <div key={n} style={{
                    width:36, height:36, borderRadius:'50%',
                    background:'rgba(245,158,11,0.15)', border:'2px solid rgba(245,158,11,0.4)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:14, color:'#f59e0b',
                  }}>{n}</div>
                ))}
              </div>
              <button className="lp-btn-primary" onClick={goLogin} style={{
                background:'#f59e0b', color:'#060c18', border:'none',
                borderRadius:10, padding:'11px 28px',
                fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:14,
                cursor:'pointer', boxShadow:'0 4px 20px rgba(245,158,11,0.3)',
              }}>İndi başla →</button>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ HOW IT WORKS ══════════════════════════ */}
      <section style={{ padding:'80px clamp(20px,5vw,80px)', background:'var(--bg-card)', borderTop:'1px solid var(--border-color)', borderBottom:'1px solid var(--border-color)' }}>
        <FadeSection>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'2.5px', color:'var(--green)', textTransform:'uppercase', marginBottom:12 }}>Necə işləyir</p>
              <h2 style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:'clamp(26px,5vw,46px)', color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.1 }}>Oyuna 3 addım</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:28 }}>
              {[
                { num:'01', icon:'🔍', title:'Yaxınlıqda oyun tap', desc:'Tarix, rayon və formatı seçin. Kimin qeydiyyatdan keçdiyini və neçə yer qaldığını görün.' },
                { num:'02', icon:'💳', title:'Qoşul və ödə',        desc:'AZN ilə pul kisəsi vasitəsilə iştirak haqqını ödəyin. Anında bron, yer sizindir.' },
                { num:'03', icon:'🎯', title:'Meydana çıx',         desc:'Gəlin, organizatordan mövqe alın və oyunun keyfini çıxarın. Sonra — reytinq və badcelər.' },
              ].map((s,i) => (
                <FadeSection key={i} delay={i*.1}>
                  <div className="lp-step-card" style={{
                    background:'var(--bg-raised)', border:'1px solid var(--border-color)',
                    borderRadius:20, padding:'34px 28px', position:'relative', overflow:'hidden',
                  }}>
                    <div style={{ position:'absolute', top:-6, right:18, fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:76, color:'rgba(0,232,122,0.04)', lineHeight:1, userSelect:'none' }}>{s.num}</div>
                    <div style={{ width:46, height:46, borderRadius:'50%', background:'var(--green-dim)', border:'1px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:17, color:'var(--green)', marginBottom:18 }}>{i+1}</div>
                    <div style={{ fontSize:34, marginBottom:14 }}>{s.icon}</div>
                    <h3 style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:18, color:'var(--text-primary)', marginBottom:10, lineHeight:1.3 }}>{s.title}</h3>
                    <p style={{ fontFamily:'Outfit,sans-serif', fontSize:14, color:'var(--text-secondary)', lineHeight:1.65 }}>{s.desc}</p>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ ELANLAR ══════════════════════════ */}
      <section style={{ padding:'100px clamp(20px,5vw,80px)', position:'relative', overflow:'hidden' }}>
        {/* Amber glow bg */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,166,35,0.05) 0%,transparent 65%)', pointerEvents:'none' }}/>

        <FadeSection>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 72, alignItems:'center' }}>

              {/* Left: mock elan card */}
              <FadeSection delay={0.1}>
                <div style={{ position:'relative' }}>
                  {/* Floating badge */}
                  <div style={{
                    position:'absolute', top:-18, right: isMobile ? 0 : -12, zIndex:2,
                    background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.4)',
                    borderRadius:30, padding:'5px 14px',
                    fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:12, color:'#f5a623',
                    display:'flex', alignItems:'center', gap:6,
                    animation:'fade-up .5s ease both',
                  }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:'#f5a623', display:'inline-block', animation:'blink-dot 1.4s ease-in-out infinite' }}/>
                    Canlı elan
                  </div>

                  {/* Card */}
                  <div style={{
                    background:'var(--bg-card)', border:'1px solid rgba(245,166,35,0.25)',
                    borderRadius:20, padding:28, boxShadow:'0 8px 48px rgba(0,0,0,0.28)',
                  }}>
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                      <div style={{
                        width:42, height:42, borderRadius:'50%',
                        background:'linear-gradient(135deg,#f5a623,#e8480d)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif",
                        fontWeight:800, fontSize:17, color:'#fff', flexShrink:0,
                      }}>R</div>
                      <div>
                        <div style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>Rauf M.</div>
                        <div style={{ fontSize:12, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>Sabunçu r. · 5x5</div>
                      </div>
                      <div style={{ marginLeft:'auto', background:'rgba(245,166,35,0.12)', border:'1px solid rgba(245,166,35,0.3)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, color:'#f5a623', fontFamily:'Outfit,sans-serif', letterSpacing:'0.5px' }}>ELAN</div>
                    </div>

                    <div style={{ fontSize:13.5, color:'var(--text-secondary)', fontFamily:'Outfit,sans-serif', lineHeight:1.6, marginBottom:18 }}>
                      Şənbə axşamı oynamaq istəyirəm, yeri hələ dəqiqləşdirməmişik. Kim var?
                    </div>

                    {/* Vote bars */}
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', color:'var(--text-tertiary)', textTransform:'uppercase', fontFamily:'Outfit,sans-serif', marginBottom:10 }}>Vaxt seçimi</div>
                      {[
                        { time:'18:00', pct:75, votes:3, winner:true },
                        { time:'20:00', pct:25, votes:1, winner:false },
                      ].map(v => (
                        <div key={v.time} style={{ marginBottom:8 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontFamily:'Outfit,sans-serif', marginBottom:4 }}>
                            <span style={{ color: v.winner ? '#f5a623' : 'var(--text-secondary)', fontWeight: v.winner ? 700 : 400 }}>
                              {v.winner ? '★ ' : ''}{v.time}
                            </span>
                            <span style={{ color:'var(--text-tertiary)' }}>{v.votes} nəfər</span>
                          </div>
                          <div style={{ height:6, borderRadius:99, background:'var(--bg-raised)', overflow:'hidden' }}>
                            <div style={{
                              height:'100%', borderRadius:99,
                              background: v.winner ? 'linear-gradient(90deg,#f5a623,#e8480d)' : 'var(--border-color)',
                              width:`${v.pct}%`, transition:'width .8s ease',
                            }}/>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Interested avatars */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ display:'flex' }}>
                        {['#00e87a','#4f86f7','#f5a623','#e8480d'].map((c,i) => (
                          <div key={i} style={{
                            width:28, height:28, borderRadius:'50%',
                            background:`linear-gradient(135deg,${c},${c}aa)`,
                            border:'2px solid var(--bg-card)',
                            marginLeft: i ? -8 : 0,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:11, fontWeight:800, color:'#fff',
                            fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif",
                          }}>
                            {['R','L','E','T'][i]}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize:12, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>4 nəfər maraqlanır</span>
                      <div style={{ marginLeft:'auto', width:28, height:28, borderRadius:'50%', background:'var(--green-dim)', border:'1px solid rgba(0,232,122,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>💬</div>
                    </div>
                  </div>

                  {/* "Oyun yarat" floating button */}
                  <div style={{
                    position:'absolute', bottom:-18, left: isMobile ? 0 : -12, zIndex:2,
                    background:'var(--green)', color:'#060c18',
                    borderRadius:12, padding:'8px 18px',
                    fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight:800, fontSize:13,
                    boxShadow:'0 4px 20px rgba(0,232,122,0.4)',
                    animation:'fade-up .5s .3s ease both',
                  }}>
                    ⚽ Oyun yarat →
                  </div>
                </div>
              </FadeSection>

              {/* Right: text */}
              <div style={{ order: isMobile ? -1 : 0 }}>
                <p style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'2.5px', color:'#f5a623', textTransform:'uppercase', marginBottom:14 }}>
                  Yeni · Новое
                </p>
                <h2 style={{
                  fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif",
                  fontWeight:800, fontSize:'clamp(26px,4vw,44px)',
                  color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.15, marginBottom:16,
                }}>
                  Oyun olacaq, amma<br/>
                  <span style={{ color:'#f5a623' }}>vaxt hələ bəlli deyil?</span>
                </h2>
                <p style={{ fontFamily:'Outfit,sans-serif', fontSize:15, color:'var(--text-secondary)', lineHeight:1.75, marginBottom:12 }}>
                  <strong style={{ color:'var(--text-primary)' }}>Elan yaz</strong> — qoşulmaq istəyənlər "Maraqlanıram" desin, vaxt seçiminə səs versin, söhbət etsin. Ən çox səs toplayan vaxta oyun yaradılır, hamıya bildiriş gedir.
                </p>
                <p style={{ fontFamily:'Outfit,sans-serif', fontSize:14, color:'var(--text-tertiary)', lineHeight:1.7, marginBottom:32, borderLeft:'3px solid rgba(245,166,35,0.4)', paddingLeft:14 }}>
                  Напишите объявление — заинтересованные игроки проголосуют за удобное время, обсудят детали в чате. Как только всё решено — одним кликом создаётся игра и все получают уведомление.
                </p>

                {[
                  { icon:'📋', text: isMobile ? 'Elan yaz, oyunçuları topla' : 'Elan yaz — rayon, format və tarix göstər' },
                  { icon:'🗳️', text:'Oyunçular vaxt seçiminə səs versin' },
                  { icon:'💬', text:'Söhbətdə detalları razılaşdırın' },
                  { icon:'⚡', text:'Bir klikdə oyuna çevir, hamıya bildiriş get' },
                ].map((f,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'rgba(245,166,35,0.1)', border:'1px solid rgba(245,166,35,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{f.icon}</div>
                    <span style={{ fontFamily:'Outfit,sans-serif', fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.4 }}>{f.text}</span>
                  </div>
                ))}

                <button className="lp-btn-primary" onClick={()=>goLogin('elanlar')} style={{
                  marginTop:28, background:'#f5a623', color:'#060c18', border:'none',
                  borderRadius:12, padding:'13px 28px',
                  fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif",
                  fontWeight:800, fontSize:15, cursor:'pointer',
                  boxShadow:'0 4px 24px rgba(245,166,35,0.35)',
                }}>
                  📋 Elan yaz
                </button>
              </div>

            </div>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ ANIMATED CAROUSEL ══════════════════════════ */}
      <section style={{ padding:'100px clamp(20px,5vw,80px)' }}>
        <FadeSection>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 64, alignItems:'center' }}>

              {/* Left: text */}
              <div>
                <p style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'2.5px', color:'var(--green)', textTransform:'uppercase', marginBottom:14 }}>Platforma imkanları</p>
                <h2 style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:'clamp(26px,4vw,44px)', color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.15, marginBottom:24 }}>
                  Oyun üçün<br/>
                  <span style={{ color:'var(--green)' }}>texnologiya</span>
                </h2>
                <p style={{ fontFamily:'Outfit,sans-serif', fontSize:15, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:32 }}>
                  Oyun axtarışından tutmuş oyundan sonrakı statistikaya qədər — hər şey bir tətbiqdə. İnteraktiv sahə sxemi, canlı komanda balansı, anlıq söhbət.
                </p>

                {/* Feature list */}
                {[
                  { icon:'🧠', label:'Smart Matchmaking — səviyyə və geolokasiyaya görə' },
                  { icon:'⚖️', label:'Team Balancer — MMR ilə bərabər komandalar' },
                  { icon:'🏟️', label:'İnteraktiv sahə sxemi — mövqe seçimi' },
                  { icon:'💬', label:'Canlı söhbət — oyun içi real-time chat' },
                  { icon:'🏆', label:'MVP, badcelər və oyunçu reytinqi' },
                ].map((f,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'var(--green-dim)', border:'1px solid rgba(0,232,122,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{f.icon}</div>
                    <span style={{ fontFamily:'Outfit,sans-serif', fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.4 }}>{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Right: carousel */}
              <div>
                <Carousel/>
              </div>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ FRIENDS + BALANCER ══════════════════════════ */}
      <section style={{ padding:'100px clamp(20px,5vw,80px)', position:'relative', overflow:'hidden' }}>
        {/* bg glow */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,134,247,0.06) 0%, transparent 65%)', pointerEvents:'none' }}/>

        <FadeSection>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 72, alignItems:'center' }}>

            {/* Left: GIF */}
            <div style={{ position:'relative', order: isMobile ? 2 : 1 }}>
              {/* Glow behind gif */}
              <div style={{ position:'absolute', inset:-24, borderRadius:24, background:'radial-gradient(ellipse at center, rgba(79,134,247,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>

              {/* Frame */}
              <div style={{
                position:'relative', borderRadius:20, overflow:'hidden',
                border:'1px solid rgba(79,134,247,0.25)',
                boxShadow:'0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,134,247,0.1)',
              }}>
                {/* Top bar mockup */}
                <div style={{
                  background:'var(--bg-raised)', borderBottom:'1px solid var(--border-color)',
                  padding:'10px 16px', display:'flex', alignItems:'center', gap:8,
                }}>
                  {['#f04438','#f59e0b','#00e87a'].map(c => (
                    <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c, opacity:0.8 }}/>
                  ))}
                  <div style={{ flex:1, height:6, borderRadius:3, background:'var(--bg-hover)', marginLeft:8 }}/>
                </div>

                <img
                  src="/footbal-smart-opt.gif"
                  alt="Komanda balansı"
                  style={{ width:'100%', display:'block', objectFit:'cover' }}
                />
              </div>

              {/* Floating badge */}
              <div style={{
                position:'absolute', bottom:-16, right:-16,
                background:'var(--bg-card)', border:'1px solid rgba(0,232,122,0.3)',
                borderRadius:14, padding:'10px 16px',
                display:'flex', alignItems:'center', gap:8,
                boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <span style={{ fontSize:20 }}>⚖️</span>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color:'var(--green)' }}>Avtomatik balans</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--text-tertiary)' }}>MMR algoritmilə</div>
                </div>
              </div>
            </div>

            {/* Right: text */}
            <div style={{ order: isMobile ? 1 : 2 }}>
              {/* Badge */}
              <div style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'rgba(79,134,247,0.1)', border:'1px solid rgba(79,134,247,0.25)',
                borderRadius:100, padding:'6px 16px', marginBottom:24,
              }}>
                <span style={{ fontSize:14 }}>👥</span>
                <span style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#4f86f7', letterSpacing:'1px', textTransform:'uppercase' }}>Dostlarla oyna</span>
              </div>

              <h2 style={{
                fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700,
                fontSize:'clamp(26px,4vw,44px)', color:'var(--text-primary)',
                letterSpacing:'-1px', lineHeight:1.15, marginBottom:20,
              }}>
                Dostlarını dəvət et —{' '}
                <span style={{ color:'#4f86f7' }}>qalanını biz edərik</span>
              </h2>

              <p style={{
                fontFamily:'Outfit,sans-serif', fontSize:16, color:'var(--text-secondary)',
                lineHeight:1.9, marginBottom:36,
              }}>
                Hər həftə dostlarınla sahəyə çıxın. Oyun başlamazdan əvvəl sadəcə bir düymə ilə
                bütün oyunçular <b style={{ color:'var(--text-primary)' }}>avtomatik olaraq bərabər iki komandaya</b> bölünür —
                heç bir mübahisə, heç bir ədalətsizlik yoxdur.
              </p>

              {/* Feature points */}
              <div style={{ display:'flex', flexDirection:'column', gap:20, marginBottom:36 }}>
                {[
                  { icon:'🧮', title:'MMR reytinqinə görə', desc:'Hər oyunçunun gücü hesablanır və komandalar bərabərləşdirilir' },
                  { icon:'🔀', title:'Snake-draft metodu', desc:'Növbəli seçim — heç bir komanda üstünlük qazanmır' },
                  { icon:'⚡', title:'Bir klik, bir saniyə', desc:'Təşkilatçı düyməyə basır, sistem hər şeyi özü bölüşdürür' },
                ].map((f, i) => (
                  <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                    <div style={{
                      width:40, height:40, borderRadius:10, flexShrink:0,
                      background:'rgba(79,134,247,0.1)', border:'1px solid rgba(79,134,247,0.2)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                    }}>{f.icon}</div>
                    <div>
                      <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:600, fontSize:14, color:'var(--text-primary)', marginBottom:3 }}>{f.title}</div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="lp-btn-primary" onClick={goLogin} style={{
                background:'#4f86f7', color:'#fff', border:'none',
                borderRadius:12, padding:'14px 32px',
                fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:15,
                cursor:'pointer', boxShadow:'0 4px 24px rgba(79,134,247,0.35)',
              }}>
                Dostlarını dəvət et →
              </button>
            </div>

          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ TEAMS ══════════════════════════ */}
      <section style={{ padding:'100px clamp(20px,5vw,80px)', background:'var(--bg-card)', borderTop:'1px solid var(--border-color)', borderBottom:'1px solid var(--border-color)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:800, height:800, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 65%)', pointerEvents:'none' }}/>
        <FadeSection>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>

            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:64 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:100, padding:'6px 18px', marginBottom:20 }}>
                <span style={{ fontSize:14 }}>🛡️</span>
                <span style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, color:'#a855f7', letterSpacing:'2px', textTransform:'uppercase' }}>Komanda rejimi</span>
              </div>
              <h2 style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:'clamp(28px,5vw,50px)', color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.1, marginBottom:18 }}>
                Komanda yarat.<br/>
                <span style={{ color:'#a855f7' }}>Rəqibə meydan oxu.</span>
              </h2>
              <p style={{ fontFamily:'Outfit,sans-serif', fontSize:16, color:'var(--text-secondary)', lineHeight:1.7, maxWidth:520, margin:'0 auto' }}>
                Tək oyun kifayət deyil? Öz komanданızı yaradın, dostları dəvət edin və rəqib komandalarla üz-üzə gəlin.
              </p>
            </div>

            {/* Feature cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24, marginBottom:56 }}>
              {[
                {
                  icon:'🛡️',
                  color:'#a855f7',
                  bg:'rgba(168,85,247,0.08)',
                  border:'rgba(168,85,247,0.2)',
                  title:'Komanda yarat',
                  desc:'Adını seç, bayraq yüklə, kapitanlığı üstlən. Komandanı istədiyin qədər böyüt.',
                },
                {
                  icon:'⚔️',
                  color:'#f59e0b',
                  bg:'rgba(245,158,11,0.08)',
                  border:'rgba(245,158,11,0.2)',
                  title:'Meydan oxu',
                  desc:'İstənilən komandaya challenge göndər — tarix, vaxt, yer seç. Cavab gəldi — meydana çıx.',
                },
                {
                  icon:'🏆',
                  color:'#00e87a',
                  bg:'rgba(0,232,122,0.08)',
                  border:'rgba(0,232,122,0.2)',
                  title:'MMR & Statistika',
                  desc:'Hər oyun komandanın reytinqini dəyişir. Qalib gəl — cədvəldə yuxarı qalx.',
                },
              ].map((f, i) => (
                <FadeSection key={i} delay={i * 0.1}>
                  <div style={{
                    background:'var(--bg-raised)',
                    border:`1px solid ${f.border}`,
                    borderRadius:20,
                    padding:'32px 28px',
                    height:'100%',
                    transition:'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 48px ${f.bg}`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
                  >
                    <div style={{ width:52, height:52, borderRadius:14, background:f.bg, border:`1px solid ${f.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:20 }}>
                      {f.icon}
                    </div>
                    <h3 style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:20, color:'var(--text-primary)', marginBottom:10, lineHeight:1.2 }}>
                      {f.title}
                    </h3>
                    <p style={{ fontFamily:'Outfit,sans-serif', fontSize:14, color:'var(--text-secondary)', lineHeight:1.7, margin:0 }}>
                      {f.desc}
                    </p>
                  </div>
                </FadeSection>
              ))}
            </div>

            {/* Mini leaderboard mockup */}
            <FadeSection delay={0.2}>
              <div style={{
                maxWidth:560, margin:'0 auto',
                background:'var(--bg-raised)',
                border:'1px solid rgba(168,85,247,0.2)',
                borderRadius:20,
                overflow:'hidden',
                boxShadow:'0 24px 80px rgba(168,85,247,0.08)',
              }}>
                {/* Top bar */}
                <div style={{ background:'rgba(168,85,247,0.08)', borderBottom:'1px solid rgba(168,85,247,0.15)', padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:16 }}>🛡️</span>
                  <span style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Komanda reytinqi</span>
                  <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, background:'rgba(0,232,122,0.1)', border:'1px solid rgba(0,232,122,0.2)', borderRadius:100, padding:'3px 10px' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)' }}/>
                    <span style={{ fontFamily:'Outfit,sans-serif', fontSize:11, color:'var(--green)', fontWeight:600 }}>Canlı</span>
                  </div>
                </div>
                {/* Rows */}
                {[
                  { rank:1, name:'Neftçi Legends',  mmr:1840, w:12, l:3,  emoji:'🥇' },
                  { rank:2, name:'Baku United',      mmr:1720, w:9,  l:4,  emoji:'🥈' },
                  { rank:3, name:'Sabail FC Amateur', mmr:1650, w:8,  l:5,  emoji:'🥉' },
                  { rank:4, name:'Surakhani Boys',   mmr:1580, w:7,  l:6,  emoji:'4' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'13px 20px',
                    borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none',
                    background: i === 0 ? 'rgba(250,173,20,0.04)' : 'transparent',
                  }}>
                    <span style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:14, width:24, textAlign:'center', flexShrink:0, color: i < 3 ? '#faad14' : 'var(--text-tertiary)' }}>
                      {row.emoji}
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:13, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{row.name}</div>
                    </div>
                    <div style={{ display:'flex', gap:16, alignItems:'center', flexShrink:0 }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:13, color:'#faad14' }}>{row.mmr}</div>
                        <div style={{ fontSize:9, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>MMR</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:13, color:'#52c41a' }}>{row.w}W</div>
                        <div style={{ fontSize:9, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>Qələbə</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:700, fontSize:13, color:'#f04438' }}>{row.l}L</div>
                        <div style={{ fontSize:9, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>Məğlub</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeSection>

          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ TOURNAMENTS ══════════════════════════ */}
      <section style={{ padding:'100px clamp(20px,5vw,80px)', position:'relative', overflow:'hidden' }}>
        {/* Background glows */}
        <div style={{ position:'absolute', left:'10%', top:'20%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(240,192,64,0.06) 0%,transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', right:'5%', bottom:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,232,122,0.05) 0%,transparent 65%)', pointerEvents:'none' }}/>

        <FadeSection>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>

            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:64 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(240,192,64,0.1)', border:'1px solid rgba(240,192,64,0.25)', borderRadius:100, padding:'6px 18px', marginBottom:20 }}>
                <span style={{ fontSize:14 }}>🏆</span>
                <span style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, color:'#f0c040', letterSpacing:'2px', textTransform:'uppercase' }}>Turnir rejimi</span>
              </div>
              <h2 style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:800, fontSize:'clamp(28px,5vw,50px)', color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.1, marginBottom:18 }}>
                Turnirə qoşul.<br/>
                <span style={{ background:'linear-gradient(135deg,#f0c040,#e07b20)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Çempionu sən ol.</span>
              </h2>
              <p style={{ fontFamily:'Outfit,sans-serif', fontSize:16, color:'var(--text-secondary)', lineHeight:1.7, maxWidth:560, margin:'0 auto' }}>
                Qrup mərhələsi, pley-off sətki, canlı püşk atma — hamısı bir platformada. Komanданı qeydiyyatdan keçir və kuboka gedən yolu başla.
              </p>
            </div>

            {/* How it works — 4 steps */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:16, marginBottom:64 }}>
              {[
                { icon:'📋', step:'01', title:'Qeydiyyat', desc:'Kapitan olaraq komandanı turnirə qeyd et' },
                { icon:'🎲', step:'02', title:'Püşk atma', desc:'Canlı animasiyalı qrup püşkü' },
                { icon:'⚽', step:'03', title:'Qrup mərhələsi', desc:'4 komanda, ən yaxşı 2-si irəliyə keçir' },
                { icon:'🔥', step:'04', title:'Pley-off', desc:'1/4, 1/2 final və böyük final' },
              ].map((s, i) => (
                <div key={i} style={{
                  background:'var(--bg-card)', border:'1px solid var(--border-color)',
                  borderRadius:16, padding:'22px 18px', position:'relative', overflow:'hidden',
                  transition:'border-color 0.2s, transform 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(240,192,64,0.3)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.transform='translateY(0)'; }}
                >
                  <div style={{ position:'absolute', top:12, right:14, fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:800, color:'rgba(240,192,64,0.2)', letterSpacing:'1px' }}>{s.step}</div>
                  <div style={{ fontSize:28, marginBottom:12 }}>{s.icon}</div>
                  <div style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:700, fontSize:15, color:'var(--text-primary)', marginBottom:6 }}>{s.title}</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, color:'var(--text-tertiary)', lineHeight:1.5 }}>{s.desc}</div>
                  {i < 3 && !isMobile && (
                    <div style={{ position:'absolute', right:-12, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'rgba(240,192,64,0.25)', zIndex:2 }}>→</div>
                  )}
                </div>
              ))}
            </div>

            {/* Live tournaments OR visual placeholder */}
            {liveTournaments.length > 0 ? (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#f0c040', boxShadow:'0 0 8px rgba(240,192,64,0.8)', animation:'dotBlink 1s ease-in-out infinite' }}/>
                    <span style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:700, fontSize:18, color:'var(--text-primary)' }}>Aktiv turnirler</span>
                  </div>
                  <button onClick={() => navigate('/tournaments')} style={{ background:'transparent', border:'1px solid var(--border-color)', borderRadius:10, padding:'8px 18px', color:'var(--text-secondary)', fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:13, cursor:'pointer', transition:'border-color 0.15s,color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#f0c040'; e.currentTarget.style.color='#f0c040'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.color='var(--text-secondary)'; }}
                  >Hamısına bax →</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:16 }}>
                  {liveTournaments.map(tour => {
                    const statusColors = { registration:'#63b3ed', group_stage:'#68d391', playoff:'#fc8181', completed:'#a0aec0' };
                    const statusIcons  = { registration:'📋', group_stage:'⚽', playoff:'🔥', completed:'🏆' };
                    const col = statusColors[tour.status] || '#63b3ed';
                    const filled = tour.teams?.length || 0;
                    const pct = tour.maxTeams ? Math.round(filled / tour.maxTeams * 100) : 0;
                    return (
                      <div key={tour.id} onClick={() => navigate('/register')} style={{
                        background:'linear-gradient(145deg,#0d1528,#0a1020)',
                        border:'1px solid rgba(240,192,64,0.15)',
                        borderRadius:18, overflow:'hidden', cursor:'pointer',
                        transition:'border-color 0.2s,transform 0.2s',
                        boxShadow:'0 4px 24px rgba(0,0,0,0.4)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(240,192,64,0.4)'; e.currentTarget.style.transform='translateY(-4px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(240,192,64,0.15)'; e.currentTarget.style.transform='translateY(0)'; }}
                      >
                        {/* Gold top bar */}
                        <div style={{ height:3, background:'linear-gradient(90deg,#f0c040,#e07b20,#f0c040)', backgroundSize:'200% 100%' }}/>
                        <div style={{ padding:'18px 20px' }}>
                          {/* Status + format */}
                          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:`${col}18`, color:col, border:`1px solid ${col}40` }}>
                              {statusIcons[tour.status]} {tour.status === 'registration' ? 'Qeydiyyat açıqdır' : tour.status === 'group_stage' ? 'Qrup mərhələsi' : tour.status === 'playoff' ? 'Pley-off' : 'Tamamlandı'}
                            </span>
                            <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'var(--text-tertiary)' }}>{tour.format}</span>
                          </div>
                          {/* Name */}
                          <div style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:800, fontSize:17, color:'#e0e6f0', marginBottom:6, lineHeight:1.2 }}>
                            {tour.name}
                          </div>
                          {/* Location */}
                          {tour.location && (
                            <div style={{ fontSize:12, color:'var(--text-tertiary)', marginBottom:14 }}>📍 {tour.location}</div>
                          )}
                          {/* Teams progress bar */}
                          <div style={{ marginBottom:14 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                              <span style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>Komandalar</span>
                              <span style={{ fontSize:11, fontWeight:700, color:'#f0c040', fontFamily:'Outfit,sans-serif' }}>{filled} / {tour.maxTeams}</span>
                            </div>
                            <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#f0c040,#e07b20)', borderRadius:2, transition:'width 0.8s ease' }}/>
                            </div>
                          </div>
                          {/* Prize + entry */}
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                              <div style={{ fontSize:10, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>Mükafat fondu</div>
                              <div style={{ fontSize:16, fontWeight:800, color:'#f0c040', fontFamily:'Outfit,sans-serif' }}>
                                {tour.prizePool > 0 ? `${tour.prizePool} ₼` : '—'}
                              </div>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              <div style={{ fontSize:10, color:'var(--text-tertiary)', fontFamily:'Outfit,sans-serif' }}>Üzvlük haqqı</div>
                              <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:'Outfit,sans-serif' }}>
                                {tour.entryFee > 0 ? `${tour.entryFee} ₼` : 'Pulsuz'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Visual placeholder when no tournaments */
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:16, opacity:0.45, pointerEvents:'none' }}>
                {['Kəşf Kuboku', 'Bakı Çempionatı', 'Yay Liqası'].map((name, i) => (
                  <div key={i} style={{ background:'linear-gradient(145deg,#0d1528,#0a1020)', border:'1px solid rgba(240,192,64,0.12)', borderRadius:18, overflow:'hidden' }}>
                    <div style={{ height:3, background:'linear-gradient(90deg,#f0c040,#e07b20)' }}/>
                    <div style={{ padding:'18px 20px' }}>
                      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(99,179,237,0.15)', color:'#63b3ed' }}>📋 Qeydiyyat</span>
                        <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'var(--text-tertiary)' }}>5x5</span>
                      </div>
                      <div style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:800, fontSize:17, color:'#e0e6f0', marginBottom:14 }}>{name}</div>
                      <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:14 }}>
                        <div style={{ height:'100%', width:`${[62,40,15][i]}%`, background:'linear-gradient(90deg,#f0c040,#e07b20)', borderRadius:2 }}/>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                        <div><div style={{ fontSize:10, color:'var(--text-tertiary)' }}>Mükafat fondu</div><div style={{ fontSize:16, fontWeight:800, color:'#f0c040' }}>{[480,320,200][i]} ₼</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'var(--text-tertiary)' }}>Üzvlük haqqı</div><div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{[30,20,15][i]} ₼</div></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ textAlign:'center', marginTop:48 }}>
              <button
                onClick={() => navigate('/register')}
                className="lp-btn-primary"
                style={{ display:'inline-flex', alignItems:'center', gap:10, background:'linear-gradient(135deg,#f0c040,#e07b20)', border:'none', borderRadius:14, padding:'16px 40px', color:'#07101e', fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:16, cursor:'pointer', boxShadow:'0 4px 28px rgba(240,192,64,0.35)' }}
              >
                🏆 Turnirə qoşul
              </button>
              <p style={{ fontFamily:'Outfit,sans-serif', fontSize:13, color:'var(--text-tertiary)', marginTop:12 }}>
                Qeydiyyat tələb olunur · Pulsuz hesab aç
              </p>
            </div>

          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ OWN GAME + SMART INVITE ══════════════════════════ */}
      <section style={{ padding:'100px clamp(20px,5vw,80px)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'30%', transform:'translate(-50%,-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,232,122,0.05) 0%,transparent 65%)', pointerEvents:'none' }}/>

        <FadeSection>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 72, alignItems:'center' }}>

            {/* Left: text */}
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,232,122,0.1)', border:'1px solid rgba(0,232,122,0.25)', borderRadius:100, padding:'6px 18px', marginBottom:20 }}>
                <span style={{ fontSize:14 }}>⚽</span>
                <span style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, color:'var(--green)', letterSpacing:'2px', textTransform:'uppercase' }}>Öz oyunun</span>
              </div>

              <h2 style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:800, fontSize:'clamp(26px,4vw,46px)', color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.1, marginBottom:18 }}>
                Komandan var,<br/>
                <span style={{ color:'var(--green)' }}>1-2 nəfər çatmır?</span>
              </h2>

              <p style={{ fontFamily:'Outfit,sans-serif', fontSize:16, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:32, maxWidth:480 }}>
                Öz yerini tap, neçə nəfər gətirdiyini yaz — sistem avtomatik açıq yerlər yaradır. Legionerlər birbaşa siyahıdan yazılır.
              </p>

              {/* Steps */}
              <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:36 }}>
                {[
                  { n:'1', label:'Öz oyununu yarat', sub:'Ünvan, vaxt, format — 30 saniyədə' },
                  { n:'2', label:'Dostlarını əlavə et', sub:'Sistemdə olsun ya olmasın — sadəcə say yaz' },
                  { n:'3', label:'Smart Invite işə düşür', sub:'Sistem uyğun oyunçuları tapıb dəvətnamə göndərir' },
                ].map(s => (
                  <div key={s.n} style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <div style={{
                      width:28, height:28, borderRadius:'50%', flexShrink:0,
                      background:'rgba(0,232,122,0.12)', border:'1px solid rgba(0,232,122,0.3)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif",
                      fontWeight:800, fontSize:12, color:'var(--green)',
                    }}>{s.n}</div>
                    <div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:14, color:'var(--text-primary)', lineHeight:1.3 }}>{s.label}</div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:12, color:'var(--text-tertiary)', marginTop:2 }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/games/create')}
                style={{
                  display:'inline-flex', alignItems:'center', gap:10,
                  background:'var(--green)', border:'none', borderRadius:12,
                  padding:'13px 28px', cursor:'pointer',
                  fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif",
                  fontWeight:800, fontSize:15, color:'#060c18',
                  boxShadow:'0 0 28px rgba(0,232,122,0.3)',
                  transition:'transform 0.15s, opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1)'; }}
              >
                ⚽ Oyun yarat
              </button>
            </div>

            {/* Right: visual mockup */}
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', inset:-20, borderRadius:24, background:'radial-gradient(ellipse at center,rgba(0,232,122,0.08) 0%,transparent 70%)', pointerEvents:'none' }}/>

              <div style={{
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                borderRadius:20, overflow:'hidden',
                boxShadow:'0 24px 80px rgba(0,0,0,0.4)',
              }}>
                {/* Header bar */}
                <div style={{ background:'var(--bg-raised)', borderBottom:'1px solid var(--border-color)', padding:'12px 16px', display:'flex', alignItems:'center', gap:8 }}>
                  {['#f04438','#f59e0b','#00e87a'].map(c => (
                    <div key={c} style={{ width:9, height:9, borderRadius:'50%', background:c, opacity:0.8 }}/>
                  ))}
                  <div style={{ marginLeft:10, fontFamily:'Outfit,sans-serif', fontSize:12, color:'var(--text-tertiary)' }}>Cümə axşamı 6×6 · Maştağa</div>
                  <div style={{ marginLeft:'auto', background:'rgba(0,232,122,0.15)', border:'1px solid rgba(0,232,122,0.3)', borderRadius:6, padding:'2px 10px', fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, color:'var(--green)' }}>Açıqdır</div>
                </div>

                <div style={{ padding:'20px 20px 8px' }}>
                  {/* Slot summary */}
                  <div style={{ display:'flex', gap:10, marginBottom:20 }}>
                    {[
                      { label:'Öz oyunçular', n:'10', color:'#a590f7', bg:'rgba(124,106,247,0.1)' },
                      { label:'Açıq yerlər', n:'2', color:'var(--green)', bg:'rgba(0,232,122,0.1)' },
                    ].map(b => (
                      <div key={b.label} style={{ flex:1, background:b.bg, border:`1px solid ${b.color}30`, borderRadius:12, padding:'12px 14px', textAlign:'center' }}>
                        <div style={{ fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:800, fontSize:26, color:b.color }}>{b.n}</div>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:11, color:'var(--text-tertiary)', marginTop:2 }}>{b.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Smart invite pulse */}
                  <div style={{ background:'rgba(0,232,122,0.06)', border:'1px solid rgba(0,232,122,0.2)', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <span style={{ fontSize:18 }}>⚡</span>
                      <div>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:13, color:'var(--green)' }}>Smart Invite işə düşdü</div>
                        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:11, color:'var(--text-tertiary)' }}>Uyğun oyunçular tapıldı</div>
                      </div>
                      <div style={{ marginLeft:'auto', fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:800, fontSize:16, color:'var(--green)' }}>14</div>
                    </div>

                    {/* Mini player list */}
                    {[
                      { name:'Elçin M.', mmr:74, dist:'1.2 km', match:'GK' },
                      { name:'Rauf A.',  mmr:68, dist:'0.8 km', match:'MID' },
                      { name:'Tural K.', mmr:71, dist:'2.1 km', match:'DEF' },
                    ].map((p, i) => (
                      <div key={p.name} style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'8px 10px', borderRadius:8, marginBottom: i < 2 ? 6 : 0,
                        background:'var(--bg-raised)', border:'1px solid var(--border-color)',
                      }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:`hsl(${i*80+140},60%,35%)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:800, fontSize:11, color:'#fff', flexShrink:0 }}>
                          {p.name[0]}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:12, color:'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:10, color:'var(--text-tertiary)' }}>{p.dist} · {p.match}</div>
                        </div>
                        <div style={{ background:'rgba(0,232,122,0.12)', border:'1px solid rgba(0,232,122,0.25)', borderRadius:6, padding:'2px 8px', fontFamily:"'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight:700, fontSize:11, color:'var(--green)' }}>{p.mmr}</div>
                        <button style={{ background:'var(--green)', border:'none', borderRadius:6, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:13, color:'#060c18', fontWeight:700 }}>+</button>
                      </div>
                    ))}
                  </div>

                  {/* Payment type badge */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(245,166,35,0.06)', border:'1px solid rgba(245,166,35,0.2)', borderRadius:10 }}>
                    <span style={{ fontSize:16 }}>🤝</span>
                    <div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:12, color:'var(--text-primary)' }}>Ödəniş — yerindəcə</div>
                      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:11, color:'var(--text-tertiary)' }}>Legionerlər pulsuz yazılır</div>
                    </div>
                  </div>
                </div>

                <div style={{ height:14 }} />
              </div>
            </div>

          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ PARTNER TEASER ══════════════════════════ */}
      <section style={{ padding:'80px clamp(20px,5vw,80px)', background:'var(--bg-card)', borderTop:'1px solid var(--border-color)', borderBottom:'1px solid var(--border-color)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-100, top:'50%', transform:'translateY(-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(79,134,247,0.06) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <FadeSection>
          <div style={{ maxWidth:760, margin:'0 auto', textAlign:'center', position:'relative' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(79,134,247,0.1)', border:'1px solid rgba(79,134,247,0.25)', borderRadius:100, padding:'6px 16px', marginBottom:24 }}>
              <span style={{ fontSize:13 }}>🚀</span>
              <span style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, color:'#4f86f7', letterSpacing:'1.5px', textTransform:'uppercase' }}>Tezliklə</span>
            </div>
            <h2 style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:'clamp(24px,4vw,42px)', color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.15, marginBottom:18 }}>
              Bakıda <span style={{ color:'#4f86f7' }}>stadion</span> sahibisiniz?
            </h2>
            <p style={{ fontFamily:'Outfit,sans-serif', fontSize:16, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:32, maxWidth:540, margin:'0 auto 32px' }}>
              Stadionlar üçün tərəfdaş platforması hazırlanır. Slotları yerləşdirin, bronları idarə edin, oyunçular avtomatik tapılsın — zəngsiz, messencersiz.
            </p>
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'var(--bg-raised)', border:'1px solid rgba(79,134,247,0.2)', borderRadius:12, padding:'13px 22px', opacity:.65, cursor:'not-allowed' }}>
              <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, color:'var(--text-secondary)', fontSize:14 }}>Tərəfdaş kabineti — hazırlanır</span>
              <span style={{ fontSize:18 }}>🏗️</span>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ FAQ ══════════════════════════ */}
      <section style={{ padding:'100px clamp(20px,5vw,80px)' }}>
        <FadeSection>
          <div style={{ maxWidth:700, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <p style={{ fontFamily:'Outfit,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'2.5px', color:'var(--green)', textTransform:'uppercase', marginBottom:12 }}>FAQ</p>
              <h2 style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:'clamp(26px,5vw,42px)', color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.1 }}>Tez-tez verilən suallar</h2>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="lp-faq-item" style={{ background:'var(--bg-card)', border:`1px solid ${isOpen ? 'rgba(0,232,122,0.22)' : 'var(--border-color)'}`, borderRadius:14, overflow:'hidden' }}>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'none', border:'none', cursor:'pointer', textAlign:'left', gap:14 }}>
                      <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:15, color: isOpen ? 'var(--green)' : 'var(--text-primary)', transition:'color .2s ease', lineHeight:1.4 }}>{faq.q}</span>
                      <div style={{ width:26, height:26, borderRadius:'50%', border:`1.5px solid ${isOpen ? 'var(--green)' : 'var(--border-color)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background: isOpen ? 'var(--green-dim)' : 'transparent', transition:'all .2s ease' }}>
                        <span style={{ color: isOpen ? 'var(--green)' : 'var(--text-tertiary)', fontSize:18, lineHeight:1, display:'block', transform: isOpen ? 'rotate(45deg)' : 'none', transition:'transform .25s cubic-bezier(.22,1,.36,1)', marginTop:-1 }}>+</span>
                      </div>
                    </button>
                    <div style={{ maxHeight: isOpen ? 180 : 0, overflow:'hidden', transition:'max-height .35s cubic-bezier(.22,1,.36,1)' }}>
                      <p style={{ fontFamily:'Outfit,sans-serif', fontSize:14, color:'var(--text-secondary)', lineHeight:1.7, padding:'0 22px 20px' }}>{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ FINAL CTA ══════════════════════════ */}
      <section style={{ padding:'80px clamp(20px,5vw,80px)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 50%,rgba(0,232,122,0.07) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <FadeSection>
          <div style={{ maxWidth:660, margin:'0 auto', textAlign:'center', background:'var(--bg-card)', border:'1px solid var(--green-border)', borderRadius:24, padding:'clamp(36px,6vw,68px) clamp(28px,5vw,60px)', boxShadow:'0 0 80px rgba(0,232,122,0.06)', position:'relative' }}>
            <div style={{ fontSize:46, marginBottom:18 }}>⚽</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:100, padding:'5px 14px', marginBottom:18 }}>
              <span style={{ fontSize:13 }}>🎁</span>
              <span style={{ fontFamily:'Outfit,sans-serif', fontSize:12, fontWeight:700, color:'#f59e0b' }}>İlk 5 oyun PULSUZ</span>
            </div>
            <h2 style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:'clamp(24px,4vw,38px)', color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1.15, marginBottom:14 }}>İlk oyuna hazırsınız?</h2>
            <p style={{ fontFamily:'Outfit,sans-serif', fontSize:15, color:'var(--text-secondary)', lineHeight:1.65, marginBottom:32 }}>Bir dəqiqəyə qeydiyyatdan keçin və Bakıda ən yaxın oyunu tapın.</p>
            <button className="lp-btn-primary" onClick={goLogin} style={{ background:'var(--green)', color:'#060c18', border:'none', borderRadius:12, padding:'17px 48px', fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:17, cursor:'pointer', boxShadow:'0 4px 28px var(--green-glow)' }}>
              Oynamağa başla →
            </button>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer style={{ borderTop:'1px solid var(--border-color)', padding:'32px clamp(20px,5vw,80px)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>⚽</div>
          <span style={{ fontFamily:"'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight:800, fontSize:17, color:'var(--text-primary)' }}>Topin<span style={{ color:'var(--green)' }}>.az</span></span>
        </div>
        <p style={{ fontFamily:'Outfit,sans-serif', fontSize:12, color:'var(--text-tertiary)', textAlign:'center', margin:0 }}>Bakıda həvəskar futbol — yeni səviyyədə</p>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <a
            href="https://www.instagram.com/topin.az"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-tertiary)', textDecoration:'none', fontFamily:'Outfit,sans-serif', fontSize:13, transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color='#e1306c'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-tertiary)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            @topin.az
          </a>
          <p style={{ fontFamily:'Outfit,sans-serif', fontSize:12, color:'var(--text-tertiary)', margin:0 }}>© 2026 Topin.az</p>
        </div>
      </footer>
    </>
  );
}
