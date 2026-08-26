import { useState } from "react";
import { Checkbox } from "../checkbox";
import { Table } from "../table";
import { StorySection } from "./story-section";

const projects = [
  {
    id: "website",
    name: "Website Redesign",
    manager: "An Tran",
    status: "Active",
    progress: 62,
  },
  {
    id: "mobile",
    name: "Mobile App MVP",
    manager: "Bao Le",
    status: "Active",
    progress: 40,
  },
  {
    id: "brand",
    name: "Brand Refresh",
    manager: "Chi Ngo",
    status: "Done",
    progress: 100,
  },
];

export function TableStories() {
  const [selected, setSelected] = useState<string[]>(["mobile"]);
  const allSelected = selected.length === projects.length;
  const partiallySelected = selected.length > 0 && !allSelected;

  return (
    <StorySection
      id="table"
      title="Table"
      description="Semantic data table with responsive overflow and row selection."
    >
      <Table.Container>
        <Table.Root>
          <Table.Caption>
            {selected.length} of {projects.length} projects selected
          </Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.Head className="w-12 px-3">
                <Checkbox.Root
                  aria-label="Select all projects"
                  checked={allSelected}
                  indeterminate={partiallySelected}
                  onCheckedChange={(checked) => {
                    setSelected(
                      checked ? projects.map((project) => project.id) : [],
                    );
                  }}
                />
              </Table.Head>
              <Table.Head>Name</Table.Head>
              <Table.Head>Manager</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Progress</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {projects.map((project) => {
              const isSelected = selected.includes(project.id);

              return (
                <Table.Row
                  key={project.id}
                  data-selected={isSelected || undefined}
                >
                  <Table.Cell className="w-12 px-3">
                    <Checkbox.Root
                      aria-label={`Select ${project.name}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        setSelected((current) =>
                          checked
                            ? [...current, project.id]
                            : current.filter((id) => id !== project.id),
                        );
                      }}
                    />
                  </Table.Cell>
                  <Table.Cell className="font-semibold">
                    {project.name}
                  </Table.Cell>
                  <Table.Cell>{project.manager}</Table.Cell>
                  <Table.Cell>
                    <span
                      className={
                        project.status === "Done"
                          ? "text-success"
                          : "text-primary"
                      }
                    >
                      {project.status}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="min-w-40">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-1 flex-1 bg-hairline"
                        aria-hidden="true"
                      >
                        <div
                          className={
                            project.status === "Done"
                              ? "h-full bg-success"
                              : "h-full bg-primary"
                          }
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs text-ink-muted">
                        {project.progress}%
                      </span>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.Container>
    </StorySection>
  );
}
