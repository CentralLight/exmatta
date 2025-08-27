import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = path.join(__dirname, '../database/ariaperta.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Create tables
  createTables();
}

// Create all necessary tables
function createTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'salaprove', 'salacorsi', 'news', 'docente')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('✅ Users table created/verified');
      updateDatabaseSchema();
    }
  });

  // Bookings table - Migliorata con indici e vincoli
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      duration INTEGER NOT NULL CHECK(duration IN (1, 2, 3, 4)),
      band_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      members_count INTEGER DEFAULT 1 CHECK(members_count BETWEEN 1 AND 6),
      notes TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating bookings table:', err.message);
    } else {
      console.log('✅ Bookings table created/verified');
      createBookingsIndexes();
    }
  });

  // Course requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS course_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      telefono TEXT NOT NULL,
      strumento TEXT NOT NULL,
      livello TEXT NOT NULL CHECK(livello IN ('Principiante', 'Intermedio', 'Avanzato')),
      descrizione TEXT,
      teacher_id INTEGER,
      status TEXT DEFAULT 'In attesa' CHECK(status IN ('In attesa', 'Completata')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating course_requests table:', err.message);
    } else {
      console.log('✅ Course requests table created/verified');
    }
  });

  // Teachers table
  db.run(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      instruments TEXT NOT NULL,
      bio TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating teachers table:', err.message);
    } else {
      console.log('✅ Teachers table created/verified');
    }
  });

  // Check if user_id column exists in teachers table, if not add it
  db.get("PRAGMA table_info(teachers)", [], (err, rows) => {
    if (err) {
      console.error('Error checking teachers table structure:', err.message);
      return;
    }
    
    db.all("PRAGMA table_info(teachers)", [], (err, columns) => {
      if (err) {
        console.error('Error getting teachers table columns:', err.message);
        return;
      }
      
      const hasUserId = columns.some(col => col.name === 'user_id');
      if (!hasUserId) {
        console.log('🔄 Adding user_id column to teachers table...');
        db.run('ALTER TABLE teachers ADD COLUMN user_id INTEGER', (err) => {
          if (err) {
            console.error('Error adding user_id column:', err.message);
          } else {
            console.log('✅ user_id column added to teachers table');
          }
        });
      }
    });
  });

  // Check if teacher_id column exists in course_requests table, if not add it
  db.get("PRAGMA table_info(course_requests)", [], (err, rows) => {
    if (err) {
      console.error('Error checking course_requests table structure:', err.message);
      return;
    }
    
    db.all("PRAGMA table_info(course_requests)", [], (err, columns) => {
      if (err) {
        console.error('Error getting course_requests table columns:', err.message);
        return;
      }
      
      const hasTeacherId = columns.some(col => col.name === 'teacher_id');
      if (!hasTeacherId) {
        console.log('🔄 Adding teacher_id column to course_requests table...');
        db.run('ALTER TABLE course_requests ADD COLUMN teacher_id INTEGER', (err) => {
          if (err) {
            console.error('Error adding teacher_id column:', err.message);
          } else {
            console.log('✅ teacher_id column added to course_requests table');
          }
        });
      }
    });
  });

  // Bug reports table
  db.run(`
    CREATE TABLE IF NOT EXISTS bug_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      browser_info TEXT,
      admin_notes TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating bug_reports table:', err.message);
    } else {
      console.log('✅ Bug reports table created/verified');
      createBugReportsIndexes();
    }
  });

  // News table
  db.run(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titolo TEXT NOT NULL,
      sottotitolo TEXT,
      descrizione TEXT NOT NULL,
      image_filename TEXT,
      stato TEXT DEFAULT 'Bozza' CHECK(stato IN ('Bozza', 'Pubblicato', 'Archiviato')),
      autore TEXT DEFAULT 'Redazione AriaPerta',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('Error creating news table:', err.message);
    } else {
      console.log('✅ News table created/verified');
      updateNewsTableSchema();
    }
  });

  // Availability blocks table
  db.run(`
    CREATE TABLE IF NOT EXISTS availability_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      reason TEXT NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating availability_blocks table:', err.message);
    } else {
      console.log('✅ Availability blocks table created/verified');
    }
  });

  // Email logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('success','failure')),
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating email_logs table:', err.message);
    } else {
      console.log('✅ Email logs table created/verified');
      createEmailLogsIndexes();
    }
  });
}

