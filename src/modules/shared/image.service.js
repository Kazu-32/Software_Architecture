const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

/**
 * Serviço Compartilhado de Processamento de Imagens:
 * Reutilizado por todos os módulos (dishes, auth/users, etc.).
 * - Otimiza e redimensiona imagens (largura máx 800px)
 * - Corrige orientação EXIF com .rotate()
 * - Converte para formato WebP com qualidade 80
 * - Salva o arquivo em uploads/<folder>/ e retorna a URL relativa
 */
async function optimizeImage(buffer, folder = 'dishes') {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    const error = new Error('Buffer de imagem inválido ou vazio');
    error.statusCode = 400;
    throw error;
  }

  const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, '') || 'dishes';
  const filename = `${crypto.randomUUID()}.webp`;
  const directory = path.resolve(process.cwd(), 'uploads', safeFolder);

  await fs.mkdir(directory, {
    recursive: true,
  });

  const filePath = path.join(directory, filename);

  try {
    await sharp(buffer)
      .rotate()
      .resize({
        width: 800,
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
      })
      .toFile(filePath);
  } catch (err) {
    const error = new Error('Não foi possível processar o arquivo de imagem enviado');
    error.statusCode = 400;
    throw error;
  }

  return `/uploads/${safeFolder}/${filename}`;
}

/**
 * Remove com segurança uma imagem antiga armazenada em uploads/.
 * Ignora URLs nulas, externas ou arquivos inexistentes.
 */
async function deleteImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) {
    return;
  }

  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const relativePath = imageUrl.replace(/^\/uploads\//, '');
  const resolvedPath = path.resolve(uploadsRoot, relativePath);

  // Garante que não há path traversal para fora de uploads/
  if (!resolvedPath.startsWith(uploadsRoot + path.sep)) {
    return;
  }

  try {
    await fs.unlink(resolvedPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[ImageService] Não foi possível remover imagem antiga:', err.message);
    }
  }
}

module.exports = {
  optimizeImage,
  deleteImage,
};
