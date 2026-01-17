import type { Priority } from '../types'

export const getPriorityFromTask = (task: string): Priority => {
  if (task.toLowerCase().includes('p0')) {
    return 'Urgent'
  }
  if (task.toLowerCase().includes('p1')) {
    return 'High'
  }
  if (task.toLowerCase().includes('p2')) {
    return 'Medium'
  }
  if (task.toLowerCase().includes('p3')) {
    return 'Low'
  }
  return 'None'
}
