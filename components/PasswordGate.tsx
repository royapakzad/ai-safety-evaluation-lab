
import React, { useState } from 'react';
import { signUp } from '../services/authService';

interface LoginProps {
  onLoginSubmit: (email: string, password: string) => void;
  loginError: string | null;
}

// NOTE: This component is now a full login screen. Consider renaming the file to Login.tsx.
const Login: React.FC<LoginProps> = ({ onLoginSubmit, loginError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    
    if (isSignUp) {
      try {
        await signUp(email, password);
      } catch (error: any) {
        setSignUpError(error.message || "Failed to create account");
      }
    } else {
      onLoginSubmit(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="bg-card text-card-foreground p-8 md:p-12 rounded-xl shadow-xl w-full max-w-md transform transition-all duration-500 hover:scale-[1.02]">
        <div className="text-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-primary mx-auto mb-4">
            <path fillRule="evenodd" d="M8 10V7a4 4 0 118 0v3h1a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2h1zm4-6a2 2 0 00-2 2v3h4V7a2 2 0 00-2-2z" clipRule="evenodd" />
          </svg>
          <h1 className="text-3xl font-bold text-foreground">Multilingual AI Safety Evaluation Laboratory</h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? 'Create a new account to continue.' : 'Enter your credentials to continue.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email_input" className="sr-only">Email</label>
            <input
              id="email_input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="form-input w-full px-4 py-3 border border-input bg-background text-foreground placeholder-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all shadow-sm hover:border-accent"
              required
              autoFocus
              aria-label="Email address input"
            />
          </div>
          <div>
            <label htmlFor="password_input" className="sr-only">Password</label>
            <input
              id="password_input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="form-input w-full px-4 py-3 border border-input bg-background text-foreground placeholder-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all shadow-sm hover:border-accent"
              required
              aria-label="Password Input"
            />
          </div>
          {(loginError || signUpError) && (
            <p className="text-sm text-destructive text-center">{loginError || signUpError}</p>
          )}
          <button
            type="submit"
            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 ease-in-out transform hover:-translate-y-px active:translate-y-0 active:shadow-md"
            aria-label="Submit credentials and enter lab"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setSignUpError(null);
            }}
            className="w-full text-primary hover:underline text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </form>
      </div>
       <p className="text-center text-xs text-muted-foreground mt-8 max-w-sm">
        {isSignUp 
          ? 'Create an account with your email and a secure password. Admin access is automatically granted to rpakzad@taraazresearch.org.'
          : 'Sign in with your existing account credentials.'
        }
      </p>
      <p className="text-center text-xs text-muted-foreground mt-4 max-w-sm">
        <a href="https://github.com/royapakzad/llm-multilingual-evaluation-lab" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Check out source code from GitHub</a>
      </p>
    </div>
  );
};

export default Login;
