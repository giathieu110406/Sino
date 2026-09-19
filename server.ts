import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import officeParser from "officeparser";
import { getDb, isDbConfigured } from "./src/db/index";
import { dictionaryEntries } from "./src/db/schema";
import { eq, or, ilike, desc } from "drizzle-orm";
import { MASTER_DICT } from "./src/data";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize AI client lazily to avoid crashing if API key is not set immediately
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("API Key không hợp lệ. Vui lòng thiết lập Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const LOCAL_DICT_PATH = path.join(process.cwd(), "local_dict.json");

function getInitialDict(): any[] {
  return MASTER_DICT.map(item => ({
    word: item.word,
    pinyin: item.pinyin || "",
    meaning: item.meaning,
    type: item.type || "Từ vựng",
    examples: item.examples || [],
    createdAt: new Date().toISOString()
  }));
}

function getLocalDict(): any[] {
  try {
    if (!fs.existsSync(LOCAL_DICT_PATH)) {
      const initial = getInitialDict();
      try {
        fs.writeFileSync(LOCAL_DICT_PATH, JSON.stringify(initial, null, 2), "utf8");
      } catch (wErr) {
        console.warn("Could not write initial local_dict.json:", wErr);
      }
      return initial;
    }
    const data = fs.readFileSync(LOCAL_DICT_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = getInitialDict();
      try {
        fs.writeFileSync(LOCAL_DICT_PATH, JSON.stringify(initial, null, 2), "utf8");
      } catch (wErr) {
        console.warn("Could not write initial local_dict.json:", wErr);
      }
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error("Lỗi đọc file local_dict.json:", err);
    return getInitialDict();
  }
}

function saveLocalDict(data: any[]) {
  try {
    fs.writeFileSync(LOCAL_DICT_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Lỗi ghi file local_dict.json:", err);
  }
}

// API Routes
// 1. Check API Status & availability of API Key
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: "ok", hasApiKey: hasKey });
});

// Live online dictionary autocomplete suggestions
app.get("/api/dict/suggest", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const langPair = String(req.query.langPair || "ZH-VI");
    if (!query) {
      return res.json([]);
    }

    if (langPair === "ZH-VI") {
      // 1. Chinese suggestions: search in DB or local JSON or built-in list
      const results: any[] = [];
      const lowerQ = query.toLowerCase();

      // Normalize pinyin helper
      const cleanPinyin = (str: string) => {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[āáǎà]/gi, 'a')
          .replace(/[ēéěè]/gi, 'e')
          .replace(/[īíǐì]/gi, 'i')
          .replace(/[ōóǒò]/gi, 'o')
          .replace(/[ūúǔùüǖǘǚǜ]/gi, 'u')
          .toLowerCase()
          .replace(/\s+/g, '');
      };

      const normQ = cleanPinyin(query);

      // Check Database if configured
      const db = getDb();
      if (db) {
        try {
          const dbResults = await db.select().from(dictionaryEntries).where(
            or(
              ilike(dictionaryEntries.word, `%${query}%`),
              ilike(dictionaryEntries.pinyin, `%${query}%`),
              ilike(dictionaryEntries.meaning, `%${query}%`)
            )
          ).limit(8);

          dbResults.forEach(item => {
            results.push({
              word: item.word,
              pinyin: item.pinyin || "",
              meaning: item.meaning,
              pos: item.type || "Từ vựng",
              source: "database"
            });
          });
        } catch (dbErr) {
          console.warn("Suggest DB warning:", dbErr);
        }
      }

      // Check local JSON dict
      try {
        const localEntries = getLocalDict();
        for (const item of localEntries) {
          if (results.some(r => r.word === item.word)) continue;
          const matchWord = item.word && item.word.includes(query);
          const matchPinyin = item.pinyin && cleanPinyin(item.pinyin).includes(normQ);
          const matchMeaning = item.meaning && item.meaning.toLowerCase().includes(lowerQ);

          if (matchWord || matchPinyin || matchMeaning) {
            results.push({
              word: item.word,
              pinyin: item.pinyin || "",
              meaning: item.meaning,
              pos: item.type || "Từ vựng",
              source: "online"
            });
          }
          if (results.length >= 10) break;
        }
      } catch (err) {
        console.error("Local dict suggest error:", err);
      }

      return res.json(results.slice(0, 10));
    }

    // 2. English suggestions (langPair === "EN-VI")
    if (langPair === "EN-VI") {
      // Query online English dictionary service (Datamuse)
      try {
        const response = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(query)}*&md=dp&max=10`, {
          headers: { "User-Agent": "SinoLearn-App/1.0" },
          signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
          const data: any[] = await response.json();
          if (data && data.length > 0) {
            const suggestions = data.map((item: any) => {
              let def = "";
              let pos = "";
              if (item.defs && item.defs.length > 0) {
                const parts = item.defs[0].split("\t");
                pos = parts[0] || "";
                def = parts[1] || "";
              }
              return {
                word: item.word,
                score: item.score,
                pos: pos,
                definition: def,
                meaning: def,
                source: "online"
              };
            });
            return res.json(suggestions);
          }
        }
      } catch (dmErr) {
        console.warn("Datamuse words query error, trying basic sug fallback:", dmErr);
      }

      // Fallback to basic sug endpoint
      try {
        const sugRes = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=10`, {
          signal: AbortSignal.timeout(2500)
        });
        if (sugRes.ok) {
          const sugData: any[] = await sugRes.json();
          return res.json(sugData.map((d: any) => ({
            word: d.word,
            score: d.score,
            pos: "",
            definition: "",
            meaning: "",
            source: "online"
          })));
        }
      } catch (sugErr) {
        console.warn("Datamuse sug error:", sugErr);
      }
    }

    return res.json([]);
  } catch (err: any) {
    console.error("Suggestion error:", err);
    return res.json([]);
  }
});

