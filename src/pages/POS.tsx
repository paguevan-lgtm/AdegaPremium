import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, User, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import Modal from '../components/Modal';

interface Product {
  id: number;
  name: string;
  sku: string;
  sell_price: number;
  stock: number;
  image_url: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        else setProducts([]);
      })
      .catch(() => setProducts([]));

    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
        else setCustomers([]);
      })
      .catch(() => setCustomers([]));
  }, []);

  // Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'Enter') {
        if (barcodeBuffer) {
          const product = products.find(p => p.sku === barcodeBuffer);
          if (product) {
            addToCart(product);
            // Visual feedback
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
            toast.innerText = `Produto adicionado: ${product.name}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
          } else {
            console.log('Produto não encontrado para SKU:', barcodeBuffer);
            // Error feedback
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2';
            toast.innerText = `Produto não encontrado (SKU: ${barcodeBuffer})`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
          }
          setBarcodeBuffer('');
        }
      } else if (e.key.length === 1) {
        setBarcodeBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, barcodeBuffer]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.sell_price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer,
          payment_method: paymentMethod,
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
          }))
        })
      });

      if (!res.ok) throw new Error('Erro ao finalizar venda');

      setCart([]);
      setIsCheckoutOpen(false);
      setSelectedCustomer(null);
      alert('Venda realizada com sucesso!');
    } catch (err) {
      alert('Erro ao processar venda');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-yellow-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl hover:border-yellow-500/50 hover:bg-zinc-800/50 transition-all text-left group flex flex-col justify-between h-full"
            >
              <div className="w-full aspect-square bg-zinc-950 rounded-xl mb-3 overflow-hidden">
                {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />}
              </div>
              <div>
                <h3 className="font-medium text-zinc-200 line-clamp-2">{product.name}</h3>
                <p className="text-emerald-400 font-bold mt-1">R$ {product.sell_price?.toFixed(2)}</p>
                <p className="text-xs text-zinc-500 mt-1">Estoque: {product.stock}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl flex flex-col shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-zinc-100">Carrinho</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-500 py-10">Carrinho vazio</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 flex gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                  <p className="text-xs text-emerald-400 font-bold">R$ {(item.sell_price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-yellow-500 text-zinc-400"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-yellow-500 text-zinc-400"><Plus className="w-3 h-3" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-zinc-400">Total</span>
            <span className="text-3xl font-bold text-emerald-400">R$ {total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/20"
          >
            Finalizar Venda
          </button>
        </div>
      </div>

      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Finalizar Venda"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Cliente (Opcional)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <select
                value={selectedCustomer || ''}
                onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-yellow-500/50 appearance-none"
              >
                <option value="">Cliente Balcão</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">Forma de Pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'pix', label: 'Pix', icon: Banknote },
                { id: 'cash', label: 'Dinheiro', icon: Banknote },
                { id: 'credit', label: 'Crédito', icon: CreditCard },
                { id: 'debit', label: 'Débito', icon: CreditCard },
                { id: 'fiado', label: 'Fiado', icon: User },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    paymentMethod === method.id 
                      ? "bg-yellow-500/10 border-yellow-500 text-yellow-500" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                  )}
                >
                  <method.icon className="w-5 h-5" />
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="flex justify-between mb-6">
              <span className="text-zinc-400">Total a Pagar</span>
              <span className="text-2xl font-bold text-emerald-400">R$ {total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading || (paymentMethod === 'fiado' && !selectedCustomer)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Processando...' : <><Check className="w-5 h-5" /> Confirmar Pagamento</>}
            </button>
            {paymentMethod === 'fiado' && !selectedCustomer && (
              <p className="text-red-400 text-xs text-center mt-2">Selecione um cliente para venda fiado</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
