import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import AuthCard, { authInputClass } from './AuthCard';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return setError('닉네임을 입력해주세요.');
    if (!password) return setError('비밀번호를 입력해주세요.');

    setLoading(true);
    try {
      const user = await api.login(name, password);
      onLogin(user);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="다시 만나서 반가워요"
      subtitle="로그인하고 꿀조합을 올려보세요."
      onSubmit={handleSubmit}
      error={error}
      submitLabel="로그인"
      loading={loading}
      footer={
        <>
          계정이 없나요?{' '}
          <Link to="/signup" state={location.state} className="font-semibold text-secondary">
            회원가입
          </Link>
        </>
      }
    >
      <input
        className={authInputClass}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="닉네임"
        maxLength={50}
        autoFocus
      />
      <input
        className={authInputClass}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
      />
    </AuthCard>
  );
}
