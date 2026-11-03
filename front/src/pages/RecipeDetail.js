import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { formatDate, formatPrice } from '../format';

export default function RecipeDetail({ user }) {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');
  const [liking, setLiking] = useState(false);
  const userId = user?.userId;

  useEffect(() => {
    let ignore = false;
    api
      .getRecipe(Number(recipeId), userId)
      .then((data) => !ignore && setRecipe(data))
      .catch((e) => !ignore && setError(e.message));
    return () => {
      ignore = true;
    };
  }, [recipeId, userId]);

  const toggleLike = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/recipes/${recipeId}` } });
      return;
    }
    setLiking(true);
    try {
      if (recipe.liked) {
        await api.unlikeRecipe(recipe.recipeId, user.userId);
      } else {
        await api.likeRecipe(recipe.recipeId, user.userId);
      }
      setRecipe((r) => ({ ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) }));
    } catch (e) {
      alert(e.message);
    } finally {
      setLiking(false);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!recipe) return <p className="muted">불러오는 중...</p>;

  return (
    <article className="card detail">
      <Link to="/" className="back">← 목록으로</Link>

      <span className="badge">{recipe.cafeName}</span>
      <h1>{recipe.recipeName}</h1>
      <p className="muted">
        by {recipe.username} · {formatDate(recipe.createdAt)}
      </p>

      <section>
        <h2>주문 방법</h2>
        <ul className="price-list">
          <li>
            <span>{recipe.drinkName}</span>
            <span>{formatPrice(recipe.basePrice)}</span>
          </li>
          {recipe.options.map((option) => (
            <li key={option.optionId}>
              <span>
                + {option.optionName}
                {option.quantity > 1 && <span className="quantity"> ×{option.quantity}</span>}
              </span>
              <span>{formatPrice(option.extraPrice * option.quantity)}</span>
            </li>
          ))}
          <li className="total">
            <span>합계</span>
            <span>{formatPrice(recipe.totalPrice)}</span>
          </li>
        </ul>
      </section>

      {recipe.description && (
        <section>
          <h2>설명</h2>
          <p className="description">{recipe.description}</p>
        </section>
      )}

      <button className={`like-button ${recipe.liked ? 'liked' : ''}`} onClick={toggleLike} disabled={liking}>
        {recipe.liked ? '♥' : '♡'} 좋아요 {recipe.likes}
      </button>
    </article>
  );
}
