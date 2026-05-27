import { useState, useMemo, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────── */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

function getMajorityPartOfSpeech(words) {
  const counts = {};
  words.forEach(w => {
    const pos = w.partOfSpeech || 'unknown';
    counts[pos] = (counts[pos] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function pickDistractors(correct, eligiblePool, allWords) {
  const correctIds = new Set(correct.map(w => w.id));
  const majorityPos = getMajorityPartOfSpeech(correct);

  const p1 = eligiblePool.filter(w => !correctIds.has(w.id) && w.partOfSpeech === majorityPos);
  const p2 = eligiblePool.filter(w => !correctIds.has(w.id));
  const p3 = allWords.filter(w => !correctIds.has(w.id));

  const chosen = [];
  const chosenIds = new Set();
  for (const pool of [p1, p2, p3]) {
    if (chosen.length === 3) break;
    const candidates = pool.filter(w => !chosenIds.has(w.id));
    const picks = sample(candidates, 3 - chosen.length);
    picks.forEach(w => { chosen.push(w); chosenIds.add(w.id); });
  }
  return chosen;
}

function generateQuestion(eligiblePool, allWords) {
  const correct = sample(eligiblePool, 3);
  const distractors = pickDistractors(correct, eligiblePool, allWords);
  const items = shuffle([...correct, ...distractors]).map(w => w.word);
  const definitions = correct.map(w => ({ id: w.id, text: w.definition }));
  const answers = correct.map(w => w.word); // answers[i] is the correct word for definitions[i]
  return { items, definitions, answers };
}

function generateExamSession(eligiblePool, allWords) {
  return Array.from({ length: 5 }, () => generateQuestion(eligiblePool, allWords));
}

/* ── Back button ─────────────────────────────────────────── */
const BackButton = ({ onBack }) => (
  <button
    onClick={onBack}
    aria-label="חזרה"
    className="flex items-center justify-center rounded-xl transition-colors active:scale-95 flex-shrink-0"
    style={{
      width: 36, height: 36,
      background: '#fff',
      border: '1px solid #DDDBE8',
      color: '#3B4DA8',
    }}
  >
    <ArrowRight size={17} />
  </button>
);

/* ── Not enough words screen ─────────────────────────────── */
const NotEnoughWords = ({ onBack }) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" dir="rtl" style={{ background: '#ECEAF6' }}>
    <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📚</div>
    <h2 className="font-extrabold text-xl mb-3" style={{ color: '#18172B' }}>
      עדיין לא מספיק מילים
    </h2>
    <p className="text-sm mb-6 leading-relaxed" style={{ color: '#5A5874', maxWidth: 280 }}>
      כדי להתחיל מצב בחינה צריך לפחות 12 מילים שלמדת לעומק.
      המשך לתרגל בתכנית היומית וחזור כשתהיה מוכן.
    </p>
    <button
      onClick={onBack}
      className="px-6 py-3 rounded-2xl font-bold text-sm"
      style={{ background: '#3B4DA8', color: '#fff' }}
    >
      חזרה לדשבורד
    </button>
  </div>
);

/* ── Intro screen ────────────────────────────────────────── */
const IntroScreen = ({ onStart, onBack }) => (
  <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: '#ECEAF6' }}>
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4" style={{ borderBottom: '1px solid #DDDBE8' }}>
        <BackButton onBack={onBack} />
        <h1 className="font-extrabold text-lg" style={{ color: '#18172B' }}>מצב בחינה</h1>
      </div>

      <div className="px-6 pt-8 pb-10 flex flex-col gap-6">
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: '#fff', border: '1px solid #DDDBE8' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✦</div>
          <h2 className="font-extrabold text-lg mb-3" style={{ color: '#18172B' }}>
            סימולציית בחינת בגרות
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#5A5874' }}>
            בדיוק כמו בבגרות מודול E — התאם 3 מילים ל-3 הגדרות מתוך 6 מועמדים.
          </p>
        </div>

        {/* Format breakdown */}
        <div className="flex flex-col gap-3">
          {[
            { n: '5', label: 'שאלות בכל מבחן' },
            { n: '6', label: 'מועמדים לכל שאלה' },
            { n: '3', label: 'הגדרות להתאים' },
          ].map(({ n, label }) => (
            <div
              key={n}
              className="flex items-center gap-4 rounded-xl px-4 py-3"
              style={{ background: '#fff', border: '1px solid #DDDBE8' }}
            >
              <span
                className="font-extrabold text-xl flex-shrink-0"
                style={{ color: '#C48B2E', minWidth: 28, textAlign: 'center' }}
              >
                {n}
              </span>
              <span className="text-sm font-semibold" style={{ color: '#18172B' }}>{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #1B2A52 0%, #2E407A 100%)',
            color: '#fff',
            boxShadow: '0 2px 10px rgba(27,42,82,0.28)',
          }}
        >
          התחל מבחן
        </button>
      </div>
    </div>
  </div>
);

/* ── Question screen ─────────────────────────────────────── */
const QuestionScreen = ({ question, questionNumber, totalQuestions, onSubmit }) => {
  const [selectedChip, setSelectedChip] = useState(null); // word string currently "held"
  const [slots, setSlots] = useState([null, null, null]);  // word assigned to each definition slot
  const [submitted, setSubmitted] = useState(false);

  const { items, definitions, answers } = question;

  // Which words are already placed in a slot
  const placedWords = new Set(slots.filter(Boolean));
  // Available in word bank
  const bankItems = items.filter(w => !placedWords.has(w));

  const handleChipClick = (word) => {
    if (submitted) return;
    setSelectedChip(prev => (prev === word ? null : word));
  };

  const handleSlotClick = (slotIdx) => {
    if (submitted) return;
    const current = slots[slotIdx];

    if (current) {
      // Unassign: return word to bank
      const newSlots = [...slots];
      newSlots[slotIdx] = null;
      setSlots(newSlots);
      setSelectedChip(null);
      return;
    }

    if (!selectedChip) return;

    // Assign selectedChip to this slot
    const newSlots = [...slots];
    newSlots[slotIdx] = selectedChip;
    setSlots(newSlots);
    setSelectedChip(null);
  };

  const canSubmit = slots.every(Boolean) && !submitted;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    const correct = slots.filter((word, i) => word === answers[i]).length;
    onSubmit(correct);
  };

  const slotColor = (slotIdx) => {
    if (!submitted || !slots[slotIdx]) return null;
    return slots[slotIdx] === answers[slotIdx] ? 'correct' : 'wrong';
  };

  const isLastQuestion = questionNumber === totalQuestions;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: '#ECEAF6' }}>
      <div className="w-full max-w-sm mx-auto flex flex-col h-full">

        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid #DDDBE8' }}>
          <h1 className="font-extrabold text-lg" style={{ color: '#18172B' }}>מצב בחינה</h1>
          <span className="text-sm font-semibold" style={{ color: '#9A98B0' }}>
            שאלה {questionNumber} מתוך {totalQuestions}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 px-4 pt-3 pb-1 justify-end" dir="ltr">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 8, height: 8,
                background: i < questionNumber ? '#3B4DA8' : '#DDDBE8',
              }}
            />
          ))}
        </div>

        <div className="px-4 pt-3 pb-6 flex flex-col gap-5">

          {/* Word bank */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#9A98B0' }}>
              בנק המילים
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map(word => {
                const isPlaced = placedWords.has(word);
                const isSelected = selectedChip === word;
                return (
                  <button
                    key={word}
                    onClick={() => !isPlaced && handleChipClick(word)}
                    disabled={isPlaced || submitted}
                    className="rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95"
                    style={{
                      background: isSelected ? '#3B4DA8' : isPlaced ? '#F3F4F6' : '#fff',
                      color: isSelected ? '#fff' : isPlaced ? '#C0BFD4' : '#18172B',
                      border: isSelected
                        ? '1.5px solid #3B4DA8'
                        : '1.5px solid #DDDBE8',
                      cursor: isPlaced ? 'default' : 'pointer',
                      textDecoration: isPlaced ? 'line-through' : 'none',
                    }}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Definitions + slots */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#9A98B0' }}>
              הגדרות — התאם מילה לכל הגדרה
            </p>
            <div className="flex flex-col gap-3">
              {definitions.map((def, i) => {
                const status = slotColor(i);
                const assigned = slots[i];
                return (
                  <div
                    key={def.id}
                    className="rounded-2xl p-3"
                    style={{
                      background: '#fff',
                      border: status === 'correct'
                        ? '1.5px solid #10b981'
                        : status === 'wrong'
                        ? '1.5px solid #ef4444'
                        : '1.5px solid #DDDBE8',
                    }}
                  >
                    <p className="text-sm leading-snug mb-2" style={{ color: '#18172B' }} dir="ltr">
                      {i + 1}. {def.text}
                    </p>
                    <button
                      onClick={() => handleSlotClick(i)}
                      disabled={submitted}
                      className="w-full rounded-xl px-3 py-2 text-sm font-bold text-start transition-all"
                      style={{
                        background: assigned
                          ? status === 'correct'
                            ? '#ecfdf5'
                            : status === 'wrong'
                            ? '#fef2f2'
                            : '#EEF1FB'
                          : '#F7F7FB',
                        color: assigned
                          ? status === 'correct'
                            ? '#059669'
                            : status === 'wrong'
                            ? '#dc2626'
                            : '#3B4DA8'
                          : '#C0BFD4',
                        border: assigned ? 'none' : '1.5px dashed #DDDBE8',
                        minHeight: 38,
                      }}
                      dir="ltr"
                    >
                      {assigned || 'בחר מילה'}
                    </button>
                    {/* Show correct answer on wrong slot after submission */}
                    {submitted && status === 'wrong' && (
                      <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#059669' }} dir="ltr">
                        ✓ {answers[i]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit / Next */}
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.97]"
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #1B2A52 0%, #2E407A 100%)'
                  : '#DDDBE8',
                color: canSubmit ? '#fff' : '#9A98B0',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              בדוק תשובות
            </button>
          ) : (
            <button
              onClick={() => onSubmit(null)} // signal "advance"
              className="w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #1B2A52 0%, #2E407A 100%)',
                color: '#fff',
              }}
            >
              {isLastQuestion ? 'סיים מבחן' : 'שאלה הבאה →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Results screen ──────────────────────────────────────── */
const ResultsScreen = ({ score, total, onBack }) => {
  const bagrutScore = score * 2;
  const pct = Math.round((score / total) * 100);
  const bagrutPct = Math.round((bagrutScore / (total * 2)) * 100);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" dir="rtl" style={{ background: '#ECEAF6' }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl p-6 text-center mb-5" style={{ background: '#fff', border: '1px solid #DDDBE8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎓</div>
          <h2 className="font-extrabold text-2xl mb-1" style={{ color: '#18172B' }}>
            סיימת את המבחן!
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9A98B0' }}>תוצאת הסימולציה שלך</p>

          {/* Raw score */}
          <div className="mb-5">
            <div className="font-extrabold" style={{ fontSize: '3rem', color: '#3B4DA8', lineHeight: 1 }}>
              {score}<span style={{ fontSize: '1.5rem', color: '#9A98B0' }}>/{total}</span>
            </div>
            <div className="text-sm mt-1" style={{ color: '#5A5874' }}>
              תשובות נכונות ({pct}%)
            </div>
          </div>

          {/* Bagrut score */}
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#92400E' }}>
              ציון בגרות משוער
            </div>
            <div className="font-extrabold text-2xl" style={{ color: '#C48B2E' }}>
              {bagrutScore}<span style={{ fontSize: '1rem', color: '#D97706' }}>/{total * 2}</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#92400E' }}>
              {bagrutPct}% — 2 נקודות לכל התאמה נכונה
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #1B2A52 0%, #2E407A 100%)',
            color: '#fff',
            boxShadow: '0 2px 10px rgba(27,42,82,0.28)',
          }}
        >
          חזרה לדשבורד
        </button>
      </div>
    </div>
  );
};

/* ── Main ExamMode component ─────────────────────────────── */
const EXAM_ELIGIBILITY_MIN_POOL = 12;

const ExamMode = ({ words = [], onBack }) => {
  const eligiblePool = useMemo(
    () => words.filter(w => (w.level ?? 0) >= 2 && !w.needsReview),
    [words]
  );

  const questions = useMemo(() => {
    if (eligiblePool.length < EXAM_ELIGIBILITY_MIN_POOL) return [];
    return generateExamSession(eligiblePool, words);
  }, [eligiblePool, words]);

  const [phase, setPhase] = useState('intro'); // 'intro' | 'question' | 'results'
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  // pendingScore holds score from the current question until "Next" is pressed
  const [pendingScore, setPendingScore] = useState(null);

  const handleQuestionSubmit = useCallback((correctCount) => {
    if (correctCount !== null) {
      // First call: answer was checked, save pending score
      setPendingScore(correctCount);
    } else {
      // Second call: "Next" pressed — advance
      const earned = pendingScore ?? 0;
      const newScore = score + earned;
      setPendingScore(null);

      if (currentQ >= 4) {
        setScore(newScore);
        setPhase('results');
      } else {
        setScore(newScore);
        setCurrentQ(q => q + 1);
      }
    }
  }, [currentQ, score, pendingScore]);

  if (eligiblePool.length < EXAM_ELIGIBILITY_MIN_POOL) {
    return <NotEnoughWords onBack={onBack} />;
  }

  if (phase === 'intro') {
    return <IntroScreen onStart={() => setPhase('question')} onBack={onBack} />;
  }

  if (phase === 'question') {
    return (
      <QuestionScreen
        key={currentQ}
        question={questions[currentQ]}
        questionNumber={currentQ + 1}
        totalQuestions={5}
        onSubmit={handleQuestionSubmit}
      />
    );
  }

  return <ResultsScreen score={score} total={15} onBack={onBack} />;
};

export default ExamMode;
