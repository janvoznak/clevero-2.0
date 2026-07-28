/** Sdílené kalendářní utility (čistá logika, bez vazby na Vue). */

export const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function parseISO(s: string): Date {
  return new Date(s + 'T00:00:00')
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
export function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}
export function shiftMonth(year: number, month: number, delta: number): { y: number; m: number } {
  const d = new Date(year, month + delta, 1)
  return { y: d.getFullYear(), m: d.getMonth() }
}
export function monthLabel(year: number, month: number): string {
  const s = new Date(year, month, 1).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export interface CalDay {
  date: Date
  num: number
  inMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

/** Týdny měsíce (pondělím počínaje), včetně přesahů z okolních měsíců. */
export function buildWeeks(year: number, month: number, today: Date): CalDay[][] {
  const first = new Date(year, month, 1)
  const firstWeekday = (first.getDay() + 6) % 7
  const start = addDays(first, -firstWeekday)
  const numWeeks = Math.ceil((firstWeekday + daysInMonth(year, month)) / 7)
  const weeks: CalDay[][] = []
  for (let w = 0; w < numWeeks; w++) {
    const week: CalDay[] = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, w * 7 + i)
      week.push({
        date: d,
        num: d.getDate(),
        inMonth: d.getMonth() === month,
        isToday: sameDay(d, today),
        isWeekend: i >= 5,
      })
    }
    weeks.push(week)
  }
  return weeks
}

export interface CalSeg<T> {
  item: T
  startCol: number
  span: number
  lane: number
  continuesLeft: boolean
  continuesRight: boolean
}

/** Segmenty položek protínajících daný týden + lane-packing (bez překryvu). */
export function weekSegments<T>(
  weekStart: Date,
  items: T[],
  getFrom: (t: T) => string,
  getTo: (t: T) => string,
): { segs: CalSeg<T>[]; laneCount: number } {
  const weekEnd = addDays(weekStart, 6)
  const raw: CalSeg<T>[] = []
  for (const it of items) {
    const f = parseISO(getFrom(it))
    const t = parseISO(getTo(it))
    if (t < weekStart || f > weekEnd) continue
    const segStart = f < weekStart ? weekStart : f
    const segEnd = t > weekEnd ? weekEnd : t
    const startCol = dayDiff(segStart, weekStart)
    const endCol = dayDiff(segEnd, weekStart)
    raw.push({
      item: it,
      startCol,
      span: endCol - startCol + 1,
      lane: 0,
      continuesLeft: f < weekStart,
      continuesRight: t > weekEnd,
    })
  }
  raw.sort((a, b) => a.startCol - b.startCol || b.span - a.span)
  const laneEnd: number[] = []
  for (const s of raw) {
    let lane = 0
    while (lane < laneEnd.length && laneEnd[lane] >= s.startCol) lane++
    s.lane = lane
    laneEnd[lane] = s.startCol + s.span - 1
  }
  return { segs: raw, laneCount: Math.max(1, laneEnd.length) }
}
