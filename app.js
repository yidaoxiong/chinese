import { reciteCards, recognitionSeeds, writingItems, vocabItems } from './data.js';

const GOAL = 20;
const MAX_DAILY_RECITE = 3;
const END_DATE = '2026-08-31';
const CLIENT_KEY = 'chinese_client_id';
const LOCAL_STATE_KEY = 'chinese_card_progress_v1';
const LOCAL_LOG_KEY = 'chinese_review_log_v1';

const $ = (id) => document.getElementById(id);
const state = { user: null, cardProgress: {}, logs: [], session: null, serverStats: [], usedTodayIds: new Set() };

const charMeanings = {
  鹭: '白鹭，一种羽毛白色的水鸟。', 嫌: '嫌弃，认为不合意或不喜欢。', 嵌: '把较小的东西卡进较大东西的空隙里。', 匣: '收藏东西的器具，通常呈小盒状。', 嗜: '特别爱好，爱好得近乎成癖。',
  亩: '土地面积单位，一亩约合六百六十七平方米。', 吩: '口头指派或命令。', 榨: '压取汁液。', 榴: '石榴，落叶灌木或小乔木。', 矮: '高度小。', 箩: '用竹篾编成的器具。', 杭: '杭州的简称。',
  蔓: '植物细长而能攀援的茎。', 幽: '深远、僻静。', 悉: '知道，了解。', 雏: '幼小的鸟。', 哟: '语气词，表示惊异或感叹。', 柜: '收藏物品的器具。', 享: '享受，得到或享用。', 陪: '伴随在旁边。', 待: '停留，处于某种状态。', 趴: '身体向前靠在物体上。', 睑: '眼皮。', 眸: '眼珠，泛指眼睛。',
  汛: '江河定期的涨水。', 挽: '拉，牵引；挽留。', 惰: '懒，不勤快。', 衡: '称量轻重的器具；平衡。', 协: '共同合作；协调。', 绰: '宽裕；宽绰。', 璧: '古代的一种玉器。', 臣: '君主时代的官员。', 强: '力量大；坚强。', 诺: '答应，允许。', 划: '用船桨拨水前进。', 典: '可以作为标准的书籍或仪式。', 罪: '犯法的行为；过错。', 廉: '正直清白；不贪污。', 抵: '顶住；到达。', 御: '抵挡；驾驭。', 辞: '告别；推辞；辞退。', 辱: '使受到羞耻。', 擅: '自作主张，专权。', 卿: '古代对人的敬称。', 削: '减少；削弱。', 袍: '中式长衣。',
  鸵: '鸵鸟，不能飞而善于奔跑的大鸟。', 赢: '获胜，获得成功。', 冠: '帽子；冠军。', 侵: '侵犯，侵入。', 略: '大致；夺取；省去。', 垒: '军营的围墙；堆砌。', 任: '担任；任务。', 丘: '小山。', 搁: '放置；停留。', 陷: '掉进；凹进；陷阱。', 拐: '转弯；骗走。', 岔: '道路分出的地方。',
  酬: '报答；用财物答谢。', 誓: '表示决心的话。', 谎: '不真实的话。', 牺: '牺牲；为正义舍弃生命或利益。', 嫂: '哥哥的妻子。', 恳: '诚恳；真挚。', 筛: '用筛子分拣；筛选。', 歹: '坏；不好。', 罕: '稀少。', 梭: '织布时往返穿行的工具。', 监: '监督；看管。', 狱: '监狱；诉讼案件。', 酿: '利用发酵制造。', 瞌: '上下眼皮打架，想睡觉。', 落: '掉下；降落。', 婚: '结婚。',
  俭: '节省，不浪费。', 皇: '君主；皇帝。', 偎: '紧挨着。', 衰: '衰弱；衰老。', 珊: '珊瑚的一部分。', 瑚: '珊瑚的一部分。', 礁: '海中或江中的岩石。', 筐: '用竹篾等编成的盛物器具。', 拗: '固执，不顺从。', 乃: '你，你的；于是。', 熏: '烟气接触；熏陶。', 亥: '地支的第十二位。', 恃: '依靠；凭借。', 擞: '振作，抖动。',
  泻: '很快地流下；倾泻。', 鳞: '鱼类等体表的薄片。', 惶: '恐惧不安。', 胎: '人或动物母体内的幼体。', 履: '踩；履行。', 哉: '语气词，表示赞叹。', 估: '估计，推测。', 煌: '明亮；光辉。', 珑: '玲珑，精巧细致。', 剔: '从骨头上把肉刮掉；挑出。', 澜: '大波浪。', 陵: '大土山；陵墓。', 宏: '广大；宏伟。', 奉: '恭敬地接受或执行。', 烬: '物体燃烧后剩下的东西。',
  域: '一定范围的地方。', 艇: '轻便的小船。', 矛: '古代刺兵器。', 盾: '古代防护身体的兵器。', 筷: '夹取食物的用具。', 炊: '烧火做饭。', 哼: '鼻子发出的声音。', 喉: '咽喉。', 咙: '喉咙。', 勺: '舀取东西的用具。', 搅: '搅拌；扰乱。', 舀: '用瓢、勺等取东西。', 摄: '吸收；拍摄；测量。', 殖: '生长繁殖。', 炭: '木炭等燃料。', 疗: '医治。',
  驯: '使动物顺从；驯服。', 矫: '强壮；纠正。', 歇: '休息；停止。', 杈: '树的分枝。', 藓: '苔藓植物。', 狭: '窄，宽度小。', 勉: '努力；勉强。', 锥: '一端尖的工具。', 魄: '精神；气魄。', 抑: '压下；控制。', 颓: '衰败；精神不振。', 纫: '引线穿过针眼；缝纫。', 噪: '许多声音混在一起。', 褐: '像栗子皮的颜色。', 惫: '疲倦。', 耽: '迟延；拖延。', 兜: '口袋；环绕。', 权: '权力；权利。',
  茧: '蚕吐丝结成的壳。', 栈: '养牲口的棚；客栈。', 冤: '受到不公平的待遇。', 枉: '白费；弯曲。', 恍: '仿佛；忽然。', 惚: '恍惚，精神不集中。', 跷: '抬起；翘起。', 僻: '偏僻；不常见。', 委: '曲折；委屈。', 迪: '开导；启发。', 嫁: '女子结婚。', 缴: '交纳；缴纳。', 榜: '张贴的名单；榜样。', 兼: '同时具有或担任。', 嘲: '嘲笑。', 枕: '枕头；靠着。', 誊: '照原文抄写。', 励: '劝勉；鼓励。', 版: '印刷物的一面；版本。', 祥: '吉利。', 歧: '岔道；不同的。', 谨: '慎重，小心。', 榆: '榆树。', 畔: '边；旁边。', 更: '改变；改换。', 聒: '声音嘈杂使人烦。',
  旷: '空阔；开朗。', 怡: '和悦；愉快。', 凛: '寒冷；严肃可敬。', 冽: '寒冷。', 逸: '安乐；闲适。', 桨: '划船的工具。', 桩: '插入地里的木柱。', 暇: '空闲时间。', 悄: '没有声音或声音很低。', 累: '疲劳。', 嫦: '嫦娥，神话人物。', 娥: '美女；嫦娥。', 嫉: '因别人比自己好而不满。', 妒: '因别人比自己好而不满。', 瓷: '用黏土烧制的器物。', 耻: '羞愧；羞辱。', 识: '记住；知道。', 寝: '睡觉；卧室。', 矣: '语气词，表示完成或肯定。', 岂: '表示反问，难道。',
  舅: '母亲的兄弟。', 宴: '请人吃饭喝酒的聚会。', 斩: '砍断；杀。', 凯: '胜利；胜利的乐曲。', 葛: '藤本植物；姓。', 述: '叙述；说明。', 浒: '水边；水浒。', 传: '传记；记载人物事迹的文章。', 鲁: '迟钝；粗野；姓。', 煞: '很；极。', 寇: '盗匪；侵略者。', 贾: '商人；姓。', 卷: '书本；卷起来。', 刊: '书刊；排印出版。', 琐: '细小而繁杂。', 栩: '生动的样子。', 呻: '因痛苦而发出声音。', 某: '指不明确的人或事物。', 喻: '说明；比喻。', 差: '不同；不相同。', 瘾: '长期形成的特殊嗜好。', 奔: '快跑。', 籍: '书；登记册。', 饥: '饿。', 偿: '归还；补偿。', 甸: '郊外；古代地名用字。', 悟: '理解；醒悟。', 馈: '赠送；以食物相待。', 磁: '能吸引铁的性质。', 酵: '发酵；酵母。', 皎: '洁白明亮。', 鉴: '镜子；观察和借鉴。', 沥: '液体一滴一滴地落下。'
};

