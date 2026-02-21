import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { HeroUIProvider } from '@heroui/react';

/**
 * Custom render function that wraps components with all necessary providers
 * Usage: import { render } from '../test-utils';
 */
const AllTheProviders = ({ children }) => {
  return (
    <HeroUIProvider>
      <ThemeProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </HeroUIProvider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
