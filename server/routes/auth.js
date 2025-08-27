import express from 'express';
import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAdmin, authenticateToken, verifyToken } from '../middleware/auth.js';
import { validateUserRegistration, validatePasswordUpdate } from '../middleware/validation.js';
import config from '../config/config.js';

const router = express.Router();

// JWT Secret dalla configurazione centralizzata
const JWT_SECRET = config.jwtSecret;

// Validate JWT_SECRET is set
if (!JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET non è configurato correttamente!');
  process.exit(1);
}

// POST /api/auth/login - Admin login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validazione input base
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Sanitizzazione input
  const cleanUsername = username.toString().trim();
  const cleanPassword = password.toString();
  
  if (cleanUsername.length === 0 || cleanPassword.length === 0) {
    return res.status(400).json({ error: 'Username and password cannot be empty' });
  }
  
  // Find user by username (allow all roles)
  const query = `SELECT * FROM users WHERE username = ?`;
  
  db.get(query, [cleanUsername], async (err, user) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    try {
      // Compare password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
      
    } catch (error) {
      console.error('Error during password comparison:', error);
      res.status(500).json({ error: 'Authentication error' });
    }
  });
});

// POST /api/auth/register - Create new admin user (protected)
router.post('/register', validateUserRegistration, async (req, res) => {
  const { username, email, password, firstName, lastName, adminToken } = req.body;
  
  // Verify admin token dalla configurazione centralizzata
  const ADMIN_REGISTRATION_TOKEN = config.adminRegistrationToken;
  
  if (!ADMIN_REGISTRATION_TOKEN) {
    console.error('❌ CRITICAL: ADMIN_REGISTRATION_TOKEN non è configurato correttamente!');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (adminToken !== ADMIN_REGISTRATION_TOKEN) {
    return res.status(403).json({ error: 'Admin token required' });
  }
  
  try {
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user with firstName and lastName
    const query = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, 'admin', 1)
    `;
    
    db.run(query, [username, email, hashedPassword, firstName, lastName], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        console.error('Error creating user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        userId: this.lastID
      });
    });
    
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration error' });
  }
});

// GET /api/auth/users - Get all users (admin only)
router.get('/users', verifyToken, requireAdmin, (req, res) => {
  const query = `
    SELECT id, username, email, role, is_active, created_at, last_login
    FROM users 
    ORDER BY username ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      success: true,
      users: rows
    });
  });
});

// POST /api/auth/users - Create new user (admin only)
router.post('/users', verifyToken, requireAdmin, validateUserRegistration, async (req, res) => {
  const { username, password, firstName, lastName, role } = req.body;
  
  if (!['admin', 'user', 'news', 'salaprove', 'salacorsi', 'docente'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be one of: admin, user, news, salaprove, salacorsi, docente' });
  }
  
  try {
    // Check if username already exists
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
      if (err) {
        console.error('Error checking existing user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Insert new user with firstName and lastName
        const query = `
          INSERT INTO users (username, password_hash, first_name, last_name, role, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `;
        
        db.run(query, [username, hashedPassword, firstName, lastName, role], function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Get the created user
          db.get('SELECT id, username, first_name, last_name, role, is_active, created_at FROM users WHERE id = ?', [this.lastID], (err, user) => {
            if (err) {
              console.error('Error fetching created user:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
              success: true,
              message: 'User created successfully',
              user: user
            });
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/users/:id/password - Update user password (admin only)
router.put('/users/:id/password', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }
  
  // Validazione password usando il middleware
  if (!validatePasswordUpdate(newPassword)) {
    return res.status(400).json({ 
      error: 'Password deve essere di almeno 8 caratteri con maiuscole, minuscole, numeri e simboli' 
    });
  }
  
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id], function(err) {
      if (err) {
        console.error('Error updating user password:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/users/:id/role - Update user role (admin only)
router.put('/users/:id/role', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { newRole } = req.body;
  
  if (!newRole || !['admin', 'user', 'news', 'salaprove', 'salacorsi', 'docente'].includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role. Must be one of: admin, user, news, salaprove, salacorsi, docente' });
  }
  
  try {
    db.run('UPDATE users SET role = ? WHERE id = ?', [newRole, id], function(err) {
      if (err) {
        console.error('Error updating user role:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        success: true,
        message: 'Role updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/users/:id - Update user completely (admin only)
router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, role, password } = req.body;
  
  // Validazione campi obbligatori
  if (!username || !email || !role) {
    return res.status(400).json({ error: 'Username, email and role are required' });
  }
  
  // Validazione ruolo
  if (!['admin', 'user', 'news', 'salaprove', 'salacorsi', 'docente'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be one of: admin, user, news, salaprove, salacorsi, docente' });
  }
  
  try {
    // Verifica se l'utente esiste
    db.get('SELECT id FROM users WHERE id = ?', [id], async (err, user) => {
      if (err) {
        console.error('Error checking user existence:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verifica se username o email sono già usati da altri utenti
      db.get('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', 
        [username, email, id], (err, existingUser) => {
        if (err) {
          console.error('Error checking username/email uniqueness:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (existingUser) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Se c'è una password, la aggiorna
        if (password) {
          bcrypt.hash(password, 10).then(hashedPassword => {
            db.run('UPDATE users SET username = ?, email = ?, role = ?, password_hash = ? WHERE id = ?', 
              [username, email, role, hashedPassword, id], function(err) {
              if (err) {
                console.error('Error updating user:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              
              res.json({
                success: true,
                message: 'User updated successfully'
              });
            });
          }).catch(error => {
            console.error('Error hashing password:', error);
            res.status(500).json({ error: 'Internal server error' });
          });
        } else {
          // Aggiorna senza password
          db.run('UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?', 
            [username, email, role, id], function(err) {
            if (err) {
              console.error('Error updating user:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
              success: true,
              message: 'User updated successfully'
            });
          });
        }
      });
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT id, username, email, role, is_active, created_at, last_login
    FROM users 
    WHERE id = ?
  `;
  
  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: row
    });
  });
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, just return success (client removes token)
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/change-password - Change password
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword, adminToken } = req.body;
  
  if (!currentPassword || !newPassword || !adminToken) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (adminToken !== 'exmatta2024') {
    return res.status(403).json({ error: 'Admin token required' });
  }
  
  try {
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update admin password
    db.run('UPDATE users SET password_hash = ? WHERE username = ?', 
      [hashedPassword, 'admin'], function(err) {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Admin user not found' });
        }
        
        res.json({ success: true, message: 'Password updated successfully' });
      });
      
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Password change error' });
  }
});

// DELETE /api/auth/users/:id - Delete user (admin only)
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  try {
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, username, role FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deletion of admin users (safety check)
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    
    // Per ora, elimino solo l'utente senza cascade delete
    // TODO: Implementare cascade delete quando le tabelle saranno correttamente collegate
    
    // Finally delete the user
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: user
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
