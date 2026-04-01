import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { C } from '../constants/theme';
import { StatusBadge } from '../components/UIComponents';
import { taskAPI, categoryAPI } from '../services/api';

const PriorityBadge = ({ label }) => {
  const map = {
    'Kritis': { bg: '#FF0040', text: '#fff' },
    'Tinggi': { bg: '#FF6B8A', text: '#fff' },
    'Sedang': { bg: '#FFF0B0', text: '#B08000' },
    'Rendah': { bg: '#E8F5E9', text: '#2E7D32' },
  };
  const s = map[label] || { bg: '#eee', text: '#555' };
  return (
    <span style={{ background: s.bg, color: s.text, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>
      ⚡ {label}
    </span>
  );
};

const TaskManagement = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDeadline, setFilterDeadline] = useState('');

  const columns = ["Backlog", "On Progress", "Done"];
  const colColors = { "Backlog": "#000000", "On Progress": "#FF9800", "Done": "#4CAF50" };

  useEffect(() => {
    fetchCategories();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getAll();
      // Handle both array response and object with data property
      const tasks = Array.isArray(response) ? response : (response.data || response.tasks || []);
      setTasks(tasks);
    } catch (err) {
      setError('Gagal memuat tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      await taskAPI.update(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert('Gagal update status: ' + err.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Hapus task ini?')) return;
    try {
      await taskAPI.delete(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      alert('Gagal hapus task: ' + err.message);
    }
  };

  // Filter tasks based on category and deadline
  const filteredTasks = tasks.filter(task => {
    let match = true;
    
    // Filter by category
    if (filterCategory && task.kategoriTask !== filterCategory) {
      match = false;
    }
    
    // Filter by deadline
    if (filterDeadline && match) {
      const taskDate = new Date(task.deadline).toISOString().split('T')[0];
      match = taskDate === filterDeadline;
    }
    
    return match;
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ color: C.textGray, fontSize: 16 }}>⏳ Memuat tasks...</div>
    </div>
  );

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.textDark }}>Papan Kanban</div>
        <button onClick={() => navigate("/tasks/create")} style={{
          background: C.primary, color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14
        }}>+ Buat Tugas</button>
      </div>

      {/* Info rule-based */}
      <div style={{ background: C.primaryLight, borderRadius: 8, padding: "8px 16px", marginBottom: 20, fontSize: 12, color: C.primary }}>
        ⚡ <strong>Rule-Based Scheduling aktif</strong> — Task diurutkan otomatis berdasarkan urgensi deadline, tingkat kesulitan, dan estimasi pengerjaan
      </div>

      {/* Filters */}
      <div style={{ background: C.white, borderRadius: 12, padding: 16, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.textGray, marginBottom: 4, display: 'block' }}>
            📁 Filter Kategori
          </label>
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            style={{
              border: "1.5px solid #E0E4F0", borderRadius: 8, padding: "8px 12px",
              fontSize: 13, color: C.textDark, background: C.white, cursor: 'pointer',
              minWidth: 180
            }}
          >
            <option value="">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.textGray, marginBottom: 4, display: 'block' }}>
            📅 Filter Deadline
          </label>
          <input 
            type="date"
            value={filterDeadline}
            onChange={e => setFilterDeadline(e.target.value)}
            style={{
              border: "1.5px solid #E0E4F0", borderRadius: 8, padding: "8px 12px",
              fontSize: 13, color: C.textDark, background: C.white, cursor: 'pointer'
            }}
          />
        </div>

        {(filterCategory || filterDeadline) && (
          <button
            onClick={() => {
              setFilterCategory('');
              setFilterDeadline('');
            }}
            style={{
              background: 'transparent', color: C.primary, border: `1px solid ${C.primary}`,
              borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: 'pointer',
              fontSize: 12
            }}
          >
            ✕ Clear Filter
          </button>
        )}
      </div>

      {error && <div style={{ color: C.red, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {columns.map(col => {
          // Filter tasks by status and apply filters
          const colTasks = filteredTasks.filter(t => t.status === col);
          return (
            <div key={col} style={{ background: C.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: colColors[col] }} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{col}</span>
                  <span style={{ background: C.bg, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.textGray }}>
                    {colTasks.length}
                  </span>
                </div>
                {col === "Backlog" && (
                  <button onClick={() => navigate("/tasks/create")} style={{
                    background: C.primaryLight, color: C.primary, border: "none",
                    borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 16, fontWeight: 700
                  }}>+</button>
                )}
              </div>
              <div style={{ height: 3, borderRadius: 2, background: colColors[col], marginBottom: 16 }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {colTasks.length === 0 && (
                  <div style={{ textAlign: "center", color: C.textGray, fontSize: 13, padding: "20px 0" }}>
                    Tidak ada task
                  </div>
                )}
                {colTasks.map((task, idx) => {
                  const deadline = new Date(task.deadline);
                  const sisaHari = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
                  const isOverdue = sisaHari < 0 && task.status !== 'Done';

                  return (
                    <div key={task._id} style={{
                      background: isOverdue ? '#FFF0F0' : C.bg,
                      borderRadius: 12, padding: 14,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      border: isOverdue ? `1px solid ${C.red}` : 'none',
                      position: 'relative'
                    }}>
                      {/* Nomor urut prioritas */}
                      {col !== 'Done' && (
                        <div style={{
                          position: 'absolute', top: -8, left: -8,
                          width: 20, height: 20, borderRadius: '50%',
                          background: C.primary, color: '#fff',
                          fontSize: 10, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{idx + 1}</div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <StatusBadge status={task.tingkatKesulitan} />
                          {task.priorityLabel && <PriorityBadge label={task.priorityLabel} />}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => navigate(`/tasks/edit/${task._id}`)}
                            style={{
                              background: "transparent", border: "none", cursor: "pointer",
                              fontSize: 16, color: C.textGray, padding: 4
                            }}
                            title="Edit task"
                          >
                            ✏️
                          </button>
                          <select
                            onChange={e => {
                              if (e.target.value === "delete") deleteTask(task._id);
                              else moveTask(task._id, e.target.value);
                            }}
                            value=""
                            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: C.textGray }}
                          >
                            <option value="" disabled>⋯</option>
                            {columns.filter(c => c !== col).map(c => (
                              <option key={c} value={c}>Pindah ke {c}</option>
                            ))}
                            <option value="delete">🗑️ Hapus</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: 14, color: C.textDark, marginBottom: 4 }}>{task.namaTugas}</div>
                      <div style={{ fontSize: 12, color: C.textGray, marginBottom: 8 }}>{task.kategoriTask}</div>

                      <div style={{ fontSize: 11, color: isOverdue ? C.red : C.textGray }}>
                        📅 {new Date(task.deadline).toLocaleDateString('id-ID')} · ⏱️ {task.estimasiPengerjaan}
                        {isOverdue && <span style={{ marginLeft: 4, fontWeight: 700 }}>⚠️ Terlambat!</span>}
                        {!isOverdue && sisaHari <= 3 && task.status !== 'Done' && (
                          <span style={{ marginLeft: 4, color: C.red, fontWeight: 700 }}>⚠️ {sisaHari} hari lagi</span>
                        )}
                      </div>

                      {/* Priority score */}
                      {task.priorityScore > 0 && col !== 'Done' && (
                        <div style={{ marginTop: 6, fontSize: 10, color: C.textGray }}>
                          Skor prioritas: <strong style={{ color: C.primary }}>{task.priorityScore}</strong>
                        </div>
                      )}

                      {task.status === "Done" && (
                        <div style={{ marginTop: 8 }}><StatusBadge status="Selesai" /></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskManagement;
