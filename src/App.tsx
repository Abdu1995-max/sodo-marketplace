import { useEffect, useState, FormEvent, useMemo, MouseEvent } from 'react';
import { Send, Package, Plus, Settings, Trash2, ArrowLeft, LogOut, Search, X as CloseIcon, MapPin, Box, Filter, ChevronRight, Globe, ShieldCheck, Star, TrendingUp, BarChart3, ChevronDown, ShoppingCart, Minus, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  shopName?: string;
  category?: string;
  moq?: string;
  location?: string;
  isFeatured?: boolean;
  specifications?: { key: string; value: string }[];
  reviews?: { user: string; rating: number; comment: string; date: string }[];
}

interface CartItem extends Product {
  quantity: number;
}

const SmartImage = ({ src, alt, className, size = "400/400", lowData = false }: { src: string; alt: string; className?: string; size?: string; lowData?: boolean }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset states when src changes to allow new image to load/preview correctly
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);

  // Optimize Picsum URLs if they don't have dimensions
  const optimizedSrc = useMemo(() => {
    if (!src) return `https://picsum.photos/seed/placeholder/${size}${lowData ? '?grayscale' : ''}`;
    let finalSrc = src;
    if (src.includes('picsum.photos') && !src.match(/\/\d+\/\d+/)) {
      finalSrc = `${src.replace(/\/$/, '')}/${size}`;
    }
    if (lowData && finalSrc.includes('picsum.photos')) {
      finalSrc += finalSrc.includes('?') ? '&grayscale' : '?grayscale';
    }
    return finalSrc;
  }, [src, size, lowData]);

  return (
    <div className={`relative overflow-hidden bg-zinc-100 ${className}`}>
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-6 h-6 border-2 border-[#FF6600]/20 border-t-[#FF6600] rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <img
        key={optimizedSrc}
        src={error ? `https://picsum.photos/seed/error/${size}` : optimizedSrc}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-xl'}`}
      />
    </div>
  );
};

