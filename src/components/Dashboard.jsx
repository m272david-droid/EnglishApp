import { useMemo } from 'react';
import { Flame, Target, TrendingUp, Play } from 'lucide-react';
import magicELogo     from '../assets/magic-e-logo.svg';
import sparkleIcon    from '../assets/icons/sparkle.svg';
import wandIcon       from '../assets/icons/wand.svg';
import masteryStarIcon from '../assets/icons/mastery-star.svg';
import spellbookIcon  from '../assets/icons/spellbook.svg';

/* ── Chunk definitions ──────────────────────────────────── */
const CHUNKS = [
  { label: 'פרק א', range: '1–10',  ids: [1,2,3,4,5,6,7,8,9,10],         accent: '#3B4DA8' },
  { label: 'פרק ב', range: '11–20', ids: [11,12,13,14,15,16,17,18,19,20], accent: '#6E4DAB' },
  { label: 'פרק ג', range: '21–24', ids: [21,22,23,24],                   accent: '#2A7A70' },
];

function wordState(level = 0) {
  if (level <= 0) return 'new';
  if (level <= 2) return 'learning';
  if (level <= 4) return 'strong';
  return 'mastered';
}

/* Mastered dots: slightly larger + gold ring glow */
const DOT = {
  new:      { bg: '#D8D6EA', w: 12, shadow: 'none' },
  learning: { bg: '#8BA3E0', w: 12, shadow: 'none' },
  strong:   { bg: '#3B4DA8', w: 12, shadow: 'none' },
  mastered: { bg: '#C48B2E', w: 14, shadow: '0 0 0 2px rgba(196,139,46,0.22), 0 0 8px rgba(196,139,46,0.55)' },
};

/* ── Reusable magic accent — uses custom sparkle icon ───── */
const MagicAccent = ({ size = 10 }) => (
  <img src={sparkleIcon} alt="" style={{ width: size, height: size, flexShrink: 0 }} />
);

