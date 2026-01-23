import {
  ActionIcon,
  Center,
  Container,
  Group,
  Loader,
  rem,
  Tabs,
} from "@mantine/core";
import {
  IconChecklist,
  IconCurrencyDollar,
  IconPlus,
  IconShovel,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

import {
  AddTaskModal,
  ExpenseList,
  SelectedTask,
  TaskList,
  ToggleTheme,
} from "./components";
import { useDoingTodo, useTodos } from "./hooks";
import type { LogseqTask } from "./types";

export default function App() {
  const [opened, setOpened] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LogseqTask | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("tasks");

  const { data: todos, isLoading } = useTodos();
  const doingMutation = useDoingTodo();

  useEffect(() => {
    const kbShortcut = (e: KeyboardEvent) => {
      if (e.key === "a") {
        setOpened(true);
        e.preventDefault();
      }
    };
    if (!opened) {
      window.addEventListener("keydown", kbShortcut);
      return () => window.removeEventListener("keydown", kbShortcut);
    }
  }, [opened]);

  const handleSelectedTask = (task: LogseqTask) => {
    setSelectedTask(task);
    doingMutation.mutate(task.uuid);
  };

  if (selectedTask) {
    return (
      <Container size="xs" h="100dvh" py="xl">
        <SelectedTask
          selectedTask={selectedTask}
          setSelectedTask={setSelectedTask}
        />
      </Container>
    );
  }

  return (
    <Container
      size="xs"
      h="100dvh"
      p={0}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Group p="md" justify="space-between">
        <ToggleTheme />
      </Group>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="outline"
        radius="md"
        defaultValue="tasks"
        h="3rem"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: "0 1rem" }}>
          {isLoading ? (
            <Center h="100%">
              <Loader type="dots" />
            </Center>
          ) : (
            <>
              <Tabs.Panel value="tasks" h="100%">
                <TaskList
                  tasks={todos}
                  type="task"
                  onSelect={handleSelectedTask}
                />
              </Tabs.Panel>

              <Tabs.Panel value="errands" h="100%">
                <TaskList
                  tasks={todos}
                  type="Errand"
                  onSelect={handleSelectedTask}
                />
              </Tabs.Panel>

              <Tabs.Panel value="expenses" h="100%">
                <ExpenseList />
              </Tabs.Panel>
            </>
          )}
        </div>

        <ActionIcon
          size={60}
          radius="xl"
          variant="filled"
          pos="fixed"
          bottom={80}
          right={20}
          style={{ zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
          onClick={() => setOpened(true)}
        >
          <IconPlus />
        </ActionIcon>

        <Tabs.List
          grow
          justify="center"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <Tabs.Tab
            value="tasks"
            py="md"
            leftSection={
              <IconChecklist style={{ width: rem(20), height: rem(20) }} />
            }
          >
            Tasks
          </Tabs.Tab>
          <Tabs.Tab
            value="errands"
            py="md"
            leftSection={
              <IconShovel style={{ width: rem(20), height: rem(20) }} />
            }
          >
            Errands
          </Tabs.Tab>
          <Tabs.Tab
            value="expenses"
            py="md"
            leftSection={
              <IconCurrencyDollar style={{ width: rem(20), height: rem(20) }} />
            }
          >
            Expenses
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <AddTaskModal opened={opened} setOpened={setOpened} />
    </Container>
  );
}
