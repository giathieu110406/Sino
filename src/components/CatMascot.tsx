import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

let globalHmrTime = Date.now().toString();
if (typeof window !== 'undefined') {
  const hot = (import.meta as any).hot;
  if (hot) {
    hot.on('vite:beforeUpdate', () => {
      globalHmrTime = Date.now().toString();
      window.dispatchEvent(new CustomEvent('force-mascot-reload'));
    });
  }
}

interface MascotProps {
  sleepingImageUrl?: string;
  awakeImageUrl?: string;
}

const getMessagesForTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const time = hour + min / 60;

  if (time >= 5 && time <= 10) {
    return [
      "Cậu vừa ngủ dậy à, nhớ ăn sáng và uống nước đầy đủ nhé💗",
      "Sáng sớm học bài, chỉ có thể là người chăm chỉ nhất thế gian này",
      "Đừng quên ghé thăm tớ nữa nhé"
    ];
  } else if (time > 10 && time <= 14) {
    return [
      "Cậu đi học về có mệt không",
      "Cậu nhớ ăn uống và nghỉ ngơi đúng giờ nha",
      "Tới giờ nghỉ trưa rồi, buồn ngủ quá đi thôi 😴"
    ];
  } else if (time > 14 && time <= 20) {
    return [
      "Cậu đi học về rồi à, hôm nay cậu có mệt không",
      "Nếu rảnh thì hãy kể cho tớ nghe hôm nay của cậu thế nào nhé",
      "Nhớ uống nước thật nhiều, đừng để môi khô nhé"
    ];
  } else if (time > 20 || time <= 3) {
    return [
      "Cậu còn học à, chăm chỉ thế",
      "Nhớ là phải đi ngủ sớm đấy nhé, tớ lo đấy",
      "Cậu ngủ thật ngon nhé, khi nào rảnh thì nói chuyện với tớ nhé"
    ];
  } else {
    return [
      "OMG, cậu còn học giờ này à, bất ngờ thật",
      "Cô gái xinh đẹp này nhớ giữ gìn sức khoẻ nhé",
      "Yêu cậu"
    ];
  }
};

const LOVE_MESSAGES = [
  "Halo Halo, giờ mới nhớ tới tui hả",
  "Hôm nay người đẹp sẽ học bao nhiêu từ đây"
];

const WRONG_MESSAGES = [
  "Lêu lêu kkkk",
  "Kkkk, nhớ kiểm tra kỹ đã",
  "Cẩn thận hơn nha người đẹp"
];

const SUPERSTAR_MESSAGES = [
  "Đỉnh nhoa",
  "Wow",
  "Amazing gút chóp em"
];

const EAT_MESSAGES = [
  "Nhăm nhăm",
  "Ánh có đói khôm",
 ];

const GIFT_MESSAGES = [
  "Tớ có quà cho cậu nè! 🎁",
    "Bất ngờ chưa! ✨"
];

const getRandomMsg = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

interface InteractiveStep {
  state: MascotState;
  message: string;
}

const getInteractiveSequence = (): InteractiveStep[] => {
  const steps: InteractiveStep[] = [];
  const maxLen = Math.max(GIFT_MESSAGES.length, EAT_MESSAGES.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < GIFT_MESSAGES.length) {
      steps.push({ state: 'interact_gift', message: GIFT_MESSAGES[i] });
    }
    if (i < EAT_MESSAGES.length) {
      steps.push({ state: 'interact_eat', message: EAT_MESSAGES[i] });
    }
  }
  return steps;
};

type MascotState = 'default' | 'interact_gift' | 'interact_eat' | 'flashcard_default' | 'flashcard_correct' | 'flashcard_wrong';