// 2. Hybrid AI + DB dictionary search endpoint
app.post("/api/dict/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "Tham số tìm kiếm 'query' không hợp lệ." });
    }

    const searchTerm = query.trim();
    const { langPair = 'ZH-VI' } = req.body;

    // 1. Try to find in Database first (exact match on word or case-insensitive match on pinyin or meaning)
    if (langPair === 'ZH-VI') {
      let foundItem: any = null;
      const db = getDb();
      if (db) {
        try {
          const dbResults = await db.select().from(dictionaryEntries).where(
            or(
              eq(dictionaryEntries.word, searchTerm),
              ilike(dictionaryEntries.pinyin, searchTerm),
              ilike(dictionaryEntries.meaning, `%${searchTerm}%`)
            )
          ).limit(1);

          if (dbResults.length > 0) {
            foundItem = dbResults[0];
          }
        } catch (dbErr) {
          console.warn("Database query warning, falling back to local file / AI:", dbErr);
        }
      }

      // If not configured or failed or not found, try searching in local JSON
      if (!foundItem) {
        try {
          const localEntries = getLocalDict();
          const term = searchTerm.toLowerCase();
          const localMatch = localEntries.find(e => 
            e.word.toLowerCase() === term || 
            (e.pinyin && e.pinyin.toLowerCase() === term) || 
            (e.meaning && e.meaning.toLowerCase().includes(term))
          );
          if (localMatch) {
            foundItem = localMatch;
          }
        } catch (localErr) {
          console.error("Local dictionary query error:", localErr);
        }
      }

      if (foundItem) {
        return res.json({
          word: foundItem.word,
          pinyin: foundItem.pinyin || "",
          meaning: foundItem.meaning,
          type: foundItem.type || "Từ vựng",
          examples: foundItem.examples || [],
          collocations: foundItem.collocations || [],
          fromDb: true
        });
      }
    } // End if (langPair === 'ZH-VI')

    // const { langPair = 'ZH-VI' } = req.body; // already destructured above
    // 2. If not found in DB, fallback to AI Generation
    const ai = getAiClient();
    let systemInstruction = "";
    let prompt = "";

    if (langPair === 'EN-VI') {
      systemInstruction = 
        "You are a highly professional English-Vietnamese dictionary assistant. " +
        "Find the exact or most relevant English word/phrase for the search query (which can be in English or Vietnamese). " +
        "Generate an extensive, accurate dictionary entry in Vietnamese with exact phonetic transcription (IPA), practical collocations, and high-quality context examples.";

      prompt = `Hãy tra cứu từ vựng phù hợp nhất với từ khóa sau: "${searchTerm}". 
Nếu từ khóa bằng tiếng Việt, hãy tìm từ tiếng Anh tương ứng phù hợp nhất trước. 
Hãy trả về một kết quả từ điển duy nhất dưới dạng cấu trúc JSON chi tiết, bao gồm nghĩa tiếng Việt, 1-2 câu ví dụ minh họa và 2-4 cụm từ kết hợp thường gặp (Collocations).`;
    } else {
      systemInstruction = 
        "You are a highly professional Chinese-Vietnamese dictionary assistant. " +
        "Find the exact or most relevant Chinese word/phrase for the search query (which can be in Chinese characters, Hanyu Pinyin, or Vietnamese). " +
        "Generate an extensive, accurate dictionary entry in Vietnamese with exact Pinyin, high-frequency collocations, and high-quality context examples.";

      prompt = `Hãy tra cứu từ vựng phù hợp nhất với từ khóa sau: "${searchTerm}". 
Nếu từ khóa bằng tiếng Việt hoặc Pinyin, hãy tìm từ tiếng Trung tương ứng phù hợp nhất trước. 
Hãy trả về một kết quả từ điển duy nhất dưới dạng cấu trúc JSON chi tiết, bao gồm nghĩa tiếng Việt, 1-2 câu ví dụ minh họa và 2-4 cụm từ kết hợp thường gặp (Collocations).`;
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        word: {
          type: Type.STRING,
          description: langPair === 'EN-VI' ? "Từ tiếng Anh." : "Từ tiếng Trung (chữ Hán giản thể)."
        },
        pinyin: {
          type: Type.STRING,
          description: langPair === 'EN-VI' ? "Phiên âm quốc tế IPA." : "Hanyu Pinyin với đầy đủ thanh điệu chính xác (ví dụ: xuéxí)."
        },
        meaning: {
          type: Type.STRING,
          description: "Nghĩa tiếng Việt chi tiết, rõ ràng và tự nhiên."
        },
        type: {
          type: Type.STRING,
          description: "Từ loại bằng tiếng Việt (ví dụ: 'Danh từ', 'Động từ', 'Tính từ', 'Thành ngữ', 'Lượng từ', v.v.)."
        },
        collocations: {
          type: Type.ARRAY,
          description: "2 đến 4 cụm từ kết hợp thường gặp nhất (Collocations) với từ này, gồm cụm từ, phiên âm và nghĩa tiếng Việt.",
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: langPair === 'EN-VI' ? "Cụm từ tiếng Anh kết hợp (Collocation)." : "Cụm từ tiếng Trung kết hợp (Collocation)."
              },
              pinyin: {
                type: Type.STRING,
                description: langPair === 'EN-VI' ? "Phiên âm IPA của cụm từ." : "Hanyu Pinyin có thanh điệu chính xác của cụm từ."
              },
              meaning: {
                type: Type.STRING,
                description: "Nghĩa tiếng Việt của cụm từ kết hợp."
              }
            },
            required: ["text", "meaning"]
          }
        },
        examples: {
          type: Type.ARRAY,
          description: "1 đến 2 câu ví dụ thực tế minh họa cách sử dụng từ này.",
          items: {
            type: Type.OBJECT,
            properties: {
              cn: {
                type: Type.STRING,
                description: langPair === 'EN-VI' ? "Câu ví dụ bằng tiếng Anh." : "Câu ví dụ bằng chữ Hán giản thể."
              },
              pinyin: {
                type: Type.STRING,
                description: langPair === 'EN-VI' ? "Phiên âm quốc tế IPA của câu ví dụ (hoặc để trống)." : "Hanyu Pinyin của câu ví dụ có đầy đủ thanh điệu chính xác."
              },
              vn: {
                type: Type.STRING,
                description: "Bản dịch nghĩa câu ví dụ sang tiếng Việt tự nhiên."
              }
            },
            required: ["cn", "pinyin", "vn"]
          }
        }
      },
      required: ["word", "pinyin", "meaning", "type", "examples"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1, // Keep it precise and stable
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được dữ liệu từ AI.");
    }

    const dictItem = JSON.parse(text);

    // 3. Save the newly generated item to DB and local cache for future use
    try {
      const entries = getLocalDict();
      if (!entries.some(e => e.word === dictItem.word)) {
        entries.push({
          word: dictItem.word,
          pinyin: dictItem.pinyin,
          meaning: dictItem.meaning,
          type: dictItem.type,
          examples: dictItem.examples,
          createdAt: new Date().toISOString()
        });
        saveLocalDict(entries);
      }

      const db = getDb();
      if (db) {
        await db.insert(dictionaryEntries).values({
          word: dictItem.word,
          pinyin: dictItem.pinyin,
          meaning: dictItem.meaning,
          type: dictItem.type,
          examples: dictItem.examples,
        }).onConflictDoNothing({ target: dictionaryEntries.word });
      }
    } catch (saveErr) {
      console.warn("Notice: saving new dict item cache:", saveErr);
    }

    res.json({ ...dictItem, fromDb: false });
  } catch (error: any) {
    console.error("Lỗi khi tra cứu từ điển bằng AI:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ khi xử lý tra cứu từ điển." });
  }
});

