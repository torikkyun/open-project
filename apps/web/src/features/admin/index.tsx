import { PagePlaceholder } from "../../components/shared/page-placeholder";

export function AdminPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <PagePlaceholder description={description} title={title} />;
}
