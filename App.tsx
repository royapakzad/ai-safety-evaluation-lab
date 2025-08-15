
import React, { useState, useEffect } from 'react';
import { User, Theme } from './types';
import { 
    USER_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, 
    THEME_KEY, APP_TITLE
} from './constants';
import * as config from './env.js'; // Import API keys from env.js
import Login from './components/PasswordGate';
import Header from './components/Header';
import ApiKeyWarning from './components/ApiKeyWarning';
import ReasoningLab from './components/ReasoningLab';

const App: React.FC = () => {
  // Core App State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [isAnyApiKeyMissingOrPlaceholder, setIsAnyApiKeyMissingOrPlaceholder] = useState<boolean>(false);

  // Check for API Keys on mount
  useEffect(() => {
    const geminiKeyMissing = !config.API_KEY || (config.API_KEY as string) === "YOUR_GOOGLE_GEMINI_API_KEY_HERE";
    const openaiKeyMissing = !config.OPENAI_API_KEY || (config.OPENAI_API_KEY as string) === "YOUR_OPENAI_API_KEY_HERE";
    const mistralKeyMissing = !config.MISTRAL_API_KEY || (config.MISTRAL_API_KEY as string) === "YOUR_MISTRAL_API_KEY_HERE";
    
    if (geminiKeyMissing || openaiKeyMissing || mistralKeyMissing) {
      setIsAnyApiKeyMissingOrPlaceholder(true);
      console.warn("One or more API keys (Gemini, OpenAI, Mistral) are not defined or are placeholders in env.js. Some models may be unavailable.");
    } else {
      setIsAnyApiKeyMissingOrPlaceholder(false);
    }
  }, []);
  
  // Theme management
  useEffect(() => {
    let initialTheme: Theme = 'light';
    try {
      const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      if (storedTheme) initialTheme = storedTheme;
      else initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      console.warn('Could not access localStorage or matchMedia for theme.', e);
    }
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
  }, [theme]);

  // Auth check on initial load
  useEffect(() => {
    try {
      const storedUserJson = localStorage.getItem(USER_KEY);
      if (storedUserJson) {
        setCurrentUser(JSON.parse(storedUserJson) as User);
      }
    } catch (e) {
      console.warn('Failed to read user session from localStorage:', e);
    }
  }, []);

  const toggleTheme = () => setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');

  const handleLoginSubmit = (email: string, password: string) => {
    setLoginError(null);
    const emailLower = email.toLowerCase().trim();
    if (emailLower === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const user: User = { email: emailLower, role: 'admin' };
        setCurrentUser(user);
        try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) { console.warn('Failed to save user to localStorage:', e); }
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower) && emailLower === password) {
        const user: User = { email: emailLower, role: 'evaluator' };
        setCurrentUser(user);
        try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) { console.warn('Failed to save user to localStorage:', e); }
    } else {
        setLoginError("Invalid credentials. Please check your email and password.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
        localStorage.removeItem(USER_KEY);
    } catch (e) {
        console.warn('Failed to remove user from localStorage on logout:', e);
    }
  };

  if (!currentUser) return <Login onLoginSubmit={handleLoginSubmit} loginError={loginError} />;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {isAnyApiKeyMissingOrPlaceholder && <ApiKeyWarning />}
      <Header 
        title={APP_TITLE} 
        user={currentUser} 
        currentTheme={theme} 
        onThemeToggle={toggleTheme} 
        onLogout={handleLogout}
        showBack={false}
      />
      
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8" aria-live="polite">
        <ReasoningLab currentUser={currentUser} />
      </main>

      <footer className="text-center py-6 border-t border-border text-xs text-muted-foreground">
        LLM Evaluation Labs &copy; {new Date().getFullYear()}. For research and educational purposes.
      </footer>
    </div>
  );
};

export default App;
