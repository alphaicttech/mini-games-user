import { promises as fs } from 'fs';
import path from 'path';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { uploadedFiles } from '../../db/schema';
import { env } from '../../env';
import { sha256 } from '../../utils/hash';
import { AppError } from '../../lib/errors';

export const uploadService = {
  async save(companyId: string, file: Express.Multer.File) {
    await fs.mkdir(env.FILE_UPLOAD_DIR, { recursive: true });
    const digest = sha256(file.buffer);
    const ext = path.extname(file.originalname) || '.bin';
    const filename = `${digest}${ext}`;
    const target = path.join(env.FILE_UPLOAD_DIR, filename);
    await fs.writeFile(target, file.buffer);

    const [saved] = await db.insert(uploadedFiles).values({
      companyId,
      storagePath: target,
      originalName: file.originalname,
      mimeType: file.mimetype,
      byteSize: file.size,
      sha256Hash: digest
    }).returning();

    return saved;
  },

  async getById(companyId: string, id: string) {
    const file = await db.query.uploadedFiles.findFirst({
      where: and(eq(uploadedFiles.companyId, companyId), eq(uploadedFiles.id, id))
    });
    if (!file) throw new AppError(404, 'NOT_FOUND', 'File not found');
    return file;
  }
};
