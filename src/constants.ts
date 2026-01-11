import type { Priority } from './types'

export const BASE_URL = '/logseq-api/api'

export const TASK_STATUS_KEY = ':logseq.property/status'

export const TASK_PRIORITY_KEY = ':logseq.property/priority'

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  None: 4,
}

export const EXPENSE_VALUE_KEY = ':user.property/cost-CAE_NF1n'
