import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';

const router = Router();

// POST /api/signup  { username, password } -> { userId, username }
router.post('/signup', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (!username) throw new HttpError(400, '닉네임을 입력해주세요.');
  if (username.length > 50) throw new HttpError(400, '닉네임은 50자 이하로 입력해주세요.');
  if (password.length < 8 || password.length > 64) throw new HttpError(400, '비밀번호는 8~64자로 입력해주세요.');

  const [found] = await pool.execute('SELECT user_id FROM users WHERE username = ?', [username]);
  if (found.length > 0) throw new HttpError(409, '이미 사용 중인 닉네임이에요.');

  // 비밀번호는 그대로 저장하지 않고 BCrypt로 암호화해서 저장
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, passwordHash]
  );

  res.status(201).json({ userId: result.insertId, username });
});

// POST /api/login  { username, password } -> { userId, username }
router.post('/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (!username) throw new HttpError(400, '닉네임을 입력해주세요.');
  if (!password) throw new HttpError(400, '비밀번호를 입력해주세요.');

  const [rows] = await pool.execute(
    'SELECT user_id, username, password_hash FROM users WHERE username = ?',
    [username]
  );
  const user = rows[0];

  // 닉네임이 없을 때와 비밀번호가 틀렸을 때 같은 메시지 (어느 쪽이 틀렸는지 알려주지 않음)
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, '닉네임 또는 비밀번호가 맞지 않아요.');
  }

  res.json({ userId: user.user_id, username: user.username });
});

export default router;
