import { openDB, type IDBPDatabase } from 'idb';
import type { AttendanceRecord, RosterSession } from '@/types';

const DB_NAME = 'roll-call-db';
const DB_VERSION = 1;

const RECORDS_STORE = 'attendanceRecords';
const SESSIONS_STORE = 'rosterSessions';

let dbPromise: Promise<IDBPDatabase> | null = null;

/** 获取（并懒加载）IndexedDB 连接 */
function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(RECORDS_STORE)) {
          const store = db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
          store.createIndex('date', 'date');
          store.createIndex('studentId', 'studentId');
        }
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/* ---------------------------- 签到记录 ---------------------------- */

/** 新增或更新单条记录 */
export async function putRecord(record: AttendanceRecord): Promise<void> {
  const db = await getDB();
  await db.put(RECORDS_STORE, record);
}

/** 批量新增记录 */
export async function putRecords(records: AttendanceRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(RECORDS_STORE, 'readwrite');
  await Promise.all(records.map((r) => tx.store.put(r)));
  await tx.done;
}

/** 按日期查询记录（按时间倒序） */
export async function getRecordsByDate(date: string): Promise<AttendanceRecord[]> {
  const db = await getDB();
  const records = await db.getAllFromIndex(RECORDS_STORE, 'date', date);
  return records.sort((a, b) => b.timestamp - a.timestamp);
}

/** 获取全部记录 */
export async function getAllRecords(): Promise<AttendanceRecord[]> {
  const db = await getDB();
  return db.getAll(RECORDS_STORE);
}

/** 删除单条记录 */
export async function deleteRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(RECORDS_STORE, id);
}

/** 获取全部有签到记录的日期（倒序且去重） */
export async function getAllRecordDates(): Promise<string[]> {
  const db = await getDB();
  const all = await db.getAll(RECORDS_STORE);
  return [...new Set(all.map((r) => r.date))].sort().reverse();
}

/* ---------------------------- 签到会话 ---------------------------- */

/** 保存会话 */
export async function putSession(session: RosterSession): Promise<void> {
  const db = await getDB();
  await db.put(SESSIONS_STORE, session);
}

/** 获取全部会话 */
export async function getAllSessions(): Promise<RosterSession[]> {
  const db = await getDB();
  const sessions = await db.getAll(SESSIONS_STORE);
  return sessions.sort((a, b) => b.startTime - a.startTime);
}

/** 获取最近一次会话 */
export async function getRecentSession(): Promise<RosterSession | undefined> {
  const sessions = await getAllSessions();
  return sessions[0];
}