const wordMeanings = {
  桂花: '木樨的花，秋季开花，香气浓郁。', 故乡: '出生或长期居住过的地方。', 欣赏: '享受美好的事物，领略其中的情趣。', 木兰花: '木兰树开的花。', 台风: '发生在热带海洋上的强烈气旋。', 老婆婆: '年老的妇女。', 糕饼: '糕点和饼类食品。', 尤其: '表示特别，强调程度更深。', 使劲: '用力。', 茶叶: '茶树的嫩叶和芽，制成后用来泡茶。',
  浇水: '把水浇在植物或土地上。', 食品: '供人食用的物品。', 吟咏: '有节奏地诵读诗文。', 茅亭: '用茅草覆盖的亭子。', 可贵: '值得珍视。', 嫩绿: '浅而鲜的绿色。', 体面: '光荣，光彩；好看。', 平原: '地势平坦的广大地区。', 封锁: '封闭并切断联系或交通。', 粉碎: '使彻底破坏；彻底消灭。', 简直: '表示完全如此或差不多如此。', 广阔: '面积或范围广大。', 照常: '按照平常的情况。', 游击: '以灵活机动方式袭击敌人的战斗。', 战争: '敌对双方为达到目的而进行的武装斗争。', 妨碍: '使事情不能顺利进行。', 距离: '在空间或时间上的间隔。', 厕所: '供人排泄的地方。', 光线: '光。', 陷坑: '用来使人或动物掉进去的坑。', 民兵: '不脱离生产的群众武装组织。', 拐弯: '改变行进方向。', 木棒: '木制的棍子。', 破坏: '使事物受到损坏。', 对付: '处理；应付。', 铜铃: '用铜制成的铃。', 无穷无尽: '没有止境。', 抗日战争: '中国人民抗击日本侵略的战争。',
  无价之宝: '无法估价的珍贵宝物。', 召集: '通知人们聚集起来。', 大臣: '君主制国家的高级官员。', 商议: '讨论决定。', 理亏: '理由不足，处于不利地位。', 进宫: '进入皇宫。', 交付: '交给；付给。', 允诺: '应许。', 隆重: '盛大而庄重。', 典礼: '隆重的仪式。', 约定: '共同商定并遵守。', 思量: '考虑。', 承诺: '答应承担某项事情。', 国君: '一国的君主。', 推荐: '把好的人或事物介绍给别人。', 助兴: '帮助增加兴致。', 拒绝: '不接受或不答应。', 同归于尽: '一起走向毁灭。', 诸位: '各位。', 同心协力: '团结一致，共同努力。',
  速度: '表示物体运动快慢的量。', 赛跑: '比赛跑步。', 冠军: '竞赛中第一名。', 超过: '超出；胜过。', 高度: '高低的程度。', 火箭: '靠喷射燃气产生推力飞行的装置。', 摆脱: '脱离困境或束缚。', 发动机: '把其他能量转化为机械能的机器。', 照例: '按照惯例。', 航线: '船或飞机航行的路线。', 弥漫: '充满；到处都是。', 小心翼翼: '谨慎小心，一点不敢疏忽。', 海峡: '两块陆地之间狭窄的水道。', 容量: '容器能够容纳的量。', 凌晨: '天快亮或刚亮的时候。', 隐约: '看起来或听起来不很清楚。', 剖开: '切开；分析。', 震荡: '震动，动荡。', 惊恐万状: '十分惊恐，表现出各种害怕的样子。', 混乱: '没有条理和秩序。', 势不可当: '来势迅猛，无法阻挡。', 违抗: '违背并抗拒。', 争执: '各持己见，互不相让地争论。', 悲壮: '悲哀而壮烈。', 岗位: '职位；工作位置。', 主宰: '掌握、支配。', 惊慌失措: '惊慌得不知道怎么办。', 犹如: '好像。', 纹丝不动: '一点也不动。', 相提并论: '把不同的人或事物放在一起谈论或看待。', 忠于职守: '忠诚地做好本职工作。', 壮举: '伟大的举动。',
  流传: '传下来或传播开。', 呼救: '呼喊求救。', 救命: '请求救助或表示情况危急。', 酬谢: '用财物或行动答谢。', 叮嘱: '再三嘱咐。', 飞禽走兽: '鸟类和兽类，泛指各种动物。', 议论: '对人或事物发表评论。', 催促: '赶快行动。', 千真万确: '非常真实，毫无疑问。', 迟延: '耽搁，拖延。', 镇定: '遇到紧急情况不慌乱。', 避难: '躲避灾难或迫害。', 后悔: '事后懊悔。', 密布: '分布得很密。', 怒号: '大声吼叫，多指风声。', 倾盆大雨: '雨大得像把盆里的水倒下来。', 震天动地: '声势浩大或事业伟大。', 世世代代: '一代又一代。',
  嫂子: '哥哥的妻子。', 牛棚: '饲养牛的棚子。', 床铺: '床。', 眉开眼笑: '高兴愉快的样子。', 美中不足: '虽然很好，但还有缺点。', 成家立业: '建立家庭，创立事业。', 稀罕: '稀奇；认为稀有而喜爱。', 幸亏: '表示由于某种有利条件而避免不良后果。', 打柴: '砍柴或拾取柴禾。', 纱衣: '用纱制成的衣服。', 妻子: '男女结婚后，女子是男子的妻子。', 装饰: '在身体或物体表面加些附属东西使美观。', 一辈子: '一生。', 结婚: '男女依法结为夫妻。', 相依为命: '互相依靠着生活。',
  毁灭: '彻底破坏或消灭。', 不可估量: '难以估计。', 损失: '失去的东西或受到的损害。', 举世闻名: '全世界都知道。', 园林: '种植花木、供人游览休息的地方。', 组成: '组合而成。', 众星拱月: '许多事物围绕一个中心。', 环绕: '围绕。', 殿堂: '高大的房屋，也比喻庄严的场所。', 亭台楼阁: '泛指多种供游赏休息的建筑物。', 象征: '用具体事物表现某种抽象意义。', 仿照: '按照样子模仿。', 名胜: '有名的风景优美的地方。', 诗情画意: '像诗画一样优美的意境。', 漫步: '悠闲地走。', 漫游: '随意游览。', 天南海北: '形容距离遥远或谈论范围很广。', 饱览: '充分地看，尽情欣赏。', 宏伟: '雄伟而大气。', 奇珍异宝: '珍奇的宝物。', 博物馆: '收藏、研究、展示文物的机构。', 销毁: '烧掉或破坏掉。', 罪证: '证明有罪的证据。', 奉命: '接受命令。', 瑰宝: '珍贵的宝物。', 精华: '最重要、最好的部分。',
  寸草不生: '连一点草都不生长，形容荒凉。', 实际: '客观存在的；真实情况。', 摄氏度: '温度单位。', 繁殖: '生物产生新的个体。', 粮食: '供人食用的谷物、豆类等。', 煤炭: '煤的总称。', 水蒸气: '水受热变成的气体。', 水滴: '水的小滴。', 地区: '较大的区域。', 热量: '物体含有的能量，也指热的多少。', 杀菌: '杀死病菌。', 预防: '事先防备。', 治疗: '用药物、手术等消除疾病。', 金字塔: '埃及等地的方锥形建筑。', 埃及: '国家名。', 陵墓: '帝王或名人的坟墓。', 建筑: '建造房屋等；建筑物。', 堆砌: '把砖石等堆积起来，也比喻堆积词句。', 狭长: '窄而长。', 叹为观止: '赞叹看到的好到了极点。',
  慈母: '慈爱的母亲。', 长篇: '篇幅很长的作品。', 辞退: '解雇。', 压抑: '压制使不能充分表现。', 潮湿: '含有比正常状态较多的水分。', 忙碌: '事情多，不得闲。', 酷暑: '极热的夏天。', 扫视: '目光迅速地向四周看。', 噪声: '嘈杂刺耳的声音。', 脊背: '背部。', 忍心: '心里不忍。', 机械: '利用物理规律组成的装置；呆板。', 权利: '依法享有的利益和资格。', 节省: '使耗费减少。', 旅店: '供旅客住宿的地方。', 教训: '教育训诫；从错误中得到的认识。', 席子: '用草、竹篾等编成的床上用品。', 糖果: '以糖为主要原料制成的食品。', 委屈: '受到不应有的指责或待遇而难过。', 抽象: '从具体事物中概括出共同本质。', 启迪: '开导，启发。', 缺课: '应该上课却没有上课。', 出嫁: '女子结婚。', 陪嫁: '女子出嫁时随带的财物。', 毕业: '完成学习任务，达到规定要求。', 品尝: '仔细辨别味道。', 意识: '人的头脑对客观世界的反映。', 星斗: '星星的总称。', 精致: '精巧细致。',
  精巧: '精细巧妙。', 身段: '身体的姿态；身材。', 适宜: '合适，相宜。', 寻常: '平常。', 忘却: '忘记。', 安稳: '平稳，稳定。', 悠然: '悠闲自在的样子。', 望哨: '站岗放哨。', 恩惠: '给予的或受到的好处。', 父慈子孝: '父亲慈爱，子女孝顺。', 心浮气躁: '心思浮动，性情急躁。', 家喻户晓: '家家户户都知道。', 一张一弛: '有张有弛，劳逸结合。', 诗词歌赋: '诗、词、歌、赋的总称。', 笙箫管笛: '几种管乐器的合称。', 侵入: '进入并侵犯。', 飘落: '飘着降落。', 粉妆玉砌: '白雪覆盖大地，像用白玉砌成。', 彩虹: '雨过天晴时出现的弧形彩色光带。', 俗话: '通俗流行的话。', 瑞雪: '应时的好雪。', 供应: '以物资满足需要。', 湘菜: '湖南风味菜肴。', 粤菜: '广东风味菜肴。', 蜀绣: '四川的刺绣。', 苏绣: '苏州的刺绣。', 沪剧: '上海地方戏曲。', 滇剧: '云南地方戏曲。', 赣江: '江西境内的河流。', 闽江: '福建境内的河流。', 陕北: '陕西北部地区。', 窑洞: '在土山中挖成的洞穴式住宅。', 皖南: '安徽南部地区。', 民居: '普通居民的住宅。', 舅父: '母亲的兄弟。', 公事: '公家的事务。', 一知半解: '知道得不全面，理解得不深。', 兴趣: '喜好的情绪。', 述说: '叙述说明。', 勉勉强强: '刚好能应付。', 厌烦: '嫌麻烦而讨厌。', 朝代: '建立国号的帝王世代相传的整个时期。', 兴亡盛衰: '兴盛、衰亡、繁荣、衰败。', 处世: '在社会上生活和与人交往。', 书刊: '书籍和刊物。', 精彩: '出色；漂亮。', 质朴: '朴实，不矫饰。', 浅显: '浅近明白，容易懂。', 国际: '国与国之间。', 刊物: '定期或不定期出版的读物。'
};

