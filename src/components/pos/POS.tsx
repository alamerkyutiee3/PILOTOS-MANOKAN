import { useState, useEffect } from 'react';
import { Product, SaleItem } from '../../types/erp';
import { erpService } from '../../services/erpService';
import { useAuth } from '../../App';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight,
  Drumstick,
  Printer,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function POS() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);

  useEffect(() => {
    const unsub = erpService.subscribeToProducts(setProducts);
    return () => unsub();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.priceAtSale }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        priceAtSale: product.price,
        subtotal: product.price
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        // Check stock
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty, subtotal: newQty * item.priceAtSale };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !profile) return;
    setIsProcessing(true);
    try {
      const saleId = await erpService.processSale({
        items: cart,
        total,
        cashierId: profile.uid,
        cashierName: profile.displayName
      });
      if (saleId) {
        setShowReceipt(saleId);
        setCart([]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Point of Sale</h2>
            <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
              Station: PICK-UP / DINE-IN
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select 
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium appearance-none text-sm"
                onChange={(e) => {
                  const prod = products.find(p => p.id === e.target.value);
                  if (prod) addToCart(prod);
                  e.target.value = ""; // Reset
                }}
                defaultValue=""
              >
                <option value="" disabled>Quick Select Item...</option>
                {products.filter(p => p.stock > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.price.toFixed(2)} ({p.stock} left)
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={product.id}
                onClick={() => addToCart(product)}
                className="group relative flex flex-col p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-500 hover:shadow-lg hover:shadow-orange-50/50 transition-all text-left overflow-hidden"
              >
                <div className="mb-3 w-12 h-12 bg-slate-50 group-hover:bg-orange-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                  <Drumstick size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{product.category}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-bold text-orange-600">${product.price.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.stock} left</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} className="text-orange-600" />
                </div>
              </motion.button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 italic">
                No products match your search or items are out of stock.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-slate-900" />
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Current Order</h3>
          </div>
          <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {cart.length} ITEMS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.map((item) => (
            <div key={item.productId} className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-bold text-slate-900 truncate">{item.name}</h5>
                <p className="text-xs text-slate-500 mt-0.5">${item.priceAtSale.toFixed(2)} / unit</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between items-end">
                <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
                <p className="text-sm font-bold text-slate-900">${item.subtotal.toFixed(2)}</p>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 opacity-30 select-none">
              <ShoppingCart size={48} className="mb-4" />
              <p className="text-sm font-bold">Your cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax (Included)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Amount</span>
              <span className="text-orange-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${
              cart.length === 0 || isProcessing 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98] shadow-orange-100'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <ChevronRight size={20} />
                Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Receipt Dialog */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowReceipt(null)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Payment Success!</h3>
              <p className="text-slate-500 text-sm mt-1">Transaction ID: {showReceipt}</p>
              
              <div className="w-full mt-8 border-t border-dashed border-slate-200 pt-6 pb-6 text-sm text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier</span>
                  <span className="font-medium">{profile?.displayName}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t border-slate-100 mt-2">
                  <span>Amount Paid</span>
                  <span className="text-orange-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowReceipt(null)}
                  className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
