const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `
    // 2. If not found in DB, fallback to AI Generation
    const ai = getAiClient();
    const systemInstruction = 
      "You are a highly professional Chinese-Vietnamese dictionary assistant. " +
      "Find the exact or most relevant Chinese word/phrase for the search query (which can be in Chinese characters, Hanyu Pinyin, or Vietnamese). " +
      "Generate an extensive, accurate dictionary entry in Vietnamese with exact Pinyin and high-quality, practical context examples.";

    const prompt = \`Hãy tra cứu từ vựng phù hợp nhất với từ khóa sau: "\${searchTerm}". 
Nếu từ khóa bằng tiếng Việt hoặc Pinyin, hãy tìm từ tiếng Trung tương ứng phù hợp nhất trước. 
Hãy trả về một kết quả từ điển duy nhất dưới dạng cấu trúc JSON chi tiết.\`;
`;

const replacement = `
    const { langPair = 'ZH-VI' } = req.body;
    // 2. If not found in DB, fallback to AI Generation
    const ai = getAiClient();
    let systemInstruction = "";
    let prompt = "";

    if (langPair === 'EN-VI') {
      systemInstruction = 
        "You are a highly professional English-Vietnamese dictionary assistant. " +
        "Find the exact or most relevant English word/phrase for the search query (which can be in English or Vietnamese). " +
        "Generate an extensive, accurate dictionary entry in Vietnamese with exact phonetic transcription (IPA) and high-quality, practical context examples.";

      prompt = \`Hãy tra cứu từ vựng phù hợp nhất với từ khóa sau: "\${searchTerm}". 
Nếu từ khóa bằng tiếng Việt, hãy tìm từ tiếng Anh tương ứng phù hợp nhất trước. 
Hãy trả về một kết quả từ điển duy nhất dưới dạng cấu trúc JSON chi tiết.\`;
    } else {
      systemInstruction = 
        "You are a highly professional Chinese-Vietnamese dictionary assistant. " +
        "Find the exact or most relevant Chinese word/phrase for the search query (which can be in Chinese characters, Hanyu Pinyin, or Vietnamese). " +
        "Generate an extensive, accurate dictionary entry in Vietnamese with exact Pinyin and high-quality, practical context examples.";

      prompt = \`Hãy tra cứu từ vựng phù hợp nhất với từ khóa sau: "\${searchTerm}". 
Nếu từ khóa bằng tiếng Việt hoặc Pinyin, hãy tìm từ tiếng Trung tương ứng phù hợp nhất trước. 
Hãy trả về một kết quả từ điển duy nhất dưới dạng cấu trúc JSON chi tiết.\`;
    }
`;

code = code.replace(targetStr, replacement);

fs.writeFileSync('server.ts', code);
