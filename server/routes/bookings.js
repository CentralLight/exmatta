import express from 'express';
import db from '../config/database.js';
import { notifyAdminNewBooking, sendBookingConfirmation } from '../services/emailService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { verifyPublicForm } from '../middleware/recaptcha.js';
import { generateBookingICS, generateICSFilename } from '../utils/calendarGenerator.js';
import { 
  sendBookingConfirmationWithICS, 
  sendBookingCancellationWithICS, 
  sendStaffNotificationWithICS 
} from '../services/advancedEmailService.js';

const router = express.Router();

// GET /api/bookings - Get all bookings (admin only)
router.get('/', (req, res) => {
  const query = `
    SELECT b.*, u.username, u.email as user_email 
    FROM bookings b 
    LEFT JOIN users u ON b.user_id = u.id 
    ORDER BY b.date DESC, b.start_time ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// GET /api/bookings/available - Check availability for a specific date
router.get('/available/:date', (req, res) => {
  const { date } = req.params;
  
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // Validazione data futura
  const requestedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (requestedDate < today) {
    return res.status(400).json({ error: 'Cannot check availability for dates in the past' });
  }
  
  // Get all bookings for the specified date
  const query = `
    SELECT start_time, duration, status
    FROM bookings 
    WHERE date = ? AND status IN ('pending', 'approved')
    ORDER BY start_time ASC
  `;
  
  db.all(query, [date], (err, bookings) => {
    if (err) {
      console.error('Error checking availability:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log(`🔍 Controllo disponibilità per ${date}:`, bookings);
    
    // Generate time slots from 9:00 to 23:30 (every 30 minutes)
    const timeSlots = [];
    const startHour = 9;
    const endHour = 23;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      // Add full hour slot
      const fullHourTime = `${hour.toString().padStart(2, '0')}:00`;
      
      // Check if this time slot is available for different durations
      const fullHourDurations = [];
      
      for (let duration = 1; duration <= 4; duration++) {
        const slotEnd = addHours(fullHourTime, duration);
        
        // Check if this duration fits within the day
        if (hour + duration <= 24) {
          // Check for conflicts with existing bookings
          const isAvailable = !bookings.some(booking => {
            const bookingStart = booking.start_time;
            const bookingEnd = addHours(bookingStart, booking.duration);
            
            // Check for overlap: new slot overlaps with existing booking
            const hasConflict = (fullHourTime < bookingEnd && slotEnd > bookingStart);
            if (hasConflict) {
              console.log(`❌ Conflitto: slot ${fullHourTime}-${slotEnd} con prenotazione ${bookingStart}-${bookingEnd}`);
            }
            return hasConflict;
          });
          
          if (isAvailable) {
            fullHourDurations.push(duration);
          }
        }
      }
      
      timeSlots.push({
        time: fullHourTime,
        available: fullHourDurations.length > 0,
        availableDurations: fullHourDurations,
        maxDuration: Math.max(...fullHourDurations, 0)
      });
      
      // Add half-hour slot (except for 23:30)
      if (hour < 23) {
        const halfHourTime = `${hour.toString().padStart(2, '0')}:30`;
        
        // Check if this time slot is available for different durations
        const halfHourDurations = [];
        
        for (let duration = 1; duration <= 4; duration++) {
          const slotEnd = addHours(halfHourTime, duration);
          
          // Check if this duration fits within the day
          if (hour + duration <= 24) {
            // Check for conflicts with existing bookings
            const isAvailable = !bookings.some(booking => {
              const bookingStart = booking.start_time;
              const bookingEnd = addHours(bookingStart, booking.duration);
              
              // Check for overlap: new slot overlaps with existing booking
              const hasConflict = (halfHourTime < bookingEnd && slotEnd > bookingStart);
              if (hasConflict) {
                console.log(`❌ Conflitto: slot ${halfHourTime}-${slotEnd} con prenotazione ${bookingStart}-${bookingEnd}`);
              }
              return hasConflict;
            });
            
            if (isAvailable) {
              halfHourDurations.push(duration);
            }
          }
        }
        
        timeSlots.push({
          time: halfHourTime,
          available: halfHourDurations.length > 0,
          availableDurations: halfHourDurations,
          maxDuration: Math.max(...halfHourDurations, 0)
        });
      }
    }
    
    console.log(`✅ Slot disponibili per ${date}:`, timeSlots.filter(slot => slot.available).length);
    
    res.json({
      date,
      timeSlots,
      totalBookings: bookings.length,
      availableSlots: timeSlots.filter(slot => slot.available).length,
      totalSlots: timeSlots.length
    });
  });
});

// POST /api/bookings - Create new booking
router.post('/', verifyPublicForm, (req, res) => {
  const { date, start_time, duration, band_name, email, phone, members_count, notes } = req.body;
  
  // Validation
  if (!date || !start_time || !duration || !band_name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (![1, 2, 3, 4].includes(duration)) {
    return res.status(400).json({ error: 'Duration must be 1, 2, 3, or 4 hours' });
  }
  
  if (members_count && (members_count < 1 || members_count > 6)) {
    return res.status(400).json({ error: 'Members count must be between 1 and 6' });
  }

  // Validazione formato data e orario
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  if (!/^\d{2}:\d{2}$/.test(start_time)) {
    return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
  }

  // Validazione orari (9:00 - 23:30)
  const [hour, minute] = start_time.split(':').map(Number);
  if (hour < 9 || hour > 23 || (hour === 23 && minute > 30)) {
    return res.status(400).json({ error: 'Booking time must be between 9:00 and 23:30' });
  }

  // Validazione data futura (non prenotazioni nel passato)
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (bookingDate < today) {
    return res.status(400).json({ error: 'Cannot book dates in the past' });
  }
  
  // Check if the time slot is available - gestione minuti
  const checkQuery = `
    SELECT start_time, duration
    FROM bookings 
    WHERE date = ? 
    AND status IN ('pending', 'approved')
  `;
  
  console.log('🔍 Controllo conflitti per:', { date, start_time, duration });
  
  db.all(checkQuery, [date], (err, existingBookings) => {
    if (err) {
      console.error('Error checking availability:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Controllo manuale dei conflitti (con minuti)
    const hasConflict = existingBookings.some(booking => {
      const [bh, bm] = booking.start_time.split(':').map(Number);
      const bookingStart = bh * 60 + bm;
      const bookingEnd = bookingStart + booking.duration * 60;
      const [nh, nm] = start_time.split(':').map(Number);
      const newStart = nh * 60 + nm;
      const newEnd = newStart + duration * 60;
      
      // Controlla se c'è sovrapposizione
      const conflict = (newStart < bookingEnd && newEnd > bookingStart);
      if (conflict) {
        console.log(`❌ Conflitto: nuova prenotazione ${start_time} (+${duration}h) con esistente ${booking.start_time} (+${booking.duration}h)`);
      }
      return conflict;
    });
    
    if (hasConflict) {
      return res.status(409).json({ 
        error: '⏰ Orario non disponibile - Questo slot è già prenotato o sovrapposto con un\'altra prenotazione. Scegli un orario diverso o una data diversa.' 
      });
    }
    
    // Create booking
    const insertQuery = `
      INSERT INTO bookings (date, start_time, duration, band_name, email, phone, members_count, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    
    db.run(insertQuery, [date, start_time, duration, band_name, email, phone, members_count || 1, notes], function(err) {
      if (err) {
        console.error('Error creating booking:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const newBooking = {
        id: this.lastID,
        date,
        start_time,
        duration,
        band_name,
        email,
        phone,
        members_count: members_count || 1,
        notes,
        status: 'pending'
      };
      
      // Invia notifica email all'admin (in background, non bloccare la risposta)
      notifyAdminNewBooking(newBooking).catch(err => {
        console.error('❌ Errore nell\'invio email admin:', err);
      });
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        bookingId: this.lastID
      });
    });
  });
});

