export default function DailyGoalBanner({ goal, onContinue }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#18172B' }}>
          כל הכבוד!
        </h2>
        <p className="mb-1" style={{ color: '#9A98B0' }}>השלמת את יעד היום</p>
        <p className="text-4xl font-extrabold mb-6" style={{ color: '#3B4DA8' }}>
          {goal} מילים
        </p>
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl font-bold text-white transition-colors"
          style={{ background: '#3B4DA8' }}
        >
          המשך ללמוד
        </button>
      </div>
    </div>
  );
}
