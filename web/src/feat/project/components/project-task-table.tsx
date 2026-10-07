import type { ReactNode } from "react";
import { cn } from "cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProjectTaskTableHeaderRow = {
  id: string;
  cells: { id: string; content: ReactNode }[];
};

export function ProjectTaskTable({
  headerRows,
  bodyKey,
  className,
  containerClassName,
  headerClassName,
  columnGroup,
  emptyState,
  children,
}: {
  headerRows: ProjectTaskTableHeaderRow[];
  bodyKey: string;
  className: string;
  containerClassName: string;
  headerClassName?: string;
  columnGroup?: ReactNode;
  emptyState?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Table
      containerClassName={containerClassName}
      className={className}
    >
      {columnGroup}
      <TableHeader>
        {headerRows.map((group) => (
          <TableRow key={group.id}>
            {group.cells.map((cell) => (
              <TableHead
                key={cell.id}
                className={cn("sticky top-0 z-10 bg-background", headerClassName)}
              >
                {cell.content}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody key={bodyKey}>
        {children}
        {emptyState}
      </TableBody>
    </Table>
  );
}
