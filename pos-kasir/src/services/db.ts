import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export const initDb = async () => {
  if (!db) {
    db = await Database.load('sqlite:pos.db');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        category TEXT,
        price REAL,
        cost REAL,
        stock_mode TEXT,
        stock INTEGER,
        min_stock INTEGER,
        promo INTEGER,
        promo_text TEXT,
        original_price REAL,
        image_url TEXT,
        outlets TEXT
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY,
        name TEXT,
        unit TEXT,
        current_stock REAL,
        min_stock_threshold REAL,
        is_tracked INTEGER,
        outlets TEXT
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY,
        product_id INTEGER,
        ingredient_id INTEGER,
        qty_per_unit REAL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS outlets (
        id TEXT PRIMARY KEY,
        name TEXT,
        address TEXT,
        phone TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS cashiers (
        id TEXT PRIMARY KEY,
        name TEXT,
        branch_id TEXT,
        role TEXT,
        status TEXT
      );
    `);

    // The Outbox table holds all offline actions waiting to be synced to Google Sheets
    await db.execute(`
      CREATE TABLE IF NOT EXISTS outbox (
        client_generated_id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
      );
    `);
  }
  return db;
};

export const getDb = async () => {
  if (!db) {
    return await initDb();
  }
  return db;
};

// -------------------------------------------------------------
// Outbox (Offline Sync) Methods
// -------------------------------------------------------------
export const queueOutbox = async (action: string, payload: any) => {
  const db = await getDb();
  const client_generated_id = payload.client_generated_id || crypto.randomUUID();
  payload.client_generated_id = client_generated_id;
  const created_at = new Date().toISOString();
  
  await db.execute(
    'INSERT INTO outbox (client_generated_id, action, payload, created_at, status) VALUES ($1, $2, $3, $4, $5)',
    [client_generated_id, action, JSON.stringify(payload), created_at, 'pending']
  );
  return client_generated_id;
};

export const getPendingOutbox = async () => {
  const db = await getDb();
  return await db.select<any[]>('SELECT * FROM outbox WHERE status = $1 ORDER BY created_at ASC', ['pending']);
};

export const markOutboxSynced = async (client_generated_id: string) => {
  const db = await getDb();
  await db.execute('UPDATE outbox SET status = $1 WHERE client_generated_id = $2', ['synced', client_generated_id]);
};

// -------------------------------------------------------------
// Read Methods (Master Data)
// -------------------------------------------------------------
export const getProducts = async () => {
  const db = await getDb();
  return await db.select<any[]>('SELECT * FROM products');
};

export const getIngredients = async () => {
  const db = await getDb();
  return await db.select<any[]>('SELECT * FROM ingredients');
};

export const getRecipes = async () => {
  const db = await getDb();
  return await db.select<any[]>('SELECT * FROM recipes');
};

export const getCategories = async () => {
  const db = await getDb();
  return await db.select<any[]>('SELECT * FROM categories');
};

export const getOutlets = async () => {
  const db = await getDb();
  return await db.select<any[]>('SELECT * FROM outlets');
};

export const getCashiers = async () => {
  const db = await getDb();
  return await db.select<any[]>('SELECT * FROM cashiers');
};

// -------------------------------------------------------------
// Write Methods (Master Data Batch Update from Sync)
// -------------------------------------------------------------
export const updateMasterData = async (data: any) => {
  const db = await getDb();
  
  // Update Products
  if (data.products && Array.isArray(data.products)) {
    await db.execute('DELETE FROM products');
    for (const p of data.products) {
      await db.execute(
        'INSERT INTO products (id, name, category, price, cost, stock_mode, stock, min_stock, promo, promo_text, original_price, image_url, outlets) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [p.id, p.name, p.category, p.price, p.cost, p.stock_mode, p.stock, p.minStock, p.promo ? 1 : 0, p.promoText, p.originalPrice, p.image_url, p.outlets]
      );
    }
  }

  // Update Ingredients
  if (data.ingredients && Array.isArray(data.ingredients)) {
    await db.execute('DELETE FROM ingredients');
    for (const i of data.ingredients) {
      await db.execute(
        'INSERT INTO ingredients (id, name, unit, current_stock, min_stock_threshold, is_tracked, outlets) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [i.id, i.name, i.unit, i.current_stock, i.min_stock_threshold, i.is_tracked ? 1 : 0, i.outlets]
      );
    }
  }

  // Update Recipes
  if (data.recipes && Array.isArray(data.recipes)) {
    await db.execute('DELETE FROM recipes');
    for (const r of data.recipes) {
      await db.execute(
        'INSERT INTO recipes (id, product_id, ingredient_id, qty_per_unit) VALUES ($1, $2, $3, $4)',
        [r.id, r.product_id, r.ingredient_id, r.qty_per_unit]
      );
    }
  }
  
  // Update Categories
  if (data.categories && Array.isArray(data.categories)) {
    await db.execute('DELETE FROM categories');
    for (const c of data.categories) {
      await db.execute('INSERT INTO categories (id, name) VALUES ($1, $2)', [c.id, c.name]);
    }
  }
};
