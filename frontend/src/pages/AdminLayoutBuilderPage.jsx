import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Save, UploadCloud, LayoutGrid, PlusCircle } from 'lucide-react';

const CANVAS_WIDTH = 1120;
const CANVAS_HEIGHT = 2200;
const SNAP = 10;
const MIN_BLOCK_WIDTH = 40;
const MIN_BLOCK_HEIGHT = 40;
const API_ORIGIN = (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_ORIGIN}${imageUrl}`;
};

const AdminLayoutBuilderPage = () => {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('dashboard');
  const [newDeptName, setNewDeptName] = useState('');
  const [approvedAds, setApprovedAds] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [{ data: deptData }, { data: adsData }] = await Promise.all([
          api.get('/admin/layout/departments'),
          api.get('/admin/ads?status=approved&limit=2000'),
        ]);

        const depts = deptData.departments || [];
        setDepartments(depts);
        setDepartment(depts[0]?.slug || 'dashboard');

        setApprovedAds(adsData.ads || []);
      } catch (err) {
        toast.error(err.response?.data?.error || t('layoutBuilder.toast.initFailed'));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!department) return;

    const loadDraft = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/admin/layout/${department}/draft`);
        const mapped = (data.items || []).map((it, idx) => ({
          id: it.id || `draft-${idx}`,
          ad_id: it.ad_id,
          title: it.title,
          image_url: it.image_url,
          x: Number(it.x) || 0,
          y: Number(it.y) || 0,
          width: Number(it.width) || 260,
          height: Number(it.height) || 180,
          z_index: Number(it.z_index) || idx + 1,
          is_visible: it.is_visible !== false,
        }));
        setItems(mapped);
      } catch (err) {
        toast.error(err.response?.data?.error || t('layoutBuilder.toast.loadDraftFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadDraft();
  }, [department]);

  const addAdToCanvas = (ad) => {
    const stagger = (items.length * 30) % 420;

    const newItem = {
      id: `local-${crypto.randomUUID()}`,
      ad_id: ad.id,
      title: ad.title,
      image_url: ad.image_url,
      x: 20 + stagger,
      y: 20 + Math.floor((items.length * 30) / 420) * 30,
      width: 300,
      height: 200,
      z_index: items.length + 1,
      is_visible: true,
    };

    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id, changes) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  };

  const updateItemPosition = (id, x, y) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, x, y } : it)));
  };

  const updateItemSize = (id, width, height, x, y) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, width, height, x, y } : it)));
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        items: items.map((it, idx) => ({
          ad_id: it.ad_id,
          x: Math.round(it.x),
          y: Math.round(it.y),
          width: Math.round(it.width),
          height: Math.round(it.height),
          z_index: idx + 1,
          is_visible: it.is_visible !== false,
        })),
      };

      await api.put(`/admin/layout/${department}/draft`, payload);
      toast.success(t('layoutBuilder.toast.draftSaved'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('layoutBuilder.toast.saveDraftFailed'));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const payload = {
        items: items.map((it, idx) => ({
          ad_id: it.ad_id,
          x: Math.round(it.x),
          y: Math.round(it.y),
          width: Math.round(it.width),
          height: Math.round(it.height),
          z_index: idx + 1,
          is_visible: it.is_visible !== false,
        })),
      };

      await api.post(`/admin/layout/${department}/publish`, payload);
      toast.success(t('layoutBuilder.toast.published'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('layoutBuilder.toast.publishFailed'));
    } finally {
      setPublishing(false);
    }
  };

  if (loading && departments.length === 0) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center text-white/60">
        {t('layoutBuilder.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <LayoutGrid size={24} className="text-brand-300" /> {t('layoutBuilder.title')}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {t('layoutBuilder.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="btn-secondary text-sm">{t('layoutBuilder.preview')}</Link>
            <button onClick={saveDraft} disabled={saving} className="btn-secondary text-sm flex items-center gap-2">
              <Save size={15} /> {saving ? t('layoutBuilder.saving') : t('layoutBuilder.saveDraft')}
            </button>
            <button onClick={publish} disabled={publishing} className="btn-primary text-sm flex items-center gap-2">
              <UploadCloud size={15} /> {publishing ? t('layoutBuilder.publishing') : t('layoutBuilder.publish')}
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="text-white/70 text-sm">{t('layoutBuilder.department')}</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input-field max-w-xs py-2 text-white/80 bg-transparent"
          >
            {departments.map((d) => (
              <option key={d.slug} value={d.slug} className="text-black">
                {d.name}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              placeholder={t('layoutBuilder.newCanvasPlaceholder') || 'New canvas name'}
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="input-field max-w-xs py-2 text-white/80 bg-transparent"
            />
            <button
              type="button"
              onClick={async () => {
                if (!newDeptName || !newDeptName.trim()) return toast.error(t('layoutBuilder.enterName') || 'Enter a name');
                const name = newDeptName.trim();
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50);
                try {
                  const { data } = await api.post('/admin/layout/departments', { name, slug });
                  const deptsRes = await api.get('/admin/layout/departments');
                  setDepartments(deptsRes.data.departments || []);
                  setDepartment(data.department.slug || slug);
                  setNewDeptName('');
                  toast.success(t('layoutBuilder.addedCanvas') || 'Canvas added');
                } catch (err) {
                  toast.error(err.response?.data?.error || t('layoutBuilder.addCanvasFailed') || 'Failed to add canvas');
                }
              }}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <PlusCircle size={14} /> {t('layoutBuilder.add')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[330px_1fr] gap-4">
          <aside className="glass-card p-4 h-[820px] overflow-auto">
            <h2 className="text-white font-bold mb-3">{t('layoutBuilder.approvedAds')}</h2>
            <div className="space-y-3">
              {approvedAds.length === 0 ? (
                <p className="text-white/40 text-sm">{t('layoutBuilder.noMoreAds')}</p>
              ) : (
                approvedAds.map((ad) => (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => addAdToCanvas(ad)}
                    className="w-full text-left p-3 rounded-xl border border-white/10 hover:border-brand-500/40 bg-white/5"
                  >
                    <div className="text-white text-sm font-semibold line-clamp-2">{ad.title}</div>
                    <div className="text-white/40 text-xs mt-1">{ad.category} • {t('layoutBuilder.trust')} {ad.trust_score}</div>
                    <div className="text-brand-300 text-xs mt-2 inline-flex items-center gap-1">
                      <PlusCircle size={12} /> {t('layoutBuilder.addToCanvas')}
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="glass-card p-4 overflow-auto">
            <div
              className="relative bg-slate-950 border border-white/10 rounded-2xl mx-auto"
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            >
              <div className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
                  backgroundSize: `${SNAP}px ${SNAP}px`,
                }}
              />

              {items.map((item) => (
                <Rnd
                  key={item.id}
                  bounds="parent"
                  minWidth={MIN_BLOCK_WIDTH}
                  minHeight={MIN_BLOCK_HEIGHT}
                  size={{ width: item.width, height: item.height }}
                  position={{ x: item.x, y: item.y }}
                  onDrag={(e, d) => updateItemPosition(item.id, d.x, d.y)}
                  onDragStop={(_, d) => updateItemPosition(item.id, d.x, d.y)}
                  onResize={(e, direction, ref, delta, position) => {
                    updateItemSize(
                      item.id,
                      parseInt(ref.style.width, 10),
                      parseInt(ref.style.height, 10),
                      position.x,
                      position.y
                    );
                  }}
                  onResizeStop={(_, __, ref, ___, position) => {
                    updateItemSize(
                      item.id,
                      parseInt(ref.style.width, 10),
                      parseInt(ref.style.height, 10),
                      position.x,
                      position.y
                    );
                  }}
                  dragGrid={[SNAP, SNAP]}
                  resizeGrid={[SNAP, SNAP]}
                  dragHandleClassName="layout-drag-handle"
                  enableResizing={{
                    top: true,
                    right: true,
                    bottom: true,
                    left: true,
                    topRight: true,
                    bottomRight: true,
                    bottomLeft: true,
                    topLeft: true,
                  }}
                  style={{ zIndex: item.z_index }}
                  className="rounded-xl overflow-hidden border border-brand-400/30 bg-black/60 shadow-[0_0_20px_-8px_rgba(139,92,246,0.45)]"
                >
                  <div className="w-full h-full relative group">
                    <div className="layout-drag-handle absolute inset-x-0 top-0 h-8 cursor-move bg-black/20 backdrop-blur-sm z-20 flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.18em] text-white/60">
                      <span>{t('layoutBuilder.dragToMove')}</span>
                      <span>{t('layoutBuilder.dragToResize')}</span>
                    </div>
                    {item.image_url ? (
                      <img
                        src={resolveImageUrl(item.image_url)}
                        alt={item.title}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-xs pointer-events-none">
                        {t('layoutBuilder.noImage')}
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pointer-events-none">
                      <p className="text-white text-xs font-semibold line-clamp-2">{item.title}</p>
                    </div>

                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      aria-label={t('layoutBuilder.remove')}
                      className="absolute top-1.5 right-1.5 z-30 bg-red-500/95 hover:bg-red-500 text-white text-xs rounded px-2 py-1 shadow-lg shadow-black/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      {t('layoutBuilder.remove')}
                    </button>
                  </div>
                </Rnd>
              ))}

              {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-white/35 text-sm">
                  {t('layoutBuilder.emptyCanvas')}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminLayoutBuilderPage;
