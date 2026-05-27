import { useState, useEffect, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

/* ── Status derivation ───────────────────────────────────── */
function getWordStatus(word) {
  if (word.needsReview) return 'needsReview';
  if (word.exposure === 0) return 'new';
  if (word.level >= 5) return 'mastered';
  if (word.level >= 3) return 'strong';
  return 'learning';
}

const STATUS_CONFIG = {
  new:         { label: 'חדש',    color: '#6b7280', bg: '#f3f4f6' },
  learning:    { label: 'לומד',   color: '#3b82f6', bg: '#eff6ff' },
  needsReview: { label: 'לחזרה',  color: '#d97706', bg: '#fffbeb' },
  strong:      { label: 'חזק',    color: '#7c3aed', bg: '#f5f3ff' },
  mastered:    { label: 'שולט',   color: '#059669', bg: '#ecfdf5' },
};

const FILTER_ORDER = ['all', 'new', 'learning', 'needsReview', 'strong', 'mastered'];
const FILTER_LABELS = {
  all:         'הכל',
  new:         'חדש',
  learning:    'לומד',
  needsReview: 'לחזרה',
  strong:      'חזק',
  mastered:    'שולט',
};

/* ── Main component ──────────────────────────────────────── */
const WordsList = ({ words = [], onBack }) => {
  const PAGE_SIZE = 100;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, filterStatus]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return words.filter(word => {
      const matchesSearch =
        !q ||
        (word.word ?? '').toLowerCase().includes(q) ||
        (word.hebrew ?? '').includes(search.trim());
      const matchesFilter =
        filterStatus === 'all' || getWordStatus(word) === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [words, search, filterStatus]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      style={{ background: '#ECEAF6' }}
    >
      <div className="w-full max-w-sm mx-auto">

        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-4 pt-6 pb-4"
          style={{ borderBottom: '1px solid #DDDBE8' }}
        >
          <button
            onClick={onBack}
            aria-label="חזרה"
            className="flex items-center justify-center rounded-xl transition-colors active:scale-95"
            style={{
              width: 36,
              height: 36,
              background: '#fff',
              border: '1px solid #DDDBE8',
              color: '#3B4DA8',
              flexShrink: 0,
            }}
          >
            <ArrowRight size={17} />
          </button>
          <h1 className="font-extrabold text-lg" style={{ color: '#18172B' }}>
            המילים שלי
          </h1>
        </div>

        <div className="px-4 pt-4 pb-10">

          {/* ── Search ── */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש מילה..."
            aria-label="חפש מילה"
            className="w-full rounded-xl px-4 py-3 text-sm mb-3 outline-none"
            style={{
              background: '#fff',
              border: '1px solid #DDDBE8',
              color: '#18172B',
              fontFamily: 'inherit',
            }}
            dir="rtl"
          />

          {/* ── Filter pills ── */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1" dir="rtl">
            {FILTER_ORDER.map(status => {
              const active = filterStatus === status;
              const cfg = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all"
                  style={{
                    background: active ? (cfg?.bg ?? '#e0e7ff') : '#fff',
                    color: active ? (cfg?.color ?? '#3B4DA8') : '#9A98B0',
                    border: active
                      ? `1.5px solid ${cfg?.color ?? '#3B4DA8'}`
                      : '1.5px solid #DDDBE8',
                  }}
                >
                  {FILTER_LABELS[status]}
                </button>
              );
            })}
          </div>

          {/* ── Word count ── */}
          <p className="text-xs mb-3" style={{ color: '#9A98B0' }}>
            מציג{' '}
            <span className="font-semibold" style={{ color: '#18172B' }}>
              {Math.min(visibleCount, filtered.length)}
            </span>{' '}
            מתוך {filtered.length} תוצאות
          </p>

          {/* ── Word list ── */}
          {filtered.length === 0 ? (
            <div
              className="text-center py-16 text-sm"
              style={{ color: '#9A98B0' }}
            >
              לא נמצאו מילים
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visible.map(word => {
                const status = getWordStatus(word);
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['learning'];
                return (
                  <div
                    key={word.id}
                    className="rounded-2xl px-4 py-3"
                    style={{
                      background: '#fff',
                      border: '1px solid #DDDBE8',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="font-extrabold text-base leading-tight"
                        style={{ color: '#18172B' }}
                      >
                        {word.word}
                      </span>
                      <span
                        className="flex-shrink-0 text-[11px] font-bold rounded-full px-2.5 py-0.5 mt-0.5"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div
                      className="text-sm mt-0.5"
                      style={{ color: '#5A5874' }}
                    >
                      {word.hebrew}
                    </div>
                    {word.partOfSpeech && (
                      <div
                        className="text-[11px] mt-1 font-medium"
                        style={{ color: '#B0AECB' }}
                        dir="ltr"
                      >
                        {word.partOfSpeech}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="w-full mt-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: '#fff',
                border: '1px solid #DDDBE8',
                color: '#3B4DA8',
              }}
            >
              טען עוד ({filtered.length - visibleCount} נותרו)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordsList;
