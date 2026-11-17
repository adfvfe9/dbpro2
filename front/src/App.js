import { useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';
import RecipeNew from './pages/RecipeNew';
import Login from './pages/Login';
import Signup from './pages/Signup';

const PAGE_TITLES = {
  '/recipes/new': '레시피 올리기',
  '/login': '로그인',
  '/signup': '회원가입',
};

function loadUser() {
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null;
}

function Header({ user }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';

  // 바로 들어온 페이지면 뒤로 갈 곳이 없으니 메인으로
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));

  return (
    <header className="fixed top-0 z-50 w-full bg-surface/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[480px] items-center justify-between px-margin">
        {isHome ? (
          <Link to="/" className="flex min-h-[44px] items-center gap-space-xs">
            <Icon name="local_cafe" className="text-[24px] text-secondary" />
            <span className="text-headline-sm tracking-tight text-primary-container">카페꿀조합</span>
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-space-xs">
            <button
              type="button"
              aria-label="뒤로 가기"
              onClick={goBack}
              className="-ml-3 flex h-11 w-11 items-center justify-center text-on-surface active:scale-95"
            >
              <Icon name="arrow_back_ios_new" className="text-[22px]" />
            </button>
            <h1 className="truncate text-headline-sm text-on-surface">{PAGE_TITLES[pathname] || '레시피 상세'}</h1>
          </div>
        )}

        <div className="flex items-center gap-space-sm">
          {isHome ? (
            <Link
              to="/recipes/new"
              className="flex h-9 items-center gap-1 rounded-full bg-secondary px-3.5 text-label-md text-on-secondary shadow-sm transition-transform active:scale-95"
            >
              <Icon name="edit_note" className="text-[16px]" />
              레시피 올리기
            </Link>
          ) : (
            <Link to="/" aria-label="홈" className="flex min-h-[44px] min-w-[44px] items-center justify-center text-on-surface-variant">
              <Icon name="home" className="text-[22px]" />
            </Link>
          )}
          {user ? (
            <div
              title={user.username}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-label-md text-on-primary"
            >
              {user.username.slice(0, 1)}
            </div>
          ) : (
            <Link to="/login" className="flex min-h-[44px] items-center text-label-md text-on-surface-variant hover:text-on-surface">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav({ user, onLogout }) {
  const { pathname } = useLocation();
  // 작성 화면은 아래에 올리기 버튼이 고정돼 있어서 숨김
  if (pathname === '/recipes/new') return null;

  const itemClass = ({ isActive }) =>
    `flex h-12 w-20 flex-col items-center justify-center transition-colors ${
      isActive ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
    }`;

  return (
    <nav className="fixed bottom-0 z-50 w-full bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(46,26,18,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[480px] items-center justify-around px-space-sm">
        <NavLink to="/" end className={itemClass}>
          <Icon name="local_cafe" className="text-[22px]" />
          <span className="mt-0.5 text-label-sm">레시피 목록</span>
        </NavLink>
        <NavLink to="/recipes/new" className={itemClass}>
          <Icon name="add_circle" className="text-[22px]" />
          <span className="mt-0.5 text-label-sm">작성하기</span>
        </NavLink>
        {user ? (
          <button type="button" onClick={onLogout} className={itemClass({ isActive: false })}>
            <Icon name="logout" className="text-[22px]" />
            <span className="mt-0.5 text-label-sm">로그아웃</span>
          </button>
        ) : (
          <NavLink to="/login" className={itemClass}>
            <Icon name="account_circle" className="text-[22px]" />
            <span className="mt-0.5 text-label-sm">로그인</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(loadUser);

  const handleLogin = (loggedIn) => {
    localStorage.setItem('user', JSON.stringify(loggedIn));
    setUser(loggedIn);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Header user={user} />
      <main className="mx-auto min-h-screen w-full max-w-[480px] pb-24 pt-16">
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route
            path="/recipes/new"
            element={
              user ? <RecipeNew user={user} /> : <Navigate to="/login" state={{ from: '/recipes/new' }} replace />
            }
          />
          <Route path="/recipes/:recipeId" element={<RecipeDetail user={user} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav user={user} onLogout={handleLogout} />
    </BrowserRouter>
  );
}

export default App;
