import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import Icon from '../Icon';
import RecipeImage from '../RecipeImage';
import { formatCount, formatDate, formatOptionPrice, formatPrice } from '../format';

// 주문 텍스트 복사용
function orderText(recipe) {
  const lines = [`[${recipe.cafeName}] ${recipe.drinkName}`];
  recipe.options.forEach((o) => lines.push(`+ ${o.optionName}${o.quantity > 1 ? ` ×${o.quantity}` : ''}`));
  lines.push(`합계 ${formatPrice(recipe.totalPrice)}`);
  return lines.join('\n');
}

function QuantityTag({ quantity }) {
  if (quantity <= 1) return null;
  return (
    <span className="ml-1 rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary">
      ×{quantity}
    </span>
  );
}

// 영수증 아래쪽 톱니 모양
function ZigzagEdge() {
  return (
    <div className="relative mt-space-lg flex h-3 w-full justify-between overflow-hidden bg-surface-container-lowest">
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} className="h-3 w-3 translate-y-1.5 rotate-45 bg-surface" />
      ))}
    </div>
  );
}

// 매장에서 직원에게 화면을 그대로 보여주는 전체 화면
function CounterView({ recipe, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-primary-container text-on-primary">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-margin py-6">
        <div className="flex items-center justify-between">
          <span className="text-label-sm uppercase tracking-[0.25em] text-primary-fixed-dim">Custom Order</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 active:scale-95"
          >
            <Icon name="close" className="text-[24px]" />
          </button>
        </div>

        <p className="mt-6 text-headline-sm text-secondary-fixed-dim">{recipe.cafeName}</p>
        <h2 className="mt-1 text-headline-xl">{recipe.drinkName}</h2>

        <ul className="mt-8 space-y-4">
          {recipe.options.map((option) => (
            <li key={option.optionId} className="flex items-baseline gap-3 text-headline-md">
              <span className="font-mono text-secondary-container">+</span>
              <span>
                {option.optionName}
                {option.quantity > 1 && <span className="ml-2 font-mono text-secondary-fixed-dim">×{option.quantity}</span>}
              </span>
            </li>
          ))}
          {recipe.options.length === 0 && <li className="text-headline-sm text-primary-fixed-dim">옵션 없이 기본으로</li>}
        </ul>

        <div className="mt-auto border-t border-white/15 pt-6">
          <p className="text-label-md text-primary-fixed-dim">합계</p>
          <p className="font-mono text-headline-xl text-secondary-fixed-dim">{formatPrice(recipe.totalPrice)}</p>
        </div>
      </div>
    </div>
  );
}

