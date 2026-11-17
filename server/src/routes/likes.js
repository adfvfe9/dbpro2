import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError, toId } from '../errors.js';

// /api/recipes/:recipeId/likes 에 연결됨 (mergeParams로 :recipeId를 받음)
const router = Router({ mergeParams: true });

async function checkRecipeAndUser(recipeId, userId) {
  const [recipes] = await pool.execute('SELECT recipe_id FROM recipes WHERE recipe_id = ?', [recipeId]);
  if (recipes.length === 0) throw new HttpError(404, '레시피를 찾을 수 없어요.');

  const [users] = await pool.execute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
  if (users.length === 0) throw new HttpError(404, '유저를 찾을 수 없어요.');
}

// POST /api/recipes/:recipeId/likes  { userId }
router.post('/', async (req, res) => {
  const recipeId = toId(req.params.recipeId, '레시피를 찾을 수 없어요.', 404);
  const userId = toId(req.body?.userId, '로그인이 필요해요.');
  await checkRecipeAndUser(recipeId, userId);

  // UNIQUE (user_id, recipe_id) 때문에 이미 눌렀으면 INSERT IGNORE가 그냥 넘어감
  await pool.execute(
    'INSERT IGNORE INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)',
    [userId, recipeId]
  );
  res.status(204).end();
});

// DELETE /api/recipes/:recipeId/likes?userId=1
router.delete('/', async (req, res) => {
  const recipeId = toId(req.params.recipeId, '레시피를 찾을 수 없어요.', 404);
  const userId = toId(req.query.userId, '로그인이 필요해요.');

  // 안 눌렀던 레시피면 지워지는 줄이 없을 뿐 에러는 아님
  await pool.execute(
    'DELETE FROM recipe_likes WHERE user_id = ? AND recipe_id = ?',
    [userId, recipeId]
  );
  res.status(204).end();
});

export default router;
