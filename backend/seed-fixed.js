const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
});

async function seed() {
  try {
    const res = await pool.query('SELECT id FROM users LIMIT 1');
    const adminId = res.rows[0].id;
    
    await pool.query('DELETE FROM advertisements WHERE user_id = $1', [adminId]);

    const query = 'INSERT INTO advertisements (title, description, category, location, image_url, trust_score, status, user_id, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';

    await pool.query(query, ['Multi-brand Laptop Service & Chip Level Repair', 'Expert laptop service in Pondicherry. We handle battery, adapter, screen replacements, keyboard issues, and SSD/RAM upgrades. Visit us at Devi Infosolutions.', 'Services', 'Pondicherry', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=800&fit=crop', 95, 'approved', adminId, true]);
    await pool.query(query, ['BUY 1 GET 1 FREE - TAKA PIZZA!', 'Special Thursday offer! Buy any medium or large pizza and get another one absolutely free. Woodfired pizzas available at Reddiarpalayam branch.', 'Business', 'Reddiarpalayam', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=900&fit=crop', 88, 'approved', adminId, false]);
    await pool.query(query, ['iCOM Computer - CCTV Camera Offers', '4 CH HD DVR + 2MP HD Camera x4 = Rs. 13,990. Free installation included. Call us for secure home monitoring solutions.', 'Services', 'Vellala St, Puducherry', 'https://images.unsplash.com/photo-1557825835-b63065eb6ab1?w=600&h=500&fit=crop', 92, 'approved', adminId, false]);
    await pool.query(query, ['Prabu Tiles Cleaning Services', 'Before & After guaranteed results! We clean tiles, toilet basins, marble machines, and kitchen chimneys. Fast and reliable service.', 'Services', 'Pondicherry', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=400&fit=crop', 85, 'approved', adminId, false]);
    await pool.query(query, ['Ram Silks - Cotton Mela', 'A-Z Cotton collection available. Salwar, tops, leggings, and branded innerwear at wholesale prices. Visit us today!', 'Business', 'Nehru St, Puducherry', 'https://images.unsplash.com/photo-1583391733958-d25e07fac0fa?w=600&h=700&fit=crop', 90, 'approved', adminId, true]);
    await pool.query(query, ['Acer Mega Offer - Exchange Old Laptops', 'Bring your old working laptop and upgrade to a new Acer Predator with amazing exchange bonuses.', 'Business', 'Pondicherry', 'https://images.unsplash.com/photo-1531297172864-45dc60645f30?w=600&h=600&fit=crop', 89, 'approved', adminId, false]);

    console.log('✅ Successfully seeded sample ads!');
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    pool.end();
  }
}
seed();
