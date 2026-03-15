import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '../src/app/page'
 
describe('Home', () => {
  it('renders the home page', () => {
    render(<Home />);
 
    expect(screen.getByText('To get started, edit the page.tsx file.')).toBeInTheDocument();
  });
});