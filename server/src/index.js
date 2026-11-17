import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import cafesRouter from './routes/cafes.js';
import imagesRouter from './routes/images.js';
import likesRouter from './routes/likes.js';
import recipesRouter from './routes/recipes.js';
import { errorHandler } from './errors.js';

const app = express();
const PORT = Number(process.env.PORT || 8080);
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

// React(localhost:3000)에서 /api 를 호출할 수 있게 허용
app.use('/api', cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api', authRouter); // /api/signup, /api/login
app.use('/api/cafes', cafesRouter);
app.use('/api/images', imagesRouter);
app.use('/api/recipes/:recipeId/likes', likesRouter);
app.use('/api/recipes', recipesRouter);

// 위에서 처리하지 않은 주소
app.use((req, res) => {
  res.status(404).json({ message: '없는 주소예요.' });
});

// Express 5는 async 함수에서 throw한 에러도 여기로 보내줌
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