const genericMeaning = (term) => `课文词语“${term}”的释义可结合所在课文语境理解。`;
const meaningForWord = (term) => wordMeanings[term] || genericMeaning(term);
const meaningForChar = (char, group) => charMeanings[char] || `在“${group}”中表示与该词相关的意思。`;
const sentenceFor = (word) => `例句：我们在课文中读到了“${word}”，并试着用它说一句完整的话。`;

const cards = [
  ...reciteCards.map((card) => ({ ...card, category: 'recite', label: card.kind === 'idiom' ? '成语背诵' : card.kind === 'quote' ? '名人语录' : card.kind === 'poem' ? '诗词背诵' : card.id.startsWith('article-') ? '课文背诵' : '其他背诵' })),
  ...recognitionSeeds.map(([char, pinyin, group], index) => ({ id: `recognition-${index + 1}-${char}`, category: 'recognition', label: '识字表', source: '识字表', char, pinyin, group })),
  ...writingItems.map((item, index) => ({ id: `writing-${index + 1}-${item.char}`, category: 'writing', label: '写字表', source: item.lesson, ...item })),
  ...vocabItems.map((item, index) => ({ id: `vocab-${index + 1}-${item.word}`, category: 'vocab', label: '词语表', source: item.lesson, ...item }))
];

