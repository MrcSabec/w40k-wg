const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'wrath_and_glory.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');
try {
  db.exec('PRAGMA journal_mode = WAL;');
} catch (e) {
  // Ignore WAL errors in restricted filesystems
}

// Complete relational schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT,
    salt TEXT,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe column migrations if users table already existed
try {
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('username')) {
    db.exec("ALTER TABLE users ADD COLUMN username TEXT;");
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);");
  }
  if (!userCols.includes('password_hash')) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
  }
  if (!userCols.includes('salt')) {
    db.exec("ALTER TABLE users ADD COLUMN salt TEXT;");
  }
} catch (e) {
  // columns already exist or index exists
}

db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tier INTEGER NOT NULL DEFAULT 1,
    invite_code TEXT UNIQUE NOT NULL,
    ruin INTEGER NOT NULL DEFAULT 0,
    glory INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    framework TEXT,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaign_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('gm', 'player')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    faction TEXT NOT NULL,
    archetype TEXT NOT NULL,
    tier INTEGER NOT NULL DEFAULT 1,
    rank INTEGER NOT NULL DEFAULT 1,
    xp_total INTEGER NOT NULL DEFAULT 100,
    xp_spent INTEGER NOT NULL DEFAULT 0,
    
    strength INTEGER NOT NULL DEFAULT 1,
    toughness INTEGER NOT NULL DEFAULT 1,
    agility INTEGER NOT NULL DEFAULT 1,
    initiative INTEGER NOT NULL DEFAULT 1,
    willpower INTEGER NOT NULL DEFAULT 1,
    intellect INTEGER NOT NULL DEFAULT 1,
    fellowship INTEGER NOT NULL DEFAULT 1,
    
    skills TEXT NOT NULL,
    
    wounds_current INTEGER NOT NULL DEFAULT 10,
    wounds_max INTEGER NOT NULL DEFAULT 10,
    shock_current INTEGER NOT NULL DEFAULT 6,
    shock_max INTEGER NOT NULL DEFAULT 6,
    wrath_points INTEGER NOT NULL DEFAULT 2,
    armour_bonus INTEGER NOT NULL DEFAULT 0,
    speed INTEGER NOT NULL DEFAULT 6,
    determination INTEGER NOT NULL DEFAULT 1,
    defence INTEGER NOT NULL DEFAULT 1,
    resilience INTEGER NOT NULL DEFAULT 2,
    
    keywords TEXT,
    wargear TEXT,
    talents TEXT,
    notes TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    creature_count INTEGER NOT NULL DEFAULT 5,
    base_attribute INTEGER NOT NULL DEFAULT 3,
    base_skill INTEGER NOT NULL DEFAULT 2,
    damage_rating INTEGER NOT NULL DEFAULT 7,
    armour_bonus INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages_rolls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'player',
    recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL = public; User ID = private whisper
    message_type TEXT NOT NULL, -- 'chat', 'whisper', 'roll', 'horde_roll', 'system'
    content TEXT,
    roll_data TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