const WHATSAPP_NUMBER = "251919644623"; // Ethiopia country code +251
const TELEGRAM_USERNAME = "abd0642"; // Telegram alternative
const SUPPORT_PHONE = "0919644623";
const ADMIN_PASSWORD = "sodo2026";
const ITEMS_PER_PAGE = 12;

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Apparel",
  "Home & Garden",
  "Beauty",
  "Sports",
  "Industrial",
  "Food & Beverage"
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [view, setView] = useState<'shop' | 'admin' | 'detail'>('shop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    phone: '',
    location: ''
  });
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'checkout-whatsapp' | 'checkout-telegram' | 'contact-whatsapp' | 'contact-telegram', product?: Product } | null>(null);
  const [backendStats, setBackendStats] = useState<{
    totalOrders: number;
    avgOrderValue: number;
    topCategories: { category: string; total_sold: number }[];
    totalRevenue: number;
    totalProducts: number;
  } | null>(null);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    image: '',
    shopName: '',
    category: 'Electronics',
    moq: '1 piece',
    location: 'Sodo, Ethiopia',
    isFeatured: false
  });

  const fetchProducts = () => {
    setLoading(true);
    setFetchError(null);
    fetch('/api/products')
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Convert 0/1 to boolean for isFeatured
          const formattedData = data.map(p => ({
            id: p._id,
            ...p,
            isFeatured: !!p.isFeatured
          }));
          setProducts(formattedData);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setFetchError('Could not connect to the server. Please check your connection and try again.');
        setProducts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchBackendStats = () => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setBackendStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  };

  useEffect(() => {
    if (isAdminAuthenticated && view === 'admin') {
      fetchBackendStats();
    }
  }, [isAdminAuthenticated, view, products]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setPasswordInput('');
      setPasswordError(false);
      setView('admin');
    }
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setView('shop');
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      if (response.ok) {
        setNewProduct({ 
          name: '', price: 0, description: '', image: '', shopName: '', 
          category: 'Electronics', moq: '1 piece', location: 'Sodo, Ethiopia',
          isFeatured: false
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (productToDelete === null) return;
    try {
      const response = await fetch(`/api/admin/delete/${productToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        removeFromCart(productToDelete);
        if (selectedProduct?.id === productToDelete) {
          setSelectedProduct(null);
          setView('shop');
        }
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setProductToDelete(null);
    }
  };

  const toggleFeatured = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/featured/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentStatus }),
      });
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editProduct?.id) return;
    try {
      const response = await fetch(`/api/admin/update/${editProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProduct),
      });
      if (response.ok) {
        setEditProduct(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleImageMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleContactSupplier = (product: Product) => {
    if (!buyerInfo.name || !buyerInfo.phone || !buyerInfo.location) {
      setPendingAction({ type: 'contact', product });
      setShowBuyerForm(true);
      return;
    }
  };

  const handleContactSupplierWhatsApp = (product: Product) => {
    const buyerDetails = buyerInfo.name ? `\n\nBuyer Info:\nName: ${buyerInfo.name}\nPhone: ${buyerInfo.phone}\nLocation: ${buyerInfo.location}` : '';
    const text = encodeURIComponent(`Hello! I'm interested in "${product.name}" from "${product.shopName || 'your shop'}".\nMOQ: ${product.moq}\nLocation: ${product.location}${buyerDetails}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleContactSupplierTelegram = (product: Product) => {
    const buyerDetails = buyerInfo.name ? `\n\nBuyer Info:\nName: ${buyerInfo.name}\nPhone: ${buyerInfo.phone}\nLocation: ${buyerInfo.location}` : '';
    const text = encodeURIComponent(`Hello! I'm interested in "${product.name}" from "${product.shopName || 'your shop'}".\nMOQ: ${product.moq}\nLocation: ${product.location}${buyerDetails}`);
    window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${text}`, '_blank');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.shopName && product.shopName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const featuredProducts = useMemo(() => {
    return products.filter(p => p.isFeatured).slice(0, 4);
  }, [products]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleCheckout = async (platform: 'whatsapp' | 'telegram') => {
    if (cart.length === 0) return;

    try {
      // Record order in backend for stats
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          totalAmount: cartTotalPrice
        })
      });

      // Construct message
      const buyerDetails = `\n\nBuyer Info:\nName: ${buyerInfo.name}\nPhone: ${buyerInfo.phone}\nLocation: ${buyerInfo.location}`;
      const itemsList = cart.map(item => `- ${item.name} x${item.quantity} ($${(item.price * item.quantity).toFixed(2)})`).join('\n');
      const text = encodeURIComponent(`New Order Request!\n\nItems:\n${itemsList}\n\nTotal: $${cartTotalPrice.toFixed(2)}${buyerDetails}\n\nPlease contact me for delivery.`);

      if (platform === 'whatsapp') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
      } else {
        window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${text}`, '_blank');
      }

      // Clear cart
      setCart([]);
      setIsCartOpen(false);
    } catch (error) {
      console.error('Error during checkout:', error);
      // Still open app even if backend fails
      const buyerDetails = `\n\nBuyer Info:\nName: ${buyerInfo.name}\nPhone: ${buyerInfo.phone}\nLocation: ${buyerInfo.location}`;
      const itemsList = cart.map(item => `- ${item.name} x${item.quantity} ($${(item.price * item.quantity).toFixed(2)})`).join('\n');
      const text = encodeURIComponent(`New Order Request!\n\nItems:\n${itemsList}\n\nTotal: $${cartTotalPrice.toFixed(2)}${buyerDetails}\n\nPlease contact me for delivery.`);

      if (platform === 'whatsapp') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
      } else {
        window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${text}`, '_blank');
      }
    }
  };

  const handleBuyerFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowBuyerForm(false);

    if (pendingAction) {
      if (pendingAction.type === 'checkout-whatsapp') {
        handleCheckout('whatsapp');
      } else if (pendingAction.type === 'checkout-telegram') {
        handleCheckout('telegram');
      } else if (pendingAction.type === 'contact-whatsapp' && pendingAction.product) {
        handleContactSupplierWhatsApp(pendingAction.product);
      } else if (pendingAction.type === 'contact-telegram' && pendingAction.product) {
        handleContactSupplierTelegram(pendingAction.product);
      }
      setPendingAction(null);
    }
  };

  const adminStats = useMemo(() => {
    return {
      total: products.length,
      featured: products.filter(p => p.isFeatured).length,
      categories: new Set(products.map(p => p.category)).size
    };
  }, [products]);

  return (
    <div className="min-h-screen bg-[#F2F3F7] font-sans text-[#333]">
      {/* Top Banner */}
      <div className="bg-[#FF6600] text-white py-2 px-4 text-center text-xs font-bold">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Globe size={12} /> Global Sourcing</span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Trade Assurance</span>
          </div>
          <div className="hidden sm:block">One-stop B2B marketplace for Sodo vendors</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setView('shop'); setSelectedCategory('All Categories'); setSelectedProduct(null); setIsZoomed(false);}}>
            <div className="bg-[#FF6600] p-1.5 rounded-lg">
              <Package size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-[#FF6600] tracking-tighter hidden sm:block">SODOBA</h1>
          </div>

          {view !== 'admin' && (
            <div className="flex-1 max-w-2xl flex gap-2">
              {/* Category Dropdown */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="h-full px-4 border-2 border-zinc-200 rounded-full flex items-center gap-2 text-sm font-medium hover:bg-zinc-50 transition-colors whitespace-nowrap"
                >
                  {selectedCategory === "All Categories" ? "Categories" : selectedCategory}
                  <ChevronDown size={16} className={`transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isCategoryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-[60]"
                    >
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors ${selectedCategory === cat ? 'text-[#FF6600] font-bold' : 'text-zinc-600'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-zinc-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products, suppliers..."
                  className="w-full bg-white border-2 border-[#FF6600] rounded-full py-2 pl-10 pr-12 text-sm focus:outline-none shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600"
                  >
                    <CloseIcon size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLowDataMode(!lowDataMode)}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${lowDataMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              title={lowDataMode ? "Disable Low Data Mode" : "Enable Low Data Mode"}
            >
              <Globe size={12} />
              {lowDataMode ? "Low Data: ON" : "Low Data"}
            </button>
            <div className="relative">
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-zinc-500 hover:text-[#FF6600] transition-colors relative"
              >
                <ShoppingCart size={24} />
                {cartTotalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF6600] text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartTotalItems}
                  </span>
                )}
              </button>
            </div>
            {view !== 'admin' ? (
              <button
                onClick={handleAdminAccess}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm font-medium"
              >
                <Settings size={18} className="text-zinc-500" />
                <span className="hidden sm:inline">Supplier Center</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('shop')}
                  className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold hidden sm:block">Admin Panel</h1>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  <LogOut size={24} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {view === 'shop' ? (
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col md:flex-row gap-6">
          {/* Sidebar Categories */}
          <aside className="w-full md:w-64 shrink-0 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100">
              <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                <Filter size={16} /> Categories
              </h2>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${
                      selectedCategory === cat
                      ? 'bg-[#FFF0E6] text-[#FF6600] font-bold'
                      : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {cat}
                    <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedCategory === cat ? 'opacity-100' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#FF6600] to-[#FF9900] rounded-xl p-5 text-white shadow-md">
              <h3 className="font-bold mb-2">Source with Confidence</h3>
              <p className="text-xs opacity-90 leading-relaxed">Verified suppliers and trade assurance for every order in Sodo.</p>
              <button className="mt-4 w-full bg-white text-[#FF6600] py-2 rounded-lg text-xs font-bold hover:bg-zinc-50 transition-colors">
                Learn More
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            {/* Featured Section */}
            {selectedCategory === "All Categories" && !searchQuery && featuredProducts.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#FF6600]">
                  <TrendingUp size={20} />
                  <h2 className="text-lg font-bold">Featured Products</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featuredProducts.map(product => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-orange-100 relative group cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(product);
                        setView('detail');
                      }}
                    >
                      <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white p-1 rounded-full shadow-lg">
                        <Star size={14} fill="currentColor" />
                      </div>
                      <div className="aspect-square">
                        <SmartImage src={product.image} alt={product.name} size="300/300" lowData={lowDataMode} />
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-bold truncate mb-1">{product.name}</h3>
                        <p className="text-[#FF6600] font-black text-sm">${product.price.toFixed(2)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-800">
                  {selectedCategory === "All Categories" ? "Recommended for You" : selectedCategory}
                  <span className="ml-2 text-sm font-normal text-zinc-400">({filteredProducts.length} items)</span>
                </h2>
              </div>

              {fetchError ? (
                <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm border border-red-100">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-red-400 text-3xl">⚠</span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800 mb-2">Connection Error</h3>
                  <p className="text-zinc-500 text-sm max-w-sm mb-6">{fetchError}</p>
                  <button
                    onClick={fetchProducts}
                    className="flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-xl h-80 shadow-sm border border-zinc-100"></div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-20 flex flex-col items-center justify-center text-zinc-400 shadow-sm border border-zinc-100">
                  <Package size={64} className="mb-4 opacity-10" />
                  <p className="text-lg">No products found matching your criteria</p>
                  <button
                    onClick={() => {setSearchQuery(''); setSelectedCategory('All Categories');}}
                    className="mt-4 text-[#FF6600] font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl overflow-hidden flex flex-col border border-zinc-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(product);
                        setView('detail');
                      }}
                    >
                      <div className="aspect-square overflow-hidden relative">
                        <img
                          src={product.image || 'https://picsum.photos/seed/placeholder/400/300'}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded shadow-sm text-zinc-600">
                            {product.category}
                          </span>
                          {product.isFeatured && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                              <Star size={10} fill="currentColor" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2 group-hover:text-[#FF6600] transition-colors">{product.name}</h3>

                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-lg font-black text-[#333]">${product.price.toFixed(2)}</span>
                          <span className="text-[10px] text-zinc-400">/ piece</span>
                        </div>

                        <div className="space-y-1.5 mb-4 flex-1">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Box size={14} className="text-zinc-400" />
                            <span>MOQ: <span className="text-zinc-800 font-medium">{product.moq}</span></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <MapPin size={14} className="text-zinc-400" />
                            <span>{product.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[#FF6600] font-medium">
                            <ShieldCheck size={14} />
                            <span>Verified Supplier</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Supplier</span>
                            <span className="text-xs font-bold text-zinc-700 truncate max-w-[100px]">{product.shopName}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering product detail view
                              if (!buyerInfo.name || !buyerInfo.phone || !buyerInfo.location) {
                                setPendingAction({ type: 'contact-whatsapp', product });
                                setShowBuyerForm(true);
                                return;
                              }
                              handleContactSupplierWhatsApp(product);
                            }}
                            className="flex items-center justify-center gap-1.5 bg-[#FF6600] hover:bg-[#E65C00] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                          >
                            <Send size={14} fill="currentColor" />
                            Contact
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1 mx-2">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Simple logic to show only some pages if many
                        if (
                          totalPages <= 7 ||
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                                currentPage === pageNum
                                  ? 'bg-[#FF6600] text-white shadow-md shadow-orange-100'
                                  : 'text-zinc-500 hover:bg-zinc-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          (pageNum === 2 && currentPage > 4) ||
                          (pageNum === totalPages - 1 && currentPage < totalPages - 3)
                        ) {
                          return <span key={pageNum} className="px-1 text-zinc-300">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      ) : view === 'detail' && selectedProduct ? (
        <main className="mx-auto max-w-6xl px-4 py-8">
          <button
            onClick={() => {setView('shop'); setIsZoomed(false);}}
            className="flex items-center gap-2 text-zinc-500 hover:text-[#FF6600] transition-colors mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Marketplace
          </button>

          <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Product Image Section */}
              <div className="lg:w-1/2 p-6 lg:p-10 bg-zinc-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white relative cursor-zoom-in"
                  onMouseMove={handleImageMouseMove}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                >
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover transition-transform duration-200 ease-out"
                    referrerPolicy="no-referrer"
                    style={{
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                    }}
                  />
                  {!isZoomed && (
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 pointer-events-none">
                      <Search size={12} /> Hover to zoom
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Product Info Section */}
              <div className="lg:w-1/2 p-6 lg:p-10 flex flex-col">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-orange-100 text-[#FF6600] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.isFeatured && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-black text-zinc-900 leading-tight mb-4">
                    {selectedProduct.name}
                  </h1>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-black text-[#FF6600]">${selectedProduct.price.toFixed(2)}</span>
                    <span className="text-zinc-400 font-medium">/ piece</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Minimum Order</p>
                    <div className="flex items-center gap-2 text-zinc-800 font-bold">
                      <Box size={18} className="text-[#FF6600]" />
                      {selectedProduct.moq}
                    </div>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Shipping From</p>
                    <div className="flex items-center gap-2 text-zinc-800 font-bold">
                      <MapPin size={18} className="text-[#FF6600]" />
                      {selectedProduct.location}
                    </div>
                  </div>
                </div>

                <div className="mb-8 flex-1">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Product Description</h3>
                  <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 bg-zinc-100 rounded-full flex items-center justify-center text-[#FF6600] font-black text-xl">
                        {selectedProduct.shopName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-bold uppercase">Supplier</p>
                        <p className="font-bold text-zinc-900">{selectedProduct.shopName}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-[#FF6600] text-xs font-bold">
                        <ShieldCheck size={14} /> Verified
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => addToCart(selectedProduct)}
                        className="flex-1 flex items-center justify-center gap-3 bg-zinc-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg text-lg"
                      >
                        <ShoppingCart size={20} />
                        Add to Cart
                      </button>
                      <div className="flex-[1.5] flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (buyerInfo.name) {
                                handleContactSupplierWhatsApp(selectedProduct);
                              } else {
                                setPendingAction({ type: 'contact-whatsapp', product: selectedProduct });
                                setShowBuyerForm(true);
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-green-100 text-sm"
                          >
                            <Send size={16} fill="currentColor" />
                            WhatsApp
                          </button>
                          <button
                            onClick={() => {
                              if (buyerInfo.name) {
                                handleContactSupplierTelegram(selectedProduct);
                              } else {
                                setPendingAction({ type: 'contact-telegram', product: selectedProduct });
                                setShowBuyerForm(true);
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-100 text-sm"
                          >
                            <Send size={16} fill="currentColor" />
                            Telegram
                          </button>
                        </div>
                        <a
                          href={`tel:${SUPPORT_PHONE}`}
                          className="flex items-center justify-center gap-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-3 rounded-2xl font-bold transition-all active:scale-95 text-sm"
                        >
                          <Phone size={16} />
                          Call Alternative: {SUPPORT_PHONE}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-zinc-100">
              <div className="px-8 py-5 border-b border-zinc-100">
                <h3 className="font-bold text-sm uppercase tracking-widest text-[#FF6600]">Reviews</h3>
              </div>
              <div className="p-6 lg:p-10">
                <div className="space-y-8">
                  {(selectedProduct.reviews || [
                    { user: "Abebe K.", rating: 5, comment: "Excellent quality and fast delivery. Highly recommended!", date: "2 days ago" },
                    { user: "Sara M.", rating: 4, comment: "Good product, exactly as described. The packaging was very secure.", date: "1 week ago" },
                    { user: "Dawit L.", rating: 5, comment: "The supplier was very responsive on WhatsApp. Great experience.", date: "2 weeks ago" }
                  ]).map((review, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="h-10 w-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 font-bold shrink-0">
                        {review.user.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-zinc-900">{review.user}</h4>
                          <span className="text-xs text-zinc-400">{review.date}</span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < review.rating ? "text-orange-400 fill-orange-400" : "text-zinc-200"} />
                          ))}
                        </div>
                        <p className="text-zinc-600 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : !isAdminAuthenticated ? (
        <main className="mx-auto max-w-lg px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-8 shadow-xl border border-zinc-200"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="h-16 w-16 bg-[#FFF0E6] rounded-2xl flex items-center justify-center mb-4">
                <Settings size={32} className="text-[#FF6600]" />
              </div>
              <h2 className="text-2xl font-bold">Supplier Login</h2>
              <p className="text-zinc-500 text-sm mt-1">Access your supplier dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <input
                  autoFocus
                  type="password"
                  placeholder="Enter admin password"
                  className={`w-full bg-zinc-50 border ${passwordError ? 'border-red-500' : 'border-zinc-200'} rounded-2xl px-5 py-4 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all`}
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                />
                {passwordError && (
                  <p className="text-red-500 text-xs ml-1">Incorrect password. Please try again.</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-[#FF6600] text-white py-4 rounded-2xl font-bold transition-transform active:scale-95 shadow-lg shadow-orange-200"
              >
                Login
              </button>
            </form>
          </motion.div>
        </main>
      ) : (
        <main className="mx-auto max-w-4xl px-4 py-6 space-y-8 pb-20">
          {/* Admin Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl text-blue-500"><Box size={24} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-bold uppercase">Products</p>
                <p className="text-2xl font-black">{adminStats.total}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-4">
              <div className="bg-orange-50 p-3 rounded-xl text-orange-500"><ShoppingCart size={24} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-bold uppercase">Total Orders</p>
                <p className="text-2xl font-black">{backendStats?.totalOrders || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-xl text-green-500"><TrendingUp size={24} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-bold uppercase">Avg Order</p>
                <p className="text-2xl font-black">${(backendStats?.avgOrderValue || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-xl text-purple-500"><BarChart3 size={24} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-bold uppercase">Revenue</p>
                <p className="text-2xl font-black">${(backendStats?.totalRevenue || 0).toFixed(2)}</p>
              </div>
            </div>
          </section>

          {/* Top Categories & Detailed Stats */}
          {backendStats && backendStats.topCategories.length > 0 && (
            <section className="bg-white rounded-[2rem] p-8 shadow-md border border-zinc-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Star className="text-orange-400" /> Top Selling Categories
              </h3>
              <div className="space-y-4">
                {backendStats.topCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-bold text-zinc-600 truncate">{cat.category}</div>
                    <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.total_sold / backendStats.topCategories[0].total_sold) * 100}%` }}
                        className="h-full bg-[#FF6600]"
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-black text-zinc-900">{cat.total_sold}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Add New Product Form */}
          <section className="bg-white rounded-[2rem] p-8 shadow-md border border-zinc-100">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Plus className="text-[#FF6600]" /> Add New Product to Marketplace
            </h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Product Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., High Quality Cotton T-Shirts"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Price ($ per unit)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Enter unit price"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                  value={newProduct.price || ''}
                  onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Category</label>
                <select
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                >
                  {CATEGORIES.filter(c => c !== "All Categories").map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Shop Name</label>
                <input
                  required
                  type="text"
                  placeholder="Your business name"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                  value={newProduct.shopName}
                  onChange={e => setNewProduct({...newProduct, shopName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Minimum Order (MOQ)</label>
                <input
                  type="text"
                  placeholder="e.g., 10 pieces, 1 container"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                  value={newProduct.moq}
                  onChange={e => setNewProduct({...newProduct, moq: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Sodo Market, Ethiopia"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                  value={newProduct.location}
                  onChange={e => setNewProduct({...newProduct, location: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  className="w-5 h-5 accent-[#FF6600]"
                  checked={newProduct.isFeatured}
                  onChange={e => setNewProduct({...newProduct, isFeatured: e.target.checked})}
                />
                <label htmlFor="isFeatured" className="text-sm font-bold text-zinc-700 cursor-pointer">Mark as Featured Product</label>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed product specifications..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all resize-none"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Image URL</label>
                  {newProduct.image && (
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Preview Active</span>
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    required
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                    value={newProduct.image}
                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                  />
                  {newProduct.image && (
                    <div className="w-full md:w-24 h-24 rounded-xl overflow-hidden border border-zinc-200 shrink-0">
                      <SmartImage src={newProduct.image} alt="Preview" size="100/100" lowData={lowDataMode} />
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-[#FF6600] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-100"
                >
                  <Plus size={20} />
                  Publish Product
                </button>
              </div>
            </form>
          </section>

          {/* Existing Products List */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold ml-2">Your Active Listings ({products.length})</h2>
            <div className="grid grid-cols-1 gap-3">
              {products.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-zinc-100 shadow-sm">
                  <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-zinc-100">
                    <SmartImage src={product.image} alt={product.name} size="100/100" lowData={lowDataMode} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate text-sm">{product.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded font-bold text-zinc-500">{product.category}</span>
                      <span className="text-[10px] bg-orange-50 px-2 py-0.5 rounded font-bold text-[#FF6600]">MOQ: {product.moq}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleFeatured(product.id, !!product.isFeatured)}
                      className={`p-2 rounded-xl transition-all ${product.isFeatured ? 'text-orange-500 bg-orange-50' : 'text-zinc-300 hover:text-zinc-400'}`}
                      title={product.isFeatured ? "Unfeature" : "Feature this product"}
                    >
                      <Star size={20} fill={product.isFeatured ? "currentColor" : "none"} />
                    </button>
                    <div className="text-right min-w-[70px]">
                      <p className="text-[#333] font-black">${product.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setEditProduct({ ...product })}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Edit product"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-[#FF6600]" />
                  <h2 className="text-xl font-black text-zinc-900">Your Cart</h2>
                  <span className="bg-zinc-100 text-zinc-500 text-xs font-bold px-2 py-1 rounded-full">
                    {cartTotalItems} items
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <CloseIcon size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="bg-zinc-50 p-6 rounded-full mb-4">
                      <ShoppingCart size={48} className="text-zinc-200" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">Your cart is empty</h3>
                    <p className="text-zinc-500 max-w-[240px]">Looks like you haven't added anything to your cart yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="h-20 w-20 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-zinc-900 truncate">{item.name}</h4>
                          <p className="text-[#FF6600] font-black mb-2">${item.price.toFixed(2)}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 hover:bg-white rounded-md transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 hover:bg-white rounded-md transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-xs text-zinc-400 hover:text-red-500 font-bold uppercase tracking-wider"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-500 font-medium">Subtotal</span>
                    <span className="text-2xl font-black text-zinc-900">${cartTotalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (buyerInfo.name) {
                          handleCheckout('whatsapp');
                        } else {
                          setPendingAction({ type: 'checkout-whatsapp' });
                          setShowBuyerForm(true);
                        }
                      }}
                      className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-green-100 text-sm flex items-center justify-center gap-2"
                    >
                      <Send size={16} fill="currentColor" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => {
                        if (buyerInfo.name) {
                          handleCheckout('telegram');
                        } else {
                          setPendingAction({ type: 'checkout-telegram' });
                          setShowBuyerForm(true);
                        }
                      }}
                      className="flex-1 bg-[#0088cc] hover:bg-[#0077b5] text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-100 text-sm flex items-center justify-center gap-2"
                    >
                      <Send size={16} fill="currentColor" />
                      Telegram
                    </button>
                  </div>
                  <a
                    href={`tel:${SUPPORT_PHONE}`}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-zinc-200 hover:border-[#FF6600] text-zinc-600 hover:text-[#FF6600] py-3 rounded-2xl font-bold transition-all active:scale-95 text-sm"
                  >
                    <Phone size={16} />
                    Call for Alternative Support
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Buyer Information Modal */}
      <AnimatePresence>
        {showBuyerForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {setShowBuyerForm(false); setPendingAction(null);}}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-zinc-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-zinc-900">Your Information</h3>
                  <p className="text-zinc-500 text-sm">Please provide your details for the seller</p>
                </div>
                <button 
                  onClick={() => {setShowBuyerForm(false); setPendingAction(null);}}
                  className="h-10 w-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <form onSubmit={handleBuyerFormSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Enter your full name"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                    value={buyerInfo.name}
                    onChange={e => setBuyerInfo({...buyerInfo, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="e.g., 0911223344"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                    value={buyerInfo.phone}
                    onChange={e => setBuyerInfo({...buyerInfo, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Delivery Location</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g., Sodo, Near Main Square"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-zinc-800 focus:outline-none focus:border-[#FF6600] transition-all"
                    value={buyerInfo.location}
                    onChange={e => setBuyerInfo({...buyerInfo, location: e.target.value})}
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-[#FF6600] text-white py-5 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-orange-100 text-lg flex items-center justify-center gap-3"
                >
                  Continue to {pendingAction?.type?.includes('whatsapp') ? 'WhatsApp' : 'Telegram'}
                  <Send size={20} fill="currentColor" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setProductToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-100"
            >
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-center mb-2">Delete Product?</h3>
              <p className="text-zinc-500 text-center mb-8">This action cannot be undone. The product will be removed from the marketplace and all carts.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-100"
                >
                  Yes, Delete Product
                </button>
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 py-4 rounded-2xl font-bold transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Product Modal */}
      <AnimatePresence>
        {editProduct !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditProduct(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-zinc-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black">Edit Product</h3>
                <button 
                  onClick={() => setEditProduct(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <CloseIcon size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Product Name</label>
                  <input 
                    required type="text" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF6600]"
                    value={editProduct.name || ''}
                    onChange={e => setEditProduct({...editProduct, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Price ($)</label>
                  <input 
                    required type="number" step="0.01"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF6600]"
                    value={editProduct.price || ''}
                    onChange={e => setEditProduct({...editProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Category</label>
                  <select 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF6600]"
                    value={editProduct.category || ''}
                    onChange={e => setEditProduct({...editProduct, category: e.target.value})}
                  >
                    {CATEGORIES.filter(c => c !== "All Categories").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Shop Name</label>
                  <input 
                    required type="text" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF6600]"
                    value={editProduct.shopName || ''}
                    onChange={e => setEditProduct({...editProduct, shopName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">MOQ</label>
                  <input 
                    type="text" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF6600]"
                    value={editProduct.moq || ''}
                    onChange={e => setEditProduct({...editProduct, moq: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Location</label>
                  <input 
                    type="text" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF6600]"
                    value={editProduct.location || ''}
                    onChange={e => setEditProduct({...editProduct, location: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Description</label>
                  <textarea 
                    required rows={3}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF6600] resize-none"
                    value={editProduct.description || ''}
                    onChange={e => setEditProduct({...editProduct, description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase ml-1">Image URL</label>
                  <input 
                    required type="url" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF6600]"
                    value={editProduct.image || ''}
                    onChange={e => setEditProduct({...editProduct, image: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-[#FF6600] text-white py-3 rounded-xl font-bold transition-all active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

