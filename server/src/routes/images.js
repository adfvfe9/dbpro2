import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { HttpError, toId } from '../errors.js';

const router = Router();

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 업로드한 파일을 디스크에 저장하지 않고 메모리에 받아서 바로 DB에 넣음 (5MB까지)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/images  (multipart, 필드 이름 file) -> { imageId, imageUrl }
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(400, '사진을 골라주세요.');
  if (!IMAGE_TYPES.includes(req.file.mimetype)) {
    throw new HttpError(400, 'jpg, png, webp, gif 사진만 올릴 수 있어요.');
  }

  const [result] = await pool.execute(
    'INSERT INTO images (content_type, data) VALUES (?, ?)',
    [req.file.mimetype, req.file.buffer]
  );

  const imageId = result.insertId;
  res.status(201).json({ imageId, imageUrl: `/api/images/${imageId}` });
});

// GET /api/images/:imageId -> 사진 파일 (<img src>에 사용)
router.get('/:imageId', async (req, res) => {
  const imageId = toId(req.params.imageId, '사진을 찾을 수 없어요.', 404);
  const [rows] = await pool.execute(
    'SELECT content_type, data FROM images WHERE image_id = ?',
    [imageId]
  );
  if (rows.length === 0) throw new HttpError(404, '사진을 찾을 수 없어요.');

  // 사진은 바뀌지 않으니까 브라우저가 30일 동안 저장해두게 함
  res.set('Cache-Control', 'public, max-age=2592000');
  res.type(rows[0].content_type).send(rows[0].data);
});

export default router;
