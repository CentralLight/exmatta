// Configurazione email
export const emailConfig = {
	EMAIL_USER: process.env.EMAIL_USER,
	EMAIL_PASS: process.env.EMAIL_PASS,
	ADMIN_EMAIL: process.env.ADMIN_EMAIL, // Opzionale, ora viene preso dal database
	ADMIN_DASHBOARD_URL: process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000/admin',
	BOOKING_STATUS_URL: process.env.BOOKING_STATUS_URL || 'http://localhost:3000/booking-status',
	COURSE_REGISTRATION_URL: process.env.COURSE_REGISTRATION_URL || 'http://localhost:3000/courses',
	NEWS_SUBSCRIPTION_URL: process.env.NEWS_SUBSCRIPTION_URL || 'http://localhost:3000/news'
};

// Validazione configurazione email
export const validateEmailConfig = () => {
	const required = ['EMAIL_USER', 'EMAIL_PASS'];
	const missing = required.filter(key => !emailConfig[key]);
	
	if (missing.length > 0) {
		console.warn('⚠️ Configurazione email incompleta. Variabili mancanti:', missing.join(', '));
		console.warn('⚠️ Le funzioni email potrebbero non funzionare correttamente');
		return false;
	}
	
	console.log('✅ Configurazione email validata');
	return true;
};
