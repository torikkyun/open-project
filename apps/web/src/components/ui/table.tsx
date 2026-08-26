import type { ComponentProps } from "react";
import { cn } from "./cn";

export type TableContainerProps = ComponentProps<"div">;
export type TableRootProps = ComponentProps<"table">;
export type TableHeaderProps = ComponentProps<"thead">;
export type TableBodyProps = ComponentProps<"tbody">;
export type TableFooterProps = ComponentProps<"tfoot">;
export type TableRowProps = ComponentProps<"tr">;
export type TableHeadProps = ComponentProps<"th">;
export type TableCellProps = ComponentProps<"td">;
export type TableCaptionProps = ComponentProps<"caption">;

function TableContainer({ className, ...props }: TableContainerProps) {
  return (
    <div
      className={cn("w-full overflow-x-auto border border-hairline", className)}
      {...props}
    />
  );
}

function TableRoot({ className, ...props }: TableRootProps) {
  return (
    <table
      className={cn(
        "w-full border-collapse text-left text-sm text-ink",
        className,
      )}
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={cn("bg-surface-1", className)} {...props} />;
}

function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-hairline", className)} {...props} />
  );
}

function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={cn("border-t border-hairline bg-surface-1", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-surface-1 data-[selected]:bg-surface-1",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "h-12 whitespace-nowrap border-r border-hairline px-4 text-xs font-semibold tracking-caption text-ink-muted last:border-r-0",
        className,
      )}
      scope="col"
      {...props}
    />
  );
}

function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "h-12 whitespace-nowrap border-r border-hairline px-4 align-middle last:border-r-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={cn(
        "caption-bottom px-4 py-3 text-left text-xs text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

export const Table = {
  Container: TableContainer,
  Root: TableRoot,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Caption: TableCaption,
};
