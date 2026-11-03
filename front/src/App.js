import { useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';
import RecipeNew from './pages/RecipeNew';
import Login from './pages/Login';
import './App.css';

function loadUser() {
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null;
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
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">☕ 카페꿀조합</Link>
          <nav className="nav">
            <Link to="/recipes/new" className="button small">레시피 올리기</Link>
            {user ? (
              <>
                <span className="muted">{user.username}님</span>
                <button className="text-button" onClick={handleLogout}>로그아웃</button>
              </>
            ) : (
              <Link to="/login" className="text-button">로그인</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
