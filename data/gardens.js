import { contentVersion } from './catalog.js';

const source = '五年级上册《语文园地》PDF';
const makeItem = (id, unit, section, subtype, topic, stimulus, expectedResponse, answer, extra = {}) => ({
  id: `garden.${id}.v1`, legacyIds: extra.legacyIds || [], progressKey: extra.progressKey || `garden-${id}`,
  contentVersion, module: 'garden', subtype, textbookUnit: unit, gardenSection: section, topic, source,
  stimulus, expectedResponse, answer, ...extra,
});
const meaning = (text, explanation) => ({ text, meaning: explanation });
const accum = (unit, id, text, pinyin, explanation, topic) => makeItem(
  `u${unit}.accum.${id}`, unit, '日积月累', 'accum_word', topic,
  `${pinyin}\n请写出词语并说明含义。`, '汉字词语 + 词义', meaning(text, explanation), { text, pinyin, word: text },
);
const context = (unit, id, topic, stimulus, explanation, expected = '解释词语或表达在例句中的含义') => makeItem(
  `u${unit}.context.${id}`, unit, '词句段运用', 'context_meaning', topic,
  `${stimulus}\n${expected}。`, expected, meaning('表达作用', explanation),
);
const literacy = (unit, id, text, pinyin, explanation, topic, isIdiom = true) => makeItem(
  `u${unit}.literacy.${id}`, unit, '识字加油站', 'literacy', topic,
  `${pinyin}\n请写出${isIdiom ? '成语' : '词语'}并说明含义。也可以根据含义反向说出${isIdiom ? '这个成语' : '这个词语'}。`,
  `${isIdiom ? '成语' : '词语'} + 词义`, meaning(text, explanation), { text, pinyin, word: text, isReverseSupported: true, isIdiom },
);
const poem = (unit, id, title, dynasty, author, fullText, explanation, keyWords, legacyIds = []) => makeItem(
  `u${unit}.poem.${id}`, unit, '日积月累', 'poem', `${title}·古诗词`,
  `题目：《${title}》\n请背诵全文，并说出作者和朝代。`, '古诗全文 + 作者 + 朝代',
  { title, fullText, dynasty, author, explanation, keyWords }, { poemTitle: title, legacyIds },
);

