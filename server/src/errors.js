// throw new HttpError(404, '메시지') 하면 { "message": "메시지" } 로 응답됨
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// URL이나 요청 본문에서 받은 번호가 1 이상의 정수인지 확인
export function toId(value, message, status = 400) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(status, message);
  }
  return id;
}

// 모든 에러를 { "message": "..." } 형태로 응답 (프론트가 이 message를 화면에 보여줌)
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // 사용자 지정 에러
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  // 사진이 5MB보다 큼 (multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: '사진은 5MB 이하로 올려주세요.' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: '사진을 올리지 못했어요.' });
  }
  // 요청 본문이 JSON 형식이 아님
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: '요청 형식이 올바르지 않아요.' });
  }
  // UNIQUE 제약에 걸림 (동시에 같은 닉네임 가입 등)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: '이미 처리된 요청이에요.' });
  }

  console.error(err);
  res.status(500).json({ message: '서버에서 문제가 생겼어요.' });
}
