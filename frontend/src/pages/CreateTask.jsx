import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { C } from '../constants/theme';
import { Card } from '../components/UIComponents';
import { taskAPI, categoryAPI } from '../services/api';
import { X, CheckCircle } from 'lucide-react';

const CreateTask = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [form, setForm] = useState({ namaTugas: "", kategoriTask: "", tingkatKesulitan: "", deadline: "", estimasiPengerjaan: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openDifficultyDropdown, setOpenDifficultyDropdown] = useState(false);
  const [openTimeDropdown, setOpenTimeDropdown] = useState(false);
  const [categories, setCategories] = useState(["IF5100", "IF5200", "IF5300", "Penelitian", "Statistika", "UKM"]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const difficultyRef = useRef(null);
  const timeRef = useRef(null);

  const difficultyOptions = ["Rendah", "Sedang", "Tinggi"];
  const timeOptions = ["1 jam", "2 jam", "3 jam", "4 jam", "5 jam", "6 jam", "8 jam"];

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
      if (difficultyRef.current && !difficultyRef.current.contains(e.target)) {
        setOpenDifficultyDropdown(false);
      }
      if (timeRef.current && !timeRef.current.contains(e.target)) {
        setOpenTimeDropdown(false);
      }
    };
    
    if (openDropdown || openDifficultyDropdown || openTimeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown, openDifficultyDropdown, openTimeDropdown]);

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data || ["IF5100", "IF5200", "IF5300", "Penelitian", "Statistika", "UKM"]);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(["IF5100", "IF5200", "IF5300", "Penelitian", "Statistika", "UKM"]);
    }
  };
  
  const filteredCategories = form.kategoriTask === '' 
    ? categories 
    : categories.filter(cat => 
        cat.toLowerCase().includes(form.kategoriTask.toLowerCase())
      );
  
  // Check if current input could be a new category
  const isNewCategory = form.kategoriTask.trim() !== '' && !categories.some(cat => cat.toLowerCase() === form.kategoriTask.toLowerCase());

  const inputStyle = {
    border: "1.5px solid #E0E4F0", borderRadius: 12, padding: "20px 24px",
    fontSize: 17, width: "100%", outline: "none", color: C.textDark,
    background: C.white, boxSizing: "border-box", fontWeight: 500
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
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "clamp(24px, 5vw, 48px) clamp(12px, 4vw, 24px)" }}>
      {/* Header Section */}
      <div style={{ maxWidth: "100%", margin: "0 auto", paddingLeft: "clamp(12px, 3vw, 20px)", paddingRight: "clamp(12px, 3vw, 20px)" }}>
        {/* Info Banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(26, 35, 200, 0.05) 0%, rgba(26, 35, 200, 0.02) 100%)",
          border: `1px solid ${C.primaryLight}`,
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: "clamp(20px, 3vw, 32px)",
          display: "flex",
          alignItems: "flex-start",
          gap: 12
        }}>
          <div style={{ fontSize: 20, marginTop: 2 }}>📋</div>
          <div>
            <p style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 600, color: C.primary }}>Isi form dengan lengkap</p>
            <p style={{ margin: 0, fontSize: 13, color: C.textGray }}>Semakin detail informasi tugas, semakin akurat perhitungan prioritasnya</p>
          </div>
        </div>

        <Card style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)", borderRadius: 16 }}>
          <div style={{ padding: "clamp(24px, 4vw, 48px) clamp(16px, 4vw, 48px)", overflow: "visible" }}>
            
            {/* Section 1: Informasi Dasar */}
            <div style={{ marginBottom: "clamp(32px, 5vw, 52px)", overflow: "visible" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: "clamp(16px, 3vw, 28px)"
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: C.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.primary
                }}>1</div>
                <h2 style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: 700, color: C.textDark, margin: 0 }}>Informasi Dasar</h2>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(16px, 3vw, 24px)", overflow: "visible" }}>
                <div>
                  <label style={{ fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 700, color: C.textDark, marginBottom: "clamp(8px, 1.5vw, 12px)", display: "block" }}>Nama Tugas <span style={{ color: C.red }}>*</span></label>
                  <input 
                    value={form.namaTugas} 
                    onChange={e => setForm({ ...form, namaTugas: e.target.value })}
                    placeholder="Misalnya: Membuat API untuk login" 
                    style={{
                      ...inputStyle,
                      padding: "clamp(12px, 2vw, 18px) clamp(16px, 2vw, 24px)",
                      fontSize: "clamp(14px, 2.5vw, 16px)",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
                    }} 
                    onFocus={(e) => {
                      e.target.style.borderColor = C.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${C.primaryLight}, 0 1px 2px rgba(0, 0, 0, 0.04)`;
                      e.target.style.background = C.white;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E5E8F0";
                      e.target.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)";
                      e.target.style.background = "#FAFBFD";
                    }}
                  />
                  <p style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: C.textGray, marginTop: "clamp(6px, 1vw, 8px)", margin: "clamp(6px, 1vw, 8px) 0 0 0" }}>Bersifat spesifik dan terukur</p>
                </div>
                
                <div>
                  <label style={{ fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 700, color: C.textDark, marginBottom: "clamp(8px, 1.5vw, 12px)", display: "block" }}>Kategori Tugas <span style={{ color: C.red }}>*</span></label>
                  <div style={{ position: 'relative', zIndex: 9999 }} ref={dropdownRef}>
                    <input 
                      value={form.kategoriTask} 
                      onChange={e => setForm({ ...form, kategoriTask: e.target.value })}
                      onFocus={(e) => {
                        setOpenDropdown(true);
                        e.currentTarget.style.borderColor = "#29B6F6";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(41, 182, 246, 0.2)";
                        e.currentTarget.style.backgroundColor = C.white;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#E5E8F0";
                        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)";
                        e.currentTarget.style.backgroundColor = "#FAFBFD";
                      }}
                      placeholder="Pilih atau buat kategori" 
                      style={{
                        border: "2px solid #E5E8F0", borderRadius: 16, padding: "clamp(12px, 2vw, 18px) clamp(16px, 2vw, 24px)",
                        fontSize: "clamp(14px, 2.5vw, 16px)", width: "100%", outline: "none", color: C.textDark,
                        backgroundColor: "#FAFBFD", boxSizing: "border-box", fontWeight: 500,
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)", transition: "all 0.3s ease",
                        cursor: "text",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238A94A6' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                        backgroundSize: "12px 12px",
                        paddingRight: "clamp(28px, 4vw, 36px)"
                      }} 
                    />
                    
                    {openDropdown && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: 8,
                          background: C.white,
                          border: `2px solid #29B6F6`,
                          borderRadius: 16,
                          boxShadow: '0 4px 12px rgba(41, 182, 246, 0.2)',
                          zIndex: 9999,
                          maxHeight: 280,
                          overflowY: 'auto',
                          minWidth: '100%'
                        }}>
                        {/* Show matching categories */}
                        {filteredCategories.map(cat => (
                          <div
                            key={cat}
                            onMouseDown={() => {
                              setForm({ ...form, kategoriTask: cat });
                              setOpenDropdown(false);
                            }}
                            style={{
                              padding: '14px 16px',
                              cursor: 'pointer',
                              borderBottom: `1px solid #F5F6FA`,
                              fontSize: 14,
                              transition: "all 0.15s ease",
                              fontWeight: 500,
                              color: C.textDark
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#E1F5FE";
                              e.currentTarget.style.color = "#29B6F6";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = C.textDark;
                            }}
                          >
                            {cat}
                          </div>
                        ))}
                        
                        {/* Show create new category option if text doesn't match existing */}
                        {isNewCategory && (
                          <div
                            onMouseDown={() => {
                              const newCategory = form.kategoriTask.trim();
                              setForm({ ...form, kategoriTask: newCategory });
                              if (!categories.includes(newCategory)) {
                                setCategories([...categories, newCategory]);
                              }
                              setOpenDropdown(false);
                            }}
                            style={{
                              padding: '14px 16px',
                              cursor: 'pointer',
                              borderTop: `1px solid #E5E8F0`,
                              fontSize: 14,
                              fontWeight: 600,
                              background: C.primaryLight,
                              color: C.primary,
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = C.primary;
                              e.currentTarget.style.color = C.white;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = C.primaryLight;
                              e.currentTarget.style.color = C.primary;
                            }}
                          >
                            + Buat kategori baru: "{form.kategoriTask}"
                          </div>
                        )}
                        
                        {/* Show message if nothing to display */}
                        {filteredCategories.length === 0 && !isNewCategory && (
                          <div style={{ padding: '16px', color: C.textGray, fontSize: 13, textAlign: "center" }}>
                            Tidak ada kategori yang cocok
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: C.textGray, marginTop: 8, margin: "8px 0 0 0" }}>Kelompokkan tugas sejenis dengan kategori</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#E5E8F0", marginBottom: 52 }}></div>

            {/* Section 2: Detail Pengerjaan */}
            <div style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: "clamp(16px, 3vw, 28px)"
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: C.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.primary
                }}>2</div>
                <h2 style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: 700, color: C.textDark, margin: 0 }}>Detail Pengerjaan</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "clamp(16px, 2vw, 24px)" }}>
                <div ref={difficultyRef} style={{ position: 'relative' }}>
                  <label style={{ fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 700, color: C.textDark, marginBottom: "clamp(8px, 1.5vw, 12px)", display: "block" }}>Tingkat Kesulitan <span style={{ color: C.red }}>*</span></label>
                  <div
                    onClick={() => setOpenDifficultyDropdown(!openDifficultyDropdown)}
                    style={{
                      border: "2px solid #E5E8F0", borderRadius: 20, padding: "clamp(12px, 2vw, 18px) clamp(16px, 2vw, 24px)",
                      fontSize: "clamp(14px, 2.5vw, 17px)", width: "100%", outline: "none", color: form.tingkatKesulitan ? C.textDark : "#999",
                      background: C.white, boxSizing: "border-box", fontWeight: 500,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)", transition: "all 0.3s ease",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onMouseEnter={(e) => {
                      if (!openDifficultyDropdown) {
                        e.currentTarget.style.borderColor = "#B0B8C0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!openDifficultyDropdown) {
                        e.currentTarget.style.borderColor = "#E5E8F0";
                      }
                    }}
                  >
                    <span>{form.tingkatKesulitan || "Pilih tingkat kesulitan"}</span>
                    <span style={{transform: openDifficultyDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease"}}>▼</span>
                  </div>
                  {openDifficultyDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 8,
                      background: C.white,
                      border: "2px solid #29B6F6",
                      borderRadius: 20,
                      boxShadow: "0 8px 20px rgba(41, 182, 246, 0.15)",
                      zIndex: 1000,
                      overflow: "hidden"
                    }}>
                      {difficultyOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setForm({ ...form, tingkatKesulitan: option });
                            setOpenDifficultyDropdown(false);
                          }}
                          style={{
                            padding: "14px 24px",
                            cursor: "pointer",
                            borderBottom: "1px solid #F0F0F0",
                            fontSize: 16,
                            transition: "all 0.15s ease",
                            background: form.tingkatKesulitan === option ? "#E1F5FE" : "transparent",
                            color: form.tingkatKesulitan === option ? "#29B6F6" : C.textDark,
                            fontWeight: form.tingkatKesulitan === option ? 600 : 500
                          }}
                          onMouseEnter={(e) => {
                            if (form.tingkatKesulitan !== option) {
                              e.currentTarget.style.background = "#F9F9F9";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (form.tingkatKesulitan !== option) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: C.textGray, marginTop: "clamp(6px, 1vw, 8px)", margin: "clamp(6px, 1vw, 8px) 0 0 0" }}>Berpengaruh pada prioritas</p>
                </div>

                <div>
                  <label style={{ fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 700, color: C.textDark, marginBottom: "clamp(8px, 1.5vw, 12px)", display: "block" }}>Tenggat Waktu <span style={{ color: C.red }}>*</span></label>
                  <input 
                    type="date" 
                    value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })} 
                    style={{
                      ...inputStyle,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                      cursor: "pointer"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primaryLight}, 0 1px 2px rgba(0, 0, 0, 0.04)`;
                      e.currentTarget.style.background = C.white;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#E5E8F0";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)";
                      e.currentTarget.style.background = "#FAFBFD";
                    }}
                  />
                  <p style={{ fontSize: 12, color: C.textGray, marginTop: 8, margin: "8px 0 0 0" }}>Kapan deadline tugas</p>
                </div>

                <div ref={timeRef} style={{ position: 'relative' }}>
                  <label style={{ fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 700, color: C.textDark, marginBottom: "clamp(8px, 1.5vw, 12px)", display: "block" }}>Estimasi Waktu <span style={{ color: C.red }}>*</span></label>
                  <div
                    onClick={() => setOpenTimeDropdown(!openTimeDropdown)}
                    style={{
                      border: "2px solid #E5E8F0", borderRadius: 20, padding: "18px 24px",
                      fontSize: 17, width: "100%", outline: "none", color: form.estimasiPengerjaan ? C.textDark : "#999",
                      background: C.white, boxSizing: "border-box", fontWeight: 500,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)", transition: "all 0.3s ease",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onMouseEnter={(e) => {
                      if (!openTimeDropdown) {
                        e.currentTarget.style.borderColor = "#B0B8C0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!openTimeDropdown) {
                        e.currentTarget.style.borderColor = "#E5E8F0";
                      }
                    }}
                  >
                    <span>{form.estimasiPengerjaan || "Pilih estimasi waktu"}</span>
                    <span style={{transform: openTimeDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease"}}>▼</span>
                  </div>
                  {openTimeDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 8,
                      background: C.white,
                      border: "2px solid #29B6F6",
                      borderRadius: 20,
                      boxShadow: "0 8px 20px rgba(41, 182, 246, 0.15)",
                      zIndex: 1000,
                      maxHeight: 300,
                      overflowY: "auto"
                    }}>
                      {timeOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setForm({ ...form, estimasiPengerjaan: option });
                            setOpenTimeDropdown(false);
                          }}
                          style={{
                            padding: "14px 24px",
                            cursor: "pointer",
                            borderBottom: "1px solid #F0F0F0",
                            fontSize: 16,
                            transition: "all 0.15s ease",
                            background: form.estimasiPengerjaan === option ? "#E1F5FE" : "transparent",
                            color: form.estimasiPengerjaan === option ? "#29B6F6" : C.textDark,
                            fontWeight: form.estimasiPengerjaan === option ? 600 : 500
                          }}
                          onMouseEnter={(e) => {
                            if (form.estimasiPengerjaan !== option) {
                              e.currentTarget.style.background = "#F9F9F9";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (form.estimasiPengerjaan !== option) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: C.textGray, marginTop: 8, margin: "8px 0 0 0" }}>Berapa lama pengerjaan</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ 
                color: "#B91C1C", 
                fontSize: 14, 
                marginBottom: 28,
                background: "#FEE2E2", 
                padding: "14px 16px", 
                borderRadius: 10,
                border: `1px solid #FECACA`,
                fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 40, paddingTop: 28, borderTop: "1px solid #E5E8F0" }}>
              <button 
                onClick={() => navigate("/tasks")} 
                style={{
                  background: "transparent", 
                  color: C.textGray,
                  border: `1px solid #E5E8F0`, 
                  borderRadius: 10,
                  padding: "16px 40px", 
                  fontWeight: 600, 
                  cursor: "pointer", 
                  fontSize: 15,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.textGray;
                  e.currentTarget.style.background = "#F5F6FA";
                  e.currentTarget.style.color = C.textDark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E8F0";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.textGray;
                }}
              >
                Batal
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading} 
                style={{
                  background: loading ? "#818CF8" : C.primary, 
                  color: "#fff", 
                  border: "none",
                  borderRadius: 10, 
                  padding: "16px 40px",
                  fontWeight: 700, 
                  cursor: loading ? "not-allowed" : "pointer", 
                  fontSize: 15,
                  transition: "all 0.2s ease",
                  boxShadow: loading ? "0 2px 6px rgba(26, 35, 200, 0.15)" : "0 4px 12px rgba(26, 35, 200, 0.25)"
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(26, 35, 200, 0.35)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 35, 200, 0.25)";
                  }
                }}
              >
                {loading ? "Menyimpan..." : "Buat Tugas"}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 10000,
          animation: "fadeIn 0.3s ease"
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: "40px 36px",
            maxWidth: 400, width: "90%", boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
            animation: "slideUp 0.4s ease", position: "relative"
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none",
                cursor: "pointer", color: C.textGray,
                padding: 0, width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.textDark}
              onMouseLeave={(e) => e.currentTarget.style.color = C.textGray}
            >
              <X size={24} />
            </button>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              {/* Success Icon */}
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: C.primaryLight, display: "flex",
                alignItems: "center", justifyContent: "center",
                color: C.primary, fontWeight: 700,
                animation: "scaleIn 0.5s ease"
              }}>
                <CheckCircle size={40} fill={C.primary} color={C.primaryLight} />
              </div>
              
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textDark, margin: "0 0 6px 0" }}>Tugas Berhasil Dibuat</h2>
                <p style={{ fontSize: 13, color: C.textGray, margin: 0 }}>Tugas Anda telah ditambahkan ke daftar</p>
              </div>
              
              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setForm({ namaTugas: "", kategoriTask: "", tingkatKesulitan: "", deadline: "", estimasiPengerjaan: "" });
                  }}
                  style={{
                    flex: 1, padding: "12px 20px",
                    background: "#F5F6FA", color: C.primary,
                    border: `1.5px solid #E5E8F0`, borderRadius: 8,
                    fontSize: 14, fontWeight: 600,
                    cursor: "pointer", marginTop: 4,
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.primaryLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F5F6FA";
                  }}
                >
                  Buat Tugas Lagi
                </button>
                
                <button
                  onClick={() => navigate("/tasks")}
                  style={{
                    flex: 1, padding: "12px 20px",
                    background: C.primary, color: "#fff",
                    border: "none", borderRadius: 8,
                    fontSize: 14, fontWeight: 600,
                    cursor: "pointer", marginTop: 4,
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(26, 35, 200, 0.2)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(26, 35, 200, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(26, 35, 200, 0.2)";
                  }}
                >
                  Lihat Daftar Tugas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CreateTask;
