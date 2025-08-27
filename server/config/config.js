// Configuration file for the server
const config = {
  // Server settings
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT settings
  jwtSecret: process.env.JWT_SECRET || 'ariaperta-super-secret-key-2024',
  jwtExpiresIn: '24h',
  
  // Admin settings
  adminRegistrationToken: process.env.ADMIN_REGISTRATION_TOKEN || 'ariaperta-admin-token-2024-development-test',
  
  // Database settings
      dbPath: process.env.DB_PATH || './database/ariaperta.db',
  
  // CORS settings
  corsOrigin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Booking settings
  booking: {
    maxMembers: 6,
    startHour: 9,
    endHour: 24,
    maxDuration: 4 // hours
  }
};

export default config;
