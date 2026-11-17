import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Icon from '../Icon';
import RecipeImage from '../RecipeImage';
import { cafeBadgeClass, formatCount, formatPrice, optionLabel } from '../format';

function PerforatedLine() {
  return (
    <div className="my-3.5 flex items-center justify-between gap-1 overflow-hidden opacity-30">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-outline" />
      <span className="h-px flex-1 bg-outline" />
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-outline" />
    </div>
  );
}

function RecipeCard({ recipe, isTop }) {
  return (
    <Link
      to={`/recipes/${recipe.recipeId}`}
      className="group relative flex flex-col rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-surface-container-high shadow-sm">
            <RecipeImage className="h-full w-full object-cover" imageUrl={recipe.imageUrl} alt={recipe.recipeName} />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-label-sm font-bold tracking-tight ${cafeBadgeClass(recipe.cafeId)}`}>
                {recipe.cafeName}
              </span>
              {isTop && (
                <span className="flex items-center gap-0.5 text-label-sm text-secondary">
                  <Icon name="local_fire_department" className="text-[14px]" />
                  인기 1위
                </span>
              )}
            </div>
            <h2 className="truncate text-headline-sm leading-snug text-primary-container">{recipe.recipeName}</h2>
            <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">기본: {recipe.drinkName}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-label-sm text-outline">예상 합계</span>
          <span className="text-headline-sm font-bold tracking-tight text-secondary">{formatPrice(recipe.totalPrice)}</span>
        </div>
      </div>

      {recipe.options.length > 0 && (
        <>
          <PerforatedLine />
          <div className="flex flex-wrap gap-1.5">
            {recipe.options.map((option) => (
              <span
                key={option.optionId}
                className="flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-on-surface-variant"
              >
                <span className="h-1 w-1 rounded-full bg-secondary" />
                {optionLabel(option)}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="mt-3.5 flex items-center justify-between pt-2.5 text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span className="text-body-sm font-medium text-outline">@{recipe.username}</span>
          <span className="h-1 w-1 rounded-full bg-outline-variant" />
          <span className="flex items-center gap-1 text-label-md text-secondary">
            <Icon name="favorite" filled className="text-[16px]" />
            {formatCount(recipe.likes)}
          </span>
        </div>
        <span className="flex items-center gap-0.5 text-label-sm transition-colors group-hover:text-primary">
          주문서 보기
          <Icon name="arrow_forward" className="text-[14px]" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ searching }) {
  return (
    <section className="flex flex-col items-center justify-center px-margin py-12 text-center">
      <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">
        <Icon name={searching ? 'search_off' : 'coffee_maker'} className="text-[36px] text-outline" />
        {!searching && (
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
            <Icon name="add" className="text-[16px]" />
          </span>
        )}
      </div>
      <h3 className="text-headline-sm text-primary-container">
        {searching ? '찾는 레시피가 없어요' : '아직 레시피가 없어요'}
      </h3>
      <p className="mt-1.5 max-w-[260px] text-body-md leading-relaxed text-on-surface-variant">
        {searching ? '다른 이름으로 찾아보세요.' : '가장 먼저 나만의 꿀조합을 공유하고 하트를 받아보세요!'}
      </p>
      {!searching && (
        <Link
          to="/recipes/new"
          className="mt-6 inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-primary-container px-8 text-label-lg text-on-primary shadow-md transition-all active:scale-95"
        >
          <Icon name="edit_note" className="text-[18px]" />
          첫 레시피 올리기
        </Link>
      )}
    </section>
  );
}

export default function RecipeList() {
  const [cafes, setCafes] = useState([]);
  const [cafeId, setCafeId] = useState(null);
  const [sort, setSort] = useState('popular');
  const [recipes, setRecipes] = useState(null);
  const [query, setQuery] = useState('');
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

  // 검색은 이미 불러온 목록 안에서만 찾음 (레시피 이름, 음료, 카페, 옵션)
  const keyword = query.trim().toLowerCase();
  const visibleRecipes = (recipes || []).filter(
    (r) =>
      !keyword ||
      [r.recipeName, r.drinkName, r.cafeName, ...r.options.map((o) => o.optionName)].some((text) =>
        text.toLowerCase().includes(keyword)
      )
  );

  const chipClass = (active) =>
    `h-9 shrink-0 rounded-full px-4 text-label-md transition-all duration-200 ${
      active
        ? 'bg-primary-container text-on-primary shadow-sm'
        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
    }`;
  const sortClass = (active) =>
    `rounded-full px-3 py-1 text-label-sm transition-all ${
      active ? 'bg-surface-container-lowest text-primary-container shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
    }`;

  return (
    <div className="flex w-full flex-col pb-8">
      <section className="px-margin pb-2 pt-4">
        <div className="mb-1.5 flex items-center gap-space-xs">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
            <Icon name="auto_awesome" filled className="text-[13px]" />
          </span>
          <span className="text-label-md uppercase tracking-wide text-secondary">Community Custom Lab</span>
        </div>
        <h1 className="text-headline-lg leading-snug tracking-tight text-primary-container">
          나만의 카페 꿀조합을
          <br />
          공유해요
        </h1>
        <p className="mt-1.5 text-body-md leading-relaxed text-on-surface-variant">
          카페별 커스텀 레시피를 찾아보고, 내 레시피도 올려보세요.
        </p>

        <div className="mt-4 flex h-12 items-center rounded-full bg-surface-container-lowest px-4 shadow-sm">
          <Icon name="search" className="mr-2 text-[20px] text-on-surface-variant" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="레시피, 음료, 옵션 이름으로 찾기"
            className="w-full bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          />
          {query && (
            <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')} className="p-1 text-outline hover:text-on-surface">
              <Icon name="close" className="text-[18px]" />
            </button>
          )}
        </div>
      </section>

      <section className="sticky top-16 z-30 bg-surface/95 pb-3 pt-3 backdrop-blur-md">
        <div className="scrollbar-none flex items-center gap-2 overflow-x-auto px-margin py-1">
          <button type="button" className={chipClass(cafeId === null)} onClick={() => setCafeId(null)}>
            전체
          </button>
          {cafes.map((cafe) => (
            <button
              key={cafe.cafeId}
              type="button"
              className={chipClass(cafeId === cafe.cafeId)}
              onClick={() => setCafeId(cafe.cafeId)}
            >
              {cafe.cafeName}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between px-margin">
          <div className="flex items-center gap-1.5">
            <span className="text-label-md text-on-surface-variant">추천 레시피</span>
            <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-label-sm font-bold text-on-secondary-fixed">
              {visibleRecipes.length}
            </span>
          </div>
          <div className="inline-flex rounded-full bg-surface-container p-0.5">
            <button type="button" className={sortClass(sort === 'popular')} onClick={() => setSort('popular')}>
              인기순
            </button>
            <button type="button" className={sortClass(sort === 'latest')} onClick={() => setSort('latest')}>
              최신순
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <p className="mx-margin mt-4 rounded-xl bg-error-container p-4 text-body-md text-on-error-container">{error}</p>
      ) : recipes === null ? (
        <p className="py-12 text-center text-body-md text-on-surface-variant">불러오는 중...</p>
      ) : visibleRecipes.length === 0 ? (
        <EmptyState searching={recipes.length > 0} />
      ) : (
        <section className="mt-2 flex flex-col gap-3.5 px-margin">
          {visibleRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.recipeId}
              recipe={recipe}
              isTop={sort === 'popular' && !keyword && index === 0 && recipe.likes > 0}
            />
          ))}
        </section>
      )}

      {/* 엄지로 누르기 쉬운 곳에 올리기 버튼 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-[480px] justify-end px-4">
        <Link
          to="/recipes/new"
          aria-label="레시피 올리기"
          className="pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-secondary px-4 text-on-secondary shadow-lg transition-transform active:scale-95"
        >
          <Icon name="add" className="text-[20px]" />
          <span className="text-label-md tracking-tight">조합 올리기</span>
        </Link>
      </div>
    </div>
  );
}
