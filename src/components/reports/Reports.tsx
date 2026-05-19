import { useState, useEffect } from 'react';
import { Sale } from '../../types/erp';
import { erpService } from '../../services/erpService';
import { 
  FileText, 
  Download, 
  Calendar, 
  ChevronRight,
  Search,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = erpService.subscribeToSales(setSales, 30);
    return () => unsub();
  }, []);

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cashierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h2>
          <p className="text-slate-500 mt-1">Audit sales logs and track profitability</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 bg-white rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Calendar size={18} />
            May 2026
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg transition-all hover:bg-slate-800 active:scale-95">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly GTV</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">${sales.reduce((acc, s) => acc + s.total, 0).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600">
            <span className="bg-emerald-50 px-2 py-1 rounded-lg">+14.2% from April</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Order Value</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            ${sales.length > 0 ? (sales.reduce((acc, s) => acc + s.total, 0) / sales.length).toFixed(2) : '0.00'}
          </p>
          <p className="mt-4 text-xs font-bold text-slate-500 italic">Based on {sales.length} transactions</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Staff</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {new Set(sales.map(s => s.cashierId)).size}
          </p>
          <p className="mt-4 text-xs font-bold text-slate-500 italic">Contributing this period</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-900">Transaction Logs</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by ID or Cashier..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cashier</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Items</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-slate-500">#{sale.id.slice(0, 8)}...</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{format(sale.timestamp.toDate(), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-slate-400">{format(sale.timestamp.toDate(), 'HH:mm aaa')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {sale.cashierName[0]}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{sale.cashierName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      {sale.items.length} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-slate-900">${sale.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No transactions found for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
