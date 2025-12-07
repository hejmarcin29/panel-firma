import { getBoardData } from "../actions";
import { TaskList } from "../_components/task-list";
import { notFound } from "next/navigation";

interface TodoListPageProps {
  params: {
    columnId: string;
  };
}

export default async function TodoListPage({ params }: TodoListPageProps) {
  const { columnId } = params;
  const { columns } = await getBoardData();
  const column = columns.find((c) => c.id === columnId);

  if (!column) {
    notFound();
  }

  return <TaskList column={column} />;
}
