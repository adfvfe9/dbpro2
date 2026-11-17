import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError, toId } from '../errors.js';

const router = Router();

// 목록과 상세에서 같이 쓰는 SELECT
// 좋아요 수와 합계 금액(기본 가격 + 옵션 가격 × 수량)은 서브쿼리로 계산
const RECIPE_SELECT = `
  SELECT r.recipe_id   AS recipeId,
    r.recipe_name AS recipeName,
    r.description,
    r.image_id    AS imageId,
    r.created_at  AS createdAt,
    c.cafe_id     AS cafeId,
    c.cafe_name   AS cafeName,
    d.drink_id    AS drinkId,
    d.drink_name  AS drinkName,
    d.base_price  AS basePrice,
    u.username,
    (SELECT COUNT(*)
      FROM recipe_likes l
      WHERE l.recipe_id = r.recipe_id)
      AS likes,
    d.base_price +
    (SELECT COALESCE(SUM(o.extra_price * ro.quantity), 0)
      FROM recipe_options ro
      JOIN options o ON o.option_id = ro.option_id
      WHERE ro.recipe_id = r.recipe_id)
      AS totalPrice
    FROM recipes r
    JOIN drinks d ON d.drink_id = r.drink_id
    JOIN cafes  c ON c.cafe_id  = d.cafe_id
    JOIN users  u ON u.user_id  = r.user_id`;

// 여러 레시피의 옵션을 한 번에 조회해서 { recipeId: [옵션들] } 로 묶음
async function findOptionsByRecipe(recipeIds) {
  const grouped = new Map(recipeIds.map((id) => [id, []]));
  if (recipeIds.length === 0) return grouped;

  // IN (?) 에 배열을 넘기면 (1, 2, 3) 으로 바뀜 (execute가 아니라 query에서만 됨)
  const [rows] = await pool.query(
    `SELECT ro.recipe_id   AS recipeId,
            o.option_id    AS optionId,
            o.option_name  AS optionName,
            o.extra_price  AS extraPrice,
            ro.quantity
      FROM recipe_options ro
      JOIN options o ON o.option_id = ro.option_id
      WHERE ro.recipe_id IN (?)
      ORDER BY ro.id`,
    [recipeIds]
  );
  for (const { recipeId, ...option } of rows) {
    grouped.get(recipeId).push(option);
  }
  return grouped;
}

// DB에서 읽은 한 줄을 프론트가 쓰는 응답 형태로 바꿈
function toResponse(row, options, liked) {
  const { imageId, createdAt, ...rest } = row;
  return {
    ...rest,
    imageUrl: imageId ? `/api/images/${imageId}` : null,
    createdAt: createdAt ? createdAt.replace(' ', 'T') : null, // '2026-11-10 09:00:00' -> '2026-11-10T09:00:00'
    options,
    liked,
  };
}

async function findRecipe(recipeId, userId) {
  const [rows] = await pool.execute(`${RECIPE_SELECT} WHERE r.recipe_id = ?`, [recipeId]);
  if (rows.length === 0) throw new HttpError(404, '레시피를 찾을 수 없어요.');

  let liked = false;
  if (userId) {
    const [likeRows] = await pool.execute(
      'SELECT 1 FROM recipe_likes WHERE recipe_id = ? AND user_id = ?',
      [recipeId, userId]
    );
    liked = likeRows.length > 0;
  }

  const options = await findOptionsByRecipe([recipeId]);
  return toResponse(rows[0], options.get(recipeId), liked);
}

// GET /api/recipes?sort=popular|latest&cafeId=1 -> [레시피]
router.get('/', async (req, res) => {
  const cafeId = req.query.cafeId ? toId(req.query.cafeId, '카페 번호가 올바르지 않아요.') : null;

  // ORDER BY 에는 ? 를 쓸 수 없어서, 정해둔 두 문장 중에서 고름
  const orderBy =
    req.query.sort === 'latest'
      ? 'r.created_at DESC, r.recipe_id DESC'
      : 'likes DESC, r.created_at DESC, r.recipe_id DESC';

  const where = cafeId ? 'WHERE c.cafe_id = ?' : '';
  const [rows] = await pool.execute(
    `${RECIPE_SELECT} ${where} ORDER BY ${orderBy}`,
    cafeId ? [cafeId] : []
  );

  const options = await findOptionsByRecipe(rows.map((row) => row.recipeId));
  res.json(rows.map((row) => toResponse(row, options.get(row.recipeId), false)));
});

