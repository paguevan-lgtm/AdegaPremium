import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Sale {
  id: number;
  customer_name: string;
  user_name: string;
  total: number;
  payment_method: string;
  created_at: string;
}

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSales(data);
        } else {
          setSales([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setSales([]);
        setLoading(false);
      });
  }, []);

  const paymentData = sales.reduce((acc: any[], sale) => {
    const existing = acc.find(item => item.name === sale.payment_method);
    if (existing) {
      existing.value += sale.total;
    } else {
      acc.push({ name: sale.payment_method, value: sale.total });
    }
    return acc;
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Relatórios Financeiros</h1>
          <p className="text-zinc-400">Análise detalhada de vendas e faturamento</p>
        </div>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors">
          <Download className="w-5 h-5" />
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-zinc-100 mb-6">Vendas por Método de Pagamento</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                  itemStyle={{ color: '#eab308' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {paymentData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-zinc-400 capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl overflow-hidden">
          <h3 className="text-lg font-bold text-zinc-100 mb-6">Histórico de Vendas</h3>
          <div className="overflow-y-auto max-h-[300px] pr-2 space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Venda #{sale.id}</p>
                  <p className="text-xs text-zinc-500">{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">R$ {sale.total.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500 capitalize">{sale.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
