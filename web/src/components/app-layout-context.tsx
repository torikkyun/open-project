import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"

import type { Project } from "@/api"

type AppLayoutContextValue = {
  projects: Project[]
  setProjects: Dispatch<SetStateAction<Project[]>>
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
}

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null)

export function AppLayoutProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  )
  const value = useMemo(
    () => ({
      projects,
      setProjects,
      selectedProjectId,
      setSelectedProjectId,
    }),
    [projects, selectedProjectId],
  )

  return (
    <AppLayoutContext.Provider value={value}>
      {children}
    </AppLayoutContext.Provider>
  )
}

export function useAppLayout() {
  const context = useContext(AppLayoutContext)
  if (!context) throw new Error("useAppLayout must be used within AppLayout")
  return context
}
