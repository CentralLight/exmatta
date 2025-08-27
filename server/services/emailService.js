import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email.config.js';
import db from '../config/database.js';

// Funzione per ottenere l'email dell'admin dal database
const getAdminEmail = () => {
  return new Promise((resolve, reject) => {
    // Per ora usa sempre l'email dell'utente per test
    console.log('📧 Uso email utente per test');
    resolve('poloalessio00@gmail.com');
    
    // CODICE ORIGINALE COMMENTATO PER TEST:
    /*
    db.get('SELECT email FROM users WHERE role = "admin" AND email IS NOT NULL LIMIT 1', (err, row) => {
      if (err) {
        console.error('❌ Errore nel recuperare email admin:', err);
        reject(err);
      } else if (row && row.email) {
        resolve(row.email);
      } else {
        // Fallback: usa l'email configurata se non ci sono admin nel database
        console.warn('⚠️ Nessun admin trovato nel database, uso email configurata');
        resolve(emailConfig.EMAIL_USER);
      }
    });
    */
  });
};

// Funzione helper per aggiungere ore a un orario
const addHours = (time, hours) => {
	const [hour, minute] = time.split(':').map(Number);
	const totalMinutes = hour * 60 + minute + hours * 60;
	const newHour = Math.floor(totalMinutes / 60) % 24;
	const newMinute = totalMinutes % 60;
	return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
};

// Configurazione del transporter email
const createTransporter = () => {
	// Valori di fallback per sviluppo se le variabili d'ambiente non sono caricate
	const emailUser = emailConfig.EMAIL_USER || 'poloalessio00@gmail.com';
	const emailPass = emailConfig.EMAIL_PASS || 'skkh jhul qtrv eomz';
	
	console.log('🔧 Configurazione SMTP:', {
		host: 'smtp.gmail.com',
		port: 587,
		user: emailUser,
		pass: emailPass ? '***CONFIGURATA***' : 'MANCANTE'
	});
	
	// Configurazione SMTP esplicita per Gmail (compatibile con Nodemailer 7.x)
	return nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false, // true per 465, false per 587
		auth: {
			user: emailUser,
			pass: emailPass
		},
		tls: {
			rejectUnauthorized: false
		}
	});
};

// Test di connessione SMTP per debug (spostato dopo createTransporter)
const testSMTPConnection = async () => {
	try {
		console.log('🧪 Test connessione SMTP...');
		const transporter = createTransporter();
		await transporter.verify();
		console.log('✅ Connessione SMTP verificata con successo');
		return true;
	} catch (error) {
		console.error('❌ Errore connessione SMTP:', error.message);
		return false;
	}
};

// Testa la connessione all'avvio (dopo che createTransporter è definito)
testSMTPConnection();

