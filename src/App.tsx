import React, { useState, useEffect, useRef } from 'react';
import { Menu, MessageSquare, XCircle, 
  Search, Languages, Book, BookOpen, Layers, HelpCircle, Moon, Sun, 
  ArrowRightLeft, RefreshCw, Volume2, Trash2, Copy, Plus, AlertCircle, 
  CheckCircle, ArrowLeft, ArrowRight, Shuffle, Star, Eye, Pencil, 
  ClipboardList, PenTool, Check, RotateCcw, Lightbulb, Save, List, X, 
  Play, CheckSquare, PlusCircle, Printer, Download, Loader2, UploadCloud, FileText,
  Globe, Sparkles, CornerDownLeft, CheckCircle2, FolderPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Example, Flashcard, DictItem, TranslationRule, QuizQuestion, FillinItem, WordSuggestion, Collocation } from './types';
import { MASTER_DICT, INITIAL_VOCABULARY, MOCK_TRANSLATION_RULES, normalizePinyin } from './data';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';

declare global {
  interface Window {
    HanziWriter: any;
  }
}

import { DictionaryAdmin } from './components/DictionaryAdmin';
import { CatMascot } from './components/CatMascot';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function convertToPinyin(sentence: string): string {
  const clean = sentence.trim().replace(/[。，！？、.,!?]/g, '').trim();
  const exactSentences: Record<string, string> = {
    "我们每天都学习汉语": "Wǒmen měitiān dōu xuéxí Hànyǔ",
    "学习是非常有意思的": "Xuéxí shì fēicháng yǒuyìsi de",
    "认识你很高兴": "Rènshi nǐ hěn gāoxìng",
    "今天大家很高兴": "Jīntiān dàjiā hěn gāoxìng",
    "这件衣服很漂亮": "Zhè jiàn yīfu hěn piàoliang",
    "她的汉语说得很漂亮": "Tā de Hànyǔ shuō de hěn piàoliang",
    "他是我的好朋友": "Tā shì wǒ de hǎo péngyou",
    "我们是十年的老朋友了": "Wǒmen shì shí nián de lǎo péngyou le",
    "你吃饭了吗": "Nǐ chīfàn le ma",
    "我们去饭馆吃饭吧": "Wǒmen qù fànguǎn chīfàn ba",
    "谢谢你的帮助": "Xièxie nǐ de bāngzhù",
    "老师再见": "Lǎoshī zàijiàn",
    "我爱你": "Wǒ ài nǐ",
    "妈妈爱孩子": "Māma ài háizi",
    "我有八本书": "Wǒ yǒu bā běn shū",
    "我爸爸是老师": "Wǒ bàba shì lǎoshī",
    "这个杯子很好看": "Zhège bēizi hěn hǎokàn",
    "我想去北京旅游": "Wǒ xiǎng qù Běijīng lǚyóu",
    "这本书很有意思": "Zhè běn shū hěn yǒuyìsi",
    "我不去": "Wǒ bù qù",
    "谢谢！——不客气！": "Xièxie! —— Bù kèqi!",
    "谢谢——不客气": "Xièxie —— Bù kèqi",
    "这道菜很好吃": "Zhè dào cài hěn hǎochī",
    "请喝茶": "Qǐng hē chá",
    "你想吃什么": "Nǐ xiǎng chī shénme",
    "我们一起去吃饭": "Wǒmen yīqǐ qù chīfàn",
    "我打出租车去机场": "Wǒ dǎ chūzūchē qù jīchǎng",
    "我给妈妈打电话": "Wǒ gěi māma dǎ diànhuà",
    "这个城市很大": "Zhège chéngshì hěn dà",
    "我的书在桌子上": "Wǒ de shū zài zhuōzi shàng",
    "现在三点": "Xiànzài sān diǎn",
    "我用电脑工作": "Wǒ yòng diànnǎo gōngzuò",
    "他在看电视": "Tā zài kàn diànshì",
    "我喜欢看电影": "Wǒ xǐhuan kàn diànyǐng",
    "这个东西是什么": "Zhège dōngxi shì shénme",
    "我们都是 student": "Wǒmen dōu shì xuéshēng",
    "我们都是学生": "Wǒmen dōu shì xuéshēng",
    "请读这个字": "Qǐng dú zhège zì",
    "我对不起你": "Wǒ duìbuqǐ nǐ",
    "我想喝多点 water": "Wǒ xiǎng hē duō diǎn shuǐ",
    "我想喝多点水": "Wǒ xiǎng hē duō diǎn shuǐ",
    "大中饭馆在学校后面": "Dàzhōng fànguǎn zài xuéxiào hòumiàn",
    "这个商店有很多东西": "Zhège shāngdiàn yǒu hěn duō dōngxi",
    "他是我们医院 of the doctor": "Tā shì wǒmen yīyuàn de yīshēng",
    "他是我们医院的医生": "Tā shì wǒmen yīyuàn de yīshēng",
    "明天我要去火车站": "Míngtiān wǒ yào qù huǒchēzhàn",
    "我坐飞机去北京": "Wǒ zuò fēijī qù Běijīng",
    "这是一分钟的事情": "Zhè shì yī fēnzhōng de shìqíng",
    "今天星期号": "Jīntiān xīngqī hào",
    "这时候他在睡觉": "Zhè shíhou tā zài shuìjiào"
  };

  if (exactSentences[clean]) {
    return exactSentences[clean] + (sentence.endsWith('。') || sentence.endsWith('.') ? '.' : sentence.slice(-1).match(/[！？、!?]/) ? sentence.slice(-1) : '');
  }

  const charsMap: Record<string, string> = {
    '我': 'wǒ', '你': 'nǐ', '他': 'tā', '她': 'tā', '它': 'tā', '们': 'men',
    '是': 'shì', '有': 'yǒu', '在': 'zài', '去': 'qù', '来': 'lái', '吃': 'chī',
    '喝': 'hē', '看': 'kàn', '听': 'tīng', '说': 'shuō', '写': 'xiě', '读': 'dú',
    '的': 'de', '了': 'le', '吗': 'ma', '呢': 'ne', '吧': 'ba', '不': 'bù',
    '很': 'hěn', '太': 'tài', '都': 'dōu', '也': 'yě', '和': 'hé', '没': 'méi',
    '好': 'hǎo', '大': 'dà', '小': 'xiǎo', '多': 'duō', '少': 'shǎo', '冷': 'lěng',
    '热': 'rè', '家': 'jiā', '国': 'guó', '中': 'zhōng', '汉': 'hàn', '语': 'yǔ',
    '书': 'shū', '水': 'shuǐ', '茶': 'chá', '猫': 'māo', '狗': 'gǒu', '岁': 'suì',
    '钱': 'qián', '人': 'rén', '子': 'zi', '儿': 'ér', '师': 'shī', '生': 'shēng',
    '学': 'xué', '校': 'xiào', '医': 'yī', '院': 'yuàn', '商': 'shāng', '店': 'diàn',
    '火': 'huǒ', '车': 'chē', '站': 'zhàn', '飞': 'fēi', '机': 'jī', '出': 'chū',
    '租': 'zū', '桌': 'zhuō', '椅': 'yǐ', '电': 'diàn', '脑': 'nǎo', '视': 'shì',
    '影': 'yǐng', '东': 'dōng', '西': 'xī', '天': 'tiān', '气': 'qì', '今': 'jīn',
    '明': 'míng', '昨': 'zuó', '年': 'nián', '月': 'yuè', '号': 'hào', '点': 'diǎn',
    '分': 'fēn', '秒': 'miǎo', '字': 'zì', '名': 'míng', '朋': 'péng', '友': 'you',
    '漂': 'piào', '亮': 'liang', '高': 'gāo', '兴': 'xìng', '谢': 'xiè', '再': 'zài',
    '见': 'jiàn', '客': 'kè', '每': 'měi', '非': 'fēi', '常': 'cháng',
    '认': 'rèn', '识': 'shi', '这': 'zhè', '件': 'jiàn', '衣': 'yī', '服': 'fu',
    '一': 'yī', '二': 'èr', '三': 'sān', '四': 'sì', '五': 'wǔ', '六': 'liù',
    '七': 'qī', '八': 'bā', '九': 'jiǔ', '十': 'shí', '百': 'bǎi', '千': 'qiān',
    '爸': 'bà', '妈': 'mā', '欢': 'huān', '喜': 'xǐ', '想': 'xiǎng', '能': 'néng',
    '会': 'huì', '叫': 'jiào', '睡': 'shuì', '觉': 'jiào', '起': 'qǐ', '床': 'chuáng',
    '工': 'gōng', '作': 'zuò', '雨': 'yǔ', '下': 'xià', '杯': 'bēi', '米': 'mǐ',
    '饭': 'fàn', '苹': 'píng', '果': 'guǒ', '谁': 'shéi', '什': 'shén', '么': 'me',
    '零': 'líng', '对': 'duì', '错': 'cuò', '忙': 'máng', '累': 'lèi', '远': 'yuǎn',
    '近': 'jìn', '新': 'xīn', '旧': 'jiù', '馆': 'guǎn', '助': 'zhù', '帮': 'bāng',
    '您': 'nín', '请': 'qǐng', '打': 'dǎ', '话': 'huà', '城': 'chéng', '市': 'shì',
    '场': 'chǎng', '给': 'gěi', '些': 'xiē', '怎': 'zěn', '样': 'yàng', '回': 'huí',
    '开': 'kāi'
  };

  const wordsList: string[] = [];
  let currentWord = "";
  
  for (let i = 0; i < sentence.length; i++) {
    const char = sentence[i];
    if (char.match(/[\s。，！？、.,!?：:;；——]/)) {
      if (currentWord) {
        wordsList.push(currentWord);
        currentWord = "";
      }
      wordsList.push(char);
    } else {
      const pinyinChar = charsMap[char];
      if (pinyinChar) {
        if (currentWord) {
          wordsList.push(currentWord);
          currentWord = "";
        }
        wordsList.push(pinyinChar);
      } else {
        currentWord += char;
      }
    }
  }
  if (currentWord) {
    wordsList.push(currentWord);
  }

  let result = "";
  for (let i = 0; i < wordsList.length; i++) {
    const item = wordsList[i];
    const isPunct = item.match(/[\s。，！？、.,!?：:;；——]/);
    if (isPunct) {
      if (item === '。') result += '. ';
      else if (item === '，') result += ', ';
      else if (item === '！') result += '! ';
      else if (item === '？') result += '? ';
      else if (item === '、') result += ', ';
      else if (item === '：') result += ': ';
      else result += item;
    } else {
      if (result && !result.endsWith(' ') && !result.endsWith('—') && !result.endsWith('-')) {
        result += ' ';
      }
      result += item;
    }
  }

  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result.replace(/\s+/g, ' ').trim();
}