export default function RecipeDetail({ user }) {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');
  const [liking, setLiking] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [notice, setNotice] = useState('');
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

  // 잠깐 보여줬다가 사라지는 안내 문구
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

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
      setNotice(e.message);
    } finally {
      setLiking(false);
    }
  };

  const copy = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(message);
    } catch {
      setNotice('복사하지 못했어요.');
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.recipeName, url });
      } catch {} // 공유 창을 닫은 경우
    } else {
      copy(url, '링크를 복사했어요.');
    }
  };

  if (error) {
    return (
      <div className="px-margin pt-12 text-center">
        <Icon name="error" className="text-[40px] text-outline" />
        <p className="mt-2 text-body-md text-on-surface-variant">{error}</p>
        <Link to="/" className="mt-4 inline-block text-label-lg text-secondary">
          목록으로
        </Link>
      </div>
    );
  }
  if (!recipe) return <p className="py-12 text-center text-body-md text-on-surface-variant">불러오는 중...</p>;

  return (
    <div className="flex w-full flex-col pb-12">
      <div className="flex items-center justify-between px-margin pb-space-sm pt-space-md">
        <Link to="/" className="inline-flex items-center gap-1.5 py-2 text-on-surface-variant hover:text-on-surface">
          <Icon name="arrow_back" className="text-[18px]" />
          <span className="text-label-lg">목록으로</span>
        </Link>
        <button
          type="button"
          aria-label="공유"
          onClick={share}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-all hover:text-on-surface active:scale-90"
        >
          <Icon name="share" className="text-[19px]" />
        </button>
      </div>

      <header className="px-margin pb-space-lg pt-space-xs">
        <div className="mb-space-sm flex flex-wrap items-center gap-space-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-label-md tracking-wide text-on-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary-container" />
            {recipe.cafeName}
          </span>
        </div>
        <h2 className="text-headline-lg leading-snug tracking-tight text-primary">{recipe.recipeName}</h2>
        <div className="mt-space-md flex items-center gap-space-sm pt-space-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-label-sm text-on-primary">
            {recipe.username.slice(0, 1)}
          </div>
          <div className="flex flex-col">
            <span className="text-label-md font-semibold text-on-surface">@{recipe.username}</span>
            <span className="text-label-sm text-on-surface-variant">{formatDate(recipe.createdAt)}</span>
          </div>
        </div>
      </header>

      {recipe.imageUrl && (
        <div className="mb-space-lg px-margin">
          <div className="relative h-[240px] w-full overflow-hidden rounded-2xl bg-surface-container shadow-[0_4px_20px_rgba(46,26,18,0.08)]">
            <RecipeImage className="h-full w-full object-cover" imageUrl={recipe.imageUrl} alt={recipe.recipeName} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-3 py-1 text-label-sm text-on-surface shadow-sm backdrop-blur-md">
              <Icon name="photo_camera" className="text-[15px] text-secondary" />
              직접 만든 사진
            </span>
          </div>
        </div>
      )}

      {/* 영수증 모양 주문서 */}
      <section className="mb-space-lg px-margin">
        <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_8px_30px_rgba(46,26,18,0.08)]">
          <div className="h-2 w-full bg-primary-container" />
          <div className="px-space-lg pb-space-md pt-space-lg text-center">
            <div className="mb-1 text-label-sm uppercase tracking-[0.25em] text-on-surface-variant">Custom Order Slip</div>
            <h3 className="text-headline-md font-bold text-primary">{recipe.cafeName}</h3>
            <p className="mt-0.5 text-label-sm text-on-surface-variant">주문할 때 그대로 보여주세요</p>
          </div>
          <div className="mx-space-lg flex justify-between rounded-lg bg-surface-container-low px-space-md py-space-xs text-label-sm text-on-surface-variant">
            <span>옵션 {recipe.options.length}개</span>
            <span className="font-mono">NO. #{String(recipe.recipeId).padStart(4, '0')}</span>
          </div>

          <div className="relative my-space-md flex items-center justify-between">
            <div className="h-6 w-4 rounded-r-full bg-surface" />
            <div className="mx-2 flex-1 border-t-2 border-dashed border-outline-variant" />
            <div className="h-6 w-4 rounded-l-full bg-surface" />
          </div>

          <div className="space-y-space-sm px-space-lg text-body-md text-on-surface">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-label-lg font-bold text-primary">{recipe.drinkName}</span>
                <span className="text-label-sm text-on-surface-variant">기본 베이스 음료</span>
              </div>
              <span className="shrink-0 font-mono text-label-lg font-bold text-primary">{formatPrice(recipe.basePrice)}</span>
            </div>

            {recipe.options.length > 0 && (
              <div className="space-y-space-xs pt-space-xs">
                {recipe.options.map((option) => (
                  <div key={option.optionId} className="flex items-center justify-between gap-3 pl-space-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-secondary">+</span>
                      <span className="text-on-surface">
                        {option.optionName}
                        <QuantityTag quantity={option.quantity} />
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-label-md text-on-surface-variant">
                      {formatOptionPrice(option.extraPrice * option.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pb-space-xs pt-space-sm">
              <div className="h-px w-full bg-surface-variant" />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-label-sm uppercase tracking-wider text-on-surface-variant">Total Amount</div>
                <div className="text-headline-sm font-bold text-primary">합계 금액</div>
              </div>
              <div className="font-mono text-headline-lg font-extrabold tracking-tight text-secondary">
                {recipe.totalPrice.toLocaleString('ko-KR')}
                <span className="ml-1 text-headline-sm text-primary">원</span>
              </div>
            </div>
          </div>
          <ZigzagEdge />
        </div>

        <div className="mt-space-md grid grid-cols-2 gap-space-sm">
          <button
            type="button"
            onClick={() => setShowCounter(true)}
            className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-primary-container px-space-md text-label-lg text-on-primary shadow-sm transition-all active:scale-[0.98]"
          >
            <Icon name="present_to_all" className="text-[20px] text-secondary-fixed" />
            직원에게 보여주기
          </button>
          <button
            type="button"
            onClick={() => copy(orderText(recipe), '주문 내용을 복사했어요.')}
            className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-surface-container-high px-space-md text-label-lg text-on-surface transition-all hover:bg-surface-variant active:scale-[0.98]"
          >
            <Icon name="content_copy" className="text-[20px] text-on-surface-variant" />
            주문 텍스트 복사
          </button>
        </div>
      </section>

      {recipe.description && (
        <section className="mb-space-lg px-margin">
          <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-[0_2px_12px_rgba(46,26,18,0.04)]">
            <div className="mb-space-sm flex items-center gap-2 text-label-sm font-bold uppercase tracking-wider text-secondary">
              <Icon name="menu_book" className="text-[16px]" />
              Recipe Note
            </div>
            <p className="whitespace-pre-line text-body-lg leading-relaxed text-on-surface">{recipe.description}</p>
          </div>
        </section>
      )}

      <section className="mb-space-lg px-margin">
        <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-space-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={recipe.liked ? '좋아요 취소' : '좋아요'}
              onClick={toggleLike}
              disabled={liking}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-secondary shadow-sm transition-all active:scale-90 disabled:opacity-60"
            >
              <Icon name="favorite" filled={recipe.liked} className="text-[26px]" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-headline-sm font-bold text-primary">{formatCount(recipe.likes)}</span>
                <span className="text-label-sm text-on-surface-variant">명이 좋아해요</span>
              </div>
              <span className="text-label-sm text-on-surface-variant">
                {recipe.liked ? '좋아요를 눌렀어요' : '마음에 들면 하트를 눌러주세요'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-full bg-inverse-surface px-4 py-2 text-label-md text-inverse-on-surface shadow-lg">
          {notice}
        </div>
      )}

      {showCounter && <CounterView recipe={recipe} onClose={() => setShowCounter(false)} />}
    </div>
  );
}
