const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

/**
 * Serviço Compartilhado de Processamento de Imagens:
 * - Otimiza e redimensiona imagens (largura máx 800px)
 * - Converte para formato WebP com compressão de qualidade 80
 * - Salva o arquivo em uploads/dishes/ e retorna a URL relativa
 */
async function optimizeImage(buffer) {
  const filename = `${crypto.randomUUID()}.webp`;
  const directory = path.resolve(process.cwd(), 'uploads', 'dishes');

  await fs.mkdir(directory, {
    recursive: true,
  });

  const filePath = path.join(directory, filename);

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

  return `/uploads/dishes/${filename}`;
}

module.exports = {
  optimizeImage,
};
