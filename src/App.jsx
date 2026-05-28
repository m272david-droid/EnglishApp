import { useState, useEffect, useCallback, useRef } from 'react';
import Flashcard from './components/Flashcard';
import SessionComplete from './components/SessionComplete';
import { recordDailyResult, getTodaySummary, getRollingAccuracy, getStreak } from './utils/dailyStats';
import { initialVocabularyData } from './data/vocabulary';
import Dashboard from './components/Dashboard';
import { 
  handleEasyResponse, 
  handleHardResponse, 
  getSessionWords,
  isWordDue 
} from './utils/srs';
import {
  loadWordsFromStorage,
  saveWordsToStorage
} from './utils/storage';
import DailyGoalBanner from './components/DailyGoalBanner';
import WordsList from './components/WordsList';
import ExamMode from './components/ExamMode';
import './App.css';

const DAILY_GOAL = 10;

function App() {
  const [allWords, setAllWords] = useState([]);
  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState({ completed: 0, easy: 0, hard: 0 });
  const [sessionStartSize, setSessionStartSize] = useState(0); // Track initial session size for counter
  const [wordsProcessedInBatch, setWordsProcessedInBatch] = useState(0); // Track words processed in current batch
  const isProcessingRef = useRef(false); // Prevent race conditions
  const hasStartedFirstSessionRef = useRef(false); // Track if first session has been started
  const wordRetriesInSessionRef = useRef(new Map()); // Track how many times each word has been shown in current session
  const [showDashboard, setShowDashboard] = useState(true);
  const [showWordsList, setShowWordsList] = useState(false);
  const [showExamMode, setShowExamMode] = useState(false);
  const goalCelebrationShownRef = useRef(getTodaySummary(DAILY_GOAL).attempts >= DAILY_GOAL);
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const goalCompletedOnLastWordRef = useRef(false);
  const startSessionFromDashboard = () => {
    setShowDashboard(false);
    generateSession();
  };

  // Initialize words from storage or initial data
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      
      // Try to load from localStorage (returns sparse srsMap or null)
      const storedWords = loadWordsFromStorage();
      
      // storedSRS is a sparse map { [wordId]: srsFields } or null
      const mergedWords = initialVocabularyData.map(word => {
        const srs = storedWords?.[word.id];
        return srs ? { ...word, ...srs } : word;
      });

      setAllWords(mergedWords);
      if (!storedWords) saveWordsToStorage(mergedWords);
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Generate new session - only called manually or on first load
  const generateSession = useCallback(() => {
    if (allWords.length === 0) return;
  
    const sessionWords = getSessionWords(allWords, 10);
    if (sessionWords.length > 0) {
      setCurrentWord(sessionWords[0]);
      setSessionQueue(sessionWords.slice(1)); // <-- FIX
      setSessionStartSize(sessionWords.length);
      setWordsProcessedInBatch(0);
      setSessionStats({ completed: 0, easy: 0, hard: 0 });
      setIsSessionFinished(false);
      wordRetriesInSessionRef.current.clear();
    } else {
      setIsSessionFinished(true);
      setCurrentWord(null);
      setSessionQueue([]);
    }
  }, [allWords]);
  

  // Auto-start first session when words are loaded (runs ONCE on mount)
  useEffect(() => {
    // Only run if: loading is done, words are available, first session hasn't started, and we're not in a finished state
    if (!isLoading && allWords.length > 0 && !hasStartedFirstSessionRef.current && !isSessionFinished) {
      hasStartedFirstSessionRef.current = true;
      generateSession();
    }
  }, [isLoading, allWords.length, isSessionFinished, generateSession]);

  // Save words to storage whenever they change
  useEffect(() => {
    if (allWords.length > 0 && !isLoading) {
      saveWordsToStorage(allWords);
    }
  }, [allWords, isLoading]);

  // Update word in the allWords array
  const updateWord = useCallback((updatedWord) => {
    setAllWords(prevWords => {
      const newWords = prevWords.map(w => 
        w.id === updatedWord.id ? updatedWord : w
      );
      return newWords;
    });
  }, []);

  // Process next word from queue (atomic operation)
  const processNextWord = useCallback(() => {
    if (isProcessingRef.current) return; // Prevent concurrent processing
    
    setSessionQueue(prevQueue => {
      if (prevQueue.length === 0) {
        // Queue is empty - session complete
        setCurrentWord(null);
        setIsSessionFinished(true); // Mark session as finished - STOP here
        return [];
      }
      
      // Remove first word and set it as current
      const newQueue = [...prevQueue];
      const nextWord = newQueue.shift();
      // Update current word in the same render cycle
      setCurrentWord(nextWord);
      return newQueue;
    });
  }, []);

  // Handle "Easy" response
  const handleEasy = useCallback(() => {
    if (isProcessingRef.current || !currentWord) return;
    isProcessingRef.current = true;

    const updatedWord = handleEasyResponse(currentWord);
    
    // Remove needsReview flag
    if (updatedWord.needsReview) {
      updatedWord.needsReview = false;
    }

    // Update word in allWords
    updateWord(updatedWord);

    // Update stats and counter
    setSessionStats(prev => ({ ...prev, easy: prev.easy + 1, completed: prev.completed + 1 }));
    recordDailyResult({ wordId: currentWord.id, result: 'easy' });
    if (!goalCelebrationShownRef.current && getTodaySummary(DAILY_GOAL).attempts >= DAILY_GOAL) {
      goalCelebrationShownRef.current = true;
      if (sessionQueue.length === 0) {
        goalCompletedOnLastWordRef.current = true;
      } else {
        setShowGoalCelebration(true);
      }
    }
    setWordsProcessedInBatch(prev => prev + 1);

    // Move to next word (Easy words are NOT added back to queue)
    setTimeout(() => {
      isProcessingRef.current = false;
      processNextWord();
    }, 300);
  }, [currentWord, updateWord, processNextWord, sessionQueue]);

  // Handle "Hard" response
  const handleHard = useCallback(() => {
    if (isProcessingRef.current || !currentWord) return;
    isProcessingRef.current = true;
  
    const wordId = currentWord.id;
    const retryCount = wordRetriesInSessionRef.current.get(wordId) || 0;
  
    // Update retry count
    wordRetriesInSessionRef.current.set(wordId, retryCount + 1);
  
    const updatedWord = handleHardResponse(currentWord);
  
    // Update word in allWords
    updateWord(updatedWord);
  
    if (retryCount === 0) {
      // First time "Hard": move to end of queue, do NOT count as completed yet
      setSessionQueue(prevQueue => {
        const newQueue = [...prevQueue];
        newQueue.push(updatedWord);
        return newQueue;
      });
    } else {
      // Second time "Hard" (retry): now count as a completed hard result
      setSessionStats(prev => ({
        ...prev,
        hard: prev.hard + 1,
        completed: prev.completed + 1,
      }));
      recordDailyResult({ wordId: currentWord.id, result: 'hard' });
      if (!goalCelebrationShownRef.current && getTodaySummary(DAILY_GOAL).attempts >= DAILY_GOAL) {
        goalCelebrationShownRef.current = true;
        if (sessionQueue.length === 0) {
          goalCompletedOnLastWordRef.current = true;
        } else {
          setShowGoalCelebration(true);
        }
      }
      setWordsProcessedInBatch(prev => prev + 1);
    }

    // Move to next word
    setTimeout(() => {
      isProcessingRef.current = false;
      processNextWord();
    }, 300);
  }, [currentWord, updateWord, processNextWord, sessionQueue]);

  // Handle "Skip" response - defer to next session
  const handleSkip = useCallback(() => {
    if (isProcessingRef.current || !currentWord) return;
    isProcessingRef.current = true;

    // Skip: Remove from current queue, increment counter, defer to next session
    // No SRS update - word will appear in next session naturally
    setWordsProcessedInBatch(prev => prev + 1);
    setSessionStats(prev => ({ ...prev, completed: prev.completed + 1 }));
    recordDailyResult({ wordId: currentWord.id, result: 'skip' });
    if (!goalCelebrationShownRef.current && getTodaySummary(DAILY_GOAL).attempts >= DAILY_GOAL) {
      goalCelebrationShownRef.current = true;
      if (sessionQueue.length === 0) {
        goalCompletedOnLastWordRef.current = true;
      } else {
        setShowGoalCelebration(true);
      }
    }
    // Remove word from queue (it's already at the front, so processNextWord will remove it)
    setTimeout(() => {
      isProcessingRef.current = false;
      processNextWord();
    }, 300);
  }, [currentWord, processNextWord, sessionQueue]);


  // Start new session - only called from button click
  const startNewSession = useCallback(() => {
    goalCompletedOnLastWordRef.current = false;
    setIsSessionFinished(false);
    hasStartedFirstSessionRef.current = false;
    generateSession();
  }, [generateSession]);

  const goBackToDashboard = useCallback(() => {
    setIsSessionFinished(false);
    setShowDashboard(true);
  }, []);

  const goToWordsList = useCallback(() => setShowWordsList(true), []);
  const goBackFromWordsList = useCallback(() => setShowWordsList(false), []);

  const goToExamMode = useCallback(() => setShowExamMode(true), []);
  const goBackFromExamMode = useCallback(() => setShowExamMode(false), []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }
  const currentPosition = wordsProcessedInBatch + 1;
  const today = getTodaySummary(DAILY_GOAL);
  const rolling7 = getRollingAccuracy(7);
  const streak = getStreak();

  if (showExamMode) {
    return (
      <ExamMode
        words={allWords}
        onBack={goBackFromExamMode}
      />
    );
  }

  if (showWordsList) {
    return (
      <WordsList
        words={allWords}
        onBack={goBackFromWordsList}
      />
    );
  }

  if (showDashboard) {
    return (
      <Dashboard
        today={today}
        rolling7={rolling7}
        streak={streak}
        onStart={startSessionFromDashboard}
        onViewWords={goToWordsList}
        onStartExam={goToExamMode}
        words={allWords}
      />
    );
  }
 /* // Session complete screen - only show when explicitly finished
  if (isSessionFinished && !currentWord && sessionQueue.length === 0) {
    const totalInSession = sessionStats.completed;
    const wordsAvailable = getSessionWords(allWords, 10).length;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 px-4" dir="rtl">
        <div className="w-full max-w-md text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">סיימת את הסשן! 🎉</h2>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-primary">{totalInSession}</p>
                <p className="text-gray-600">מילים הושלמו</p>
              </div>
              <div className="flex justify-around border-t border-gray-200 pt-4">
                <div>
                  <p className="text-xl font-bold text-success">{sessionStats.easy}</p>
                  <p className="text-sm text-gray-600">קל</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-danger">{sessionStats.hard}</p>
                  <p className="text-sm text-gray-600">קשה</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            {wordsAvailable > 0 
              ? "מוכנים לסשן נוסף?"
              : "אין עוד מילים לתרגול כרגע. חזור מחר להמשיך ללמוד!"}
          </p>
          {wordsAvailable > 0 && (
            <button
              onClick={startNewSession}
              className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
            >
              התחל סשן חדש
            </button>
          )}
        </div>
      </div>
    );
  }*/

  // Safety check: If no current word and not finished, show loading or start button
  if (!currentWord && !isSessionFinished && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 px-4" dir="rtl">
        <div className="w-full max-w-md text-center">
          <p className="text-gray-600 mb-4">מכין את הסשן...</p>
          <button
            onClick={generateSession}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            התחל סשן
          </button>
        </div>
      </div>
    );
  }


  // Calculate progress - based on current session batch
  // currentIndex: position in current batch (1-based)
  // totalWords: total items in current batch (fixed at session start)



  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 px-4" dir="rtl">
      <div className="w-full max-w-md">
      {currentWord && (
        <Flashcard 
  word={currentWord} 
  currentIndex={currentPosition}
  totalWords={sessionStartSize}
  onEasy={handleEasy}
  onHard={handleHard}
  onSkip={handleSkip}
  today={today}
  rolling7={rolling7}
  streak={streak}
/>
)}

{showGoalCelebration && (
  <DailyGoalBanner
    goal={DAILY_GOAL}
    onContinue={() => setShowGoalCelebration(false)}
  />
)}

{isSessionFinished && !currentWord && sessionQueue.length === 0 && (
  <SessionComplete
    stats={sessionStats}
    total={sessionStartSize}
    wordsAvailable={getSessionWords(allWords, 10).length}
    goalCompleted={goalCompletedOnLastWordRef.current}
    onContinue={startNewSession}
    onClose={goBackToDashboard}
    onBackToDashboard={goBackToDashboard}
  />
)}
      <footer className="text-center text-sm text-gray-400 mt-8 mb-2">
        Built by David Millstein • 2026
      </footer>
      
      </div>
    </div>
  );
}

export default App;
