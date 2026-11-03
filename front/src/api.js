import mockApi from './mockApi';

// 백엔드 API가 완성되면 false로 바꾸기
const USE_MOCK = true;
const BASE_URL = 'http://localhost:8080/api';

/*
 * 백엔드가 만들어야 하는 API 목록
 *
 * POST   /api/users                 { username }                  -> { userId, username }  (없으면 가입, 있으면 그 유저 반환)
 * GET    /api/cafes                                               -> [{ cafeId, cafeName }]
 * GET    /api/cafes/{cafeId}/drinks                               -> [{ drinkId, cafeId, category, drinkName, basePrice }]
 * GET    /api/cafes/{cafeId}/options                              -> [{ optionId, cafeId, category, optionName, extraPrice }]
 * GET    /api/recipes?sort=popular|latest&cafeId=1               -> [레시피]
 * GET    /api/recipes/{recipeId}?userId=1                         -> 레시피
 * POST   /api/recipes               { userId, drinkId, recipeName, description, options: [{ optionId, quantity }] } -> 레시피
 * POST   /api/recipes/{recipeId}/likes   { userId }
 * DELETE /api/recipes/{recipeId}/likes?userId=1
 *
 * 레시피 = { recipeId, recipeName, description, createdAt, cafeId, cafeName, drinkId, drinkName, basePrice,
 *           username, options: [{ optionId, optionName, extraPrice, quantity }], totalPrice, likes, liked }
 */

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();

  if (!res.ok) {
    let message = `요청에 실패했어요 (${res.status})`;
    try {
      message = JSON.parse(text).message || message;
    } catch {}
    throw new Error(message);
  }
  return text ? JSON.parse(text) : null;
}

const realApi = {
  login: (username) => request('/users', { method: 'POST', body: { username } }),
  getCafes: () => request('/cafes'),
  getDrinks: (cafeId) => request(`/cafes/${cafeId}/drinks`),
  getOptions: (cafeId) => request(`/cafes/${cafeId}/options`),
  getRecipes: ({ cafeId, sort }) => {
    const params = new URLSearchParams({ sort });
    if (cafeId) params.set('cafeId', cafeId);
    return request(`/recipes?${params}`);
  },
  getRecipe: (recipeId, userId) =>
    request(`/recipes/${recipeId}` + (userId ? `?userId=${userId}` : '')),
  createRecipe: (recipe) => request('/recipes', { method: 'POST', body: recipe }),
  likeRecipe: (recipeId, userId) =>
    request(`/recipes/${recipeId}/likes`, { method: 'POST', body: { userId } }),
  unlikeRecipe: (recipeId, userId) =>
    request(`/recipes/${recipeId}/likes?userId=${userId}`, { method: 'DELETE' }),
};

const api = USE_MOCK ? mockApi : realApi;
export default api;
