import { render, screen } from '@testing-library/react';
import App from './App';

test('레시피 목록을 보여준다', async () => {
  render(<App />);
  expect(screen.getByText('☕ 카페꿀조합')).toBeInTheDocument();
  expect(await screen.findByText('바닐라 오트 라떼')).toBeInTheDocument();
});