const U1 = [
  ['卧虎藏龙', 'wò hǔ cáng lóng', '比喻潜藏着杰出的人才，也指深藏不露的高手。'], ['龙马精神', 'lóng mǎ jīng shén', '用来指健旺的精神。'], ['龙飞凤舞', 'lóng fēi fèng wǔ', '形容书法笔势舒展活泼，也形容山势蜿蜒雄伟。'], ['凤毛麟角', 'fèng máo lín jiǎo', '比喻稀少而可贵的人或事物。'],
  ['如虎添翼', 'rú hǔ tiān yì', '比喻强者得到新的帮助后更加强大。'], ['如鱼得水', 'rú yú dé shuǐ', '比喻得到跟自己十分投合的人或合适的环境。'], ['鹤立鸡群', 'hè lì jī qún', '比喻一个人的才能或仪表在一群人里很突出。'], ['一马当先', 'yī mǎ dāng xiān', '形容领先或带头。'],
  ['鼠目寸光', 'shǔ mù cùn guāng', '形容眼光短，见识浅。'], ['抱头鼠窜', 'bào tóu shǔ cuàn', '形容急忙逃走的狼狈相。'], ['狼心狗肺', 'láng xīn gǒu fèi', '形容心肠狠毒或忘恩负义。'], ['狼狈为奸', 'láng bèi wéi jiān', '比喻互相勾结做坏事。'],
  ['狡兔三窟', 'jiǎo tù sān kū', '比喻有多个藏身的地方。'], ['呆若木鸡', 'dāi ruò mù jī', '形容因恐惧或惊讶而发愣。'], ['虾兵蟹将', 'xiā bīng xiè jiàng', '借指不中用的兵将或帮凶。'], ['黔驴技穷', 'qián lǘ jì qióng', '借指仅有的一点本领也用完了。'],
];
const U2 = [
  ['视死如归', 'shì sǐ rú guī', '形容不怕牺牲。'], ['百折不挠', 'bǎi zhé bù náo', '受到许多挫折也不退缩，意志坚强。'], ['身先士卒', 'shēn xiān shì zú', '将领亲自带头，走在士兵前面。'], ['奋勇当先', 'fèn yǒng dāng xiān', '鼓起勇气，赶在最前面。'], ['奋不顾身', 'fèn bù gù shēn', '奋勇向前，不顾自己的安危。'], ['神机妙算', 'shén jī miào suàn', '惊人的机智，巧妙的谋划。'], ['勇往直前', 'yǒng wǎng zhí qián', '勇敢地一直向前，不畏艰难。'], ['坚韧不拔', 'jiān rèn bù bá', '意志坚定，不可动摇。'],
];
const U4 = [
  ['太平盛世', 'tài píng shèng shì', '社会安定、经济繁荣的时代。'], ['政通人和', 'zhèng tōng rén hé', '政事顺利，百姓和乐。'], ['国泰民安', 'guó tài mín ān', '国家太平，人民安乐。'], ['人寿年丰', 'rén shòu nián fēng', '人长寿，年成好，形容生活安定美好。'], ['丰衣足食', 'fēng yī zú shí', '形容生活富裕。'], ['安居乐业', 'ān jū lè yè', '安定地生活，愉快地工作。'], ['路不拾遗', 'lù bù shí yí', '形容社会风气好。'], ['多事之秋', 'duō shì zhī qiū', '事故或事变很多的时期。'],
  ['家破人亡', 'jiā pò rén wáng', '家庭破碎，亲人死亡，形容遭到灾祸。'], ['兵荒马乱', 'bīng huāng mǎ luàn', '形容战争时期社会动荡不安。'], ['流离失所', 'liú lí shī suǒ', '到处奔波，没有安定的居所。'], ['民不聊生', 'mín bù liáo shēng', '老百姓无法生活下去。'], ['生灵涂炭', 'shēng líng tú tàn', '形容人民处于极端困苦的境地。'], ['内忧外患', 'nèi yōu wài huàn', '内部有忧患，外部又有侵扰。'], ['哀鸿遍野', 'āi hóng biàn yě', '比喻到处都是流离失所的灾民。'], ['民安物阜', 'mín ān wù fù', '人民安定，物产丰富。'],
];
const U6 = [
  ['兄友弟恭', 'xiōng yǒu dì gōng', '哥哥友爱弟弟，弟弟恭敬哥哥，形容兄弟和睦。'], ['父慈子孝', 'fù cí zǐ xiào', '父亲慈爱，子女孝顺。'], ['家喻户晓', 'jiā yù hù xiǎo', '家家户户都知道。'], ['心浮气躁', 'xīn fú qì zào', '心思浮动，性情急躁。'], ['相亲相爱', 'xiāng qīn xiāng ài', '互相亲近爱护。'], ['如泣如诉', 'rú qì rú sù', '形容声音悲切。'], ['一张一弛', 'yī zhāng yī chí', '有张有弛，劳逸结合。'], ['不声不响', 'bù shēng bù xiǎng', '不发出声音，形容不声张。'], ['喜怒哀乐', 'xǐ nù āi lè', '人的高兴、愤怒、悲哀和快乐等感情。'], ['酸甜苦辣', 'suān tián kǔ là', '比喻生活中的各种滋味。'], ['亭台楼阁', 'tíng tái lóu gé', '泛指多种供游赏、休息的建筑物。'], ['诗词歌赋', 'shī cí gē fù', '诗、词、歌、赋的总称。'],
];
const U7 = [
  ['湘菜', 'xiāng cài', '湖南风味的菜肴。'], ['粤菜', 'yuè cài', '广东风味的菜肴。'], ['蜀绣', 'shǔ xiù', '四川的刺绣。'], ['苏绣', 'sū xiù', '苏州的刺绣。'], ['沪剧', 'hù jù', '上海地方戏曲。'], ['滇剧', 'diān jù', '云南地方戏曲。'], ['赣江', 'gàn jiāng', '江西境内的河流。'], ['闽江', 'mǐn jiāng', '福建境内的河流。'], ['陕北', 'shǎn běi', '陕西北部地区。'], ['窑洞', 'yáo dòng', '在土山中挖成的洞穴式住宅。'], ['皖南', 'wǎn nán', '安徽南部地区。'], ['民居', 'mín jū', '普通居民的住宅。'],
];

