// 백엔드 API가 없을 때 쓰는 가짜 데이터 (새로고침하면 처음 상태로 돌아감)

const cafes = [
  { cafeId: 1, cafeName: '스타벅스' },
  { cafeId: 2, cafeName: '메가커피' },
];

const drinks = [
  { drinkId: 1, cafeId: 1, category: '커피', drinkName: '아이스 카페 아메리카노', basePrice: 4700 },
  { drinkId: 2, cafeId: 1, category: '커피', drinkName: '카페 라떼', basePrice: 5000 },
  { drinkId: 3, cafeId: 1, category: '프라푸치노', drinkName: '자바 칩 프라푸치노', basePrice: 6300 },
  { drinkId: 4, cafeId: 2, category: '커피', drinkName: '아메리카노', basePrice: 2000 },
  { drinkId: 5, cafeId: 2, category: '커피', drinkName: '카페라떼', basePrice: 2900 },
  { drinkId: 6, cafeId: 2, category: '스무디', drinkName: '딸기 스무디', basePrice: 3900 },
];

const options = [
  { optionId: 1, cafeId: 1, category: '샷', optionName: '에스프레소 샷 추가', extraPrice: 600 },
  { optionId: 2, cafeId: 1, category: '시럽', optionName: '바닐라 시럽', extraPrice: 600 },
  { optionId: 3, cafeId: 1, category: '시럽', optionName: '헤이즐넛 시럽', extraPrice: 600 },
  { optionId: 4, cafeId: 1, category: '토핑', optionName: '자바칩 추가', extraPrice: 600 },
  { optionId: 5, cafeId: 1, category: '토핑', optionName: '휘핑 크림 추가', extraPrice: 600 },
  { optionId: 6, cafeId: 1, category: '우유', optionName: '오트 우유로 변경', extraPrice: 600 },
  { optionId: 7, cafeId: 2, category: '샷', optionName: '샷 추가', extraPrice: 500 },
  { optionId: 8, cafeId: 2, category: '시럽', optionName: '바닐라 시럽', extraPrice: 500 },
  { optionId: 9, cafeId: 2, category: '토핑', optionName: '연유 추가', extraPrice: 500 },
  { optionId: 10, cafeId: 2, category: '토핑', optionName: '휘핑 추가', extraPrice: 500 },
];

const users = [
  { userId: 1, username: '커피러버' },
  { userId: 2, username: '달달한하루' },
];

const recipes = [
  {
    recipeId: 1, userId: 1, drinkId: 3, recipeName: '자바칩 듬뿍 초코 폭탄',
    description: '자바칩을 두 번 추가하고 휘핑까지 올리면 디저트가 따로 필요 없어요.',
    createdAt: '2026-10-28T14:20:00',
  },
  {
    recipeId: 2, userId: 2, drinkId: 2, recipeName: '바닐라 오트 라떼',
    description: '오트 우유로 바꾸고 바닐라 시럽을 한 번 넣으면 고소하고 부드러워요.',
    createdAt: '2026-10-30T09:10:00',
  },
  {
    recipeId: 3, userId: 1, drinkId: 4, recipeName: '연유 샷 아메리카노',
    description: '샷 하나 추가하고 연유를 넣으면 베트남 커피 느낌이 나요.',
    createdAt: '2026-11-01T18:45:00',
  },
];

const recipeOptions = [
  { recipeId: 1, optionId: 4, quantity: 2 },
  { recipeId: 1, optionId: 5, quantity: 1 },
  { recipeId: 2, optionId: 6, quantity: 1 },
  { recipeId: 2, optionId: 2, quantity: 1 },
  { recipeId: 3, optionId: 7, quantity: 1 },
  { recipeId: 3, optionId: 9, quantity: 1 },
];

const recipeLikes = [
  { userId: 2, recipeId: 1 },
  { userId: 2, recipeId: 3 },
  { userId: 1, recipeId: 2 },
];

// 실제 서버처럼 약간 늦게, 복사본으로 응답
const respond = (data) =>
  new Promise((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 150));
const fail = (message) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), 150));

function toRecipe(recipe, userId) {
  const drink = drinks.find((d) => d.drinkId === recipe.drinkId);
  const cafe = cafes.find((c) => c.cafeId === drink.cafeId);
  const user = users.find((u) => u.userId === recipe.userId);
  const picked = recipeOptions
    .filter((ro) => ro.recipeId === recipe.recipeId)
    .map((ro) => {
      const option = options.find((o) => o.optionId === ro.optionId);
      return {
        optionId: option.optionId,
        optionName: option.optionName,
        extraPrice: option.extraPrice,
        quantity: ro.quantity,
      };
    });
  const likes = recipeLikes.filter((l) => l.recipeId === recipe.recipeId);

  return {
    recipeId: recipe.recipeId,
    recipeName: recipe.recipeName,
    description: recipe.description,
    createdAt: recipe.createdAt,
    cafeId: cafe.cafeId,
    cafeName: cafe.cafeName,
    drinkId: drink.drinkId,
    drinkName: drink.drinkName,
    basePrice: drink.basePrice,
    username: user.username,
    options: picked,
    totalPrice: drink.basePrice + picked.reduce((sum, o) => sum + o.extraPrice * o.quantity, 0),
    likes: likes.length,
    liked: likes.some((l) => l.userId === userId),
  };
}

const mockApi = {
  login(username) {
    let user = users.find((u) => u.username === username);
    if (!user) {
      user = { userId: users.length + 1, username };
      users.push(user);
    }
    return respond(user);
  },

  getCafes: () => respond(cafes),
  getDrinks: (cafeId) => respond(drinks.filter((d) => d.cafeId === cafeId)),
  getOptions: (cafeId) => respond(options.filter((o) => o.cafeId === cafeId)),

  getRecipes({ cafeId, sort }) {
    const list = recipes.map((r) => toRecipe(r)).filter((r) => !cafeId || r.cafeId === cafeId);
    if (sort === 'latest') {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      list.sort((a, b) => b.likes - a.likes);
    }
    return respond(list);
  },

  getRecipe(recipeId, userId) {
    const recipe = recipes.find((r) => r.recipeId === recipeId);
    return recipe ? respond(toRecipe(recipe, userId)) : fail('레시피를 찾을 수 없어요.');
  },

  createRecipe({ userId, drinkId, recipeName, description, options: picked }) {
    const recipe = {
      recipeId: recipes.length + 1,
      userId,
      drinkId,
      recipeName,
      description,
      createdAt: new Date().toISOString().slice(0, 19),
    };
    recipes.push(recipe);
    picked.forEach((p) => recipeOptions.push({ recipeId: recipe.recipeId, ...p }));
    return respond(toRecipe(recipe, userId));
  },

  likeRecipe(recipeId, userId) {
    if (!recipeLikes.some((l) => l.recipeId === recipeId && l.userId === userId)) {
      recipeLikes.push({ userId, recipeId });
    }
    return respond(null);
  },

  unlikeRecipe(recipeId, userId) {
    const index = recipeLikes.findIndex((l) => l.recipeId === recipeId && l.userId === userId);
    if (index >= 0) recipeLikes.splice(index, 1);
    return respond(null);
  },
};

export default mockApi;
