import type { Priority } from './types'

export const BASE_URL = '/logseq-api/api'

export const TASK_STATUS_KEY = ':logseq.property/status'

export const TASK_PRIORITY_KEY = ':logseq.property/priority'

export const TASK_SCHEDULED_KEY = ':logseq.property/scheduled'

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  None: 4,
}

export const EXPENSE_VALUE_KEY = ':user.property/cost-CAE_NF1n'

export const GET_TASKS_FROM_LOGSEQ = `
[:find (pull ?b [* {:block/page [:block/name :block/journal-day]}]) ?status ?priority ?tag-name
 :where
   [?t :block/name "task"]
   [?b :block/refs ?t]
   [(ground "task") ?tag-name]
   (not
     [?e :block/title "Expense"]
     [?b :block/tags ?e]
   )
   (or
     (and
       [?b :logseq.property/status ?s]
       [?s :block/title ?status]
     )
     (and
       (not [?b :logseq.property/status])
       [(ground "Todo") ?status]
       [(ground -1) ?s]
     )
   )
   [(!= ?status "Done")]
   (or
     (and
       [?b :logseq.property/priority ?p]
       [?p :block/title ?priority]
     )
     (and
       (not [?b :logseq.property/priority])
       [(ground "None") ?priority]
       [(ground -1) ?p]
     )
   )
]
`

export const GET_ERRANDS_FROM_LOGSEQ = `
[:find (pull ?b [* {:block/page [:block/name :block/journal-day]}]) ?status ?priority ?tag-name
 :where
   [?parent :block/title "Task"]
   [?t :logseq.property.class/extends ?parent]
   [?t :block/title "Errand"]
   [(ground "Errand") ?tag-name]
   [?b :block/tags ?t]
   (or
     (and
       [?b :logseq.property/status ?s]
       [?s :block/title ?status]
     )
     (and
       (not [?b :logseq.property/status])
       [(ground "Todo") ?status]
       [(ground -1) ?s]
     )
   )
   [(!= ?status "Done")]
   (or
     (and
       [?b :logseq.property/priority ?p]
       [?p :block/title ?priority]
     )
     (and
       (not [?b :logseq.property/priority])
       [(ground "None") ?priority]
       [(ground -1) ?p]
     )
   )
]
`