function filterKey(card) {
  if (card.category === 'recognition') return 'recognition';
  if (card.category === 'writing') return 'writing';
  if (card.category === 'vocab') return 'vocab';
  if (card.kind === 'poem') return 'recite-poem';
  if (card.kind === 'idiom') return 'recite-idiom';
  if (card.kind === 'article' && card.id.startsWith('article-')) return 'recite-article';
  return 'recite-other';
}

function selectedFilters() {
  return new Set([...document.querySelectorAll('[data-study-filter]:checked')].map((input) => input.value));
}

function selectedOrder() {
  return document.querySelector('[name="card-order"]:checked')?.value || 'random';
}

function arrangeCards(list) {
  return selectedOrder() === 'sequential' ? [...list] : shuffle(list);
}

function syncFilterControls() {
  const filters = [...document.querySelectorAll('[data-study-filter]')];
  const selected = filters.filter((input) => input.checked).length;
  $('selectAllFilters').checked = selected === filters.length;
  $('selectAllFilters').indeterminate = selected > 0 && selected < filters.length;
  $('filterHint').textContent = selected ? `已选择 ${selected} 类内容；背诵类当天最多 ${MAX_DAILY_RECITE} 道。` : '请至少选择一类内容；背诵类当天最多 3 道。';
}

function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function getClientId() {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) { id = `${crypto.randomUUID()}-${crypto.randomUUID()}`; localStorage.setItem(CLIENT_KEY, id); }
  return id;
}

