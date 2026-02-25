import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';

interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  cost_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  supplier: string;
  image_url: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { register, handleSubmit, reset, setValue } = useForm<Product>();

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
        console.error('Dados de produtos inválidos:', data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onSubmit = async (data: Product) => {
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setIsModalOpen(false);
    reset();
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    Object.keys(product).forEach((key) => {
      setValue(key as keyof Product, product[key as keyof Product]);
    });
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Produtos</h1>
          <p className="text-zinc-400">Gerencie seu estoque e preços</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); reset(); setIsModalOpen(true); }}
          className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
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
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço Custo</th>
                <th className="px-6 py-4">Preço Venda</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <p>{product.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{product.sku || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">R$ {product.cost_price?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-emerald-400 font-medium">R$ {product.sell_price?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-medium",
                      product.stock <= product.min_stock ? "text-red-400" : "text-zinc-300"
                    )}>
                      {product.stock} un
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEdit(product)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-yellow-500 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Nome</label>
              <input {...register('name', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">SKU</label>
              <input {...register('sku')} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Categoria</label>
              <select {...register('category', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none">
                <option value="Cerveja">Cerveja</option>
                <option value="Whisky">Whisky</option>
                <option value="Vodka">Vodka</option>
                <option value="Energético">Energético</option>
                <option value="Gelo">Gelo</option>
                <option value="Carvão">Carvão</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Fornecedor</label>
              <input {...register('supplier')} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Preço Custo</label>
              <input type="number" step="0.01" {...register('cost_price', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Preço Venda</label>
              <input type="number" step="0.01" {...register('sell_price', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Estoque Atual</label>
              <input type="number" {...register('stock', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Estoque Mínimo</label>
              <input type="number" {...register('min_stock', { required: true })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">URL da Imagem</label>
            <input {...register('image_url')} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:border-yellow-500/50 outline-none" placeholder="https://..." />
          </div>

          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold py-3 rounded-lg mt-4 transition-colors">
            Salvar Produto
          </button>
        </form>
      </Modal>
    </div>
  );
}
