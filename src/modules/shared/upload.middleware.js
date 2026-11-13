const multer = require('multer');

/**
 * Middleware de Upload com Multer:
 * - Armazenamento em memória (memoryStorage)
 * - Limite de 5 MB por arquivo
 * - Filtro de formato: aceita apenas image/jpeg, image/png e image/webp
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Formato de imagem não permitido');
      error.statusCode = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

module.exports = upload;
