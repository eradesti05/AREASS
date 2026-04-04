import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../constants/theme';
import { Card } from '../components/UIComponents';
import { taskAPI, categoryAPI } from '../services/api';

const EditTask = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({ namaTugas: "", kategoriTask: "", tingkatKesulitan: "", deadline: "", estimasiPengerjaan: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState(false);
  const [categories, setCategories] = useState([]);

  const defaultCategories = ["IF5100", "IF5200", "IF5300", "Penelitian", "Statistika", "UKM"];
  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(form.kategoriTask.toLowerCase())
  );

  useEffect(() => {
    fetchCategories();
    fetchTask();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data || ["IF5100", "IF5200", "IF5300", "Penelitian", "Statistika", "UKM"]);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(["IF5100", "IF5200", "IF5300", "Penelitian", "Statistika", "UKM"]);
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getAll();
      const tasks = Array.isArray(response) ? response : (response.data || response.tasks || []);
      const task = tasks.find(t => t._id === id);
      
      if (!task) {
        setError('Task tidak ditemukan');
        return;
      }

      setForm({
        namaTugas: task.namaTugas || '',
        kategoriTask: task.kategoriTask || '',
        tingkatKesulitan: task.tingkatKesulitan || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        estimasiPengerjaan: task.estimasiPengerjaan ? `${task.estimasiPengerjaan} jam` : ''
      });
    } catch (err) {
      setError('Gagal memuat task: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: "1.5px solid #E0E4F0", borderRadius: 12, padding: "16px 20px",
    fontSize: 16, width: "100%", outline: "none", color: C.textDark,
    background: C.white, boxSizing: "border-box"
  };

  const handleAddNewCategory = async (categoryName) => {
    if (!categories.includes(categoryName) && categoryName.trim() !== '') {
      try {
        await categoryAPI.create(categoryName);
        setCategories([...categories, categoryName]);
      } catch (err) {
        console.error('Error adding category:', err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.namaTugas || !form.kategoriTask || !form.tingkatKesulitan || !form.deadline || !form.estimasiPengerjaan) {
      setError("Semua field harus diisi!"); 
      return;
    }
    
    setSaving(true);
    setError('');
    try {
      // If kategori baru, tambahkan ke database dulu
      await handleAddNewCategory(form.kategoriTask);

      // Parse estimasi pengerjaan - extract number from "X jam"
      const estimasiNum = form.estimasiPengerjaan.split(' ')[0];
      const payload = {
        namaTugas: form.namaTugas,
        kategoriTask: form.kategoriTask,
        tingkatKesulitan: form.tingkatKesulitan,
        deadline: form.deadline,
        estimasiPengerjaan: estimasiNum
      };
      await taskAPI.update(id, payload);
      navigate("/tasks");
    } catch (err) {
      setError(err.message || 'Gagal mengupdate task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ color: C.textGray, fontSize: 16 }}>⏳ Memuat task...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Edit Tugas</div>
      <div style={{ fontSize: 15, color: C.textGray, marginBottom: 32 }}>
        ✏️ Ubah detail tugas dan prioritas akan dihitung ulang otomatis
      </div>
      <Card style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Nama Tugas</div>
            <input 
              value={form.namaTugas} 
              onChange={e => setForm({ ...form, namaTugas: e.target.value })}
              placeholder="Input nama tugas" 
              style={inputStyle} 
            />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Kategori Tugas</div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  value={form.kategoriTask} 
                  onChange={e => setForm({ ...form, kategoriTask: e.target.value })}
                  onFocus={() => setOpenDropdown(true)}
                  onBlur={() => setTimeout(() => setOpenDropdown(false), 200)}
                  placeholder="Ketik atau pilih dari dropdown" 
                  style={{...inputStyle, flex: 1}}
                />
                <button
                  type="button"
                  onClick={() => setOpenDropdown(!openDropdown)}
                  style={{
                    background: C.bg, border: "1.5px solid #E0E4F0", borderRadius: 12,
                    padding: "16px 18px", cursor: 'pointer', fontSize: 18, color: C.textGray
                  }}
                >
                  ▼
                </button>
              </div>
              
              {openDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: C.white, border: `1.5px solid ${C.primary}`,
                  borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100
                }}>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => (
                      <div
                        key={cat}
                        onMouseDown={() => {
                          setForm({ ...form, kategoriTask: cat });
                          setOpenDropdown(false);
                        }}
                        style={{
                          padding: '14px 20px', cursor: 'pointer', borderBottom: `1px solid ${C.bg}`, fontSize: 15
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = C.primaryLight}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {cat}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '10px 16px', color: C.textGray, fontSize: 12 }}>
                      Tidak ada kategori yang cocok. Ketik untuk custom.
                    </div>
                  )}
                </div>
              )}
              <div style={{ fontSize: 13, color: C.textGray, marginTop: 10 }}>
                💡 Pilih dari list atau ketik kategori custom (akan otomatis tersimpan)
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Tingkat Kesulitan</div>
            <select 
              value={form.tingkatKesulitan} 
              onChange={e => setForm({ ...form, tingkatKesulitan: e.target.value })} 
              style={inputStyle}
            >
              <option value="">Pilih tingkat kesulitan</option>
              <option>Rendah</option><option>Sedang</option><option>Tinggi</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Tenggat</div>
              <input 
                type="date" 
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })} 
                style={inputStyle} 
              />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Estimasi Pengerjaan</div>
              <select 
                value={form.estimasiPengerjaan} 
                onChange={e => setForm({ ...form, estimasiPengerjaan: e.target.value })} 
                style={inputStyle}
              >
                <option value="">Pilih Estimasi</option>
                <option>1 jam</option><option>2 jam</option><option>3 jam</option>
                <option>4 jam</option><option>5 jam</option><option>6 jam</option><option>8 jam</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div style={{ color: C.red, fontSize: 14, marginTop: 16, background: "#FFE8EC", padding: "12px 16px", borderRadius: 8 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32, gap: 16 }}>
          <button 
            onClick={() => navigate("/tasks")} 
            style={{
              background: "transparent", color: C.textGray,
              border: "1.5px solid #E0E4F0", borderRadius: 12,
              padding: "14px 28px", fontWeight: 700, cursor: "pointer", fontSize: 16
            }}
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            style={{
              background: saving ? "#9099E8" : C.primary, color: "#fff", border: "none",
              borderRadius: 12, padding: "14px 36px",
              fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 16
            }}
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default EditTask;
