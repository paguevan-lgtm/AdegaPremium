import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { cn } from '../lib/utils';

interface DashboardStats {
  dailySales: number;
  monthlySales: number;
  lowStock: number;
  activeRentals: number;
  totalCustomers: number;
  topProducts: { name: string; quantity: number }[];
  recentSales: { id: number; total: number; created_at: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-zinc-400 p-8">Carregando dashboard...</div>;

  const cards = [
    {
      title: 'Vendas Hoje',
      value: `R$ ${(stats?.dailySales || 0).toFixed(2)}`,
      icon: DollarSign,
      trend: 'Hoje',
      trendUp: true,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      title: 'Vendas Mês',
      value: `R$ ${(stats?.monthlySales || 0).toFixed(2)}`,
      icon: TrendingUp,
      trend: 'Este Mês',
      trendUp: true,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      title: 'Estoque Baixo',
      value: stats?.lowStock || 0,
      icon: AlertTriangle,
      trend: 'Atenção',
      trendUp: false,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      title: 'Clientes Ativos',
      value: stats?.totalCustomers || 0,
      icon: Users,
      trend: 'Total',
      trendUp: true,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", card.bg)}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
              <span className={cn("text-xs font-medium px-2 py-1 rounded-full bg-zinc-800", card.trendUp ? "text-emerald-400" : "text-red-400")}>
                {card.trend}
              </span>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-zinc-100 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-zinc-100 mb-6">Produtos Mais Vendidos</h3>
          <div className="h-[300px]">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                    itemStyle={{ color: '#eab308' }}
                  />
                  <Bar dataKey="quantity" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Sem dados de vendas
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-zinc-100 mb-6">Vendas Recentes</h3>
          <div className="space-y-4">
            {stats?.recentSales && stats.recentSales.length > 0 ? (
              stats.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Venda #{sale.id}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-medium">+ R$ {sale.total.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-500 py-8">
                Nenhuma venda recente
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
