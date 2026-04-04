
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const columns = ["Backlog", "On Progress", "Done"];
  const colColors = { "Backlog": "#000000", "On Progress": "#FF9800", "Done": "#4CAF50" };

  // Style helpers
  const cardBoxShadow = "0 2px 12px rgba(0,0,0,0.08)";
  const cardHoverShadow = "0 4px 18px rgba(0,0,0,0.13)";
  const transition = "all 0.18s cubic-bezier(.4,0,.2,1)";

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

  const handleDeleteClick = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await taskAPI.delete(taskToDelete);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete));
      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 2000);
    } catch (err) {
      alert('Gagal hapus task: ' + err.message);
      setShowDeleteConfirm(false);
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
    <div style={{ padding: 32, background: C.bg, minHeight: '100vh' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.textDark, letterSpacing: 0.5 }}>Papan Kanban</div>
        <button onClick={() => navigate("/tasks/create")} style={{
          background: C.primary, color: "#fff", border: "none",
          borderRadius: 12, padding: "12px 28px", fontWeight: 700, cursor: "pointer", fontSize: 15,
          boxShadow: cardBoxShadow, transition
        }}
        onMouseOver={e => e.currentTarget.style.background = C.primaryDark}
        onMouseOut={e => e.currentTarget.style.background = C.primary}
        >+ Buat Tugas</button>
      </div>

      {/* Info rule-based */}
      <div style={{ background: C.primaryLight, borderRadius: 10, padding: "10px 20px", marginBottom: 24, fontSize: 13, color: C.primary, fontWeight: 600 }}>
        ⚡ <strong>Rule-Based Scheduling aktif</strong> — Task diurutkan otomatis berdasarkan urgensi deadline, tingkat kesulitan, dan estimasi pengerjaan
      </div>

      {/* Filters */}
      <div style={{ background: C.white, borderRadius: 14, padding: 18, marginBottom: 28, boxShadow: cardBoxShadow, display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.textGray, marginBottom: 6, display: 'block' }}>
            📁 Filter Kategori
          </label>
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            style={{
              border: "1.5px solid #E0E4F0", borderRadius: 10, padding: "10px 14px",
              fontSize: 14, color: C.textDark, background: C.white, cursor: 'pointer',
              minWidth: 180, transition
            }}
          >
            <option value="">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.textGray, marginBottom: 6, display: 'block' }}>
            📅 Filter Deadline
          </label>
          <input 
            type="date"
            value={filterDeadline}
            onChange={e => setFilterDeadline(e.target.value)}
            style={{
              border: "1.5px solid #E0E4F0", borderRadius: 10, padding: "10px 14px",
              fontSize: 14, color: C.textDark, background: C.white, cursor: 'pointer', transition
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
              background: 'transparent', color: C.primary, border: `1.5px solid ${C.primary}`,
              borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: 'pointer',
              fontSize: 13, transition
            }}
            onMouseOver={e => e.currentTarget.style.background = C.primaryLight}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            ✕ Clear Filter
          </button>
        )}
      </div>

      {error && <div style={{ color: C.red, marginBottom: 18, fontSize: 14, fontWeight: 600 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
        {columns.map(col => {
          // Filter tasks by status and apply filters
          const colTasks = filteredTasks.filter(t => t.status === col);
          return (
            <div key={col} style={{ background: C.white, borderRadius: 18, padding: 22, boxShadow: cardBoxShadow, transition, minHeight: 420 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: colColors[col] }} />
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{col}</span>
                  <span style={{ background: C.bg, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.textGray }}>
                    {colTasks.length}
                  </span>
                </div>
                {col === "Backlog" && (
                  <button onClick={() => navigate("/tasks/create")} style={{
                    background: C.primaryLight, color: C.primary, border: "none",
                    borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, fontWeight: 800,
                    boxShadow: cardBoxShadow, transition
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "rgba(26, 35, 200, 0.15)"}
                  onMouseOut={e => e.currentTarget.style.background = C.primaryLight}
                  >+</button>
                )}
              </div>
              <div style={{ height: 3, borderRadius: 2, background: colColors[col], marginBottom: 18 }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {colTasks.length === 0 && (
                  <div style={{ textAlign: "center", color: C.textGray, fontSize: 14, padding: "28px 0" }}>
                    Tidak ada task
                  </div>
                )}
                {colTasks.map((task, idx) => {
                  const deadline = new Date(task.deadline);
                  const sisaHari = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
                  const isOverdue = sisaHari < 0 && task.status !== 'Done';

                  return (
                    <div key={task._id}
                      style={{
                        background: isOverdue ? '#FFF0F0' : C.bg,
                        borderRadius: 14, padding: 18,
                        boxShadow: cardBoxShadow,
                        border: isOverdue ? `1.5px solid ${C.red}` : 'none',
                        position: 'relative',
                        transition,
                        cursor: 'pointer',
                      }}
                      onMouseOver={e => e.currentTarget.style.boxShadow = cardHoverShadow}
                      onMouseOut={e => e.currentTarget.style.boxShadow = cardBoxShadow}
                    >
                      {/* Nomor urut prioritas */}
                      {col !== 'Done' && (
                        <div style={{
                          position: 'absolute', top: -10, left: -10,
                          width: 24, height: 24, borderRadius: '50%',
                          background: C.primary, color: '#fff',
                          fontSize: 12, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: cardBoxShadow
                        }}>{idx + 1}</div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <StatusBadge status={task.tingkatKesulitan} />
                          {task.priorityLabel && <PriorityBadge label={task.priorityLabel} />}
                        </div>
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/tasks/edit/${task._id}`); }}
                            style={{
                              background: "transparent", border: "none", cursor: "pointer",
                              padding: 6, borderRadius: 8, transition,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: C.textGray, fontSize: 16
                            }}
                            title="Edit task"
                            onMouseOver={e => e.currentTarget.style.background = "rgba(26, 35, 200, 0.1)"}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            ✏️
                          </button>
                          <select
                            onChange={e => {
                              if (e.target.value === "delete") handleDeleteClick(task._id);
                              else moveTask(task._id, e.target.value);
                            }}
                            value=""
                            style={{
                              border: "none", background: "transparent", cursor: "pointer", fontSize: 16,
                              color: C.textGray, borderRadius: 8, transition,
                              padding: 6, appearance: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 32
                            }}
                            title="Aksi task"
                            onMouseOver={e => e.currentTarget.style.background = "rgba(26, 35, 200, 0.1)"}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <option value="" disabled style={{display:'none'}}>⋮</option>
                            {columns.filter(c => c !== col).map(c => (
                              <option key={c} value={c}>Pindah ke {c}</option>
                            ))}
                            <option value="delete">🗑️ Hapus</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: 15, color: C.textDark, marginBottom: 6 }}>{task.namaTugas}</div>
                      <div style={{ fontSize: 13, color: C.textGray, marginBottom: 10 }}>{task.kategoriTask}</div>

                      <div style={{ fontSize: 12, color: isOverdue ? C.red : C.textGray, fontWeight: 500 }}>
                        📅 {new Date(task.deadline).toLocaleDateString('id-ID')} · ⏱️ {task.estimasiPengerjaan}
                        {isOverdue && <span style={{ marginLeft: 6, fontWeight: 800 }}>⚠️ Terlambat!</span>}
                        {!isOverdue && sisaHari <= 3 && task.status !== 'Done' && (
                          <span style={{ marginLeft: 6, color: C.red, fontWeight: 800 }}>⚠️ {sisaHari} hari lagi</span>
                        )}
                      </div>

                      {/* Priority score */}
                      {task.priorityScore > 0 && col !== 'Done' && (
                        <div style={{ marginTop: 8, fontSize: 11, color: C.textGray }}>
                          Skor prioritas: <strong style={{ color: C.primary }}>{task.priorityScore}</strong>
                        </div>
                      )}

                      {task.status === "Done" && (
                        <div style={{ marginTop: 10 }}><StatusBadge status="Selesai" /></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "40px 32px",
            maxWidth: 400, width: "90%", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)"
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "#FFE8E8", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 40, color: "#FF4757", fontWeight: 700
              }}>?</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1F2937", margin: 0, textAlign: "center" }}>Apakah Anda Yakin?</h2>
              <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 20px 0", textAlign: "center" }}>Data yang dihapus tidak dapat dikembalikan.</p>
              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1, padding: "12px 20px",
                    background: "#E5E7EB", color: "#374151",
                    border: "none", borderRadius: 12,
                    fontSize: 15, fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1, padding: "12px 20px",
                    background: "#FF4757", color: "#fff",
                    border: "none", borderRadius: 12,
                    fontSize: 15, fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccess && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "40px 32px",
            maxWidth: 400, width: "90%", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)"
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "#E0F7F4", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 40, color: "#14B8A6", fontWeight: 700
              }}>✓</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1F2937", margin: 0 }}>Data Berhasil Dihapus</h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