export default function App() {
  // Authentication & Member Tracking States
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("user");
  const [newMemberStatus, setNewMemberStatus] = useState("approved");

  // Personal Settings States
  const [settingsDisplayName, setSettingsDisplayName] = useState('');
  const [settingsPhoneNumber, setSettingsPhoneNumber] = useState('');
  const [settingsBirthDate, setSettingsBirthDate] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("sinolearn_theme");
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  // App routing
  const [tab, setTab] = useState<'dictionary' | 'flashcards' | 'settings' | 'admin'>('dictionary');
  
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { detail: tab }));
  }, [tab]);

  // Dictionary state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [dictResult, setDictResult] = useState<DictItem | null>(null);
  const [dictSearchLoading, setDictSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const suggestTimeoutRef = useRef<any>(null);

  // Translation state
  const [translateDirection, setTranslateDirection] = useState<'zh-vi' | 'vi-zh' | 'en-vi' | 'vi-en'>(() => {
    const saved = localStorage.getItem('appLangPair');
    return saved === 'EN-VI' ? 'en-vi' : 'zh-vi';
  });
  const [appLangPair, setAppLangPair] = useState<'ZH-VI' | 'EN-VI'>(() => {
    const saved = localStorage.getItem('appLangPair');
    return (saved === 'ZH-VI' || saved === 'EN-VI') ? saved : 'ZH-VI';
  });
  const [transSource, setTransSource] = useState('');
  const [aiTranslationResult, setAiTranslationResult] = useState<{ translatedText: string; pinyin: string; analysis: string } | null>(null);
  const [aiTranslationLoading, setAiTranslationLoading] = useState(false);

  // Flashcards state
  const [vocabulary, setVocabulary] = useState<Flashcard[]>([]);

  const [decks, setDecks] = useState<string[]>([]);

  const [currentDeck, setCurrentDeck] = useState<string>('');
  const [showDeckDashboard, setShowDeckDashboard] = useState(true);
  const [flashcardFilter, setFlashcardFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [lmMode, setLmMode] = useState<'flip' | 'study' | 'fillin' | 'quiz' | 'write' | 'print'>('flip');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [toast, setToast] = useState('');

  // Custom modals/dialogs state

  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [newDeckNameInput, setNewDeckNameInput] = useState('');
  const [showAiAddWordsModal, setShowAiAddWordsModal] = useState(false);
  const [aiAddWordsTopic, setAiAddWordsTopic] = useState('');
  const [showModalNewDeckInput, setShowModalNewDeckInput] = useState(false);
  const [modalNewDeckName, setModalNewDeckName] = useState('');
  const [aiAddWordsCount, setAiAddWordsCount] = useState('5');
  const [aiAddWordsTab, setAiAddWordsTab] = useState<'topic' | 'file'>('topic');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [modalTargetDeck, setModalTargetDeck] = useState<string>('');
  const [grammarFormat, setGrammarFormat] = useState<'mixed' | 'scramble' | 'fill_in' | 'compose'>('mixed');
  const [grammarQuestions, setGrammarQuestions] = useState<any[]>([]);
  const [grammarCache, setGrammarCache] = useState<Record<string, any>>({});
  const [grammarAnswers, setGrammarAnswers] = useState<Record<number, any>>({});
  const [grammarFeedbacks, setGrammarFeedbacks] = useState<Record<number, any>>({});
  const [grammarChecking, setGrammarChecking] = useState<Record<number, boolean>>({});
  const [grammarGraded, setGrammarGraded] = useState(false);
  const [grammarLoading, setGrammarLoading] = useState(false);

  // Prevent infinite loop using a ref to track current deck
  const lastDeckRef = useRef<string | null>(null);
  const isInitialCacheLoad = useRef(true);

  useEffect(() => {
    const isNewDeck = lastDeckRef.current !== currentDeck;
    const isFirstLoadWithCache = isInitialCacheLoad.current && Object.keys(grammarCache).length > 0;
    
    if (isNewDeck || isFirstLoadWithCache) {
      lastDeckRef.current = currentDeck;
      if (isFirstLoadWithCache) isInitialCacheLoad.current = false;
      
      if (grammarCache[currentDeck]) {
        setGrammarQuestions(grammarCache[currentDeck].questions || []);
        setGrammarAnswers(grammarCache[currentDeck].answers || {});
        setGrammarFeedbacks(grammarCache[currentDeck].feedbacks || {});
        setGrammarChecking(grammarCache[currentDeck].checking || {});
        setGrammarGraded(grammarCache[currentDeck].graded || false);
      } else if (isNewDeck) {
        setGrammarQuestions([]);
        setGrammarAnswers({});
        setGrammarFeedbacks({});
        setGrammarChecking({});
        setGrammarGraded(false);
      }
    }
  }, [currentDeck, grammarCache]);

  useEffect(() => {
    if (grammarQuestions.length > 0 && lastDeckRef.current === currentDeck) {
      setGrammarCache(prev => ({
        ...prev,
        [currentDeck]: {
          questions: grammarQuestions,
          answers: grammarAnswers,
          feedbacks: grammarFeedbacks,
          checking: grammarChecking,
          graded: grammarGraded
        }
      }));
    }
  }, [grammarQuestions, grammarAnswers, grammarFeedbacks, grammarChecking, grammarGraded, currentDeck]);
const [isGeneratingAiWords, setIsGeneratingAiWords] = useState(false);
  const [customAlertMsg, setCustomAlertMsg] = useState<string | null>(null);

  // Add to flashcards modal states
  const [wordToAdd, setWordToAdd] = useState<DictItem | null>(null);
  const [selectedDecksForWord, setSelectedDecksForWord] = useState<string[]>([]);
  const [newDeckInputInAddModal, setNewDeckInputInAddModal] = useState<string>('');

  // Flashcards search & lookup state
  const [fcSearchQuery, setFcSearchQuery] = useState('');
  const [fcSuggestions, setFcSuggestions] = useState<WordSuggestion[]>([]);
  const [fcIsSuggesting, setFcIsSuggesting] = useState(false);
  const [fcShowSuggestionsDropdown, setFcShowSuggestionsDropdown] = useState(false);
  const [fcSelectedSuggestionIndex, setFcSelectedSuggestionIndex] = useState(-1);
  const [fcDictResult, setFcDictResult] = useState<DictItem | null>(null);
  const [fcDictSearchLoading, setFcDictSearchLoading] = useState(false);
  const fcSearchContainerRef = useRef<HTMLDivElement>(null);
  const fcSuggestAbortRef = useRef<AbortController | null>(null);
  const fcSuggestTimeoutRef = useRef<any>(null);

  // Add card form state
  const [flashcardLookupQuery, setFlashcardLookupQuery] = useState('');
  const [formWord, setFormWord] = useState('');
  const [formPinyin, setFormPinyin] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formType, setFormType] = useState('');
  const [formExCn, setFormExCn] = useState('');
  const [formExVn, setFormExVn] = useState('');
  const [formExPinyin, setFormExPinyin] = useState('');
  const [formDeck, setFormDeck] = useState('');
  const [isFormAutoFilling, setIsFormAutoFilling] = useState(false);

  // Flashcard front side display mode: 'target' (ZH or EN) or 'vi' (Tiếng Việt)
  const [fcFrontSideMode, setFcFrontSideMode] = useState<'target' | 'vi'>(() => {
    return (localStorage.getItem('sinolearn_fc_front_side') as 'target' | 'vi') || 'target';
  });

  const handleToggleFcFrontSide = (mode: 'target' | 'vi') => {
    setFcFrontSideMode(mode);
    localStorage.setItem('sinolearn_fc_front_side', mode);
  };

  // Study Mode state
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyCorrect, setStudyCorrect] = useState(0);
  const [studyAnswer, setStudyAnswer] = useState('');
  const [studyChecked, setStudyChecked] = useState(false);
  const [studyFeedback, setStudyFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [studyShowHint, setStudyShowHint] = useState(false);

  // Fill in the Blank state
  const [fillinQueue, setFillinQueue] = useState<FillinItem[]>([]);
  const [fillinIndex, setFillinIndex] = useState(0);
  const [fillinRight, setFillinRight] = useState(0);
  const [fillinWrong, setFillinWrong] = useState(0);
  const [fillinAnswer, setFillinAnswer] = useState('');
  const [fillinChecked, setFillinChecked] = useState(false);
  const [fillinFeedback, setFillinFeedback] = useState<{ correct: boolean; text: string } | null>(null);

  // Quiz state
  const [quizFormat, setQuizFormat] = useState<'mixed' | 'write' | 'mc'>('mixed');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const [quizGraded, setQuizGraded] = useState(false);

  // Writing Mode state
  const [hwWordIndex, setHwWordIndex] = useState(0);
  const [hwCharIndex, setHwCharIndex] = useState(0);
  const [hwMistakes, setHwMistakes] = useState(0);
  const [hwCorrectStrokes, setHwCorrectStrokes] = useState(0);
  const [hwTotalStrokes, setHwTotalStrokes] = useState(0);
  const [hwCurrentStrokeNum, setHwCurrentStrokeNum] = useState(0);
  const [hwAccuracy, setHwAccuracy] = useState('—');
  const [hwFeedback, setHwFeedback] = useState<{ text: string; type: 'info' | 'success' | 'error' | 'complete' | 'warn' } | null>(null);

  // PDF Print Mode state
  const [printRowsPerChar, setPrintRowsPerChar] = useState<number>(2);
  const [printCellSize, setPrintCellSize] = useState<number>(14);
  const [printShowFaded, setPrintShowFaded] = useState<boolean>(true);
  const [printFontType, setPrintFontType] = useState<'handwriting' | 'print'>('handwriting');
  const [printCreator, setPrintCreator] = useState<string>('Thieu Gia');
  const [printTitle, setPrintTitle] = useState<string>('Tiếng trung');
  const [selectedPrintWords, setSelectedPrintWords] = useState<string[]>([]);

  // Automatically select words of current deck on print mode activation
  useEffect(() => {
    if (lmMode === 'print') {
      const pool = getVocabForCurrentDeck();
      setSelectedPrintWords(pool.map(v => v.word));
    }
  }, [lmMode, currentDeck]);

  const demoRef = useRef<HTMLDivElement>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  const demoWriterRef = useRef<any>(null);
  const quizWriterRef = useRef<any>(null);

  // Synchronize Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sinolearn_theme", theme);
  }, [theme]);

  // Helper function to remove undefined values from objects/arrays for Firestore
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeForFirestore);
    }
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== undefined) {
          sanitized[key] = sanitizeForFirestore(val);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Synchronize vocabulary to Firestore
  useEffect(() => {
    if (user && isDataLoaded) {
      const saveVocab = async () => {
        try {
          const cleanVocabulary = sanitizeForFirestore(vocabulary);
          await updateDoc(doc(db, "users", user.uid), { vocabulary: cleanVocabulary });
        } catch (err) {
          console.error("Lỗi lưu từ vựng:", err);
        }
      };
      saveVocab();
    }
  }, [vocabulary, user, isDataLoaded]);

  // Synchronize decks to Firestore
  useEffect(() => {
    if (user && isDataLoaded) {
      const saveDecks = async () => {
        try {
          const cleanDecks = sanitizeForFirestore(decks);
          await updateDoc(doc(db, "users", user.uid), { decks: cleanDecks });
        } catch (err) {
          console.error("Lỗi lưu bộ thẻ:", err);
        }
      };
      saveDecks();
    }
  }, [decks, user, isDataLoaded]);
  // Synchronize grammarCache to Firestore
  useEffect(() => {
    if (user && isDataLoaded) {
      const saveCache = async () => {
        try {
          const cleanCache = sanitizeForFirestore(grammarCache);
          await updateDoc(doc(db, "users", user.uid), { grammarCache: cleanCache });
        } catch (err) {
          console.error("Lỗi lưu cache ngữ pháp:", err);
        }
      };
      saveCache();
    }
  }, [grammarCache, user, isDataLoaded]);


  // Google Auth Listener and profile syncing
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Sync or Create user profile in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const profile = docSnap.data();
            if (firebaseUser.email?.toLowerCase() === 'giathieu110406@gmail.com') {
              if (profile.role !== 'admin') {
                profile.role = 'admin';
                // Also update in Firestore to ensure security rules pass
                updateDoc(userRef, { role: 'admin' }).catch(console.error);
              }
            }
            setUserProfile(profile);
            
            // Load custom flashcards and decks
            if (profile.vocabulary) {
              setVocabulary(profile.vocabulary);
            } else {
              setVocabulary(INITIAL_VOCABULARY);
            }
            if (profile.decks) {
              setDecks(profile.decks);
            } else {
              setDecks(['HSK1']);
            }
            if (profile.grammarCache) {
              setGrammarCache(profile.grammarCache);
            }
            setIsDataLoaded(true);

            // Pre-fill settings form
            setSettingsDisplayName(profile.displayName || firebaseUser.displayName || '');
            setSettingsPhoneNumber(profile.phoneNumber || '');
            setSettingsBirthDate(profile.birthDate || '');
          } else {
            // New profile creation
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: firebaseUser.email?.toLowerCase() === 'giathieu110406@gmail.com' ? 'admin' : 'user',
              status: 'approved',
              queryCount: 0,
              translationCount: 0,
              createdAt: new Date().toISOString(),
              vocabulary: INITIAL_VOCABULARY,
              decks: ['HSK1']
            };
            await setDoc(userRef, newProfile);
            setVocabulary(INITIAL_VOCABULARY);
            setDecks(['HSK1']);
            setIsDataLoaded(true);
            setUserProfile(newProfile);
            setSettingsDisplayName(newProfile.displayName);
          }
        } catch (err) {
          console.error("Lỗi đồng bộ hồ sơ người dùng:", err);
          alert("Lỗi kết nối CSDL (Firestore). Vui lòng đảm bảo bạn đã tạo Firestore Database trong Firebase Console.");
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setVocabulary([]);
        setDecks([]);
        setIsDataLoaded(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch members list for Admin tab
  const fetchMembers = async () => {
    if (!user || userProfile?.role !== 'admin') return;
    if (!db) {
      console.warn("Firestore is not initialized. Using mock members list.");
      setMembers([
        {
          uid: "mock-admin",
          email: "giathieu110406@gmail.com",
          displayName: "Thieu Gia (Mock)",
          role: "admin",
          status: "approved",
          queryCount: 42,
          translationCount: 15
        },
        {
          uid: "mock-user-1",
          email: "hocvien1@sinolearn.edu.vn",
          displayName: "Nguyễn Văn Học",
          role: "user",
          status: "approved",
          queryCount: 8,
          translationCount: 2
        },
        {
          uid: "mock-user-2",
          email: "hocvien2@sinolearn.edu.vn",
          displayName: "Trần Thị Chăm Chỉ",
          role: "user",
          status: "approved",
          queryCount: 25,
          translationCount: 8
        }
      ]);
      return;
    }
    try {
      const q = collection(db, "users");
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() });
      });
      setMembers(list);
    } catch (err) {
      console.error("Lỗi tải danh sách thành viên:", err);
    }
  };

  useEffect(() => {
    if (tab === 'admin') {
      fetchMembers();
    }
  }, [tab, userProfile]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
      handleToast("Đăng nhập bằng Google thành công! 🎉");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-blocked") {
        setAuthError("Trình duyệt đã chặn popup. Vui lòng bật quyền popup.");
      } else {
        setAuthError(err.message || "Đăng nhập thất bại.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTab('dictionary');
      handleToast("Đã đăng xuất tài khoản!");
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingSettings(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updated = {
        displayName: settingsDisplayName.trim(),
        phoneNumber: settingsPhoneNumber.trim(),
        birthDate: settingsBirthDate,
      };
      await updateDoc(userRef, updated);
      setUserProfile((prev: any) => ({ ...prev, ...updated }));
      handleToast("Cập nhật thông tin thành công! ✨");
    } catch (err: any) {
      console.error(err);
      handleToast("Lỗi cập nhật: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fakeUid = "email-" + Math.random().toString(36).substring(2, 15);
      const docRef = doc(db, "users", fakeUid);
      const newProfile = {
        uid: fakeUid,
        email: newMemberEmail.trim(),
        displayName: newMemberName.trim(),
        role: newMemberRole,
        status: newMemberStatus,
        queryCount: 0,
        translationCount: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, newProfile);
      handleToast("Thêm thành viên thành công! 📂");
      setShowAddMemberModal(false);
      setNewMemberEmail("");
      setNewMemberName("");
      setNewMemberRole("user");
      setNewMemberStatus("approved");
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      handleToast("Lỗi khi thêm thành viên: " + err.message);
    }
  };

  const handleSaveEditedMember = async () => {
    if (!editingUser) return;
    try {
      const docRef = doc(db, "users", editingUser.uid);
      await updateDoc(docRef, {
        displayName: editingUser.displayName || "",
        status: editingUser.status,
        role: editingUser.role,
        queryCount: Number(editingUser.queryCount) || 0,
        translationCount: Number(editingUser.translationCount) || 0,
      });
      handleToast("Cập nhật thành công!");
      setShowEditMemberModal(false);
      setEditingUser(null);
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      handleToast("Lỗi cập nhật: " + err.message);
    }
  };

  const incrementUserStat = async (field: 'queryCount' | 'translationCount') => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const currentVal = userProfile?.[field] || 0;
      await updateDoc(userRef, {
        [field]: currentVal + 1
      });
      setUserProfile((prev: any) => ({
        ...prev,
        [field]: currentVal + 1
      }));
    } catch (e) {
      console.warn("Lỗi cập nhật thống kê người dùng:", e);
    }
  };

  const handleToast = (msg: string) => {
    setToast(msg);
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  };

  
  const handleDownloadPdf = async () => {
    try {
      if (window.self !== window.top) {
        setCustomAlertMsg("Tính năng tải PDF có thể bị chặn trong chế độ xem trước. Nếu không tải được, vui lòng mở ứng dụng trong tab mới (nút góc trên cùng bên phải).");
      }
      
      const element = document.getElementById('print-a4-page');
      if (!element) return;
      
      // Temporarily remove overflow to ensure full capture
      const wrapper = document.querySelector('.print-preview-area') as HTMLElement | null;
      const originalOverflow = wrapper ? wrapper.style.overflowX : '';
      if (wrapper) wrapper.style.overflowX = 'visible';
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      if (wrapper) wrapper.style.overflowX = originalOverflow;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('LuyenViet.pdf');
      handleToast("Đã tải PDF thành công!");
    } catch (e: any) {
      setCustomAlertMsg("Lỗi khi tạo PDF: " + e.message);
    }
  };

  const handlePrint = () => {
    try {
      if (window.self !== window.top) {
        setCustomAlertMsg("Tính năng in PDF bị chặn trong chế độ xem trước (iframe). Vui lòng mở ứng dụng trong tab mới (nút góc trên cùng bên phải) để sử dụng tính năng này.");
        return;
      }
      window.print();
    } catch (e: any) {
      setCustomAlertMsg("Không thể mở cửa sổ in: " + e.message);
    }
  };


  // Pronounce audio helper
  const speakChinese = (text: string, lang: 'zh-CN' | 'vi-VN' | 'en-US' = 'zh-CN') => {
    if (!text) return;
    
    // 1. Try Google Translate TTS API (highly reliable inside sandboxed iframe)
    try {
      let tl = lang === 'vi-VN' ? 'vi' : 'zh-CN';
      if (lang === 'en-US') tl = 'en';
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      
      audio.volume = 1.0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`Audio played successfully via Google TTS (${lang})`);
        }).catch(err => {
          console.warn("Google TTS blocked or failed, trying Web Speech API...", err);
          fallbackToWebSpeech(text, lang);
        });
      }
    } catch (e) {
      console.warn("Failed to init Audio, falling back to Web Speech...", e);
      fallbackToWebSpeech(text, lang);
    }
  };

  const fallbackToWebSpeech = (text: string, lang: 'zh-CN' | 'vi-VN' | 'en-US' = 'zh-CN') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error("Web Speech API not supported");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = lang === 'vi-VN' ? 0.95 : 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(voice => 
        voice.lang.includes(lang) || 
        voice.lang.includes(lang.replace('-', '_')) || 
        voice.lang.includes(lang.split('-')[0])
      );
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (speechErr) {
      console.error("Web Speech API error:", speechErr);
    }
  };

  // Helper to slice vocabulary according to current selected deck
  const getVocabForCurrentDeck = (): Flashcard[] => {
    if (!currentDeck) return vocabulary;
    return vocabulary.filter(c => c.deck === currentDeck);
  };

  // Toggle App Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Click outside search suggestions dropdown to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
      if (fcSearchContainerRef.current && !fcSearchContainerRef.current.contains(e.target as Node)) {
        setFcShowSuggestionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Part of Speech tags to Vietnamese
  const formatPosTag = (pos?: string) => {
    if (!pos) return null;
    const p = pos.trim().toLowerCase();
    if (p === 'n' || p === 'noun' || p.includes('danh')) return 'Danh từ';
    if (p === 'v' || p === 'verb' || p.includes('động')) return 'Động từ';
    if (p === 'adj' || p === 'adjective' || p.includes('tính')) return 'Tính từ';
    if (p === 'adv' || p === 'adverb' || p.includes('trạng')) return 'Trạng từ';
    if (p === 'prep' || p === 'preposition' || p.includes('giới')) return 'Giới từ';
    if (p === 'pron' || p === 'pronoun' || p.includes('đại')) return 'Đại từ';
    if (p === 'conj' || p === 'conjunction' || p.includes('liên')) return 'Liên từ';
    return pos;
  };

  // Helper to highlight matching characters
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>{text.substring(idx, idx + q.length)}</span>
        {text.substring(idx + q.length)}
      </>
    );
  };

  // Fetch online dictionary word suggestions
  const fetchSuggestions = async (rawVal: string) => {
    const val = rawVal.trim();
    if (!val) {
      setSuggestions([]);
      setIsSuggesting(false);
      setShowSuggestionsDropdown(false);
      return;
    }

    if (suggestAbortRef.current) {
      suggestAbortRef.current.abort();
    }
    const abortController = new AbortController();
    suggestAbortRef.current = abortController;

    setIsSuggesting(true);

    try {
      const results: WordSuggestion[] = [];
      const lower = val.toLowerCase();
      const normVal = normalizePinyin(val);

      if (appLangPair === 'ZH-VI') {
        // 1. Chinese mode: search in local flashcards
        const localMatches = vocabulary.filter(v => {
          const matchWord = v.word && v.word.includes(val);
          const matchPinyin = v.pinyin && (normalizePinyin(v.pinyin).includes(normVal) || v.pinyin.toLowerCase().includes(lower));
          const matchMeaning = v.meaning && v.meaning.toLowerCase().includes(lower);
          return matchWord || matchPinyin || matchMeaning;
        }).slice(0, 3);

        localMatches.forEach(m => {
          results.push({
            word: m.word,
            pinyin: m.pinyin,
            meaning: m.meaning,
            pos: m.type,
            source: 'local'
          });
        });

        // 2. Chinese mode: search in MASTER_DICT
        const masterMatches = MASTER_DICT.filter(m => {
          const matchWord = m.word && m.word.includes(val);
          const matchPinyin = m.pinyin && (normalizePinyin(m.pinyin).includes(normVal) || m.pinyin.toLowerCase().includes(lower));
          const matchMeaning = m.meaning && m.meaning.toLowerCase().includes(lower);
          return matchWord || matchPinyin || matchMeaning;
        }).slice(0, 6);

        masterMatches.forEach(m => {
          if (!results.some(r => r.word === m.word)) {
            results.push({
              word: m.word,
              pinyin: m.pinyin,
              meaning: m.meaning,
              pos: m.type,
              source: 'online'
            });
          }
        });

        // 3. Query backend /api/dict/suggest with langPair=ZH-VI
        try {
          const res = await fetch(`/api/dict/suggest?q=${encodeURIComponent(val)}&langPair=ZH-VI`, {
            signal: abortController.signal
          });
          if (res.ok) {
            const data: WordSuggestion[] = await res.json();
            data.forEach(item => {
              if (!results.some(r => r.word === item.word)) {
                results.push({ ...item, source: item.source || 'online' });
              }
            });
          }
        } catch (apiErr: any) {
          // ignore
        }
      } else {
        // English mode: appLangPair === 'EN-VI'
        // 1. Local English flashcards
        const localMatches = vocabulary.filter(v => 
          v.word.toLowerCase().includes(lower) || 
          (v.meaning && v.meaning.toLowerCase().includes(lower))
        ).slice(0, 3);

        localMatches.forEach(m => {
          results.push({
            word: m.word,
            pinyin: m.pinyin,
            meaning: m.meaning,
            pos: m.type,
            source: 'local'
          });
        });

        // 2. Query online dictionary API
        try {
          const res = await fetch(`/api/dict/suggest?q=${encodeURIComponent(val)}&langPair=EN-VI`, {
            signal: abortController.signal
          });
          if (res.ok) {
            const data: WordSuggestion[] = await res.json();
            data.forEach(item => {
              if (!results.some(r => r.word.toLowerCase() === item.word.toLowerCase())) {
                results.push({ ...item, source: 'online' });
              }
            });
          }
        } catch (apiErr: any) {
          if (apiErr.name !== 'AbortError') {
            // Direct client fallback to Datamuse API
            try {
              const dmRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(val)}*&md=dp&max=8`, {
                signal: abortController.signal
              });
              if (dmRes.ok) {
                const dmData = await dmRes.json();
                dmData.forEach((item: any) => {
                  let pos = "";
                  let def = "";
                  if (item.defs && item.defs.length > 0) {
                    const parts = item.defs[0].split("\t");
                    pos = parts[0] || "";
                    def = parts[1] || "";
                  }
                  if (!results.some(r => r.word.toLowerCase() === item.word.toLowerCase())) {
                    results.push({
                      word: item.word,
                      pos,
                      definition: def,
                      meaning: def,
                      source: 'online'
                    });
                  }
                });
              }
            } catch (dmErr: any) {
              if (dmErr.name !== 'AbortError') {
                console.warn("Datamuse fetch error:", dmErr);
              }
            }
          }
        }
      }

      setSuggestions(results.slice(0, 8));
      setShowSuggestionsDropdown(results.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Suggestion error:", e);
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  // ==========================================
  // Dictionary Tab Logic
  // ==========================================
  const handleDictSearchInput = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
      return;
    }

    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    suggestTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 150);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setShowSuggestionsDropdown(true);
        setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setShowSuggestionsDropdown(true);
        setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestionsDropdown && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        const item = suggestions[selectedSuggestionIndex];
        setSearchQuery(item.word);
        setShowSuggestionsDropdown(false);
        performSearch(item.word);
      } else {
        setShowSuggestionsDropdown(false);
        performSearch(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Force search via AI
    setDictSearchLoading(true);
    setSuggestions([]);
    setShowSuggestionsDropdown(false);
    setSelectedSuggestionIndex(-1);
    try {
      const response = await fetch("/api/dict/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: trimmedQuery, langPair: appLangPair })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể tra cứu bằng AI.");
      }

      const aiItem: DictItem = await response.json();
      setDictResult(aiItem);
      incrementUserStat('queryCount');
      handleToast(`✨ Đã tra từ "${aiItem.word}" thành công bằng Trợ lý AI!`);
    } catch (err: any) {
      console.error("AI Dict Search Error:", err);
      setDictResult(null);
      handleToast(`❌ Lỗi tra cứu AI: ${err.message || "Vui lòng thử lại sau."}`);
    } finally {
      setDictSearchLoading(false);
    }
  };

  // ==========================================
  // Flashcard Tab Dictionary Search Logic
  // ==========================================
  const fetchFcSuggestions = async (rawVal: string) => {
    const val = rawVal.trim();
    if (!val) {
      setFcSuggestions([]);
      setFcIsSuggesting(false);
      setFcShowSuggestionsDropdown(false);
      return;
    }

    if (fcSuggestAbortRef.current) {
      fcSuggestAbortRef.current.abort();
    }
    const abortController = new AbortController();
    fcSuggestAbortRef.current = abortController;

    setFcIsSuggesting(true);

    try {
      const results: WordSuggestion[] = [];
      const lower = val.toLowerCase();
      const normVal = normalizePinyin(val);

      if (appLangPair === 'ZH-VI') {
        // 1. Chinese mode: search in local flashcards
        const localMatches = vocabulary.filter(v => {
          const matchWord = v.word && v.word.includes(val);
          const matchPinyin = v.pinyin && (normalizePinyin(v.pinyin).includes(normVal) || v.pinyin.toLowerCase().includes(lower));
          const matchMeaning = v.meaning && v.meaning.toLowerCase().includes(lower);
          return matchWord || matchPinyin || matchMeaning;
        }).slice(0, 3);

        localMatches.forEach(m => {
          results.push({
            word: m.word,
            pinyin: m.pinyin,
            meaning: m.meaning,
            pos: m.type,
            source: 'local'
          });
        });

        // 2. Chinese mode: search in MASTER_DICT
        const masterMatches = MASTER_DICT.filter(m => {
          const matchWord = m.word && m.word.includes(val);
          const matchPinyin = m.pinyin && (normalizePinyin(m.pinyin).includes(normVal) || m.pinyin.toLowerCase().includes(lower));
          const matchMeaning = m.meaning && m.meaning.toLowerCase().includes(lower);
          return matchWord || matchPinyin || matchMeaning;
        }).slice(0, 6);

        masterMatches.forEach(m => {
          if (!results.some(r => r.word === m.word)) {
            results.push({
              word: m.word,
              pinyin: m.pinyin,
              meaning: m.meaning,
              pos: m.type,
              source: 'online'
            });
          }
        });

        // 3. Query backend /api/dict/suggest with langPair=ZH-VI
        try {
          const res = await fetch(`/api/dict/suggest?q=${encodeURIComponent(val)}&langPair=ZH-VI`, {
            signal: abortController.signal
          });
          if (res.ok) {
            const data: WordSuggestion[] = await res.json();
            data.forEach(item => {
              if (!results.some(r => r.word === item.word)) {
                results.push({ ...item, source: item.source || 'online' });
              }
            });
          }
        } catch (apiErr: any) {
          // ignore
        }
      } else {
        // English mode: appLangPair === 'EN-VI'
        // 1. Local English flashcards
        const localMatches = vocabulary.filter(v => 
          v.word.toLowerCase().includes(lower) || 
          (v.meaning && v.meaning.toLowerCase().includes(lower))
        ).slice(0, 3);

        localMatches.forEach(m => {
          results.push({
            word: m.word,
            pinyin: m.pinyin,
            meaning: m.meaning,
            pos: m.type,
            source: 'local'
          });
        });

        // 2. Query online dictionary API
        try {
          const res = await fetch(`/api/dict/suggest?q=${encodeURIComponent(val)}&langPair=${appLangPair}`, {
            signal: abortController.signal
          });
          if (res.ok) {
            const data: WordSuggestion[] = await res.json();
            data.forEach(item => {
              if (!results.some(r => r.word.toLowerCase() === item.word.toLowerCase())) {
                results.push({ ...item, source: 'online' });
              }
            });
          }
        } catch (apiErr: any) {
          if (apiErr.name !== 'AbortError') {
            try {
              const dmRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(val)}*&md=dp&max=8`, {
                signal: abortController.signal
              });
              if (dmRes.ok) {
                const dmData = await dmRes.json();
                dmData.forEach((item: any) => {
                  let pos = "";
                  let def = "";
                  if (item.defs && item.defs.length > 0) {
                    const parts = item.defs[0].split("\t");
                    pos = parts[0] || "";
                    def = parts[1] || "";
                  }
                  if (!results.some(r => r.word.toLowerCase() === item.word.toLowerCase())) {
                    results.push({
                      word: item.word,
                      pos,
                      definition: def,
                      meaning: def,
                      source: 'online'
                    });
                  }
                });
              }
            } catch (dmErr: any) {
              // ignore
            }
          }
        }
      }

      setFcSuggestions(results.slice(0, 8));
      setFcShowSuggestionsDropdown(results.length > 0);
      setFcSelectedSuggestionIndex(-1);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Flashcard suggestion error:", e);
      }
    } finally {
      setFcIsSuggesting(false);
    }
  };

  const handleFcDictSearchInput = (val: string) => {
    setFcSearchQuery(val);
    if (!val.trim()) {
      setFcSuggestions([]);
      setFcShowSuggestionsDropdown(false);
      setFcSelectedSuggestionIndex(-1);
      if (fcSuggestTimeoutRef.current) clearTimeout(fcSuggestTimeoutRef.current);
      return;
    }

    if (fcSuggestTimeoutRef.current) clearTimeout(fcSuggestTimeoutRef.current);
    fcSuggestTimeoutRef.current = setTimeout(() => {
      fetchFcSuggestions(val);
    }, 150);
  };

  const handleFcSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (fcSuggestions.length > 0) {
        setFcShowSuggestionsDropdown(true);
        setFcSelectedSuggestionIndex(prev => (prev + 1) % fcSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (fcSuggestions.length > 0) {
        setFcShowSuggestionsDropdown(true);
        setFcSelectedSuggestionIndex(prev => (prev - 1 + fcSuggestions.length) % fcSuggestions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (fcShowSuggestionsDropdown && fcSelectedSuggestionIndex >= 0 && fcSelectedSuggestionIndex < fcSuggestions.length) {
        const item = fcSuggestions[fcSelectedSuggestionIndex];
        setFcSearchQuery(item.word);
        setFcShowSuggestionsDropdown(false);
        performFcSearch(item.word);
      } else {
        setFcShowSuggestionsDropdown(false);
        performFcSearch(fcSearchQuery);
      }
    } else if (e.key === 'Escape') {
      setFcShowSuggestionsDropdown(false);
      setFcSelectedSuggestionIndex(-1);
    }
  };

  const performFcSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setFcDictSearchLoading(true);
    setFcSuggestions([]);
    setFcShowSuggestionsDropdown(false);
    setFcSelectedSuggestionIndex(-1);
    try {
      const response = await fetch("/api/dict/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: trimmedQuery, langPair: appLangPair })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể tra cứu bằng AI.");
      }

      const aiItem: DictItem = await response.json();
      setFcDictResult(aiItem);
      incrementUserStat('queryCount');
      handleToast(`✨ Đã tra từ "${aiItem.word}" thành công!`);
    } catch (err: any) {
      console.error("AI Dict Search in Flashcard Error:", err);
      setFcDictResult(null);
      handleToast(`❌ Lỗi tra cứu: ${err.message || "Vui lòng thử lại sau."}`);
    } finally {
      setFcDictSearchLoading(false);
    }
  };

  // Auto-fill form fields using AI / Dictionary when given a word
  const handleAutoFillFormWithAI = async (wordToFill?: string) => {
    const targetWord = (wordToFill || formWord).trim();
    if (!targetWord) {
      setCustomAlertMsg('Vui lòng nhập từ vựng trước khi tạo tự động!');
      return;
    }

    setIsFormAutoFilling(true);
    setFcShowSuggestionsDropdown(false);

    try {
      // 1. Check local dictionary or vocabulary first for instant fill
      const localDictMatch = MASTER_DICT.find(d => d.word.toLowerCase() === targetWord.toLowerCase());
      if (localDictMatch) {
        setFormWord(localDictMatch.word);
        setFormPinyin(localDictMatch.pinyin || (appLangPair === 'ZH-VI' ? convertToPinyin(localDictMatch.word) : ''));
        setFormMeaning(localDictMatch.meaning || '');
        setFormType(localDictMatch.type || (appLangPair === 'EN-VI' ? 'Từ vựng' : 'Chữ Hán'));
        if (localDictMatch.examples && localDictMatch.examples.length > 0) {
          setFormExCn(localDictMatch.examples[0].cn || '');
          setFormExVn(localDictMatch.examples[0].vn || '');
          setFormExPinyin(localDictMatch.examples[0].pinyin || '');
        }
        setIsFormAutoFilling(false);
        handleToast(`✨ Đã tự động điền thông tin từ "${localDictMatch.word}"!`);
        return;
      }

      // 2. Fetch from AI dictionary search endpoint
      const response = await fetch("/api/dict/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetWord, langPair: appLangPair })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể tra cứu tự động.");
      }

      const aiItem: DictItem = await response.json();
      setFormWord(aiItem.word || targetWord);
      setFormPinyin(aiItem.pinyin || (appLangPair === 'ZH-VI' ? convertToPinyin(aiItem.word || targetWord) : ''));
      setFormMeaning(aiItem.meaning || '');
      setFormType(aiItem.type || (appLangPair === 'EN-VI' ? 'Từ vựng' : 'Chữ Hán'));

      if (aiItem.examples && aiItem.examples.length > 0) {
        setFormExCn(aiItem.examples[0].cn || '');
        setFormExVn(aiItem.examples[0].vn || '');
        setFormExPinyin(aiItem.examples[0].pinyin || (appLangPair === 'ZH-VI' && aiItem.examples[0].cn ? convertToPinyin(aiItem.examples[0].cn) : ''));
      }

      handleToast(`✨ AI đã tự động điền đầy đủ phiên âm, nghĩa và ví dụ cho "${aiItem.word}"!`);
    } catch (err: any) {
      console.error("Auto-fill error:", err);
      // Fallback: at least generate pinyin for ZH-VI
      if (appLangPair === 'ZH-VI' && !formPinyin) {
        setFormPinyin(convertToPinyin(targetWord));
      }
      handleToast(`⚠️ Không thể lấy đầy đủ thông tin AI: ${err.message || 'Vui lòng nhập thêm thủ công.'}`);
    } finally {
      setIsFormAutoFilling(false);
    }
  };

  // Select suggestion item directly into form
  const handleSelectSuggestionForForm = (item: WordSuggestion) => {
    setFormWord(item.word);
    setFcShowSuggestionsDropdown(false);
    setFcSelectedSuggestionIndex(-1);

    if (item.pinyin) setFormPinyin(item.pinyin);
    else if (appLangPair === 'ZH-VI') setFormPinyin(convertToPinyin(item.word));

    if (item.meaning || item.definition) setFormMeaning(item.meaning || item.definition || '');
    if (item.pos) setFormType(item.pos);

    // If meaning is missing or brief, trigger full auto-fill to fetch examples and clean meaning
    if (!item.meaning && !item.definition) {
      handleAutoFillFormWithAI(item.word);
    }
  };

  // Manual Flashcard Add Form Logic with automatic AI creation fallback
  const handleManualAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = formWord.trim();
    if (!word) {
      setCustomAlertMsg('Vui lòng nhập từ vựng!');
      return;
    }

    const deckName = formDeck || currentDeck || decks[0] || 'Chung';
    const exists = vocabulary.some(v => v.word.toLowerCase() === word.toLowerCase() && v.deck === deckName);
    if (exists) {
      setCustomAlertMsg(`Từ "${word}" đã tồn tại trong bộ "${deckName}"!`);
      return;
    }

    let meaning = formMeaning.trim();
    let pinyin = formPinyin.trim();
    let type = formType.trim();
    let exCn = formExCn.trim();
    let exVn = formExVn.trim();
    let exPinyin = formExPinyin.trim();
    let collocations: Collocation[] = [];

    // If only word is entered and meaning is empty, automatically ask AI to complete and create the card!
    if (!meaning) {
      setIsFormAutoFilling(true);
      try {
        handleToast(`🤖 AI đang tự động tìm nghĩa, phiên âm và ví dụ cho "${word}"...`);
        const response = await fetch("/api/dict/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: word, langPair: appLangPair })
        });

        if (response.ok) {
          const aiItem: DictItem = await response.json();
          meaning = aiItem.meaning || 'Đang cập nhật';
          pinyin = aiItem.pinyin || (appLangPair === 'ZH-VI' ? convertToPinyin(aiItem.word || word) : '');
          type = aiItem.type || (appLangPair === 'EN-VI' ? 'Từ vựng' : 'Chữ Hán');
          collocations = aiItem.collocations || [];
          if (aiItem.examples && aiItem.examples.length > 0) {
            exCn = aiItem.examples[0].cn || '';
            exVn = aiItem.examples[0].vn || '';
            exPinyin = aiItem.examples[0].pinyin || (appLangPair === 'ZH-VI' && exCn ? convertToPinyin(exCn) : '');
          }
        } else {
          meaning = appLangPair === 'EN-VI' ? 'Từ vựng mới' : 'Chữ Hán mới';
          if (appLangPair === 'ZH-VI' && !pinyin) pinyin = convertToPinyin(word);
        }
      } catch (err: any) {
        meaning = appLangPair === 'EN-VI' ? 'Từ vựng mới' : 'Chữ Hán mới';
        if (appLangPair === 'ZH-VI' && !pinyin) pinyin = convertToPinyin(word);
      } finally {
        setIsFormAutoFilling(false);
      }
    }

    if (!pinyin && appLangPair === 'ZH-VI') {
      pinyin = convertToPinyin(word);
    }

    const examples: Example[] = [];
    if (exCn || exVn) {
      examples.push({
        cn: exCn || word,
        vn: exVn,
        pinyin: exPinyin || (appLangPair === 'ZH-VI' && exCn ? convertToPinyin(exCn) : undefined)
      });
    }

    const newCard: Flashcard = {
      word,
      pinyin,
      meaning: meaning || 'Chưa có nghĩa',
      type: type || (appLangPair === 'EN-VI' ? 'Từ vựng' : 'Chữ Hán'),
      collocations: collocations.length > 0 ? collocations : undefined,
      examples,
      status: 'learning',
      deck: deckName
    };

    setVocabulary(prev => [...prev, newCard]);
    handleToast(`✅ Đã tạo thẻ "${word}" vào bộ "${deckName}" thành công!`);

    // Reset form
    setFormWord('');
    setFormPinyin('');
    setFormMeaning('');
    setFormType('');
    setFormExCn('');
    setFormExVn('');
    setFormExPinyin('');
    setFcSuggestions([]);
    setFcShowSuggestionsDropdown(false);
  };

  const handleAddFcResultToCurrentDeck = (item: DictItem, targetDeckName?: string) => {
    const deckName = targetDeckName || currentDeck || decks[0] || 'Chung';
    const alreadyExists = vocabulary.some(v => v.word.toLowerCase() === item.word.toLowerCase() && v.deck === deckName);
    
    if (alreadyExists) {
      handleToast(`ℹ️ "${item.word}" đã có sẵn trong bộ "${deckName}"!`);
      return;
    }

    const newCard: Flashcard = {
      word: item.word,
      pinyin: item.pinyin,
      meaning: item.meaning,
      type: item.type || "Từ vựng",
      collocations: item.collocations || [],
      examples: item.examples || [],
      status: "learning",
      deck: deckName
    };

    setVocabulary(prev => [...prev, newCard]);
    handleToast(`✅ Đã thêm "${item.word}" vào bộ "${deckName}" thành công!`);
  };

  const handleAddDictItemToFlashcards = (item: DictItem) => {
    setWordToAdd(item);
    const initialDeck = currentDeck;
    setSelectedDecksForWord(initialDeck ? [initialDeck] : []);
    setNewDeckInputInAddModal('');
  };

  const confirmAddWordToDecks = () => {
    if (!wordToAdd) return;
    if (selectedDecksForWord.length === 0) {
      setCustomAlertMsg('Vui lòng chọn ít nhất một bộ thẻ nhớ!');
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;
    const newCards: Flashcard[] = [];

    selectedDecksForWord.forEach(deckName => {
      const alreadyInDeck = vocabulary.some(v => v.word === wordToAdd.word && v.deck === deckName);
      if (alreadyInDeck) {
        skippedCount++;
      } else {
        newCards.push({
          word: wordToAdd.word,
          pinyin: wordToAdd.pinyin,
          meaning: wordToAdd.meaning,
          type: wordToAdd.type || "Từ vựng",
          collocations: wordToAdd.collocations || [],
          examples: wordToAdd.examples || [],
          status: "learning",
          deck: deckName
        });
        addedCount++;
      }
    });

    if (newCards.length > 0) {
      setVocabulary(prev => [...prev, ...newCards]);
    }

    if (addedCount > 0) {
      handleToast(`✅ Đã thêm "${wordToAdd.word}" vào ${addedCount} bộ thẻ nhớ!`);
    } else if (skippedCount > 0) {
      handleToast(`ℹ️ "${wordToAdd.word}" đã có sẵn trong các bộ thẻ đã chọn!`);
    }

    setWordToAdd(null);
    setSelectedDecksForWord([]);
    setNewDeckInputInAddModal('');
  };

  const handleCreateDeckInAddModal = () => {
    const name = newDeckInputInAddModal.trim();
    if (!name) return;
    if (decks.includes(name)) {
      setCustomAlertMsg('Bộ thẻ này đã tồn tại!');
      return;
    }
    setDecks(prev => [...prev, name]);
    setSelectedDecksForWord(prev => [...prev, name]);
    setNewDeckInputInAddModal('');
    handleToast(`📂 Đã tạo bộ thẻ mới: "${name}"`);
  };

  // ==========================================
  // Sentence Translator Logic
  // ==========================================
  useEffect(() => {
    if (transSource.trim() === '') {
      setAiTranslationResult(null);
    }
  }, [transSource]);

  const swapTranslate = () => {
    setTranslateDirection(prev => {
      if (prev === 'zh-vi') return 'vi-zh';
      if (prev === 'vi-zh') return 'zh-vi';
      if (prev === 'en-vi') return 'vi-en';
      if (prev === 'vi-en') return 'en-vi';
      return 'zh-vi';
    });
    setTransSource(aiTranslationResult?.translatedText || '');
    setAiTranslationResult(null);
  };

  const handleAiTranslate = async () => {
    const text = transSource.trim();
    if (!text) return;

    setAiTranslationLoading(true);
    setAiTranslationResult(null);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text, direction: translateDirection })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể dịch bằng AI.");
      }

      const result = await response.json();
      setAiTranslationResult(result);
      incrementUserStat('translationCount');
      handleToast("✨ Đã dịch thành công bằng Trợ lý AI!");
    } catch (err: any) {
      console.error("AI Translation error:", err);
      handleToast(`❌ Lỗi dịch thuật AI: ${err.message || "Vui lòng thử lại sau."}`);
    } finally {
      setAiTranslationLoading(false);
    }
  };

  // ==========================================
  // Flashcards Navigator Logic (Flip mode)
  // ==========================================
  const handlePrevCard = () => {
    const pool = getVocabForCurrentDeck();
    if (pool.length === 0) return;
    setCardFlipped(false);
    setTimeout(() => {
      setCurrentFlashcardIndex(prev => (prev - 1 + pool.length) % pool.length);
    }, 150);
  };

  const handleNextCard = () => {
    const pool = getVocabForCurrentDeck();
    if (pool.length === 0) return;
    setCardFlipped(false);
    setTimeout(() => {
      setCurrentFlashcardIndex(prev => (prev + 1) % pool.length);
    }, 150);
  };

  const handleShuffleDeck = () => {
    const pool = getVocabForCurrentDeck();
    if (pool.length < 2) return;
    setCardFlipped(false);
    setTimeout(() => {
      // Create a shuffled copy of current deck indices
      const shuffledVocab = [...vocabulary];
      for (let i = shuffledVocab.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledVocab[i], shuffledVocab[j]] = [shuffledVocab[j], shuffledVocab[i]];
      }
      setVocabulary(shuffledVocab);
      setCurrentFlashcardIndex(0);
      handleToast("🔀 Đã đảo lật thứ tự thẻ vựng!");
    }, 150);
  };

  const handleMarkStatus = (status: 'learning' | 'mastered') => {
    const pool = getVocabForCurrentDeck();
    if (pool.length === 0) return;
    const card = pool[currentFlashcardIndex % pool.length];
    
    setVocabulary(prev => prev.map(v => {
      if (v.word === card.word && v.pinyin === card.pinyin) {
        return { ...v, status };
      }
      return v;
    }));

    handleToast(`Đã đánh dấu "${card.word}" là ${status === 'mastered' ? 'Đã thành thạo' : 'Cần ôn lại'}!`);
  };

  // Keyboard shortcut listeners for flip mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (tab !== 'flashcards' || lmMode !== 'flip') return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || '')) return;
      
      if (e.code === "Space") {
        e.preventDefault();
        setCardFlipped(prev => !prev);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === "Enter") {
        e.preventDefault();
        const pool = getVocabForCurrentDeck();
        if (pool.length > 0) {
          const card = pool[currentFlashcardIndex % pool.length];
          speakChinese(card.word, appLangPair === 'EN-VI' ? 'en-US' : 'zh-CN');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab, lmMode, currentFlashcardIndex, currentDeck, vocabulary]);

  // ==========================================
  // Study Mode Logic
  // ==========================================
  const handleStartStudy = () => {
    const pool = getVocabForCurrentDeck();
    if (pool.length === 0) {
      setStudyQueue([]);
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setStudyQueue(shuffled);
    setStudyIndex(0);
    setStudyCorrect(0);
    setStudyAnswer('');
    setStudyChecked(false);
    setStudyFeedback(null);
    setStudyShowHint(false);
  };

  useEffect(() => {
    if (lmMode === 'study') {
      handleStartStudy();
    }
  }, [lmMode, currentDeck, vocabulary.length]);

  const handleCheckStudy = () => {
    if (studyChecked || studyQueue.length === 0) return;
    const card = studyQueue[studyIndex % studyQueue.length];
    const userAns = studyAnswer.trim().toLowerCase();
    const correctAns = card.meaning.toLowerCase();
    const isCorrect = correctAns.includes(userAns) && userAns.length > 0;

    setStudyChecked(true);
    window.dispatchEvent(new CustomEvent('flashcard-result', { detail: { correct: isCorrect } }));
    if (isCorrect) {
      setStudyCorrect(prev => prev + 1);
      setStudyFeedback({ correct: true, text: 'Đúng rồi! 🎉' });
    } else {
      setStudyFeedback({ correct: false, text: `Chưa đúng. Đáp án: ${card.meaning}` });
    }
  };

  const handleStudySkip = () => {
    if (studyQueue.length === 0) return;
    const card = studyQueue[studyIndex % studyQueue.length];
    setStudyChecked(true);
    setStudyFeedback({ correct: false, text: `Đáp án: ${card.meaning}` });
  };

  const handleStudyNext = () => {
    if (studyIndex + 1 >= studyQueue.length) {
      // Restart or reshuffle
      const shuffled = [...studyQueue].sort(() => Math.random() - 0.5);
      setStudyQueue(shuffled);
      setStudyIndex(0);
      setStudyCorrect(0);
    } else {
      setStudyIndex(prev => prev + 1);
    }
    setStudyAnswer('');
    setStudyChecked(false);
    setStudyFeedback(null);
    setStudyShowHint(false);
  };

  const handleStudyStar = () => {
    if (studyQueue.length === 0) return;
    const card = studyQueue[studyIndex % studyQueue.length];
    const newStatus = card.status === 'mastered' ? 'learning' : 'mastered';
    
    setVocabulary(prev => prev.map(v => {
      if (v.word === card.word) {
        return { ...v, status: newStatus };
      }
      return v;
    }));

    setStudyQueue(prev => prev.map((v, i) => {
      if (i === studyIndex) {
        return { ...v, status: newStatus };
      }
      return v;
    }));

    handleToast(`Đã chuyển trạng thái sang "${newStatus === 'mastered' ? 'Đã thành thạo' : 'Cần ôn lại'}"`);
  };

  // ==========================================
  // Fill in the Blank Mode Logic
  // ==========================================
  const handleStartFillin = () => {
    const pool = getVocabForCurrentDeck();
    const items: FillinItem[] = [];
    pool.forEach(card => {
      if (card.examples && card.examples.length > 0) {
        card.examples.forEach(ex => {
          if (ex.cn.includes(card.word)) {
            items.push({ card, example: ex });
          }
        });
      }
    });

    const shuffled = items.sort(() => Math.random() - 0.5);
    setFillinQueue(shuffled);
    setFillinIndex(0);
    setFillinRight(0);
    setFillinWrong(0);
    setFillinAnswer('');
    setFillinChecked(false);
    setFillinFeedback(null);
  };

  useEffect(() => {
    if (lmMode === 'fillin') {
      handleStartFillin();
    }
  }, [lmMode, currentDeck, vocabulary.length]);

  const handleCheckFillin = () => {
    if (fillinChecked || fillinQueue.length === 0) return;
    const { card } = fillinQueue[fillinIndex];
    const isCorrect = fillinAnswer.trim() === card.word;

    setFillinChecked(true);
    window.dispatchEvent(new CustomEvent('flashcard-result', { detail: { correct: isCorrect } }));
    if (isCorrect) {
      setFillinRight(prev => prev + 1);
      setFillinFeedback({ correct: true, text: 'Đúng rồi! 🎉' });
    } else {
      setFillinWrong(prev => prev + 1);
      setFillinFeedback({ correct: false, text: `Chưa đúng. Đáp án đúng: ${card.word}` });
    }
  };

  const handleFillinSkip = () => {
    if (fillinQueue.length === 0) return;
    const { card } = fillinQueue[fillinIndex];
    setFillinWrong(prev => prev + 1);
    setFillinChecked(true);
    setFillinFeedback({ correct: false, text: `Đáp án: ${card.word}` });
  };

  const handleFillinNext = () => {
    if (fillinIndex + 1 >= fillinQueue.length) {
      handleStartFillin();
    } else {
      setFillinIndex(prev => prev + 1);
    }
    setFillinAnswer('');
    setFillinChecked(false);
    setFillinFeedback(null);
  };

  // ==========================================
  // Quiz Mode Logic
  // ==========================================
  const generateQuizQuestions = () => {
    const pool = getVocabForCurrentDeck();
    if (pool.length < 2) {
      setQuizQuestions([]);
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const questions: QuizQuestion[] = [];

    shuffled.forEach((card, i) => {
      const isWrite = quizFormat === 'write' || (quizFormat === 'mixed' && i % 2 === 0);
      const isMC = quizFormat === 'mc' || (quizFormat === 'mixed' && i % 2 !== 0);

      if (isWrite) {
        questions.push({ type: 'write', card, answered: false, correct: null });
      } else if (isMC) {
        const wrongCards = pool.filter(c => c.word !== card.word).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [card, ...wrongCards].sort(() => Math.random() - 0.5);
        questions.push({ type: 'mc', card, options, answered: false, correct: null });
      }
    });

    setQuizQuestions(questions);
    setQuizAnsweredCount(0);
    setQuizGraded(false);
  };

  const handleSelectMCOption = (qIdx: number, optIdx: number) => {
    const q = quizQuestions[qIdx];
    if (q.answered || quizGraded) return;

    const correctOpt = q.options?.findIndex(o => o.word === q.card.word);
    const isCorrect = optIdx === correctOpt;

    window.dispatchEvent(new CustomEvent('flashcard-result', { detail: { correct: isCorrect } }));

    setQuizQuestions(prev => prev.map((item, idx) => {
      if (idx === qIdx) {
        return { ...item, answered: true, correct: isCorrect };
      }
      return item;
    }));

    setQuizAnsweredCount(prev => prev + 1);
  };

  const gradeQuiz = () => {
    let rightCount = 0;
    const updated = quizQuestions.map((q, idx) => {
      if (q.answered) {
        if (q.correct) rightCount++;
        return q;
      }

      if (q.type === 'write') {
        const input = document.getElementById(`quiz-input-${idx}`) as HTMLInputElement;
        const userAns = input?.value.trim().toLowerCase() || '';
        const correctStr = q.card.meaning.toLowerCase();
        const isCorrect = correctStr.includes(userAns) && userAns.length > 0;
        if (isCorrect) rightCount++;
        return { ...q, answered: true, correct: isCorrect };
      }
      return q;
    });

    setQuizQuestions(updated);
    setQuizAnsweredCount(updated.length);
    setQuizGraded(true);
    
    window.dispatchEvent(new CustomEvent('flashcard-result', { detail: { correct: rightCount === updated.length } }));

    alert(`Kết quả bài kiểm tra: ${rightCount} / ${updated.length} câu đúng! ${
      rightCount === updated.length ? '🏆 Xuất sắc!' : rightCount >= updated.length * 0.7 ? '👍 Tốt lắm!' : '💪 Cố gắng hơn nhé!'
    }`);
  };

  // ==========================================
  // HanziWriter Luyện Viết Mode
  // ==========================================
  
  
  const generateBatchGrammarExercises = async () => {
    const currentDeckVocab = !currentDeck ? vocabulary : vocabulary.filter(v => v.deck === currentDeck);
    if (currentDeckVocab.length === 0) {
      setCustomAlertMsg('Bạn cần thêm từ vựng vào bộ thẻ này trước khi luyện tập.');
      return;
    }
    
    setGrammarLoading(true);
    setGrammarQuestions([]);
    setGrammarAnswers({});
    setGrammarFeedbacks({});
    setGrammarChecking({});
    setGrammarGraded(false);

    try {
      // Limit to 15 words to avoid timeouts, shuffle them
      const shuffled = [...currentDeckVocab].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, Math.min(15, shuffled.length)).map(v => v.word);

      const response = await fetch('/api/grammar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: grammarFormat, words: selectedWords, batch: true, langPair: appLangPair })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi kết nối tới AI');
      
      // Convert batch array to questions
      const questions = (Array.isArray(data) ? data : []).map(q => {
        // Handle mixed type or specific types
        const type = q.type || (q.scrambledWords ? 'scramble' : (q.options ? 'fill_in' : 'compose'));
        return { ...q, type };
      });
      
      setGrammarQuestions(questions);
    } catch (error: any) {
      setCustomAlertMsg('Lỗi khi tạo bài tập: ' + error.message);
    } finally {
      setGrammarLoading(false);
    }
  };

  const handleGrammarAnswerChange = (qIdx: number, value: any) => {
    if (grammarGraded) return;
    setGrammarAnswers(prev => ({ ...prev, [qIdx]: value }));
  };

  const toggleGrammarScrambleWord = (qIdx: number, wordIdx: number) => {
    if (grammarGraded) return;
    setGrammarAnswers(prev => {
      const current = prev[qIdx] || [];
      if (current.includes(wordIdx)) {
        return { ...prev, [qIdx]: current.filter((i: number) => i !== wordIdx) };
      } else {
        return { ...prev, [qIdx]: [...current, wordIdx] };
      }
    });
  };

  const checkSingleGrammarQuestion = async (qIdx: number) => {
    const q = grammarQuestions[qIdx];
    const ans = grammarAnswers[qIdx];
    
    if (q.type === 'scramble') {
      const userAnswer = (ans || []).map((i: number) => q.scrambledWords[i]).join('');
      const isCorrect = userAnswer === q.chinese;
      setGrammarFeedbacks(prev => ({
        ...prev,
        [qIdx]: {
          isCorrect,
          score: isCorrect ? 100 : 0,
          feedback: isCorrect ? 'Tuyệt vời! Bạn đã sắp xếp đúng.' : 'Chưa đúng, hãy thử lại hoặc xem đáp án.',
          correctedSentence: q.chinese,
          correctedPinyin: q.pinyin
        }
      }));
    } else if (q.type === 'fill_in') {
      const isCorrect = ans === q.correctAnswer;
      setGrammarFeedbacks(prev => ({
        ...prev,
        [qIdx]: {
          isCorrect,
          score: isCorrect ? 100 : 0,
          feedback: isCorrect ? 'Chính xác!' : 'Sai rồi, hãy cố lên!',
          correctedSentence: q.fullSentence || q.sentence.replace('___', q.correctAnswer),
          correctedPinyin: q.fullSentencePinyin
        }
      }));
    } else if (q.type === 'compose') {
      if (!ans || !ans.trim()) return;
      setGrammarChecking(prev => ({ ...prev, [qIdx]: true }));
      try {
        const response = await fetch('/api/grammar/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentence: ans, wordsToUse: q.wordsToUse, langPair: appLangPair })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi kết nối tới AI');
        setGrammarFeedbacks(prev => ({ ...prev, [qIdx]: data }));
      } catch (error: any) {
        setCustomAlertMsg('Lỗi khi kiểm tra câu: ' + error.message);
      } finally {
        setGrammarChecking(prev => ({ ...prev, [qIdx]: false }));
      }
    }
  };



  const handleHwPrev = () => {
    const pool = getVocabForCurrentDeck();
    if (pool.length === 0) return;
    setHwWordIndex(prev => (prev - 1 + pool.length) % pool.length);
    setHwCharIndex(0);
  };

  const handleHwNext = () => {
    const pool = getVocabForCurrentDeck();
    if (pool.length === 0) return;
    setHwWordIndex(prev => (prev + 1) % pool.length);
    setHwCharIndex(0);
  };

  // HanziWriter SVG Drawing Renderer Hook
  useEffect(() => {
    if (lmMode !== 'write') return;
    const pool = getVocabForCurrentDeck();
    if (pool.length === 0) return;
    const card = pool[hwWordIndex % pool.length];
    const char = card.word.charAt(hwCharIndex) || card.word.charAt(0);

    // Reset scores
    setHwMistakes(0);
    setHwCorrectStrokes(0);
    setHwTotalStrokes(0);
    setHwCurrentStrokeNum(0);
    setHwAccuracy('—');
    setHwFeedback(null);

    // Clear SVGs
    if (demoRef.current) demoRef.current.innerHTML = '';
    if (quizRef.current) quizRef.current.innerHTML = '';
    demoWriterRef.current = null;
    quizWriterRef.current = null;

    const HanziWriterObj = window.HanziWriter;
    if (!HanziWriterObj) {
      setHwFeedback({ text: '⚠️ Đang tải dữ liệu viết chữ Hán...', type: 'warn' });
      return;
    }

    try {
      // Render reference card (Left)
      demoWriterRef.current = HanziWriterObj.create(demoRef.current, char, {
        width: 280,
        height: 280,
        padding: 8,
        strokeColor: '#1a1a2e',
        radicalColor: '#4f46e5',
        outlineColor: '#d1d5db',
        drawingWidth: 4,
        strokeFadeDuration: 500,
        strokeAnimationSpeed: 0.8,
        delayBetweenStrokes: 200,
        showCharacter: true,
        showOutline: true,
        onLoadCharDataSuccess: () => {
          demoWriterRef.current?.loopCharacterAnimation();
        }
      });

      // Render quiz drawer (Right)
      quizWriterRef.current = HanziWriterObj.create(quizRef.current, char, {
        width: 280,
        height: 280,
        padding: 8,
        strokeColor: '#4f46e5',
        outlineColor: '#d8d8e8',
        drawingColor: '#1e1b4b',
        drawingWidth: 6,
        strokeWidth: 4,
        showCharacter: false,
        showOutline: true,
        highlightOnComplete: true,
        highlightColor: '#4ade80',
        leniency: 1.5,
      });

      quizWriterRef.current.quiz({
        onMistake: (strokeData: any) => {
          setHwMistakes(prev => prev + 1);
          setHwFeedback({ text: `❌ Nét ${strokeData.strokeNum + 1}: Sai thứ tự! Hãy viết lại nét này.`, type: 'error' });
        },
        onCorrectStroke: (strokeData: any) => {
          setHwCorrectStrokes(prev => prev + 1);
          const currentStroke = strokeData.strokeNum + 1;
          setHwCurrentStrokeNum(currentStroke);
          setHwFeedback({ text: `✓ Nét ${currentStroke} đúng!`, type: 'success' });
        },
        onComplete: (summaryData: any) => {
          setHwCurrentStrokeNum(summaryData.totalStrokes || 0);
          setHwFeedback({ text: `🎉 Viết chữ Hán hoàn hảo!`, type: 'complete' });

          const totalAttempts = (summaryData.totalStrokes || 0) + summaryData.totalMistakes;
          const acc = Math.round(((summaryData.totalStrokes || 0) / totalAttempts) * 100);
          setHwAccuracy(`${acc}%`);

          setTimeout(() => {
            const isLastChar = hwCharIndex >= card.word.length - 1;
            if (isLastChar) {
              handleToast(`🏆 Tuyệt vời! Đã hoàn thành từ "${card.word}"!`);
              handleHwNext();
            } else {
              setHwCharIndex(prev => prev + 1);
            }
          }, 1500);
        }
      });

      quizWriterRef.current.getCharacterData().then((data: any) => {
        if (data && data.strokes) {
          setHwTotalStrokes(data.strokes.length);
        }
      });

    } catch (err) {
      console.error("HanziWriter init error:", err);
    }

  }, [lmMode, hwWordIndex, hwCharIndex, currentDeck, vocabulary.length]);

  const handleHwAnimate = () => {
    if (demoWriterRef.current) {
      demoWriterRef.current.cancelAnimation();
      demoWriterRef.current.animateCharacter({
        onComplete: () => {
          demoWriterRef.current?.loopCharacterAnimation();
        }
      });
    }
  };

  const handleHwReset = () => {
    const pool = getVocabForCurrentDeck();
    if (pool.length === 0) return;
    const card = pool[hwWordIndex % pool.length];
    const char = card.word.charAt(hwCharIndex) || card.word.charAt(0);
    
    setHwMistakes(0);
    setHwCorrectStrokes(0);
    setHwCurrentStrokeNum(0);
    setHwAccuracy('—');
    setHwFeedback(null);
    if (quizWriterRef.current) {
      quizRef.current!.innerHTML = '';
      const HanziWriterObj = window.HanziWriter;
      if (HanziWriterObj) {
        quizWriterRef.current = HanziWriterObj.create(quizRef.current, char, {
          width: 280,
          height: 280,
          padding: 8,
          strokeColor: '#4f46e5',
          outlineColor: '#d8d8e8',
          drawingColor: '#1e1b4b',
          drawingWidth: 6,
          strokeWidth: 4,
          showCharacter: false,
          showOutline: true,
          highlightOnComplete: true,
          highlightColor: '#4ade80',
          leniency: 1.5,
        });

        quizWriterRef.current.quiz({
          onMistake: (strokeData: any) => {
            setHwMistakes(prev => prev + 1);
            setHwFeedback({ text: `❌ Nét ${strokeData.strokeNum + 1}: Sai thứ tự! Hãy viết lại nét này.`, type: 'error' });
          },
          onCorrectStroke: (strokeData: any) => {
            setHwCorrectStrokes(prev => prev + 1);
            const currentStroke = strokeData.strokeNum + 1;
            setHwCurrentStrokeNum(currentStroke);
            setHwFeedback({ text: `✓ Nét ${currentStroke} đúng!`, type: 'success' });
          },
          onComplete: (summaryData: any) => {
            setHwCurrentStrokeNum(summaryData.totalStrokes || 0);
            setHwFeedback({ text: `🎉 Viết chữ Hán hoàn hảo!`, type: 'complete' });

            const totalAttempts = (summaryData.totalStrokes || 0) + summaryData.totalMistakes;
            const acc = Math.round(((summaryData.totalStrokes || 0) / totalAttempts) * 100);
            setHwAccuracy(`${acc}%`);

            setTimeout(() => {
              const isLastChar = hwCharIndex >= card.word.length - 1;
              if (isLastChar) {
                handleToast(`🏆 Tuyệt vời! Đã hoàn thành từ "${card.word}"!`);
                handleHwNext();
              } else {
                setHwCharIndex(prev => prev + 1);
              }
            }, 1500);
          }
        });
      }
    }
  };

  const handleHwHint = () => {
    if (quizWriterRef.current) {
      quizWriterRef.current.animateStroke(hwCurrentStrokeNum);
      setHwFeedback({ text: `💡 Gợi ý vẽ nét ${hwCurrentStrokeNum + 1}...`, type: 'info' });
    }
  };

  // ==========================================
  // Flashcard Deck Management & List Cards
  // ==========================================
  const handleAddNewDeck = () => {
    setNewDeckNameInput('');
    setShowAddDeckModal(true);
  };

  const submitNewDeck = () => {
    const name = newDeckNameInput.trim();
    if (!name) return;
    if (decks.includes(name)) {
      setCustomAlertMsg('Bộ thẻ này đã tồn tại!');
      return;
    }
    setDecks(prev => [...prev, name]);
    setCurrentDeck(name);
    setShowAddDeckModal(false);
    setNewDeckNameInput('');
    handleToast(`📂 Đã tạo bộ thẻ mới: "${name}"`);
  };

  const submitAiAddWords = async () => {
    const val = aiAddWordsTopic.trim();
    if (!val) return;
    
    setIsGeneratingAiWords(true);
    const targetDeck = modalTargetDeck || currentDeck || 'Chung';
    try {
      const response = await fetch('/api/deck/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: val, count: parseInt(aiAddWordsCount) || 5, langPair: appLangPair })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi tạo thẻ');
      }

      if (data && data.cards && data.cards.length > 0) {
        const newVocabs = data.cards.map((c: any) => ({
          ...c,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          deck: targetDeck,
          status: 'learning'
        }));

        setVocabulary(prev => [...prev, ...newVocabs]);
        handleToast(`✨ Đã thêm ${newVocabs.length} từ vào bộ "${targetDeck}"`);
        setShowAiAddWordsModal(false);
        setAiAddWordsTopic('');
      } else {
        throw new Error('Không có thẻ nào được tạo.');
      }
    } catch (error: any) {
      setCustomAlertMsg(`Lỗi: ${error.message}`);
    } finally {
      setIsGeneratingAiWords(false);
    }
  };

  const submitAiExtractFile = async () => {
    if (!uploadedFile) return;
    
    setIsExtractingFile(true);
    const targetDeck = modalTargetDeck || currentDeck || 'Chung';
    try {
      // Read the file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 part
          const base64Data = result.split(',')[1] || result;
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
        reader.readAsDataURL(uploadedFile);
      });

      const fileData = await base64Promise;

      const response = await fetch('/api/deck/extract-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName: uploadedFile.name,
          langPair: appLangPair
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi trích xuất từ vựng từ tệp');
      }

      if (data && data.cards && data.cards.length > 0) {
        const newVocabs = data.cards.map((c: any) => ({
          ...c,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          deck: targetDeck,
          status: 'learning'
        }));

        setVocabulary(prev => [...prev, ...newVocabs]);
        handleToast(`✨ Đã nhận diện và thêm ${newVocabs.length} từ vào bộ "${targetDeck}"`);
        setShowAiAddWordsModal(false);
        setUploadedFile(null);
      } else {
        throw new Error('Không trích xuất được từ vựng nào.');
      }
    } catch (error: any) {
      setCustomAlertMsg(`Lỗi: ${error.message}`);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const confirmRemoveDeck = (name: string) => {
    setDeckToDelete(name);
  };

  const handleRemoveDeck = (name: string) => {
    const remainingDecks = decks.filter(d => d !== name);
    setDecks(remainingDecks);
    setVocabulary(prev => prev.filter(c => c.deck !== name));
    
    if (currentDeck === name) {
      setCurrentDeck(remainingDecks[0] || '');
      setShowDeckDashboard(true);
    }
    setDeckToDelete(null);
    handleToast(`🗑️ Đã xóa bộ thẻ "${name}" và toàn bộ thẻ bên trong`);
  };

  const handleLookupFromFlashcards = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = flashcardLookupQuery.trim();
    if (q) {
      setSearchQuery(q);
      setTab('dictionary');
      performSearch(q);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTab('dictionary');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCreateNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWord.trim() || !formPinyin.trim() || !formMeaning.trim()) {
      setCustomAlertMsg("Vui lòng nhập đầy đủ các trường bắt buộc!");
      return;
    }
    if (!formDeck) {
      setCustomAlertMsg("Vui lòng lựa chọn bộ thẻ mục tiêu trước khi thêm từ vựng!");
      return;
    }

    const newCard: Flashcard = {
      word: formWord.trim(),
      pinyin: formPinyin.trim(),
      meaning: formMeaning.trim(),
      type: formType.trim() || "Từ vựng",
      examples: [],
      status: "learning",
      deck: formDeck
    };

    if (formExCn.trim() || formExVn.trim()) {
      newCard.examples.push({
        cn: formExCn.trim() || formWord.trim(),
        vn: formExVn.trim() || formMeaning.trim(),
        pinyin: formExPinyin.trim() || convertToPinyin(formExCn.trim())
      });
    }

    setVocabulary(prev => [...prev, newCard]);

    // Reset Form fields
    setFormWord('');
    setFormPinyin('');
    setFormMeaning('');
    setFormType('');
    setFormExCn('');
    setFormExVn('');
    setFormExPinyin('');

    handleToast(`✅ Đã thêm thẻ "${newCard.word}" vào bộ "${newCard.deck}"!`);
  };

  const confirmDeleteCard = (word: string) => {
    setCardToDelete(word);
  };

  const handleDeleteCard = (word: string) => {
    setVocabulary(prev => prev.filter(v => v.word !== word));
    setCardToDelete(null);
    handleToast(`🗑️ Đã xóa thẻ "${word}"`);
  };

  // Calculations for stats progress
  const deckVocab = getVocabForCurrentDeck();
  const totalCards = deckVocab.length;
  const learningCount = deckVocab.filter(v => v.status === 'learning').length;
  const masteredCount = deckVocab.filter(v => v.status === 'mastered').length;
  const pctProgress = totalCards === 0 ? 0 : Math.round((masteredCount / totalCards) * 100);

  // Active view card in 3D flip mode
  const currentCard: Flashcard | undefined = deckVocab[currentFlashcardIndex % deckVocab.length];

  if (authLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-body)',
        color: 'var(--text-primary)'
      }}>
        <Loader2 className="animate-spin text-primary" size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Đang kiểm tra kết nối tài khoản...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', position: 'relative', overflow: 'hidden', padding: '16px',
        fontFamily: 'var(--font-body)', color: 'var(--text-primary)'
      }}>
        <div className="bg-blob-3"></div>
        <div style={{
          backgroundColor: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)', border: 'var(--glass-border)',
          borderRadius: '24px', maxWidth: '400px', width: '100%', padding: '32px',
          boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center', gap: '24px', zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-icon" style={{ overflow: 'hidden', background: 'transparent', boxShadow: 'none', width: '54px', height: '54px' }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white', borderRadius: '14px' }}><span style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>学</span></div>
            </div>
            <h1 className="logo-text" style={{ fontSize: '32px' }}>Sino<span>Learn</span></h1>
          </div>
          
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Đăng nhập hệ thống</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Chào mừng bạn đến với SinoLearn. Vui lòng đăng nhập bằng tài khoản Google để tiếp tục học tập.
            </p>
          </div>

          {authError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '12px', padding: '12px 16px', color: '#ef4444', fontSize: '13.5px',
              textAlign: 'left', width: '100%', lineHeight: 1.4
            }}>
              ⚠️ {authError}
            </div>
          )}

          {!auth && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '12px', padding: '12px 16px', color: '#ef4444', fontSize: '13.5px',
              textAlign: 'left', width: '100%', lineHeight: 1.5
            }}>
              ⚠️ <strong>Cần thiết lập Firebase:</strong> Vui lòng điền đầy đủ các khóa cấu hình trong file <code>.env</code> ở thư mục gốc của dự án và khởi động lại Server để kích hoạt tính năng đăng nhập.
            </div>
          )}

          {!auth && (
            <button
              onClick={() => {
                setUser({ uid: 'mock-admin', email: 'giathieu110406@gmail.com', displayName: 'Mock Admin' });
                setUserProfile({
                  uid: 'mock-admin',
                  email: 'giathieu110406@gmail.com',
                  displayName: 'Mock Admin',
                  role: 'admin',
                  status: 'approved',
                  queryCount: 12,
                  translationCount: 5,
                  vocabulary: INITIAL_VOCABULARY,
                  decks: ['HSK1']
                });
                setIsDataLoaded(true);
              }}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'transform var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              Đăng nhập thử nghiệm (Admin Bypass)
            </button>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={!auth}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              background: auth 
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                : 'var(--border-color)',
              color: auth ? 'white' : 'var(--text-secondary)', 
              fontSize: '15px', fontWeight: '700', 
              cursor: auth ? 'pointer' : 'not-allowed',
              boxShadow: auth ? '0 8px 24px rgba(99,102,241,0.25)' : 'none', 
              display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'transform var(--transition-fast)'
            }}
            onMouseEnter={(e) => auth && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => auth && (e.currentTarget.style.transform = 'none')}
          >
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập bằng Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-blob-3"></div>
      <div className="app-container">
      {/* Toast popup */}
      {toast && (
        <div id="sinoToast" style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%) translateY(0)',
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          color: 'white', padding: '12px 24px', borderRadius: '50px',
          fontSize: '14px', fontWeight: '600', zIndex: 9999,
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          transition: 'all 0.3s ease', maxWidth: '90vw', textAlign: 'center'
        }}>
          {toast}
        </div>
      )}

      {/* Custom Modal: Delete Deck Confirmation */}
      {deckToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '12px'
        }} onClick={() => setDeckToDelete(null)}>
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '12px',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.2), 0 9px 46px 8px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>⚠️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
                Xóa bộ thẻ nhớ?
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, textAlign: 'left' }}>
              Bạn có chắc chắn muốn xóa bộ thẻ <strong>"{deckToDelete}"</strong> không?<br />
              Toàn bộ thẻ ghi nhớ thuộc bộ thẻ này sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                className="filter-btn" 
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => setDeckToDelete(null)}
              >
                Hủy bỏ
              </button>
              <button 
                className="submit-btn" 
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => handleRemoveDeck(deckToDelete)}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} /> Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal: Delete Card Confirmation */}
      {cardToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '12px'
        }} onClick={() => setCardToDelete(null)}>
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '12px',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.2), 0 9px 46px 8px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>🗑️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
                Xóa thẻ từ vựng?
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, textAlign: 'left' }}>
              Bạn có chắc chắn muốn xóa vĩnh viễn thẻ từ <strong>"{cardToDelete}"</strong> khỏi hệ thống không? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                className="filter-btn" 
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => setCardToDelete(null)}
              >
                Hủy bỏ
              </button>
              <button 
                className="submit-btn" 
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => handleDeleteCard(cardToDelete)}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} /> Xóa thẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal: Create New Deck Prompt */}
      {showAddDeckModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '12px'
        }} onClick={() => setShowAddDeckModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '12px',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.2), 0 9px 46px 8px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Layers style={{ width: '20px', height: '20px' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
                Tạo bộ thẻ mới
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Tên bộ thẻ mới:</label>
              <input 
                type="text" 
                value={newDeckNameInput}
                onChange={(e) => setNewDeckNameInput(e.target.value)}
                placeholder="Nhập tên bộ thẻ (Ví dụ: Động từ, HSK 1, ...)"
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)',
                  borderRadius: '8px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '14px', outline: 'none'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewDeck();
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                className="filter-btn" 
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => setShowAddDeckModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                className="submit-btn" 
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={submitNewDeck}
              >
                <Plus style={{ width: '14px', height: '14px' }} /> Tạo ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal: AI Add Words to Current Deck */}
      {showAiAddWordsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '12px'
        }} onClick={() => !isGeneratingAiWords && !isExtractingFile && setShowAiAddWordsModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '16px',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.2), 0 9px 46px 8px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>✨</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
                Thêm từ {appLangPair === 'EN-VI' ? 'tiếng Anh' : 'tiếng Trung'} bằng AI
              </h3>
            </div>
            


            {/* Target Deck Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Chọn bộ thẻ đích:</label>
              {!showModalNewDeckInput ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={modalTargetDeck}
                    onChange={(e) => setModalTargetDeck(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)',
                      fontSize: '14px', outline: 'none', cursor: 'pointer'
                    }}
                    disabled={isGeneratingAiWords || isExtractingFile}
                  >
                    {decks.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowModalNewDeckInput(true)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
                      fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                    disabled={isGeneratingAiWords || isExtractingFile}
                  >
                    + Tạo bộ mới
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={modalNewDeckName}
                    onChange={(e) => setModalNewDeckName(e.target.value)}
                    placeholder="Nhập tên bộ thẻ mới..."
                    style={{
                      flex: 1,
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)',
                      fontSize: '14px', outline: 'none'
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (modalNewDeckName.trim()) {
                        const trimmed = modalNewDeckName.trim();
                        if (decks.includes(trimmed)) {
                          setCustomAlertMsg('Bộ thẻ này đã tồn tại!');
                          setModalTargetDeck(trimmed);
                        } else {
                          setDecks(prev => [...prev, trimmed]);
                          setModalTargetDeck(trimmed);
                          handleToast(`Đã tạo bộ thẻ: "${trimmed}"`);
                        }
                        setModalNewDeckName('');
                        setShowModalNewDeckInput(false);
                      } else {
                        setShowModalNewDeckInput(false);
                      }
                    }}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', border: 'none',
                      backgroundColor: 'var(--color-primary)', color: 'white',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    Tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModalNewDeckInput(false)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
                      fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>

            <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Tải lên tệp tài liệu hoặc hình ảnh (PDF, Word, PPTX, Text, Markdown, JPG, PNG, WEBP). AI sẽ tự động phân tích và trích xuất từ vựng phù hợp vào bộ <strong>{modalTargetDeck}</strong>.
                </p>

                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setFileDragOver(true);
                  }}
                  onDragLeave={() => setFileDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setFileDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const ext = file.name.split('.').pop()?.toLowerCase();
                      if (['pdf', 'docx', 'pptx', 'txt', 'md'].includes(ext || '')) {
                        setUploadedFile(file);
                      } else {
                        setCustomAlertMsg('Chỉ hỗ trợ tệp định dạng .pdf, .docx, .pptx, .txt, .md');
                      }
                    }
                  }}
                  onClick={() => {
                    if (!isExtractingFile) {
                      document.getElementById('ai-word-file-input')?.click();
                    }
                  }}
                  style={{
                    border: fileDragOver 
                      ? '2px dashed var(--color-primary)' 
                      : '2px dashed var(--border-color)',
                    backgroundColor: fileDragOver 
                      ? 'rgba(99, 102, 241, 0.05)' 
                      : 'var(--bg-input)',
                    borderRadius: '12px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    cursor: isExtractingFile ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <input 
                    type="file" 
                    id="ai-word-file-input" 
                    style={{ display: 'none' }}
                    accept=".pdf,.docx,.pptx,.txt,.md,.jpg,.jpeg,.png,.webp,.heic"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadedFile(file);
                    }}
                    disabled={isExtractingFile}
                  />

                  {uploadedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <FileText size={36} style={{ color: 'var(--color-primary)' }} />
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-all', padding: '0 12px' }}>
                        {uploadedFile.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                        }}
                        style={{
                          marginTop: '4px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Gỡ bỏ tệp
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={36} style={{ color: 'var(--text-muted)' }} />
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Kéo thả tệp hoặc click để chọn tệp
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Hỗ trợ PDF, DOCX, PPTX, TXT, MD
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button 
                    className="filter-btn" 
                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                    onClick={() => {
                      setShowAiAddWordsModal(false);
                      setUploadedFile(null);
                    }}
                    disabled={isExtractingFile}
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    className="submit-btn" 
                    style={{ 
                      padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', 
                      display: 'flex', alignItems: 'center', gap: '6px',
                      opacity: isExtractingFile || !uploadedFile ? 0.7 : 1,
                      cursor: isExtractingFile || !uploadedFile ? 'not-allowed' : 'pointer'
                    }}
                    onClick={submitAiExtractFile}
                    disabled={isExtractingFile || !uploadedFile}
                  >
                    {isExtractingFile ? (
                      <RefreshCw style={{ width: '14px', height: '14px' }} className="spin-anim" />
                    ) : (
                      <Plus style={{ width: '14px', height: '14px' }} />
                    )}
                    {isExtractingFile ? 'Đang phân tích...' : 'Trích xuất từ vựng'}
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Custom Modal: Add Word to Multiple Flashcard Decks */}
      {wordToAdd && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '12px'
        }} onClick={() => { setWordToAdd(null); setSelectedDecksForWord([]); setNewDeckInputInAddModal(''); }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '12px',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.2), 0 9px 46px 8px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'rgb(168, 85, 247)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>🎴</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
                Thêm từ vào thẻ nhớ
              </h3>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>{wordToAdd.word}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{wordToAdd.pinyin}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{wordToAdd.meaning}</div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Chọn các bộ thẻ nhớ muốn thêm vào:
              </label>
              
              {decks.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '8px 0', fontStyle: 'italic' }}>
                  Hiện tại không có bộ thẻ nào. Vui lòng tạo bộ thẻ mới ở dưới.
                </div>
              ) : (
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  backgroundColor: 'var(--bg-card)'
                }}>
                  {decks.map(deckName => {
                    const isChecked = selectedDecksForWord.includes(deckName);
                    const isAlreadyInDeck = vocabulary.some(v => v.word === wordToAdd.word && v.deck === deckName);
                    return (
                      <label 
                        key={deckName} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '6px 8px', 
                          borderRadius: '6px', 
                          cursor: isAlreadyInDeck ? 'not-allowed' : 'pointer',
                          backgroundColor: isChecked ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                          opacity: isAlreadyInDeck ? 0.6 : 1,
                          fontSize: '13.5px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          disabled={isAlreadyInDeck}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDecksForWord(prev => [...prev, deckName]);
                            } else {
                              setSelectedDecksForWord(prev => prev.filter(d => d !== deckName));
                            }
                          }}
                          style={{ width: '15px', height: '15px', cursor: isAlreadyInDeck ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ flex: 1 }}>{deckName}</span>
                        {isAlreadyInDeck && (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>
                            Đã có sẵn
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', textAlign: 'left' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Tạo nhanh bộ thẻ mới:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text"
                  value={newDeckInputInAddModal}
                  onChange={(e) => setNewDeckInputInAddModal(e.target.value)}
                  placeholder="Nhập tên bộ thẻ mới..."
                  style={{
                    flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)',
                    borderRadius: '8px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)',
                    fontSize: '13px', outline: 'none'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateDeckInAddModal();
                    }
                  }}
                />
                <button 
                  className="btn-primary"
                  style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none' }}
                  onClick={handleCreateDeckInAddModal}
                >
                  <Plus style={{ width: '14px', height: '14px' }} /> Tạo bộ thẻ
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button 
                className="filter-btn" 
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => { setWordToAdd(null); setSelectedDecksForWord([]); setNewDeckInputInAddModal(''); }}
              >
                Hủy bỏ
              </button>
              <button 
                className="submit-btn" 
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={confirmAddWordToDecks}
              >
                <Plus style={{ width: '14px', height: '14px' }} /> Thêm vào bộ thẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal: Alert Message */}
      {customAlertMsg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '12px'
        }} onClick={() => setCustomAlertMsg(null)}>
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', maxWidth: '380px', width: '100%', padding: '12px',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.2), 0 9px 46px 8px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>⚠️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
                Thông báo
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, textAlign: 'left' }}>
              {customAlertMsg}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                className="submit-btn" 
                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
                onClick={() => setCustomAlertMsg(null)}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal: Add Member (Admin) */}
      {showAddMemberModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '12px'
        }} onClick={() => setShowAddMemberModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '20px',
            boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
                Thêm thành viên mới
              </h3>
            </div>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Email thành viên</label>
                <input 
                  type="email" 
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="nhapemail@gmail.com..."
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Họ tên</label>
                <input 
                  type="text" 
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Họ và tên..."
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Vai trò</label>
                  <select 
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Trạng thái</label>
                  <select 
                    value={newMemberStatus}
                    onChange={(e) => setNewMemberStatus(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="approved">Approved</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button"
                  className="filter-btn" 
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
                >
                  Thêm thành viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Modal: Edit Member (Admin) */}
      {showEditMemberModal && editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '12px'
        }} onClick={() => { setShowEditMemberModal(false); setEditingUser(null); }}>
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '20px',
            boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
                Chỉnh sửa thành viên
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Email</label>
                <input 
                  type="email" 
                  value={editingUser.email || ''}
                  disabled
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', outline: 'none' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Họ tên hiển thị</label>
                <input 
                  type="text" 
                  value={editingUser.displayName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  placeholder="Họ và tên..."
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Vai trò</label>
                  <select 
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Trạng thái</label>
                  <select 
                    value={editingUser.status || 'approved'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="approved">Approved</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Lượt tra từ AI</label>
                  <input 
                    type="number"
                    value={editingUser.queryCount ?? 0}
                    onChange={(e) => setEditingUser({ ...editingUser, queryCount: parseInt(e.target.value) || 0 })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Lượt dịch thuật AI</label>
                  <input 
                    type="number"
                    value={editingUser.translationCount ?? 0}
                    onChange={(e) => setEditingUser({ ...editingUser, translationCount: parseInt(e.target.value) || 0 })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button"
                  className="filter-btn" 
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                  onClick={() => { setShowEditMemberModal(false); setEditingUser(null); }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button" 
                  className="submit-btn" 
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
                  onClick={handleSaveEditedMember}
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} id="sidebar">
        <div>
          <div className="logo-area" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="logo-icon" style={{ overflow: 'hidden', background: 'transparent', boxShadow: 'none' }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white', borderRadius: '12px' }}><span style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>学</span></div>
              </div>
              <span className="logo-text">Sino<span>Learn</span></span>
            </div>
            <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <nav className="nav-links">
            <button 
              className={`nav-btn ${tab === 'dictionary' ? 'active' : ''}`} 
              onClick={() => { setTab('dictionary'); setIsSidebarOpen(false); }}
              id="nav-dict-btn"
            >
              <BookOpen />
              <span>Từ điển & Dịch</span>
            </button>
            <button 
              className={`nav-btn ${tab === 'flashcards' ? 'active' : ''}`} 
              onClick={() => {
                setTab('flashcards');
                setCardFlipped(false);
                setShowDeckDashboard(true);
              }}
              id="nav-flashcards-btn"
            >
              <Layers />
              <span>Thẻ ghi nhớ</span>
            </button>
            <button 
              className={`nav-btn ${tab === 'settings' ? 'active' : ''}`} 
              onClick={() => { setTab('settings'); setIsSidebarOpen(false); }}
              id="nav-settings-btn"
            >
              <HelpCircle />
              <span>Giới thiệu</span>
            </button>
            {userProfile?.role === 'admin' && (
              <button 
                className={`nav-btn ${tab === 'admin' ? 'active' : ''}`} 
                onClick={() => { setTab('admin'); setIsSidebarOpen(false); }}
                id="nav-admin-btn"
              >
                <ClipboardList />
                <span>Quản trị viên</span>
              </button>
            )}
          </nav>
        </div>
        
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="theme-toggle-btn" onClick={toggleTheme} id="themeToggle">
            {theme === 'dark' ? <Sun className="light-icon" /> : <Moon className="dark-icon" />}
            <span className="theme-text">Chế độ {theme === 'dark' ? 'sáng' : 'tối'}</span>
          </button>
          <button className="theme-toggle-btn" onClick={handleLogout} style={{ borderColor: 'rgba(239, 68, 68, 0.25)', color: '#ef4444' }}>
            <Trash2 size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        {/* Header bar */}
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="header-breadcrumb">
            <span id="breadcrumbCurrent">
              {tab === 'dictionary' ? 'Từ điển & Dịch' : tab === 'flashcards' ? 'Thẻ ghi nhớ' : tab === 'admin' ? 'Quản trị viên' : 'Giới thiệu'}
            </span>
          </div>
          </div>
          <div className="header-actions">
            <div 
              className="language-indicator"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => {
                const nextPair = appLangPair === 'ZH-VI' ? 'EN-VI' : 'ZH-VI';
                setAppLangPair(nextPair);
                localStorage.setItem('appLangPair', nextPair);
                if (nextPair === 'EN-VI') {
                  setTranslateDirection('en-vi');
                } else {
                  setTranslateDirection('zh-vi');
                }
                setTransSource('');
                setAiTranslationResult(null);
              }}
              title="Nhấn để đổi ngôn ngữ (Trung-Việt / Anh-Việt)"
            >
              <span className="lang-tag font-bold">{appLangPair.split('-')[0]}</span>
              <ArrowRightLeft />
              <span className="lang-tag font-bold">{appLangPair.split('-')[1]}</span>
            </div>
            <div className="user-profile">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar">
                  {(userProfile?.displayName || user.displayName || user.email || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
              <span>{userProfile?.displayName || user.displayName || user.email}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Pane */}
        <div className="content-pane" style={{ overflow: 'visible' }}>
          <AnimatePresence mode="wait">
            {tab === 'dictionary' && (
              <motion.section
                key="dictionary"
                id="tab-dictionary"
                className="tab-content active"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ overflow: 'visible' }}
              >
              <div className="dictionary-grid" style={{ overflow: 'visible' }}>
                
                {/* Search & Quick Translate Panel */}
                <div 
                  className="dict-card search-card" 
                  id="search-vocab-card"
                  style={{ 
                    position: 'relative', 
                    zIndex: showSuggestionsDropdown ? 500 : 20,
                    overflow: 'visible'
                  }}
                >
                  <div className="card-header">
                    <h2 className="card-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>
                      <Search />
                      <span>Tra cứu <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>từ vựng</span></span>
                    </h2>
                    <span className="card-subtitle">
                      {appLangPair === 'EN-VI' ? 'Nhập tiếng Anh hoặc nghĩa Tiếng Việt' : 'Nhập chữ Hán, Pinyin, hoặc nghĩa Tiếng Việt'}
                    </span>
                  </div>
                  
                   <div 
                     className="search-input-wrapper" 
                     ref={searchContainerRef} 
                     style={{ 
                       position: 'relative',
                       zIndex: showSuggestionsDropdown ? 600 : 30
                     }}
                   >
                    {dictSearchLoading || isSuggesting ? (
                      <RefreshCw className="search-icon animate-spin text-primary" />
                    ) : (
                      <Search className="search-icon" />
                    )}
                    <input 
                      type="text" 
                      id="dictSearchInput" 
                      value={searchQuery}
                      onChange={(e) => handleDictSearchInput(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestionsDropdown(true);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={appLangPair === 'EN-VI' ? "Nhập tiếng Anh (gõ để nhận gợi ý trực tuyến)..." : "Nhập chữ Hán, Pinyin, nghĩa Việt..."}
                      autoComplete="off"
                      disabled={dictSearchLoading}
                    />
                    {searchQuery && !dictSearchLoading && (
                      <button className="clear-search-btn" style={{ display: 'flex' }} onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                        setShowSuggestionsDropdown(false);
                      }} id="clearSearch">
                        <X />
                      </button>
                    )}

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestionsDropdown && suggestions.length > 0 && (
                      <div className="suggestions-box" id="suggestionsBox">
                        <div className="suggestions-header">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Globe size={13} style={{ color: 'var(--color-primary)' }} />
                            {appLangPair === 'EN-VI' ? 'Gợi ý từ điển trực tuyến' : 'Gợi ý từ vựng'}
                          </span>
                          <span style={{ fontSize: '11px', opacity: 0.75 }}>
                            ↑ ↓ chọn • ↵ tra từ
                          </span>
                        </div>
                        {suggestions.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`suggestion-item ${selectedSuggestionIndex === idx ? 'active' : ''}`}
                            onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                            onClick={() => {
                              setSearchQuery(item.word);
                              setShowSuggestionsDropdown(false);
                              performSearch(item.word);
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', maxWidth: '60%' }}>
                              <span className="sugg-zh">
                                {highlightMatch(item.word, searchQuery)}
                              </span>
                              {item.pos && (
                                <span className="sugg-pos-badge">
                                  {formatPosTag(item.pos)}
                                </span>
                              )}
                              {item.pinyin && (
                                <span className="sugg-py">{item.pinyin}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              {(item.meaning || item.definition) && (
                                <div className="sugg-vi" title={item.meaning || item.definition}>
                                  {item.meaning || item.definition}
                                </div>
                              )}
                              {item.source === 'local' ? (
                                <span className="sugg-source-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                                  <Star size={11} /> Thẻ nhớ
                                </span>
                              ) : (
                                <span className="sugg-source-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: 'var(--color-primary)' }}>
                                  <Globe size={11} /> Trực tuyến
                                </span>
                              )}
                              <CornerDownLeft size={13} style={{ opacity: selectedSuggestionIndex === idx ? 0.9 : 0.3, color: 'var(--color-primary)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* AI Search Control Button */}
                  <div style={{ marginTop: '12px' }}>
                    <button 
                      className="btn-ai-search"
                      onClick={() => {
                        setShowSuggestionsDropdown(false);
                        performSearch(searchQuery);
                      }}
                      disabled={dictSearchLoading || !searchQuery.trim()}
                    >
                      {dictSearchLoading ? (
                        <>
                          <RefreshCw className="animate-spin" style={{ width: '14px', height: '14px' }} /> Đang tra cứu...
                        </>
                      ) : (
                        <>
                          <Lightbulb style={{ width: '14px', height: '14px' }} /> Tra Cứu Bằng AI ✨
                        </>
                      )}
                    </button>
                  </div>
                  

                </div>

                {/* Translator Panel */}
                <div className="dict-card translator-card" id="quick-translator-card">
                  <div className="card-header">
                    <h2 className="card-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>
                      <Languages />
                      <span>Dịch nhanh <span style={{ fontStyle: 'italic', color: 'var(--color-secondary)' }}>câu</span></span>
                    </h2>
                    <button className="swap-lang-btn" onClick={swapTranslate} id="swapTranslateDirection">
                      <span id="transDirectionLabel">
                        {translateDirection === 'zh-vi' ? 'Trung → Việt' : 
                         translateDirection === 'vi-zh' ? 'Việt → Trung' : 
                         translateDirection === 'en-vi' ? 'Anh → Việt' : 'Việt → Anh'}
                      </span>
                      <RefreshCw />
                    </button>
                  </div>
                  <div className="translator-inputs">
                    <div className="textarea-wrapper">
                      <textarea 
                        id="transSourceText" 
                        value={transSource}
                        onChange={(e) => setTransSource(e.target.value)}
                        placeholder={
                          translateDirection === 'zh-vi' ? "Nhập câu tiếng Trung cần dịch..." : 
                          translateDirection === 'vi-zh' ? "Nhập câu tiếng Việt cần dịch..." :
                          translateDirection === 'en-vi' ? "Nhập câu tiếng Anh cần dịch..." :
                          "Nhập câu tiếng Việt cần dịch..."
                        }
                      />
                      <div className="textarea-actions">
                        <button className="textarea-action-btn" onClick={() => speakChinese(transSource, translateDirection.startsWith('zh') ? 'zh-CN' : translateDirection.startsWith('en') ? 'en-US' : 'vi-VN')} id="speakSource" title="Phát âm văn bản gốc">
                          <Volume2 />
                        </button>
                        <button className="textarea-action-btn" onClick={() => setTransSource('')} id="clearTransSource" title="Xóa">
                          <Trash2 />
                        </button>
                      </div>
                    </div>

                    {/* AI Translation Button */}
                    <button 
                      className="btn-ai-translate"
                      onClick={handleAiTranslate}
                      disabled={aiTranslationLoading || !transSource.trim()}
                    >
                      {aiTranslationLoading ? (
                        <>
                          <RefreshCw className="animate-spin" style={{ width: '14px', height: '14px' }} /> Đang dịch...
                        </>
                      ) : (
                        <>
                          <Languages style={{ width: '14px', height: '14px' }} /> Dịch Bằng AI ✨
                        </>
                      )}
                    </button>

                    <div className="textarea-wrapper result-wrapper" style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '40px' }}>
                      {aiTranslationLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', gap: '8px', color: 'var(--color-primary)', width: '100%' }}>
                          <RefreshCw className="animate-spin" style={{ width: '18px', height: '18px' }} />
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>Trợ lý AI đang biên dịch...</span>
                        </div>
                      ) : aiTranslationResult ? (
                        <div style={{ textAlign: 'left', width: '100%' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.05em' }}>
                            DỊCH THUẬT AI ✨
                          </div>
                          <div id="transResultText" style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.4' }}>
                            {aiTranslationResult.translatedText}
                          </div>
                          {aiTranslationResult.pinyin && (
                            <div style={{ fontSize: '12px', color: '#8b5cf6', fontFamily: 'var(--font-mono)', marginBottom: '8px', background: 'rgba(139, 92, 246, 0.08)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                              {appLangPair === 'EN-VI' ? 'Phát âm' : 'Pinyin'}: {aiTranslationResult.pinyin}
                            </div>
                          )}
                          {aiTranslationResult.analysis && (
                            <div style={{ marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lightbulb style={{ width: '13px', height: '13px' }} /> Giải nghĩa từ vựng & ngữ pháp:
                              </div>
                              <div style={{ whiteSpace: 'pre-line', fontSize: '12px', lineHeight: '1.5' }}>{aiTranslationResult.analysis}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div id="transResultText" className="placeholder-text" style={{ textAlign: 'left' }}>
                          Kết quả dịch sẽ xuất hiện ở đây...
                        </div>
                      )}

                      {aiTranslationResult && !aiTranslationLoading && (
                        <div className="textarea-actions" style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '8px' }}>
                          <button className="textarea-action-btn" onClick={() => speakChinese(aiTranslationResult.translatedText, translateDirection.endsWith('zh') ? 'zh-CN' : translateDirection.endsWith('en') ? 'en-US' : 'vi-VN')} id="speakTransResult" title="Nghe phát âm kết quả">
                            <Volume2 />
                          </button>
                          <button className="textarea-action-btn" onClick={() => {
                            const textToCopy = aiTranslationResult.translatedText;
                            navigator.clipboard.writeText(textToCopy);
                            handleToast("📋 Đã sao chép kết quả dịch!");
                          }} id="copyTransResult" title="Sao chép kết quả">
                            <Copy />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search Results */}
                <div className="dict-card result-card full-width-card" id="searchResultCard" style={{ position: 'relative', minHeight: '180px' }}>
                  {dictSearchLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', gap: '16px', width: '100%' }}>
                      <RefreshCw className="animate-spin text-primary" style={{ width: '32px', height: '32px', color: 'var(--color-primary)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Trợ lý AI đang tra cứu từ điển...</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Đang tìm kiếm thông tin, phát âm pinyin và soạn câu ví dụ chi tiết.</p>
                      </div>
                      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <div className="animate-pulse" style={{ height: '14px', backgroundColor: 'var(--border-color)', borderRadius: '4px', width: '40%' }}></div>
                        <div className="animate-pulse" style={{ height: '14px', backgroundColor: 'var(--border-color)', borderRadius: '4px', width: '85%' }}></div>
                        <div className="animate-pulse" style={{ height: '14px', backgroundColor: 'var(--border-color)', borderRadius: '4px', width: '60%' }}></div>
                      </div>
                    </div>
                  ) : !dictResult ? (
                    <div className="empty-result-state" id="emptyResultState">
                      <Book className="empty-icon" />
                      <p>Nhập từ vựng vào thanh tìm kiếm hoặc chọn các từ gợi ý để xem chi tiết từ điển.</p>
                    </div>
                  ) : (
                    <div className="detailed-result-layout" id="detailedResultLayout">
                      <div className="word-main-header">
                        <div className="word-pronunciation-group" style={{ textAlign: 'left' }}>
                          <h1 className="chinese-word" id="resWord">{dictResult.word}</h1>
                          <div className="pinyin-audio">
                            <span className="pinyin-text" id="resPinyin">{dictResult.pinyin}</span>
                            <button className="audio-play-btn" onClick={() => speakChinese(dictResult.word, appLangPair === 'EN-VI' ? 'en-US' : 'zh-CN')} id="resAudioPlay" title="Nghe phát âm">
                              <Volume2 />
                            </button>
                          </div>
                        </div>
                        <div className="word-meta-info">
                          <span className="badge word-type" id="resType">{dictResult.type}</span>
                          <button className="action-btn-outline" onClick={() => handleAddDictItemToFlashcards(dictResult)} id="resAddToFlashcardBtn">
                            <Plus />
                            <span>Thêm vào thẻ nhớ</span>
                          </button>
                        </div>
                      </div>
                      
                      <hr className="divider" />
                      
                      <div className="word-meanings" style={{ textAlign: 'left' }}>
                        <h3 className="section-heading">Nghĩa của từ</h3>
                        <p className="meaning-text" id="resMeaning">{dictResult.meaning}</p>
                      </div>
                      
                      {/* Cụm từ kết hợp (Collocations) */}
                      {dictResult.collocations && dictResult.collocations.length > 0 && (
                        <div className="word-collocations" style={{ textAlign: 'left', marginTop: '20px' }}>
                          <h3 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layers size={16} style={{ color: 'var(--color-primary)' }} />
                            <span>Cụm từ kết hợp (Collocation)</span>
                          </h3>
                          <div className="collocation-grid">
                            {dictResult.collocations.map((col, idx) => (
                              <div key={idx} className="collocation-card">
                                <div className="collocation-header">
                                  <span className="collocation-text">{col.text}</span>
                                  <button 
                                    type="button"
                                    className="collocation-speak-btn"
                                    onClick={() => speakChinese(col.text, appLangPair === 'EN-VI' ? 'en-US' : 'zh-CN')}
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 size={12} />
                                  </button>
                                </div>
                                {(col.pinyin || (appLangPair === 'ZH-VI' && convertToPinyin(col.text))) && (
                                  <span className="collocation-py">
                                    {col.pinyin || convertToPinyin(col.text)}
                                  </span>
                                )}
                                <span className="collocation-meaning">{col.meaning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ví dụ minh họa - Giữ 1 ví dụ tiêu biểu */}
                      <div className="word-examples" style={{ textAlign: 'left', marginTop: '20px' }}>
                        <h3 className="section-heading">Ví dụ minh họa</h3>
                        <ul className="example-list" id="resExamplesList">
                          {dictResult.examples && dictResult.examples.length > 0 ? (
                            dictResult.examples.slice(0, 1).map((ex, i) => (
                              <li key={i} className="example-item">
                                <div className="ex-cn">{ex.cn}</div>
                                <div className="ex-pinyin" style={{ color: 'var(--color-primary)', fontSize: '13px', margin: '2px 0 4px 0', fontStyle: 'italic', opacity: 0.9 }}>
                                  {ex.pinyin || convertToPinyin(ex.cn)}
                                </div>
                                <div className="ex-vn">{ex.vn}</div>
                              </li>
                            ))
                          ) : (
                            <li className="placeholder-text">Chưa có câu ví dụ minh họa cho từ này.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.section>
          )}

          {/* TAB 2: FLASHCARDS */}
          {tab === 'flashcards' && (
            <motion.section
              key="flashcards"
              id="tab-flashcards"
              className="tab-content active"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="flashcards-layout">

                {showDeckDashboard ? (
                  <div className="deck-dashboard-view">
                    <div className="dashboard-intro-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Quản lý <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>bộ thẻ</span></h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Chọn một bộ thẻ để học tập hoặc tạo mới bộ thẻ khác</p>
                      </div>
                      <div className="add-deck-header-input" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          id="quickDeckInput" 
                          placeholder="Tên bộ thẻ mới..." 
                          style={{
                            padding: '10px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-btn)',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            outline: 'none'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                               const val = (e.target as HTMLInputElement).value.trim();
                               if (val) {
                                 if (decks.includes(val)) {
                                   setCustomAlertMsg('Bộ thẻ này đã tồn tại!');
                                   return;
                                 }
                                 setDecks(prev => [...prev, val]);
                                 setCurrentDeck(val);
                                 setShowDeckDashboard(false);
                                 setLmMode('flip');
                                 handleToast(`Đã tạo bộ thẻ: "${val}"`);
                                 (e.target as HTMLInputElement).value = '';
                               }
                            }
                          }}
                        />
                        <button 
                          className="add-deck-btn" 
                          onClick={() => {
                            const val = (document.getElementById('quickDeckInput') as HTMLInputElement)?.value.trim();
                            if (val) {
                              if (decks.includes(val)) {
                                  setCustomAlertMsg('Bộ thẻ này đã tồn tại!');
                                  return;
                              }
                              setDecks(prev => [...prev, val]);
                              setCurrentDeck(val);
                              setShowDeckDashboard(false);
                              setLmMode('flip');
                              handleToast(`Đã tạo bộ thẻ: "${val}"`);
                              const inp = document.getElementById('quickDeckInput') as HTMLInputElement;
                              if (inp) inp.value = '';
                            } else {
                              handleAddNewDeck();
                            }
                          }}
                        >
                          <Plus style={{ width: '15px', height: '15px' }} /> Tạo bộ mới
                        </button>
                        <button 
                          className="ai-extract-btn" 
                          onClick={() => {
                            setAiAddWordsTab('file');
                            setModalTargetDeck(currentDeck || decks[0] || 'Chung');
                            setShowAiAddWordsModal(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-btn)',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.35)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                          }}
                        >
                          <UploadCloud style={{ width: '15px', height: '15px' }} /> AI Nhận Diện Từ Tệp
                        </button>
                      </div>
                    </div>

                    {/* Decks Grid */}
                    <div className="decks-grid">
                      {/* Map Decks */}
                      {decks.map((deckName, idx) => {
                        const deckCards = vocabulary.filter(c => c.deck === deckName);
                        const total = deckCards.length;
                        const mastered = deckCards.filter(c => c.status === 'mastered').length;
                        const pct = total === 0 ? 0 : Math.round((mastered / total) * 100);
                        return (
                          <div 
                            key={idx} 
                            className="dict-card deck-dashboard-card" 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'space-between', 
                              padding: '20px',
                              borderRadius: '16px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              boxShadow: 'var(--shadow-sm)',
                              transition: 'all 0.25s ease',
                              position: 'relative' 
                            }}
                          >
                            <div>
                              {/* Card Header: Icon on Left, Badge & Actions on Right */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ 
                                  width: '38px', 
                                  height: '38px', 
                                  borderRadius: '10px', 
                                  background: 'rgba(99, 102, 241, 0.1)', 
                                  color: 'var(--color-primary)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}>
                                  <Layers style={{ width: '18px', height: '18px' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '12px', 
                                    fontSize: '12px', 
                                    fontWeight: '700', 
                                    backgroundColor: total > 0 ? 'rgba(13,148,136,0.1)' : 'var(--bg-input)', 
                                    color: total > 0 ? 'var(--color-secondary)' : 'var(--text-muted)' 
                                  }}>
                                    {total} thẻ
                                  </span>
                                  <button 
                                    className="deck-delete-btn" 
                                    style={{ 
                                      width: '30px', 
                                      height: '30px', 
                                      borderRadius: '8px', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      background: 'rgba(239, 68, 68, 0.08)', 
                                      color: '#ef4444',
                                      border: '1px solid rgba(239, 68, 68, 0.15)',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      zIndex: 10
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#ef4444';
                                      e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                      e.currentTarget.style.color = '#ef4444';
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmRemoveDeck(deckName);
                                    }}
                                    title="Xóa bộ thẻ"
                                  >
                                    <Trash2 style={{ width: '13px', height: '13px' }} />
                                  </button>
                                </div>
                              </div>

                              {/* Title & Description */}
                              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                                {deckName}
                              </h3>
                              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
                                {total > 0 ? `Bộ thẻ học tập gồm ${total} từ vựng.` : 'Chưa có thẻ từ vựng nào trong bộ này.'}
                              </p>
                              
                              {/* Progress Box */}
                              <div style={{ 
                                background: 'var(--bg-input)', 
                                padding: '10px 12px', 
                                borderRadius: '10px', 
                                marginBottom: '16px', 
                                border: '1px solid var(--border-color)' 
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                  <span>Tiến độ ghi nhớ</span>
                                  <span style={{ color: pct >= 80 ? '#10b981' : pct > 0 ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: '700' }}>
                                    {pct}% ({mastered}/{total})
                                  </span>
                                </div>
                                <div className="stat-progress-track" style={{ height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div 
                                    className="stat-progress-fill" 
                                    style={{ 
                                      width: `${pct}%`, 
                                      height: '100%', 
                                      borderRadius: '3px',
                                      background: pct >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))' 
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                              <button 
                                className="submit-btn" 
                                style={{ 
                                  width: '100%',
                                  padding: '10px 16px', 
                                  fontSize: '13px', 
                                  fontWeight: '600',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                                onClick={() => {
                                  setCurrentDeck(deckName);
                                  setCurrentFlashcardIndex(0);
                                  setCardFlipped(false);
                                  setShowDeckDashboard(false);
                                  setLmMode('flip');
                                }}
                              >
                                <Play style={{ width: '14px', height: '14px' }} /> Học ngay
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Interactive Create Deck Card */}
                      <div 
                        className="dict-card deck-dashboard-card" 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          border: '2px dashed var(--border-color)', 
                          background: 'transparent', 
                          cursor: 'pointer', 
                          minHeight: '220px',
                          borderRadius: '16px',
                          transition: 'all 0.2s ease',
                          padding: '24px'
                        }} 
                        onClick={handleAddNewDeck}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.03)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                            <Plus style={{ width: '22px', height: '22px' }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            Tạo bộ thẻ mới khác
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Back Button to return to dashboard */}
                    {lmMode !== 'print' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                        <button 
                          onClick={() => setShowDeckDashboard(true)} 
                          className="study-skip-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            fontFamily: 'var(--font-heading)',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <ArrowLeft style={{ width: '16px', height: '16px' }} /> Quay lại danh sách bộ thẻ
                        </button>
                      </div>
                    )}

                    {/* Stats Row */}
                    {lmMode !== 'print' && (
                      <div className="stats-panel">
                        <div className="stat-card" id="total-cards-stat">
                          <div className="stat-num" id="statTotal">{totalCards}</div>
                          <div className="stat-lbl">Tổng số thẻ</div>
                        </div>
                        <div className="stat-card color-blue" id="learning-cards-stat">
                          <div className="stat-num" id="statLearning">{learningCount}</div>
                          <div className="stat-lbl">Đang học</div>
                        </div>
                        <div className="stat-card color-green" id="mastered-cards-stat">
                          <div className="stat-num" id="statMastered">{masteredCount}</div>
                          <div className="stat-lbl">Đã thành thạo</div>
                        </div>
                        <div className="stat-progress-bar-wrapper" id="mastery-progress-stat">
                          <div className="stat-progress-labels">
                            <span>Tiến trình thành thạo</span>
                            <span id="statProgressPct">{pctProgress}%</span>
                          </div>
                          <div className="stat-progress-track">
                            <div className="stat-progress-fill" id="statProgressFill" style={{ width: `${pctProgress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Deck Management Bar */}
                    {lmMode !== 'print' && (
                      <div className="deck-management-bar" id="deckManagementBar">
                        <div className="deck-bar-left">
                          <Layers className="deck-icon" />
                          <label className="deck-bar-label">Bộ thẻ:</label>
                          <select 
                            id="deckSelector" 
                            className="deck-selector-dropdown"
                            value={currentDeck}
                            onChange={(e) => {
                              setCurrentDeck(e.target.value);
                              setCurrentFlashcardIndex(0);
                              setCardFlipped(false);
                            }}
                          >
                            {decks.map((deck, idx) => (
                              <option key={idx} value={deck}>{deck}</option>
                            ))}
                          </select>
                          <button id="addDeckBtn" className="add-deck-btn" onClick={handleAddNewDeck} title="Tạo bộ thẻ mới">
                            <Plus /> Tạo bộ mới
                          </button>
                        </div>
                        <div className="deck-badge-area" id="deckBadgeArea">
                          {decks.map((deck, idx) => {
                            const count = vocabulary.filter(c => c.deck === deck).length;
                            return (
                              <div 
                                key={idx} 
                                className={`deck-badge ${currentDeck === deck ? 'active' : ''}`}
                                onClick={() => {
                                  setCurrentDeck(deck);
                                  setCurrentFlashcardIndex(0);
                                  setCardFlipped(false);
                                }}
                              >
                                <span className="deck-badge-name">{deck}</span>
                                <span className="deck-badge-count">{count}</span>
                                <button 
                                  className="deck-delete-btn" 
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    marginLeft: '6px',
                                    padding: 0
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ef4444';
                                    e.currentTarget.style.color = 'white';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.color = '#ef4444';
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmRemoveDeck(deck);
                                  }}
                                  title="Xóa bộ thẻ"
                                >
                                  <Trash2 style={{ width: '11px', height: '11px' }} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Learning Mode Tabs */}
                    {lmMode !== 'print' && (
                      <div className="learning-mode-tabs-wrapper">
                        <div className="learning-mode-tabs" id="learningModeTabs">
                          <button className={`lm-tab ${lmMode === 'flip' ? 'active' : ''}`} onClick={() => setLmMode('flip')}>
                            <Layers /><span>Thẻ học</span>
                          </button>
                          <button className={`lm-tab ${lmMode === 'study' ? 'active' : ''}`} onClick={() => setLmMode('study')}>
                            <Pencil /><span>Học</span>
                          </button>
                          <button className={`lm-tab ${lmMode === 'fillin' ? 'active' : ''}`} onClick={() => setLmMode('fillin')}>
                            <Layers /><span>Điền từ</span>
                          </button>
                          <button className={`lm-tab ${lmMode === 'quiz' ? 'active' : ''}`} onClick={() => {
                            setLmMode('quiz');
                            generateQuizQuestions();
                          }}>
                            <ClipboardList /><span>Bài kiểm tra</span>
                          </button>
                          {appLangPair !== 'EN-VI' && (
                            <button className={`lm-tab ${lmMode === 'write' ? 'active' : ''}`} onClick={() => setLmMode('write')}>
                              <BookOpen style={{ width: '16px', height: '16px' }} /> Tập Viết
                            </button>
                          )}
                          <button className={`lm-tab ${lmMode === 'grammar' ? 'active' : ''}`} onClick={() => setLmMode('grammar')} style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                            <Pencil style={{ width: '16px', height: '16px' }} /> Ngữ pháp
                          </button>
                          {appLangPair !== 'EN-VI' && (
                            <button className={`lm-tab ${lmMode === 'print' ? 'active' : ''}`} onClick={() => setLmMode('print')} style={{ color: 'var(--color-secondary)' }}>
                              <Printer /><span>In PDF</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                {/* ===== MODE: THẺ HỌC (3D Flip) ===== */}
                {lmMode === 'flip' && (
                  <div className="learning-mode-panel active" id="mode-flip">
                    <div className="flashcard-viewer-container">
                      
                      {/* Front Side Display Customization Controls */}
                      <div className="flashcard-display-toggle-bar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginBottom: '14px'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          Mặt trước thẻ:
                        </span>
                        <div style={{
                          display: 'inline-flex',
                          padding: '3px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleFcFrontSide('target');
                              setCardFlipped(false);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '7px',
                              border: 'none',
                              fontSize: '12.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              backgroundColor: fcFrontSideMode === 'target' ? 'var(--color-primary)' : 'transparent',
                              color: fcFrontSideMode === 'target' ? '#ffffff' : 'var(--text-secondary)'
                            }}
                          >
                            {appLangPair === 'EN-VI' ? 'Tiếng Anh' : 'Tiếng Trung (Chữ Hán)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleFcFrontSide('vi');
                              setCardFlipped(false);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '7px',
                              border: 'none',
                              fontSize: '12.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              backgroundColor: fcFrontSideMode === 'vi' ? 'var(--color-primary)' : 'transparent',
                              color: fcFrontSideMode === 'vi' ? '#ffffff' : 'var(--text-secondary)'
                            }}
                          >
                            Tiếng Việt (Nghĩa)
                          </button>
                        </div>
                      </div>

                      <div className="flashcard-box-wrapper">
                        <div className="scene-3d">
                          <div 
                            className={`flashcard ${cardFlipped ? 'flipped' : ''}`} 
                            id="interactiveFlashcard"
                            onClick={() => setCardFlipped(!cardFlipped)}
                          >
                            {/* Card Front Face */}
                            <div className="card-face card-front">
                              <span className="card-side-tag">
                                Mặt trước ({fcFrontSideMode === 'target' ? (appLangPair === 'EN-VI' ? 'Tiếng Anh' : 'Tiếng Trung') : 'Tiếng Việt'})
                              </span>
                              
                              {fcFrontSideMode === 'target' ? (
                                <>
                                  <div className="card-character-lg" id="cardFrontChar">
                                    {currentCard ? currentCard.word : "空"}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="card-meaning-front" id="cardFrontMeaning" style={{
                                    fontSize: '30px',
                                    fontWeight: '800',
                                    color: 'var(--text-primary)',
                                    textAlign: 'center',
                                    maxWidth: '90%',
                                    lineHeight: '1.3'
                                  }}>
                                    {currentCard ? currentCard.meaning : "Trống"}
                                  </div>
                                  {currentCard?.type && (
                                    <div className="card-type-badge" style={{ marginTop: '8px' }}>
                                      {currentCard.type}
                                    </div>
                                  )}
                                </>
                              )}

                              <div className="card-hint">Nhấp vào thẻ hoặc nhấn <kbd>Space</kbd> để lật</div>
                            </div>

                            {/* Card Back Face */}
                            <div className="card-face card-back">
                              <span className="card-side-tag">
                                Mặt sau ({fcFrontSideMode === 'target' ? 'Tiếng Việt' : (appLangPair === 'EN-VI' ? 'Tiếng Anh' : 'Tiếng Trung')})
                              </span>

                              {fcFrontSideMode === 'target' ? (
                                <>
                                  <div className="card-pinyin-md" id="cardBackPinyin">
                                    {currentCard ? currentCard.pinyin : "Trống"}
                                  </div>
                                  <div className="card-meaning-md" id="cardBackMeaning">
                                    {currentCard ? currentCard.meaning : "Vui lòng thêm thẻ học mới"}
                                  </div>
                                  <div className="card-type-badge" id="cardBackType">
                                    {currentCard ? currentCard.type : "-"}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="card-character-lg" id="cardBackChar" style={{ fontSize: '42px', margin: '4px 0' }}>
                                    {currentCard ? currentCard.word : "空"}
                                  </div>
                                  <div className="card-pinyin-md" id="cardBackPinyin">
                                    {currentCard ? currentCard.pinyin : ""}
                                  </div>
                                </>
                              )}

                              <div className="card-example-box">
                                <div className="example-title">Ví dụ:</div>
                                <div className="example-cn" id="cardBackExCn">
                                  {currentCard && currentCard.examples && currentCard.examples.length > 0 ? currentCard.examples[0].cn : ""}
                                </div>
                                {currentCard && currentCard.examples && currentCard.examples.length > 0 && (
                                  <div className="example-pinyin" id="cardBackExPinyin" style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: '500', margin: '2px 0 4px 0', fontStyle: 'italic', opacity: 0.9 }}>
                                    {currentCard.examples[0].pinyin || (appLangPair === 'ZH-VI' ? convertToPinyin(currentCard.examples[0].cn) : '')}
                                  </div>
                                )}
                                <div className="example-vn" id="cardBackExVn">
                                  {currentCard && currentCard.examples && currentCard.examples.length > 0 ? currentCard.examples[0].vn : "Chưa có ví dụ."}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {currentCard && (
                          <div className="card-voice-float-ctrl">
                            <button 
                              className="voice-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                speakChinese(currentCard.word, appLangPair === 'EN-VI' ? 'en-US' : 'zh-CN');
                              }} 
                              id="cardSpeakBtn" 
                              title="Nghe phát âm"
                            >
                              <Volume2 />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="keyboard-shortcuts">
                        <div className="shortcut-item"><kbd>Space</kbd> / Nhấp thẻ để Lật</div>
                        <div className="shortcut-item"><kbd>←</kbd> Thẻ trước</div>
                        <div className="shortcut-item"><kbd>→</kbd> Thẻ tiếp theo</div>
                        <div className="shortcut-item"><kbd>Enter</kbd> Nghe phát âm</div>
                      </div>

                      <div className="card-navigation-actions">
                        <div className="deck-nav-controls">
                          <button className="round-nav-btn" onClick={handlePrevCard} id="prevCardBtn"><ArrowLeft /></button>
                          <span className="card-counter" id="cardCounter">
                            Thẻ {totalCards > 0 ? (currentFlashcardIndex % totalCards) + 1 : 0} / {totalCards}
                          </span>
                          <button className="round-nav-btn" onClick={handleNextCard} id="nextCardBtn"><ArrowRight /></button>
                          <button className="round-nav-btn" onClick={handleShuffleDeck} id="shuffleDeckBtn"><Shuffle /></button>
                        </div>
                        {currentCard && (
                          <div className="deck-learning-actions">
                            <button className="status-btn learning-btn" onClick={() => handleMarkStatus('learning')} id="markLearningBtn">
                              <AlertCircle /><span>Cần ôn lại</span>
                            </button>
                            <button className="status-btn mastered-btn" onClick={() => handleMarkStatus('mastered')} id="markMasteredBtn">
                              <CheckCircle /><span>Đã thuộc</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== MODE: HỌC (Type Answer) ===== */}
                {lmMode === 'study' && (
                  <div className="learning-mode-panel active" id="mode-study">
                    <div className="study-mode-outer">
                      <div className="study-progress-bar-wrap">
                        <div className="study-prog-labels">
                          <span>Đã hoàn thành: <strong id="studyDoneCount">{studyCorrect}</strong> / <strong id="studyTotalCount">{studyQueue.length}</strong></span>
                          <span>Câu hỏi: <strong id="studyQCount">{studyQueue.length > 0 ? (studyIndex % studyQueue.length) + 1 : 0}</strong> / <strong id="studyQTotal">{studyQueue.length}</strong></span>
                        </div>
                        <div className="stat-progress-track">
                          <div className="stat-progress-fill" id="studyProgressFill" style={{ width: studyQueue.length > 0 ? `${(studyCorrect / studyQueue.length) * 100}%` : '0%' }}></div>
                        </div>
                      </div>
                      
                      <div className="study-card-wrapper dict-card">
                        {studyQueue.length > 0 ? (
                          <>
                            <div className="study-top-actions">
                              <button className="icon-small-btn" onClick={() => speakChinese(studyQueue[studyIndex % studyQueue.length].word, appLangPair === 'EN-VI' ? 'en-US' : 'zh-CN')} id="studySpeakBtn" title="Nghe phát âm">
                                <Volume2 />
                              </button>
                              <button className="icon-small-btn" onClick={() => setStudyShowHint(!studyShowHint)} id="studyToggleHint" title="Xem định nghĩa">
                                <Eye />
                              </button>
                              <button className="icon-small-btn" onClick={handleStudyStar} id="studyStarBtn" title="Đổi trạng thái thẻ vựng">
                                <Star />
                              </button>
                            </div>
                            <div className="study-word-display" id="studyWordDisplay">
                              {studyQueue[studyIndex % studyQueue.length].word}
                            </div>
                            <div className="study-meta">
                              <span className="badge word-type" id="studyTypeTag">
                                {studyQueue[studyIndex % studyQueue.length].type}
                              </span>
                              <span className="study-pinyin-sep">·</span>
                              <span className="study-pinyin-hint" id="studyPinyinHint">
                                {studyQueue[studyIndex % studyQueue.length].pinyin}
                              </span>
                            </div>
                            
                            {studyShowHint && (
                              <div className="study-hint-box" id="studyHintBox">
                                <Eye />
                                <span id="studyHintText">{studyQueue[studyIndex % studyQueue.length].meaning}</span>
                              </div>
                            )}

                            <div className="study-input-row">
                              <input 
                                type="text" 
                                id="studyAnswerInput" 
                                className="study-answer-input" 
                                value={studyAnswer}
                                onChange={(e) => setStudyAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (!studyChecked) handleCheckStudy();
                                    else handleStudyNext();
                                  }
                                }}
                                disabled={studyChecked}
                                placeholder="Nhập câu trả lời bằng nghĩa tiếng Việt..." 
                              />
                            </div>

                            {studyFeedback && (
                              <div className={`study-result-feedback ${studyFeedback.correct ? 'correct' : 'wrong'}`} id="studyResultFeedback">
                                <span className="feedback-icon" id="studyFeedbackIcon">
                                  {studyFeedback.correct ? '✓' : '✗'}
                                </span>
                                <span id="studyFeedbackText">{studyFeedback.text}</span>
                              </div>
                            )}

                            <div className="study-action-btns">
                              <button className="study-check-btn" onClick={handleCheckStudy} id="studyCheckBtn">
                                <Check /> Kiểm tra
                              </button>
                              <button className="study-skip-btn" onClick={handleStudySkip} id="studySkipBtn">Tôi không biết</button>
                            </div>

                            {studyChecked && (
                              <div className="study-next-row" id="studyNextRow">
                                <button className="study-next-btn" onClick={handleStudyNext} id="studyNextBtn">
                                  <ArrowRight /> Tiếp theo
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="empty-result-state">
                            <Layers className="empty-icon" />
                            <p>Không có thẻ nào trong bộ này để học. Vui lòng thêm từ mới hoặc đổi bộ thẻ!</p>
                          </div>
                        )}
                      </div>
                      {studyQueue.length > 0 && (
                        <div className="study-counter-label" id="studyCounterLabel">
                          Câu hỏi {(studyIndex % studyQueue.length) + 1} / {studyQueue.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== MODE: ĐIỀN TỪ (Fill in the Blank) ===== */}
                {lmMode === 'fillin' && (
                  <div className="learning-mode-panel active" id="mode-fillin">
                    <div className="study-mode-outer">
                      <div className="study-progress-bar-wrap">
                        <div className="study-prog-labels">
                          <span>Câu hỏi: <strong id="fillinQLabel">{fillinQueue.length > 0 ? fillinIndex + 1 : 0} / {fillinQueue.length}</strong></span>
                          <span id="fillinScoreLabel">Đúng: {fillinRight} | Sai: {fillinWrong}</span>
                        </div>
                        <div className="stat-progress-track">
                          <div className="stat-progress-fill" id="fillinProgressFill" style={{ width: fillinQueue.length > 0 ? `${(fillinIndex / fillinQueue.length) * 100}%` : '0%' }}></div>
                        </div>
                      </div>

                      <div className="fillin-card dict-card">
                        {fillinQueue.length > 0 ? (
                          <>
                            <div className="fillin-top">
                              <span className="fillin-mode-label">Điền từ vào chỗ trống</span>
                              <button className="icon-small-btn" onClick={() => speakChinese(fillinQueue[fillinIndex].example.cn, appLangPair === 'EN-VI' ? 'en-US' : 'zh-CN')} id="fillinSpeakBtn" title="Nghe câu mẫu">
                                <Volume2 />
                              </button>
                            </div>
                            
                            <div className="fillin-sentence" id="fillinSentence" style={{ justifyContent: 'center' }}>
                              <span>{fillinQueue[fillinIndex].example.cn.substring(0, fillinQueue[fillinIndex].example.cn.indexOf(fillinQueue[fillinIndex].card.word))}</span>
                              <span className={`fillin-blank ${fillinChecked ? (fillinFeedback?.correct ? 'correct-fill' : 'wrong-fill') : ''}`} id="fillinBlankSpan">
                                {fillinChecked ? fillinQueue[fillinIndex].card.word : '___'}
                              </span>
                              <span>{fillinQueue[fillinIndex].example.cn.substring(fillinQueue[fillinIndex].example.cn.indexOf(fillinQueue[fillinIndex].card.word) + fillinQueue[fillinIndex].card.word.length)}</span>
                            </div>

                            <div className="fillin-hint-vn" id="fillinHintVn">
                              Nghĩa: {fillinQueue[fillinIndex].example.vn}
                            </div>

                            <div className="study-input-row">
                              <input 
                                type="text" 
                                id="fillinInput" 
                                className="study-answer-input" 
                                value={fillinAnswer}
                                onChange={(e) => setFillinAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (!fillinChecked) handleCheckFillin();
                                    else handleFillinNext();
                                  }
                                }}
                                disabled={fillinChecked}
                                placeholder="Điền chữ Hán còn thiếu..." 
                              />
                            </div>

                            {fillinFeedback && (
                              <div className={`study-result-feedback ${fillinFeedback.correct ? 'correct' : 'wrong'}`} id="fillinFeedback">
                                <span className="feedback-icon" id="fillinFeedbackIcon">
                                  {fillinFeedback.correct ? '✓' : '✗'}
                                </span>
                                <span id="fillinFeedbackText">{fillinFeedback.text}</span>
                              </div>
                            )}

                            <div className="study-action-btns">
                              <button className="study-check-btn" onClick={handleCheckFillin} id="fillinCheckBtn">
                                <Check /> Kiểm tra
                              </button>
                              <button className="study-skip-btn" onClick={handleFillinSkip} id="fillinSkipBtn">Bỏ qua</button>
                            </div>

                            {fillinChecked && (
                              <div className="study-next-row" id="fillinNextRow">
                                <button className="study-next-btn" onClick={handleFillinNext} id="fillinNextBtn">
                                  <ArrowRight /> Tiếp theo
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="empty-result-state">
                            <Layers className="empty-icon" />
                            <p>Không có câu ví dụ điền từ nào trong bộ thẻ hiện tại. Hãy thêm thẻ mới có chứa ví dụ!</p>
                          </div>
                        )}
                      </div>
                      {fillinQueue.length > 0 && (
                        <div className="study-counter-label" id="fillinCounter">
                          Câu hỏi {fillinIndex + 1} / {fillinQueue.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== MODE: BÀI KIỂM TRA (Quiz) ===== */}
                {lmMode === 'quiz' && (
                  <div className="learning-mode-panel active" id="mode-quiz">
                    <div className="quiz-container">
                      <div className="quiz-header-bar">
                        <div className="quiz-controls-left">
                          <label className="quiz-label">Hình thức:</label>
                          <select 
                            id="quizFormatSelect" 
                            className="quiz-select"
                            value={quizFormat}
                            onChange={(e) => setQuizFormat(e.target.value as any)}
                          >
                            <option value="mixed">Bài kiểm tra (Trắc nghiệm + Tự viết)</option>
                            <option value="write">Chỉ tự nhập định nghĩa</option>
                            <option value="mc">Chỉ câu hỏi trắc nghiệm</option>
                          </select>
                          <button className="study-check-btn" onClick={generateQuizQuestions} id="quizStartBtn">
                            <Play /> Bắt đầu
                          </button>
                        </div>
                        <div className="quiz-score-label">
                          Tổng câu hỏi: <strong id="quizTotalLabel">{quizQuestions.length}</strong> | Đã làm: <strong id="quizAnsweredLabel">{quizAnsweredCount}</strong>/<strong id="quizTotalLabel2">{quizQuestions.length}</strong>
                        </div>
                      </div>

                      <div id="quizQuestionsArea" className="quiz-questions-area">
                        {quizQuestions.length > 0 ? (
                          quizQuestions.map((q, idx) => (
                            <div 
                              key={idx} 
                              className={`quiz-question-card ${
                                quizGraded || q.answered ? (q.correct ? 'answered-correct' : 'answered-wrong') : ''
                              }`} 
                              id={`quiz-q-${idx}`}
                            >
                              <div className="quiz-q-header">
                                <div className="quiz-q-num">{idx + 1}</div>
                                <span className={`quiz-q-type-badge ${q.type === 'write' ? 'type-write' : 'type-mc'}`}>
                                  {q.type === 'write' ? 'Tự viết' : 'Trắc nghiệm'}
                                </span>
                              </div>
                              <div className="quiz-word-display">{q.card.word}</div>
                              <div className="quiz-pinyin-display">{q.card.pinyin}</div>
                              
                              {q.type === 'write' ? (
                                <input 
                                  type="text" 
                                  className="quiz-write-input" 
                                  id={`quiz-input-${idx}`} 
                                  disabled={quizGraded}
                                  placeholder="Nhập nghĩa tiếng Việt..." 
                                />
                              ) : (
                                <div className="quiz-mc-options">
                                  {q.options?.map((opt, oi) => {
                                    const correctOpt = q.options?.findIndex(o => o.word === q.card.word);
                                    const isSelected = q.answered && oi === correctOpt; // just showing validation helper
                                    return (
                                      <button 
                                        key={oi}
                                        className={`quiz-mc-option ${
                                          q.answered && q.correct === true && oi === correctOpt ? 'selected-correct' : ''
                                        } ${
                                          q.answered && q.correct === false && oi === correctOpt ? 'is-correct-reveal' : ''
                                        }`}
                                        disabled={q.answered || quizGraded}
                                        onClick={() => handleSelectMCOption(idx, oi)}
                                      >
                                        {opt.meaning}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {(quizGraded || q.answered) && (
                                <div className="quiz-feedback-inline show" id={`quiz-fb-${idx}`} style={{
                                  color: q.correct ? '#059669' : '#dc2626', fontWeight: 600
                                }}>
                                  {q.correct ? '✓ Chính xác!' : `✗ Chưa chính xác. Đáp án đúng: ${q.card.meaning}`}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="empty-result-state">
                            <ClipboardList className="empty-icon" />
                            <p>Cần ít nhất 2 thẻ ghi nhớ để tạo bài kiểm tra tự động. Hãy nhấn "Bắt đầu"!</p>
                          </div>
                        )}
                      </div>

                      {quizQuestions.length > 0 && !quizGraded && (
                        <div className="quiz-submit-row" id="quizSubmitRow">
                          <button className="study-check-btn" onClick={gradeQuiz} id="quizSubmitBtn">
                            <CheckSquare /> Nộp bài và chấm điểm
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== MODE: LUYỆN VIẾT (HanziWriter Stroke Order) ===== */}
                {lmMode === 'write' && (
                  <div className="learning-mode-panel active" id="mode-write">
                    <div className="hw-container">
                      <div className="hw-header">
                        <div className="hw-word-nav">
                          <button className="hw-nav-btn" onClick={handleHwPrev} id="hwPrevBtn" title="Từ trước">
                            <ArrowLeft />
                          </button>
                          
                          <div className="hw-word-info">
                            <span className="hw-word-display" id="hwWordDisplay">
                              {deckVocab.length > 0 ? deckVocab[hwWordIndex % deckVocab.length].word : "学习"}
                            </span>
                            <div className="hw-word-meta">
                              <span className="hw-pinyin-disp" id="hwPinyinDisp">
                                {deckVocab.length > 0 ? deckVocab[hwWordIndex % deckVocab.length].pinyin : "xuéxí"}
                              </span>
                              <span className="hw-dot">·</span>
                              <span className="hw-meaning-disp" id="hwMeaningDisp">
                                {deckVocab.length > 0 ? deckVocab[hwWordIndex % deckVocab.length].meaning : "Học tập"}
                              </span>
                            </div>
                          </div>

                          <button className="hw-nav-btn" onClick={handleHwNext} id="hwNextBtn" title="Từ tiếp theo">
                            <ArrowRight />
                          </button>
                          <button 
                            className="hw-speak-btn" 
                            onClick={() => {
                              if (deckVocab.length > 0) speakChinese(deckVocab[hwWordIndex % deckVocab.length].word, appLangPair === 'EN-VI' ? 'en-US' : 'zh-CN');
                            }} 
                            id="hwSpeakBtn" 
                            title="Nghe phát âm"
                          >
                            <Volume2 />
                          </button>
                        </div>

                        {/* Character selector tabs */}
                        {deckVocab.length > 0 && deckVocab[hwWordIndex % deckVocab.length].word.length > 1 && (
                          <div className="hw-char-tabs" id="hwCharTabs">
                            {deckVocab[hwWordIndex % deckVocab.length].word.split('').map((ch, i) => (
                              <button 
                                key={i}
                                className={`hw-char-tab-btn ${i === hwCharIndex ? 'active' : ''}`}
                                onClick={() => setHwCharIndex(i)}
                              >
                                {ch}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stroke Progress fill */}
                      <div className="hw-stroke-progress-bar">
                        <div 
                          className="hw-stroke-progress-fill" 
                          id="hwStrokeProgressFill" 
                          style={{
                            width: hwTotalStrokes > 0 ? `${(hwCurrentStrokeNum / hwTotalStrokes) * 100}%` : '0%'
                          }}
                        />
                      </div>

                      {/* Canvas Panel */}
                      <div className="hw-panels">
                        <div className="hw-panel hw-demo-panel">
                          <div className="hw-panel-label"><Eye /> Chữ mẫu</div>
                          <div className="hw-canvas-frame">
                            <div className="hw-grid-overlay">
                              <div ref={demoRef} id="hw-demo-svg" className="hw-svg-area"></div>
                            </div>
                          </div>
                          <button className="hw-animate-btn" onClick={handleHwAnimate} id="hwAnimateBtn">
                            <Play /> Xem nét vẽ
                          </button>
                        </div>

                        <div className="hw-panel hw-quiz-panel">
                          <div className="hw-panel-label"><PenTool /> Vùng luyện viết</div>
                          <div className="hw-canvas-frame">
                            <div className="hw-grid-overlay">
                              <div ref={quizRef} id="hw-quiz-svg" className="hw-svg-area"></div>
                            </div>
                          </div>
                          <div className="hw-stroke-indicator">
                            Nét <span id="hwCurrentStroke">{Math.min(hwCurrentStrokeNum + 1, hwTotalStrokes)}</span> / <span id="hwTotalStrokes">{hwTotalStrokes || '?'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="hw-stats-row">
                        <div className="hw-stat-box">
                          <div className="hw-stat-val" id="hwCorrectStrokes">{hwCorrectStrokes}</div>
                          <div className="hw-stat-lbl">Đúng nét</div>
                        </div>
                        <div className="hw-stat-box hw-stat-wrong">
                          <div className="hw-stat-val" id="hwMistakeCount">{hwMistakes}</div>
                          <div className="hw-stat-lbl">Lỗi nộp</div>
                        </div>
                        <div className="hw-stat-box hw-stat-pct">
                          <div className="hw-stat-val" id="hwAccuracy">{hwAccuracy}</div>
                          <div className="hw-stat-lbl">Độ chính xác</div>
                        </div>
                      </div>

                      {/* Feedbacks */}
                      {hwFeedback && (
                        <div className={`hw-feedback hw-feedback-${hwFeedback.type} show`} id="hwFeedback">
                          {hwFeedback.text}
                        </div>
                      )}

                      <div className="hw-action-row">
                        <button className="hw-btn hw-btn-secondary" onClick={handleHwReset} id="hwResetBtn">
                          <RotateCcw /> Viết lại từ đầu
                        </button>
                        <button className="hw-btn hw-btn-hint" onClick={handleHwHint} id="hwHintBtn">
                          <Lightbulb /> Gợi ý nét
                        </button>
                        <button className="hw-btn hw-btn-pdf" onClick={() => setLmMode('print')} style={{ background: 'var(--color-secondary)', color: 'white' }} id="hwPrintBtn">
                          <Printer /> Tạo phiếu in PDF
                        </button>
                        <button className="hw-btn hw-btn-primary" onClick={handleHwNext} id="hwNextWordBtn">
                          <ArrowRight /> Chữ tiếp theo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                
                {/* ===== MODE: NGỮ PHÁP (AI Grammar) ===== */}
                {lmMode === 'grammar' && (
                  <div className="learning-mode-panel active" id="mode-grammar" style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-color)', minHeight: '300px' }}>
                    
                    <div className="quiz-header-bar" style={{ marginBottom: '20px' }}>
                      <div className="quiz-controls-left">
                        <label className="quiz-label">Hình thức:</label>
                        <select 
                          className="quiz-select"
                          value={grammarFormat}
                          onChange={(e) => setGrammarFormat(e.target.value as any)}
                        >
                          <option value="mixed">Bài tập hỗn hợp</option>
                          <option value="scramble">Sắp xếp từ</option>
                          <option value="fill_in">Điền từ</option>
                          <option value="compose">Tự đặt câu</option>
                        </select>
                        <button className="study-check-btn" onClick={generateBatchGrammarExercises} disabled={grammarLoading}>
                          {grammarLoading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                          Bắt đầu
                        </button>
                      </div>
                      <div className="quiz-score-label">
                        Tổng số câu: <strong>{grammarQuestions.length}</strong>
                      </div>
                    </div>

                    {!grammarLoading && grammarQuestions.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 16px', maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                          <MessageSquare size={28} />
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Luyện tập <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>Ngữ pháp</span> với AI</h2>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                          Chọn hình thức và bấm Bắt đầu để AI tạo câu hỏi ngữ pháp cho các từ trong bộ thẻ của bạn.
                        </p>
                      </div>
                    )}

                    {grammarLoading && (
                      <div className="grammar-loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>AI đang phân tích và tạo bài tập cho bạn...</p>
                      </div>
                    )}

                    {!grammarLoading && grammarQuestions.length > 0 && (
                      <div className="quiz-questions-area" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {grammarQuestions.map((q, qIdx) => {
                          const feedback = grammarFeedbacks[qIdx];
                          const answer = grammarAnswers[qIdx];
                          const isChecking = grammarChecking[qIdx];
                          
                          return (
                            <div key={qIdx} className="quiz-question-card" style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                              <div className="quiz-q-header" style={{ marginBottom: '16px' }}>
                                <div className="quiz-q-num" style={{ background: 'var(--color-primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{qIdx + 1}</div>
                                <span className="quiz-q-type-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' }}>
                                  {q.type === 'scramble' ? 'Sắp xếp từ' : q.type === 'fill_in' ? 'Điền từ' : 'Tự đặt câu'}
                                </span>
                              </div>

                              {/* SCRAMBLE EXERCISE */}
                              {q.type === 'scramble' && (
                                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '12px' }}>
                                  <p style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '16px' }}>
                                    "{q.vietnamese}"
                                  </p>
                                  
                                  <div style={{ minHeight: '60px', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '2px dashed var(--border-color)', marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {(answer || []).map((index: number, idx: number) => (
                                      <div key={idx} onClick={() => toggleGrammarScrambleWord(qIdx, index)} style={{ padding: '8px 16px', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}>
                                        {q.scrambledWords[index]}
                                      </div>
                                    ))}
                                    {(!answer || answer.length === 0) && <span style={{ color: 'var(--text-muted)' }}>Bấm vào các từ bên dưới để ghép câu...</span>}
                                  </div>

                                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                    {q.scrambledWords.map((word: string, index: number) => {
                                      const isSelected = (answer || []).includes(index);
                                      return (
                                        <button
                                          key={index}
                                          onClick={() => toggleGrammarScrambleWord(qIdx, index)}
                                          disabled={isSelected || feedback}
                                          style={{
                                            padding: '10px 20px',
                                            fontSize: '18px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: isSelected ? 'var(--bg-card)' : 'white',
                                            color: isSelected ? 'transparent' : 'var(--text-primary)',
                                            cursor: isSelected || feedback ? 'default' : 'pointer',
                                            boxShadow: isSelected ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                                          }}
                                        >
                                          {word}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {!feedback && (
                                    <button className="submit-btn" style={{ padding: '10px 20px' }} onClick={() => checkSingleGrammarQuestion(qIdx)} disabled={(answer || []).length !== q.scrambledWords.length}>
                                      Kiểm tra
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* FILL IN EXERCISE */}
                              {q.type === 'fill_in' && (
                                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '12px' }}>
                                  <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Nghĩa: "{q.vietnamese}"</p>
                                  <p style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '20px', lineHeight: '1.5' }}>
                                    {q.sentence.split('___').map((part: string, idx: number, arr: any[]) => (
                                      <span key={idx}>
                                        {part}
                                        {idx < arr.length - 1 && (
                                          <span style={{ 
                                            display: 'inline-block', minWidth: '60px', borderBottom: '2px solid var(--color-primary)', 
                                            margin: '0 8px', textAlign: 'center', color: 'var(--color-primary)' 
                                          }}>
                                            {answer || ' ? '}
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </p>
                                  <div className="quiz-mc-options" style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
                                    {q.options.map((opt: string, idx: number) => {
                                      const isSelected = answer === opt;
                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => handleGrammarAnswerChange(qIdx, opt)}
                                          disabled={!!feedback}
                                          style={{
                                            padding: '12px',
                                            fontSize: '18px',
                                            borderRadius: '8px',
                                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                            background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
                                            color: 'var(--text-primary)',
                                            fontWeight: isSelected ? '600' : '400',
                                          }}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {!feedback && (
                                    <button className="submit-btn" style={{ padding: '10px 20px' }} onClick={() => checkSingleGrammarQuestion(qIdx)} disabled={!answer}>
                                      Kiểm tra
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* COMPOSE EXERCISE */}
                              {q.type === 'compose' && (
                                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '12px' }}>
                                  <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Hãy đặt một câu sử dụng các từ sau:</p>
                                  
                                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    {q.wordsToUse.map((word: string, idx: number) => (
                                      <span key={idx} style={{ padding: '8px 16px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', borderRadius: '8px', fontSize: '18px', fontWeight: '600' }}>
                                        {word}
                                      </span>
                                    ))}
                                  </div>
                                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', fontStyle: 'italic' }}>
                                    (Gợi ý nghĩa: {q.hints})
                                  </p>
                                  <textarea
                                    value={answer || ''}
                                    onChange={(e) => handleGrammarAnswerChange(qIdx, e.target.value)}
                                    disabled={!!feedback || isChecking}
                                    placeholder="Nhập câu của bạn vào đây..."
                                    style={{
                                      width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px',
                                      border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                                      color: 'var(--text-primary)', fontSize: '18px', fontFamily: 'var(--font-body)',
                                      outline: 'none', resize: 'vertical', marginBottom: '16px'
                                    }}
                                  />
                                  {!feedback && (
                                    <button className="submit-btn" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => checkSingleGrammarQuestion(qIdx)} disabled={!(answer || '').trim() || isChecking}>
                                      {isChecking && <Loader2 className="animate-spin" size={16} />}
                                      Nhờ AI kiểm tra
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* FEEDBACK SECTION */}
                              {feedback && (
                                <div style={{ marginTop: '16px', padding: '16px', background: feedback.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: `1px solid ${feedback.isCorrect ? '#10b981' : '#ef4444'}`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: feedback.isCorrect ? '#10b981' : '#ef4444' }}>
                                    {feedback.isCorrect ? <CheckCircle size={28} /> : <XCircle size={28} />}
                                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                                      {feedback.isCorrect ? (feedback.score > 0 ? `Tuyệt vời! (${feedback.score}/100 điểm)` : 'Tuyệt vời!') : 'Chưa chính xác'}
                                    </h3>
                                  </div>
                                  <p style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                                    {feedback.feedback}
                                  </p>
                                  
                                  {feedback.correctedSentence && (
                                    <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Câu tham khảo:</p>
                                      <p style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '4px' }}>{feedback.correctedSentence}</p>
                                      {feedback.correctedPinyin && <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>{feedback.correctedPinyin}</p>}
                                    </div>
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ===== MODE: IN PHIẾU LUYỆN VIẾT PDF ===== */}
                {lmMode === 'print' && (() => {
                  const pool = getVocabForCurrentDeck();
                  const selectedItems = pool.filter(item => selectedPrintWords.includes(item.word));
                  const colsPerRow = Math.max(4, Math.floor(180 / printCellSize));
                  
                  return (
                    <div className="print-setup-workspace animate-fade-in" id="print-setup-workspace">
                      {/* PDF Print Page Navigation Control Bar */}
                      <div className="print-setup-header no-print">
                        <button className="print-back-btn" onClick={() => setLmMode('write')}>
                          <ArrowLeft style={{ width: '16px', height: '16px' }} />
                          <span>Quay lại luyện viết</span>
                        </button>
                        <div className="print-setup-header-actions">
                          <button className="print-action-btn print-action-btn-primary" onClick={handlePrint}>
                            <Printer style={{ width: '16px', height: '16px' }} />
                            <span>In phiếu</span>
                          </button>
                          <button className="print-action-btn print-action-btn-secondary" onClick={handleDownloadPdf}>
                            <Download style={{ width: '16px', height: '16px' }} />
                            <span>Tải PDF (A4)</span>
                          </button>
                        </div>
                      </div>

                      <div className="print-workspace-container">
                        {/* Left Settings Sidebar (Hidden on Print) */}
                        <div className="print-sidebar no-print">
                          <div className="print-card settings-card">
                            <h3 className="print-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600', margin: 0 }}><Layers style={{ width: '18px', height: '18px', color: 'var(--color-primary)' }} /> Cấu hình phiếu luyện viết</h3>
                            <p className="print-card-subtitle" style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 16px 0', lineHeight: '1.4' }}>
                              Cỡ ô lớn hơn sẽ tự giảm số chữ trên một hàng. Hiện tại: <strong style={{ color: 'var(--color-primary)' }}>{colsPerRow} ô/hàng</strong>.
                            </p>

                            <div className="print-setting-item" style={{ marginBottom: '14px' }}>
                              <label className="print-setting-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                                <span>Số hàng viết mỗi chữ:</span>
                                <span className="print-setting-val" style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>{printRowsPerChar} hàng</span>
                              </label>
                              <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                value={printRowsPerChar}
                                onChange={(e) => setPrintRowsPerChar(parseInt(e.target.value) || 1)}
                                className="print-setting-slider"
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                              />
                            </div>

                            <div className="print-setting-item" style={{ marginBottom: '14px' }}>
                              <label className="print-setting-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                                <span>Cỡ ô/chữ viết (mm):</span>
                                <span className="print-setting-val" style={{ fontWeight: '600', color: 'var(--color-secondary)' }}>{printCellSize} mm</span>
                              </label>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input 
                                  type="range" 
                                  min="10" 
                                  max="24" 
                                  value={printCellSize}
                                  onChange={(e) => setPrintCellSize(parseInt(e.target.value) || 18)}
                                  style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                                  className="print-setting-slider"
                                />
                                <input 
                                  type="number" 
                                  min="10" 
                                  max="24" 
                                  value={printCellSize}
                                  onChange={(e) => setPrintCellSize(Math.max(10, Math.min(24, parseInt(e.target.value) || 10)))}
                                  style={{ width: '56px', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}
                                />
                              </div>
                            </div>

                            <div className="print-setting-item" style={{ marginBottom: '14px' }}>
                              <label className="print-setting-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                                <span>Hiện chữ viết mờ để đồ theo:</span>
                                <input 
                                  type="checkbox" 
                                  checked={printShowFaded}
                                  onChange={(e) => setPrintShowFaded(e.target.checked)}
                                  className="print-setting-checkbox"
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                                />
                              </label>
                            </div>

                            <div className="print-setting-item" style={{ marginBottom: '14px' }}>
                              <label className="print-setting-label" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Kiểu chữ luyện viết:</label>
                              <div className="print-font-selector-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                                <button 
                                  className={`print-font-btn ${printFontType === 'handwriting' ? 'active' : ''}`}
                                  onClick={() => setPrintFontType('handwriting')}
                                  style={{ padding: '8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', background: printFontType === 'handwriting' ? 'var(--color-primary)' : 'transparent', color: printFontType === 'handwriting' ? 'white' : 'var(--text-primary)', fontWeight: '500', cursor: 'pointer' }}
                                >
                                  Khải Thư (Viết tay)
                                </button>
                                <button 
                                  className={`print-font-btn ${printFontType === 'print' ? 'active' : ''}`}
                                  onClick={() => setPrintFontType('print')}
                                  style={{ padding: '8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', background: printFontType === 'print' ? 'var(--color-primary)' : 'transparent', color: printFontType === 'print' ? 'white' : 'var(--text-primary)', fontWeight: '500', cursor: 'pointer' }}
                                >
                                  Chữ in tiêu chuẩn
                                </button>
                              </div>
                            </div>

                            <div className="print-setting-item" style={{ marginBottom: '14px' }}>
                              <label className="print-setting-label" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Tiêu đề phiếu viết:</label>
                              <input 
                                type="text"
                                value={printTitle}
                                onChange={(e) => setPrintTitle(e.target.value)}
                                placeholder="Tiếng Trung"
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '13px' }}
                              />
                            </div>

                            <div className="print-setting-item" style={{ marginBottom: '14px' }}>
                              <label className="print-setting-label" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Người viết / Học sinh:</label>
                              <input 
                                type="text"
                                value={printCreator}
                                onChange={(e) => setPrintCreator(e.target.value)}
                                placeholder="Tên của bạn"
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '13px' }}
                              />
                            </div>
                          </div>

                          <div className="print-card word-selection-card" style={{ marginTop: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                            <div className="selection-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h3 className="print-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600', margin: 0 }}><CheckSquare style={{ width: '18px', height: '18px', color: 'var(--color-secondary)' }} /> Chọn từ để in</h3>
                              <span className="print-card-badge" style={{ fontSize: '11px', background: 'rgba(13, 148, 136, 0.1)', color: 'var(--color-secondary)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>{selectedItems.length}/{pool.length}</span>
                            </div>
                            
                            <div className="selection-fast-actions" style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                              <button onClick={() => setSelectedPrintWords(pool.slice(0, 10).map(v => v.word))} style={{ flex: 1, padding: '4px 8px', fontSize: '11px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-app)', cursor: 'pointer' }}>10 đầu</button>
                              <button onClick={() => setSelectedPrintWords(pool.slice(0, 100).map(v => v.word))} style={{ flex: 1, padding: '4px 8px', fontSize: '11px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-app)', cursor: 'pointer' }}>Tối đa 100</button>
                              <button onClick={() => setSelectedPrintWords([])} style={{ flex: 1, padding: '4px 8px', fontSize: '11px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-app)', cursor: 'pointer' }}>Bỏ chọn</button>
                            </div>

                            <div className="word-checkboxes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', maxHeight: '160px', overflowY: 'auto', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                              {pool.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', gridColumn: 'span 2', textAlign: 'center', padding: '12px 0' }}>Bộ thẻ trống, vui lòng thêm thẻ trước.</p>
                              ) : (
                                pool.map((item, idx) => {
                                  const isChecked = selectedPrintWords.includes(item.word);
                                  return (
                                    <label key={idx} className={`word-select-label ${isChecked ? 'checked' : ''}`} style={{ display: 'flex', flexDirection: 'column', padding: '6px 8px', border: '1px solid ' + (isChecked ? 'var(--color-secondary)' : 'var(--border-color)'), borderRadius: '6px', background: isChecked ? 'rgba(13, 148, 136, 0.05)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setSelectedPrintWords(prev => prev.filter(w => w !== item.word));
                                          } else {
                                            setSelectedPrintWords(prev => [...prev, item.word]);
                                          }
                                        }}
                                        style={{ display: 'none' }}
                                      />
                                      <span className="word-select-cn" style={{ fontSize: '14px', fontWeight: '600', color: isChecked ? 'var(--color-secondary)' : 'var(--text-primary)' }}>{item.word}</span>
                                      <span className="word-select-vn" style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.meaning}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div className="print-instructions-panel" style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}><AlertCircle style={{ width: '14px', height: '14px' }} /> Hướng dẫn xuất PDF A4:</h4>
                            <ol style={{ paddingLeft: '16px', fontSize: '11px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                              <li>Tích chọn các từ cần in ở bảng trên.</li>
                              <li>Điều chỉnh <strong>Số hàng viết</strong> và <strong>Cỡ ô (mm)</strong>.</li>
                              <li>Bấm nút <strong>In phiếu</strong> hoặc <strong>Tải PDF</strong>.</li>
                              <li>Tại hộp thoại in, chọn đích là <strong>Lưu dưới dạng PDF</strong> (A4 dọc).</li>
                              <li>Bật tùy chọn <strong>"Đồ họa nền" (Background graphics)</strong> trong cài đặt in để in được lưới ô chữ.</li>
                            </ol>
                          </div>
                        </div>

                        {/* Right Preview Sheet Container (Shows styled A4 sheets) */}
                        <div className="print-preview-area">
                          <div className="a4-print-page" id="print-a4-page">
                            {/* Page Header */}
                            <div className="a4-page-header">
                              <div className="header-left">
                                <h1 className="header-title">{printTitle}</h1>
                                <p className="header-meta">Người viết: <strong>{printCreator}</strong></p>
                              </div>
                              <div className="header-right">
                                <div className="brand-logo">SinoLearn</div>
                                <p className="brand-slogan">Học từ bằng thực hành giao tiếp</p>
                              </div>
                            </div>

                            {/* Sheet grids */}
                            <div className="a4-page-content">
                              {selectedItems.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120mm', border: '2px dashed #ccc', borderRadius: '8px', color: '#888' }}>
                                  <AlertCircle style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#ccc' }} />
                                  <p style={{ fontWeight: '500', fontSize: '16px' }}>Chưa chọn chữ nào để in</p>
                                  <p style={{ fontSize: '13px' }}>Vui lòng tích chọn các chữ cần in ở bảng cấu hình bên trái.</p>
                                </div>
                              ) : (
                                selectedItems.map((wordItem, wordIdx) => {
                                  const chars = wordItem.word.split('');
                                  return (
                                    <div key={wordIdx} className="print-word-block" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: '20px' }}>
                                      <div className="print-word-title" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                                        <span className="word-index" style={{ color: '#888' }}>{wordIdx + 1}.</span>
                                        <span className="word-cn" style={{ fontSize: '16px', color: '#000' }}>{wordItem.word}</span>
                                        <span className="word-py" style={{ color: '#555', fontStyle: 'italic', fontWeight: 'normal' }}>/{wordItem.pinyin}/</span>
                                        <span className="word-divider" style={{ color: '#ccc' }}>—</span>
                                        <span className="word-vn" style={{ color: '#333', fontWeight: '500' }}>{wordItem.meaning}</span>
                                        {wordItem.type && <span className="word-type" style={{ color: '#888', fontWeight: 'normal', fontSize: '12px' }}>({wordItem.type})</span>}
                                      </div>

                                      <div className="print-char-practice-rows" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {chars.map((char, charIdx) => {
                                          const rowArray = Array.from({ length: printRowsPerChar });
                                          return rowArray.map((_, rIdx) => (
                                            <div key={`${charIdx}-${rIdx}`} className="print-grid-row" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                              {/* Model character cell on the very left */}
                                              <div 
                                                className="writing-grid-box model-cell" 
                                                style={{ 
                                                  width: `${printCellSize}mm`, 
                                                  height: `${printCellSize}mm`,
                                                  position: 'relative',
                                                  border: '1.5px solid #222',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  backgroundColor: '#f1f5f9',
                                                  boxSizing: 'border-box'
                                                }}
                                              >
                                                {/* Background grid lines */}
                                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100">
                                                  <line x1="0" y1="50" x2="100" y2="50" stroke="#999" strokeDasharray="3,3" strokeWidth="0.8" />
                                                  <line x1="50" y1="0" x2="50" y2="100" stroke="#999" strokeDasharray="3,3" strokeWidth="0.8" />
                                                  <line x1="0" y1="0" x2="100" y2="100" stroke="#bbb" strokeDasharray="2,2" strokeWidth="0.5" />
                                                  <line x1="100" y1="0" x2="0" y2="100" stroke="#bbb" strokeDasharray="2,2" strokeWidth="0.5" />
                                                </svg>
                                                <span 
                                                  style={{ 
                                                    fontFamily: printFontType === 'handwriting' ? '"Ma Shan Zheng", cursive' : '"Noto Sans SC", sans-serif',
                                                    fontSize: `${printCellSize * 0.72}mm`,
                                                    color: '#000',
                                                    fontWeight: 'bold',
                                                    zIndex: 1,
                                                    lineHeight: 1
                                                  }}
                                                >
                                                  {char}
                                                </span>
                                              </div>

                                              {/* Practice cells */}
                                              {Array.from({ length: colsPerRow - 1 }).map((_, colIdx) => (
                                                <div 
                                                  key={colIdx} 
                                                  className="writing-grid-box practice-cell" 
                                                  style={{ 
                                                    width: `${printCellSize}mm`, 
                                                    height: `${printCellSize}mm`,
                                                    position: 'relative',
                                                    border: '1px solid #666',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxSizing: 'border-box'
                                                  }}
                                                >
                                                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100">
                                                    <line x1="0" y1="50" x2="100" y2="50" stroke="#ccc" strokeDasharray="3,3" strokeWidth="0.8" />
                                                    <line x1="50" y1="0" x2="50" y2="100" stroke="#ccc" strokeDasharray="3,3" strokeWidth="0.8" />
                                                    <line x1="0" y1="0" x2="100" y2="100" stroke="#e2e8f0" strokeDasharray="2,2" strokeWidth="0.5" />
                                                    <line x1="100" y1="0" x2="0" y2="100" stroke="#e2e8f0" strokeDasharray="2,2" strokeWidth="0.5" />
                                                  </svg>
                                                  {printShowFaded && (
                                                    <span 
                                                      style={{ 
                                                        fontFamily: printFontType === 'handwriting' ? '"Ma Shan Zheng", cursive' : '"Noto Sans SC", sans-serif',
                                                        fontSize: `${printCellSize * 0.72}mm`,
                                                        color: '#000',
                                                        opacity: 0.15,
                                                        zIndex: 1,
                                                        lineHeight: 1
                                                      }}
                                                    >
                                                      {char}
                                                    </span>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ));
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Card Management Grid */}
                {lmMode !== 'print' && (
                <div className="cards-management-grid">
                  
                  {/* Manual Add Flashcard Form Panel */}
                  <div className="dict-card add-card-form-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                    
                    {/* Header */}
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                          <PlusCircle className="text-primary" /> Thêm Thẻ Mới
                        </h2>
                        <span style={{ 
                          fontSize: '12px', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                          color: 'var(--color-primary)', 
                          fontWeight: '700' 
                        }}>
                          Bộ: {formDeck || currentDeck || 'Chung'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setModalTargetDeck(formDeck || currentDeck || decks[0] || 'Chung');
                          setShowAiAddWordsModal(true);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '5px 10px', backgroundColor: 'rgba(168, 85, 247, 0.1)',
                          color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)',
                          borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)'}
                        title="Tự động trích xuất từ tệp hoặc tạo từ theo chủ đề bằng AI"
                      >
                        <Sparkles size={13} /> AI Hàng Loạt
                      </button>
                    </div>

                    {/* Manual Input Form */}
                    <form onSubmit={handleManualAddFlashcard} className="add-card-form" id="manualAddCardForm">
                      {/* Word Input with Auto Suggestion Dropdown and AI Auto-fill action */}
                      <div className="form-group" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="cardWordInput">
                            {appLangPair === 'EN-VI' ? 'Từ vựng tiếng Anh' : 'Từ vựng / Chữ Hán'} <span className="required">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAutoFillFormWithAI()}
                            disabled={isFormAutoFilling || !formWord.trim()}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                              color: 'var(--color-primary)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              cursor: formWord.trim() ? 'pointer' : 'not-allowed',
                              opacity: formWord.trim() ? 1 : 0.6,
                              transition: 'all 0.2s'
                            }}
                            title="Tự động điền đầy đủ phiên âm, nghĩa và câu ví dụ bằng AI"
                          >
                            {isFormAutoFilling ? (
                              <RefreshCw size={11} className="animate-spin" />
                            ) : (
                              <Sparkles size={11} />
                            )}
                            {isFormAutoFilling ? 'AI đang điền...' : 'AI tự điền ✨'}
                          </button>
                        </div>

                        <div style={{ position: 'relative' }} ref={fcSearchContainerRef}>
                          <input
                            type="text"
                            id="cardWordInput"
                            style={{ width: '100%' }}
                            placeholder={appLangPair === 'EN-VI' ? "Ví dụ: perseverance (gõ để xem gợi ý)..." : "Ví dụ: 坚持 (gõ để xem gợi ý)..."}
                            value={formWord}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormWord(val);
                              if (appLangPair === 'ZH-VI' && !formPinyin) {
                                setFormPinyin(convertToPinyin(val));
                              }
                              handleFcDictSearchInput(val);
                            }}
                            onFocus={() => {
                              if (fcSuggestions.length > 0) setFcShowSuggestionsDropdown(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                if (fcSuggestions.length > 0) {
                                  setFcShowSuggestionsDropdown(true);
                                  setFcSelectedSuggestionIndex(prev => (prev + 1) % fcSuggestions.length);
                                }
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                if (fcSuggestions.length > 0) {
                                  setFcShowSuggestionsDropdown(true);
                                  setFcSelectedSuggestionIndex(prev => (prev - 1 + fcSuggestions.length) % fcSuggestions.length);
                                }
                              } else if (e.key === 'Enter') {
                                if (fcShowSuggestionsDropdown && fcSelectedSuggestionIndex >= 0 && fcSelectedSuggestionIndex < fcSuggestions.length) {
                                  e.preventDefault();
                                  const item = fcSuggestions[fcSelectedSuggestionIndex];
                                  handleSelectSuggestionForForm(item);
                                }
                              } else if (e.key === 'Escape') {
                                setFcShowSuggestionsDropdown(false);
                                setFcSelectedSuggestionIndex(-1);
                              }
                            }}
                            autoComplete="off"
                            required
                          />

                          {/* Live Autocomplete Suggestions Box (Solid Background, High Legibility) */}
                          {fcShowSuggestionsDropdown && fcSuggestions.length > 0 && (
                            <div 
                              className="suggestions-box" 
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                marginTop: '4px',
                                backgroundColor: 'var(--bg-card-solid, #ffffff)',
                                border: '1.5px solid var(--border-solid, #cbd5e1)',
                                borderRadius: '10px',
                                boxShadow: '0 20px 48px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.12)',
                                zIndex: 99999,
                                overflow: 'hidden',
                                maxHeight: '280px',
                                overflowY: 'auto',
                                opacity: 1
                              }}
                            >
                              <div className="suggestions-header" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: 'var(--bg-app, #f1f5f9)',
                                borderBottom: '1px solid var(--border-solid, #e2e8f0)',
                                color: 'var(--text-secondary)'
                              }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Globe size={12} style={{ color: 'var(--color-primary)' }} />
                                  {appLangPair === 'EN-VI' ? 'Gợi ý từ tiếng Anh' : 'Gợi ý chữ Hán'}
                                </span>
                                <span style={{ fontSize: '10.5px', opacity: 0.8 }}>
                                  Chọn để tự điền thông tin
                                </span>
                              </div>
                              {fcSuggestions.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className={`suggestion-item ${fcSelectedSuggestionIndex === idx ? 'active' : ''}`}
                                  onMouseEnter={() => setFcSelectedSuggestionIndex(idx)}
                                  onClick={() => handleSelectSuggestionForForm(item)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-solid, #f1f5f9)',
                                    backgroundColor: fcSelectedSuggestionIndex === idx ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card-solid, #ffffff)',
                                    transition: 'background-color 0.15s'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', maxWidth: '65%' }}>
                                    <span style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                                      {highlightMatch(item.word, formWord)}
                                    </span>
                                    {item.pos && (
                                      <span style={{
                                        fontSize: '10px',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                        color: 'var(--color-primary)',
                                        fontWeight: '600'
                                      }}>
                                        {formatPosTag(item.pos)}
                                      </span>
                                    )}
                                    {item.pinyin && (
                                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        {item.pinyin}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    {(item.meaning || item.definition) && (
                                      <div style={{
                                        fontSize: '11.5px',
                                        color: 'var(--text-secondary)',
                                        maxWidth: '110px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }} title={item.meaning || item.definition}>
                                        {item.meaning || item.definition}
                                      </div>
                                    )}
                                    <CornerDownLeft size={11} style={{ opacity: fcSelectedSuggestionIndex === idx ? 0.9 : 0.3, color: 'var(--color-primary)' }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pinyin / Pronunciation */}
                      <div className="form-group">
                        <label htmlFor="cardPinyinInput">
                          {appLangPair === 'EN-VI' ? 'Phiên âm / IPA' : 'Phiên âm (Pinyin)'}
                        </label>
                        <input
                          type="text"
                          id="cardPinyinInput"
                          placeholder={appLangPair === 'EN-VI' ? "Ví dụ: /ˌpɜː.sɪˈvɪə.rəns/" : "Ví dụ: jiānchí"}
                          value={formPinyin}
                          onChange={(e) => setFormPinyin(e.target.value)}
                        />
                      </div>

                      {/* Meaning */}
                      <div className="form-group">
                        <label htmlFor="cardMeaningInput">
                          Nghĩa tiếng Việt <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="cardMeaningInput"
                          placeholder="Ví dụ: kiên trì, bền chí"
                          value={formMeaning}
                          onChange={(e) => setFormMeaning(e.target.value)}
                          required
                        />
                      </div>

                      {/* Type / Part of speech */}
                      <div className="form-group">
                        <label htmlFor="cardTypeInput">
                          Từ loại
                        </label>
                        <input
                          type="text"
                          id="cardTypeInput"
                          placeholder="Ví dụ: Danh từ, Động từ..."
                          value={formType}
                          onChange={(e) => setFormType(e.target.value)}
                        />
                      </div>

                      {/* Example Word/Sentence */}
                      <div className="form-group full-width">
                        <label htmlFor="cardExCnInput">
                          {appLangPair === 'EN-VI' ? 'Câu ví dụ (Tiếng Anh)' : 'Câu ví dụ (Chữ Hán)'}
                        </label>
                        <input
                          type="text"
                          id="cardExCnInput"
                          placeholder={appLangPair === 'EN-VI' ? "Ví dụ: Success requires hard work and perseverance." : "Ví dụ: 只要坚持努力，就一定会成功。"}
                          value={formExCn}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormExCn(val);
                            if (appLangPair === 'ZH-VI' && !formExPinyin) {
                              setFormExPinyin(convertToPinyin(val));
                            }
                          }}
                        />
                      </div>

                      {/* Example Pinyin */}
                      {appLangPair === 'ZH-VI' && (
                        <div className="form-group full-width">
                          <label htmlFor="cardExPinyinInput">
                            Pinyin câu ví dụ
                          </label>
                          <input
                            type="text"
                            id="cardExPinyinInput"
                            placeholder="Ví dụ: Zhǐyào jiānchí nǔlì, jiù yīdìng huì chénggōng."
                            value={formExPinyin}
                            onChange={(e) => setFormExPinyin(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Example Vietnamese Translation */}
                      <div className="form-group full-width">
                        <label htmlFor="cardExVnInput">
                          Dịch nghĩa câu ví dụ
                        </label>
                        <input
                          type="text"
                          id="cardExVnInput"
                          placeholder="Ví dụ: Chỉ cần kiên trì nỗ lực, nhất định sẽ thành công."
                          value={formExVn}
                          onChange={(e) => setFormExVn(e.target.value)}
                        />
                      </div>

                      {/* Target Deck Selection */}
                      <div className="form-group full-width">
                        <label htmlFor="cardDeckSelect">
                          Lưu vào bộ thẻ
                        </label>
                        <select
                          id="cardDeckSelect"
                          value={formDeck || currentDeck || (decks[0] || 'Chung')}
                          onChange={(e) => setFormDeck(e.target.value)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-btn)',
                            background: 'var(--bg-input)',
                            border: 'var(--glass-border)',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        >
                          {decks.map((deckName, idx) => (
                            <option key={idx} value={deckName} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                              {deckName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Helper hint about AI auto-generation */}
                      <div className="form-group full-width" style={{ marginTop: '-4px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(99, 102, 241, 0.06)',
                          border: '1px dashed rgba(99, 102, 241, 0.25)',
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          <Sparkles size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                          <span>
                            <strong>Mẹo thông minh:</strong> Bạn chỉ cần nhập từ vựng (hoặc chọn từ gợi ý) rồi bấm nút <strong>"Thêm Thẻ Vào Bộ"</strong>, AI sẽ tự động điền phiên âm, nghĩa và câu ví dụ để tạo thẻ ngay!
                          </span>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button 
                        type="submit" 
                        className="submit-btn" 
                        id="btnSubmitAddCard"
                        disabled={isFormAutoFilling}
                        style={{
                          background: isFormAutoFilling 
                            ? 'var(--text-muted)' 
                            : 'linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%)',
                          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                          cursor: isFormAutoFilling ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isFormAutoFilling ? (
                          <>
                            <RefreshCw className="animate-spin" size={18} /> AI đang tự tạo thẻ...
                          </>
                        ) : (
                          <>
                            <PlusCircle size={18} /> Thêm Thẻ Vào Bộ (AI Tự Động Điền)
                          </>
                        )}
                      </button>
                    </form>

                  </div>

                  {/* List Flashcards Panel */}
                  <div className="dict-card cards-list-panel">
                    <div className="card-header">
                      <h2 className="card-title"><List /> Thẻ từ trong bộ</h2>
                      <div className="filter-controls">
                        <button className={`filter-btn ${flashcardFilter === 'all' ? 'active' : ''}`} onClick={() => setFlashcardFilter('all')}>Tất cả</button>
                        <button className={`filter-btn ${flashcardFilter === 'learning' ? 'active' : ''}`} onClick={() => setFlashcardFilter('learning')}>Chưa thuộc</button>
                        <button className={`filter-btn ${flashcardFilter === 'mastered' ? 'active' : ''}`} onClick={() => setFlashcardFilter('mastered')}>Đã thuộc</button>
                      </div>
                    </div>
                    
                    <div className="cards-table-container">
                      {deckVocab.length === 0 ? (
                        <div className="cards-list-empty">
                          <p>Chưa có thẻ vựng nào trong bộ này.</p>
                        </div>
                      ) : (
                        <ul className="flashcard-list" id="flashcardListElement">
                          {deckVocab
                            .filter(item => {
                              if (flashcardFilter === 'learning') return item.status === 'learning';
                              if (flashcardFilter === 'mastered') return item.status === 'mastered';
                              return true;
                            })
                            .map((item, index) => (
                              <li key={index} className="flashcard-item">
                                <div className="item-left">
                                  <div className="item-top-row">
                                    <span className="item-cn">{item.word}</span>
                                    <span className="item-py">{item.pinyin}</span>
                                    <span className={`item-status-dot ${item.status}`} title={item.status === 'mastered' ? 'Đã thuộc' : 'Chưa thuộc'}></span>
                                  </div>
                                  <div className="item-meaning">{item.meaning}</div>
                                </div>
                                <div className="item-right">
                                  <button className="icon-action-btn study-btn" onClick={() => {
                                    const poolIdx = deckVocab.indexOf(item);
                                    if (poolIdx >= 0) {
                                      setCurrentFlashcardIndex(poolIdx);
                                      setLmMode('flip');
                                      setCardFlipped(false);
                                      window.scrollTo({ top: 120, behavior: 'smooth' });
                                    }
                                  }} title="Học thẻ này">
                                    <Eye style={{ width: '15px', height: '15px' }} />
                                  </button>
                                  <button className="icon-action-btn delete-btn" onClick={() => confirmDeleteCard(item.word)} title="Xóa thẻ">
                                    <Trash2 style={{ width: '15px', height: '15px' }} />
                                  </button>
                                </div>
                              </li>
                            ))
                          }
                        </ul>
                      )}
                    </div>
                  </div>

                </div>
                )}

                  </>
                )}
              </div>
            </motion.section>
          )}

          {/* TAB 3: ABOUT */}
          {tab === 'settings' && (
            <motion.section
              key="settings"
              id="tab-settings"
              className="tab-content active"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="dict-card" style={{ textAlign: 'left' }}>
                  <div className="card-header">
                    <h2 className="card-title"><Pencil /> Thông tin cá nhân</h2>
                  </div>
                  <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Họ tên hiển thị</label>
                      <input 
                        type="text" 
                        value={settingsDisplayName}
                        onChange={(e) => setSettingsDisplayName(e.target.value)}
                        placeholder="Họ và tên..."
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Số điện thoại</label>
                      <input 
                        type="text" 
                        value={settingsPhoneNumber}
                        onChange={(e) => setSettingsPhoneNumber(e.target.value)}
                        placeholder="Số điện thoại..."
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Ngày sinh</label>
                      <input 
                        type="date" 
                        value={settingsBirthDate}
                        onChange={(e) => setSettingsBirthDate(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="submit-btn" 
                      style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      <span>Lưu thông tin</span>
                    </button>
                  </form>
                </div>

                <div className="dict-card" style={{ textAlign: 'left' }}>
                  <div className="card-header">
                    <h2 className="card-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>
                      <Layers />
                      <span>Thống kê <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>hoạt động</span></span>
                    </h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', marginTop: '16px', alignItems: 'center' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                          {/* Background Track */}
                          <circle cx="70" cy="70" r="60" fill="none" stroke="var(--bg-input)" strokeWidth="12" />
                          {/* Progress Arc */}
                          <circle cx="70" cy="70" r="60" fill="none" stroke="url(#pinkGradient)" strokeWidth="12" strokeLinecap="round" 
                                  strokeDasharray="377" strokeDashoffset={377 - (377 * Math.min(userProfile?.queryCount || 0, 100)) / 100} 
                                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
                          <defs>
                            <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="var(--color-primary)" />
                              <stop offset="100%" stopColor="var(--color-secondary)" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', lineHeight: 1 }}>{userProfile?.queryCount || 0}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Tra cứu</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-input)', borderRadius: '24px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Tra cứu từ vựng AI:</span>
                        <strong style={{ color: 'var(--color-primary)' }}>{userProfile?.queryCount || 0} lượt</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-input)', borderRadius: '24px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Dịch thuật câu AI:</span>
                        <strong style={{ color: 'var(--color-secondary)' }}>{userProfile?.translationCount || 0} lượt</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-input)', borderRadius: '24px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loại tài khoản:</span>
                        <span className="badge" style={{ backgroundColor: 'rgba(236, 72, 153, 0.12)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                          {userProfile?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dict-card about-card" style={{ textAlign: 'left' }}>
                <div className="card-header">
                  <h2 className="card-title"><HelpCircle /> Giới thiệu SinoLearn</h2>
                </div>
                <div className="about-content">
                  <p><strong>SinoLearn</strong> là một ứng dụng học tiếng Trung tối giản và hiện đại, kết hợp giữa từ điển tra cứu nhanh, dịch thuật đàm thoại và hệ thống thẻ ghi nhớ thông minh cùng các bài kiểm tra thực hành sinh động nhằm giúp bạn tối ưu hóa hiệu quả ghi nhớ từ vựng.</p>
                  
                  <h3>Tính năng nổi bật:</h3>
                  <ul>
                    <li><strong>Tra cứu & Dịch thuật:</strong> Hỗ trợ tìm kiếm từ vựng Trung-Việt siêu nhanh. Tích hợp live-translator dịch các câu đàm thoại.</li>
                    <li><strong>Thẻ học 3D (Flashcards):</strong> Học từ vựng thông qua hệ thống flashcard 3D với hiệu ứng lật xoay tương tác.</li>
                    <li><strong>Luyện nghe phát âm:</strong> Tích hợp Speech Synthesis phát âm chuẩn tiếng Trung trực tiếp từ chữ Hán và các câu ví dụ mẫu.</li>
                    <li><strong>Bài kiểm tra phong phú:</strong> Cung cấp chế độ Điền từ vào chỗ trống, câu hỏi trắc nghiệm, viết tự luận định nghĩa để đánh giá trình độ toàn diện.</li>
                    <li><strong>Luyện viết chữ Hán:</strong> Bản đồ thứ tự nét chữ trực quan, cho phép vẽ và kiểm tra độ chính xác của từng nét viết chữ Hán chuẩn nét.</li>
                    <li><strong>Lưu trữ dữ liệu:</strong> Dữ liệu từ vựng và tiến trình học tập của bạn được lưu trữ trực tiếp trên LocalStorage của trình duyệt một cách an toàn.</li>
                  </ul>

                  <div className="creator-credits">
                    <p>Phát triển bởi <strong>Tran Gia Thieu</strong> &copy; 2026. Thiết kế lấy cảm hứng từ hệ thống thiết kế cao cấp <strong>UI/UX Pro Max</strong>.</p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* TAB: ADMIN (Quản trị viên) */}
          {tab === 'admin' && userProfile?.role === 'admin' && (
            <motion.section
              key="admin"
              id="tab-admin"
              className="tab-content active"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div style={{ marginBottom: '24px' }}>
                <DictionaryAdmin />
              </div>
              
              <div className="dict-card" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="card-title"><ClipboardList /> Quản lý thành viên</h2>
                  <button 
                    className="add-deck-btn" 
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <Plus size={16} /> Thêm thành viên
                  </button>
                </div>
                <div style={{ marginTop: '16px' }} className="w-full">
                  <div className="desktop-only overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-solid)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px 8px' }}>Họ tên</th>
                          <th style={{ padding: '12px 8px' }}>Email</th>
                          <th style={{ padding: '12px 8px' }}>Vai trò</th>
                          <th style={{ padding: '12px 8px' }}>Trạng thái</th>
                          <th style={{ padding: '12px 8px' }}>Tra từ AI</th>
                          <th style={{ padding: '12px 8px' }}>Tổng số từ flashcard</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.uid} style={{ borderBottom: '1px solid var(--border-solid)' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 600 }}>{member.displayName || 'Không tên'}</td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{member.email}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <span className="badge" style={{ 
                                backgroundColor: member.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(74, 85, 104, 0.1)', 
                                color: member.role === 'admin' ? 'var(--color-primary)' : 'var(--text-secondary)',
                                fontWeight: 'bold'
                              }}>
                                {member.role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <span className="badge" style={{ 
                                backgroundColor: member.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                color: member.status === 'approved' ? '#059669' : '#dc2626',
                                fontWeight: 'bold'
                              }}>
                                {member.status === 'approved' ? 'Approved' : 'Blocked'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{member.queryCount || 0}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{Array.isArray(member.vocabulary) ? member.vocabulary.length : (member.vocabulary ? Object.keys(member.vocabulary).length : 0)}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <button 
                                className="icon-action-btn study-btn" 
                                onClick={() => { setEditingUser(member); setShowEditMemberModal(true); }}
                                title="Chỉnh sửa"
                                style={{ display: 'inline-flex', padding: '6px', borderRadius: '50%', background: 'var(--bg-input)', border: 'none', cursor: 'pointer' }}
                              >
                                <Pencil size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mobile-only flex flex-col gap-4">
                    {members.map((member) => (
                      <div key={member.uid} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-lg text-slate-900 dark:text-slate-100">{member.displayName || 'Không tên'}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">{member.email}</div>
                          </div>
                          <button 
                            className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200" 
                            onClick={() => { setEditingUser(member); setShowEditMemberModal(true); }}
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="badge" style={{ 
                            backgroundColor: member.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(74, 85, 104, 0.1)', 
                            color: member.role === 'admin' ? 'var(--color-primary)' : 'var(--text-secondary)',
                            fontWeight: 'bold', fontSize: '12px', padding: '4px 8px'
                          }}>
                            {member.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                          <span className="badge" style={{ 
                            backgroundColor: member.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: member.status === 'approved' ? '#059669' : '#dc2626',
                            fontWeight: 'bold', fontSize: '12px', padding: '4px 8px'
                          }}>
                            {member.status === 'approved' ? 'Approved' : 'Blocked'}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 mt-1 border-t border-slate-200 dark:border-slate-700 pt-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Tra từ AI</span>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{member.queryCount || 0}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Số từ flashcard</span>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{member.translationCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
          </AnimatePresence>

        </div>
        
        {/* Global Footer */}
        <footer className="main-footer no-print">
          <div className="footer-content">
            <p>Bản quyền thuộc về <strong>Trần Gia Thiều</strong> - Giathieu110406@gmail.com &middot; Phiên bản v1.0</p>
            <p className="footer-sub">&copy; SinoLearn &middot; Nền tảng học Tiếng Trung thông minh &middot; Tra cứu từ điển &amp; Thẻ ghi nhớ tự động.</p>
          </div>
        </footer>

      </main>
    </div>

    {/* Mascot */}
    <CatMascot />
  </>
  );
}
