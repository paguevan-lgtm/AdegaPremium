import { useState, useEffect } from 'react';
import { Search, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';

interface Customer {
  id: number;
  name: string;
  phone: string;
  debt: number;
  credit_limit: number;
}

export default function Debts() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data.filter((c: Customer) => c.debt > 0));
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Erro ao buscar devedores:', error);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handlePayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;

    await fetch(`/api/customers/${selectedCustomer.id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(paymentAmount) }),
    });

    setSelectedCustomer(null);
    setPaymentAmount('');
    fetchCustomers();
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebt = customers.reduce((acc, c) => acc + c.debt, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Controle de Fiado</h1>
          <p className="text-zinc-400">Gerencie dívidas e pagamentos</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-xs text-red-300 uppercase font-bold">Total a Receber</p>
            <p className="text-xl font-bold text-red-400">R$ {totalDebt.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-yellow-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950/50 text-zinc-200 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Limite</th>
                <th className="px-6 py-4">Dívida</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-200">{customer.name}</td>
                  <td className="px-6 py-4">{customer.phone}</td>
                  <td className="px-6 py-4 text-zinc-300">R$ {customer.credit_limit?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded-md">
                      R$ {customer.debt.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedCustomer(customer)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ml-auto"
                    >
                      <DollarSign className="w-3 h-3" />
                      Receber
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Receber de ${selectedCustomer?.name}`}
      >
        <div className="space-y-6">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
            <p className="text-zinc-400 text-sm">Dívida Atual</p>
            <p className="text-3xl font-bold text-red-400 mt-1">R$ {(selectedCustomer?.debt || 0).toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Valor do Pagamento</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-zinc-100 focus:border-emerald-500/50 outline-none text-lg font-bold"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={!paymentAmount || Number(paymentAmount) <= 0}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirmar Recebimento
          </button>
        </div>
      </Modal>
    </div>
  );
}
