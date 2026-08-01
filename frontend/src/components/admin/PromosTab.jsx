import { useState, useEffect } from 'react';
import { getPromos, createPromo, updatePromo, deletePromo, getProducts, getCategories } from '../../services/api';
import { Tag, Plus, Trash2, Edit, AlertTriangle, CheckCircle, Percent, Banknote, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function PromosTab() {
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '', type: 'PERCENTAGE', value: '', appliesTo: 'ALL', targetId: '', maxUses: '', startDate: '', endDate: '', isActive: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resPromos, resProds, resCats] = await Promise.all([
        getPromos(), getProducts(), getCategories()
      ]);
      setPromos(resPromos.data.data);
      setProducts(resProds.data.data);
      setCategories(resCats.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!formData.code || !formData.value) return;
      await createPromo(formData);
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save promo');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (promo) => {
    try {
      await updatePromo(promo.id, { isActive: !promo.isActive });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await deletePromo(id);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => setFormData({ code: '', type: 'PERCENTAGE', value: '', appliesTo: 'ALL', targetId: '', maxUses: '', startDate: '', endDate: '', isActive: true });

  const getTargetName = (promo) => {
    if (promo.appliesTo === 'ALL') return 'Entire Order';
    if (promo.appliesTo === 'PRODUCT') {
      const p = products.find(prod => prod.id === promo.targetId);
      return p ? `Product: ${p.name}` : 'Unknown Product';
    }
    if (promo.appliesTo === 'CATEGORY') {
      const c = categories.find(cat => cat.id === promo.targetId);
      return c ? `Category: ${c.name}` : 'Unknown Category';
    }
    return '';
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading promos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            Promo Codes & Discounts
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage active discounts for your customers.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-xs tracking-wider uppercase flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Promo
        </button>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
            <tr className="bg-slate-800/50 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              <th className="p-5">Code</th>
              <th className="p-5">Value</th>
              <th className="p-5">Applies To</th>
              <th className="p-5">Usage</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {promos.map(promo => (
              <tr key={promo.id} className="hover:bg-white/5 transition-colors">
                <td className="p-5">
                  <span className="bg-slate-800 text-indigo-400 font-black px-3 py-1.5 rounded-lg border border-indigo-500/20">{promo.code}</span>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2 font-bold text-white">
                    {promo.type === 'PERCENTAGE' ? <Percent className="w-4 h-4 text-emerald-400 text-xs" /> : <Banknote className="w-4 h-4 text-emerald-400 text-xs" />}
                    {promo.type === 'PERCENTAGE' ? `${promo.value}%` : formatCurrency(promo.value)}
                  </div>
                </td>
                <td className="p-5">
                  <p className="font-medium text-slate-300 text-xs">{getTargetName(promo)}</p>
                </td>
                <td className="p-5">
                  <p className="text-xs font-bold text-white tracking-widest">{promo.currentUses} <span className="text-slate-500 font-medium">/ {promo.maxUses || '∞'}</span></p>
                </td>
                <td className="p-5">
                  <button onClick={() => toggleStatus(promo)} className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${promo.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'} transition-all`}>
                    {promo.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-5 text-right">
                  <button onClick={() => handleDelete(promo.id)} className="p-2 bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4 text-xs" />
                  </button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan="6" className="p-10 text-center text-slate-500 font-medium text-sm">No promo codes found.</td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto hidden-scrollbar">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-scale-in my-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6 flex items-center gap-2"><Tag className="w-5 h-5 text-indigo-500" /> Promo</h3>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Promo Code</label>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none uppercase font-bold"
                      placeholder="e.g. SUMMER20"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Discount Type</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none font-bold"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₱)</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Value</label>
                    <input 
                      type="number" required min="1" step="any"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none font-bold"
                      placeholder={formData.type === 'PERCENTAGE' ? "e.g. 20" : "e.g. 150"}
                      value={formData.value}
                      onChange={e => setFormData({...formData, value: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Applies To</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none font-bold mb-2"
                    value={formData.appliesTo}
                    onChange={e => setFormData({...formData, appliesTo: e.target.value, targetId: ''})}
                  >
                    <option value="ALL">Entire Order</option>
                    <option value="PRODUCT">Specific Product</option>
                    <option value="CATEGORY">Specific Category</option>
                  </select>

                  {formData.appliesTo === 'PRODUCT' && (
                    <select required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none"
                      value={formData.targetId}
                      onChange={e => setFormData({...formData, targetId: e.target.value})}
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  {formData.appliesTo === 'CATEGORY' && (
                    <select required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none"
                      value={formData.targetId}
                      onChange={e => setFormData({...formData, targetId: e.target.value})}
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Max Uses (Optional)</label>
                  <input 
                    type="number" min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none"
                    placeholder="Leave blank for unlimited"
                    value={formData.maxUses}
                    onChange={e => setFormData({...formData, maxUses: e.target.value})}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">End Date</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:border-indigo-500 outline-none"
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl hover:shadow-indigo-500/25 text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Deploy Promo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
