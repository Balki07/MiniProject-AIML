// src/pages/PostAdPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload, X, Shield } from 'lucide-react';

const CATEGORIES = ['Jobs', 'Services', 'Business', 'Events', 'Real Estate', 'Other'];

const PostAdPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);

      const { data } = await api.post('/ads', fd);
      setResult(data.verification);

      if (data.verification.status === 'approved') {
        toast.success('🎉 Ad auto-approved and is now live!');
      } else if (data.verification.status === 'rejected') {
        toast.error('Ad was rejected. See feedback below.');
      } else {
        toast('Ad submitted for admin review ⏳', { icon: '📋' });
      }
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const colors = {
      approved: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
      pending:  { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400' },
      rejected: { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400' },
    };
    const c = colors[result.status];

    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-10 max-w-lg w-full text-center">
          <div className="text-6xl mb-6">
            {result.status === 'approved' ? '🎉' : result.status === 'rejected' ? '❌' : '⏳'}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 capitalize">{result.status}</h2>
          <p className="text-white/60 mb-6">{result.message}</p>

          {/* Trust score bar */}
          <div className={`rounded-xl p-4 mb-6 border ${c.bg} ${c.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white/70">Trust Score</span>
              <span className={`text-2xl font-black ${c.text}`}>{result.trust_score}<span className="text-sm">/100</span></span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-700 ${result.status === 'approved' ? 'bg-emerald-500' : result.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${result.trust_score}%` }} />
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => { setResult(null); setForm({ title:'',description:'',category:'',location:'' }); setImage(null); setPreview(null); }} className="btn-secondary">Post Another</button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">Post Your Ad</h1>
            <p className="text-white/50 flex items-center justify-center gap-1.5">
              <Shield size={14} className="text-brand-400" /> Our engine will verify it instantly
            </p>
          </div>

          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Title <span className="text-red-400">*</span></label>
                <input type="text" className="input-field" placeholder="e.g. Expert Plumbing Services in Pondicherry" value={form.title} onChange={set('title')} required maxLength={200} />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Description <span className="text-red-400">*</span></label>
                <textarea className="input-field min-h-32 resize-none" placeholder="Describe your service, product, or opportunity in detail (be specific and honest)..." value={form.description} onChange={set('description')} required />
                <p className="text-xs text-white/30 mt-1">Longer, detailed descriptions improve your trust score.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Category <span className="text-red-400">*</span></label>
                  <select className="input-field" value={form.category} onChange={set('category')} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Location</label>
                  <input type="text" className="input-field" placeholder="e.g. Pondicherry" value={form.location} onChange={set('location')} />
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Image <span className="text-white/30">(optional, improves trust score)</span></label>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    <button type="button" onClick={() => { setImage(null); setPreview(null); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors">
                    <Upload size={22} className="text-white/30 mb-2" />
                    <span className="text-white/40 text-sm">Click to upload (JPEG/PNG/WebP, max 5MB)</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImage} />
                  </label>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Running verification...' : '🚀 Submit Ad for Verification'}
              </button>
            </form>
          </div>

          {/* Trust score info */}
          <div className="mt-6 glass-card p-5">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">How to get a high trust score</p>
            <ul className="space-y-1.5 text-sm text-white/50">
              {['Write a detailed description (150+ chars)', 'Add a clear, relevant image', 'Specify your location', 'Avoid promotional exaggerations', 'Build a clean submission history'].map((tip, i) => (
                <li key={i} className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {tip}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PostAdPage;
