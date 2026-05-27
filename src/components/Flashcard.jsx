import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, ChevronDown, Sparkles, Brain, ArrowLeftRight, GraduationCap } from 'lucide-react';

/**
 * Adaptive Flashcard
 * exposure 0      -> Intro (show word + definition immediately)
 * exposure 1-3    -> Standard Active Recall (word -> definition)
 * exposure 4-6    -> Reverse Recall (definition -> word)
 * exposure 7-10   -> Exam Mode (harder context, Hebrew hints off by default)
 */
const Flashcard = ({ word, currentIndex, totalWords, onEasy, onHard, onSkip, today, rolling7, streak }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const mode = useMemo(() => {
    const exp = Number(word.exposure || 0);
    if (exp <= 0) return 'intro';
    if (exp <= 3) return 'standard';
    if (exp <= 6) return 'reverse';
    return 'exam';
  }, [word.exposure]);

  const modeMeta = useMemo(() => {
    const map = {
      intro: {
        label: 'Intro',
        border: '#9EC5FF',
        bgSoft: '#F2F7FF',
        Icon: Sparkles,
      },
      standard: {
        label: 'Recall',
        border: '#9FE0B5',
        bgSoft: '#F1FBF5',
        Icon: Brain,
      },
      reverse: {
        label: 'Reverse',
        border: '#C7B6FF',
        bgSoft: '#F5F1FF',
        Icon: ArrowLeftRight,
      },
      exam: {
        label: 'Exam',
        border: '#FFD59A',
        bgSoft: '#FFF6E8',
        Icon: GraduationCap,
      },
    };
    return map[mode] || map.standard;
  }, [mode]);
  
  
  
  const maskedExample = useMemo(() => {
    if (!word.example || !word.word) return word.example || '';
    // Replace the word (case-insensitive) when it appears as a whole word
    const escaped = String(word.word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    return String(word.example).replace(re, '_____');
  }, [word.example, word.word]);

  // Reset card state when word changes (and set sensible defaults per mode)
  useEffect(() => {
    setIsFlipped(false);      // Always start on the front side
    setShowTranslation(false);
  }, [word.id, mode]);
  

  const handleFlip = () => {
    if (mode === 'intro') return; // no flip needed in intro
    setIsFlipped((prev) => !prev);
  };
  

  const handleWordTTS = (e) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExampleTTS = (e) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.example);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEasy = () => {
    setIsFlipped(false);
    setShowTranslation(false);
    onEasy();
  };

  const handleHard = () => {
    setIsFlipped(false);
    setShowTranslation(false);
    onHard();
  };

  const canShowHebrew = mode !== 'exam'; // exam mode: no Hebrew by default
  const showHebrewToggle = word.hebrew && (canShowHebrew || mode === 'exam');

  const headerLeftText = useMemo(() => {
    if (mode === 'intro') return 'Intro';
    if (mode === 'standard') return 'Recall';
    if (mode === 'reverse') return 'Reverse';
    return 'Exam';
  }, [mode]);

  const progressText = useMemo(() => {
    const exp = Number(word.exposure || 0);
    return `Exposure ${exp}/10`;
  }, [word.exposure]);

  // Decide which side asks the question and which reveals the answer
  const questionTitle =
    mode === 'reverse' ? 'English Definition' :
    mode === 'exam' ? 'Context (guess the word)' :
    'Word';

  const answerTitle =
    mode === 'reverse' ? 'Word' :
    mode === 'exam' ? 'Answer' :
    'English Definition';

  const renderQuestionMain = () => {
    if (mode === 'reverse') {
      return (
        <>
          <p className="text-sm text-gray-500 mb-2" dir="ltr">{questionTitle}</p>
          <p className="text-gray-900 text-2xl font-semibold leading-relaxed" dir="ltr">
            {word.definition}
          </p>
        </>
      );
    }

    if (mode === 'exam') {
      return (
        <>
          <p className="text-sm text-gray-500 mb-2" dir="ltr">{questionTitle}</p>
          <div className="flex items-start gap-3">
            <p className="text-gray-900 text-2xl font-semibold leading-relaxed flex-1" dir="ltr">
              {maskedExample}
            </p>
            {word.example && (
              <button
                onClick={handleExampleTTS}
                className="p-2 text-primary hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
                aria-label="Play example audio"
              >
                <Volume2 size={22} />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-4" dir="rtl">
            נחש/י את המילה שחסרה במשפט, ואז לחצ/י כדי לחשוף
          </p>
        </>
      );
    }

    // intro + standard: show the word big
    return (
      <>
        <div className="flex items-center justify-center gap-3 mb-3">
          <h2 className="text-5xl font-bold text-gray-900">{word.word}</h2>
          <button
            onClick={handleWordTTS}
            className="p-2 text-primary hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
            aria-label="Play word audio"
          >
            <Volume2 size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-6">{word.partOfSpeech}</p>

        {mode === 'intro' && (
          <div className="mt-2 w-full max-w-sm">
            <p className="text-sm text-gray-500 mb-2" dir="ltr">English Definition</p>
            <p className="text-gray-900 text-xl font-medium leading-relaxed">{word.definition}</p>
          </div>
        )}
      </>
    );
  };

  const renderAnswerMain = () => {
    if (mode === 'reverse') {
      // answer is the word
      return (
        <>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-5xl font-bold text-gray-900">{word.word}</h2>
            <button
              onClick={handleWordTTS}
              className="p-2 text-primary hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
              aria-label="Play word audio"
            >
              <Volume2 size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-500 uppercase tracking-wider">{word.partOfSpeech}</p>
        </>
      );
    }

    if (mode === 'exam') {
      return (
        <>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-5xl font-bold text-gray-900">{word.word}</h2>
            <button
              onClick={handleWordTTS}
              className="p-2 text-primary hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
              aria-label="Play word audio"
            >
              <Volume2 size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-6">{word.partOfSpeech}</p>

          <div className="w-full">
            <p className="text-sm text-gray-500 mb-2" dir="ltr">English Definition</p>
            <p className="text-gray-900 text-xl font-medium leading-relaxed">{word.definition}</p>
          </div>
        </>
      );
    }

    // intro + standard: answer shows definition + example
    return (
      <>
        <p className="text-sm text-gray-500 mb-2" dir="ltr">{answerTitle}</p>
        <p className="text-gray-900 text-xl font-medium leading-relaxed">{word.definition}</p>
      </>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      {/* Progress indicator */}
<div className="flex justify-between items-center mb-4 text-sm text-gray-600" dir="ltr">
  <div className="flex items-center gap-3">
    <span className="text-left">{headerLeftText} • {progressText}</span>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        border: `1.5px solid ${modeMeta.border}`,
        backgroundColor: modeMeta.bgSoft,
        fontWeight: 700,
        fontSize: 13,
        color: '#333',
      }}
      aria-label={`Learning mode: ${modeMeta.label}`}
    >
      <modeMeta.Icon size={16} />
      <span>{modeMeta.label}</span>
    </div>
  </div>

  <span className="text-right">{currentIndex}/{totalWords}</span>
</div>
{/* Micro-copy for mode explanation (clean RTL container, two balanced lines) */}
{(mode === 'reverse' || mode === 'exam') && (
  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
    <div
      dir="rtl"
      style={{
        border: `1px solid ${modeMeta.border}`,
        backgroundColor: modeMeta.bgSoft,
        borderRadius: 14,
        padding: '8px 12px',
        maxWidth: 520,
        width: '100%',
        textAlign: 'right',          // key: consistent anchor
        fontSize: 12.5,
        color: '#3f3f3f',
      }}
    >
      {mode === 'reverse' && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            תרגול הפוך: קודם הגדרה ואז מילה
          </div>
          <div
            dir="ltr"
            style={{
              fontWeight: 500,
              opacity: 0.9,
              fontSize: 13,
            }}
          >
            Reverse recall: definition → word
          </div>
        </>
      )}

      {mode === 'exam' && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            מצב מבחן: רמזים מוגבלים, עברית מוסתרת כברירת מחדל
          </div>
          <div
            dir="ltr"
            style={{
              fontWeight: 500,
              opacity: 0.9,
              fontSize: 13,
            }}
          >
            Exam mode: limited hints, Hebrew hidden by default
          </div>
        </>
      )}
    </div>
  </div>
)}



      {/* Flashcard */}
      <div
        className="relative mb-6 cursor-pointer"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFlip(); }}
        aria-label={isFlipped ? 'לחץ לחזרה לשאלה' : 'לחץ לחשיפת התשובה'}
        style={{ perspective: '1000px', minHeight: '320px' }}
      >
        <motion.div
          className="absolute inset-0 w-full"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
{/* Question side */}
<div
  className="absolute inset-0 w-full bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8"
  style={{
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    border: `3px solid ${modeMeta.border}`,
    background: `linear-gradient(to bottom, ${modeMeta.bgSoft}, #ffffff 35%)`,
  }}
