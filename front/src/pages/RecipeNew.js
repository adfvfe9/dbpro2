import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Icon from '../Icon';
import { formatOptionPrice, formatPrice } from '../format';

const MAX_QUANTITY = 9;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB (서버 설정과 같게)
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const inputClass =
  'w-full rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/40';

function Section({ step, title, hint, children }) {
  return (
    <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-[0_2px_12px_rgba(46,26,18,0.04)]">
      <div className="mb-space-md flex items-baseline gap-2">
        {step && <span className="font-mono text-label-sm text-secondary">{step}</span>}
        <h2 className="text-headline-sm text-primary-container">{title}</h2>
        {hint && <span className="text-label-sm font-medium text-outline">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

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
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCafes().then(setCafes).catch((e) => setError(e.message));
  }, []);

  // 미리보기용 임시 주소는 다 쓰면 정리
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // 같은 파일을 다시 골라도 동작하게
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setError('jpg, png, webp, gif 사진만 올릴 수 있어요.');
    if (file.size > MAX_IMAGE_SIZE) return setError('사진은 5MB 이하로 올려주세요.');

    setError('');
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl('');
  };

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
      // 사진이 있으면 먼저 올리고, 받은 사진 번호를 레시피와 같이 저장
      const imageId = imageFile ? (await api.uploadImage(imageFile)).imageId : null;

      const created = await api.createRecipe({
        userId: user.userId,
        drinkId,
        recipeName: recipeName.trim(),
        description: description.trim(),
        imageId,
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

  const chipClass = (active) =>
    `h-9 shrink-0 rounded-full px-4 text-label-md transition-all ${
      active
        ? 'bg-primary-container text-on-primary shadow-sm'
        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-space-md px-margin pb-24 pt-space-md">
      <div className="pb-space-xs">
        <h1 className="text-headline-lg tracking-tight text-primary-container">나만의 꿀조합 올리기</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">카페와 음료를 고르고, 옵션을 담아주세요.</p>
      </div>

      <Section step="01" title="어느 카페인가요?">
        <div className="scrollbar-none -mx-space-lg flex gap-2 overflow-x-auto px-space-lg">
          {cafes.map((cafe) => (
            <button key={cafe.cafeId} type="button" className={chipClass(cafeId === cafe.cafeId)} onClick={() => setCafeId(cafe.cafeId)}>
              {cafe.cafeName}
            </button>
          ))}
        </div>
        {cafeId && (
          <p className="mt-space-sm text-label-sm font-medium text-outline">카페를 바꾸면 고른 음료와 옵션이 초기화돼요.</p>
        )}
      </Section>

      <Section step="02" title="기본 음료">
        {!cafeId ? (
          <p className="text-body-md text-outline">카페를 먼저 골라주세요.</p>
        ) : (
          <div className="flex flex-col gap-space-md">
            {drinkCategories.map((category) => (
              <div key={category} className="flex flex-col gap-1.5">
                <p className="text-label-sm text-on-surface-variant">{category}</p>
                {drinks
                  .filter((d) => d.category === category)
                  .map((d) => {
                    const selected = d.drinkId === drinkId;
                    return (
                      <button
                        key={d.drinkId}
                        type="button"
                        onClick={() => setDrinkId(d.drinkId)}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                          selected
                            ? 'bg-primary-container text-on-primary shadow-sm'
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-label-lg">
                          <Icon name={selected ? 'check_circle' : 'radio_button_unchecked'} filled={selected} className="text-[18px]" />
                          {d.drinkName}
                        </span>
                        <span className="font-mono text-label-md">{formatPrice(d.basePrice)}</span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        )}
      </Section>

      {options.length > 0 && (
        <Section step="03" title="옵션 담기" hint="선택">
          <div className="flex flex-col gap-space-md">
            {optionCategories.map((category) => (
              <div key={category} className="flex flex-col gap-1.5">
                <p className="text-label-sm text-on-surface-variant">{category}</p>
                {options
                  .filter((o) => o.category === category)
                  .map((o) => {
                    const quantity = quantities[o.optionId] || 0;
                    return (
                      <div
                        key={o.optionId}
                        className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-all ${
                          quantity ? 'bg-secondary-fixed/60 ring-1 ring-secondary/30' : 'bg-surface-container-low'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-label-lg text-on-surface">{o.optionName}</span>
                          <span className="font-mono text-label-sm text-on-surface-variant">+{formatOptionPrice(o.extraPrice)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`${o.optionName} 빼기`}
                            onClick={() => changeQuantity(o.optionId, -1)}
                            disabled={!quantity}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-sm active:scale-90 disabled:opacity-40"
                          >
                            <Icon name="remove" className="text-[18px]" />
                          </button>
                          <span className="w-5 text-center font-mono text-label-lg text-primary">{quantity}</span>
                          <button
                            type="button"
                            aria-label={`${o.optionName} 더하기`}
                            onClick={() => changeQuantity(o.optionId, 1)}
                            disabled={quantity >= MAX_QUANTITY}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm active:scale-90 disabled:opacity-40"
                          >
                            <Icon name="add" className="text-[18px]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section step={options.length > 0 ? '04' : '03'} title="레시피 소개">
        <div className="flex flex-col gap-space-md">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl">
              <img src={previewUrl} alt="올릴 사진 미리보기" className="h-[200px] w-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary/70 px-3 py-1 text-label-sm text-on-primary backdrop-blur-md"
              >
                <Icon name="close" className="text-[14px]" />
                사진 빼기
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-outline-variant py-8 text-on-surface-variant transition-colors hover:border-secondary">
              <input type="file" accept={IMAGE_TYPES.join(',')} onChange={handleImageChange} hidden />
              <Icon name="add_a_photo" className="text-[28px] text-secondary" />
              <span className="text-label-lg text-on-surface">사진 고르기 (선택)</span>
              <span className="text-label-sm font-medium text-outline">jpg, png, webp, gif · 5MB 이하</span>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-on-surface-variant">레시피 이름</span>
            <input
              className={inputClass}
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="예: 바닐라 오트 라떼"
              maxLength={100}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-on-surface-variant">설명 (선택)</span>
            <textarea
              className={`${inputClass} resize-y`}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 맛인지, 어떤 점이 좋은지 알려주세요."
            />
          </label>
        </div>
      </Section>

      {error && <p className="rounded-xl bg-error-container px-4 py-3 text-body-md text-on-error-container">{error}</p>}

      {/* 아래에 고정된 합계 + 올리기 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(46,26,18,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[480px] items-center justify-between gap-space-md px-margin">
          <div className="flex flex-col">
            <span className="text-label-sm text-outline">예상 합계</span>
            <span className="font-mono text-headline-md font-extrabold tracking-tight text-secondary">{formatPrice(totalPrice)}</span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex h-[52px] items-center gap-2 rounded-full bg-primary-container px-6 text-label-lg text-on-primary shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            <Icon name="edit_note" className="text-[20px]" />
            {saving ? '올리는 중...' : '레시피 올리기'}
          </button>
        </div>
      </div>
    </form>
  );
}
