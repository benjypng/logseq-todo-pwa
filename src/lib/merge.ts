import type { Task } from '../types'
import { isToday } from './date'
import type { OutboxEntry } from './outbox'

function parseDay(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function applyOutbox(tasks: Task[], entries: OutboxEntry[]): Task[] {
  let result = tasks
  for (const entry of entries) {
    const op = entry.op
    switch (op.kind) {
      case 'set-status':
        result =
          op.status === 'Done'
            ? result.filter((t) => t.uuid !== op.uuid)
            : result.map((t) =>
                t.uuid === op.uuid && op.status !== 'Waiting'
                  ? { ...t, status: op.status }
                  : t,
              )
        break
      case 'set-scheduled': {
        const scheduledDate =
          op.scheduled === null ? null : parseDay(op.scheduled)
        result = result.map((t) =>
          t.uuid === op.uuid
            ? { ...t, scheduledDate, isScheduledToday: isToday(scheduledDate) }
            : t,
        )
        break
      }
      case 'set-deadline': {
        const deadline = op.deadline === null ? null : parseDay(op.deadline)
        result = result.map((t) =>
          t.uuid === op.uuid ? { ...t, deadline } : t,
        )
        break
      }
      case 'add-task':
        if (op.type !== 'Inbox') {
          result = [
            ...result,
            {
              uuid: entry.id,
              displayText: op.title,
              status: 'Todo',
              scheduledDate: null,
              deadline: null,
              isScheduledToday: false,
              pageName: 'Pending',
              taskType: op.type,
              pending: true,
            },
          ]
        }
        break
    }
  }
  return result
}
