import { pinyin } from 'pinyin-pro';

const HAN_RE = /[\u4e00-\u9fff]/;

export interface Syllable {
  /** 单个字符（汉字或其它字符） */
  char: string;
  /** 对应读音（非汉字时为空字符串） */
  pinyin: string;
}

/**
 * 将姓名拆成逐字注音，保留声调，首字按姓氏多音字规则处理。
 * 例如「曾伟」→ [{ char: '曾', pinyin: 'zēng' }, { char: '伟', pinyin: 'wěi' }]
 */
export function getPinyinSyllables(name: string): Syllable[] {
  return Array.from(name).map((char, i) => {
    if (!HAN_RE.test(char)) return { char, pinyin: '' };
    const text = i === 0 ? pinyin(char, { mode: 'surname' }) : pinyin(char);
    return { char, pinyin: text };
  });
}