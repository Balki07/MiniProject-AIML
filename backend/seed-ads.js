const { pool } = require('./src/config/db');

const sampleAds = [
  {
    title: 'Multi-brand Laptop Service & Chip Level Repair',
    description: 'Expert laptop service in Pondicherry. We handle battery, adapter, screen replacements, keyboard issues, and SSD/RAM upgrades. Visit us at Devi Infosolutions.',
    category: 'Services',
    location: 'Pondicherry',
    image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=800&fit=crop', // Tall image
    trust_score: 95,
    status: 'approved',
    user_id: 1, // Admin user
    is_featured: true
  },
  {
    title: 'BUY 1 GET 1 FREE - TAKA PIZZA!',
    description: 'Special Thursday offer! Buy any medium or large pizza and get another one absolutely free. Woodfired pizzas available at Reddiarpalayam branch.',
    category: 'Business',
    location: 'Reddiarpalayam',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=900&fit=crop', // Tall image
    trust_score: 88,
    status: 'approved',
    user_id: 1,
    is_featured: false
  },
  {
    title: 'iCOM Computer - CCTV Camera Offers',
    description: '4 CH HD DVR + 2MP HD Camera x4 = Rs. 13,990. Free installation included. Call us for secure home monitoring solutions.',
    category: 'Services',
    location: 'Vellala St, Puducherry',
    image_url: 'https://images.unsplash.com/photo-1557825835-b63065eb6ab1?w=600&h=500&fit=crop', // Wide image
    trust_score: 92,
    status: 'approved',
    user_id: 1,
    is_featured: false
  },
  {
    title: 'Prabu Tiles Cleaning Services',
    description: 'Before & After guaranteed results! We clean tiles, toilet basins, marble machines, and kitchen chimneys. Fast and reliable service.',
    category: 'Services',
    location: 'Pondicherry',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=400&fit=crop', // Wide image
    trust_score: 85,
    status: 'approved',
    user_id: 1,
    is_featured: false
  },
  {
    title: 'Ram Silks - Cotton Mela',
    description: 'A-Z Cotton collection available. Salwar, tops, leggings, and branded innerwear at wholesale prices. Visit us today!',
    category: 'Business',
    location: 'Nehru St, Puducherry',
    image_url: 'https://images.unsplash.com/photo-1583391733958-d25e07fac0fa?w=600&h=700&fit=crop', // Medium tall
    trust_score: 90,
    status: 'approved',
    user_id: 1,
    is_featured: true
  },
  {
    title: 'Acer Mega Offer - Exchange Old Laptops',
    description: 'Bring your old working laptop and upgrade to a new Acer Predator with amazing exchange bonuses.',
    category: 'Business',
    location: 'Pondicherry',
    image_url: 'https://images.unsplash.com/photo-1531297172864-45dc60645f30?w=600&h=600&fit=crop', // Square
    trust_score: 89,
    status: 'approved',
    user_id: 1,
    is_featured: false
  }
];

async function seed() {
  console.log('Seeding database with sample images...');
  for (const ad of sampleAds) {
    await pool.query(
      `INSERT INTO advertisements (title, description, category, location, image_url, trust_score, status, user_id, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [ad.title, ad.description, ad.category, ad.location, ad.image_url, ad.trust_score, ad.status, ad.user_id, ad.is_featured]
    );
  }
  console.log('✅ Seed complete!');
  process.exit(0);
}

seed().catch(console.error);