function readLocal() {
  try { state.cardProgress = JSON.parse(localStorage.getItem(LOCAL_STATE_KEY) || '{}'); } catch { state.cardProgress = {}; }
  try { state.logs = JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || '[]'); } catch { state.logs = []; }
}

function saveLocal() {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state.cardProgress));
  localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(state.logs.slice(-1000)));
}

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

function cardQuestion(card) {
  if (card.category === 'recite') {
    if (card.kind === 'idiom') {
      const meaning = card.answer.split('释义：')[1] || '';
      return { title: '成语｜首字拼音与含义', prompt: `${card.prompt}\n成语含义：${meaning}\n\n请写出这个成语。`, answer: card.answer };
    }
    if (card.kind === 'poem') return { title: card.title, prompt: '根据诗词名字，写出诗词完整内容及作者和朝代。', answer: card.answer };
    return { title: card.title, prompt: card.prompt, answer: card.answer };
  }
  if (card.category === 'recognition') return { title: `识字表｜${card.char}`, prompt: `字：${card.char}\n组词：${card.group}\n\n请说出这个字的拼音和字义，再解释组词。`, answer: `拼音：${card.pinyin}\n字义：${meaningForChar(card.char, card.group)}\n组词：${card.group}\n组词释义：${meaningForWord(card.group)}` };
  if (card.category === 'writing') { const group = card.group || `${card.char}（请结合课文组词）`; const groupPinyin = card.groupPinyin || card.pinyin; return { title: '写字表｜根据拼音写字', prompt: `字的拼音：${card.pinyin}\n组词的拼音：${groupPinyin}\n\n请写出汉字，并说出字义和组词释义。`, answer: `字：${card.char}\n字义：${meaningForChar(card.char, group)}\n组词：${group}\n组词释义：${meaningForWord(group)}` }; }
  return { title: '词语表｜根据拼音写词语', prompt: `词语拼音：${card.pinyin}\n\n请写出词语，并说出释义和造句。`, answer: `词语：${card.word}\n释义：${meaningForWord(card.word)}\n造句：${sentenceFor(card.word)}` };
}