// 3. AI-powered intelligent sentence translation endpoint
app.post("/api/translate", async (req, res) => {
  try {
    const { text: textToTranslate, direction } = req.body;
    if (!textToTranslate || typeof textToTranslate !== "string" || !textToTranslate.trim()) {
      return res.status(400).json({ error: "Nội dung cần dịch không hợp lệ." });
    }

    const dir = direction || "zh-vi";
    const ai = getAiClient();
    
    let systemInstruction = "";
    let prompt = "";

    if (dir === "zh-vi") {
      systemInstruction = 
        "You are an expert Chinese-to-Vietnamese translator. Translate the Chinese text into natural, fluent Vietnamese. " +
        "Provide the translation, the Hanyu Pinyin with tone marks for the source text, and a brief vocabulary or grammar analysis of key words in Vietnamese.";
      
      prompt = `Hãy dịch câu tiếng Trung này sang tiếng Việt: "${textToTranslate.trim()}".`;
    } else if (dir === "vi-zh") {
      systemInstruction = 
        "You are an expert Vietnamese-to-Chinese translator. Translate the Vietnamese text into natural, fluent Simplified Chinese. " +
        "Provide the translation, the Hanyu Pinyin with tone marks for the translated Chinese text, and a brief vocabulary or grammar analysis of key words in Vietnamese.";
      
      prompt = `Hãy dịch câu tiếng Việt này sang tiếng Trung giản thể: "${textToTranslate.trim()}".`;
    } else if (dir === "en-vi") {
      systemInstruction = 
        "You are an expert English-to-Vietnamese translator. Translate the English text into natural, fluent Vietnamese. " +
        "Provide the translation, the phonetic transcription (IPA) for the source text, and a brief vocabulary or grammar analysis of key words in Vietnamese.";
      
      prompt = `Hãy dịch câu tiếng Anh này sang tiếng Việt: "${textToTranslate.trim()}".`;
    } else if (dir === "vi-en") {
      systemInstruction = 
        "You are an expert Vietnamese-to-English translator. Translate the Vietnamese text into natural, fluent English. " +
        "Provide the translation, the phonetic transcription (IPA) for the translated English text, and a brief vocabulary or grammar analysis of key words in Vietnamese.";
      
      prompt = `Hãy dịch câu tiếng Việt này sang tiếng Anh: "${textToTranslate.trim()}".`;
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        translatedText: {
          type: Type.STRING,
          description: "Đoạn văn đã được dịch hoàn chỉnh."
        },
        pinyin: {
          type: Type.STRING,
          description: "Hanyu Pinyin tương ứng với phần chữ tiếng Trung (có thanh điệu đầy đủ)."
        },
        analysis: {
          type: Type.STRING,
          description: "Phân tích ngữ pháp hoặc giải nghĩa từ vựng trọng tâm bằng tiếng Việt ngắn gọn."
        }
      },
      required: ["translatedText", "pinyin", "analysis"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được dữ liệu dịch thuật từ AI.");
    }

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Lỗi khi dịch thuật bằng AI:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ khi xử lý dịch thuật." });
  }
});

