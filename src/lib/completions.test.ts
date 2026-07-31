import {
  addCompletion,
  type CompletionRecord,
  completionsOnDay,
  loadCompletions,
  pruneCompletions,
  removeCompletion,
  streakDays,
  weekDots,
} from './completions'
import { describe, expect, test } from 'bun:test'

function rec(uuid: string, completedAt: Date): CompletionRecord {
  return {
    uuid,
    text: `task ${uuid}`,
    taskType: 'task',
    whenLabel: 'no date',
    wasToday: false,
    completedAt: completedAt.getTime(),
  }
}

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h)

describe('addCompletion / removeCompletion', () => {
  test('add dedupes by uuid, keeping the latest record', () => {
    let records: CompletionRecord[] = []
    records = addCompletion(records, rec('a', at(2026, 7, 30)))
    records = addCompletion(records, rec('a', at(2026, 7, 31)))
    expect(records).toHaveLength(1)
    expect(records[0].completedAt).toBe(at(2026, 7, 31).getTime())
  })

  test('remove drops the matching uuid only', () => {
    let records = addCompletion([], rec('a', at(2026, 7, 31)))
    records = addCompletion(records, rec('b', at(2026, 7, 31)))
    records = removeCompletion(records, 'a')
    expect(records.map((r) => r.uuid)).toEqual(['b'])
  })
})

describe('completionsOnDay', () => {
  test('matches by calendar day, not 24h window', () => {
    const records = [
      rec('early', new Date(2026, 6, 31, 0, 5)),
      rec('late', new Date(2026, 6, 31, 23, 55)),
      rec('other', new Date(2026, 6, 30, 23, 55)),
    ]
    const hits = completionsOnDay(records, at(2026, 7, 31))
    expect(hits.map((r) => r.uuid).sort()).toEqual(['early', 'late'])
  })
})

describe('streakDays', () => {
  test('is 0 with no completions', () => {
    expect(streakDays([], at(2026, 7, 31))).toBe(0)
  })

  test('counts consecutive days ending today', () => {
    const records = [
      rec('a', at(2026, 7, 31)),
      rec('b', at(2026, 7, 30)),
      rec('c', at(2026, 7, 29)),
      rec('d', at(2026, 7, 27)),
    ]
    expect(streakDays(records, at(2026, 7, 31))).toBe(3)
  })

  test('survives a day with no completion yet today', () => {
    const records = [rec('a', at(2026, 7, 30)), rec('b', at(2026, 7, 29))]
    expect(streakDays(records, at(2026, 7, 31, 8))).toBe(2)
  })

  test('breaks after a full missed day', () => {
    const records = [rec('a', at(2026, 7, 28))]
    expect(streakDays(records, at(2026, 7, 31))).toBe(0)
  })
})

describe('weekDots', () => {
  test('maps Mon-Sun of the current week', () => {
    const records = [
      rec('mon', at(2026, 7, 27)),
      rec('wed', at(2026, 7, 29)),
      rec('fri', at(2026, 7, 31)),
    ]
    expect(weekDots(records, at(2026, 7, 31))).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      false,
    ])
  })

  test('ignores completions outside this week', () => {
    const records = [rec('lastweek', at(2026, 7, 24))]
    expect(weekDots(records, at(2026, 7, 31))).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ])
  })
})

describe('pruneCompletions', () => {
  test('drops records older than the retention window', () => {
    const records = [rec('old', at(2024, 1, 1)), rec('new', at(2026, 7, 30))]
    const pruned = pruneCompletions(records, at(2026, 7, 31))
    expect(pruned.map((r) => r.uuid)).toEqual(['new'])
  })
})

describe('loadCompletions', () => {
  test('returns [] for missing or invalid payloads', () => {
    expect(loadCompletions({ getItem: () => null })).toEqual([])
    expect(loadCompletions({ getItem: () => 'not json' })).toEqual([])
    expect(loadCompletions({ getItem: () => '{"a":1}' })).toEqual([])
  })

  test('filters malformed entries', () => {
    const good = rec('a', at(2026, 7, 31))
    const raw = JSON.stringify([good, { uuid: 1 }, null])
    const loaded = loadCompletions({ getItem: () => raw })
    expect(loaded).toHaveLength(1)
    expect(loaded[0].uuid).toBe('a')
  })
})
