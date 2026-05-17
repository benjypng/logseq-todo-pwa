import * as cli from './api-cli'
import * as http from './api-http'
import { getBackend } from './backend'

const impl = getBackend() === 'http' ? http : cli

export const getCurrGraphName = impl.getCurrGraphName
export const getTasksFromLogseq = impl.getTasksFromLogseq
export const markTaskAsDone = impl.markTaskAsDone
export const markTaskAsDoing = impl.markTaskAsDoing
export const markTaskAsTodo = impl.markTaskAsTodo
export const addTaskToLogseq = impl.addTaskToLogseq
export const moveTaskToDate = impl.moveTaskToDate
