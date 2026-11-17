export const formatPrice = (price) => `${price.toLocaleString('ko-KR')}원`;

// 0원짜리 옵션은 "무료"로 표시
export const formatOptionPrice = (price) => (price === 0 ? '무료' : formatPrice(price));

export const formatDate = (dateTime) => dateTime.slice(0, 10).replaceAll('-', '.');

// 1400 -> 1.4k
export const formatCount = (count) =>
  count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(count);

// 옵션 이름 + 수량 (2개 이상일 때만 ×2)
export const optionLabel = (option) =>
  option.quantity > 1 ? `${option.optionName} ×${option.quantity}` : option.optionName;

// 카페마다 다른 뱃지 색 (cafeId 순서대로 돌아가며 사용)
const CAFE_BADGES = [
  'bg-tertiary-container text-tertiary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed-variant',
  'bg-primary-container text-primary-fixed',
  'bg-secondary-fixed-dim text-on-secondary-fixed',
];
export const cafeBadgeClass = (cafeId) => CAFE_BADGES[(cafeId - 1) % CAFE_BADGES.length];
