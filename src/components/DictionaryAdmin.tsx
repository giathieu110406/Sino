import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Save, X, Plus } from 'lucide-react';
import { DictItem } from '../types';

export function DictionaryAdmin() {
  const [entries, setEntries] = useState<DictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DictItem>>({});
  const [error, setError] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dict/list');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi máy chủ (${res.status})`);
      }
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch entries error:", err);
      setError(err.message || 'Không thể tải danh sách từ vựng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleEdit = (item: DictItem) => {
    setEditingWord(item.word);
    setEditForm({ ...item });
  };

  const handleDelete = async (word: string) => {
    if (!confirm(`Bạn có chắc muốn xóa từ "${word}"?`)) return;
    try {
      const res = await fetch('/api/dict/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      if (res.ok) {
        setEntries(entries.filter((e) => e.word !== word));
      } else {
        const errorData = await res.json();
        alert(`Lỗi: ${errorData.error}`);
      }
    } catch (err) {
      alert('Lỗi kết nối khi xóa từ.');
    }
  };

  const handleSave = async () => {
    if (!editForm.word || !editForm.meaning) {
      alert("Vui lòng nhập đầy đủ Từ và Nghĩa.");
      return;
    }
    
    try {
      const res = await fetch('/api/dict/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingWord(null);
        fetchEntries(); // reload
      } else {
        const errorData = await res.json();
        alert(`Lỗi: ${errorData.error}`);
      }
    } catch (err) {
      alert('Lỗi kết nối khi lưu từ.');
    }
  };

  const handleAddNew = () => {
    const newWord = prompt("Nhập từ tiếng Trung mới:");
    if (newWord) {
      if (entries.find(e => e.word === newWord)) {
        alert("Từ này đã tồn tại trong từ điển!");
        return;
      }
      setEditingWord(newWord);
      setEditForm({
        word: newWord,
        pinyin: '',
        meaning: '',
        type: 'Từ vựng',
        examples: []
      });
    }
  };

  return (
    <div className="dict-card" style={{ textAlign: 'left', marginBottom: '16px' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">Quản Lý Cơ Sở Dữ Liệu Từ Điển</h2>
        <button
          onClick={handleAddNew}
          className="add-deck-btn"
        >
          <Plus size={16} /> Thêm Từ Mới
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginBottom: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          <span>{error}</span>
          <button 
            onClick={fetchEntries} 
            style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center p-8 text-slate-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="overflow-x-auto w-full">
          <div className="desktop-only overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-solid)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 8px' }}>Từ (Word)</th>
                  <th style={{ padding: '12px 8px' }}>Pinyin</th>
                  <th style={{ padding: '12px 8px' }}>Nghĩa (Meaning)</th>
                  <th style={{ padding: '12px 8px' }}>Từ Loại</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {/* Form specifically for new item if it's not in the list yet */}
                {editingWord && !entries.find(e => e.word === editingWord) && (
                  <tr style={{ borderBottom: '1px solid var(--border-solid)', background: 'rgba(236, 72, 153, 0.08)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {editForm.word}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <input 
                        type="text" 
                        style={{ padding: '8px', border: '1px solid var(--border-solid)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', width: '100%' }}
                        value={editForm.pinyin || ''}
                        onChange={e => setEditForm({...editForm, pinyin: e.target.value})}
                        placeholder="Pinyin"
                      />
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <input 
                        type="text" 
                        style={{ padding: '8px', border: '1px solid var(--border-solid)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', width: '100%' }}
                        value={editForm.meaning || ''}
                        onChange={e => setEditForm({...editForm, meaning: e.target.value})}
                        placeholder="Nghĩa"
                      />
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <input 
                        type="text" 
                        style={{ padding: '8px', border: '1px solid var(--border-solid)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', width: '100%' }}
                        value={editForm.type || ''}
                        onChange={e => setEditForm({...editForm, type: e.target.value})}
                        placeholder="Từ loại"
                      />
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={handleSave} className="icon-action-btn study-btn"><Save size={16}/></button>
                        <button onClick={() => setEditingWord(null)} className="icon-action-btn delete-btn"><X size={16}/></button>
                      </div>
                    </td>
                  </tr>
                )}

                {entries.map((item) => (
                  <tr key={item.word} style={{ borderBottom: '1px solid var(--border-solid)' }}>
                    {editingWord === item.word ? (
                      <>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{item.word}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <input 
                            type="text" 
                            style={{ padding: '8px', border: '1px solid var(--border-solid)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', width: '100%' }}
                            value={editForm.pinyin || ''}
                            onChange={e => setEditForm({...editForm, pinyin: e.target.value})}
                          />
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <input 
                            type="text" 
                            style={{ padding: '8px', border: '1px solid var(--border-solid)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', width: '100%' }}
                            value={editForm.meaning || ''}
                            onChange={e => setEditForm({...editForm, meaning: e.target.value})}
                          />
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <input 
                            type="text" 
                            style={{ padding: '8px', border: '1px solid var(--border-solid)', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', width: '100%' }}
                            value={editForm.type || ''}
                            onChange={e => setEditForm({...editForm, type: e.target.value})}
                          />
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={handleSave} className="icon-action-btn study-btn"><Save size={16}/></button>
                            <button onClick={() => setEditingWord(null)} className="icon-action-btn delete-btn"><X size={16}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px 8px', fontWeight: 'bold', fontSize: '18px' }}>{item.word}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{item.pinyin}</td>
                        <td style={{ padding: '12px 8px' }}>{item.meaning}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className="badge" style={{ backgroundColor: 'rgba(236, 72, 153, 0.12)', color: 'var(--color-primary)' }}>{item.type || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => handleEdit(item)} className="icon-action-btn"><Pencil size={16}/></button>
                            <button onClick={() => handleDelete(item.word)} className="icon-action-btn delete-btn"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="mobile-only flex flex-col gap-4">
            {editingWord && !entries.find(e => e.word === editingWord) && (
              <div className="bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col gap-3">
                <div className="font-bold text-lg text-[var(--text-primary)]">{editForm.word}</div>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]"
                  value={editForm.pinyin || ''}
                  onChange={e => setEditForm({...editForm, pinyin: e.target.value})}
                  placeholder="Pinyin"
                />
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]"
                  value={editForm.meaning || ''}
                  onChange={e => setEditForm({...editForm, meaning: e.target.value})}
                  placeholder="Nghĩa"
                />
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]"
                  value={editForm.type || ''}
                  onChange={e => setEditForm({...editForm, type: e.target.value})}
                  placeholder="Từ loại"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={handleSave} className="flex-1 flex justify-center items-center gap-1 p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 rounded-lg font-semibold"><Save className="w-4 h-4"/> Lưu</button>
                  <button onClick={() => setEditingWord(null)} className="flex-1 flex justify-center items-center gap-1 p-2 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg"><X className="w-4 h-4"/> Hủy</button>
                </div>
              </div>
            )}

            {entries.map((item) => (
              <div key={item.word} className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col gap-3">
                {editingWord === item.word ? (
                  <>
                    <div className="font-bold text-lg text-[var(--text-primary)]">{item.word}</div>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-lg bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)]"
                      value={editForm.pinyin || ''}
                      onChange={e => setEditForm({...editForm, pinyin: e.target.value})}
                      placeholder="Pinyin"
                    />
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-lg bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)]"
                      value={editForm.meaning || ''}
                      onChange={e => setEditForm({...editForm, meaning: e.target.value})}
                      placeholder="Nghĩa"
                    />
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-lg bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)]"
                      value={editForm.type || ''}
                      onChange={e => setEditForm({...editForm, type: e.target.value})}
                      placeholder="Từ loại"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={handleSave} className="flex-1 flex justify-center items-center gap-1 p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 rounded-lg font-semibold"><Save className="w-4 h-4"/> Lưu</button>
                      <button onClick={() => setEditingWord(null)} className="flex-1 flex justify-center items-center gap-1 p-2 bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg"><X className="w-4 h-4"/> Hủy</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-xl text-[var(--text-primary)]">{item.word}</div>
                        <div className="text-sm text-[var(--color-secondary)]">{item.pinyin}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-[rgba(236,72,153,0.12)] text-[var(--color-primary)] rounded-full text-xs font-semibold">{item.type || 'N/A'}</span>
                    </div>
                    <div className="text-[var(--text-primary)] mt-1">{item.meaning}</div>
                    <div className="flex justify-end gap-2 mt-2 border-t border-[var(--border-color)] pt-3">
                      <button onClick={() => handleEdit(item)} className="p-2 text-[var(--color-primary)] bg-[rgba(236,72,153,0.1)] hover:bg-[rgba(236,72,153,0.2)] rounded-lg transition-colors"><Pencil className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(item.word)} className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {entries.length === 0 && !editingWord && (
            <div className="text-center p-8 text-slate-500">
              Database hiện tại đang trống. Hãy tra cứu từ hoặc tự thêm thủ công.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