/* ── Main component ─────────────────────────────────────── */
const Dashboard = ({ today, rolling7, streak, onStart, onViewWords, onStartExam, words = [] }) => {
  const goal        = today?.goal ?? 10;
  const attempts    = today?.attempts ?? 0;
  const progressPct = Math.min((attempts / goal) * 100, 100);
  const isDone      = progressPct >= 100;
  const wordsLeft   = goal - attempts;
  const almostThere = !isDone && wordsLeft > 0 && wordsLeft <= 2;

  const chunks = useMemo(() => {
    const map = {};
    words.forEach(w => { map[w.id] = w; });
    return CHUNKS.map(chunk => {
      const states     = chunk.ids.map(id => wordState(map[id]?.level));
      const learned    = states.filter(s => s !== 'new').length;
      const isComplete = learned === chunk.ids.length;
      return { ...chunk, states, learned, isComplete };
    });
  }, [words]);

  const motivationalLine = isDone
    ? 'כל הכבוד — השלמת את היעד היומי!'
    : `היום נלמד ${goal} מילים חדשות`;

  return (
    <div
      className="min-h-screen flex items-start justify-center"
      dir="rtl"
      style={{ background: '#ECEAF6' }}
    >
      <div className="w-full max-w-sm">

        {/* ══ ZONE 1 — HERO HEADER ══════════════════════════ */}
        <header className="flex flex-col items-center text-center pt-7 pb-8 px-6">
          <img src={magicELogo} alt="Magic E" style={{ height: 80 }} className="mb-3" />

          <div
            className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-1"
            style={{ color: '#9A98B0' }}
          >
            Magic E
          </div>

          <div
            className="font-extrabold leading-tight mb-1"
            style={{ fontSize: '2.3rem', color: '#18172B' }}
          >
            מאמן אוצר מילים
          </div>

          <div className="text-sm mb-3" style={{ color: '#9A98B0' }}>
            מודול E — לקראת הבגרות
          </div>

          {/* Ornamental hairline flanked by custom sparkle icons */}
          <div className="flex items-center justify-center gap-2 mb-[10px]">
            <MagicAccent size={9} />
            <div style={{ width: 36, height: 1, background: '#DDDBE8' }} />
            <MagicAccent size={9} />
          </div>

          <div className="text-sm" style={{ color: '#5A5874' }}>
            {isDone
              ? <span className="inline-flex items-center gap-1.5"><MagicAccent size={11} />{motivationalLine}<MagicAccent size={11} /></span>
              : motivationalLine}
          </div>
        </header>

        {/* ══ ZONE 2 — DAILY PROGRESS HERO ═════════════════ */}
        <div
          className="px-6 py-7 mb-10"
          style={{
            background: '#FFFFFF',
            borderRadius: 0,
            marginLeft: -24,
            marginRight: -24,
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              {/* "Today's Spell" — whisper-level accent, not a competing heading */}
              <div
                className="text-[9px] font-normal uppercase tracking-[0.14em] mb-0.5"
                style={{ color: '#D0CEDF' }}
              >
                Today's Spell
              </div>

              {/* "היעד היומי" with custom wand icon inline */}
              <div
                className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                style={{ color: '#9A98B0' }}
              >
                <span>היעד היומי</span>
                <img src={wandIcon} alt="" style={{ width: 14, height: 14, opacity: 0.75 }} />
              </div>

              <div
                className="font-extrabold leading-none tracking-tight"
                style={{ fontSize: '4rem', color: '#18172B' }}
              >
                {today?.progressText || `0/${goal}`}
              </div>
            </div>

            <div
              className="text-xs font-bold px-3 py-1.5 rounded-full mt-2"
              style={{
                background: isDone ? 'rgba(196,139,46,0.12)' : 'rgba(59,77,168,0.09)',
                color:      isDone ? '#C48B2E' : '#3B4DA8',
              }}
            >
              {isDone ? '✦ הושלם' : `${Math.round(progressPct)}%`}
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full rounded-full overflow-hidden mb-6"
            dir="ltr"
            style={{ height: 8, background: '#D8D6EA' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: isDone
                  ? '#C48B2E'
                  : 'linear-gradient(90deg, #3B4DA8 0%, #6E4DAB 100%)',
              }}
            />
          </div>

          {/* Almost-there nudge */}
          {almostThere && (
            <p className="text-sm font-semibold text-center mb-3" style={{ color: '#C48B2E' }}>
              ✨ עוד {wordsLeft === 1 ? 'מילה אחת' : 'שתי מילים'} ליעד!
            </p>
          )}

          {/* CTA */}
          <button
            onClick={onStart}
            className="w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #1B2A52 0%, #2E407A 100%)',
              color: '#FFFFFF',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 10px rgba(27,42,82,0.28)',
            }}
          >
            <Play size={17} fill="currentColor" />
            התחל את תכנית היום
          </button>

          {/* Secondary: My Words */}
          <button
            onClick={onViewWords}
            className="w-full rounded-2xl py-2.5 font-semibold text-sm transition-all active:scale-[0.97] mt-2"
            style={{
              background: 'transparent',
              color: '#3B4DA8',
              border: 'none',
            }}
          >
            המילים שלי ←
          </button>

          {/* Secondary: Exam Mode */}
          <button
            onClick={onStartExam}
            className="w-full rounded-2xl py-2.5 font-semibold text-sm transition-all active:scale-[0.97]"
            style={{
              background: 'transparent',
              color: '#C48B2E',
              border: 'none',
            }}
          >
            מצב בחינה ✦
          </button>
        </div>

        {/* ══ ZONE 3 — QUICK STATS ══════════════════════════ */}
        <div
          className="grid grid-cols-3 mb-10 px-6"
          style={{
            borderTop: '1px solid #DDDBE8',
            borderBottom: '1px solid #DDDBE8',
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          <StatCell
            icon={<Flame size={15} />}
            label="רצף"
            value={`${streak || 0}`}
            suffix={streak === 1 ? 'יום' : 'ימים'}
            color="#C48B2E"
          />
          <StatCell
            icon={<Target size={15} />}
            label="דיוק היום"
            value={`${today?.accuracy || 0}%`}
            color="#3B4DA8"
            bordered
          />
          <StatCell
            icon={<TrendingUp size={15} />}
            label="דיוק 7 ימים"
            value={`${rolling7?.accuracy || 0}%`}
            color="#6E4DAB"
            bordered
          />
        </div>

        {/* ══ ZONE 4 — SPELLBOOK PROGRESS MAP ══════════════ */}
        <div className="px-6 pb-12">
          {/* Section heading — custom spellbook icon */}
          <div className="flex items-center gap-2 mb-6">
            <img src={spellbookIcon} alt="" style={{ width: 18, height: 18 }} />
            <span className="text-base font-bold" style={{ color: '#18172B' }}>
              מסע אוצר המילים
            </span>
          </div>

          {/* Chapters with journey connectors between them */}
          {chunks.map((chunk, i) => {
            const isLast = i === chunks.length - 1;
            return (
              <div key={i}>
                <Chapter chunk={chunk} />
                {!isLast && (
                  /* Faint sparkle waypoint between chapters */
                  <div style={{ textAlign: 'center', margin: '10px 0', paddingInlineStart: 0 }}>
                    <img src={sparkleIcon} alt="" style={{ width: 8, height: 8, opacity: 0.28 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

/* ── StatCell ───────────────────────────────────────────── */
const StatCell = ({ icon, label, value, suffix, color, bordered }) => (
  <div
    className="flex flex-col items-center text-center"
    style={bordered ? { borderInlineStart: '1px solid #D8D6EA' } : undefined}
  >
    <div className="mb-2" style={{ color }}>
      {icon}
    </div>
    <div
      className="font-extrabold leading-none"
      style={{ fontSize: '1.3rem', color: '#18172B' }}
    >
      {value}
    </div>
    {suffix && (
      <div className="text-[11px] font-medium mt-0.5" style={{ color: '#9A98B0' }}>
        {suffix}
      </div>
    )}
    <div className="text-[11px] leading-tight mt-1" style={{ color: '#9A98B0' }}>
      {label}
    </div>
  </div>
);

/* ── Chapter ────────────────────────────────────────────── */
const Chapter = ({ chunk }) => {
  const { label, range, states, learned, isComplete, ids, accent } = chunk;
  const total         = ids.length;
  const masteredCount = states.filter(s => s === 'mastered').length;
  const stripeColor   = isComplete ? '#C48B2E' : accent;

  const rows = [];
  for (let i = 0; i < states.length; i += 5) {
    rows.push(states.slice(i, i + 5));
  }

  return (
    <section
      style={{
        borderInlineStart: `3px solid ${stripeColor}`,
        paddingInlineStart: 14,
      }}
    >
      {/* Chapter title row */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold" style={{ fontSize: '0.9375rem', color: '#18172B' }}>
          {label}
        </span>
        <span className="text-[11px]" style={{ color: '#9A98B0' }}>
          מילים {range}
        </span>
        {/* Completion badge — custom mastery-star icon */}
        {isComplete && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold"
            style={{ color: '#C48B2E' }}
          >
            <img src={masteryStarIcon} alt="" style={{ width: 13, height: 13 }} />
            הושלם
          </span>
        )}
      </div>

      {/* Dot grid — dir=ltr so dots fill left→right */}
      <div className="flex flex-col gap-2 mb-2" dir="ltr">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-2 items-center">
            {row.map((state, di) => (
              <div
                key={di}
                className="rounded-full flex-shrink-0"
                style={{
                  width:      DOT[state].w,
                  height:     DOT[state].w,
                  background: DOT[state].bg,
                  boxShadow:  DOT[state].shadow,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Progress count */}
      <div className="text-[11px]" style={{ color: '#9A98B0' }}>
        <span className="font-semibold" style={{ color: '#18172B' }}>{learned}</span>
        /{total} נלמדו
      </div>

      {/* Mastered count — appears only when > 0 */}
      {masteredCount > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          <MagicAccent size={9} />
          <span className="text-[10px] font-semibold" style={{ color: '#C48B2E' }}>
            {masteredCount} מושלמות
          </span>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