function isDue(card) {
  const progress = state.cardProgress[card.id];
  return !progress || !progress.dueAt || new Date(progress.dueAt).getTime() <= Date.now();
}

function buildSession(isExtra = false) {
  const filters = selectedFilters();
  const selectedCards = cards.filter((card) => filters.has(filterKey(card)) && !state.usedTodayIds.has(card.id));
  const due = arrangeCards(selectedCards.filter(isDue));
  const reviewedRecite = logsForDate(dateKey()).filter((log) => log.category === 'recite').length;
  const reciteLimit = Math.max(0, MAX_DAILY_RECITE - reviewedRecite);
  const recite = due.filter((card) => card.category === 'recite').slice(0, reciteLimit);
  const other = due.filter((card) => card.category !== 'recite').slice(0, GOAL - recite.length);
  let selected = [...recite, ...other];
  if (selected.length < GOAL) {
    const reciteCount = selected.filter((card) => card.category === 'recite').length;
    const backupRecite = arrangeCards(selectedCards.filter((card) => card.category === 'recite' && !selected.includes(card))).slice(0, Math.max(0, reciteLimit - reciteCount));
    selected = [...selected, ...backupRecite];
    const remaining = arrangeCards(selectedCards.filter((card) => !selected.includes(card) && (card.category !== 'recite' || reciteCount + backupRecite.length < reciteLimit))).slice(0, GOAL - selected.length);
    selected = [...selected, ...remaining];
  }
  return { cards: arrangeCards(selected).slice(0, GOAL), index: 0, startedAt: Date.now(), answered: false, isExtra };
}

function progressForRating(old, rating) {
  let repetitions = Number(old?.repetitions || 0);
  let ease = Number(old?.easeFactor || 2.5);
  let interval = Number(old?.intervalDays || 0);
  if (rating === 'again') { repetitions = 0; interval = 0; ease = Math.max(1.3, ease - .2); }
  else { repetitions += 1; ease = Math.max(1.3, ease + (rating === 'easy' ? .15 : rating === 'hard' ? -.15 : 0)); interval = repetitions === 1 ? (rating === 'hard' ? 1 : rating === 'easy' ? 4 : 2) : Math.max(1, Math.round(interval * ease * (rating === 'hard' ? .75 : rating === 'easy' ? 1.3 : 1))); }
  const milliseconds = rating === 'again' ? 10 * 60 * 1000 : interval * 86400000;
  return { repetitions, easeFactor: ease, intervalDays: interval, dueAt: new Date(Date.now() + milliseconds).toISOString(), reviewedAt: new Date().toISOString() };
}

async function recordReview(card, rating) {
  const next = progressForRating(state.cardProgress[card.id], rating);
  state.cardProgress[card.id] = next;
  state.logs.push({ cardId: card.id, category: card.category, date: dateKey(), rating });
  saveLocal();
  if (state.user) {
    const response = await fetch('/api/progress', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cardId: card.id, category: card.category, date: dateKey(), rating }) });
    if (!response.ok) throw new Error('同步复习记录失败');
  }
}

function logsForDate(date) { return state.logs.filter((log) => log.date === date); }

