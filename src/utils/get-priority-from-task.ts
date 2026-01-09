import type { Priority } from '../types'

export const getPriorityFromTask = (task: string): Priority => {
  if (task.includes('p0')) {
    return 'Urgent'
  }
  if (task.includes('p1')) {
    return 'High'
  }
  if (task.includes('p2')) {
    return 'Medium'
  }
  if (task.includes('p3')) {
    return 'Low'
  }
  return 'None'
}
