import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Button, Dialog, Field, Input, Select, Tabs, Tooltip } from "../components/ui";

const filePath = "count.txt";

async function readCount() {
  return parseInt(await fs.promises.readFile(filePath, "utf-8").catch(() => "0"));
}

const getCount = createServerFn({
  method: "GET",
}).handler(() => {
  return readCount();
});

const updateCount = createServerFn({ method: "POST" })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => await getCount(),
});

function Home() {
  const router = useRouter();
  const state = Route.useLoaderData();

  return (
    <main style={{ padding: 48 }}>
      <h1 style={{ fontSize: 42, fontWeight: 300, margin: "0 0 24px" }}>IBM Carbon components</h1>

      <section style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 48 }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </section>

      <section style={{ display: "flex", flexWrap: "wrap", gap: 32, marginBottom: 48 }}>
        <Dialog.Root>
          <Dialog.Trigger variant="primary">Open dialog</Dialog.Trigger>
          <Dialog.Content
            heading="Dialog title"
            description="This is the IBM-styled dialog description."
          >
            <div style={{ display: "flex", gap: 16 }}>
              <Dialog.Close variant="secondary">Cancel</Dialog.Close>
              <Button variant="primary">Confirm</Button>
            </div>
          </Dialog.Content>
        </Dialog.Root>

        <Field.Root style={{ minWidth: 280 }}>
          <Field.Label>Email address</Field.Label>
          <Input placeholder="name@example.com" />
          <Field.Description>Helper text goes here.</Field.Description>
        </Field.Root>

        <Select.Root defaultValue="option-a">
          <Select.Trigger placeholder="Choose an option" />
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="option-a">Option A</Select.Item>
                <Select.Item value="option-b">Option B</Select.Item>
                <Select.Item value="option-c">Option C</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </section>

      <section style={{ maxWidth: 480, marginBottom: 48 }}>
        <Tabs.Root defaultValue="tab-1">
          <Tabs.List>
            <Tabs.Tab value="tab-1">Overview</Tabs.Tab>
            <Tabs.Tab value="tab-2">Specs</Tabs.Tab>
            <Tabs.Tab value="tab-3">Pricing</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="tab-1">Overview content.</Tabs.Panel>
          <Tabs.Panel value="tab-2">Specs content.</Tabs.Panel>
          <Tabs.Panel value="tab-3">Pricing content.</Tabs.Panel>
        </Tabs.Root>
      </section>

      <section>
        <Tooltip.Provider delay={200}>
          <Tooltip.Root>
            <Tooltip.Trigger render={<button type="button" />}>Hover me</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Tooltip content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </section>

      <section style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e0e0e0" }}>
        <button
          type="button"
          onClick={() => {
            updateCount({ data: 1 }).then(() => {
              router.invalidate();
            });
          }}
        >
          Add 1 to {state}?
        </button>

        <h1 className="text-3xl font-bold underline">Hello World!</h1>
      </section>
    </main>
  );
}