function refreshDashboard() {
  const today = logsForDate(dateKey());
  const remembered = today.filter((log) => log.rating === 'good' || log.rating === 'easy').length;
  $('todayCount').textContent = today.length;
  $('todayStudyCount').textContent = today.length;
  $('goalCount').textContent = `${Math.min(today.length, GOAL)} / ${GOAL}`;
  $('goalStatus').textContent = today.length >= GOAL ? '今日已打卡' : '今日进度';
  $('goalProgressBar').style.width = `${Math.min(100, today.length / GOAL * 100)}%`;
  $('dueCount').textContent = cards.filter(isDue).length;
  $('learnedCount').textContent = Object.values(state.cardProgress).filter((item) => item.repetitions >= 3).length;
  $('totalCount').textContent = cards.length;
  const dates = [...new Set(state.logs.map((log) => log.date))];
  const completedDays = dates.filter((date) => logsForDate(date).length >= GOAL).length;
  $('goalCompletedDays').textContent = completedDays;
  let streak = 0; const cursor = new Date();
  for (;;) { const key = dateKey(cursor); if (logsForDate(key).length < GOAL) break; streak += 1; cursor.setDate(cursor.getDate() - 1); }
  $('goalStreak').textContent = streak;
  const end = new Date(`${END_DATE}T23:59:59+08:00`); $('goalRemainingDays').textContent = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
  renderCalendar(); renderHistory();
  void remembered;
}

function renderCalendar() {
  const container = $('checkinCalendar'); container.innerHTML = '';
  for (let day = 1; day <= 31; day += 1) { const date = `2026-08-${String(day).padStart(2, '0')}`; const dot = document.createElement('div'); dot.className = `day-dot ${logsForDate(date).length >= GOAL ? 'done' : ''} ${date === dateKey() ? 'today' : ''}`; dot.textContent = day; container.appendChild(dot); }
}

function renderHistory() {
  const rows = []; const now = new Date();
  for (let i = 0; i < 7; i += 1) { const date = dateKey(new Date(now.getTime() - i * 86400000)); const logs = logsForDate(date); const remembered = logs.filter((log) => log.rating === 'good' || log.rating === 'easy').length; rows.push(`<tr><td>${date.slice(5).replace('-', '月')}日</td><td><strong>${logs.length}</strong> 张</td><td>${remembered} 张</td><td>${logs.length >= GOAL ? '已打卡' : logs.length ? '进行中' : '未开始'}</td></tr>`); }
  $('historyRows').innerHTML = rows.join('');
}

function startStudy(isExtra = false) {
  if (!selectedFilters().size) { alert('请至少选择一类学习内容。'); return; }
  state.session = buildSession(isExtra);
  if (state.session.cards.length < GOAL) { alert('当前选择无法生成 20 道不重复题。背诵类每天最多 3 道，请同时选择至少一种非背诵内容，或勾选更多内容。'); return; }
  state.session.cards.forEach((card) => state.usedTodayIds.add(card.id));
  $('studyPanel').classList.remove('hidden'); $('card').classList.remove('hidden'); $('completeState').classList.add('hidden'); showCurrentCard(); $('studyPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openStudy() { state.usedTodayIds = new Set(); startStudy(false); }

function showCurrentCard() {
  const session = state.session; const card = session.cards[session.index]; const question = cardQuestion(card);
  $('studyCount').textContent = `${session.isExtra ? '加练' : '今日'}第 ${session.index + 1} / ${GOAL} 张`; $('studyTimer').textContent = session.isExtra ? '额外复习' : '本轮专注'; $('studyProgressBar').style.width = `${session.index / GOAL * 100}%`; $('cardKind').textContent = `${question.title.split('｜')[0]} · ${card.label}`; $('cardSource').textContent = card.source || '五上语文'; $('cardTitle').textContent = question.title; $('questionText').textContent = question.prompt; $('answerText').textContent = question.answer; $('answerReveal').classList.add('hidden'); $('showAnswerButton').classList.remove('hidden'); session.answered = false;
}

async function rateCurrent(rating) {
  const session = state.session; if (!session?.answered) return; const card = session.cards[session.index]; const buttons = document.querySelectorAll('.ratings button'); buttons.forEach((button) => { button.disabled = true; });
  try { await recordReview(card, rating); session.index += 1; if (session.index >= GOAL) finishStudy(); else showCurrentCard(); refreshDashboard(); }
  catch (error) { $('authMessage').textContent = error.message; }
}

function finishStudy() {
  const isExtra = state.session?.isExtra;
  $('completeTitle').textContent = isExtra ? '本轮加练完成！' : '今日打卡完成！';
  $('completeMessage').textContent = isExtra ? `又完成了 20 张，今天已复习 ${logsForDate(dateKey()).length} 张卡。` : '20 张卡已经走过一遍；需要的话，可以再增加 20 张。';
  $('card').classList.add('hidden'); $('completeState').classList.remove('hidden'); $('studyProgressBar').style.width = '100%'; refreshDashboard();
}
function closeStudy() { $('studyPanel').classList.add('hidden'); state.session = null; state.usedTodayIds = new Set(); refreshDashboard(); }

function encodeBytes(bytes) { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
function newSalt() { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return encodeBytes(bytes); }
async function passwordProof(password, salt) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: Uint8Array.from(atob(salt.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - salt.length % 4) % 4)), (char) => char.charCodeAt(0)), iterations: 210000 }, key, 256); return encodeBytes(new Uint8Array(bits)); }

