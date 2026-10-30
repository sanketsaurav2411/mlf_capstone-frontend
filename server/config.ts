import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const port = Number(process.env.PORT || 3000);
export const jwtSecret =
  process.env.JWT_SECRET || 'c408155ef4fa82c05a6ecc65aff459bf95ce7a408f8eabd8e857ecd3cef13fcf';
export const corsOrigin = process.env.CORS_ORIGIN || '*';
export const uploadDir = path.join(__dirname, '../../uploads');
export const maxUploadSize = 5 * 1024 * 1024;
