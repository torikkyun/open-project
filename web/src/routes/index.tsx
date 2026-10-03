import { useEffect, useState, type FormEvent } from "react"
import { createFileRoute } from "@tanstack/react-router"

import {
  api,
  clearAccessToken,
  getAccessToken,
  type Project,
  type Task,
  type TaskStatus,
  type User,
} from "@/api"
import { AUTH_EXPIRED_EVENT } from "@/api/client"
import { LoginForm } from "@/components/login-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [commentsRefresh, setCommentsRefresh] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userListError, setUserListError] = useState<string | null>(null)

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  )
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

  useEffect(() => {
    let active = true
    if (!getAccessToken()) {
      setSessionLoading(false)
      return
    }
    api
      .currentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((cause: unknown) => {
        clearAccessToken()
        if (active) setError(errorMessage(cause))
      })
      .finally(() => {
        if (active) setSessionLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const expireSession = () => {
      setUser(null)
      setProjects([])
      setMembers([])
      setTasks([])
      setSelectedProjectId(null)
      setSelectedTaskId(null)
      setError("Your session expired. Log in again.")
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession)
  }, [])

  useEffect(() => {
    if (!user) {
      setProjects([])
      setSelectedProjectId(null)
      return
    }
    let active = true
    setProjects([])
    setSelectedProjectId(null)
    api
      .listProjects()
      .then((result) => {
        if (!active) return
        setProjects(result)
        setSelectedProjectId(result[0]?.id ?? null)
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause))
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!selectedProjectId) {
      setMembers([])
      setTasks([])
      setSelectedTaskId(null)
      return
    }
    let active = true
    setMembers([])
    setTasks([])
    setSelectedTaskId(null)
    Promise.all([
      api.listMembers(selectedProjectId),
      api.listTasks(selectedProjectId),
    ])
      .then(([nextMembers, nextTasks]) => {
        if (!active) return
        setMembers(nextMembers)
        setTasks(nextTasks)
        setSelectedTaskId(nextTasks[0]?.id ?? null)
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause))
      })
    return () => {
      active = false
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setUsers([])
      setUserListError(null)
      return
    }
    let active = true
    api
      .listUsers()
      .then((result) => {
        if (active) setUsers(result)
      })
      .catch((cause: unknown) => {
        if (active) setUserListError(errorMessage(cause))
      })
    return () => {
      active = false
    }
  }, [user])

  async function run(action: () => Promise<void>) {
    setError(null)
    try {
      await action()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  function handleLogin(currentUser: User) {
    setError(null)
    setUser(currentUser)
  }

  function handleLogout() {
    clearAccessToken()
    setUser(null)
    setProjects([])
    setMembers([])
    setTasks([])
    setSelectedProjectId(null)
    setSelectedTaskId(null)
    setError(null)
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    await run(async () => {
      const project = await api.createProject({
        name: String(data.get("name")),
        description: optionalValue(data.get("description")),
      })
      setProjects((current) => [project, ...current])
      setSelectedProjectId(project.id)
      form.reset()
    })
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProject) return
    const form = new FormData(event.currentTarget)
    await run(async () => {
      const updated = await api.updateProject(selectedProject.id, {
        name: String(form.get("name")),
        description: optionalValue(form.get("description")),
      })
      setProjects((current) =>
        current.map((project) => (project.id === updated.id ? updated : project)),
      )
    })
  }

  async function deleteProject() {
    if (!selectedProject || !window.confirm(`Delete "${selectedProject.name}"?`))
      return
    await run(async () => {
      await api.deleteProject(selectedProject.id)
      const remaining = projects.filter(
        (project) => project.id !== selectedProject.id,
      )
      setProjects(remaining)
      setSelectedProjectId(remaining[0]?.id ?? null)
    })
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProjectId) return
    const form = event.currentTarget
    const data = new FormData(form)
    await run(async () => {
      await api.addMember(selectedProjectId, String(data.get("user_id")).trim())
      const updated = await api.listMembers(selectedProjectId)
      setMembers(updated)
      form.reset()
    })
  }

  async function removeMember(member: User) {
    if (!selectedProjectId) return
    await run(async () => {
      await api.removeMember(selectedProjectId, member.id)
      setMembers((current) => current.filter((item) => item.id !== member.id))
    })
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProjectId) return
    const form = event.currentTarget
    const data = new FormData(form)
    await run(async () => {
      const task = await api.createTask(selectedProjectId, {
        title: String(data.get("title")),
        description: optionalValue(data.get("description")),
        status: "todo",
        due_at: null,
        assignee_id: null,
      })
      setTasks((current) => [task, ...current])
      setSelectedTaskId(task.id)
      form.reset()
    })
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProjectId || !selectedTask) return
    const form = new FormData(event.currentTarget)
    const assignee = String(form.get("assignee_id") ?? "")
    const dueAt = String(form.get("due_at") ?? "")
    await run(async () => {
      const updated = await api.updateTask(selectedProjectId, selectedTask.id, {
        title: String(form.get("title")),
        description: optionalValue(form.get("description")),
        status: taskStatus(form.get("status")),
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        assignee_id: assignee || null,
      })
      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task)),
      )
    })
  }

  async function deleteTask() {
    if (
      !selectedProjectId ||
      !selectedTask ||
      !window.confirm(`Delete "${selectedTask.title}"?`)
    )
      return
    await run(async () => {
      await api.deleteTask(selectedProjectId, selectedTask.id)
      const remaining = tasks.filter((task) => task.id !== selectedTask.id)
      setTasks(remaining)
      setSelectedTaskId(remaining[0]?.id ?? null)
    })
  }

  async function createComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProjectId || !selectedTaskId) return
    const form = event.currentTarget
    const data = new FormData(form)
    await run(async () => {
      await api.createComment(selectedProjectId, selectedTaskId, {
        body: String(data.get("body")),
      })
      setCommentsRefresh((current) => current + 1)
      form.reset()
    })
  }

  async function removeComment(commentId: string) {
    if (!selectedProjectId || !selectedTaskId) return
    await run(async () => {
      await api.deleteComment(selectedProjectId, selectedTaskId, commentId)
      setCommentsRefresh((current) => current + 1)
    })
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    await run(async () => {
      const created = await api.createUser({
        email: String(data.get("email")),
        full_name: String(data.get("full_name")),
        password: String(data.get("password")),
      })
      setUsers((current) => [...current, created])
      form.reset()
    })
  }

  if (sessionLoading) {
    return <main className="mx-auto max-w-5xl p-8">Checking session...</main>
  }
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6">
        {error && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <LoginForm onAuthenticated={handleLogin} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Open Project</h1>
          <p className="text-sm text-muted-foreground">
            {user.full_name} · {user.email}
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-5 rounded-lg border bg-background p-4">
          <section>
            <h2 className="mb-3 font-semibold">Projects</h2>
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                    project.id === selectedProjectId ? "bg-muted font-medium" : ""
                  }`}
                >
                  {project.name}
                </button>
              ))}
              {!projects.length && (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              )}
            </div>
          </section>
          <form onSubmit={createProject} className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-medium">Create project</h3>
            <Input name="name" placeholder="Project name" required maxLength={160} />
            <Input name="description" placeholder="Description (optional)" />
            <Button type="submit" size="sm">Create project</Button>
          </form>
        </aside>

        <section className="min-w-0 space-y-6">
          {error && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {!selectedProject ? (
            <div className="rounded-lg border bg-background p-8">
              <h2 className="text-lg font-semibold">Select or create a project</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Projects and tasks will appear here.
              </p>
            </div>
          ) : (
            <>
              <section className="rounded-lg border bg-background p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedProject.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedProject.description || "No description"}
                    </p>
                  </div>
                  {selectedProject.owner_id === user.id && (
                    <Button variant="destructive" onClick={deleteProject}>
                      Delete project
                    </Button>
                  )}
                </div>
                {selectedProject.owner_id === user.id && (
                  <form
                    key={selectedProject.id}
                    onSubmit={saveProject}
                    className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <Input name="name" defaultValue={selectedProject.name} required maxLength={160} aria-label="Project name" />
                    <Input name="description" defaultValue={selectedProject.description ?? ""} aria-label="Project description" />
                    <Button type="submit" variant="outline">Save details</Button>
                  </form>
                )}
              </section>

              <section className="rounded-lg border bg-background p-5">
                <h2 className="mb-3 font-semibold">Members</h2>
                <div className="mb-4 flex flex-wrap gap-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                      <span>{member.full_name}</span>
                      {selectedProject.owner_id === user.id && member.id !== user.id && (
                        <button type="button" aria-label={`Remove ${member.full_name}`} onClick={() => void run(() => removeMember(member))}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {selectedProject.owner_id === user.id && (
                  <form onSubmit={addMember} className="flex max-w-xl gap-2">
                    <Input name="user_id" placeholder="Member user ID" required aria-label="Member user ID" />
                    <Button type="submit" variant="outline">Add member</Button>
                  </form>
                )}
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(360px,1.2fr)]">
                <div className="space-y-4 rounded-lg border bg-background p-5">
                  <h2 className="font-semibold">Tasks</h2>
                  <form onSubmit={createTask} className="space-y-2">
                    <Input name="title" placeholder="Task title" required maxLength={200} />
                    <Input name="description" placeholder="Description (optional)" />
                    <Button type="submit" size="sm">Create task</Button>
                  </form>
                  <div className="space-y-1 border-t pt-3">
                    {tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`w-full rounded-md px-3 py-2 text-left hover:bg-muted ${
                          task.id === selectedTaskId ? "bg-muted" : ""
                        }`}
                      >
                        <span className="block text-sm font-medium">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{task.status.replace("_", " ")}</span>
                      </button>
                    ))}
                    {!tasks.length && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
                  </div>
                </div>

                <div className="space-y-5 rounded-lg border bg-background p-5">
                  {selectedTask ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-semibold">Task details</h2>
                        <Button variant="destructive" size="sm" onClick={deleteTask}>Delete task</Button>
                      </div>
                      <form key={selectedTask.id} onSubmit={saveTask} className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-sm sm:col-span-2">
                          Title
                          <Input name="title" defaultValue={selectedTask.title} required maxLength={200} />
                        </label>
                        <label className="space-y-1 text-sm sm:col-span-2">
                          Description
                          <Input name="description" defaultValue={selectedTask.description ?? ""} />
                        </label>
                        <label className="space-y-1 text-sm">
                          Status
                          <select name="status" defaultValue={selectedTask.status} className="h-9 w-full rounded-md border bg-background px-3">
                            <option value="todo">To do</option>
                            <option value="in_progress">In progress</option>
                            <option value="done">Done</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-sm">
                          Assignee
                          <select name="assignee_id" defaultValue={selectedTask.assignee_id ?? ""} className="h-9 w-full rounded-md border bg-background px-3">
                            <option value="">Unassigned</option>
                            {members.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1 text-sm sm:col-span-2">
                          Due date
                          <Input name="due_at" type="datetime-local" defaultValue={localDateTime(selectedTask.due_at)} />
                        </label>
                        <Button type="submit" variant="outline" className="sm:col-span-2">Save task</Button>
                      </form>

                      <div className="border-t pt-4">
                        <h3 className="mb-3 font-medium">Comments</h3>
                        <CommentList
                          projectId={selectedProject.id}
                          taskId={selectedTask.id}
                          currentUser={user}
                          refreshKey={commentsRefresh}
                          onError={setError}
                          onDelete={removeComment}
                        />
                        <CommentForm onSubmit={createComment} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a task to view details and comments.</p>
                  )}
                </div>
              </section>
            </>
          )}

          {user.role === "admin" && (
            <section className="space-y-4 rounded-lg border bg-background p-5">
              <h2 className="font-semibold">User management</h2>
              <form onSubmit={createUser} className="grid gap-2 sm:grid-cols-4">
                <Input name="full_name" placeholder="Full name" required maxLength={160} />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password (12+ chars)" minLength={12} maxLength={128} required />
                <Button type="submit">Create user</Button>
              </form>
              {userListError && <p role="alert" className="text-sm text-destructive">{userListError}</p>}
              <div className="divide-y">
                {users.map((account) => (
                  <div key={account.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                    <span>{account.full_name} · {account.email}</span>
                    <span className="text-muted-foreground">{account.role} · {account.is_active ? "active" : "inactive"} · {account.id}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  )
}

function CommentList({
  projectId,
  taskId,
  currentUser,
  refreshKey,
  onError,
  onDelete,
}: {
  projectId: string
  taskId: string
  currentUser: User
  refreshKey: number
  onError: (message: string | null) => void
  onDelete: (commentId: string) => Promise<void>
}) {
  const [comments, setComments] = useState<Awaited<ReturnType<typeof api.listComments>>>([])

  useEffect(() => {
    let active = true
    setComments([])
    api
      .listComments(projectId, taskId)
      .then((result) => {
        if (active) setComments(result)
      })
      .catch((cause: unknown) => {
        if (active) onError(errorMessage(cause))
      })
    return () => {
      active = false
    }
  }, [projectId, taskId, refreshKey, onError])

  return (
    <div className="mb-4 space-y-2">
      {comments.map((comment) => (
        <article key={comment.id} className="rounded-md bg-muted/60 p-3 text-sm">
          <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
            <span>{comment.author_id === currentUser.id ? "You" : comment.author_id}</span>
            <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString()}</time>
          </div>
          <p className="whitespace-pre-wrap">{comment.body}</p>
          {(comment.author_id === currentUser.id || currentUser.role === "admin") && (
            <button type="button" className="mt-2 text-xs text-destructive underline" onClick={() => void onDelete(comment.id)}>
              Delete comment
            </button>
          )}
        </article>
      ))}
      {!comments.length && <p className="text-sm text-muted-foreground">No comments yet.</p>}
    </div>
  )
}

function CommentForm({
  onSubmit,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    await onSubmit(event)
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex gap-2">
      <Input name="body" placeholder="Write a comment" required maxLength={10_000} />
      <Button type="submit" variant="outline">Send</Button>
    </form>
  )
}

function optionalValue(value: FormDataEntryValue | null): string | null {
  const result = String(value ?? "").trim()
  return result || null
}

function localDateTime(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function taskStatus(value: FormDataEntryValue | null): TaskStatus {
  if (value === "in_progress" || value === "done") return value
  return "todo"
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Request failed"
}
