const SessionComplete = ({ stats = { completed: 0, easy: 0, hard: 0 }, total, wordsAvailable, goalCompleted, onContinue, onClose, onBackToDashboard }) => {
    const skipped = Math.max(0, (stats.completed || 0) - (stats.easy || 0) - (stats.hard || 0));

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}
        dir="rtl"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-complete-title"
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '24px 20px',
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          <button
            onClick={onClose}
            aria-label="סגור"
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 36,
              height: 36,
              borderRadius: 999,
              border: '1px solid #eee',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: '34px',
            }}
          >
            ×
          </button>

          <h2 id="session-complete-title" style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
            סיימת את הסשן! 🎉
          </h2>

          {goalCompleted && (
            <div style={{
              display: 'inline-block',
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: 99,
              padding: '4px 14px',
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 10,
            }}>
              ⭐ יעד יומי הושג!
            </div>
          )}

          <p style={{ color: '#555', marginBottom: 18 }}>
            {total} מילים בסשן הזה
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: 10,
              marginBottom: 18,
            }}
          >
            <Stat label="קל" value={stats.easy || 0} />
            <Stat label="קשה" value={stats.hard || 0} />
            <Stat label="דילוג" value={skipped} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {wordsAvailable > 0 && (
              <button
                onClick={onContinue}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                המשך ללמוד
              </button>
            )}

            {wordsAvailable === 0 && (
              <div
                style={{
                  padding: '12px 12px',
                  background: '#f7f7f7',
                  borderRadius: 16,
                  color: '#555',
                  fontSize: 14,
                }}
              >
                אין עוד מילים לתרגול כרגע. חזור מחר 🙂
              </div>
            )}

            <button
              onClick={onBackToDashboard}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#f3f4f6',
                color: '#374151',
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              חזרה לדשבורד
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Stat = ({ label, value }) => (
    <div style={{ minWidth: 90 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
      <div style={{ color: '#666', fontSize: 13 }}>{label}</div>
    </div>
  );

  export default SessionComplete;
