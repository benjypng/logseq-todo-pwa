import { format } from "date-fns";
import wretch from "wretch";

import {
  BASE_URL,
  EXPENSE_VALUE_KEY,
  TASK_PRIORITY_KEY,
  TASK_STATUS_KEY,
} from "./constants";
import {
  type AddExpenseMutationProps,
  type AddTaskMutationProps,
  type BaseLogseqBlock,
  type Expense,
  type LogseqGraph,
  type LogseqTask,
  type Priority,
  type TagExtension,
  type TaskStatus,
} from "./types";

const api = wretch()
  .url(BASE_URL)
  .headers({
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_LOGSEQ_TOKEN}`,
  })
  .catcherFallback((error: any) => {
    console.error("Global API Error:", error.status, error.text);
    throw error;
  });

export const getCurrGraphName = async () => {
  const currGraph = await api
    .post({
      method: "logseq.App.getCurrentGraph",
      args: [],
    })
    .json<LogseqGraph>();
  const graphName = currGraph.name.replace("logseq_db_", "");
  return graphName;
};

export const getExpensesFromLogseq = async (): Promise<Expense[]> => {
  const allExpenses = await api
    .post({
      method: "logseq.DB.datascriptQuery",
      args: [
        `[:find ?created-at ?title ?cost
        :where
          [?tag :block/name "expense"]
          [?b :block/refs ?tag]
          [?b :block/created-at ?created-at]
          [?b :block/title ?title]
          (or
            (and
              [?b :user.property/cost-CAE_NF1n ?prop-ref]
              [?prop-ref :logseq.property/value ?cost]
            )
            (and
              [(ground -1) ?prop-ref]
              [(ground 0) ?cost]
            )
          )]]`,
      ],
    })
    .json<[number, string, number][]>();

  const mappedExpenses = allExpenses.map(([createdAt, label, value]) => ({
    label: label,
    value: value,
    createdAt: createdAt,
  }));
  return mappedExpenses;
};

export const addExpenseToLogseq = async ({
  label,
  value,
}: AddExpenseMutationProps) => {
  const todayDate = format(new Date(), "MMM do, yyyy");
  try {
    const createdBlock = await api
      .post({
        method: "logseq.Editor.appendBlockInPage",
        args: [todayDate, label],
      })
      .json<BaseLogseqBlock>();
    await api
      .post({
        method: "logseq.Editor.addBlockTag",
        args: [createdBlock.uuid, "expense"],
      })
      .json<BaseLogseqBlock>();
    await api
      .post({
        method: "logseq.Editor.upsertBlockProperty",
        args: [createdBlock.uuid, EXPENSE_VALUE_KEY, value],
      })
      .json<BaseLogseqBlock>();
  } catch (e) {
    console.error(e);
  }
};

export const getTasksFromLogseq = async (): Promise<LogseqTask[]> => {
  const allTasks = await api
    .post({
      method: "logseq.DB.datascriptQuery",
      args: [
        `[:find (pull ?b [*]) ?status ?priority (pull ?actual-tag [:block/name :block/original-name])
          :where
            (or-join [?b ?actual-tag]
              (and
                [?actual-tag :block/name "task"]
                [?b :block/refs ?actual-tag]
              )
              (and
                [?parent :block/title "Task"]
                [?actual-tag :logseq.property.class/extends ?parent]
                [?b :block/tags ?actual-tag]
              )
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
            )]`,
      ],
    })
    .json<[LogseqTask, TaskStatus, Priority, TagExtension][]>();

  const mappedTasks = allTasks.map(
    ([logseqTask, taskStatus, priority, tagExtension]) => {
      return {
        ...logseqTask,
        status: taskStatus,
        priority: priority,
        taskType: tagExtension.name,
      };
    },
  );

  return mappedTasks.flat();
};

export const addTaskToLogseq = async ({
  task,
  priority,
  type,
}: AddTaskMutationProps) => {
  const todayDate = format(new Date(), "MMM do, yyyy");
  try {
    const createdBlock = await api
      .post({
        method: "logseq.Editor.appendBlockInPage",
        args: [todayDate, task],
      })
      .json<BaseLogseqBlock>();
    await api
      .post({
        method: "logseq.Editor.addBlockTag",
        args: [createdBlock.uuid, type],
      })
      .json<BaseLogseqBlock>();
    await api
      .post({
        method: "logseq.Editor.upsertBlockProperty",
        args: [createdBlock.uuid, TASK_PRIORITY_KEY, priority],
      })
      .json<BaseLogseqBlock>();
  } catch (e) {
    console.error(e);
  }
};

export const markTaskAsDone = async (uuid: string) => {
  await api
    .post({
      method: "logseq.Editor.upsertBlockProperty",
      args: [uuid, TASK_STATUS_KEY, "Done"],
    })
    .json<BaseLogseqBlock>();
};

export const markTaskAsDoing = async (uuid: string) => {
  await api
    .post({
      method: "logseq.Editor.upsertBlockProperty",
      args: [uuid, TASK_STATUS_KEY, "Doing"],
    })
    .json<BaseLogseqBlock>();
};