const gardenItems = [
  ...U1.map(([text, pinyin, explanation], i) => makeItem(`u1.accum.${i + 1}`, 1, '日积月累', 'accum_word', '动物相关成语', `${pinyin}\n请写出成语并说明含义。`, '汉字成语 + 词义', meaning(text, explanation), { text, pinyin, word: text, legacyIds: text === '如鱼得水' ? ['idiom-ru-yu-de-shui'] : [] })),
  context(1, 1, '一词多义·姿态', '桂花树的样子姿态，和以前不一样了。', '姿势、样子。'),
  context(1, 2, '一词多义·开辟', '让它荒着怪可惜的，大家一起开辟出来种花生吧。', '开垦，把荒地开发成可以种植的土地。'),
  context(1, 3, '一词多义·温和', '请比较“温和”形容人的性格和天气时的不同意思。', '形容人的性情平和或气候不冷不热。'),
  context(1, 4, '一词多义·新鲜', '请分别说明“新鲜”形容食物和表示新奇、稀罕时的意思。', '食物没有变质；事物刚出现而不常见。'),
  ...U2.map(([text, pinyin, explanation], i) => accum(2, i + 1, text, pinyin, explanation, '人物品质成语')),
  context(2, 1, '词语在语境中的含义', '“麻烦”很不服气，他对别人说：“我麻烦立下了那么多战功。”', '此处为人物姓名中的用字；“麻烦”通常也指使人感到不便或烦扰的事情。'),
  context(2, 2, '词语在语境中的含义', '光的速度是惊人的，大约是30万千米每秒。', '表示物体运动快慢的量。'),
  context(2, 3, '词语在语境中的含义', '（冀中人民）在广阔平原的地底下，挖了不计其数的地道。', '面积或范围广大。'),
  makeItem('u2.quote.1', 2, '日积月累', 'quote', '珍惜时间·陶渊明', '提示：青壮年时期过去不会重来，应趁年富力强及时努力。', '完整句子 + 发言人', '盛年不重来，一日难再晨。及时当勉励，岁月不待人。——陶渊明', { speaker: '陶渊明', legacyIds: ['quote-tao'] }),
  makeItem('u2.quote.2', 2, '日积月累', 'quote', '珍惜时间·岳飞', '提示：不要把年少的大好青春等闲虚度，老年才后悔。', '完整句子 + 发言人', '莫等闲，白了少年头，空悲切。——岳飞', { speaker: '岳飞', legacyIds: ['quote-yue-fei'] }),
  makeItem('u2.quote.3', 2, '日积月累', 'quote', '珍惜时间·毛泽东', '提示：光阴催人老，要珍惜现在的每一天。', '完整句子 + 发言人', '多少事，从来急；天地转，光阴迫。一万年太久，只争朝夕。——毛泽东', { speaker: '毛泽东', legacyIds: ['quote-mao'] }),
  poem(3, 'qiqiao', '乞巧', '唐', '林杰', '七夕今宵看碧霄，牵牛织女渡河桥。家家乞巧望秋月，穿尽红丝几万条。', '农历七月初七看碧蓝的天空，牛郎织女渡过银河相会；家家户户一边望秋月一边乞求灵巧。', [['碧霄', '碧蓝的天空'], ['乞巧', '七夕向织女星祈求心灵手巧'], ['红丝', '红色的丝线']], ['poem-qi-qiao']),
  ...U4.map(([text, pinyin, explanation], i) => accum(4, i + 1, text, pinyin, explanation, '太平盛世与乱世')),
  ...[
    ['举世闻名', '臭名远扬', '前者表示全世界都知道，多含褒义；后者表示坏名声传得很远，含贬义。'], ['兴高采烈', '得意忘形', '前者形容兴致高；后者形容高兴得失去常态，多含贬义。'], ['足智多谋', '诡计多端', '前者形容富有智慧；后者形容坏主意很多，含贬义。'], ['呕心沥血', '处心积虑', '前者形容费尽心血，多用于褒义；后者形容长期谋划，多含贬义。'],
  ].map(([word, contrast, explanation], i) => context(4, i + 1, '褒贬词语辨析', `请解释“${word}”在例句中的含义，并与“${contrast}”比较感情色彩。例句：这个故事${word}，值得我们认真学习。`, explanation)),
  ...U6.map(([text, pinyin, explanation], i) => literacy(6, i + 1, text, pinyin, explanation, '家庭与生活成语')),
  ...[
    ['就这样，我有了第一本长篇小说……', '省略号表示语意未尽，后面还有内容没有写出。'], ['……醒来，枕边一片湿。', '省略号表示语意未尽，省略了梦中或回忆中的内容。'], ['信写至此，夜已深。不禁想起你们睡梦中甜美的面庞。', '省略或停顿能表现深厚、细腻的感情。'], ['那一天我第一次发现，母亲原来是那么瘦小！', '“第一次”点明此前没有这样的发现，突出成长中的新感受。'],
  ].map(([sentence, explanation], i) => context(6, i + 1, '课文结尾与“第一次”', sentence, explanation, '解释表达作用')),
  poem(6, 'youziyin', '游子吟', '唐', '孟郊', '慈母手中线，游子身上衣。临行密密缝，意恐迟迟归。谁言寸草心，报得三春晖。', '慈母为远行的孩子缝衣，担心孩子迟迟不能回来；子女微小的孝心难以报答慈母深恩。', [['游子', '远行在外的人'], ['意恐', '担心'], ['寸草心', '子女微小的孝心'], ['三春晖', '比喻慈母的恩德']], ['poem-you-zi-yin']),
  ...U7.map(([text, pinyin, explanation], i) => literacy(7, i + 1, text, pinyin, explanation, '地域简称与地方文化', false)),
  ...[
    ['下雪了。', '可从时间、声音、雪花形态或地面变化等方面补充具体细节。'], ['开始下雪时还伴着小雨，不久雨住了，风停了，就只见大片大片的雪花，从彤云密布的天空中飘落下来，地上一会儿就白了。', '按雨停、风停、雪花飘落、地面变白的顺序，写出天气变化和动态画面。'], ['在清水田里，时有一只两只白鹭站着钓鱼，整个的田便成了一幅嵌在玻璃框里的画面。', '通过数量、动作和比喻，写出白鹭、清水田及玻璃框画面的静谧和美。'],
  ].map(([sentence, explanation], i) => context(7, i + 1, '把画面写具体', sentence, explanation, '解释表达方法或补写具体画面')),
  poem(7, 'yugezi', '渔歌子', '唐', '张志和', '西塞山前白鹭飞，桃花流水鳜鱼肥。青箬笠，绿蓑衣，斜风细雨不须归。', '白鹭飞翔、桃花盛开、鳜鱼肥美；渔翁在斜风细雨中悠然垂钓，乐而忘归。', [['西塞山', '山名'], ['鳜鱼', '一种味道鲜美的鱼'], ['箬笠', '用箬竹叶或竹篾做的斗笠'], ['蓑衣', '用草或棕等制成的雨衣']], ['poem-yu-ge-zi']),
  ...[
    ['阅读是什么？是吸收。把脑子里的东西拿出来，是表达。好像每天吃饭吸收营养一样，阅读就是吸收精神上的营养。阅读和写作，吸收和表达，一个是进，从外到内；一个是出，从内到外。写作是什么？是表达。', '按“阅读定义→阅读比喻→阅读与写作关系→写作定义”的顺序排列。'], ['书可以比喻成什么？请用一句话表达你的理解。', '示例：书是一位博学的老师，总能在我需要时给我新的知识。'], ['那部书里着力描写的人物，如林冲、武松、鲁智深，都有鲜明的性格。', '顿号用于句子内部并列词语之间。'], ['我们吃的粮食、蔬菜、水果、肉类，穿的棉、麻、毛、丝，都和太阳有密切关系。', '顿号把同一层级的并列事物分隔开。'], ['毽子越踢越高，有黑鸡毛的、白鸡毛的、芦花鸡毛的等，各种颜色的毽子满院子飞。', '顿号用于并列的“的”字短语之间。'],
  ].map(([sentence, explanation], i) => context(8, i + 1, '句序、比喻与顿号', sentence, explanation, '解释表达方法')),
  poem(8, 'guanshu', '观书有感（其一）', '宋', '朱熹', '半亩方塘一鉴开，天光云影共徘徊。问渠那得清如许？为有源头活水来。', '池水清澈因为有活水不断流来；诗人借此说明只有不断学习、接受新知识，思想才会保持活跃和进步。', [['方塘', '方形的池塘'], ['一鉴开', '像一面镜子打开'], ['渠', '它，指方塘'], ['清如许', '清澈得像这样'], ['源头活水', '不断得到的新知识、新事物']], ['poem-guan-shu-you-gan']),
];

export { gardenItems };
export const gardenStats = {
  total: gardenItems.length,
  units: [...new Set(gardenItems.map((entry) => entry.textbookUnit))],
  sections: [...new Set(gardenItems.map((entry) => entry.gardenSection))],
};
