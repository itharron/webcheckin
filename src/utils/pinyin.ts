import { pinyin, addDict } from 'pinyin-pro';

/** 覆盖 CJK 基本区、扩展 A/B/C/D/E/F 及兼容表意文字，尽量多识别生僻字 */
const HAN_RE =
  /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\u2CEB0-\u2EBEF\u2F800-\u2FA1F]/;

/** pinyin-pro 未收录的生僻字补充字典（值可带声调），遇到漏注音的字按此格式追加 */
const EXTRA_DICT: Record<string, string> = {
  '𠮷': 'jí', // 吉的异体
  '㐀': 'qiū', // 丘的异体
  '㐂': 'xǐ', // 喜的异体
};

addDict(EXTRA_DICT);

export interface Syllable {
  /** 单个字符（汉字或其它字符） */
  char: string;
  /** 对应读音（非汉字或无法识别时为空字符串） */
  pinyin: string;
}

function lookup(char: string, surname: boolean): string {
  const text = surname ? pinyin(char, { mode: 'surname' }) : pinyin(char);
  // pinyin-pro 对未收录的字符会原样返回，此时视为无注音
  return text === char ? '' : text;
}

/**
 * 将姓名拆成逐字注音，保留声调，首字按姓氏多音字规则处理。
 * 例如「曾伟」→ [{ char: '曾', pinyin: 'zēng' }, { char: '伟', pinyin: 'wěi' }]
 */
export function getPinyinSyllables(name: string): Syllable[] {
  return Array.from(name).map((char, i) => {
    if (!HAN_RE.test(char)) return { char, pinyin: '' };
    return { char, pinyin: lookup(char, i === 0) };
  });
}