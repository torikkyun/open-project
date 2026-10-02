import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <h1 className="text-3xl font-bold underline">
      Hello World!
      <Button>Click me</Button>
    </h1>
  )
}