// GET /api/recipes/:recipeId?userId=1 -> 레시피 (userId가 있으면 liked도 계산)
router.get('/:recipeId', async (req, res) => {
  const recipeId = toId(req.params.recipeId, '레시피를 찾을 수 없어요.', 404);
  const userId = req.query.userId ? toId(req.query.userId, '유저 번호가 올바르지 않아요.') : null;
  res.json(await findRecipe(recipeId, userId));
});

// POST /api/recipes
// { userId, drinkId, recipeName, description, imageId, options: [{ optionId, quantity }] } -> 레시피
router.post('/', async (req, res) => {
  const body = req.body ?? {};
  const userId = toId(body.userId, '로그인이 필요해요.');
  const drinkId = toId(body.drinkId, '기본 음료를 골라주세요.');
  const recipeName = String(body.recipeName ?? '').trim();
  const description = String(body.description ?? '').trim() || null;
  const imageId = body.imageId == null ? null : toId(body.imageId, '사진을 찾을 수 없어요.');
  const options = Array.isArray(body.options) ? body.options : [];

  // 1. 입력값 확인
  if (!recipeName) throw new HttpError(400, '레시피 이름을 입력해주세요.');
  if (recipeName.length > 100) throw new HttpError(400, '레시피 이름은 100자 이하로 입력해주세요.');
  for (const option of options) {
    toId(option?.optionId, '옵션을 찾을 수 없어요.');
    if (!Number.isInteger(option.quantity) || option.quantity < 1 || option.quantity > 9) {
      throw new HttpError(400, '옵션 수량은 1~9개로 골라주세요.');
    }
  }
  const optionIds = options.map((option) => option.optionId);
  if (new Set(optionIds).size !== optionIds.length) {
    throw new HttpError(400, '같은 옵션이 두 번 들어갔어요.');
  }

  // 2. DB에 실제로 있는지 확인
  const [users] = await pool.execute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
  if (users.length === 0) throw new HttpError(404, '유저를 찾을 수 없어요.');

  const [drinks] = await pool.execute('SELECT cafe_id FROM drinks WHERE drink_id = ?', [drinkId]);
  if (drinks.length === 0) throw new HttpError(404, '음료를 찾을 수 없어요.');

  if (imageId) {
    const [images] = await pool.execute('SELECT image_id FROM images WHERE image_id = ?', [imageId]);
    if (images.length === 0) throw new HttpError(404, '사진을 찾을 수 없어요.');
  }

  if (optionIds.length > 0) {
    const [found] = await pool.query('SELECT option_id, cafe_id FROM options WHERE option_id IN (?)', [optionIds]);
    if (found.length !== optionIds.length) throw new HttpError(404, '옵션을 찾을 수 없어요.');
    // DB가 막아주지 않으니 여기서 음료와 옵션의 카페가 같은지 확인
    if (found.some((option) => option.cafe_id !== drinks[0].cafe_id)) {
      throw new HttpError(400, '음료와 다른 카페의 옵션은 넣을 수 없어요.');
    }
  }

  // 3. 레시피와 옵션을 한 트랜잭션으로 저장 (중간에 실패하면 둘 다 취소)
  const connection = await pool.getConnection();
  let recipeId;
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO recipes (user_id, drink_id, recipe_name, description, image_id) VALUES (?, ?, ?, ?, ?)',
      [userId, drinkId, recipeName, description, imageId]
    );
    recipeId = result.insertId;

    if (options.length > 0) {
      // VALUES ? 에 2차원 배열을 넘기면 (1, 2, 1), (1, 6, 2) 처럼 여러 줄을 한 번에 넣음
      await connection.query(
        'INSERT INTO recipe_options (recipe_id, option_id, quantity) VALUES ?',
        [options.map((option) => [recipeId, option.optionId, option.quantity])]
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  res.status(201).json(await findRecipe(recipeId, userId));
});

export default router;