// 4. AI-powered flashcard deck generation endpoint
app.post("/api/deck/generate", async (req, res) => {
  try {
    const { topic, count, langPair = 'ZH-VI' } = req.body;
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Tham số 'topic' (chủ đề) không hợp lệ." });
    }

    const ai = getAiClient();
    const isEn = langPair === 'EN-VI';
    const systemInstruction = isEn
      ? "You are an expert English language teacher. Generate a high-quality list of English vocabulary words based on a specific topic requested by the user. " +
        "The result must be returned as a list of flashcards in JSON format, including example sentences."
      : "You are an expert Chinese language teacher. Generate a high-quality list of Chinese vocabulary words based on a specific topic requested by the user. " +
        "The result must be returned as a list of flashcards in JSON format, including example sentences.";
    
    const numCards = typeof count === "number" && count > 0 && count <= 50 ? count : 10;
    const prompt = isEn
      ? `Hãy tạo một bộ từ vựng flashcard gồm ${numCards} từ vựng tiếng Anh liên quan đến chủ đề: "${topic.trim()}". Kèm theo mỗi từ là 1-2 câu ví dụ.`
      : `Hãy tạo một bộ từ vựng flashcard gồm ${numCards} từ vựng tiếng Trung liên quan đến chủ đề: "${topic.trim()}". Kèm theo mỗi từ là 1-2 câu ví dụ.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        cards: {
          type: Type.ARRAY,
          description: "Danh sách thẻ ghi nhớ (flashcards).",
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: isEn ? "Từ tiếng Anh." : "Từ tiếng Trung (chữ Hán giản thể)." },
              pinyin: { type: Type.STRING, description: isEn ? "Phiên âm quốc tế IPA." : "Hanyu Pinyin với thanh điệu." },
              meaning: { type: Type.STRING, description: "Nghĩa tiếng Việt." },
              type: { type: Type.STRING, description: "Từ loại (Danh từ, Động từ, Tính từ, v.v.)." },
              examples: {
                type: Type.ARRAY,
                description: "Các câu ví dụ thực tế minh họa cách sử dụng từ này.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cn: {
                      type: Type.STRING,
                      description: isEn ? "Câu ví dụ bằng tiếng Anh." : "Câu ví dụ bằng chữ Hán giản thể."
                    },
                    pinyin: {
                      type: Type.STRING,
                      description: isEn ? "Phiên âm quốc tế IPA của câu ví dụ (hoặc để trống)." : "Hanyu Pinyin của câu ví dụ có đầy đủ thanh điệu chính xác."
                    },
                    vn: {
                      type: Type.STRING,
                      description: "Bản dịch nghĩa câu ví dụ sang tiếng Việt tự nhiên."
                    }
                  },
                  required: ["cn", "pinyin", "vn"]
                }
              }
            },
            required: ["word", "pinyin", "meaning", "type", "examples"]
          }
        }
      },
      required: ["cards"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.5,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được dữ liệu từ AI.");
    }
    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Lỗi khi tạo bộ thẻ bằng AI:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ khi tạo bộ thẻ." });
  }
});


// 7. AI-powered vocabulary extraction from uploaded file (pdf, docx, pptx, txt, md)
app.post("/api/deck/extract-file", async (req, res) => {
  try {
    const { fileData, fileName, langPair = 'ZH-VI' } = req.body;
    if (!fileData || !fileName) {
      return res.status(400).json({ error: "Dữ liệu tệp hoặc tên tệp không hợp lệ." });
    }

    const buffer = Buffer.from(fileData, 'base64');
    let extractedText = "";

    const ext = path.extname(fileName).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
    const isImage = imageExtensions.includes(ext);

    if (!isImage) {
      if (ext === '.txt' || ext === '.md') {
        extractedText = buffer.toString('utf-8');
      } else {
        try {
          extractedText = await new Promise<string>((resolve, reject) => {
            officeParser.parseOffice(buffer, (data: any, err: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          });
        } catch (parseErr: any) {
          console.error("Lỗi khi phân tách tệp văn phòng:", parseErr);
          return res.status(422).json({ error: `Không thể đọc nội dung tệp ${fileName}. Đảm bảo tệp không bị lỗi hoặc được mã hóa.` });
        }
      }

      if (!extractedText || !extractedText.trim()) {
        return res.status(400).json({ error: "Nội dung tệp trống hoặc không thể trích xuất được văn bản." });
      }
    }

    const ai = getAiClient();
    const isEn = langPair === 'EN-VI';
    const langName = isEn ? "English" : "Chinese";
    const langNameVN = isEn ? "tiếng Anh" : "tiếng Trung";

    const systemInstruction = 
      `You are an expert ${langName} language teacher and text analyzer. ` +
      `Read the provided text and identify the top 10-15 most important or useful vocabulary words/phrases for a student learning ${langName}. ` +
      `Generate a complete list of flashcards in Vietnamese with accurate pronunciation and contextual examples. ` +
      `Return the result strictly as a JSON object matching the requested schema.`;

    let contents: any;
    if (isImage) {
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.heic') mimeType = 'image/heic';
      
      contents = [
        { text: `Dưới đây là một hình ảnh tài liệu/ảnh chụp "${fileName}". Hãy phân tích nội dung văn bản trong ảnh và trích xuất khoảng 10 đến 15 từ vựng/cụm từ ${langNameVN} hay và bổ ích nhất xuất hiện trong đó. Với mỗi từ vựng, hãy cung cấp nghĩa tiếng Việt, từ loại, phiên âm ${isEn ? 'IPA' : 'Pinyin'} chính xác, và kèm theo 1 câu ví dụ thực tế có dịch nghĩa tiếng Việt.` },
        {
          inlineData: {
            data: fileData,
            mimeType
          }
        }
      ];
    } else {
      contents = 
        `Dưới đây là nội dung văn bản được trích xuất từ tệp "${fileName}":\n\n` +
        `"""\n${extractedText.substring(0, 15000)}\n"""\n\n` +
        `Hãy phân tích văn bản này và trích xuất khoảng 10 đến 15 từ vựng/cụm từ ${langNameVN} hay và bổ ích nhất xuất hiện trong bài. ` +
        `Với mỗi từ vựng, hãy cung cấp nghĩa tiếng Việt, từ loại, phiên âm ${isEn ? 'IPA' : 'Pinyin'} chính xác, và kèm theo 1 câu ví dụ thực tế có dịch nghĩa tiếng Việt.`;
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        cards: {
          type: Type.ARRAY,
          description: "Danh sách thẻ ghi nhớ được trích xuất.",
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: isEn ? "Từ tiếng Anh." : "Từ tiếng Trung (chữ Hán giản thể)." },
              pinyin: { type: Type.STRING, description: isEn ? "Phiên âm quốc tế IPA." : "Hanyu Pinyin với đầy đủ thanh điệu." },
              meaning: { type: Type.STRING, description: "Nghĩa tiếng Việt rõ ràng, tự nhiên." },
              type: { type: Type.STRING, description: "Từ loại bằng tiếng Việt (Danh từ, Động từ, Tính từ, v.v.)." },
              examples: {
                type: Type.ARRAY,
                description: "Một câu ví dụ thực tế.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cn: { type: Type.STRING, description: isEn ? "Câu ví dụ bằng tiếng Anh." : "Câu ví dụ bằng chữ Hán giản thể." },
                    pinyin: { type: Type.STRING, description: isEn ? "Phiên âm quốc tế IPA của câu ví dụ." : "Hanyu Pinyin của câu ví dụ." },
                    vn: { type: Type.STRING, description: "Dịch câu ví dụ sang tiếng Việt." }
                  },
                  required: ["cn", "pinyin", "vn"]
                }
              }
            },
            required: ["word", "pinyin", "meaning", "type", "examples"]
          }
        }
      },
      required: ["cards"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được dữ liệu trích xuất từ AI.");
    }

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Lỗi khi trích xuất từ vựng từ tệp bằng AI:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ khi xử lý tệp." });
  }
});




// --- DATABASE CRUD ENDPOINTS FOR DICTIONARY ---

// List all dictionary words
app.get("/api/dict/list", async (req, res) => {
  try {
    const db = getDb();
    if (db) {
      try {
        const entries = await db.select().from(dictionaryEntries).orderBy(desc(dictionaryEntries.createdAt));
        if (entries && entries.length > 0) {
          return res.json(entries);
        }
      } catch (dbErr) {
        console.warn("DB query warning in /api/dict/list, using local fallback:", dbErr);
      }
    }

    const entries = getLocalDict();
    entries.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(entries);
  } catch (error: any) {
    console.error("Lỗi khi tải danh sách từ điển:", error);
    res.json(getLocalDict());
  }
});

// Update or Insert a single word manually
app.post("/api/dict/save", async (req, res) => {
  try {
    const { word, pinyin, meaning, type, examples } = req.body;
    if (!word || !meaning) {
      return res.status(400).json({ error: "Vui lòng nhập Từ và Nghĩa." });
    }

    // Always update local file store
    const entries = getLocalDict();
    const existingIdx = entries.findIndex(e => e.word === word);
    const entryData = {
      word,
      pinyin: pinyin || "",
      meaning,
      type: type || "Từ vựng",
      examples: examples || [],
      createdAt: existingIdx >= 0 ? (entries[existingIdx].createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    if (existingIdx >= 0) {
      entries[existingIdx] = entryData;
    } else {
      entries.unshift(entryData);
    }
    saveLocalDict(entries);

    // Also persist to DB if configured
    const db = getDb();
    if (db) {
      try {
        const existing = await db.select().from(dictionaryEntries).where(eq(dictionaryEntries.word, word)).limit(1);
        if (existing.length > 0) {
          await db.update(dictionaryEntries).set({
            pinyin: pinyin || "", meaning, type: type || "Từ vựng", examples: examples || []
          }).where(eq(dictionaryEntries.word, word));
        } else {
          await db.insert(dictionaryEntries).values({
            word, pinyin: pinyin || "", meaning, type: type || "Từ vựng", examples: examples || []
          });
        }
      } catch (dbErr) {
        console.warn("DB save warning (saved locally):", dbErr);
      }
    }

    res.json({ success: true, message: "Lưu thành công!" });
  } catch (error: any) {
    console.error("Lỗi khi lưu từ:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ." });
  }
});

// Delete a word manually
app.post("/api/dict/delete", async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) {
      return res.status(400).json({ error: "Vui lòng cung cấp từ cần xóa." });
    }

    // Delete from local file store
    const entries = getLocalDict();
    const filtered = entries.filter(e => e.word !== word);
    saveLocalDict(filtered);

    // Also delete from DB if configured
    const db = getDb();
    if (db) {
      try {
        await db.delete(dictionaryEntries).where(eq(dictionaryEntries.word, word));
      } catch (dbErr) {
        console.warn("DB delete warning (removed locally):", dbErr);
      }
    }

    res.json({ success: true, message: "Đã xóa từ thành công!" });
  } catch (error: any) {
    console.error("Lỗi khi xóa từ:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ." });
  }
});

// 5. AI-powered grammar exercises endpoint
app.post("/api/grammar/generate", async (req, res) => {
  try {
    const { type, words, batch, langPair = 'ZH-VI' } = req.body; 
    if (!type || !words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: "Tham số không hợp lệ." });
    }

    const ai = getAiClient();
    const isEn = langPair === 'EN-VI';
    const langName = isEn ? "English" : "Chinese";
    const langNameVN = isEn ? "tiếng Anh" : "tiếng Trung";
    const systemInstruction = `You are an expert ${langName} language teacher. Create exercises based on the provided vocabulary words.`;
    
    let prompt = "";
    let responseSchema: any = {};
    
    if (batch) {
      if (type === 'scramble') {
        prompt = `Tạo ${words.length} câu ${langNameVN} tự nhiên, mỗi câu sử dụng một trong các từ sau (mỗi từ một câu riêng biệt): ${words.join(', ')}. Trả về danh sách các câu này.`;
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              vietnamese: { type: Type.STRING },
              chinese: { type: Type.STRING, description: isEn ? 'Câu tiếng Anh' : 'Câu tiếng Trung' },
              pinyin: { type: Type.STRING, description: isEn ? 'Phiên âm quốc tế IPA' : 'Hanyu Pinyin' },
              scrambledWords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["vietnamese", "chinese", "pinyin", "scrambledWords"]
          }
        };
      } else if (type === 'fill_in') {
        prompt = `Tạo ${words.length} câu ${langNameVN} tự nhiên, mỗi câu sử dụng một trong các từ sau: ${words.join(', ')}. Đục lỗ từ đó trong câu bằng "___" và cung cấp 3 đáp án sai.`;
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sentence: { type: Type.STRING },
              vietnamese: { type: Type.STRING },
              pinyin: { type: Type.STRING, description: isEn ? 'Phiên âm quốc tế IPA' : 'Hanyu Pinyin' },
              correctAnswer: { type: Type.STRING },
              fullSentence: { type: Type.STRING },
              fullSentencePinyin: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["sentence", "fullSentence", "fullSentencePinyin", "vietnamese", "correctAnswer", "options"]
          }
        };
      } else if (type === 'compose') {
        prompt = `Trả về một mảng chứa từng từ sau đây kèm theo ý nghĩa của chúng để học sinh đặt câu: ${words.join(', ')}`;
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              wordsToUse: { type: Type.ARRAY, items: { type: Type.STRING } },
              hints: { type: Type.STRING }
            },
            required: ["wordsToUse", "hints"]
          }
        };
      } else if (type === 'mixed') {
        prompt = `Tạo một bài tập ngữ pháp hỗn hợp cho ${words.length} từ sau: ${words.join(', ')}. Phân bổ đều các dạng bài tập (scramble, fill_in, compose) cho từng từ.
        - Với dạng 'scramble': Cung cấp vietnamese, chinese, pinyin, scrambledWords, gán type="scramble".
        - Với dạng 'fill_in': Cung cấp sentence, vietnamese, correctAnswer, options, fullSentence, gán type="fill_in".
        - Với dạng 'compose': Cung cấp wordsToUse (mảng 1 từ), hints, gán type="compose".`;
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "Loại bài tập: 'scramble', 'fill_in', 'compose'" },
              vietnamese: { type: Type.STRING },
              chinese: { type: Type.STRING, description: isEn ? 'Câu tiếng Anh' : 'Câu tiếng Trung' },
              pinyin: { type: Type.STRING, description: isEn ? 'Phiên âm quốc tế IPA' : 'Hanyu Pinyin' },
              scrambledWords: { type: Type.ARRAY, items: { type: Type.STRING } },
              sentence: { type: Type.STRING },
              correctAnswer: { type: Type.STRING },
              fullSentence: { type: Type.STRING },
              fullSentencePinyin: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              wordsToUse: { type: Type.ARRAY, items: { type: Type.STRING } },
              hints: { type: Type.STRING }
            },
            required: ["type"]
          }
        };
      }
    } else {
      // old non-batch logic...
      // (not changing this, wait, the old code is already replaced, let's keep it clean by just supporting batch)
      if (type === 'scramble') {
        prompt = `Tạo một câu ${langNameVN} tự nhiên sử dụng ít nhất một trong các từ sau: ${words.join(', ')}. Trả về câu tiếng Trung, bản dịch tiếng Việt, và một mảng chứa các từ tiếng Trung trong câu bị xáo trộn vị trí ngẫu nhiên.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            vietnamese: { type: Type.STRING, description: "Bản dịch tiếng Việt của câu." }, pinyin: { type: Type.STRING, description: "Pinyin của câu ${langNameVN} hoàn chỉnh (có thanh điệu)." },
            chinese: { type: Type.STRING, description: `Câu ${langNameVN} hoàn chỉnh và đúng.` },
            scrambledWords: { 
               type: Type.ARRAY, 
               items: { type: Type.STRING },
              description: "Danh sách các từ trong câu tiếng Trung bị xáo trộn vị trí." 
             }
          },
          required: ["vietnamese", "chinese", "pinyin", "scrambledWords"]
        };
      } else if (type === 'fill_in') {
        prompt = `Tạo một câu ${langNameVN} tự nhiên sử dụng ít nhất một trong các từ sau: ${words.join(', ')}. Đục lỗ (bỏ trống) 1 từ quan trọng trong câu (nên là từ nằm trong danh sách đã cho). Trả về câu đã đục lỗ (sử dụng "___" cho chỗ trống), từ bị đục lỗ, và 3 đáp án sai khác để tạo thành câu hỏi trắc nghiệm.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING, description: "Câu tiếng Trung có một chỗ trống thay bằng '___'." },
            vietnamese: { type: Type.STRING, description: "Bản dịch tiếng Việt của câu." }, pinyin: { type: Type.STRING, description: "Pinyin của câu ${langNameVN} hoàn chỉnh (có thanh điệu)." },
            correctAnswer: { type: Type.STRING, description: "Từ tiếng Trung đúng để điền vào chỗ trống." }, fullSentence: { type: Type.STRING, description: "Câu tiếng Trung hoàn chỉnh (sau khi điền từ đúng)." }, fullSentencePinyin: { type: Type.STRING, description: "Pinyin của câu hoàn chỉnh (có thanh điệu)." },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Mảng gồm 4 lựa chọn (1 đúng, 3 sai), được xáo trộn ngẫu nhiên."
            }
          },
          required: ["sentence", "fullSentence", "fullSentencePinyin", "vietnamese", "correctAnswer", "options"]
        };
      } else if (type === 'compose') {
        prompt = `Chọn ngẫu nhiên 1 hoặc 2 từ trong danh sách sau: ${words.join(', ')}. Trả về các từ này cùng với nghĩa của chúng để yêu cầu học sinh tự đặt câu.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            wordsToUse: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1 hoặc 2 từ tiếng Trung học sinh cần dùng để đặt câu."
            },
            hints: { type: Type.STRING, description: "Nghĩa tiếng Việt của các từ được chọn." }
          },
          required: ["wordsToUse", "hints"]
        };
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Không nhận được dữ liệu từ AI.");
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Lỗi khi tạo bài tập ngữ pháp:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ." });
  }
});

