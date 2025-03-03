// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the CodeMirror component for tests
jest.mock('@uiw/react-codemirror', () => {
  return {
    __esModule: true,
    default: ({ onChange, value, height, theme, extensions, placeholder }) => {
      return (
        <div 
          data-testid="codemirror-editor"
          className="mock-codemirror"
          style={{ height }}
        >
          <textarea
            data-testid="codemirror-textarea"
            onChange={(e) => onChange && onChange(e.target.value)}
            value={value}
            placeholder={placeholder}
          />
        </div>
      );
    }
  };
});

// Mock axios to avoid actual API calls during tests
jest.mock('axios');