import React, { useState, useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { ToolPageLayout } from '../../components/ToolPageLayout';

type Priority = 'High' | 'Medium' | 'Low';
type SortBy = 'default' | 'dueDate' | 'priority';

interface Todo {
    id: number;
    text: string;
    completed: boolean;
    priority: Priority;
    dueDate: string | null;
}

const priorityMap: Record<Priority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };

const PriorityBadge: React.FC<{priority: Priority}> = ({ priority }) => {
    const colors = {
        'High': 'bg-red-500/20 text-red-400',
        'Medium': 'bg-yellow-500/20 text-yellow-400',
        'Low': 'bg-green-500/20 text-green-400'
    };
    return <span className={`px-2 py-0.5 text-xs rounded-full ${colors[priority]}`}>{priority}</span>
}

const TodoList: React.FC = () => {
    const [todos, setTodos] = useLocalStorage<Todo[]>('dicetools-advanced-todos', []);
    const [newTodo, setNewTodo] = useState('');
    const [newPriority, setNewPriority] = useState<Priority>('Medium');
    const [newDueDate, setNewDueDate] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('default');

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        const newTodoItem: Todo = {
            id: Date.now(),
            text: newTodo,
            completed: false,
            priority: newPriority,
            dueDate: newDueDate || null,
        };
        setTodos([newTodoItem, ...todos]);
        setNewTodo('');
        setNewDueDate('');
    };
    
    const toggleTodo = (id: number) => {
        setTodos(todos.map(todo => todo.id === id ? {...todo, completed: !todo.completed} : todo));
    };
    
    const deleteTodo = (id: number) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };
    
    const sortedTodos = useMemo(() => {
        const sorted = [...todos];
        if (sortBy === 'dueDate') {
            sorted.sort((a, b) => {
                if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                if (a.dueDate) return -1;
                if (b.dueDate) return 1;
                return 0;
            });
        } else if (sortBy === 'priority') {
            sorted.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
        }
        return sorted;
    }, [todos, sortBy]);

    return (
        <ToolPageLayout
            title="Advanced To-Do List"
            description="Manage your tasks with priorities and due dates."
        >
            <div className="max-w-2xl mx-auto">
                <form onSubmit={addTodo} className="bg-brand-bg p-4 rounded-lg mb-4 space-y-3">
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="Add a new task"
                        className="w-full p-2 bg-brand-surface border border-brand-border rounded-md"
                    />
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-brand-text-secondary">Priority</label>
                            <select value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-xs text-brand-text-secondary">Due Date</label>
                            <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full p-2 bg-brand-surface border border-brand-border rounded-md text-brand-text-secondary"/>
                         </div>
                    </div>
                    <button type="submit" className="w-full bg-brand-primary text-white p-2 rounded-md">Add Task</button>
                </form>
                
                <div className="flex justify-end mb-2">
                    <select onChange={e => setSortBy(e.target.value as SortBy)} value={sortBy} className="text-sm bg-brand-surface border border-brand-border rounded-md p-1">
                        <option value="default">Sort by Default</option>
                        <option value="dueDate">Sort by Due Date</option>
                        <option value="priority">Sort by Priority</option>
                    </select>
                </div>

                <div className="space-y-2">
                    {sortedTodos.map(todo => (
                        <div key={todo.id} className="flex items-center bg-brand-bg p-3 rounded-md">
                            <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="mr-3 h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-surface"/>
                            <div className="flex-grow">
                                <span className={`cursor-pointer ${todo.completed ? 'line-through text-brand-text-secondary' : ''}`}>
                                    {todo.text}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <PriorityBadge priority={todo.priority} />
                                    {todo.dueDate && <span className="text-xs text-brand-text-secondary">{new Date(todo.dueDate).toLocaleDateString()}</span>}
                                </div>
                            </div>
                            <button onClick={() => deleteTodo(todo.id)} className="text-red-500 ml-4 font-bold">✕</button>
                        </div>
                    ))}
                </div>
            </div>
        </ToolPageLayout>
    );
};

export default TodoList;