// Create indexes for better performance
function createBookingsIndexes() {
  // Index per data e orario (per query di disponibilità)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_bookings_date_time 
    ON bookings(date, start_time)
  `, (err) => {
    if (err) {
      console.error('Error creating date_time index:', err.message);
    } else {
      console.log('✅ Date-time index created/verified');
    }
  });

  // Index per status (per filtri admin)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_bookings_status 
    ON bookings(status)
  `, (err) => {
    if (err) {
      console.error('Error creating status index:', err.message);
    } else {
      console.log('✅ Status index created/verified');
    }
  });

  // Index per email (per ricerca cliente)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_bookings_email 
    ON bookings(email)
  `, (err) => {
    if (err) {
      console.error('Error creating email index:', err.message);
    } else {
      console.log('✅ Email index created/verified');
    }
  });

  // Trigger per aggiornare automaticamente updated_at
  db.run(`
    CREATE TRIGGER IF NOT EXISTS update_bookings_timestamp 
    AFTER UPDATE ON bookings
    BEGIN
      UPDATE bookings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `, (err) => {
    if (err) {
      console.error('Error creating update trigger:', err.message);
    } else {
      console.log('✅ Update trigger created/verified');
    }
  });
}

// Create indexes for email logs
function createEmailLogsIndexes() {
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_email_logs_created_at
    ON email_logs(created_at)
  `, (err) => {
    if (err) {
      console.error('Error creating email_logs created_at index:', err.message);
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_email_logs_status
    ON email_logs(status)
  `, (err) => {
    if (err) {
      console.error('Error creating email_logs status index:', err.message);
    }
  });
}

// Create indexes for bug reports
function createBugReportsIndexes() {
  // Index per status (per filtri admin)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_bug_reports_status 
    ON bug_reports(status)
  `, (err) => {
    if (err) {
      console.error('Error creating bug_reports status index:', err.message);
    } else {
      console.log('✅ Bug reports status index created/verified');
    }
  });

  // Index per created_at (per ordinamento cronologico)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at 
    ON bug_reports(created_at)
  `, (err) => {
    if (err) {
      console.error('Error creating bug_reports created_at index:', err.message);
    } else {
      console.log('✅ Bug reports created_at index created/verified');
    }
  });

  // Trigger per aggiornare automaticamente updated_at
  db.run(`
    CREATE TRIGGER IF NOT EXISTS update_bug_reports_timestamp 
    AFTER UPDATE ON bug_reports
    BEGIN
      UPDATE bug_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `, (err) => {
    if (err) {
      console.error('Error creating bug_reports update trigger:', err.message);
    } else {
      console.log('✅ Bug reports update trigger created/verified');
    }
  });
}

// Update existing database schema to support new roles
function updateDatabaseSchema() {
  // SQLite doesn't support ALTER TABLE to modify CHECK constraints
  // So we need to recreate the users table with the new constraint
  
  // First, backup existing users data
  db.all('SELECT * FROM users', [], (err, users) => {
    if (err) {
      console.error('Error backing up users:', err.message);
      return;
    }
    
    // Drop the old table
    db.run('DROP TABLE IF EXISTS users', (err) => {
      if (err) {
        console.error('Error dropping users table:', err.message);
        return;
      }
      
      // Recreate the table with new role constraints
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'salaprove', 'salacorsi', 'news', 'docente')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          is_active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('Error recreating users table:', err.message);
          return;
        }
        
        console.log('✅ Users table updated with new role constraints');
        
        // Restore users data
        if (users && users.length > 0) {
          users.forEach(user => {
            db.run(`
              INSERT INTO users (username, email, password_hash, role, created_at, last_login, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [user.username, user.email, user.password_hash, user.role, user.created_at, user.last_login, user.is_active]);
          });
          console.log(`✅ Restored ${users.length} existing users`);
        }
        
        // Now create the new users
        createDefaultAdmin();
      });
    });
  });
}

