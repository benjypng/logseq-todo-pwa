import { format } from 'date-fns'

import type { Task } from '../types'
import { applyOutbox } from './merge'
import type { OutboxEntry } from './outbox'
import { describe, expect, test } from 'bun:test'

const task = (overrides: Partial<Task> = {}): Task => ({
  uuid: 'u1',
  displayText: 'Buy milk',
  status: 'Todo',
  scheduledDate: null,
  deadline: null,
  isScheduledToday: false,
  pageName: 'Inbox',
  taskType: 'task',
  ...overrides,
})

const entry = (op: OutboxEntry['op'], ts = 1): OutboxEntry => ({
  id: `entry-${ts}`,
  ts,
  op,
})

describe('applyOutbox', () => {
  test('returns tasks unchanged when no entries are pending', () => {
    const tasks = [task()]
    expect(applyOutbox(tasks, [])).toEqual(tasks)
  })

  test('hides a task with a pending Done status', () => {
    const result = applyOutbox(
      [task(), task({ uuid: 'u2' })],
      [entry({ kind: 'set-status', uuid: 'u1', status: 'Done' })],
    )
    expect(result.map((t) => t.uuid)).toEqual(['u2'])
  })

  test('updates status for a pending Doing change', () => {
    const result = applyOutbox(
      [task()],
      [entry({ kind: 'set-status', uuid: 'u1', status: 'Doing' })],
    )
    expect(result[0].status).toBe('Doing')
  })

  test('applies a pending schedule for today', () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const result = applyOutbox(
      [task()],
      [entry({ kind: 'set-scheduled', uuid: 'u1', scheduled: today })],
    )
    expect(result[0].isScheduledToday).toBe(true)
    expect(result[0].scheduledDate).toBeInstanceOf(Date)
  })

  test('clears the schedule when pending scheduled is null', () => {
    const result = applyOutbox(
      [task({ scheduledDate: new Date(), isScheduledToday: true })],
      [entry({ kind: 'set-scheduled', uuid: 'u1', scheduled: null })],
    )
    expect(result[0].scheduledDate).toBeNull()
    expect(result[0].isScheduledToday).toBe(false)
  })

  test('applies and clears a pending deadline', () => {
    const withDeadline = applyOutbox(
      [task()],
      [entry({ kind: 'set-deadline', uuid: 'u1', deadline: '2026-08-01' })],
    )
    expect(withDeadline[0].deadline).toBeInstanceOf(Date)

    const cleared = applyOutbox(
      [task({ deadline: new Date() })],
      [entry({ kind: 'set-deadline', uuid: 'u1', deadline: null })],
    )
    expect(cleared[0].deadline).toBeNull()
  })

  test('appends a pending task for a queued add', () => {
    const result = applyOutbox(
      [task()],
      [entry({ kind: 'add-task', title: 'New thing', type: 'Errand' }, 42)],
    )
    expect(result).toHaveLength(2)
    const added = result[1]
    expect(added.uuid).toBe('entry-42')
    expect(added.displayText).toBe('New thing')
    expect(added.taskType).toBe('Errand')
    expect(added.pending).toBe(true)
  })

  test('does not append queued Inbox adds', () => {
    const result = applyOutbox(
      [],
      [entry({ kind: 'add-task', title: 'Read later', type: 'Inbox' })],
    )
    expect(result).toHaveLength(0)
  })

  test('ignores ops for uuids not in the list', () => {
    const tasks = [task()]
    const result = applyOutbox(tasks, [
      entry({ kind: 'set-status', uuid: 'missing', status: 'Done' }),
    ])
    expect(result).toEqual(tasks)
  })
})
