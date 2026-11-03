export const formatPrice = (price) => `${price.toLocaleString('ko-KR')}원`;

export const formatDate = (dateTime) => dateTime.slice(0, 10).replaceAll('-', '.');
