import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return setError('닉네임을 입력해주세요.');

    setLoading(true);
    try {
      const user = await api.login(name);
      onLogin(user);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form className="card form narrow" onSubmit={handleSubmit}>
      <h1>시작하기</h1>
      <p className="muted">닉네임만 입력하면 돼요. 처음 쓰는 닉네임이면 자동으로 가입돼요.</p>
      <input
        className="input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="닉네임"
        maxLength={50}
        autoFocus
      />
      {error && <p className="error">{error}</p>}
      <button className="button" disabled={loading}>
        {loading ? '잠시만요...' : '시작하기'}
      </button>
    </form>
  );
}
