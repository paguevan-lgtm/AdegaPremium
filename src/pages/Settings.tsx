import { useState, useEffect } from 'react';
import { Users, Shield, Activity, Search, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

interface UserStats {
  total_sales: number;
  total_revenue: number;
  average_ticket: number;
}

interface ActivityLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
}

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userLogs, setUserLogs] = useState<ActivityLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUserDetails = async (userId: number) => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch(`/api/users/${userId}/stats`),
        fetch(`/api/users/${userId}/logs`)
      ]);
      
      const stats = await statsRes.json();
      const logs = await logsRes.json();
      
      setUserStats(stats);
      setUserLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchUserDetails(selectedUser.id);
    }
  }, [selectedUser]);

  const onSubmit = async (data: any) => {
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error('Erro ao salvar usuário');
      
      setIsModalOpen(false);
      reset();
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert('Erro ao salvar usuário');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza?')) return;
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Configurações</h1>
        <p className="text-zinc-400">Gestão de usuários e auditoria</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
            <h2 className="font-bold text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" />
              Equipe
            </h2>
            <button 
              onClick={() => { setEditingUser(null); reset(); setIsModalOpen(true); }}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-yellow-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {users.map(user => (
              <div 
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all",
                  selectedUser?.id === user.id 
                    ? "bg-yellow-500/10 border-yellow-500/50" 
                    : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn("font-medium", selectedUser?.id === user.id ? "text-yellow-500" : "text-zinc-200")}>
                      {user.name}
                    </p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full border",
                    user.role === 'admin' 
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedUser ? (
            <>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-yellow-500">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-zinc-100">{selectedUser.name}</h2>
                      <p className="text-zinc-400">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEdit(selectedUser)}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-yellow-500 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedUser.id)}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase font-bold">Vendas Totais</p>
                    <p className="text-xl font-bold text-zinc-100">{userStats?.total_sales || 0}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase font-bold">Faturamento</p>
                    <p className="text-xl font-bold text-emerald-400">R$ {userStats?.total_revenue?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase font-bold">Ticket Médio</p>
                    <p className="text-xl font-bold text-blue-400">R$ {userStats?.average_ticket?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-zinc-400" />
                  <h3 className="font-bold text-zinc-100">Log de Atividades Recentes</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Data/Hora</th>
                        <th className="px-6 py-3">Ação</th>
                        <th className="px-6 py-3">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {userLogs.map(log => (
                        <tr key={log.id} className="hover:bg-zinc-800/20">
                          <td className="px-6 py-3 text-zinc-400 whitespace-nowrap">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-3">
                            <span className="px-2 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-zinc-300">{log.details}</td>
                        </tr>
                      ))}
                      {userLogs.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                            Nenhuma atividade registrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-2xl">
              <Users className="w-12 h-12 mb-4 opacity-20" />
              <p>Selecione um usuário para ver detalhes</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nome</label>
            <input {...register('name', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <input type="email" {...register('email', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Senha {editingUser && '(deixe em branco para manter)'}</label>
            <input type="password" {...register('password', { required: !editingUser })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Função</label>
            <select {...register('role', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none">
              <option value="employee">Funcionário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 rounded-lg mt-4 transition-colors">
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  );
}
