import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'pt' | 'en';
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  pt: {
    welcome: 'Bem-vindo ao Encurta Link Senai',
    login: 'Entrar',
    register: 'Cadastrar',
    email: 'E-mail',
    password: 'Senha',
    googleLogin: 'Entrar com Google',
    shorten: 'Encurtar',
    placeholderUrl: 'Cole sua URL longa aqui...',
    links: 'Seus Links',
    original: 'URL Original',
    short: 'Link Curto',
    clicks: 'Cliques',
    date: 'Data',
    copy: 'Copiar',
    delete: 'Excluir',
    copied: 'Copiado!',
    error: 'Ocorreu um erro',
    noAccount: 'Não tem uma conta? Cadastre-se',
    hasAccount: 'Já tem uma conta? Entre',
    logout: 'Sair'
  },
  en: {
    welcome: 'Welcome to Encurta Link Senai',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    googleLogin: 'Sign in with Google',
    shorten: 'Shorten',
    placeholderUrl: 'Paste your long URL here...',
    links: 'Your Links',
    original: 'Original URL',
    short: 'Short Link',
    clicks: 'Clicks',
    date: 'Date',
    copy: 'Copy',
    delete: 'Delete',
    copied: 'Copied!',
    error: 'An error occurred',
    noAccount: "Don't have an account? Sign up",
    hasAccount: 'Already have an account? Login',
    logout: 'Logout'
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const t = (key: string) => translations[language][key] || key;

  return (
    <ThemeContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