export const CatMascot: React.FC<MascotProps> = () => {
  const [isHidden, setIsHidden] = useState(false);
  const [autoPopup, setAutoPopup] = useState(false);
  const [timeMessageIndex, setTimeMessageIndex] = useState(0);
  const [interactiveStepIndex, setInteractiveStepIndex] = useState(-1);
  const [mascotState, setMascotState] = useState<MascotState>('default');
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);
  const [hmrVersion, setHmrVersion] = useState(globalHmrTime);

  const isFlashcardTab = useRef(false);
  const revertTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleForceReload = () => setHmrVersion(globalHmrTime);
    window.addEventListener('force-mascot-reload', handleForceReload);
    return () => window.removeEventListener('force-mascot-reload', handleForceReload);
  }, []);
  const interactTimerRef = useRef<NodeJS.Timeout | null>(null);

  const timeMessages = getMessagesForTime();

  useEffect(() => {
    // Preload images
    const imagesToPreload = [
      `/default.gif?v=${hmrVersion}`,
      `/gift.gif?v=${hmrVersion}`,
      `/eat.gif?v=${hmrVersion}`,
      `/love.gif?v=${hmrVersion}`,
      `/wrong.gif?v=${hmrVersion}`,
      `/superstar.gif?v=${hmrVersion}`
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [hmrVersion]);

  // Return to default state with a new time-based reminder
  const returnToDefaultWithNewTimeMsg = () => {
    setInteractiveStepIndex(-1);
    setMascotState('default');
    setOverrideMessage(null);
    setTimeMessageIndex(prev => prev + 1);
    setAutoPopup(true);

    // Keep bubble open for 10s with new time message
    if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
    revertTimerRef.current = setTimeout(() => {
      setAutoPopup(false);
    }, 10000);
  };

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail === 'flashcards') {
        isFlashcardTab.current = true;
        setMascotState('flashcard_default');
        setOverrideMessage(getRandomMsg(LOVE_MESSAGES));
        setAutoPopup(true);
      } else {
        isFlashcardTab.current = false;
        returnToDefaultWithNewTimeMsg();
      }
    };
    
    const handleFlashcardResult = (e: any) => {
      if (e.detail.correct) {
        setMascotState('flashcard_correct');
        setOverrideMessage(getRandomMsg(SUPERSTAR_MESSAGES));
      } else {
        setMascotState('flashcard_wrong');
        setOverrideMessage(getRandomMsg(WRONG_MESSAGES));
      }
      setAutoPopup(true);
      
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
      revertTimerRef.current = setTimeout(() => {
        if (isFlashcardTab.current) {
          setMascotState('flashcard_default');
          setOverrideMessage(getRandomMsg(LOVE_MESSAGES));
        } else {
          returnToDefaultWithNewTimeMsg();
        }
      }, 10000);
    };

    window.addEventListener('tab-change', handleTabChange as EventListener);
    window.addEventListener('flashcard-result', handleFlashcardResult as EventListener);

    return () => {
      window.removeEventListener('tab-change', handleTabChange as EventListener);
      window.removeEventListener('flashcard-result', handleFlashcardResult as EventListener);
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
      if (interactTimerRef.current) clearTimeout(interactTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Show initial time-based reminder on start
    const initialTimer = setTimeout(() => {
      if (!isFlashcardTab.current) {
        setAutoPopup(true);
        if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
        revertTimerRef.current = setTimeout(() => setAutoPopup(false), 10000);
      }
    }, 1000);

    // Show periodic time-based reminder every 30 seconds
    const timer = setInterval(() => {
      if (!isFlashcardTab.current && mascotState === 'default') {
        setTimeMessageIndex(prev => prev + 1);
        setAutoPopup(true);

        if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
        revertTimerRef.current = setTimeout(() => {
          setAutoPopup(false);
        }, 10000);
      }
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [mascotState]);

  if (isHidden) return null;

  const handleInteract = () => {
    if (mascotState === 'flashcard_correct' || mascotState === 'flashcard_wrong') {
      if (interactTimerRef.current) clearTimeout(interactTimerRef.current);
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
      setMascotState('flashcard_default');
      setOverrideMessage(getRandomMsg(LOVE_MESSAGES));
      setAutoPopup(true);
      setInteractiveStepIndex(-1);
      return;
    }

    const sequence = getInteractiveSequence();
    const nextStep = interactiveStepIndex + 1;

    if (nextStep < sequence.length) {
      const item = sequence[nextStep];
      setMascotState(item.state);
      setOverrideMessage(item.message);
      setAutoPopup(true);
      setInteractiveStepIndex(nextStep);

      if (interactTimerRef.current) clearTimeout(interactTimerRef.current);
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);

      interactTimerRef.current = setTimeout(() => {
        if (isFlashcardTab.current) {
          setMascotState('flashcard_default');
          setOverrideMessage(getRandomMsg(LOVE_MESSAGES));
          setAutoPopup(true);
          setInteractiveStepIndex(-1);
        } else {
          returnToDefaultWithNewTimeMsg();
        }
      }, 10000);
    } else {
      // Reached the end of all interactive GIF steps -> return to default & switch to new time message
      if (isFlashcardTab.current) {
        setInteractiveStepIndex(-1);
        setMascotState('flashcard_default');
        setOverrideMessage(getRandomMsg(LOVE_MESSAGES));
        setAutoPopup(true);
      } else {
        returnToDefaultWithNewTimeMsg();
      }
    }
  };

  const handleMouseEnter = () => {
    if (mascotState === 'default' && !autoPopup) {
      setAutoPopup(true);
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
      revertTimerRef.current = setTimeout(() => {
        setAutoPopup(false);
      }, 10000);
    }
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHidden(true);
  };

  const currentMessage = overrideMessage || timeMessages[timeMessageIndex % timeMessages.length];

  const getCurrentImage = () => {
    switch (mascotState) {
      case 'interact_gift':
        return `/gift.gif?v=${hmrVersion}`;
      case 'interact_eat':
        return `/eat.gif?v=${hmrVersion}`;
      case 'flashcard_default':
        return `/love.gif?v=${hmrVersion}`;
      case 'flashcard_correct':
        return `/superstar.gif?v=${hmrVersion}`;
      case 'flashcard_wrong':
        return `/wrong.gif?v=${hmrVersion}`;
      case 'default':
      default:
        return `/default.gif?v=${hmrVersion}`;
    }
  };

  const showSpeechBubble = Boolean(overrideMessage) || autoPopup;

  return (
    <div 
      id="catMascotContainer"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none"
    >
      <AnimatePresence>
        {showSpeechBubble && (
          <motion.div 
            id="catMascotSpeechBubble"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="flex flex-col gap-2 mb-2 bg-[var(--bg-card)] p-3.5 rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--border-color)] backdrop-blur-md relative z-30 max-w-[230px] pointer-events-auto"
          >
            <button 
              id="catMascotHideBtn"
              onClick={handleHide}
              className="absolute -top-2 -right-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full p-1 shadow-sm transition-colors z-10"
              title="Ẩn linh vật"
            >
              <X size={12} />
            </button>
            <p id="catMascotMessageText" className="text-sm text-[var(--text-primary)] font-medium text-center leading-relaxed">
              {currentMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        id="catMascotImageWrapper"
        className="relative z-10 pointer-events-auto cursor-pointer flex items-end justify-center"
        onClick={handleInteract}
        onMouseEnter={handleMouseEnter}
        initial="default"
        animate={mascotState}
        variants={{
          default: {
            opacity: 1,
            scale: 0.95,
            y: 5,
            rotate: 0,
            transition: { duration: 0.5, ease: "easeInOut" }
          },
          interact_gift: {
            opacity: 1,
            scaleY: [1, 1.1, 0.95, 1],
            scaleX: [1, 0.9, 1.05, 1],
            y: [0, -10, 2, 0],
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.8, ease: "easeInOut" }
          },
          interact_eat: {
            opacity: 1,
            scale: 1.05,
            y: -5,
            rotate: [0, -2, 2, 0],
            transition: { duration: 0.5, ease: "easeInOut" }
          },
          flashcard_default: {
            opacity: 1,
            scale: 1.02,
            y: 0,
            rotate: 0,
            transition: { duration: 0.5, ease: "easeInOut" }
          },
          flashcard_correct: {
            opacity: 1,
            scale: 1.1,
            y: -15,
            rotate: [0, -10, 10, -5, 5, 0],
            transition: { duration: 0.8, ease: "easeInOut" }
          },
          flashcard_wrong: {
            opacity: 1,
            scale: 0.9,
            y: 10,
            rotate: [0, -5, 5, -2, 2, 0],
            transition: { duration: 0.6, ease: "easeInOut" }
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div id="catMascotFrame" className="relative w-36 h-36 flex items-center justify-center">
          <img 
            id="catMascotImg"
            key={getCurrentImage()}
            src={getCurrentImage()}
            alt="Mascot" 
            className="w-36 h-36 object-contain drop-shadow-lg rounded-2xl"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('default.gif')) {
                target.src = `/default.gif?v=${hmrVersion}`;
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};


