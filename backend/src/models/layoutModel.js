const { query } = require('../config/db');

let tablesEnsured = false;

const ensureTables = async () => {
  if (tablesEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS departments (
      slug        VARCHAR(50) PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS department_layouts (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      department_slug  VARCHAR(50) REFERENCES departments(slug) ON DELETE CASCADE,
      status           VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published')),
      created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (department_slug, status)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS department_layout_items (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      layout_id     UUID REFERENCES department_layouts(id) ON DELETE CASCADE,
      ad_id         UUID REFERENCES advertisements(id) ON DELETE CASCADE,
      x             INT NOT NULL DEFAULT 0,
      y             INT NOT NULL DEFAULT 0,
      width         INT NOT NULL DEFAULT 260,
      height        INT NOT NULL DEFAULT 180,
      z_index       INT NOT NULL DEFAULT 1,
      is_visible    BOOLEAN DEFAULT TRUE,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    INSERT INTO departments (slug, name) VALUES
      ('dashboard', 'Dashboard'),
      ('food', 'Food'),
      ('tech', 'Tech'),
      ('jobs', 'Jobs'),
      ('services', 'Services'),
      ('business', 'Business'),
      ('events', 'Events'),
      ('real-estate', 'Real Estate'),
      ('other', 'Other')
    ON CONFLICT (slug) DO NOTHING
  `);

  tablesEnsured = true;
};

const getDepartments = async () => {
  await ensureTables();
  const res = await query('SELECT slug, name FROM departments ORDER BY name ASC');
  return res.rows;
};

const createDepartment = async ({ slug, name }) => {
  await ensureTables();
  const res = await query(
    `INSERT INTO departments (slug, name)
     VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING slug, name`,
    [slug, name]
  );
  return res.rows[0];
};

const getLayoutByDepartment = async ({ departmentSlug, status = 'draft' }) => {
  await ensureTables();

  const layoutRes = await query(
    `SELECT id, department_slug, status, created_by, created_at, updated_at
     FROM department_layouts
     WHERE department_slug = $1 AND status = $2`,
    [departmentSlug, status]
  );

  const layout = layoutRes.rows[0] || null;
  if (!layout) return { layout: null, items: [] };

  const itemsRes = await query(
    `SELECT i.id, i.ad_id, i.x, i.y, i.width, i.height, i.z_index, i.is_visible,
            a.title, a.image_url, a.category, a.status AS ad_status, a.trust_score
     FROM department_layout_items i
     JOIN advertisements a ON a.id = i.ad_id
     WHERE i.layout_id = $1
     ORDER BY i.z_index ASC, i.created_at ASC`,
    [layout.id]
  );

  return { layout, items: itemsRes.rows };
};

const upsertDraftLayout = async ({ departmentSlug, adminId, items }) => {
  await ensureTables();

  const deptRes = await query('SELECT slug FROM departments WHERE slug = $1', [departmentSlug]);
  if (!deptRes.rows[0]) throw new Error('Department not found.');

  const upsertLayoutRes = await query(
    `INSERT INTO department_layouts (department_slug, status, created_by)
     VALUES ($1, 'draft', $2)
     ON CONFLICT (department_slug, status)
     DO UPDATE SET updated_at = NOW(), created_by = EXCLUDED.created_by
     RETURNING id, department_slug, status, created_by, created_at, updated_at`,
    [departmentSlug, adminId]
  );

  const layout = upsertLayoutRes.rows[0];

  await query('DELETE FROM department_layout_items WHERE layout_id = $1', [layout.id]);

  for (const [idx, item] of items.entries()) {
    await query(
      `INSERT INTO department_layout_items (layout_id, ad_id, x, y, width, height, z_index, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        layout.id,
        item.ad_id,
        parseInt(item.x, 10) || 0,
        parseInt(item.y, 10) || 0,
        Math.max(40, parseInt(item.width, 10) || 260),
        Math.max(40, parseInt(item.height, 10) || 180),
        parseInt(item.z_index, 10) || idx + 1,
        item.is_visible !== false,
      ]
    );
  }

  return layout;
};

const publishLayout = async ({ departmentSlug, adminId, items = null }) => {
  await ensureTables();

  if (Array.isArray(items)) {
    await upsertDraftLayout({ departmentSlug, adminId, items });
  }

  const draftRes = await query(
    `SELECT id FROM department_layouts
     WHERE department_slug = $1 AND status = 'draft'`,
    [departmentSlug]
  );

  const draft = draftRes.rows[0];
  if (!draft) throw new Error('Draft layout not found.');

  const draftItemsRes = await query(
    `SELECT ad_id, x, y, width, height, z_index, is_visible
     FROM department_layout_items
     WHERE layout_id = $1
     ORDER BY z_index ASC, created_at ASC`,
    [draft.id]
  );

  const publishedLayoutRes = await query(
    `INSERT INTO department_layouts (department_slug, status, created_by)
     VALUES ($1, 'published', $2)
     ON CONFLICT (department_slug, status)
     DO UPDATE SET updated_at = NOW(), created_by = EXCLUDED.created_by
     RETURNING id, department_slug, status, created_by, created_at, updated_at`,
    [departmentSlug, adminId]
  );

  const published = publishedLayoutRes.rows[0];
  await query('DELETE FROM department_layout_items WHERE layout_id = $1', [published.id]);

  for (const item of draftItemsRes.rows) {
    await query(
      `INSERT INTO department_layout_items (layout_id, ad_id, x, y, width, height, z_index, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [published.id, item.ad_id, item.x, item.y, item.width, item.height, item.z_index, item.is_visible]
    );
  }

  return published;
};

const getPublishedLayoutForPublic = async ({ departmentSlug }) => {
  await ensureTables();

  const layoutRes = await query(
    `SELECT id, department_slug, status, updated_at
     FROM department_layouts
     WHERE department_slug = $1 AND status = 'published'`,
    [departmentSlug]
  );

  const layout = layoutRes.rows[0] || null;
  if (!layout) return { layout: null, items: [] };

  const itemsRes = await query(
    `SELECT i.id, i.ad_id, i.x, i.y, i.width, i.height, i.z_index,
            a.title, a.description, a.image_url, a.category, a.location, a.trust_score,
            a.status, a.created_at,
            u.name AS vendor_name,
            u.company AS shop_name,
            u.phone AS shop_phone,
            u.address AS shop_address,
            u.bio AS shop_bio
     FROM department_layout_items i
     JOIN advertisements a ON a.id = i.ad_id
     JOIN users u ON u.id = a.user_id
     WHERE i.layout_id = $1 AND i.is_visible = TRUE AND a.status = 'approved'
     ORDER BY i.z_index ASC, i.created_at ASC`,
    [layout.id]
  );

  return { layout, items: itemsRes.rows };
};

module.exports = {
  getDepartments,
  createDepartment,
  getLayoutByDepartment,
  upsertDraftLayout,
  publishLayout,
  getPublishedLayoutForPublic,
};
