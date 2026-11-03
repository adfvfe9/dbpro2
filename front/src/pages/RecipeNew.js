import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { formatPrice } from '../format';

const MAX_QUANTITY = 9;

export default function RecipeNew({ user }) {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [cafeId, setCafeId] = useState('');
  const [drinks, setDrinks] = useState([]);
  const [options, setOptions] = useState([]);
  const [drinkId, setDrinkId] = useState('');
  const [quantities, setQuantities] = useState({}); // { optionId: 수량 }
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCafes().then(setCafes).catch((e) => setError(e.message));
  }, []);

  // 카페를 바꾸면 음료와 옵션을 처음부터 다시 고름 (다른 카페 옵션이 섞이지 않게)
  useEffect(() => {
    setDrinks([]);
    setOptions([]);
    setDrinkId('');
    setQuantities({});
    if (!cafeId) return;

    let ignore = false;
    Promise.all([api.getDrinks(cafeId), api.getOptions(cafeId)])
      .then(([drinkList, optionList]) => {
        if (ignore) return;
        setDrinks(drinkList);
        setOptions(optionList);
      })
      .catch((e) => !ignore && setError(e.message));
    return () => {
      ignore = true;
    };
  }, [cafeId]);

  const changeQuantity = (optionId, diff) => {
    setQuantities((prev) => {
      const next = Math.min(MAX_QUANTITY, Math.max(0, (prev[optionId] || 0) + diff));
      const updated = { ...prev, [optionId]: next };
      if (next === 0) delete updated[optionId];
      return updated;
    });
  };

  const drink = drinks.find((d) => d.drinkId === drinkId);
  const totalPrice =
    (drink?.basePrice || 0) +
    options.reduce((sum, o) => sum + o.extraPrice * (quantities[o.optionId] || 0), 0);

  const drinkCategories = [...new Set(drinks.map((d) => d.category))];
  const optionCategories = [...new Set(options.map((o) => o.category))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!drinkId) return setError('기본 음료를 골라주세요.');
    if (!recipeName.trim()) return setError('레시피 이름을 입력해주세요.');

    setError('');
    setSaving(true);
    try {
      const created = await api.createRecipe({
        userId: user.userId,
        drinkId,
        recipeName: recipeName.trim(),
        description: description.trim(),
        options: Object.entries(quantities).map(([optionId, quantity]) => ({
          optionId: Number(optionId),
          quantity,
        })),
      });
      navigate(`/recipes/${created.recipeId}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h1>레시피 올리기</h1>

      <label className="field">
        <span>카페</span>
        <select
          className="input"
          value={cafeId}
          onChange={(e) => setCafeId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">카페를 골라주세요</option>
          {cafes.map((cafe) => (
            <option key={cafe.cafeId} value={cafe.cafeId}>
              {cafe.cafeName}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>기본 음료</span>
        <select
          className="input"
          value={drinkId}
          disabled={!cafeId}
          onChange={(e) => setDrinkId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">{cafeId ? '음료를 골라주세요' : '카페를 먼저 골라주세요'}</option>
          {drinkCategories.map((category) => (
            <optgroup key={category} label={category}>
              {drinks
                .filter((d) => d.category === category)
                .map((d) => (
                  <option key={d.drinkId} value={d.drinkId}>
                    {d.drinkName} ({formatPrice(d.basePrice)})
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      {options.length > 0 && (
        <div className="field">
          <span>옵션</span>
          {optionCategories.map((category) => (
            <div key={category} className="option-group">
              <p className="option-category">{category}</p>
              {options
                .filter((o) => o.category === category)
                .map((o) => {
                  const quantity = quantities[o.optionId] || 0;
                  return (
                    <div key={o.optionId} className={`option-row ${quantity ? 'selected' : ''}`}>
                      <span>
                        {o.optionName}
                        <span className="muted"> +{formatPrice(o.extraPrice)}</span>
                      </span>
                      <div className="stepper">
                        <button type="button" onClick={() => changeQuantity(o.optionId, -1)} disabled={!quantity}>
                          −
                        </button>
                        <span>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(o.optionId, 1)}
                          disabled={quantity >= MAX_QUANTITY}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      <label className="field">
        <span>레시피 이름</span>
        <input
          className="input"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
          placeholder="예: 바닐라 오트 라떼"
          maxLength={100}
        />
      </label>

      <label className="field">
        <span>설명 (선택)</span>
        <textarea
          className="input"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="어떤 맛인지, 어떤 점이 좋은지 알려주세요."
        />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="submit-bar">
        <div>
          <span className="muted">예상 가격 </span>
          <strong>{formatPrice(totalPrice)}</strong>
        </div>
        <button className="button" disabled={saving}>
          {saving ? '올리는 중...' : '레시피 올리기'}
        </button>
      </div>
    </form>
  );
}
