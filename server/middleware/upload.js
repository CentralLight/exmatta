import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione storage per multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Utilizza la cartella public/images/news esistente
    const uploadPath = path.join(__dirname, '../../public/images/news');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Genera un nome file univoco con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'news-' + uniqueSuffix + ext);
  }
});

// Filtro per i tipi di file consentiti
const fileFilter = (req, file, cb) => {
  // Controlla se il file è un'immagine
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo le immagini sono consentite!'), false);
  }
};

// Configurazione multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite di 5MB
  }
});

export default upload;
