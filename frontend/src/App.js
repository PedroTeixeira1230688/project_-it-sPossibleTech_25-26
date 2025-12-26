import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './store/userAuth';
import { getTasks, addTask, toggleTask, deleteTask, loginRequest } from './service/api';
import './App.css';

function App() {
    const { token, setToken, logout } = useAuthStore();
    const [newTask, setNewTask] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const queryClient = useQueryClient();

    // 1. LOGIN
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await loginRequest({ username, password });
            setToken(res.data.token);
        } catch (err) {
            alert("Whoops! Invalid credentials");
        }
    };

    // 2. BUSCAR TAREFAS
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks', token],
        queryFn: getTasks, 
        enabled: !!token
    });

    // 3. ADICIONAR TAREFA 
    const addMutation = useMutation({
        mutationFn: addTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setNewTask("");
        }
    });

    // 4. ALTERNAR CONCLUSÃO
    const toggleMutation = useMutation({
        mutationFn: toggleTask,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });

    // 5. ELIMINAR TAREFA
    const deleteMutation = useMutation({
        mutationFn: deleteTask,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        addMutation.mutate(newTask);
    };
    
    // Ecrã de Login 
    if (!token) {
        return (
            <div className="container">
                <div className="todo-card">
                    <h1>Restrain Access</h1>
                    <form onSubmit={handleLogin} className="input-group login-form">
                        <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
                        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                        <button type="submit" className="add-btn">Login</button>
                    </form>
                </div>
            </div>
        );
    }

    // Ecrã Principal (Se houver token)
    if (isLoading) return <div className="container"><p className="empty">Loading...</p></div>;

    return (
        <div className="container">
            <div className="todo-card">
                <div className="header-actions">
                    <h1>Task Management</h1>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>

                <form onSubmit={handleAddTask} className="input-group">
                    <input
                        type="text"
                        placeholder="New Task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                    <button type="submit" className="add-btn" disabled={addMutation.isPending}>
                        {addMutation.isPending ? "..." : "Add"}
                    </button>
                </form>

                <div className="task-list">
                    {tasks.map((task) => (
                        <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                            <div className="task-content"><span className="task-title">{task.title}</span></div>
                            <div className="task-actions">
                                <button
                                    className={`status-btn ${task.completed ? 'btn-undo' : 'btn-complete'}`}
                                    onClick={() => toggleMutation.mutate(task._id)}
                                >
                                    {task.completed ? 'Open' : 'Finish'}
                                </button>
                                <button className="delete-btn" onClick={() => deleteMutation.mutate(task._id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {tasks.length === 0 && <p className="empty">No tasks found.</p>}
            </div>
        </div>
    );
}

export default App;