import { vocabItems as sourceVocabItems } from '../data.js';
import { contentVersion, normalizeLessonNumber, unitForLesson } from './catalog.js';
import { wordMeanings } from './meanings.js';

const COMMON_MEANINGS = {
  桂花: '木樨的花，秋季开花，香气浓郁。', 故乡: '出生或长期居住过的地方。', 欣赏: '享受美好的事物，领略其中的情趣。', 尤其: '表示特别，强调程度更深。', 使劲: '用力。',
  浇水: '把水浇在植物或土地上。', 可贵: '值得珍视。', 体面: '光荣、光彩；好看。', 平原: '地势平坦的广大地区。', 封锁: '封闭并切断联系或交通。', 粉碎: '使彻底破坏或消灭。', 简直: '表示完全如此或差不多如此。',
  无穷无尽: '没有止境。', 无价之宝: '无法估价的珍贵宝物。', 召集: '通知人们聚集起来。', 大臣: '君主制国家的高级官员。', 商议: '讨论决定。', 允诺: '应许。', 同归于尽: '一起走向毁灭。', 同心协力: '团结一致，共同努力。',
  速度: '表示物体运动快慢的量。', 冠军: '竞赛中第一名。', 发动机: '把其他能量转化为机械能的机器。', 航线: '船或飞机航行的路线。', 小心翼翼: '谨慎小心，一点不敢疏忽。', 惊慌失措: '惊慌得不知道怎么办。', 忠于职守: '忠诚地做好本职工作。',
  流传: '传下来或传播开。', 酬谢: '用财物或行动答谢。', 叮嘱: '再三嘱咐。', 千真万确: '非常真实，毫无疑问。', 镇定: '遇到紧急情况不慌乱。', 倾盆大雨: '雨大得像把盆里的水倒下来。',
  眉开眼笑: '高兴愉快的样子。', 美中不足: '虽然很好，但还有缺点。', 相依为命: '互相依靠着生活。', 毁灭: '彻底破坏或消灭。', 不可估量: '难以估计。', 举世闻名: '全世界都知道。', 众星拱月: '许多事物围绕一个中心。', 亭台楼阁: '泛指多种供游赏休息的建筑物。',
  寸草不生: '连一点草都不生长，形容荒凉。', 摄氏度: '温度单位。', 繁殖: '生物产生新的个体。', 水蒸气: '水受热变成的气体。', 杀菌: '杀死病菌。', 预防: '事先防备。', 治疗: '用药物、手术等消除疾病。',
  金字塔: '埃及等地的方锥形建筑。', 叹为观止: '赞叹看到的好到了极点。', 慈母: '慈爱的母亲。', 辞退: '解雇。', 压抑: '压制使不能充分表现。', 忙碌: '事情多，不得闲。', 节省: '使耗费减少。', 委屈: '受到不应有的指责或待遇而难过。',
  精致: '精巧细致。', 父慈子孝: '父亲慈爱，子女孝顺。', 家喻户晓: '家家户户都知道。', 一张一弛: '有张有弛，劳逸结合。', 侵入: '进入并侵犯。', 粉妆玉砌: '白雪覆盖大地，像用白玉砌成。',
  精巧: '精细巧妙。', 适宜: '合适，相宜。', 寻常: '平常。', 悠然: '悠闲自在的样子。', 恩惠: '给予的或受到的好处。', 一知半解: '知道得不全面，理解得不深。', 勉勉强强: '刚好能应付。', 朝代: '建立国号的帝王世代相传的整个时期。', 质朴: '朴实，不矫饰。', 浅显: '浅近明白，容易懂。',
};

function meaningFor(word) {
  return { ...COMMON_MEANINGS, ...wordMeanings }[word] || '';
}

function makeId(item) {
  const lesson = normalizeLessonNumber(item.lesson);
  const unit = unitForLesson(item.lesson) || 0;
  const lessonPart = lesson ? `l${String(lesson).padStart(2, '0')}` : `g${unit}`;
  return `vocab.u${unit}.${lessonPart}.${item.word}.v1`;
}

export const vocabItems = sourceVocabItems.map((item, index) => {
  const unit = unitForLesson(item.lesson);
  const lessonNumber = normalizeLessonNumber(item.lesson);
  return {
    ...item,
    id: makeId(item),
    legacyIds: [`vocab-${index + 1}-${item.word}`],
    progressKey: `vocab-${index + 1}-${item.word}`,
    contentVersion,
    module: 'vocab',
    subtype: 'word',
    textbookUnit: unit,
    lessonNumber,
    topic: '词语表·拼音写词',
    source: { prompt: '五年级上册《词语表》PDF', answer: '五年级上册《词语表》PDF' },
    meaning: meaningFor(item.word),
  };
});

export const vocabStats = { formalWords: vocabItems.length };
