import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { C } from '../constants/theme';
import { Card } from '../components/UIComponents';
import { taskAPI, categoryAPI } from '../services/api';

const CreateTask = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ namaTugas: "", kategoriTask: "", tingkatKesulitan: "", deadline: "", estimasiPengerjaan: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data || ["IF5100", "IF5200", "IF5300", "Penelitian", "Statistika", "UKM"]);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(["IF5100", "IF5200", "IF5300", "Penelitian", "Statistika", "UKM"]);
    }
  };
  
  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(form.kategoriTask.toLowerCase())
  );

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
      setError("Semua field harus diisi!"); return;
    }
    
    setLoading(true); 
    setError('');
    try {
      // If kategori baru, tambahkan ke database dulu
      await handleAddNewCategory(form.kategoriTask);

      // Parse estimasi pengerjaan - extract number from "X jam"
      const estimasiNum = form.estimasiPengerjaan.split(' ')[0];
      const payload = {
        ...form,
        estimasiPengerjaan: estimasiNum
      };
      await taskAPI.create(payload);
      // Show success modal instead of direct redirect
      setShowSuccessModal(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Gagal membuat task');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Buat Tugas</div>
      <div style={{ fontSize: 15, color: C.textGray, marginBottom: 32 }}>
        ⚡ Prioritas tugas akan dihitung otomatis berdasarkan deadline, tingkat kesulitan, dan estimasi pengerjaan
      </div>
      <Card style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Nama Tugas</div>
            <input value={form.namaTugas} onChange={e => setForm({ ...form, namaTugas: e.target.value })}
              placeholder="Input nama tugas" style={inputStyle} />
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
            <select value={form.tingkatKesulitan} onChange={e => setForm({ ...form, tingkatKesulitan: e.target.value })} style={inputStyle}>
              <option value="">Pilih tingkat kesulitan</option>
              <option>Rendah</option><option>Sedang</option><option>Tinggi</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Tenggat</div>
              <input type="date" value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Estimasi Pengerjaan</div>
              <select value={form.estimasiPengerjaan} onChange={e => setForm({ ...form, estimasiPengerjaan: e.target.value })} style={inputStyle}>
                <option value="">Pilih Estimasi</option>
                <option>1 jam</option><option>2 jam</option><option>3 jam</option>
                <option>4 jam</option><option>5 jam</option><option>6 jam</option><option>8 jam</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div style={{ color: C.red, fontSize: 14, marginTop: 16, background: "#FFE8EC", padding: "12px 16px", borderRadius: 8 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32, gap: 16 }}>
          <button onClick={() => navigate("/tasks")} style={{
            background: "transparent", color: C.textGray,
            border: "1.5px solid #E0E4F0", borderRadius: 12,
            padding: "14px 28px", fontWeight: 700, cursor: "pointer", fontSize: 16
          }}>Batal</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            background: loading ? "#9099E8" : C.primary, color: "#fff", border: "none",
            borderRadius: 12, padding: "14px 36px",
            fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 16
          }}>{loading ? "Menyimpan..." : "Add Task"}</button>
        </div>
      </Card>

      {/* Success Modal */}
      {showSuccessModal && (
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
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1F2937", margin: 0 }}>Data Berhasil Dibuat</h2>
              <button
                onClick={() => navigate("/tasks")}
                style={{
                  width: "100%", padding: "14px 20px",
                  background: "#14B8A6", color: "#fff",
                  border: "none", borderRadius: 12,
                  fontSize: 16, fontWeight: 600,
                  cursor: "pointer", marginTop: 8
                }}
              >
                Oke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTask;