// 6. AI-powered grammar checking endpoint
app.post("/api/grammar/check", async (req, res) => {
  try {
    const { sentence, wordsToUse, langPair = 'ZH-VI' } = req.body;
    if (!sentence || !wordsToUse || !Array.isArray(wordsToUse)) {
      return res.status(400).json({ error: "Tham số không hợp lệ." });
    }

    const isEn = langPair === 'EN-VI';
    const langName = isEn ? "English" : "Chinese";
    const langNameVN = isEn ? "tiếng Anh" : "tiếng Trung";

    const ai = getAiClient();
    const systemInstruction = `You are an expert, friendly ${langName} language teacher grading a student's sentence.`;
    const prompt = `Học sinh đã viết câu sau bằng ${langNameVN}: "${sentence}".
Họ được yêu cầu sử dụng các từ: ${wordsToUse.join(', ')}.
Hãy kiểm tra xem:
1. Câu có đúng ngữ pháp và tự nhiên không?
2. Họ có sử dụng các từ được yêu cầu không?
Chấm điểm (0-100), chỉ ra lỗi (nếu có), giải thích ngắn gọn bằng tiếng Việt, và đưa ra một phiên bản sửa lại tự nhiên hơn (nếu câu chưa hoàn hảo).`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Điểm số từ 0 đến 100." },
        isCorrect: { type: Type.BOOLEAN, description: "Câu có thể chấp nhận được không (đúng ngữ pháp cơ bản và dùng đúng từ)." },
        feedback: { type: Type.STRING, description: "Nhận xét, giải thích lỗi sai (bằng tiếng Việt)." },
        correctedSentence: { type: Type.STRING, description: `Phiên bản sửa lại hoàn chỉnh và tự nhiên hơn (${langNameVN}).` }
      },
      required: ["score", "isCorrect", "feedback", "correctedSentence", "correctedPinyin"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Không nhận được dữ liệu từ AI.");
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Lỗi khi chấm câu:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ." });
  }
});

// Configure Vite or Static asset serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