>
  <div className="text-center w-full relative">
    {renderQuestionMain()}

    <div className="flex gap-2 justify-center flex-wrap mt-6">
      <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
        {mode === 'intro' ? 'New word' : 'Reviewed today'}
      </span>
      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
        Band {word.band}
      </span>
    </div>

    {mode !== 'intro' && (
      <p className="text-xs text-gray-500 mt-4" dir="rtl">
        לחצ/י כדי לחשוף תשובה
      </p>
    )}
  </div>
</div>


          {/* Answer side */}
          <div
  className="absolute inset-0 w-full bg-white rounded-3xl shadow-xl flex flex-col p-8"
  style={{
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: 'rotateY(180deg)',
    border: `3px solid ${modeMeta.border}`,
    background: `linear-gradient(to bottom, ${modeMeta.bgSoft}, #ffffff 35%)`,
  }}
>

            <div className="flex-1">
              {renderAnswerMain()}

              {/* Example (shown on answer side for all modes except exam question side already has it) */}
              {word.example && mode !== 'exam' && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2" dir="ltr">Example</p>
                  <div className="flex items-start gap-3">
                    <p className="text-gray-700 text-lg flex-1 leading-relaxed" dir="ltr">{word.example}</p>
                    <button
                      onClick={handleExampleTTS}
                      className="p-2 text-primary hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
                      aria-label="Play example audio"
                    >
                      <Volume2 size={22} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hebrew hints */}
            {showHebrewToggle && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTranslation((v) => !v);
                  }}
                  className="flex items-center gap-2 text-sm text-primary hover:text-orange-600 transition-colors"
                  dir="rtl"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showTranslation ? 'rotate-180' : ''}`}
                  />
                  {mode === 'exam' ? 'Use Hebrew hints' : 'הצג תרגום'}
                </button>

                {showTranslation && word.hebrew && (
                  <p className="mt-2 text-gray-600 text-lg font-medium" dir="rtl">
                    {word.hebrew}
                  </p>
                )}

                {mode === 'exam' && !showTranslation && (
                  <p className="mt-2 text-xs text-gray-500" dir="rtl">
                    במצב מבחן – התרגום מוסתר כברירת מחדל
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action buttons
          - Standard/Reverse/Exam: show only after reveal (flipped)
          - Intro: buttons are shown immediately (word+definition already visible)
      */}
      {(isFlipped || mode === 'intro') && (
        <div className="flex gap-4 mb-3">
          <button
            onClick={() => {
              setIsFlipped(false);
              setShowTranslation(false);
              onEasy();
            }}
            className="flex-1 bg-success text-white py-5 rounded-2xl font-bold text-lg hover:bg-green-600 active:scale-95 transition-all shadow-lg"
          >
            קל
          </button>
          <button
            onClick={() => {
              setIsFlipped(false);
              setShowTranslation(false);
              onHard();
            }}
            className="flex-1 bg-danger text-white py-5 rounded-2xl font-bold text-lg hover:bg-red-600 active:scale-95 transition-all shadow-lg"
          >
            קשה
          </button>
        </div>
      )}

      {/* Skip option */}
      <button
        onClick={() => {
          setIsFlipped(false);

          setShowTranslation(false);
          onSkip();
        }}
        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
        dir="rtl"
      >
        דלג לעכשיו
      </button>

{/* Progress stats */}
<div className="mt-8 text-center text-xs text-gray-500" dir="rtl">
  <p>היום: {today?.progressText || '0/10'} • דיוק היום: {today?.accuracy || 0}%</p>
  <p className="mt-1">דיוק ב-7 ימים: {rolling7?.accuracy || 0}% • רצף: {streak || 0} ימים</p>
</div>

{/* Flashcard type legend */}
<div className="mt-4 text-center" dir="rtl">
  <button
    onClick={() => setShowLegend(v => !v)}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
    style={{
      background: '#F8F8FC',
      border: '1px solid #DDDBE8',
      color: '#5A5874',
    }}
  >
    <span aria-hidden="true">{showLegend ? '▲' : 'ⓘ'}</span>
    {showLegend ? 'סגור' : 'איך עובדות הכרטיסיות?'}
  </button>

  {showLegend && (
    <div
      className="mt-3 rounded-2xl text-right"
      style={{ background: '#F8F8FC', border: '1px solid #E8E6F0', padding: '12px 14px' }}
    >
      {[
        { border: '#9EC5FF', bg: '#F2F7FF', label: 'Intro',   desc: 'חשיפה ראשונה — הכרטיס מציג מילה והגדרה ישירות, אין צורך להפוך' },
        { border: '#9FE0B5', bg: '#F1FBF5', label: 'Recall',  desc: 'תרגול רגיל — מילה מוצגת, הפוך לגלות את ההגדרה' },
        { border: '#C7B6FF', bg: '#F5F1FF', label: 'Reverse', desc: 'תרגול הפוך — הגדרה מוצגת, הפוך לגלות את המילה' },
        { border: '#FFD59A', bg: '#FFF6E8', label: 'Exam',    desc: 'מצב בחינה — נחש מילה מתוך הקשר, כמו מודול E בבגרות' },
      ].map(({ border, bg, label, desc }) => (
        <div key={label} className="flex items-start gap-2 mb-2 last:mb-0" dir="rtl">
          <span
            className="flex-shrink-0 text-[11px] font-bold rounded-md px-2 py-0.5 mt-0.5"
            style={{ background: bg, border: `1.5px solid ${border}`, color: '#333' }}
          >
            {label}
          </span>
          <span className="text-xs leading-snug" style={{ color: '#5A5874' }}>
            {desc}
          </span>
        </div>
      ))}
    </div>
  )}
</div>
    </div>
  );
};

export default Flashcard;
