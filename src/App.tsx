import '@mantine/core/styles.css'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useTodos, useAddTodo, useDoneTodo } from './hooks/use-tasks'
import type { FormValues, LogseqTask } from './types'
import { format } from 'date-fns'
import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Container,
  Divider,
  Input,
  Loader,
  MantineProvider,
  Modal,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'

export default function App() {
  const [opened, setOpened] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LogseqTask | null>(null)

  const { data: todos, isLoading } = useTodos()
  const addMutation = useAddTodo()
  const toggleMutation = useDoneTodo()

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { task: '' },
  })

  const onSubmit = (data: FormValues) => {
    if (!data.task.trim()) return
    addMutation.mutate(data.task, {
      onSuccess: () => {
        setOpened(false)
        reset()
      },
    })
  }

  const handleComplete = () => {
    if (selectedTask) {
      toggleMutation.mutate(selectedTask.uuid)
      setSelectedTask(null)
    }
  }

  return (
    <MantineProvider>
      <Container size="xs" mih="100vh" py="xl" pos="relative">
        {selectedTask ? (
          <Stack
            pos="fixed"
            top={0}
            left={0}
            w="100%"
            h="100%"
            bg="white"
            justify="center"
            p={40}
          >
            <ActionIcon
              size={60}
              radius="xl"
              color="gray"
              variant="light"
              pos="fixed"
              top={40}
              right={40}
              onClick={() => setSelectedTask(null)}
            >
              <Text size="xl">✕</Text>
            </ActionIcon>

            <Stack align="start" gap="md">
              <Title order={1} size="h1" lh={1.2}>
                {selectedTask['full-title']}
              </Title>

              <Badge size="lg" variant="outline" color="gray" tt="uppercase">
                {format(selectedTask['created-at'], 'MMM do, yyyy')}
              </Badge>
            </Stack>

            <ActionIcon
              size={60}
              radius="xl"
              color="dark"
              variant="filled"
              pos="fixed"
              bottom={40}
              right={40}
              onClick={handleComplete}
            >
              <Text size="xl">✓</Text>
            </ActionIcon>
          </Stack>
        ) : (
          <>
            {isLoading && (
              <Center mt="xl">
                <Loader color="dark" type="dots" />
              </Center>
            )}

            <Stack
              gap={0}
              justify="center"
              h={todos?.length === 0 ? undefined : '100%'}
              mih="80vh"
            >
              {todos?.map((task: LogseqTask) => (
                <Box key={task.uuid}>
                  <UnstyledButton
                    py="sm"
                    w="100%"
                    onClick={() => setSelectedTask(task)}
                    td={task.status === 'Done' ? 'line-through' : undefined}
                    c={task.status === 'Done' ? 'dimmed' : undefined}
                    opacity={task.status === 'Done' ? 0.5 : 1}
                  >
                    <Text size="xl">{task['full-title']}</Text>
                  </UnstyledButton>
                  <Divider color="gray.2" />
                </Box>
              ))}
            </Stack>

            {!isLoading && todos?.length === 0 && (
              <Center h="50vh">
                <Text c="dimmed">No tasks yet.</Text>
              </Center>
            )}

            <ActionIcon
              size={60}
              radius="xl"
              color="dark"
              variant="filled"
              pos="fixed"
              bottom={40}
              right={40}
              onClick={() => setOpened(true)}
            >
              <Text size="xl" fw={700}>
                +
              </Text>
            </ActionIcon>
          </>
        )}

        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          withCloseButton={false}
          centered
          size="lg"
          overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="task"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Input
                  {...field}
                  data-autofocus
                  placeholder="What needs to be done?"
                  variant="unstyled"
                  size="xl"
                />
              )}
            />
          </form>
        </Modal>
      </Container>
    </MantineProvider>
  )
}
