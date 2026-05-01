import { useState, useCallback } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Lock } from 'lucide-react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       dot: 'bg-gray-400'    },
  { id: 'in-progress', label: 'In Progress',  dot: 'bg-blue-500'    },
  { id: 'done',        label: 'Done',         dot: 'bg-emerald-500' },
];

function Column({ column, tasks, onAddTask, onTaskClick, isOver, isAdmin }) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col rounded-2xl transition-colors duration-150 min-h-[480px]
        ${isOver
          ? 'bg-indigo-50 ring-2 ring-indigo-300'
          : 'bg-gray-50'}
      `}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
          <span className="text-sm font-semibold text-gray-700">{column.label}</span>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full min-w-5 text-center">
            {tasks.length}
          </span>
        </div>

        {/* Only admins see the add button */}
        {isAdmin && (
          <button
            onClick={() => onAddTask(column.id)}
            className="w-6 h-6 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
            title="Add task"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Tasks list */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
        <SortableContext
          items={tasks.map(t => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {/* Empty state — only admins get a clickable drop zone */}
        {tasks.length === 0 && (
          isAdmin ? (
            <div
              className="h-24 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors"
              onClick={() => onAddTask(column.id)}
            >
              <Plus size={16} className="text-gray-300 mb-1" />
              <p className="text-xs text-gray-300">Add task</p>
            </div>
          ) : (
            <div className="h-24 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-100">
              <p className="text-xs text-gray-300">No tasks here</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onTaskClick, onAddTask, onTaskMove, isAdmin = false }) {
  const [activeTask, setActiveTask] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const handleDragStart = useCallback((event) => {
    const task = tasks.find(t => t._id === event.active.id);
    setActiveTask(task || null);
  }, [tasks]);

  const handleDragOver = useCallback((event) => {
    const { over } = event;
    if (!over) { setOverColumn(null); return; }
    const isColumn = COLUMNS.some(c => c.id === over.id);
    setOverColumn(isColumn ? over.id : tasks.find(t => t._id === over.id)?.status || null);
  }, [tasks]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);
    if (!over) return;

    const draggedTask = tasks.find(t => t._id === active.id);
    if (!draggedTask) return;

    const isColumnDrop = COLUMNS.some(c => c.id === over.id);
    const newStatus = isColumnDrop
      ? over.id
      : tasks.find(t => t._id === over.id)?.status;

    // Both admins and members can drag to change status
    if (newStatus && newStatus !== draggedTask.status) {
      onTaskMove(draggedTask._id, newStatus);
    }
  }, [tasks, onTaskMove]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map(col => (
          <Column
            key={col.id}
            column={col}
            tasks={getTasksByStatus(col.id)}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
            isOver={overColumn === col.id}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-95">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
