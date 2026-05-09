import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Redirect: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!code) return;

      try {
        const q = query(collection(db, 'links'), where('shortCode', '==', code));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError(true);
          return;
        }

        const linkDoc = querySnapshot.docs[0];
        const linkData = linkDoc.data();

        // Increment clicks
        await updateDoc(doc(db, 'links', linkDoc.id), {
          clicks: increment(1)
        });

        // Redirect
        window.location.href = linkData.originalUrl;
      } catch (err) {
        console.error('Erro ao redirecionar:', err);
        setError(true);
      }
    };

    handleRedirect();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 max-w-sm text-center"
        >
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2">Link não encontrado</h1>
          <p className="text-slate-400 mb-6">O link que você está tentando acessar não existe ou foi removido.</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary w-full"
          >
            Voltar para o Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mb-6"
      >
        <Loader2 size={48} className="text-indigo-500" />
      </motion.div>
      <h2 className="text-xl font-medium text-slate-300">Redirecionando...</h2>
      <p className="text-slate-500 mt-2">Aguarde um momento enquanto te levamos ao destino.</p>
    </div>
  );
};

export default Redirect;
