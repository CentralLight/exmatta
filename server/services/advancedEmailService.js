import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione transporter email
let transporter = null;

/**
 * Inizializza il transporter email
 */
function initializeTransporter() {
  if (transporter) return transporter;
  
  // Configurazione SMTP esplicita per Gmail (compatibile con Nodemailer 7.x)
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'poloalessio00@gmail.com',
      pass: process.env.EMAIL_PASS || 'skkh jhul qtrv eomz'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  return transporter;
}

/**
 * Verifica la connessione email
 */
async function verifyConnection() {
  try {
    const trans = initializeTransporter();
    await trans.verify();
    console.log('✅ Connessione email verificata');
    return true;
  } catch (error) {
    console.error('❌ Errore verifica connessione email:', error.message);
    return false;
  }
}

/**
 * Genera template HTML per email conferma prenotazione
 */
function generateConfirmationTemplate(bookingData) {
  const startDate = new Date(bookingData.date + 'T' + bookingData.start_time);
  const endDate = new Date(startDate.getTime() + (bookingData.duration * 60 * 60 * 1000));
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ff6b35; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .highlight { color: #ff6b35; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 Prenotazione Sala Prove Confermata</h1>
          <p>Ex Mattatoio - Sala Prove Musicale</p>
        </div>
        
        <div class="content">
          <p>Ciao <span class="highlight">${bookingData.band_name}</span>!</p>
          
          <p>La tua prenotazione per la sala prove è stata <strong>confermata</strong>.</p>
          
          <div class="booking-details">
            <h3>📅 Dettagli Prenotazione:</h3>
            <p><strong>Data:</strong> ${startDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Orario:</strong> ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Durata:</strong> ${bookingData.duration} ${bookingData.duration === 1 ? 'ora' : 'ore'}</p>
            <p><strong>Luogo:</strong> Exmatta - Sala Prove</p>
            <p><strong>Indirizzo:</strong> Via Ex Mattatoio, Milano</p>
          </div>
          
          <div class="booking-details">
            <h3>👥 Informazioni Band:</h3>
            <p><strong>Componenti:</strong> ${bookingData.members_count || 'Non specificato'}</p>
            <p><strong>Strumenti:</strong> ${bookingData.instruments || 'Non specificato'}</p>
            <p><strong>Note:</strong> ${bookingData.notes || 'Nessuna nota'}</p>
          </div>
          
          <p><strong>📎 Allegato:</strong> Trovi il file calendario (.ics) allegato a questa email per aggiungere l'evento al tuo calendario.</p>
          
          <p><strong>⚠️ Importante:</strong></p>
          <ul>
            <li>Presentati 10 minuti prima dell'orario prenotato</li>
            <li>Porta i tuoi strumenti personali</li>
            <li>Rispetta gli orari per non interferire con altre prenotazioni</li>
            <li>In caso di problemi, contatta: <a href="mailto:info@exmatta.it">info@exmatta.it</a></li>
          </ul>
          
          <p>Grazie per aver scelto Ex Mattatoio!</p>
          <p>🎸 Buona musica!</p>
        </div>
        
        <div class="footer">
          <p>Ex Mattatoio - Sala Prove Musicale</p>
          <p>Email: info@exmatta.it | Tel: +39 02 1234567</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera template HTML per email cancellazione prenotazione
 */
function generateCancellationTemplate(bookingData, reason) {
  const startDate = new Date(bookingData.date + 'T' + bookingData.start_time);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #dc3545; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .highlight { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Prenotazione Sala Prove Cancellata</h1>
          <p>Ex Mattatoio - Sala Prove Musicale</p>
        </div>
        
        <div class="content">
          <p>Ciao <span class="highlight">${bookingData.band_name}</span>!</p>
          
          <p>La tua prenotazione per la sala prove è stata <strong>cancellata</strong>.</p>
          
          <div class="booking-details">
            <h3>📅 Prenotazione Cancellata:</h3>
            <p><strong>Data:</strong> ${startDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Orario:</strong> ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Durata:</strong> ${bookingData.duration} ${bookingData.duration === 1 ? 'ora' : 'ore'}</p>
            <p><strong>Luogo:</strong> Exmatta - Sala Prove</p>
          </div>
          
          <div class="booking-details">
            <h3>📝 Motivo Cancellazione:</h3>
            <p>${reason || 'Nessun motivo specificato'}</p>
          </div>
          
          <p><strong>📎 Allegato:</strong> Trovi il file calendario (.ics) allegato a questa email per aggiornare il tuo calendario.</p>
          
          <p>Se desideri prenotare un nuovo slot, visita il nostro sito web o contattaci.</p>
          
          <p>Per qualsiasi domanda, contatta: <a href="mailto:info@exmatta.it">info@exmatta.it</a></p>
        </div>
        
        <div class="footer">
          <p>Ex Mattatoio - Sala Prove Musicale</p>
          <p>Email: info@exmatta.it | Tel: +39 02 1234567</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera template HTML per email modifica prenotazione
 */
function generateModificationTemplate(bookingData, oldData) {
  const startDate = new Date(bookingData.date + 'T' + bookingData.start_time);
  const endDate = new Date(startDate.getTime() + (bookingData.duration * 60 * 60 * 1000));
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .highlight { color: #ffc107; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✏️ Prenotazione Sala Prove Modificata</h1>
          <p>Ex Mattatoio - Sala Prove Musicale</p>
        </div>
        
        <div class="content">
          <p>Ciao <span class="highlight">${bookingData.band_name}</span>!</p>
          
          <p>La tua prenotazione per la sala prove è stata <strong>modificata</strong>.</p>
          
          <div class="booking-details">
            <h3>📅 Nuovi Dettagli Prenotazione:</h3>
            <p><strong>Data:</strong> ${startDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Orario:</strong> ${startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Durata:</strong> ${bookingData.duration} ${bookingData.duration === 1 ? 'ora' : 'ore'}</p>
            <p><strong>Luogo:</strong> Exmatta - Sala Prove</p>
          </div>
          
          <p><strong>📎 Allegato:</strong> Trovi il file calendario (.ics) allegato a questa email per aggiornare il tuo calendario.</p>
          
          <p>Per qualsiasi domanda, contatta: <a href="mailto:info@exmatta.it">info@exmatta.it</a></p>
        </div>
        
        <div class="footer">
          <p>Ex Mattatoio - Sala Prove Musicale</p>
          <p>Email: info@exmatta.it | Tel: +39 02 1234567</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Invia email con allegato .ics
 */
async function sendEmailWithICS(options) {
  try {
    const trans = initializeTransporter();
    
    // Verifica connessione
    if (!(await verifyConnection())) {
      throw new Error('Connessione email non disponibile');
    }
    
    const mailOptions = {
      from: `"Ex Mattatoio - Sala Prove" <${process.env.EMAIL_USER || 'noreply@exmatta.it'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: []
    };
    
    // Aggiungi allegato .ics se fornito
    if (options.icsContent && options.icsFilename) {
      mailOptions.attachments.push({
        filename: options.icsFilename,
        content: options.icsContent,
        contentType: 'text/calendar; method=REQUEST; charset=UTF-8'
      });
    }
    
    // Aggiungi allegato .ics se fornito come file
    if (options.icsFilePath && options.icsFilename) {
      mailOptions.attachments.push({
        filename: options.icsFilename,
        path: options.icsFilePath,
        contentType: 'text/calendar; method=REQUEST; charset=UTF-8'
      });
    }
    
    const result = await trans.sendMail(mailOptions);
    console.log(`✅ Email inviata con successo a: ${options.to}`);
    console.log(`📧 Message ID: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
      to: options.to
    };
    
  } catch (error) {
    console.error(`❌ Errore invio email a ${options.to}:`, error.message);
    return {
      success: false,
      error: error.message,
      to: options.to
    };
  }
}

/**
 * Invia notifica conferma prenotazione con .ics
 */
async function sendBookingConfirmationWithICS(bookingData, icsContent, icsFilename) {
  const html = generateConfirmationTemplate(bookingData);
  
  return await sendEmailWithICS({
    to: bookingData.email,
    subject: `✅ Prenotazione Confermata - ${bookingData.band_name} - ${bookingData.date}`,
    html: html,
    icsContent: icsContent,
    icsFilename: icsFilename
  });
}

/**
 * Invia notifica cancellazione prenotazione con .ics
 */
async function sendBookingCancellationWithICS(bookingData, icsContent, icsFilename, reason) {
  const html = generateCancellationTemplate(bookingData, reason);
  
  return await sendEmailWithICS({
    to: bookingData.email,
    subject: `❌ Prenotazione Cancellata - ${bookingData.band_name} - ${bookingData.date}`,
    html: html,
    icsContent: icsContent,
    icsFilename: icsFilename
  });
}

/**
 * Invia notifica modifica prenotazione con .ics
 */
async function sendBookingModificationWithICS(bookingData, icsContent, icsFilename, oldData) {
  const html = generateModificationTemplate(bookingData, oldData);
  
  return await sendEmailWithICS({
    to: bookingData.email,
    subject: `✏️ Prenotazione Modificata - ${bookingData.band_name} - ${bookingData.date}`,
    html: html,
    icsContent: icsContent,
    icsFilename: icsFilename
  });
}

/**
 * Invia notifica staff con .ics
 */
async function sendStaffNotificationWithICS(bookingData, icsContent, icsFilename, action, staffEmails) {
  const actionText = {
    'CONFIRMED': 'confermata',
    'CANCELLED': 'cancellata',
    'MODIFIED': 'modificata'
  }[action] || 'aggiornata';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 Notifica Staff - Prenotazione ${actionText}</h1>
          <p>Ex Mattatoio - Sala Prove Musicale</p>
        </div>
        
        <div class="content">
          <p>Una prenotazione sala prove è stata <strong>${actionText}</strong>.</p>
          
          <h3>📅 Dettagli Prenotazione:</h3>
          <ul>
            <li><strong>Band:</strong> ${bookingData.band_name}</li>
            <li><strong>Data:</strong> ${bookingData.date}</li>
            <li><strong>Orario:</strong> ${bookingData.start_time}</li>
            <li><strong>Durata:</strong> ${bookingData.duration} ore</li>
            <li><strong>Email:</strong> ${bookingData.email}</li>
            <li><strong>Telefono:</strong> ${bookingData.phone || 'Non specificato'}</li>
          </ul>
          
          <p><strong>📎 Allegato:</strong> File calendario (.ics) allegato per aggiornare il calendario staff.</p>
        </div>
        
        <div class="footer">
          <p>Ex Mattatoio - Sala Prove Musicale</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Invia a tutti gli indirizzi staff
  const results = [];
  for (const email of staffEmails) {
    const result = await sendEmailWithICS({
      to: email,
      subject: `📢 Prenotazione ${actionText} - ${bookingData.band_name} - ${bookingData.date}`,
      html: html,
      icsContent: icsContent,
      icsFilename: icsFilename
    });
    results.push(result);
  }
  
  return results;
}

export {
  initializeTransporter,
  verifyConnection,
  sendEmailWithICS,
  sendBookingConfirmationWithICS,
  sendBookingCancellationWithICS,
  sendBookingModificationWithICS,
  sendStaffNotificationWithICS
};
