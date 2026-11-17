import mockApi from './mockApi';

// 백엔드 없이 화면만 볼 때는 true로 바꾸기
const USE_MOCK = false;
const SERVER_URL = 'http://localhost:8080';
const BASE_URL = `${SERVER_URL}/api`;

export const DEFAULT_IMAGE = `${process.env.PUBLIC_URL}/images/default-drink.svg`;

/*
 * 백엔드 API 목록
 *
 * POST   /api/signup                { username, password }        -> { userId, username }  (닉네임 중복이면 409)
 * POST   /api/login                 { username, password }        -> { userId, username }  (틀리면 401)
 * GET    /api/cafes                                               -> [{ cafeId, cafeName }]
 * GET    /api/cafes/{cafeId}/drinks                               -> [{ drinkId, cafeId, category, drinkName, basePrice }]
 * GET    /api/cafes/{cafeId}/options                              -> [{ optionId, cafeId, category, optionName, extraPrice }]
 * POST   /api/images                (multipart, file)             -> { imageId, imageUrl }  (jpg/png/webp/gif, 5MB 이하)
 * GET    /api/images/{imageId}                                    -> 사진 파일 (<img src>에 사용)
 * GET    /api/recipes?sort=popular|latest&cafeId=1               -> [레시피]
 * GET    /api/recipes/{recipeId}?userId=1                         -> 레시피
 * POST   /api/recipes               { userId, drinkId, recipeName, description, imageId, options: [{ optionId, quantity }] } -> 레시피
 * POST   /api/recipes/{recipeId}/likes   { userId }
 * DELETE /api/recipes/{recipeId}/likes?userId=1
 *
 * 레시피 = { recipeId, recipeName, description, imageUrl, createdAt, cafeId, cafeName, drinkId, drinkName, basePrice,
 *           username, options: [{ optionId, optionName, extraPrice, quantity }], totalPrice, likes, liked }
 */

async function request(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData; // 사진 업로드는 JSON이 아니라 FormData로 보냄
  const res = await fetch(BASE_URL + path, {
    method,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();

  if (!res.ok) {
    let message = `요청에 실패했습니다 (${res.status})`;
    try {
      message = JSON.parse(text).message || message;
    } catch { }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : null;
}

// 서버가 준 사진 주소(/api/images/1)를 <img>에 바로 쓸 수 있는 주소로 바꿈
export function imageSrc(imageUrl) {
  if (!imageUrl) return DEFAULT_IMAGE;
  return imageUrl.startsWith('/') ? SERVER_URL + imageUrl : imageUrl;
}

const realApi = {
  signup: (username, password) => request('/signup', { method: 'POST', body: { username, password } }),
  login: (username, password) => request('/login', { method: 'POST', body: { username, password } }),
  getCafes: () => request('/cafes'),
  getDrinks: (cafeId) => request(`/cafes/${cafeId}/drinks`),
  getOptions: (cafeId) => request(`/cafes/${cafeId}/options`),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/images', { method: 'POST', body: form });
  },
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
