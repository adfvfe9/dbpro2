import mysql from 'mysql2/promise';


// .env 파일에서 데이터 불러오기
export const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : undefined,
  charset: 'utf8mb4',
  dateStrings: true, // DATETIME을 Date 객체 대신 '2026-11-10 09:00:00' 문자열로 받기
  decimalNumbers: true, // SUM() 결과(DECIMAL)를 문자열이 아니라 숫자로 받기
};

// 요청마다 DB 연결을 새로 만들지 않고, 만들어둔 연결을 돌려씀
export const pool = mysql.createPool({ ...dbConfig, connectionLimit: 10 });

// DB 서버 시계가 UTC라서, 연결할 때마다 한국 시간으로 맞춤 (created_at 기본값이 한국 시간으로 들어감)
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+09:00'");
});
