import { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle, Clock, AlertTriangle, User, Box } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Rental {
  id: number;
  customer_id: number;
  customer_name: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'returned' | 'late';
}

interface Customer {
  id: number;
  name: string;
}

export default function Rentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchRentals = async () => {
    try {
      const res = await fetch('/api/rentals');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRentals(data);
      } else {
        setRentals([]);
      }
    } catch (error) {
      console.error('Erro ao buscar aluguéis:', error);
      setRentals([]);
    }
  };

  useEffect(() => {
    fetchRentals();
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
        else setCustomers([]);
      })
      .catch(() => setCustomers([]));
  }, []);

  const onSubmit = async (data: any) => {
    await fetch('/api/rentals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setIsModalOpen(false);
    reset();
    fetchRentals();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/rentals/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchRentals();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'returned': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'late': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Em Aberto';
      case 'returned': return 'Devolvido';
      case 'late': return 'Atrasado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Aluguéis</h1>
          <p className="text-zinc-400">Controle de mesas, cadeiras e caixas</p>
        </div>
        <button
          onClick={() => { reset(); setIsModalOpen(true); }}
          className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Aluguel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rentals.map((rental) => (
          <div key={rental.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group relative overflow-hidden">
            <div className={cn("absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase rounded-bl-xl border-b border-l", getStatusColor(rental.status))}>
              {getStatusLabel(rental.status)}
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-zinc-800 rounded-xl text-yellow-500">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-lg">{rental.item_name}</h3>
                <p className="text-zinc-400 text-sm">{rental.quantity} unidades</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <User className="w-4 h-4 text-zinc-500" />
                {rental.customer_name}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Calendar className="w-4 h-4 text-zinc-500" />
                {format(new Date(rental.start_date), 'dd/MM/yyyy')} - {format(new Date(rental.end_date), 'dd/MM/yyyy')}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Clock className="w-4 h-4 text-zinc-500" />
                {rental.status === 'late' ? 'Atrasado' : 'No prazo'}
              </div>
            </div>

            {rental.status === 'active' && (
              <button
                onClick={() => updateStatus(rental.id, 'returned')}
                className="w-full bg-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 border border-zinc-700 text-zinc-300 font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar Devolvido
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Aluguel"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Cliente</label>
            <select {...register('customer_id', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none">
              <option value="">Selecione...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Item</label>
              <select {...register('item_name', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none">
                <option value="Jogo de Mesa (Plástico)">Jogo de Mesa (Plástico)</option>
                <option value="Jogo de Mesa (Madeira)">Jogo de Mesa (Madeira)</option>
                <option value="Cadeira Avulsa">Cadeira Avulsa</option>
                <option value="Caixa Térmica 100L">Caixa Térmica 100L</option>
                <option value="Cooler">Cooler</option>
                <option value="Tenda 3x3">Tenda 3x3</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Quantidade</label>
              <input type="number" {...register('quantity', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Valor Unitário</label>
            <input type="number" step="0.01" {...register('unit_price', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Data Retirada</label>
              <input type="date" {...register('start_date', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Data Devolução</label>
              <input type="date" {...register('end_date', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
          </div>

          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 rounded-lg mt-4 transition-colors">
            Registrar Aluguel
          </button>
        </form>
      </Modal>
    </div>
  );
}
