import { getBoardData } from "../actions";
import { TaskList } from "../_components/task-list";
import { notFound } from "next/navigation";

export default async function TodoListPage({ params }: { params: { columnId: string } }) {
  const { columns } = await getBoardData();
  const column = columns.find((c) => c.id === params.columnId);

  if (!column) {
    notFound();
  }

  return <TaskList column={column} />;
}