// PUT /api/bookings/:id - Update booking details
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { date, start_time, duration, band_name, email, phone, members_count, notes } = req.body;
  
  // Validation
  if (!date || !start_time || !duration || !band_name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (![1, 2, 3, 4].includes(duration)) {
    return res.status(400).json({ error: 'Duration must be 1, 2, 3, or 4 hours' });
  }
  
  if (members_count && (members_count < 1 || members_count > 6)) {
    return res.status(400).json({ error: 'Members count must be between 1 and 6' });
  }

  // Validazione formato data e orario
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  if (!/^\d{2}:\d{2}$/.test(start_time)) {
    return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
  }

  // Validazione orari (9:00 - 23:30)
  const [hour, minute] = start_time.split(':').map(Number);
  if (hour < 9 || hour > 23 || (hour === 23 && minute > 30)) {
    return res.status(400).json({ error: 'Booking time must be between 9:00 and 23:30' });
  }

  // Validazione data futura
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (bookingDate < today) {
    return res.status(400).json({ error: 'Cannot book dates in the past' });
  }

  // Check if the time slot is available (excluding current booking)
  const checkQuery = `
    SELECT COUNT(*) as count
    FROM bookings 
    WHERE date = ? 
    AND status IN ('pending', 'approved')
    AND id != ?
    AND (
      (start_time < ? AND datetime(start_time, '+' || duration || ' hours') > ?) OR
      (start_time < datetime(?, '+' || ? || ' hours') AND start_time > ?)
    )
  `;
  
  db.get(checkQuery, [date, id, start_time, start_time, start_time, duration, start_time], (err, row) => {
    if (err) {
      console.error('Error checking availability:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row.count > 0) {
      return res.status(409).json({ 
        error: '⏰ Orario non disponibile - Questo slot è già prenotato o sovrapposto con un\'altra prenotazione. Scegli un orario diverso o una data diversa.' 
      });
    }
    
    // Update booking
    const updateQuery = `
      UPDATE bookings 
      SET date = ?, start_time = ?, duration = ?, band_name = ?, 
          email = ?, phone = ?, members_count = ?, notes = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(updateQuery, [date, start_time, duration, band_name, email, phone, members_count || 1, notes, id], function(err) {
      if (err) {
        console.error('Error updating booking:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      res.json({
        success: true,
        message: 'Booking updated successfully'
      });
    });
  });
});

// DELETE /api/bookings/:id - Delete booking
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `DELETE FROM bookings WHERE id = ?`;
  
  db.run(query, [id], function(err) {
    if (err) {
      console.error('Error deleting booking:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  });
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  // Prima recupera i dati della prenotazione per l'email
  const getBookingQuery = `SELECT * FROM bookings WHERE id = ?`;
  
  db.get(getBookingQuery, [id], (err, booking) => {
    if (err) {
      console.error('Error fetching booking:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const oldStatus = booking.status;
    
    // Aggiorna lo status
    const updateQuery = `UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.run(updateQuery, [status, id], function(err) {
      if (err) {
        console.error('Error updating booking status:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      // Invia email di conferma se approvata
      if (status === 'approved') {
        sendBookingConfirmation(booking).catch(err => {
          console.error('❌ Errore nell\'invio email conferma:', err);
        });
      }
      
      res.json({
        success: true,
        message: `Booking status updated to ${status}`
      });
    });
  });
});

// POST /api/bookings/:id/confirm - Confirm booking with .ics generation
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Recupera i dati della prenotazione
    const getBookingQuery = `SELECT * FROM bookings WHERE id = ?`;
    
    db.get(getBookingQuery, [id], async (err, booking) => {
      if (err) {
        console.error('Error fetching booking for confirmation:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      if (booking.status === 'approved') {
        return res.status(400).json({ error: 'Booking is already confirmed' });
      }
      
      // Aggiorna lo status a "approved"
      const updateQuery = `UPDATE bookings SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      db.run(updateQuery, [id], async function(updateErr) {
        if (updateErr) {
          console.error('Error confirming booking:', updateErr);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        try {
          // Genera file .ics
          const icsContent = generateBookingICS(booking, 'CONFIRMED');
          const icsFilename = generateICSFilename(booking, 'CONFIRMED');
          
          // Recupera lista destinatari (cliente + staff + admin)
          const recipientsQuery = `
            SELECT DISTINCT email, role 
            FROM users 
            WHERE role IN ('admin', 'salaprove') AND is_active = 1
            UNION 
            SELECT ? as email, 'client' as role
          `;
          
          db.all(recipientsQuery, [booking.email], async (recipientsErr, recipients) => {
            if (recipientsErr) {
              console.error('Error fetching recipients:', recipientsErr);
              return res.status(500).json({ error: 'Error fetching recipients' });
            }
            
                      // Invia email con allegato .ics a tutti i destinatari
          console.log(`📅 Generato file .ics per prenotazione confermata: ${icsFilename}`);
          console.log(`📧 Destinatari email:`, recipients.map(r => `${r.email} (${r.role})`));
          
          try {
            // Invia email al cliente
            const clientEmail = recipients.find(r => r.role === 'client');
            if (clientEmail) {
              await sendBookingConfirmationWithICS(booking, icsContent, icsFilename);
            }
            
            // Invia notifiche staff
            const staffEmails = recipients.filter(r => r.role !== 'client').map(r => r.email);
            if (staffEmails.length > 0) {
              await sendStaffNotificationWithICS(booking, icsContent, icsFilename, 'CONFIRMED', staffEmails);
            }
            
            res.json({
              success: true,
              message: 'Booking confirmed successfully',
              icsGenerated: true,
              icsFilename: icsFilename,
              emailsSent: recipients.length,
              clientEmailSent: !!clientEmail,
              staffEmailsSent: staffEmails.length
            });
            
          } catch (emailError) {
            console.error('❌ Errore nell\'invio email:', emailError);
            // Non bloccare la conferma se c'è un errore nell'email
            res.json({
              success: true,
              message: 'Booking confirmed successfully (but email sending failed)',
              icsGenerated: true,
              icsFilename: icsFilename,
              emailsSent: 0,
              emailError: emailError.message
            });
          }
          });
          
        } catch (icsError) {
          console.error('Error generating .ics file:', icsError);
          // Non bloccare la conferma se c'è un errore nella generazione .ics
          res.json({
            success: true,
            message: 'Booking confirmed successfully (but .ics generation failed)',
            icsGenerated: false
          });
        }
      });
    });
    
  } catch (error) {
    console.error('Error in booking confirmation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bookings/:id/cancel - Cancel booking with .ics generation
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    // Recupera i dati della prenotazione
    const getBookingQuery = `SELECT * FROM bookings WHERE id = ?`;
    
    db.get(getBookingQuery, [id], async (err, booking) => {
      if (err) {
        console.error('Error fetching booking for cancellation:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: 'Booking is already cancelled' });
      }
      
      // Aggiorna lo status a "cancelled"
      const updateQuery = `UPDATE bookings SET status = 'cancelled', notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      const updatedNotes = booking.notes ? `${booking.notes}\n\nCancellazione: ${reason || 'Nessun motivo specificato'}` : `Cancellazione: ${reason || 'Nessun motivo specificato'}`;
      
      db.run(updateQuery, [updatedNotes, id], async function(updateErr) {
        if (updateErr) {
          console.error('Error cancelling booking:', updateErr);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        try {
          // Genera file .ics per cancellazione
          const icsContent = generateBookingICS(booking, 'CANCELLED');
          const icsFilename = generateICSFilename(booking, 'CANCELLED');
          
          // Recupera lista destinatari (cliente + staff + admin)
          const recipientsQuery = `
            SELECT DISTINCT email, role 
            FROM users 
            WHERE role IN ('admin', 'salaprove') AND is_active = 1
            UNION 
            SELECT ? as email, 'client' as role
          `;
          
          db.all(recipientsQuery, [booking.email], async (recipientsErr, recipients) => {
            if (recipientsErr) {
              console.error('Error fetching recipients:', recipientsErr);
              return res.status(500).json({ error: 'Error fetching recipients' });
            }
            
            // Invia email con allegato .ics a tutti i destinatari
            console.log(`📅 Generato file .ics per prenotazione cancellata: ${icsFilename}`);
            console.log(`📧 Destinatari email:`, recipients.map(r => `${r.email} (${r.role})`));
            
            try {
              // Invia email al cliente
              const clientEmail = recipients.find(r => r.role === 'client');
              if (clientEmail) {
                await sendBookingCancellationWithICS(booking, icsContent, icsFilename, reason);
              }
              
              // Invia notifiche staff
              const staffEmails = recipients.filter(r => r.role !== 'client').map(r => r.email);
              if (staffEmails.length > 0) {
                await sendStaffNotificationWithICS(booking, icsContent, icsFilename, 'CANCELLED', staffEmails);
              }
              
              res.json({
                success: true,
                message: 'Booking cancelled successfully',
                icsGenerated: true,
                icsFilename: icsFilename,
                emailsSent: recipients.length,
                clientEmailSent: !!clientEmail,
                staffEmailsSent: staffEmails.length,
                reason: reason || 'Nessun motivo specificato'
              });
              
            } catch (emailError) {
              console.error('❌ Errore nell\'invio email:', emailError);
              // Non bloccare la cancellazione se c'è un errore nell'email
              res.json({
                success: true,
                message: 'Booking cancelled successfully (but email sending failed)',
                icsGenerated: true,
                icsFilename: icsFilename,
                emailsSent: 0,
                emailError: emailError.message,
                reason: reason || 'Nessun motivo specificato'
              });
            }
          });
          
        } catch (icsError) {
          console.error('Error generating .ics file:', icsError);
          // Non bloccare la cancellazione se c'è un errore nella generazione .ics
          res.json({
            success: true,
            message: 'Booking cancelled successfully (but .ics generation failed)',
            icsGenerated: false,
            reason: reason || 'Nessun motivo specificato'
          });
        }
      });
    });
    
  } catch (error) {
    console.error('Error in booking cancellation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/stats - Get booking statistics
router.get('/stats/overview', (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_bookings,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_bookings,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_bookings,
      COUNT(CASE WHEN date >= date('now') THEN 1 END) as upcoming_bookings,
      COUNT(CASE WHEN date < date('now') THEN 1 END) as past_bookings,
      AVG(duration) as avg_duration,
      SUM(CASE WHEN status = 'approved' THEN duration ELSE 0 END) as total_hours_booked
    FROM bookings
  `;
  
  db.get(statsQuery, [], (err, stats) => {
    if (err) {
      console.error('Error fetching booking stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(stats);
  });
});

// GET /api/bookings/client/:email - Get bookings for a specific client
router.get('/client/:email', (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const query = `
    SELECT * FROM bookings 
    WHERE email = ? 
    ORDER BY date DESC, start_time ASC
  `;
  
  db.all(query, [email], (err, rows) => {
    if (err) {
      console.error('Error fetching client bookings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      email,
      totalBookings: rows.length,
      bookings: rows
    });
  });
});

// GET /api/bookings/date/:date - Get all bookings for a specific date
router.get('/date/:date', (req, res) => {
  const { date } = req.params;
  
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  const query = `
    SELECT * FROM bookings 
    WHERE date = ? 
    ORDER BY start_time ASC
  `;
  
  db.all(query, [date], (err, rows) => {
    if (err) {
      console.error('Error fetching date bookings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      date,
      totalBookings: rows.length,
      bookings: rows
    });
  });
});

// Helper function to add hours to time
function addHours(time, hours) {
  const [hour, minute] = time.split(':').map(Number);
  const newHour = (hour + hours) % 24;
  return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// ========================================
// AVAILABILITY BLOCKS MANAGEMENT
// ========================================

// GET /api/availability-blocks - Get all availability blocks
router.get('/availability-blocks', (req, res) => {
  const query = `
    SELECT ab.*, u.username as created_by_username
    FROM availability_blocks ab
    LEFT JOIN users u ON ab.created_by = u.id
    ORDER BY ab.start_date DESC, ab.start_time ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching availability blocks:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// POST /api/availability-blocks - Create new availability block
router.post('/availability-blocks', (req, res) => {
  const { start_date, end_date, start_time, end_time, reason } = req.body;
  
  // Validation
  if (!start_date || !end_date || !reason) {
    return res.status(400).json({ error: 'Start date, end date, and reason are required' });
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  // Validate time format if provided
  if (start_time && !/^\d{2}:\d{2}$/.test(start_time)) {
    return res.status(400).json({ error: 'Invalid start time format. Use HH:MM' });
  }
  if (end_time && !/^\d{2}:\d{2}$/.test(end_time)) {
    return res.status(400).json({ error: 'Invalid end time format. Use HH:MM' });
  }
  
  // Validate date logic
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (startDate < today) {
    return res.status(400).json({ error: 'Cannot create blocks for dates in the past' });
  }
  
  if (endDate < startDate) {
    return res.status(400).json({ error: 'End date cannot be before start date' });
  }
  
  // Check for conflicts with existing bookings
  const conflictQuery = `
    SELECT COUNT(*) as conflict_count
    FROM bookings 
    WHERE date BETWEEN ? AND ? 
    AND status IN ('pending', 'approved')
    AND (
      (? IS NULL AND ? IS NULL) OR
      (start_time < ? AND start_time + (duration || ' hours') > ?) OR
      (start_time < ? AND start_time + (duration || ' hours') > ?)
    )
  `;
  
  db.get(conflictQuery, [
    start_date, end_date, 
    start_time, end_time,
    end_time, start_time, start_time, end_time
  ], (err, result) => {
    if (err) {
      console.error('Error checking conflicts:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.conflict_count > 0) {
      return res.status(400).json({ 
        error: 'Cannot create block: conflicts with existing approved or pending bookings' 
      });
    }
    
    // Insert the availability block
    const insertQuery = `
      INSERT INTO availability_blocks (start_date, end_date, start_time, end_time, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertQuery, [start_date, end_date, start_time, end_time, reason, 1], function(err) {
      if (err) {
        console.error('Error creating availability block:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        success: true,
        message: 'Availability block created successfully',
        id: this.lastID
      });
    });
  });
});

// PUT /api/availability-blocks/:id - Update availability block
router.put('/availability-blocks/:id', (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, start_time, end_time, reason } = req.body;
  
  // Validation
  if (!start_date || !end_date || !reason) {
    return res.status(400).json({ error: 'Start date, end date, and reason are required' });
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  // Validate time format if provided
  if (start_time && !/^\d{2}:\d{2}$/.test(start_time)) {
    return res.status(400).json({ error: 'Invalid start time format. Use HH:MM' });
  }
  if (end_time && !/^\d{2}:\d{2}$/.test(end_time)) {
    return res.status(400).json({ error: 'Invalid end time format. Use HH:MM' });
  }
  
  // Validate date logic
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (startDate < today) {
    return res.status(400).json({ error: 'Cannot create blocks for dates in the past' });
  }
  
  if (endDate < startDate) {
    return res.status(500).json({ error: 'End date cannot be before start date' });
  }
  
  // Check for conflicts with existing bookings (excluding current block)
  const conflictQuery = `
    SELECT COUNT(*) as conflict_count
    FROM bookings 
    WHERE date BETWEEN ? AND ? 
    AND status IN ('pending', 'approved')
    AND id != ?
    AND (
      (? IS NULL AND ? IS NULL) OR
      (start_time < ? AND start_time + (duration || ' hours') > ?) OR
      (start_time < ? AND start_time + (duration || ' hours') > ?)
    )
  `;
  
  db.get(conflictQuery, [
    start_date, end_date, id,
    start_time, end_time,
    end_time, start_time, start_time, end_time
  ], (err, result) => {
    if (err) {
      console.error('Error checking conflicts:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.conflict_count > 0) {
      return res.status(400).json({ 
        error: 'Cannot update block: conflicts with existing approved or pending bookings' 
      });
    }
    
    // Update the availability block
    const updateQuery = `
      UPDATE availability_blocks 
      SET start_date = ?, end_date = ?, start_time = ?, end_time = ?, reason = ?
      WHERE id = ?
    `;
    
    db.run(updateQuery, [start_date, end_date, start_time, end_time, reason, id], function(err) {
      if (err) {
        console.error('Error updating availability block:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Availability block not found' });
      }
      
      res.json({
        success: true,
        message: 'Availability block updated successfully'
      });
    });
  });
});

// DELETE /api/availability-blocks/:id - Delete availability block
router.delete('/availability-blocks/:id', (req, res) => {
  const { id } = req.params;
  
  const deleteQuery = `DELETE FROM availability_blocks WHERE id = ?`;
  
  db.run(deleteQuery, [id], function(err) {
    if (err) {
      console.error('Error deleting availability block:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Availability block not found' });
    }
    
    res.json({
      success: true,
      message: 'Availability block deleted successfully'
    });
  });
});

export default router;