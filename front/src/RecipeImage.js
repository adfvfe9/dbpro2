import { DEFAULT_IMAGE, imageSrc } from './api';

// 기본 이미지 (사진이 없을 떄 사용하는 이미지
export default function RecipeImage({ imageUrl, alt, className }) {
  return (
    <img
      className={className}
      src={imageSrc(imageUrl)}
      alt={alt}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = DEFAULT_IMAGE;
      }}
    />
  );
}
