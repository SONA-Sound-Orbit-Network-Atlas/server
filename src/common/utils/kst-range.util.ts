export type KstRange = 'week' | 'month' | 'year' | 'total';
const KST = 9 * 60 * 60 * 1000;

export function getKstRangeUTC(
  range: KstRange
): { gte: Date; lte: Date } | null {
  if (range === 'total') return null; // ← 추가: total은 기간 필터 없음

  const nowUTC = new Date();
  const nowKST = new Date(nowUTC.getTime() + KST);
  const startKST = new Date(nowKST);

  if (range === 'week') {
    const day = startKST.getDay() === 0 ? 7 : startKST.getDay(); // 월=1 … 일=7
    const diffToMon = day - 1;
    startKST.setHours(0, 0, 0, 0);
    startKST.setDate(startKST.getDate() - diffToMon);
  } else if (range === 'month') {
    startKST.setHours(0, 0, 0, 0);
    startKST.setDate(1);
  } else if (range === 'year') {
    startKST.setHours(0, 0, 0, 0);
    startKST.setMonth(0, 1);
  }

  return { gte: new Date(startKST.getTime() - KST), lte: nowUTC };
}
