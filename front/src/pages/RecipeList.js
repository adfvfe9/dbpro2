import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../format';

function RecipeCard({ recipe }) {
  return (
    <Link to={`/recipes/${recipe.recipeId}`} className="recipe-card">
      <span className="badge">{recipe.cafeName}</span>
      <h3>{recipe.recipeName}</h3>
      <p className="muted">{recipe.drinkName}</p>
      <div className="recipe-card-footer">
        <strong>{formatPrice(recipe.totalPrice)}</strong>
        <span className="likes">♥ {recipe.likes}</span>
      </div>
      <p className="author">by {recipe.username}</p>
    </Link>
  );
}

export default function RecipeList() {
  const [cafes, setCafes] = useState([]);
  const [cafeId, setCafeId] = useState(null);
  const [sort, setSort] = useState('popular');
  const [recipes, setRecipes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCafes().then(setCafes).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let ignore = false;
    setRecipes(null);
    setError('');
    api
      .getRecipes({ cafeId, sort })
      .then((data) => !ignore && setRecipes(data))
      .catch((e) => !ignore && setError(e.message));
    return () => {
      ignore = true;
    };
  }, [cafeId, sort]);

  return (
    <>
      <section className="hero">
        <h1>나만의 카페 꿀조합을 공유해요</h1>
        <p>카페별 커스텀 레시피를 찾아보고, 내 레시피도 올려보세요.</p>
      </section>

      <div className="toolbar">
        <div className="chips">
          <button className={`chip ${cafeId === null ? 'active' : ''}`} onClick={() => setCafeId(null)}>
            전체
          </button>
          {cafes.map((cafe) => (
            <button
              key={cafe.cafeId}
              className={`chip ${cafeId === cafe.cafeId ? 'active' : ''}`}
              onClick={() => setCafeId(cafe.cafeId)}
            >
              {cafe.cafeName}
            </button>
          ))}
        </div>
        <div className="tabs">
          <button className={sort === 'popular' ? 'active' : ''} onClick={() => setSort('popular')}>
            인기순
          </button>
          <button className={sort === 'latest' ? 'active' : ''} onClick={() => setSort('latest')}>
            최신순
          </button>
        </div>
      </div>

      {error ? (
        <p className="error">{error}</p>
      ) : recipes === null ? (
        <p className="muted">불러오는 중...</p>
      ) : recipes.length === 0 ? (
        <div className="empty">아직 레시피가 없어요. 첫 레시피를 올려보세요!</div>
      ) : (
        <div className="grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.recipeId} recipe={recipe} />
          ))}
        </div>
      )}
    </>
  );
}
