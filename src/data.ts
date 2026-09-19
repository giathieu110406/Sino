import { DictItem, Flashcard, TranslationRule } from './types';

export function normalizePinyin(str: string): string {
  if (!str) return '';
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
}

export const MASTER_DICT: DictItem[] = [
  {
    word: "你好",
    pinyin: "nǐ hǎo",
    meaning: "Xin chào",
    type: "Từ cảm thán",
    collocations: [
      { text: "你好吗", pinyin: "nǐ hǎo ma", meaning: "Bạn có khỏe không?" },
      { text: "大家你好", pinyin: "dà jiā nǐ hǎo", meaning: "Chào mọi người" }
    ],
    examples: [
      { cn: "你好，很高兴认识你。", vn: "Xin chào, rất vui được gặp bạn.", pinyin: "nǐ hǎo, hěn gāo xìng rèn shí nǐ." }
    ],
    status: 'mastered'
  },
  {
    word: "谢谢",
    pinyin: "xiè xie",
    meaning: "Cảm ơn",
    type: "Động từ",
    collocations: [
      { text: "非常感谢", pinyin: "fēi cháng gǎn xiè", meaning: "Vô cùng cảm ơn" },
      { text: "谢谢大家", pinyin: "xiè xie dà jiā", meaning: "Cảm ơn mọi người" }
    ],
    examples: [
      { cn: "谢谢你的帮助。", vn: "Cảm ơn sự giúp đỡ của bạn.", pinyin: "xiè xie nǐ de bāng zhù." }
    ],
    status: 'learning'
  },
  {
    word: "再见",
    pinyin: "zài jiàn",
    meaning: "Tạm biệt, hẹn gặp lại",
    type: "Động từ",
    collocations: [
      { text: "明天再见", pinyin: "míng tiān zài jiàn", meaning: "Ngày mai gặp lại" },
      { text: "说再见", pinyin: "shuō zài jiàn", meaning: "Nói lời tạm biệt" }
    ],
    examples: [
      { cn: "明天见，再见！", vn: "Ngày mai gặp, tạm biệt!", pinyin: "míng tiān jiàn, zài jiàn!" }
    ],
    status: 'learning'
  },
  {
    word: "学习",
    pinyin: "xué xí",
    meaning: "Học tập, học hỏi",
    type: "Động từ",
    collocations: [
      { text: "努力学习", pinyin: "nǔ lì xué xí", meaning: "Chăm chỉ học tập" },
      { text: "学习态度", pinyin: "xué xí tài dù", meaning: "Thái độ học tập" },
      { text: "学习经验", pinyin: "xué xí jīng yàn", meaning: "Học hỏi kinh nghiệm" }
    ],
    examples: [
      { cn: "我每天学习中文。", vn: "Tôi học tiếng Trung mỗi ngày.", pinyin: "wǒ měi tiān xué xí zhōng wén." }
    ],
    status: 'learning'
  },
  {
    word: "朋友",
    pinyin: "péng yǒu",
    meaning: "Bạn bè, người bạn",
    type: "Danh từ",
    collocations: [
      { text: "好朋友", pinyin: "hǎo péng yǒu", meaning: "Bạn tốt, bạn thân" },
      { text: "交朋友", pinyin: "jiāo péng yǒu", meaning: "Kết bạn" },
      { text: "老朋友", pinyin: "lǎo péng yǒu", meaning: "Bạn cũ" }
    ],
    examples: [
      { cn: "他是我的好朋友。", vn: "Anh ấy là bạn tốt của tôi.", pinyin: "tā shì wǒ de hǎo péng yǒu." }
    ],
    status: 'mastered'
  },
  {
    word: "老师",
    pinyin: "lǎo shī",
    meaning: "Thầy cô giáo, giáo viên",
    type: "Danh từ",
    collocations: [
      { text: "汉语老师", pinyin: "hàn yǔ lǎo shī", meaning: "Giáo viên tiếng Trung" },
      { text: "尊敬老师", pinyin: "zūn jìng lǎo shī", meaning: "Tôn kính thầy cô" }
    ],
    examples: [
      { cn: "王老师教我们汉语。", vn: "Thầy Vương dạy chúng tôi tiếng Hán.", pinyin: "wáng lǎo shī jiāo wǒ men hàn yǔ." }
    ],
    status: 'learning'
  },
  {
    word: "学生",
    pinyin: "xué sheng",
    meaning: "Học sinh, sinh viên",
    type: "Danh từ",
    collocations: [
      { text: "大学生", pinyin: "dà xué shēng", meaning: "Sinh viên đại học" },
      { text: "优秀学生", pinyin: "yōu xiù xué sheng", meaning: "Học sinh xuất sắc" }
    ],
    examples: [
      { cn: "学校里有很多学生。", vn: "Trong trường có rất nhiều học sinh.", pinyin: "xué xiào lǐ yǒu hěn duō xué sheng." }
    ],
    status: 'learning'
  },
  {
    word: "中国",
    pinyin: "zhōng guó",
    meaning: "Trung Quốc",
    type: "Danh từ",
    collocations: [
      { text: "中国文化", pinyin: "zhōng guó wén huà", meaning: "Văn hóa Trung Quốc" },
      { text: "去中国", pinyin: "qù zhōng guó", meaning: "Đi Trung Quốc" }
    ],
    examples: [
      { cn: "我想去中国旅游。", vn: "Tôi muốn đi Trung Quốc du lịch.", pinyin: "wǒ xiǎng qù zhōng guó lǚ yóu." }
    ],
    status: 'learning'
  },
  {
    word: "汉语",
    pinyin: "hàn yǔ",
    meaning: "Tiếng Hán, tiếng Trung",
    type: "Danh từ",
    collocations: [
      { text: "学汉语", pinyin: "xué hàn yǔ", meaning: "Học tiếng Hán" },
      { text: "汉语水平", pinyin: "hàn yǔ shuǐ píng", meaning: "Trình độ tiếng Hán" }
    ],
    examples: [
      { cn: "汉语很有意思。", vn: "Tiếng Trung rất thú vị.", pinyin: "hàn yǔ hěn yǒu yì si." }
    ],
    status: 'learning'
  },
  {
    word: "喜欢",
    pinyin: "xǐ huan",
    meaning: "Thích, yêu thích",
    type: "Động từ",
    collocations: [
      { text: "非常喜欢", pinyin: "fēi cháng xǐ huan", meaning: "Rất thích" },
      { text: "喜欢运动", pinyin: "xǐ huan yùn dòng", meaning: "Thích thể thao" }
    ],
    examples: [
      { cn: "我喜欢听音乐。", vn: "Tôi thích nghe nhạc.", pinyin: "wǒ xǐ huan tīng yīn yuè." }
    ],
    status: 'learning'
  },
  {
    word: "吃饭",
    pinyin: "chī fàn",
    meaning: "Ăn cơm, dùng bữa",
    type: "Động từ",
    collocations: [
      { text: "请吃饭", pinyin: "qǐng chī fàn", meaning: "Mời ăn cơm" },
      { text: "吃饱饭", pinyin: "chī bǎo fàn", meaning: "Ăn no cơm" }
    ],
    examples: [
      { cn: "你吃饭了吗？", vn: "Bạn ăn cơm chưa?", pinyin: "nǐ chī fàn le ma?" }
    ],
    status: 'learning'
  },
  {
    word: "喝水",
    pinyin: "hē shuǐ",
    meaning: "Uống nước",
    type: "Động từ",
    collocations: [
      { text: "多喝水", pinyin: "duō hē shuǐ", meaning: "Uống nhiều nước" },
      { text: "喝温水", pinyin: "hē wēn shuǐ", meaning: "Uống nước ấm" }
    ],
    examples: [
      { cn: "多喝水对身体好。", vn: "Uống nhiều nước tốt cho sức khỏe.", pinyin: "duō hē shuǐ duì shēn tǐ hǎo." }
    ],
    status: 'learning'
  },
  {
    word: "工作",
    pinyin: "gōng zuò",
    meaning: "Công việc, làm việc",
    type: "Động từ / Danh từ",
    collocations: [
      { text: "找工作", pinyin: "zhǎo gōng zuò", meaning: "Tìm việc làm" },
      { text: "工作经验", pinyin: "gōng zuò jīng yàn", meaning: "Kinh nghiệm làm việc" },
      { text: "努力工作", pinyin: "nǔ lì gōng zuò", meaning: "Chăm chỉ làm việc" }
    ],
    examples: [
      { cn: "他在一家公司工作。", vn: "Anh ấy làm việc ở một công ty.", pinyin: "tā zài yī jiā gōng sī gōng zuò." }
    ],
    status: 'learning'
  },
  {
    word: "努力",
    pinyin: "nǔ lì",
    meaning: "Nỗ lực, chăm chỉ, cố gắng",
    type: "Tính từ / Động từ",
    collocations: [
      { text: "共同努力", pinyin: "gòng tóng nǔ lì", meaning: "Cùng nhau nỗ lực" },
      { text: "努力奋斗", pinyin: "nǔ lì fèn dòu", meaning: "Nỗ lực phấn đấu" }
    ],
    examples: [
      { cn: "我们要努力学习。", vn: "Chúng ta phải nỗ lực học tập.", pinyin: "wǒ men yào nǔ lì xué xí." }
    ],
    status: 'learning'
  },
  {
    word: "坚持",
    pinyin: "jiān chí",
    meaning: "Kiên trì, kiên định",
    type: "Động từ",
    collocations: [
      { text: "坚持不懈", pinyin: "jiān chí bù xiè", meaning: "Kiên trì không ngừng" },
      { text: "坚持锻炼", pinyin: "jiān chí duàn liàn", meaning: "Kiên trì rèn luyện" }
    ],
    examples: [
      { cn: "只要坚持就能成功。", vn: "Chỉ cần kiên trì là sẽ thành công.", pinyin: "zhǐ yào jiān chí jiù néng chéng gōng." }
    ],
    status: 'learning'
  },
  {
    word: "成功",
    pinyin: "chéng gōng",
    meaning: "Thành công",
    type: "Danh từ / Động từ",
    collocations: [
      { text: "取得成功", pinyin: "qǔ dé chéng gōng", meaning: "Gặt hái thành công" },
      { text: "成功人士", pinyin: "chéng gōng rén shì", meaning: "Người thành đạt" }
    ],
    examples: [
      { cn: "祝你取得成功！", vn: "Chúc bạn gặt hái thành công!", pinyin: "zhù nǐ qǔ dé chéng gōng!" }
    ],
    status: 'learning'
  },
  {
    word: "明白",
    pinyin: "míng bai",
    meaning: "Hiểu rõ, rõ ràng",
    type: "Động từ / Tính từ",
    collocations: [
      { text: "想明白", pinyin: "xiǎng míng bai", meaning: "Nghĩ thông suốt" },
      { text: "说得很明白", pinyin: "shuō de hěn míng bai", meaning: "Nói rất rõ ràng" }
    ],
    examples: [
      { cn: "我明白你的意思了。", vn: "Tôi hiểu ý của bạn rồi.", pinyin: "wǒ míng bai nǐ de yì si le." }
    ],
    status: 'learning'
  },
  {
    word: "时间",
    pinyin: "shí jiān",
    meaning: "Thời gian",
    type: "Danh từ",
    collocations: [
      { text: "节约时间", pinyin: "jié yuē shí jiān", meaning: "Tiết kiệm thời gian" },
      { text: "有时间", pinyin: "yǒu shí jiān", meaning: "Có thời gian" },
      { text: "浪费时间", pinyin: "làng fèi shí jiān", meaning: "Lãng phí thời gian" }
    ],
    examples: [
      { cn: "你有时间吗？", vn: "Bạn có thời gian không?", pinyin: "nǐ yǒu shí jiān ma?" }
    ],
    status: 'learning'
  },
  {
    word: "帮助",
    pinyin: "bāng zhù",
    meaning: "Giúp đỡ, sự trợ giúp",
    type: "Động từ / Danh từ",
    collocations: [
      { text: "互相帮助", pinyin: "hù xiāng bāng zhù", meaning: "Tương trợ giúp đỡ lẫn nhau" },
      { text: "寻求帮助", pinyin: "xún qiú bāng zhù", meaning: "Tìm kiếm sự giúp đỡ" }
    ],
    examples: [
      { cn: "互相帮助很重要。", vn: "Giúp đỡ lẫn nhau rất quan trọng.", pinyin: "hù xiāng bāng zhù hěn zhòng yào." }
    ],
    status: 'learning'
  },
  {
    word: "高兴",
    pinyin: "gāo xìng",
    meaning: "Vui vẻ, phấn khởi",
    type: "Tính từ",
    collocations: [
      { text: "非常高兴", pinyin: "fēi cháng gāo xìng", meaning: "Rất đỗi vui mừng" },
      { text: "高兴地说", pinyin: "gāo xìng de shuō", meaning: "Vui vẻ nói" }
    ],
    examples: [
      { cn: "今天大家都很高兴。", vn: "Hôm nay mọi người đều rất vui.", pinyin: "jīn tiān dà jiā dōu hěn gāo xìng." }
    ],
    status: 'learning'
  },
  {
    word: "漂亮",
    pinyin: "piào liang",
    meaning: "Xinh đẹp, đẹp đẽ",
    type: "Tính từ",
    collocations: [
      { text: "长得很漂亮", pinyin: "zhǎng de hěn piào liang", meaning: "Trông rất xinh đẹp" },
      { text: "干得漂亮", pinyin: "gàn de piào liang", meaning: "Làm rất xuất sắc" }
    ],
    examples: [
      { cn: "这朵花真漂亮。", vn: "Bông hoa này thật đẹp.", pinyin: "zhè duǒ huā zhēn piào liang." }
    ],
    status: 'learning'
  },
  {
    word: "手机",
    pinyin: "shǒu jī",
    meaning: "Điện thoại di động",
    type: "Danh từ",
    collocations: [
      { text: "智能手机", pinyin: "zhì néng shǒu jī", meaning: "Điện thoại thông minh" },
      { text: "玩手机", pinyin: "wán shǒu jī", meaning: "Nghịch/lướt điện thoại" }
    ],
    examples: [
      { cn: "我的手机没电了。", vn: "Điện thoại của tôi hết pin rồi.", pinyin: "wǒ de shǒu jī méi diàn le." }
    ],
    status: 'learning'
  },
  {
    word: "电脑",
    pinyin: "diàn nǎo",
    meaning: "Máy vi tính",
    type: "Danh từ",
    collocations: [
      { text: "笔记本电脑", pinyin: "bǐ jì běn diàn nǎo", meaning: "Máy tính xách tay" },
      { text: "用电脑", pinyin: "yòng diàn nǎo", meaning: "Dùng máy tính" }
    ],
    examples: [
      { cn: "我用电脑工作。", vn: "Tôi dùng máy tính để làm việc.", pinyin: "wǒ yòng diàn nǎo gōng zuò." }
    ],
    status: 'learning'
  },
  {
    word: "旅游",
    pinyin: "lǚ yóu",
    meaning: "Du lịch",
    type: "Động từ / Danh từ",
    collocations: [
      { text: "自助旅游", pinyin: "zì zhù lǚ yóu", meaning: "Du lịch tự túc" },
      { text: "旅游胜地", pinyin: "lǚ yóu shèng dì", meaning: "Thắng cảnh du lịch" }
    ],
    examples: [
      { cn: "我们打算去北京旅游。", vn: "Chúng tôi dự định đi Bắc Kinh du lịch.", pinyin: "wǒ men dǎ suàn qù běi jīng lǚ yóu." }
    ],
    status: 'learning'
  },
  {
    word: "运动",
    pinyin: "yùn dòng",
    meaning: "Thể thao, vận động",
    type: "Danh từ / Động từ",
    collocations: [
      { text: "参加运动", pinyin: "cān jiā yùn dòng", meaning: "Tham gia vận động" },
      { text: "体育运动", pinyin: "tǐ yù yùn dòng", meaning: "Hoạt động thể thao" }
    ],
    examples: [
      { cn: "经常运动有益健康。", vn: "Thường xuyên vận động có lợi cho sức khỏe.", pinyin: "jīng cháng yùn dòng yǒu yì jiàn kāng." }
    ],
    status: 'learning'
  },
  {
    word: "医生",
    pinyin: "yī shēng",
    meaning: "Bác sĩ",
    type: "Danh từ",
    collocations: [
      { text: "看医生", pinyin: "kàn yī shēng", meaning: "Đi khám bác sĩ" },
      { text: "主治医生", pinyin: "zhǔ zhì yī shēng", meaning: "Bác sĩ điều trị chính" }
    ],
    examples: [
      { cn: "他是一名优秀的医生。", vn: "Anh ấy là một bác sĩ xuất sắc.", pinyin: "tā shì yī míng yōu xiù de yī shēng." }
    ],
    status: 'learning'
  },
  {
    word: "热情",
    pinyin: "rè qíng",
    meaning: "Nhiệt tình, niềm nở",
    type: "Tính từ",
    collocations: [
      { text: "热情好客", pinyin: "rè qíng hào kè", meaning: "Nhiệt tình hiếu khách" },
      { text: "充满热情", pinyin: "chōng mǎn rè qíng", meaning: "Tràn đầy nhiệt huyết" }
    ],
    examples: [
      { cn: "大家都很热情地欢迎我们。", vn: "Mọi người đều rất nhiệt tình chào đón chúng tôi.", pinyin: "dà jiā dōu hěn rè qíng de huān yíng wǒ men." }
    ],
    status: 'learning'
  },
  {
    word: "积累",
    pinyin: "jī lěi",
    meaning: "Tích lũy, dồn góp",
    type: "Động từ",
    collocations: [
      { text: "积累经验", pinyin: "jī lěi jīng yàn", meaning: "Tích lũy kinh nghiệm" },
      { text: "积累财富", pinyin: "jī lěi cái fù", meaning: "Tích lũy của cải" }
    ],
    examples: [
      { cn: "积累经验非常重要。", vn: "Tích lũy kinh nghiệm vô cùng quan trọng.", pinyin: "jī lěi jīng yàn fēi cháng zhòng yào." }
    ],
    status: 'learning'
  }
];

export const INITIAL_VOCABULARY: Flashcard[] = [
  {
    word: "学习",
    pinyin: "xué xí",
    meaning: "Học tập",
    type: "Động từ",
    examples: [
      {
        cn: "我每天学习中文。",
        vn: "Tôi học tiếng Trung mỗi ngày.",
        pinyin: "wǒ měi tiān xué xí zhōng wén."
      }
    ],
    status: 'learning',
    deck: 'HSK1'
  },
  {
    word: "朋友",
    pinyin: "péng yǒu",
    meaning: "Bạn bè",
    type: "Danh từ",
    examples: [
      {
        cn: "他是我的好朋友。",
        vn: "Anh ấy là bạn tốt của tôi.",
        pinyin: "tā shì wǒ de hǎo péng yǒu."
      }
    ],
    status: 'mastered',
    deck: 'HSK1'
  }
];

export const MOCK_TRANSLATION_RULES: TranslationRule[] = [
  {
    zh: "你好",
    vi: "Xin chào"
  },
  {
    zh: "再见",
    vi: "Tạm biệt"
  }
];

