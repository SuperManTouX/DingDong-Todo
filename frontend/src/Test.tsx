// NestedDndOneFile.tsx
import React from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: number;
  datetimeLocal: string;
  deadline: string;
  parentId: string | null;
  depth: number;
}

const INDENT = 24;

export default function NestedDndOneFile() {
  const [tasks, setTasks] = React.useState<Task[]>(() => [
    {
      id: "1",
      text: "学习 React",
      completed: false,
      priority: 2,
      datetimeLocal: dayjs().format(),
      deadline: dayjs("2025-09-15").format(),
      parentId: null,
      depth: 0,
    },
    {
      id: uuid(),
      text: "Sub 学习 React1",
      completed: false,
      priority: 2,
      datetimeLocal: dayjs().format(),
      deadline: dayjs("2025-09-18").format(),
      parentId: "1",
      depth: 1,
    },
    {
      id: uuid(),
      text: "Sub 学习 React2",
      completed: false,
      priority: 2,
      datetimeLocal: dayjs().format(),
      deadline: dayjs("2025-09-18").format(),
      parentId: "1",
      depth: 1,
    },
    {
      id: uuid(),
      text: "写一个 TODOListOriginal 组件",
      completed: true,
      priority: 1,
      datetimeLocal: dayjs().format(),
      deadline: dayjs("2025-09-10").format(),
      parentId: null,
      depth: 0,
    },
    {
      id: uuid(),
      text: "部署到 GitHub Pages",
      completed: false,
      priority: 0,
      datetimeLocal: dayjs().format(),
      deadline: dayjs("2025-09-10").format(),
      parentId: null,
      depth: 0,
    },
    {
      id: uuid(),
      text: "test",
      completed: false,
      priority: 0,
      parentId: null,
      depth: 0,
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id)!;
    const overId = over.id as string;

    let newParentId: string | null = null;
    let newDepth = 0;

    if (overId === "root-list") {
      newParentId = null;
      newDepth = 0;
    } else {
      const overTask = tasks.find((t) => t.id === overId)!;
      newParentId = overTask.id;
      newDepth = overTask.depth + 1;
    }

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === overId);

    const newFlat = arrayMove(tasks, oldIndex, newIndex).map((t) =>
      t.id === active.id ? { ...t, parentId: newParentId, depth: newDepth } : t,
    );

    setTasks(newFlat);
    setActiveId(null);
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <div
      style={{ maxWidth: 480, margin: "32px auto", fontFamily: "sans-serif" }}
    >
      <h3>父子可互拖的嵌套列表（dnd-kit 单文件版）</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div id="root-list">
            {tasks.map((task) => (
              <SortableTask key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? <TaskItem task={activeTask} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ---------- 子组件 ---------- */
function SortableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem task={task} />
    </div>
  );
}

function TaskItem({
  task,
  isDragOverlay,
}: {
  task: Task;
  isDragOverlay?: boolean;
}) {
  return (
    <div
      style={{
        paddingLeft: task.depth * INDENT,
        paddingBlock: 8,
        border: "1px solid #ccc",
        marginBottom: 4,
        background: isDragOverlay ? "#f3f3f3" : "#fff",
        display: "flex",
        alignItems: "center",
        borderRadius: 4,
      }}
    >
      <span style={{ marginRight: 8, cursor: "grab" }}>::</span>
      <span>{task.text}</span>
    </div>
  );
}
