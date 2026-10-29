import * as XLSX from 'xlsx';

/** 解析出的学生 */
export interface ImportedStudent {
  name: string;
  studentNo: string;
}

const NAME_KEYS = ['姓名', 'name', 'Name', 'NAME', '名字', '学生姓名', '学生'];
const NO_KEYS = ['学号', '编号', '学籍号', 'id', 'ID', 'Id', 'studentNo', 'student_id', 'studentId', 'no', 'code', '号码', '工号'];

/**
 * 从行数据中，按候选键名（含大小写不敏感）挑选字段值。
 */
function pickValue(row: Record<string, unknown>, keys: string[]): string {
  // 精确匹配
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  // 大小写不敏感匹配
  const lowerKeys = new Map(keys.map((k) => [k.toLowerCase(), k]));
  for (const [rawKey, value] of Object.entries(row)) {
    const target = lowerKeys.get(rawKey.toLowerCase());
    if (target && value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

/**
 * 解析 Excel / CSV 名单文件，自动识别「姓名」「学号」列。
 *
 * @param file 上传的文件（.xlsx / .xls / .csv）
 * @returns 解析出的人员列表（过滤空行）
 */
export async function parseRosterFile(file: File): Promise<ImportedStudent[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    throw new Error('未在文件中找到有效的工作表');
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

  const result: ImportedStudent[] = [];
  for (const row of rows) {
    const name = pickValue(row, NAME_KEYS);
    const studentNo = pickValue(row, NO_KEYS);
    if (!name && !studentNo) continue;
    result.push({ name, studentNo });
  }
  if (result.length === 0) {
    throw new Error('未能从文件中解析出任何人员，请确认包含「姓名」和「学号」列');
  }
  return result;
}