// Update news table schema to add image_filename field
function updateNewsTableSchema() {
  db.get("PRAGMA table_info(news)", (err, rows) => {
    if (err) {
      console.error('Error checking news table schema:', err.message);
      return;
    }
    
    // Check if image_filename column exists
    db.all("PRAGMA table_info(news)", (err, columns) => {
      if (err) {
        console.error('Error getting news table columns:', err.message);
        return;
      }
      
      const hasImageFilename = columns.some(col => col.name === 'image_filename');
      
      if (!hasImageFilename) {
        // Add image_filename column if it doesn't exist
        db.run('ALTER TABLE news ADD COLUMN image_filename TEXT', (err) => {
          if (err) {
            console.error('Error adding image_filename column:', err.message);
          } else {
            console.log('✅ Added image_filename column to news table');
            
            // If old immagine column exists, migrate data
            const hasImmagine = columns.some(col => col.name === 'immagine');
            if (hasImmagine) {
              db.run('UPDATE news SET image_filename = immagine WHERE image_filename IS NULL AND immagine IS NOT NULL', (err) => {
                if (err) {
                  console.error('Error migrating immagine data:', err.message);
                } else {
                  console.log('✅ Migrated immagine data to image_filename');
                }
              });
            }
          }
        });
      } else {
        console.log('✅ News table schema already up to date');
      }
    });
  });
}

// Create default admin user
function createDefaultAdmin() {
  const defaultPassword = 'exmatta2024'; // Password temporanea per tutti gli utenti
  
  // Lista utenti da creare
  const users = [
    { username: 'admin', email: 'admin@ariaperta.it', role: 'admin' },
    { username: 'a.polo', email: 'a.polo@ariaperta.it', role: 'admin' },
    { username: 'l.aghilon', email: null, role: 'user' },
    { username: 'e.sgarra', email: null, role: 'user' },
    { username: 'l.calandra', email: null, role: 'user' },
    { username: 'l.artipoli', email: null, role: 'news' },
    { username: 'a.vaccaro', email: null, role: 'salaprove' },
    { username: 'g.nalesso', email: null, role: 'salaprove' },
    { username: 'a.capozzi', email: null, role: 'salacorsi' }
  ];

  // Crea tutti gli utenti
  users.forEach(user => {
    createOrUpdateUser(user.username, user.email, user.role, defaultPassword);
  });
}

// Create or update user
function createOrUpdateUser(username, email, role, password) {
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error(`Error checking user ${username}:`, err.message);
      return;
    }
    
    if (!row) {
      // Hash password and create user
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error(`Error hashing password for ${username}:`, err.message);
          return;
        }
        
        const emailValue = email || null;
        db.run(`
          INSERT INTO users (username, email, password_hash, role, is_active)
          VALUES (?, ?, ?, ?, 1)
        `, [username, emailValue, hash, role], (err) => {
          if (err) {
            console.error(`Error creating user ${username}:`, err.message);
          } else {
            console.log(`✅ User ${username} created with role ${role}`);
          }
        });
      });
    } else {
      // Update existing user password if needed
      updateUserPassword(username, password);
    }
  });
}

// Update user password
function updateUserPassword(username, newPassword) {
  bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) {
      console.error(`Error hashing new password for ${username}:`, err.message);
      return;
    }
    
    db.run('UPDATE users SET password_hash = ? WHERE username = ?', [hash, username], (err) => {
      if (err) {
        console.error(`Error updating password for ${username}:`, err.message);
      } else {
        console.log(`✅ User ${username} password updated`);
      }
    });
  });
}

export default db;
