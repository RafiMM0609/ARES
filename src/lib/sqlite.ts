// src/lib/sqlite.ts
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';

// Database file path - can be configured via environment variable
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'ares.db');

// Singleton database instance
let db: Database.Database | null = null;

/**
 * Get or create the SQLite database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure the data directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // Initialize the database schema
    initializeSchema(db);
  }
  return db;
}

/**
 * Generate a UUID for new records
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Initialize database schema
 */
function initializeSchema(database: Database.Database) {
  database.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      user_type TEXT CHECK (user_type IN ('client', 'freelancer', 'both')) NOT NULL DEFAULT 'freelancer',
      avatar_url TEXT,
      bio TEXT,
      country TEXT,
      timezone TEXT,
      wallet_address TEXT,
      is_active INTEGER DEFAULT 1,
      email_verified INTEGER DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- User sessions table
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      ip_address TEXT,
      user_agent TEXT
    );

    -- Skills table
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Freelancer skills junction table
    CREATE TABLE IF NOT EXISTS freelancer_skills (
      id TEXT PRIMARY KEY,
      freelancer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(freelancer_id, skill_id)
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freelancer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      budget_amount REAL,
      budget_currency TEXT DEFAULT 'USD',
      status TEXT CHECK (status IN ('draft', 'open', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
      deadline TEXT,
      start_date TEXT,
      completion_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Project milestones table
    CREATE TABLE IF NOT EXISTS project_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')) DEFAULT 'pending',
      due_date TEXT,
      completed_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Invoices table
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freelancer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'overdue')) DEFAULT 'draft',
      issue_date TEXT DEFAULT (datetime('now')),
      due_date TEXT,
      paid_date TEXT,
      description TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Invoice items table
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Payments table
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      payer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      payment_method TEXT CHECK (payment_method IN ('wallet', 'bank_transfer', 'crypto', 'card')) DEFAULT 'wallet',
      transaction_hash TEXT,
      status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
      payment_date TEXT DEFAULT (datetime('now')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Reviews table
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(project_id, reviewer_id)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_freelancer_id ON projects(freelancer_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_freelancer_id ON invoices(freelancer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

    -- Insert sample skills if not exists
    INSERT OR IGNORE INTO skills (id, name, category) VALUES
      ('skill-001', 'JavaScript', 'Programming'),
      ('skill-002', 'TypeScript', 'Programming'),
      ('skill-003', 'React', 'Framework'),
      ('skill-004', 'Next.js', 'Framework'),
      ('skill-005', 'Node.js', 'Backend'),
      ('skill-006', 'Python', 'Programming'),
      ('skill-007', 'UI/UX Design', 'Design'),
      ('skill-008', 'Graphic Design', 'Design'),
      ('skill-009', 'Content Writing', 'Writing'),
      ('skill-010', 'SEO', 'Marketing');
  `);
}

/**
 * Generate invoice number with transaction to prevent race conditions
 */
export function generateInvoiceNumber(): string {
  const database = getDatabase();
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  
  // Use a transaction to prevent race conditions
  const generateNumber = database.transaction(() => {
    const result = database.prepare(`
      SELECT COALESCE(MAX(CAST(SUBSTR(invoice_number, 13) AS INTEGER)), 0) + 1 as seq
      FROM invoices
      WHERE invoice_number LIKE 'INV-' || ? || '-%'
    `).get(yearMonth) as { seq: number } | undefined;
    
    const sequenceNum = result?.seq || 1;
    return `INV-${yearMonth}-${sequenceNum.toString().padStart(4, '0')}`;
  });
  
  return generateNumber();
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Types for database operations
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  user_type: 'client' | 'freelancer' | 'both';
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  timezone: string | null;
  wallet_address: string | null;
  is_active: number;
  email_verified: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  client_id: string;
  freelancer_id: string | null;
  budget_amount: number | null;
  budget_currency: string;
  status: 'draft' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  deadline: string | null;
  start_date: string | null;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  project_id: string | null;
  client_id: string;
  freelancer_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  invoice_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  payment_method: 'wallet' | 'bank_transfer' | 'crypto' | 'card';
  transaction_hash: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillRow {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
}
