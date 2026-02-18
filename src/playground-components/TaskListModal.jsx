import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreVertical, Calendar, Clock, CheckCircle2, Circle, Trash2, X } from 'lucide-react';

const App = () => {
    const [tasks, setTasks] = useState([
        { id: 1, title: "Revisar diseño de UX", project: "Website Redesign", due: "Hoy", status: "completed" },
        { id: 2, title: "Actualizar dependencias", project: "Backend API", due: "Mañana", status: "pending" },
        { id: 3, title: "Preparar presentación mensual", project: "Marketing", due: "Viernes", status: "pending" },
        { id: 4, title: "Sincronizar base de datos", project: "Maintenance", due: "Próxima semana", status: "pending" },
        { id: 5, title: "Entrevistar candidatos", project: "HR", due: "Hoy", status: "pending" },
        { id: 6, title: "Corregir bugs en login", project: "Auth Service", due: "Ayer", status: "completed" },
        { id: 7, title: "Optimizar imágenes", project: "Assets", due: "Jueves", status: "pending" },
        { id: 8, title: "Redactar documentación", project: "Wiki", due: "Viernes", status: "pending" },
        { id: 9, title: "Configurar CI/CD", project: "DevOps", due: "Lunes", status: "pending" },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const buttonRef = useRef(null);

    // --- LÓGICA PRINCIPAL DEL REQUERIMIENTO ---
    useEffect(() => {
        const handleScroll = () => {
            // Si el modal está abierto y ocurre CUALQUIER scroll en la página, ciérralo.
            if (isModalOpen) {
                setIsModalOpen(false);
            }
        };

        // Usamos 'true' (capture phase) para detectar scroll en divs internos, no solo en window
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isModalOpen]);
    // ------------------------------------------

    const toggleTaskStatus = (id) => {
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
        ));
    };

    const addTask = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask = {
            id: Date.now(),
            title: newTaskTitle,
            project: "General",
            due: "Pronto",
            status: "pending"
        };

        setTasks([newTask, ...tasks]);
        setNewTaskTitle("");
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">

            {/* Header Fijo */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-20 relative">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Mis Tareas</h1>
                    <p className="text-sm text-slate-500">Tienes {tasks.filter(t => t.status === 'pending').length} tareas pendientes</p>
                </div>

                {/* Botón para abrir Modal */}
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={() => setIsModalOpen(!isModalOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all active:scale-95 ${isModalOpen
                                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                            }`}
                    >
                        {isModalOpen ? <X size={20} /> : <Plus size={20} />}
                        <span className="font-medium">{isModalOpen ? 'Cerrar' : 'Nueva Tarea'}</span>
                    </button>

                    {/* --- EL MODAL / POPOVER --- */}
                    {isModalOpen && (
                        <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-slate-800">Crear nueva tarea</h3>
                            </div>

                            <form onSubmit={addTask} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Título</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Ej. Comprar café..."
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Proyecto</label>
                                        <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                            <option>General</option>
                                            <option>Trabajo</option>
                                            <option>Personal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prioridad</label>
                                        <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                            <option>Normal</option>
                                            <option>Alta</option>
                                            <option>Baja</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg font-medium text-sm transition-colors flex justify-center items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Añadir Tarea
                                </button>
                            </form>

                            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                                <p className="text-xs text-slate-400">Desplaza la lista para cerrar este menú</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Contenido Scrollable */}
            <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <div className="max-w-3xl mx-auto space-y-3">

                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Lista de Tareas</h2>

                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-blue-200 ${task.status === 'completed' ? 'opacity-60 bg-gray-50' : ''
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => toggleTaskStatus(task.id)}
                                    className={`flex-shrink-0 transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-slate-300 hover:text-blue-500'
                                        }`}
                                >
                                    {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>

                                <div>
                                    <h3 className={`font-medium text-slate-800 ${task.status === 'completed' ? 'line-through text-slate-500' : ''
                                        }`}>
                                        {task.title}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                            {task.project}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} /> {task.due}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Espacio extra para demostrar el scroll */}
                    <div className="h-32 flex items-center justify-center text-slate-300 text-sm border-2 border-dashed border-slate-200 rounded-xl mt-8">
                        Fin de la lista - Sigue desplazando
                    </div>

                    {/* Elementos de relleno para forzar el scroll */}
                    {[...Array(5)].map((_, i) => (
                        <div key={`placeholder-${i}`} className="h-20 bg-gray-100/50 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default App;
