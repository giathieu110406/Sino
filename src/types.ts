export interface Example {
  cn: string;
  vn: string;
  pinyin?: string;
}

export interface Collocation {
  text: string;
  pinyin?: string;
  meaning: string;
}

export interface Flashcard {
  word: string;
  pinyin: string;
  meaning: string;
  type: string;
  examples: Example[];
  collocations?: Collocation[];
  status: 'learning' | 'mastered';
  deck: string;
}

export interface DictItem {
  word: string;
  pinyin: string;
  meaning: string;
  type: string;
  examples: Example[];
  collocations?: Collocation[];
  status?: 'learning' | 'mastered';
}

export interface WordSuggestion {
  word: string;
  pinyin?: string;
  meaning?: string;
  pos?: string;
  definition?: string;
  source?: 'online' | 'local' | 'history';
}

export interface TranslationRule {
  zh: string;
  vi: string;
}

export interface QuizQuestion {
  type: 'write' | 'mc';
  card: Flashcard;
  options?: Flashcard[];
  answered: boolean;
  correct: boolean | null;
}

export interface FillinItem {
  card: Flashcard;
  example: Example;
}
