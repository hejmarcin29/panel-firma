import { getBoardData } from "../actions";
import { TaskList } from "../_components/task-list";
import { notFound } from "next/navigation";

export default async function TodoListPage({ params }: { params: Promise<{ columnId: string }> }) {
  const { columnId } = await params;
  const { columns } = await getBoardData();
  const column = columns.find((c) => c.id === columnId);

  if (!column) {
    notFound();
  }

  return <TaskList column={column} />;
}
