import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, 
  ShieldAlert, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Search, 
  Calendar,
  AlertTriangle,
  Clock,
  Filter
} from 'lucide-react';
import { License, SupabaseCredentials } from './types';
import { initSupabase, getSupabaseClient, getStoredCredentials, saveCredentials } from './services/supabase';

// --- Components ---

const Badge = ({ children, color }: { children?: React.ReactNode, color: 'green' | 'red' | 'yellow' | 'blue' }) => {
  const colors = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[color]} whitespace-nowrap`}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const [newLicense, setNewLicense] = useState({ key: '', expiryDate: '', expiryTime: '23:59' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');

  // Initial Load
  useEffect(() => {
    const initConnection = () => {
      // 1. Try Environment Variables (from .env file)
      const envUrl = import.meta.env.VITE_SUPABASE_URL;
      const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (envUrl && envKey) {
        const result = initSupabase({ url: envUrl, key: envKey });
        if (result.success) {
          setIsConnected(true);
          return;
        } else {
          setError(result.error || "Không thể kết nối với biến môi trường");
        }
      }

      // 2. Try URL parameters
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('sb_url');
      const keyParam = params.get('sb_key');

      if (urlParam && keyParam) {
        const result = initSupabase({ url: urlParam, key: keyParam });
        if (result.success) {
          saveCredentials({ url: urlParam, key: keyParam });
          setIsConnected(true);
          return;
        } else {
          setError(result.error || "Không thể kết nối với thông tin xác thực từ URL");
        }
      }

      // 3. Try Local Storage
      const stored = getStoredCredentials();
      if (stored) {
        const result = initSupabase(stored);
        if (result.success) {
          setIsConnected(true);
        }
      }
    };

    initConnection();
  }, []);

  // Fetch data when connected
  useEffect(() => {
    if (isConnected) {
      fetchLicenses();
    }
  }, [isConnected]);

  const fetchLicenses = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    setLoading(true);
    try {
      const { data, error } = await client
        .from('licenses')
        .select('*')
        .order('expires_at', { ascending: true });

      if (error) throw error;
      setLicenses(data || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;

    try {
      // Combine date and time
      const finalDate = new Date(`${newLicense.expiryDate}T${newLicense.expiryTime}:00`);
      
      const { error } = await client.from('licenses').insert({
        license_key: newLicense.key,
        expires_at: finalDate.toISOString(),
        hwid: null
      });

      if (error) throw error;

      setIsAddModalOpen(false);
      setNewLicense({ key: '', expiryDate: '', expiryTime: '23:59' });
      fetchLicenses();
    } catch (err: any) {
      alert(`Lỗi khi tạo license: ${err.message}`);
    }
  };

  const handleResetHWID = async (key: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    if (!confirm('Bạn có chắc chắn muốn mở khóa license này? Người dùng sẽ có thể liên kết với máy mới.')) return;

    try {
      const { error } = await client
        .from('licenses')
        .update({ hwid: null })
        .eq('license_key', key);
      
      if (error) throw error;
      fetchLicenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (key: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    if (!confirm('Hành động này không thể hoàn tác. Xóa license?')) return;

    try {
      const { error } = await client
        .from('licenses')
        .delete()
        .eq('license_key', key);
      
      if (error) throw error;
      fetchLicenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const generateRandomKey = (type: 'random' | 'friendly' = 'random') => {
    const today = new Date();
    const year = today.getFullYear();
    
    let key = '';
    
    if (type === 'random') {
       // VIP-XXXX-202X
       const random = Math.random().toString(36).substring(2, 8).toUpperCase();
       key = `KEY-${random}-${year}`;
    } else {
       // CUSTOMER001-JAN2026
       const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
       const month = months[today.getMonth()];
       const randNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
       key = `USER${randNum}-${month}${year}`;
    }
    
    setNewLicense(prev => ({ ...prev, key }));
  };

  // Filter & Stats
  const filteredLicenses = useMemo(() => {
    return licenses.filter(l => {
      // 1. Search Filter
      const matchesSearch = l.license_key.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (l.hwid && l.hwid.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // 2. Status/Date Filter
      const now = new Date();
      const expiryDate = new Date(l.expires_at);
      const isExpired = expiryDate < now;
      
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = diffTime / msPerDay;
      const isExpiringSoon = !isExpired && diffDays <= 7;

      switch (filterStatus) {
        case 'active': return !isExpired;
        case 'expired': return isExpired;
        case 'expiring': return isExpiringSoon;
        default: return true; // 'all'
      }
    });
  }, [licenses, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: licenses.length,
      active: licenses.filter(l => l.hwid !== null).length,
      expired: licenses.filter(l => new Date(l.expires_at) < now).length,
      available: licenses.filter(l => l.hwid === null && new Date(l.expires_at) > now).length
    };
  }, [licenses]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded">
              <Key className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Quản Lý License Pro</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-800">
               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-500'}`} />
               <span className="text-xs text-slate-400 font-medium hidden sm:inline">{isConnected ? 'Đã kết nối' : 'Ngoại tuyến'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="space-y-6">
          {!isConnected && (
            <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-300">Chưa kết nối cơ sở dữ liệu</h3>
                <p className="text-sm text-blue-400/70 mt-1">
                  Vui lòng cấu hình thông tin xác thực Supabase bằng một trong các phương thức sau:
                </p>
                <ul className="text-xs text-blue-400/70 mt-2 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Phương thức 1 (Khuyến nghị):</strong> Tạo file <code className="bg-black/30 px-1 py-0.5 rounded">.env</code> trong thư mục gốc với nội dung:
                    <br/>
                    <code className="bg-black/30 px-1 py-0.5 rounded block mt-1">VITE_SUPABASE_URL=your-url<br/>VITE_SUPABASE_ANON_KEY=your-key</code>
                  </li>
                  <li>
                    <strong>Phương thức 2:</strong> Thêm tham số URL: <code className="bg-black/30 px-1 py-0.5 rounded">?sb_url=YOUR_URL&sb_key=YOUR_ANON_KEY</code>
                  </li>
                </ul>
                {error && <p className="text-xs text-red-400 mt-2">Lỗi: {error}</p>}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="text-slate-500 text-xs font-medium uppercase mb-1">Tổng License</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="text-green-500/80 text-xs font-medium uppercase mb-1">Người dùng đang hoạt động</div>
              <div className="text-2xl font-bold text-white">{stats.active}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="text-blue-500/80 text-xs font-medium uppercase mb-1">Có sẵn</div>
              <div className="text-2xl font-bold text-white">{stats.available}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <div className="text-red-500/80 text-xs font-medium uppercase mb-1">Đã hết hạn</div>
              <div className="text-2xl font-bold text-white">{stats.expired}</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row flex-1 gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm key hoặc HWID..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full sm:w-48 bg-slate-900 border border-slate-800 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Chỉ đang hoạt động</option>
                  <option value="expiring">Sắp hết hạn (7 ngày)</option>
                  <option value="expired">Đã hết hạn</option>
                </select>
                <div className="absolute right-3 top-3 w-2 h-2 border-r border-b border-slate-500 rotate-45 pointer-events-none sm:block hidden"></div>
              </div>
            </div>
            
            <div className="flex gap-2">
                <button 
                onClick={fetchLicenses} 
                disabled={!isConnected}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                disabled={!isConnected}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                License mới
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold">
                    <th className="p-4">Mã License</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">ID Phần cứng (HWID)</th>
                    <th className="p-4">Hết hạn lúc</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLicenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        {isConnected ? (
                          searchTerm || filterStatus !== 'all' ? 'Không tìm thấy license phù hợp.' : 'Chưa có license nào được tạo.'
                        ) : (
                          'Đang chờ kết nối...'
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredLicenses.map((license) => {
                      const now = new Date();
                      const expiryDate = new Date(license.expires_at);
                      const isExpired = expiryDate < now;
                      const isUsed = !!license.hwid;
                      
                      // Check for expiring within 7 days
                      const msPerDay = 1000 * 60 * 60 * 24;
                      const diffTime = expiryDate.getTime() - now.getTime();
                      const diffDays = diffTime / msPerDay;
                      const isExpiringSoon = !isExpired && diffDays <= 7;
                      
                      return (
                        <tr key={license.license_key} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 font-mono text-sm text-white">
                            {license.license_key}
                          </td>
                          <td className="p-4">
                            {isExpired ? (
                              <Badge color="red">Đã hết hạn</Badge>
                            ) : isExpiringSoon ? (
                              <Badge color="yellow">Sắp hết hạn</Badge>
                            ) : isUsed ? (
                              <Badge color="green">Đang hoạt động</Badge>
                            ) : (
                              <Badge color="blue">Có sẵn</Badge>
                            )}
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-400">
                            {license.hwid ? (
                              <span title={license.hwid}>{license.hwid.substring(0, 16)}...</span>
                            ) : (
                              <span className="text-slate-600">Chờ kích hoạt</span>
                            )}
                          </td>
                          <td className="p-4 text-sm">
                            <div className={`flex items-center gap-2 ${isExpiringSoon ? 'text-yellow-400 font-medium' : 'text-slate-300'}`}>
                              {isExpiringSoon ? <Clock className="w-3 h-3" /> : <Calendar className="w-3 h-3 text-slate-500" />}
                              {new Date(license.expires_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleResetHWID(license.license_key)}
                                disabled={!license.hwid}
                                className={`p-1.5 rounded transition-colors ${!license.hwid ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
                                title="Mở khóa HWID"
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(license.license_key)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                title="Xóa License"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>

      {/* Modals */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Tạo License mới"
      >
        <form onSubmit={handleCreateLicense} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Mã License</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none font-mono uppercase"
                placeholder="PRO-XXXX-XXXX"
                value={newLicense.key}
                onChange={e => setNewLicense({...newLicense, key: e.target.value})}
                required
              />
              <div className="flex flex-col gap-1">
                <button 
                  type="button" 
                  onClick={() => generateRandomKey('random')}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-[10px] text-white rounded transition-colors"
                >
                  NGẪU NHIÊN
                </button>
                 <button 
                  type="button" 
                  onClick={() => generateRandomKey('friendly')}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-[10px] text-white rounded transition-colors"
                >
                  THÂN THIỆN
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Ngày hết hạn</label>
              <input 
                type="date" 
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                value={newLicense.expiryDate}
                onChange={e => setNewLicense({...newLicense, expiryDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Giờ</label>
              <input 
                type="time" 
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                value={newLicense.expiryTime}
                onChange={e => setNewLicense({...newLicense, expiryTime: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="pt-2">
             <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors shadow-lg shadow-blue-500/20"
              >
                Tạo License
              </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}