import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import AuthCard, { authInputClass } from './AuthCard';

export default function Signup({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return setError('닉네임을 입력해주세요.');
    if (password.length < 8 || password.length > 64) return setError('비밀번호는 8~64자로 입력해주세요.');
    if (password !== passwordConfirm) return setError('비밀번호가 서로 달라요.');

    setLoading(true);
    try {
      const user = await api.signup(name, password);
      onLogin(user); // 가입하면 바로 로그인 상태로
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="꿀조합 시작하기"
      subtitle="닉네임과 비밀번호만 있으면 돼요."
      onSubmit={handleSubmit}
      error={error}
      submitLabel="가입하기"
      loading={loading}
      footer={
        <>
          이미 계정이 있나요?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-secondary">
            로그인
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
        placeholder="비밀번호 (8자 이상)"
        maxLength={64}
      />
      <input
        className={authInputClass}
        type="password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        placeholder="비밀번호 확인"
        maxLength={64}
      />
    </AuthCard>
  );
}