async function authRequest(action) {
  const username = $('usernameInput').value.trim(); const password = $('passwordInput').value;
  if (!username || password.length < 8) { $('authMessage').textContent = '请填写账号，并使用至少 8 位密码。'; return; }
  $('authMessage').textContent = action === 'register' ? '正在注册…' : '正在登录…';
  const body = { action, username, clientId: getClientId() };
  if (action === 'register') { const salt = newSalt(); body.passwordSalt = salt; body.passwordProof = await passwordProof(password, salt); }
  else { const challenge = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'challenge', username }) }).then((response) => response.json()); if (!challenge.salt) body.password = password; else body.passwordProof = await passwordProof(password, challenge.salt); }
  const response = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || '账号服务暂时不可用。');
  state.user = result.user; $('accountButton').textContent = state.user.username; $('authLoggedOut').classList.add('hidden'); $('authLoggedIn').classList.remove('hidden'); $('authMessage').textContent = '登录成功，正在加载同步记录…'; await loadProgress(); $('authPanel').classList.remove('hidden'); refreshDashboard();
}

async function loadProgress() {
  readLocal();
  if (!state.user) { refreshDashboard(); return; }
  const response = await fetch('/api/progress'); if (!response.ok) return; const result = await response.json();
  state.cardProgress = Object.fromEntries((result.cards || []).map((item) => [item.cardId, { repetitions: item.repetitions, easeFactor: item.easeFactor, intervalDays: item.intervalDays, dueAt: item.dueAt, reviewedAt: item.reviewedAt }]));
  state.serverStats = result.dailyStats || [];
  const serverLogs = state.serverStats.flatMap((day) => {
    const recite = Number(day.recite || 0);
    const remaining = Math.max(0, Number(day.learned || 0) - recite);
    return [
      ...Array.from({ length: recite }, () => ({ date: day.date, category: 'recite', rating: 'good' })),
      ...Array.from({ length: remaining }, () => ({ date: day.date, category: 'other', rating: 'good' }))
    ];
  });
  state.logs = [...state.logs.filter((log) => log.date > END_DATE || !state.serverStats.some((day) => day.date === log.date)), ...serverLogs]; saveLocal(); refreshDashboard();
}

async function initAuth() {
  try { const response = await fetch('/api/auth'); const result = await response.json(); if (result.user) { state.user = result.user; $('accountButton').textContent = state.user.username; $('authLoggedOut').classList.add('hidden'); $('authLoggedIn').classList.remove('hidden'); } await loadProgress(); } catch { readLocal(); refreshDashboard(); }
}

document.addEventListener('click', (event) => {
  const rating = event.target.closest('[data-rating]'); if (rating) { void rateCurrent(rating.dataset.rating); return; }
  if (event.target.closest('#showAnswerButton')) { if (!state.session) return; state.session.answered = true; $('answerReveal').classList.remove('hidden'); $('showAnswerButton').classList.add('hidden'); document.querySelectorAll('.ratings button').forEach((button) => { button.disabled = false; }); }
});

$('startButton').addEventListener('click', openStudy);
$('backButton').addEventListener('click', closeStudy);
$('completeBackButton').addEventListener('click', closeStudy);
$('addTwentyButton').addEventListener('click', () => startStudy(true));
$('selectAllFilters').addEventListener('change', (event) => { document.querySelectorAll('[data-study-filter]').forEach((input) => { input.checked = event.target.checked; }); syncFilterControls(); });
$('clearFilters').addEventListener('click', () => { document.querySelectorAll('[data-study-filter]').forEach((input) => { input.checked = false; }); syncFilterControls(); });
document.querySelectorAll('[data-study-filter]').forEach((input) => input.addEventListener('change', syncFilterControls));
$('accountButton').addEventListener('click', () => $('authPanel').classList.toggle('hidden'));
$('closeAuthButton').addEventListener('click', () => $('authPanel').classList.add('hidden'));
$('authForm').addEventListener('submit', (event) => { event.preventDefault(); void authRequest('login').catch((error) => { $('authMessage').textContent = error.message; }); });
$('registerButton').addEventListener('click', () => { void authRequest('register').catch((error) => { $('authMessage').textContent = error.message; }); });
$('logoutButton').addEventListener('click', async () => { await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) }); state.user = null; $('accountButton').textContent = '登录 / 注册'; $('authLoggedOut').classList.remove('hidden'); $('authLoggedIn').classList.add('hidden'); readLocal(); refreshDashboard(); });

syncFilterControls();
void initAuth();
