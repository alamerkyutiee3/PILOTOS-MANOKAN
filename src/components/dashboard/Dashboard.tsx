import React, { useState, useEffect } from 'react';
import { Product, Sale } from '../../types/erp';
import { erpService } from '../../services/erpService';
import { useAuth } from '../../App';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Drumstick
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

export default function Dashboard() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    const unsubProducts = erpService.subscribeToProducts(setProducts);
    const unsubSales = erpService.subscribeToSales(setSales);
    return () => {
      unsubProducts();
      unsubSales();
    };
  }, []);

  const totalSalesCount = sales.length;
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;
  const totalItems = products.length;

  // Chart data Preparation
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
  const salesData = last7Days.map(date => {
    const daySales = sales.filter(s => isSameDay(s.timestamp.toDate(), date));
    return {
      name: format(date, 'EEE'),
      amount: daySales.reduce((acc, s) => acc + s.total, 0),
      count: daySales.length
    };
  });

  const cards = [
    { title: 'Sales Volume', value: totalSalesCount, icon: TrendingUp, color: 'bg-blue-500', trend: '+5.2%', isPositive: true },
    { title: 'Meat Products', value: totalItems, icon: Drumstick, color: 'bg-orange-600', trend: '-2', isPositive: false },
    { title: 'Low Stock Alerts', value: lowStockCount, icon: AlertTriangle, color: 'bg-red-500', trend: lowStockCount > 5 ? 'High' : 'Normal', isPositive: lowStockCount <= 5 },
  ];

  if (profile?.role === 'admin') {
    cards.unshift({ title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-500', trend: '+12.5%', isPositive: true });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">PILOTOS CHICKEN MEAT</h2>
          <p className="text-slate-500 mt-1">Operational Dashboard & Analytics</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Updates Enabled
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className={`${card.color} p-3 rounded-xl text-white shadow-lg`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${card.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {card.trend}
                {card.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className={`grid grid-cols-1 ${profile?.role === 'admin' ? 'lg:grid-cols-3' : ''} gap-8`}>
        {profile?.role === 'admin' && (
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Revenue Performance</h3>
              <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1 text-slate-600 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#f97316', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-display">Recent Operations</h3>
          <div className="space-y-6">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{sale.cashierName}</p>
                    <p className="text-xs text-slate-400">{format(sale.timestamp.toDate(), 'HH:mm aaa')}</p>
                  </div>
                </div>
                {profile?.role === 'admin' && (
                  <p className="text-sm font-bold text-slate-900">+${sale.total.toFixed(2)}</p>
                )}
              </div>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-8 text-slate-400 italic text-sm">
                No recent transactions
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
            View Activity Log
          </button>
        </div>
      </div>

      {/* Critical Stock Alerts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            Inventory Alerts
          </h3>
          <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-lg">
            {lowStockCount} Critical
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {products.filter(p => p.stock <= p.lowStockThreshold).map(product => (
            <div key={product.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">Threshold: {product.lowStockThreshold} {product.unit}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{product.stock} {product.unit}</p>
                <p className="text-[10px] uppercase font-bold text-red-500">Refill Required</p>
              </div>
            </div>
          ))}
          {lowStockCount === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm italic">
              All stock levels are healthy
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