// Template base per le email
const createEmailTemplate = (title, content, actionButton = null) => {
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${title}</title>
			<style>
				body { 
					font-family: 'Inter', Arial, sans-serif; 
					line-height: 1.6; 
					color: #333; 
					margin: 0; 
					padding: 0; 
				}
				.container { 
					max-width: 600px; 
					margin: 0 auto; 
					padding: 20px; 
				}
				.header { 
					background: linear-gradient(135deg, #e6332a 0%, #c82922 100%); 
					color: white; 
					padding: 30px; 
					text-align: center; 
					border-radius: 10px 10px 0 0; 
				}
				.content { 
					background: #fff; 
					padding: 30px; 
					border: 1px solid #e1e5e9; 
					border-top: none; 
				}
				.footer { 
					background: #f8f9fa; 
					padding: 20px; 
					text-align: center; 
					border-radius: 0 0 10px 10px; 
					border: 1px solid #e1e5e9; 
					border-top: none; 
				}
				.btn { 
					display: inline-block; 
					background: linear-gradient(135deg, #e6332a 0%, #c82922 100%); 
					color: white; 
					padding: 12px 24px; 
					text-decoration: none; 
					border-radius: 6px; 
					margin: 20px 0; 
				}
				.logo { 
					font-size: 24px; 
					font-weight: bold; 
					margin-bottom: 10px; 
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<div class="logo">Exmatta</div>
					<h1>${title}</h1>
				</div>
				<div class="content">
					${content}
					${actionButton ? `<div style="text-align: center;">${actionButton}</div>` : ''}
				</div>
				<div class="footer">
					<p>Questo messaggio è stato inviato automaticamente da Exmatta</p>
					<p>Non rispondere a questa email</p>
				</div>
			</div>
		</body>
		</html>
	`;
};

// Funzione per inviare email
const sendEmail = async (to, subject, htmlContent) => {
	try {
		// Debug: controlla il parametro to
		if (!to) {
			console.error('❌ ERRORE: Parametro "to" è undefined o null:', { to, subject });
			throw new Error('Email destinatario mancante');
		}
		
		console.log('📧 Invio email a:', to, 'Oggetto:', subject);
		
		// SISTEMA EMAIL REALE - Configurazione SMTP esplicita
		const transporter = createTransporter();
		
		const mailOptions = {
			from: emailConfig.EMAIL_USER,
			to: to,
			subject: subject,
			html: htmlContent
		};

		const result = await transporter.sendMail(mailOptions);
		console.log('✅ Email inviata con successo a:', to);
		try {
			db.run(
				`INSERT INTO email_logs (type, to_email, subject, status) VALUES (?, ?, ?, 'success')`,
				['generic', to, subject]
			);
		} catch (e) {
			console.warn('Warning: failed to log email success', e?.message || e);
		}
		return result;
		
	} catch (error) {
		console.error('❌ Errore nell\'invio email a:', to, error);
		try {
			db.run(
				`INSERT INTO email_logs (type, to_email, subject, status, error) VALUES (?, ?, ?, 'failure', ?)`,
				['generic', to, subject, error?.message || String(error)]
			);
		} catch (e) {
			console.warn('Warning: failed to log email failure', e?.message || e);
		}
		throw error;
	}
};

// Funzione per inviare conferma prenotazione
const sendBookingConfirmation = async (booking) => {
	try {
		// Debug: controlla il parametro booking.email
		if (!booking.email) {
			console.error('❌ ERRORE: Email cliente mancante in booking:', booking);
			throw new Error('Email cliente mancante per conferma prenotazione');
		}
		
		const subject = `✅ Conferma Prenotazione Sala Prove - ${booking.band_name}`;
		
		// Stile 2: Colorato e moderno (scelto dall'utente)
		const htmlColorful = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Conferma Prenotazione</title>
				<style>
					body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(45deg, #e6332a, #c82922, #ff4d44, #ffecec); }
					.container { max-width: 600px; margin: 20px auto; background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
					.header { background: linear-gradient(45deg, #e6332a, #c82922); color: white; padding: 50px 30px; text-align: center; position: relative; }
					.header::before { content: '🎵'; font-size: 60px; position: absolute; top: 20px; right: 30px; opacity: 0.3; }
					.header h1 { margin: 0; font-size: 32px; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
					.content { padding: 40px 30px; }
					.success-badge { background: linear-gradient(45deg, #6BCF7F, #28A745); color: white; padding: 15px 30px; border-radius: 50px; display: inline-block; font-weight: 700; font-size: 18px; margin: 20px 0; box-shadow: 0 5px 15px rgba(107,207,127,0.4); }
					.booking-card { background: linear-gradient(135deg, #e6332a, #c82922); color: white; border-radius: 15px; padding: 30px; margin: 25px 0; box-shadow: 0 10px 30px rgba(230,51,42,0.3); }
					.detail-item { display: flex; align-items: center; margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; }
					.detail-icon { font-size: 24px; margin-right: 15px; }
					.detail-text { flex: 1; }
					.detail-label { font-weight: 600; opacity: 0.9; font-size: 14px; }
					.detail-value { font-size: 18px; font-weight: 700; }
					.tip-box { background: linear-gradient(45deg, #FFD93D, #FF6B35); color: white; padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center; }
					.footer { background: linear-gradient(45deg, #343A40, #6C757D); color: white; text-align: center; padding: 30px; }
					.social-links { margin-top: 20px; }
					.social-links a { color: white; text-decoration: none; margin: 0 10px; font-size: 20px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>🎵 EXMATTA 🎵</h1>
						<p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">La tua prenotazione è confermata!</p>
					</div>
					
					<div class="content">
						<div style="text-align: center;">
							<div class="success-badge">🎉 PRENOTAZIONE APPROVATA! 🎉</div>
						</div>
						
						<h2 style="color: #2C1810; margin-bottom: 30px; text-align: center; font-size: 28px;">
							Ciao ${booking.band_name}! 👋
						</h2>
						
						<div class="booking-card">
							<h3 style="margin: 0 0 25px 0; text-align: center; font-size: 24px;">📋 Dettagli Sessione</h3>
							
							<div class="detail-item">
								<span class="detail-icon">📅</span>
								<div class="detail-text">
									<div class="detail-label">Data</div>
									<div class="detail-value">${new Date(booking.date).toLocaleDateString('it-IT')}</div>
								</div>
							</div>
							
							<div class="detail-item">
								<span class="detail-icon">⏰</span>
								<div class="detail-text">
									<div class="detail-label">Orario</div>
									<div class="detail-value">${booking.start_time} - ${addHours(booking.start_time, booking.duration)}</div>
								</div>
							</div>
							
							<div class="detail-item">
								<span class="detail-icon">⏱️</span>
								<div class="detail-text">
									<div class="detail-label">Durata</div>
									<div class="detail-value">${booking.duration} h${booking.duration > 1 ? 'h' : ''}</div>
								</div>
							</div>
							
							<div class="detail-item">
								<span class="detail-icon">👥</span>
								<div class="detail-text">
									<div class="detail-label">Componenti</div>
									<div class="detail-value">${booking.members_count}</div>
								</div>
							</div>
							
							${booking.notes ? `
							<div class="detail-item">
								<span class="detail-icon">📝</span>
								<div class="detail-text">
									<div class="detail-label">Note</div>
									<div class="detail-value">${booking.notes}</div>
								</div>
							</div>
							` : ''}
						</div>
						
						<div class="tip-box">
							<h4 style="margin: 0 0 15px 0; font-size: 20px;">💡 Pro Tips per la Tua Sessione</h4>
							<p style="margin: 0; font-size: 16px; line-height: 1.5;">
								• Arriva 10 minuti prima ⏰<br>
								• Porta tutto l'equipaggiamento 🎸<br>
								• Prepara il setlist in anticipo 📋<br>
								• Divertiti e fai rock! 🤘
							</p>
						</div>
						
						<div style="text-align: center; margin: 30px 0;">
							<p style="color: #6C757D; font-size: 18px; font-weight: 600;">
								🎯 Pronto a fare la differenza? La sala prove ti aspetta!
							</p>
						</div>
					</div>
					
					<div class="footer">
						<h3 style="margin: 0 0 20px 0;">Exmatta - Sala Prove</h3>
						<div class="social-links">
							<a href="#">📧</a>
							<a href="#">📱</a>
							<a href="#">🌐</a>
						</div>
						<p style="margin: 20px 0 0 0; font-size: 14px; opacity: 0.8;">
							Per domande: ${emailConfig.ADMIN_EMAIL}
						</p>
					</div>
				</div>
			</body>
			</html>
		`;

		// Invia solo l'email con lo stile scelto
		const transporter = createTransporter();
		
		await transporter.sendMail({
			from: emailConfig.EMAIL_USER,
			to: booking.email,
			subject: subject,
			html: htmlColorful
		});

		console.log(`✅ Email conferma inviata con successo a: ${booking.email}`);
		try {
			db.run(
				`INSERT INTO email_logs (type, to_email, subject, status) VALUES (?, ?, ?, 'success')`,
				['booking_confirmation', booking.email, subject]
			);
		} catch (e) {
			console.warn('Warning: failed to log booking confirmation success', e?.message || e);
		}
		return true;
	} catch (error) {
		console.error(`❌ Errore nell'invio email conferma a: ${booking.email}`, error);
		try {
			db.run(
				`INSERT INTO email_logs (type, to_email, subject, status, error) VALUES (?, ?, ?, 'failure', ?)`,
				['booking_confirmation', booking.email, `Conferma Prenotazione - ${booking.band_name}`, error?.message || String(error)]
			);
		} catch (e) {
			console.warn('Warning: failed to log booking confirmation failure', e?.message || e);
		}
		return false;
	}
};

// Funzione per notificare admin di nuova prenotazione
const notifyAdminNewBooking = async (booking) => {
	try {
		// Ottieni l'email admin dal database
		const adminEmail = await getAdminEmail();
		
		const content = `
			<h2>Nuova Richiesta Prenotazione</h2>
			<p>È stata ricevuta una nuova richiesta di prenotazione sala prove.</p>
			
			<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3>Dettagli Richiesta:</h3>
				<p><strong>ID Prenotazione:</strong> ${booking.id}</p>
				<p><strong>Band:</strong> ${booking.band_name}</p>
				<p><strong>Email:</strong> ${booking.email}</p>
				<p><strong>Telefono:</strong> ${booking.phone || 'Non fornito'}</p>
				<p><strong>Data:</strong> ${new Date(booking.date).toLocaleDateString('it-IT')}</p>
				<p><strong>Orario:</strong> ${booking.start_time}</p>
				<p><strong>Durata:</strong> ${booking.duration} ore</p>
				<p><strong>Membri:</strong> ${booking.members_count || 1}</p>
				<p><strong>Stato:</strong> <span style="color: #ffc107;">In Attesa</span></p>
				${booking.notes ? `<p><strong>Note:</strong> ${booking.notes}</p>` : ''}
			</div>
			
			<p>Accedi alla dashboard admin per gestire questa richiesta.</p>
		`;

		const actionButton = `
			<a href="${emailConfig.ADMIN_DASHBOARD_URL}" class="btn">
				Vai alla Dashboard Admin
			</a>
		`;

		return sendEmail(
			adminEmail, 
			'Nuova Richiesta Prenotazione - Exmatta', 
			createEmailTemplate('Nuova Richiesta Prenotazione', content, actionButton)
		);
	} catch (error) {
		console.error('❌ Errore nel recuperare email admin o inviare notifica:', error);
		throw error;
	}
};

export {
	sendEmail,
	sendBookingConfirmation,
	notifyAdminNewBooking,
	createEmailTemplate
};
