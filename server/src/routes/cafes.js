import { Router } from 'express';
import { pool } from '../db.js';
import { toId } from '../errors.js';

const router = Router();

// GET /api/cafes -> [{ cafeId, cafeName }]
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT cafe_id AS cafeId, cafe_name AS cafeName FROM cafes ORDER BY cafe_id'
  );
  res.json(rows);
});

// GET /api/cafes/:cafeId/drinks -> [{ drinkId, cafeId, category, drinkName, basePrice }]
router.get('/:cafeId/drinks', async (req, res) => {
  const cafeId = toId(req.params.cafeId, '카페를 찾을 수 없어요.', 404);
  const [rows] = await pool.execute(
    `SELECT drink_id   AS drinkId,
            cafe_id    AS cafeId,
            category,
            drink_name AS drinkName,
            base_price AS basePrice
       FROM drinks
      WHERE cafe_id = ?
      ORDER BY drink_id`,
    [cafeId]
  );
  res.json(rows);
});

// GET /api/cafes/:cafeId/options -> [{ optionId, cafeId, category, optionName, extraPrice }]
router.get('/:cafeId/options', async (req, res) => {
  const cafeId = toId(req.params.cafeId, '카페를 찾을 수 없어요.', 404);
  const [rows] = await pool.execute(
    `SELECT option_id   AS optionId,
            cafe_id     AS cafeId,
            category,
            option_name AS optionName,
            extra_price AS extraPrice
       FROM options
      WHERE cafe_id = ?
      ORDER BY option_id`,
    [cafeId]
  );
  res.json(rows);
});

export default router;
