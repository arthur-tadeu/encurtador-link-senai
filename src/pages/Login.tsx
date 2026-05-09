import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile,
  getAdditionalUserInfo,
  deleteUser
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { useTheme } from '../contexts/ThemeContext';
import { LogIn, UserPlus, Mail, Lock, Languages, Moon, Sun, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { t, toggleTheme, theme, language, setLanguage } = useTheme();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Login realizado com sucesso!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        toast.success('Conta criada com sucesso!');
      }
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/configuration-not-found') {
        toast.error('Configuração do Firebase pendente. Ative o Auth no console.');
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(result);
      
      if (additionalInfo?.isNewUser) {
        // Se for um novo usuário via Google, vamos bloquear (conforme pedido)
        await deleteUser(result.user);
        toast.error('Usuário não cadastrado. Por favor, crie uma conta primeiro.');
        return;
      }

      toast.success('Login com Google realizado!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/configuration-not-found') {
        toast.error('Configuração do Firebase pendente. Ative o Auth no console.');
      } else if (error.code === 'auth/requires-recent-login') {
        // Ignorar erro de deletar usuário se não for crítico aqui
      } else {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="container">
      <div className="controls">
        <button onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')} className="control-btn" title="Alterar Idioma">
          <Languages size={20} />
        </button>
        <button onClick={toggleTheme} className="control-btn" title="Alternar Tema">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
      >
        <div className="text-center">
          <h1 className="title-gradient">Encurta Link Senai</h1>
          <p className="subtitle">{isLogin ? t('welcome') : t('register')}</p>
        </div>

        <form onSubmit={handleEmailAuth}>
          {!isLogin && (
            <div className="input-group">
              <UserIcon className="input-icon" size={18} />
              <input 
                type="text" 
                placeholder="Seu nome"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input 
              type="email" 
              placeholder={t('email')}
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group mb-6">
            <Lock className="input-icon" size={18} />
            <input 
              type="password" 
              placeholder={t('password')}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isLogin ? <LogIn size={20} /> : <UserPlus size={20} />
            )}
            {isLogin ? t('login') : t('register')}
          </button>
        </form>

        <div className="divider">
          <span>ou continue com</span>
        </div>

        <button 
          onClick={handleGoogleAuth}
          className="btn-google"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="Google" />
          <span>{t('googleLogin')}</span>
        </button>

        <p className="text-center mt-6 text-sm text-slate-400">
          {isLogin ? (
            <>
              {t('noAccount')}{' '}
              <button onClick={() => setIsLogin(false)} className="link-indigo">{t('register')}</button>
            </>
          ) : (
            <>
              {t('hasAccount')}{' '}
              <button onClick={() => setIsLogin(true)} className="link-indigo">{t('login')}</button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
