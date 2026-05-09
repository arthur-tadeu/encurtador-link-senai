import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  updateDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Link as LinkIcon, 
  Copy, 
  Trash2, 
  BarChart3, 
  Moon,
  Sun,
  Search,
  Globe,
  FileText,
  Table as TableIcon,
  ChevronDown,
  Sparkles,
  Pencil,
  X,
  LogOut,
  ExternalLink,
  QrCode,
  Download
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: any;
}

const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editShortCode, setEditShortCode] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // QR Code Modal State
  const [qrLink, setQrLink] = useState<LinkData | null>(null);

  const { toggleTheme, theme, language, setLanguage } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Snapshot em tempo real
    const q = query(
      collection(db, 'links'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LinkData[];
      setLinks(linksData);
    });

    return () => unsubscribe();
  }, [user]);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Validação básica de URL
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }

    try {
      new URL(finalUrl);
    } catch {
      toast.error('Por favor, insira uma URL válida');
      return;
    }

    setLoading(true);
    try {
      const shortCode = generateCode();
      await addDoc(collection(db, 'links'), {
        originalUrl: finalUrl,
        shortCode,
        clicks: 0,
        userId: user?.uid,
        createdAt: serverTimestamp()
      });
      setUrl('');
      toast.success('Link encurtado com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao encurtar. Verifique se o índice do Firestore foi criado.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const fullUrl = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Copiado para a área de transferência!');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir este link permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'links', id));
        toast.success('Link excluído');
      } catch (error) {
        toast.error('Erro ao excluir link');
      }
    }
  };

  const openEditModal = (link: LinkData) => {
    setEditingLink(link);
    setEditUrl(link.originalUrl);
    setEditShortCode(link.shortCode);
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink || !editUrl || !editShortCode) return;

    setUpdateLoading(true);
    try {
      const linkRef = doc(db, 'links', editingLink.id);
      await updateDoc(linkRef, {
        originalUrl: editUrl,
        shortCode: editShortCode
      });
      toast.success('Link atualizado com sucesso!');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar link.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrLink) return;
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode-${qrLink.shortCode}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Links - Encurta Link Pro', 14, 15);
    const tableColumn = ["URL Original", "Link Curto", "Cliques", "Data"];
    const tableRows = filteredLinks.map(link => [
      link.originalUrl,
      `${window.location.origin}/r/${link.shortCode}`,
      link.clicks.toString(),
      link.createdAt?.seconds ? format(new Date(link.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : '--'
    ]);
    (doc as any).autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save('links.pdf');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLinks.map(l => ({
      'URL Original': l.originalUrl,
      'Link Curto': `${window.location.origin}/r/${l.shortCode}`,
      'Cliques': l.clicks,
      'Data': l.createdAt?.seconds ? format(new Date(l.createdAt.seconds * 1000), 'dd/MM/yyyy') : ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Links");
    XLSX.writeFile(wb, "links.xlsx");
  };

  const filteredLinks = links.filter(link => 
    link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header className="main-header">
        <div className="logo-area">
          <div className="logo-icon">
            <LinkIcon size={24} />
          </div>
          <h1 className="logo-text">Encurta <span>Link Pro</span></h1>
        </div>

        <div className="header-actions">
          <div className="flex gap-2">
            <button className="nav-btn" onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}>
              <Globe size={16} /> {language === 'pt' ? 'Português' : 'English'} <ChevronDown size={14} />
            </button>
            <button className="nav-btn" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <div className="user-badge" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowDropdown(!showDropdown)}>
            <div className="flex items-center gap-2">
              <div className="user-avatar-mini" style={{ width: 24, height: 24, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                {user?.displayName?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <ChevronDown size={14} />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '8px', width: '150px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                <button 
                  onClick={() => auth.signOut()} 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'var(--transition)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="hero-card">
        <div className="hero-content">
          <h2 className="hero-title">Encurte seu link</h2>
          <p className="hero-subtitle">Cole uma URL longa e transforme em um link curto e poderoso ✨</p>
          
          <form onSubmit={handleShorten} className="input-container">
            <Globe className="search-icon" size={20} style={{ position: 'relative', left: 10, transform: 'none' }} />
            <input 
              type="text" 
              className="url-input" 
              placeholder="Cole sua URL longa aqui..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="submit" disabled={loading} className="shorten-btn">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Encurtar
                </>
              )}
            </button>
          </form>
        </div>
        <div className="hero-illustration"></div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-title">
          <BarChart3 size={20} className="text-indigo-400" />
          Seus Links
        </div>

        <div className="dashboard-controls">
          <div className="filters">
            <button onClick={exportToPDF} className="filter-btn"><FileText size={16} /> PDF</button>
            <button onClick={exportToExcel} className="filter-btn"><TableIcon size={16} /> Excel</button>
            <div className="search-wrapper">
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Pesquisar links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="count-badge">
            <div className="dot"></div>
            {filteredLinks.length} links encontrados
          </div>
        </div>

        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Link Curto</th>
                <th>URL Original</th>
                <th>Cliques</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map(link => (
                <tr key={link.id}>
                  <td>
                    <div className="short-link-pill">
                      <LinkIcon size={14} />
                      encurta.pro/{link.shortCode}
                      <button onClick={() => copyToClipboard(link.shortCode)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="original-url-cell">{link.originalUrl}</div>
                  </td>
                  <td>
                    <span className="stat-cell">{link.clicks}</span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {link.createdAt?.seconds ? format(new Date(link.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : '--'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button onClick={() => setQrLink(link)} className="small-action-btn" title="QR Code"><QrCode size={14} /></button>
                      <a href={`/r/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="small-action-btn" title="Acessar Link" style={{ textDecoration: 'none' }}><ExternalLink size={14} /></a>
                      <button onClick={() => openEditModal(link)} className="small-action-btn" title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(link.id)} className="small-action-btn delete" title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLinks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    Nenhum link encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title"><Pencil size={24} className="text-indigo-400" /> Editar Link</h2>
              <button onClick={() => setIsModalOpen(false)} className="small-action-btn" style={{ border: 'none' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdate}>
              <label className="input-label">URL Original</label>
              <div className="input-container" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Globe className="search-icon" size={18} style={{ position: 'relative', left: 10, transform: 'none' }} />
                <input 
                  type="text" 
                  className="url-input" 
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  required
                />
              </div>

              <label className="input-label">Código Curto (Customizado)</label>
              <div className="input-container" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <LinkIcon className="search-icon" size={18} style={{ position: 'relative', left: 10, transform: 'none' }} />
                <input 
                  type="text" 
                  className="url-input" 
                  value={editShortCode}
                  onChange={(e) => setEditShortCode(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={updateLoading} className="shorten-btn" style={{ flex: 1 }}>
                  {updateLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrLink && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header" style={{ marginBottom: '1rem' }}>
              <h2 className="modal-title" style={{ justifyContent: 'center', width: '100%' }}>QR Code</h2>
              <button onClick={() => setQrLink(null)} className="small-action-btn" style={{ border: 'none', position: 'absolute', right: '1.5rem', top: '1.5rem' }}><X size={20} /></button>
            </div>
            
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
              <QRCodeCanvas 
                id="qr-canvas"
                value={`${window.location.origin}/r/${qrLink.shortCode}`} 
                size={220} 
                level={"H"}
                includeMargin={true}
              />
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              encurta.pro/{qrLink.shortCode}
            </p>

            <button onClick={downloadQRCode} className="shorten-btn" style={{ width: '100%', justifyContent: 'center' }}>
              <Download size={18} /> Baixar QR Code
            </button>
          </div>
        </div>
      )}

      <footer className="main-footer">
        © 2026 Encurta Link Pro v2.0 • Feito com 💜 para você
      </footer>
    </>
  );
};

export default Home;
