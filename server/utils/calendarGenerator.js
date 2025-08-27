import ical from 'ical-generator';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera un file .ics per una prenotazione della sala prove
 * @param {Object} bookingData - Dati della prenotazione
 * @param {string} action - Azione eseguita (CONFIRMED, MODIFIED, CANCELLED)
 * @returns {string} Contenuto del file .ics
 */
export function generateBookingICS(bookingData, action = 'CONFIRMED') {
  // Calcola data e ora di fine basandosi sulla durata
  const startDate = new Date(bookingData.date + 'T' + bookingData.start_time);
  const endDate = new Date(startDate.getTime() + (bookingData.duration * 60 * 60 * 1000));
  
  // Formatta la durata per la descrizione
  const durationText = bookingData.duration === 1 ? '1 ora' : `${bookingData.duration} ore`;
  
  // Determina il titolo in base all'azione
  let title, status;
  
  switch (action) {
    case 'CONFIRMED':
      title = `Prenotazione Sala Prove - ${bookingData.band_name}`;
      status = 'CONFIRMED';
      break;
    case 'MODIFIED':
      title = `Prenotazione Sala Prove Modificata - ${bookingData.band_name}`;
      status = 'CONFIRMED';
      break;
    case 'CANCELLED':
      title = `Prenotazione Sala Prove Cancellata - ${bookingData.band_name}`;
      status = 'CANCELLED';
      break;
    default:
      title = `Prenotazione Sala Prove - ${bookingData.band_name}`;
      status = 'CONFIRMED';
  }
  
  // Crea la descrizione dettagliata
  const descriptionText = [
    `Band: ${bookingData.band_name}`,
    `Componenti: ${bookingData.members_count || 'Non specificato'}`,
    `Durata: ${durationText}`,
    `Strumenti: ${bookingData.instruments || 'Non specificato'}`,
    `Note: ${bookingData.notes || 'Nessuna nota'}`,
    `Email: ${bookingData.email}`,
    `Telefono: ${bookingData.phone || 'Non specificato'}`
  ].join('\n');
  
  // Genera il calendario
  const calendar = ical({
    name: 'Ex Mattatoio - Sala Prove',
    description: 'Prenotazioni sala prove musicale',
    timezone: 'Europe/Rome'
  });
  
  // Crea l'evento
  const event = calendar.createEvent({
    start: startDate,
    end: endDate,
    summary: title,
    description: descriptionText,
    location: 'Exmatta - Sala Prove',
    organizer: {
      name: 'Ex Mattatoio',
      email: 'info@exmatta.it'
    },
    status: status,
    uid: `booking-${bookingData.id}@exmatta.it`,
    url: `https://exmatta.it/sala-prove`
  });
  
  // Aggiungi categorie
  event.createCategory({ name: 'Sala Prove' });
  event.createCategory({ name: 'Musica' });
  
  // Aggiungi allarme (1 ora prima)
  event.createAlarm({
    type: 'display',
    trigger: 60 * 60, // 1 ora prima
    description: `Ricorda: Prenotazione sala prove tra 1 ora`
  });
  
  return calendar.toString();
}

/**
 * Genera un nome file per il download
 * @param {Object} bookingData - Dati della prenotazione
 * @param {string} action - Azione eseguita
 * @returns {string} Nome del file
 */
export function generateICSFilename(bookingData, action = 'CONFIRMED') {
  const date = new Date(bookingData.date).toISOString().split('T')[0];
  const time = bookingData.start_time.replace(':', '');
  const actionText = action.toLowerCase();
  
  return `sala-prove-${actionText}-${date}-${time}-${bookingData.band_name.replace(/\s+/g, '-')}.ics`;
}

/**
 * Salva il file .ics su disco (opzionale, per debug)
 * @param {string} icsContent - Contenuto del file .ics
 * @param {string} filename - Nome del file
 * @returns {string} Percorso del file salvato
 */
export function saveICSFile(icsContent, filename) {
  const filePath = path.join(__dirname, '../../temp', filename);
  
  // Crea la cartella temp se non esiste
  const tempDir = path.dirname(filePath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Salva il file
  fs.writeFileSync(filePath, icsContent, 'utf8');
  return filePath;
}
