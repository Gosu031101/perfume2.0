// ==========================================
// QUẢN LÝ DỮ LIỆU & STATE
// ==========================================
let currentUser = null;
let cart = [];
let displayLimit = 4; // Số sản phẩm hiển thị lúc đầu
let currentLang = localStorage.getItem('siteLang') || 'vi';

// Khởi tạo Database giả lập
if (!localStorage.getItem('mockUsersDB')) {
    localStorage.setItem('mockUsersDB', JSON.stringify([]));
}
if (localStorage.getItem('perfumeCart')) {
    cart = JSON.parse(localStorage.getItem('perfumeCart'));
    // Xóa giỏ hàng cũ nếu cấu trúc giỏ hàng chưa có trường variant
    if (cart.length > 0 && !cart[0].variant) {
        cart = [];
        localStorage.setItem('perfumeCart', JSON.stringify([]));
    }
}

// Dữ liệu mock sản phẩm với 3 mức giá mới
let defaultProducts = [];

let products = JSON.parse(localStorage.getItem('perfumeProducts')) || defaultProducts;

const RANKS = [
    { name: "Đồng", min: 0, discount: 5 },
    { name: "Bạc", min: 500, discount: 8 },
    { name: "Vàng", min: 1000, discount: 10 },
    { name: "Bạch kim", min: 1500, discount: 15 }
];

const getMemberRank = (points) => {
    let current = RANKS[0];
    let next = null;
    for (let i = 0; i < RANKS.length; i++) {
        if (points >= RANKS[i].min) {
            current = RANKS[i];
            next = RANKS[i+1] ? RANKS[i+1] : null;
        }
    }
    return { current, next };
};

// =====================
// TRANSLATIONS / I18N
// =====================
const translations = {
    vi: {
        site_title: "Thành Luân",
        nav_men: "Nước hoa Nam",
        nav_women: "Nước hoa Nữ",
        nav_unisex: "Unisex",
        nav_body: "Xịt body",
        search_placeholder: "Tìm kiếm theo tên hoặc thương hiệu...",
        sample_excel: "Tải file Mẫu",
        upload_excel: "Tải lên File Excel",
        products: "sản phẩm",
        load_more: "Xem thêm sản phẩm",
        added_to_cart: "Đã thêm vào giỏ hàng!",
        download_sample_success: "Đã tải file Excel mẫu!",
        excel_update_success: "Cập nhật dữ liệu từ Excel thành công!",
        excel_file_empty: "File Excel trống!",
        excel_invalid_format: "Định dạng file không đúng!",
        cart_empty_error: "Giỏ hàng đang trống!",
        email_registered: "Email này đã được đăng ký!",
        register_success: "Đăng ký thành công!",
        wrong_credentials: "Email hoặc mật khẩu không đúng!",
        login_success: "Đăng nhập thành công!",
        logged_out: "Đã đăng xuất",
        order_success: "Đặt hàng thành công!",
        thank_you: "Cảm ơn bạn đã mua sắm tại Thành Luân.",
        processing: "Đang xử lý...",
        earned_points: "Bạn được cộng thêm {points} điểm thành viên.",
        products_none: "Không tìm thấy sản phẩm nào phù hợp.",
        cart_empty: "Giỏ hàng trống",
        login: "Đăng Nhập",
        register: "Đăng Ký"
    },
    en: {
        site_title: "Thanh Luan",
        nav_men: "Men's Fragrances",
        nav_women: "Women's Fragrances",
        nav_unisex: "Unisex",
        nav_body: "Body Spray",
        search_placeholder: "Search by name or brand...",
        sample_excel: "Download Sample File",
        upload_excel: "Upload Excel File",
        products: "products",
        load_more: "Load more products",
        added_to_cart: "Added to cart!",
        download_sample_success: "Sample Excel downloaded!",
        excel_update_success: "Products updated from Excel!",
        excel_file_empty: "Excel file is empty!",
        excel_invalid_format: "Invalid file format!",
        cart_empty_error: "Cart is empty!",
        email_registered: "This email is already registered!",
        register_success: "Registration successful!",
        wrong_credentials: "Incorrect email or password!",
        login_success: "Logged in successfully!",
        logged_out: "Logged out",
        order_success: "Order placed successfully!",
        thank_you: "Thank you for shopping at Thanh Luan.",
        processing: "Processing...",
        earned_points: "You earned {points} membership points.",
        products_none: "No matching products found.",
        cart_empty: "Cart is empty",
        login: "Login",
        register: "Register"
    }
};

const t = (key, params = {}) => {
    const dict = translations[currentLang] || translations['vi'];
    let str = dict[key] || translations['vi'][key] || key;
    Object.keys(params).forEach(k => { str = str.replace(`{${k}}`, params[k]); });
    return str;
};

const applyTranslations = () => {
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        const attr = el.getAttribute('data-i18n-attr') || 'text';
        if (attr === 'placeholder') el.placeholder = t(key);
        else if (attr === 'html') el.innerHTML = t(key);
        else el.innerText = t(key);
    });
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = t('search_placeholder');
    const titleEl = document.querySelector('h1.font-serif');
    if (titleEl) titleEl.innerText = t('site_title');
    document.title = t('site_title') + ' - Nước Hoa Cao Cấp';
    // language button styles
    const viBtn = document.getElementById('lang-vi');
    const enBtn = document.getElementById('lang-en');
    if (viBtn && enBtn) {
        viBtn.classList.toggle('font-bold', currentLang === 'vi');
        enBtn.classList.toggle('font-bold', currentLang === 'en');
    }
};

const setLang = (lang) => {
    currentLang = lang;
    localStorage.setItem('siteLang', lang);
    applyTranslations();
    renderProducts();
};

const formatPrice = (price) => {
    if (!price || price === 0) return "Liên hệ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const selectVariant = (btn, productId, variantName, price) => {
    const card = btn.closest('.group');
    
    // Bỏ active tất cả các nút
    card.querySelectorAll('.variant-btn').forEach(b => {
        b.classList.remove('bg-black', 'text-white', 'border-black');
        b.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
    });
    // Thêm active cho nút được chọn
    btn.classList.remove('bg-white', 'text-gray-500', 'border-gray-200');
    btn.classList.add('bg-black', 'text-white', 'border-black');
    
    card.querySelector('.product-price').innerText = formatPrice(price);
    
    const addBtn = card.querySelector('.add-to-cart-btn');
    addBtn.setAttribute('onclick', `addToCart('${productId}', '${variantName}')`);
    
    addBtn.disabled = (!price || price === 0);
    addBtn.innerText = (!price || price === 0) ? "Liên hệ" : "Thêm vào giỏ";
    addBtn.className = `add-to-cart-btn w-full bg-white border border-black text-black font-medium text-sm py-1.5 rounded flex items-center justify-center gap-1 hover:bg-black hover:text-white transition-colors active:scale-95 ${(!price || price === 0) ? 'opacity-50 cursor-not-allowed' : ''}`;
};

let toastTimeout;
const showToast = (message, isError = false) => {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    icon.className = isError ? "ph ph-warning-circle text-red-400 text-lg" : "ph ph-check-circle text-green-400 text-lg";
    document.getElementById('toast-message').innerText = message;
    
    clearTimeout(toastTimeout);
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
};

// ==========================================
// MENU MOBILE THÊM VÀO
// ==========================================
const toggleMobileMenu = () => {
    const drawer = document.getElementById('mobile-menu-drawer');
    const overlay = document.getElementById('mobile-menu-overlay');
    
    if (drawer.classList.contains('-translate-x-full')) {
        drawer.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        drawer.classList.add('-translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
};

// ==========================================
// TÌM KIẾM THÊM VÀO
// ==========================================
const toggleSearch = () => {
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    
    if (searchContainer.classList.contains('-translate-y-full')) {
        searchContainer.classList.remove('-translate-y-full', '-z-10');
        searchContainer.classList.add('z-20');
        setTimeout(() => searchInput.focus(), 300);
    } else {
        searchContainer.classList.add('-translate-y-full');
        setTimeout(() => searchContainer.classList.add('-z-10'), 300);
        searchContainer.classList.remove('z-20');
        
        // Xóa chữ khi đóng & reset data
        searchInput.value = "";
        displayLimit = 4;
        renderProducts(); 
    }
};

const handleSearch = () => {
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    // Lọc dữ liệu theo từ khóa
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(keyword) || 
        (p.brand && p.brand.toLowerCase().includes(keyword))
    );
    
    // Khi đang tìm kiếm, tạm thời bỏ giới hạn phân trang (hiện toàn bộ kết quả tìm được)
    renderProducts(filteredProducts, true); 
};

// ==========================================
// LỌC THEO DANH MỤC
// ==========================================
let activeCategory = '';

const filterByCategory = (category, event) => {
    if (event) event.preventDefault();
    activeCategory = category;
    displayLimit = 4; // Trở về limit mặc định khi sang danh mục khác
    
    // Đóng menu mobile nếu đang mở
    const drawer = document.getElementById('mobile-menu-drawer');
    if (drawer && !drawer.classList.contains('-translate-x-full')) {
        toggleMobileMenu();
    }
    
    renderProducts();
};

// ==========================================
// RENDER SẢN PHẨM & NÚT XEM THÊM
// ==========================================
const renderProducts = (dataToRender = null, isSearching = false) => {
    let listData = dataToRender;
    // Nếu không truyền list (không phải đang gõ Search), tự động lọc theo danh mục
    if (!listData) {
        listData = activeCategory 
            ? products.filter(p => p.sex && p.sex.toLowerCase() === activeCategory.toLowerCase()) 
            : products;
    }

    const list = document.getElementById('product-list');
    const loadMoreBtn = document.getElementById('load-more-container');
    
    // Bảo vệ tránh lỗi JS trên trang checkout
    if (!list) return;
    const countEl = document.getElementById('product-count');
    if (countEl) countEl.innerText = `${listData.length} ${t('products')}`;
    
    if (listData.length === 0) {
        list.innerHTML = `<div class="col-span-2 md:col-span-4 text-center py-10 text-gray-500">${t('products_none')}</div>`;
        loadMoreBtn.classList.add('hidden');
        return;
    }

    // Cắt data dựa theo giới hạn hiển thị (nếu không phải đang tìm kiếm)
    let itemsToShow = isSearching ? listData : listData.slice(0, displayLimit);

    list.innerHTML = itemsToShow.map(p => {
        const p1 = p.price1 || 0;
        const p2 = p.price2 || 0;
        const p3 = p.price3 || 0;
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div class="aspect-square bg-gray-100 relative overflow-hidden">
                    <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                </div>
                <div class="p-4 flex flex-col flex-1">
                    <span class="text-[10px] text-gray-400 uppercase font-bold tracking-wider">${p.brand || 'Khác'} • ${p.sex || 'Unisex'}</span>
                    <h4 class="text-sm font-semibold text-gray-800 line-clamp-2 mt-1 mb-2 flex-1">${p.name}</h4>
                    
                    <div class="flex gap-1 mb-3">
                        <button onclick="selectVariant(this, '${p.id}', '20ml', ${p1})" class="variant-btn flex-1 py-1 text-[11px] font-semibold border rounded bg-black text-white border-black">20ml</button>
                        <button onclick="selectVariant(this, '${p.id}', '30ml', ${p2})" class="variant-btn flex-1 py-1 text-[11px] font-semibold border rounded bg-white text-gray-500 border-gray-200">30ml</button>
                        <button onclick="selectVariant(this, '${p.id}', 'Full New', ${p3})" class="variant-btn flex-1 py-1 text-[11px] font-semibold border rounded bg-white text-gray-500 border-gray-200">Full New</button>
                    </div>

                    <div class="product-price text-base font-bold text-black mb-3">${formatPrice(p1)}</div>
                    
                    <button onclick="addToCart('${p.id}', '20ml')" class="add-to-cart-btn w-full bg-white border border-black text-black font-medium text-sm py-1.5 rounded flex items-center justify-center gap-1 hover:bg-black hover:text-white transition-colors active:scale-95 ${p1 === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${p1 === 0 ? 'disabled' : ''}>
                        ${p1 === 0 ? 'Liên hệ' : 'Thêm vào giỏ'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Xử lý hiện/ẩn nút "Xem thêm"
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtnEl = document.getElementById('load-more-btn');
    if (!isSearching && displayLimit < listData.length) {
        if (loadMoreBtnEl) loadMoreBtnEl.innerHTML = `${t('load_more')} <i class="ph ph-caret-down inline-block ml-1"></i>`;
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }
};

const loadMoreProducts = () => {
    displayLimit += 4; // Mỗi lần bấm thêm 4 sản phẩm
    renderProducts(); // Gọi render lại với limit mới
};

// ==========================================
// LOGIC GIỎ HÀNG & KHUYẾN MÃI
// ==========================================
const renderCart = () => {
    const cartItems = document.getElementById('cart-items');
    const badge = document.getElementById('cart-badge');
    if (!cartItems || !badge) return; // Bảo vệ khi chạy trên trang admin không có giỏ hàng
    
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    if (totalQty > 0) {
        badge.innerText = totalQty;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="text-center text-gray-400 mt-20"><i class="ph ph-shopping-cart text-6xl mb-3 opacity-50"></i><p>${t('cart_empty')}</p></div>`;
        updateCartSummary(0);
        return;
    }

    let subtotal = 0;
    cartItems.innerHTML = cart.map((item) => {
        const product = products.find(p => p.id === item.id);
        if (!product) return '';
        
        let itemPrice = 0;
        if (item.variant === '20ml') itemPrice = product.price1;
        else if (item.variant === '30ml') itemPrice = product.price2;
        else if (item.variant === 'Full New') itemPrice = product.price3;

        const lineTotal = itemPrice * item.qty;
        subtotal += lineTotal;

        return `
            <div class="flex gap-4 bg-white border border-gray-100 p-3 rounded-lg shadow-sm items-center">
                <img src="${product.image}" class="w-20 h-20 object-cover rounded-md border">
                <div class="flex-1">
                    <h5 class="text-sm font-semibold line-clamp-2 leading-tight">${product.name}</h5>
                    <div class="text-[10px] font-bold text-gray-700 mt-1 mb-1 bg-gray-100 inline-block px-1.5 py-0.5 rounded border">Loại: ${item.variant}</div>
                    <div class="text-xs text-gray-500 mb-2">${formatPrice(itemPrice)}</div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center border rounded-md overflow-hidden bg-gray-50">
                            <button onclick="updateCartQty('${item.id}', '${item.variant}', -1)" class="w-7 h-7 flex items-center justify-center hover:bg-gray-200">-</button>
                            <span class="text-sm font-medium w-6 text-center">${item.qty}</span>
                            <button onclick="updateCartQty('${item.id}', '${item.variant}', 1)" class="w-7 h-7 flex items-center justify-center hover:bg-gray-200">+</button>
                        </div>
                        <button onclick="removeCartItem('${item.id}', '${item.variant}')" class="text-xs text-red-500 hover:underline">Xóa</button>
                    </div>
                </div>
                <div class="text-sm font-bold text-right">${formatPrice(lineTotal)}</div>
            </div>
        `;
    }).join('');

    updateCartSummary(subtotal);
    localStorage.setItem('perfumeCart', JSON.stringify(cart));
};

const updateCartSummary = (subtotal) => {
    const subtotalEl = document.getElementById('cart-subtotal');
    if (!subtotalEl) return;
    
    subtotalEl.innerText = formatPrice(subtotal);
    
    let discount = 0;
    const discountBox = document.getElementById('checkout-discount-box');

    if (currentUser && subtotal > 0) {
        const rankInfo = getMemberRank(currentUser.points);
        const discountPercent = rankInfo.current.discount;
        discount = subtotal * (discountPercent / 100);
        
        document.getElementById('cart-rank-name').innerText = rankInfo.current.name;
        document.getElementById('cart-discount-amount').innerText = `-${formatPrice(discount)}`;
        discountBox.classList.remove('hidden');
    } else {
        discountBox.classList.add('hidden');
    }

    const total = subtotal - discount;
    document.getElementById('cart-total').innerText = formatPrice(total);
    document.getElementById('cart-total').dataset.rawTotal = total;
};

const addToCart = (id, variant) => {
    const existing = cart.find(item => item.id === id && item.variant === variant);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, variant, qty: 1 });
    }
    renderCart();
    showToast(t('added_to_cart'));
};

const updateCartQty = (id, variant, delta) => {
    const item = cart.find(i => i.id === id && i.variant === variant);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeCartItem(id, variant);
        else renderCart();
    }
};

const removeCartItem = (id, variant) => {
    cart = cart.filter(i => !(i.id === id && i.variant === variant));
    renderCart();
};

const toggleCart = () => {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    
    if (drawer.classList.contains('translate-x-full')) {
        drawer.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
    } else {
        drawer.classList.add('translate-x-full');
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
};

const processCheckout = () => {
    if (cart.length === 0) {
        showToast(t('cart_empty_error'), true);
        return;
    }

    const totalRaw = Number(document.getElementById('cart-total').dataset.rawTotal);
    const btn = document.querySelector('button[onclick="processCheckout()"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> ${t('processing') || 'Đang xử lý...'}`;
    btn.disabled = true;

    setTimeout(() => {
        let message = t('order_success') + "\n" + t('thank_you');
        
        if (currentUser) {
            const earnedPoints = Math.floor(totalRaw / 10000);
            currentUser.points += earnedPoints;
            
            let db = JSON.parse(localStorage.getItem('mockUsersDB'));
            const userIndex = db.findIndex(u => u.email === currentUser.email);
            if(userIndex !== -1) {
                db[userIndex].points = currentUser.points;
                localStorage.setItem('mockUsersDB', JSON.stringify(db));
            }
            localStorage.setItem('perfumeCurrentMember', JSON.stringify(currentUser));
            
            message += "\n" + t('earned_points', { points: earnedPoints });
            updateHeaderUser();
        }

        alert(message);
        cart = [];
        renderCart();
        toggleCart();
        
        btn.innerHTML = oldText;
        btn.disabled = false;
    }, 1500);
};

// ==========================================
// LOGIC TÀI KHOẢN (ĐĂNG NHẬP / ĐĂNG KÝ)
// ==========================================
let authMode = 'login'; 

const checkLoginState = () => {
    const savedUser = localStorage.getItem('perfumeCurrentMember');
    if (savedUser) currentUser = JSON.parse(savedUser);
    updateHeaderUser();
};

const updateHeaderUser = () => {
    const headerName = document.getElementById('header-user-name');
    if (headerName) {
        headerName.innerText = currentUser ? currentUser.name : t('login');
    }
    renderCart(); // Luôn render giỏ hàng ngay cả khi không có thẻ header (ở trang thanh toán)
};

const openAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    const loginView = document.getElementById('login-view');
    const profileView = document.getElementById('profile-view');

    modal.classList.remove('hidden');

    if (currentUser) {
        loginView.classList.add('hidden');
        profileView.classList.remove('hidden');
        
        document.getElementById('profile-name').innerText = currentUser.name;
        document.getElementById('profile-email').innerText = currentUser.email;
        document.getElementById('profile-points').innerText = currentUser.points;
        
        const rankInfo = getMemberRank(currentUser.points);
        document.getElementById('profile-rank-name').innerText = rankInfo.current.name;
        document.getElementById('profile-discount').innerText = `Giảm ${rankInfo.current.discount}%`;
        
        const nextRankEl = document.getElementById('profile-next-rank');
        if(rankInfo.next) {
            nextRankEl.innerText = `Cần ${rankInfo.next.min - currentUser.points} điểm nữa để lên hạng ${rankInfo.next.name}`;
        } else {
            nextRankEl.innerText = "Bạn đã đạt hạng cao nhất!";
        }
    } else {
        loginView.classList.remove('hidden');
        profileView.classList.add('hidden');
        switchAuthTab('login');
    }
};

const closeAuthModal = () => {
    document.getElementById('auth-modal').classList.add('hidden');
};

const switchAuthTab = (mode) => {
    authMode = mode;
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    const fieldName = document.getElementById('field-name');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (mode === 'login') {
        tabLogin.className = "flex-1 pb-2 font-medium text-sm border-b-2 border-black text-black";
        tabReg.className = "flex-1 pb-2 font-medium text-sm text-gray-400 border-b-2 border-transparent hover:text-gray-600";
        fieldName.classList.add('hidden');
        document.getElementById('auth-name').removeAttribute('required');
        tabLogin.innerText = t('login');
        tabReg.innerText = t('register');
        submitBtn.innerText = t('login');
    } else {
        tabReg.className = "flex-1 pb-2 font-medium text-sm border-b-2 border-black text-black";
        tabLogin.className = "flex-1 pb-2 font-medium text-sm text-gray-400 border-b-2 border-transparent hover:text-gray-600";
        fieldName.classList.remove('hidden');
        document.getElementById('auth-name').setAttribute('required', 'true');
        tabLogin.innerText = t('login');
        tabReg.innerText = t('register');
        submitBtn.innerText = t('register');
    }
};

const handleAuthSubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const password = document.getElementById('auth-password').value;
    let db = JSON.parse(localStorage.getItem('mockUsersDB'));

    if (authMode === 'register') {
        const name = document.getElementById('auth-name').value.trim();
        if(db.find(u => u.email === email)) {
            showToast(t('email_registered'), true);
            return;
        }
        const newUser = { email, password, name, points: 0 };
        db.push(newUser);
        localStorage.setItem('mockUsersDB', JSON.stringify(db));
        
        currentUser = newUser;
        showToast(t('register_success'));
        
    } else {
        // Kiểm tra tài khoản Admin chuyên biệt
        if (email === 'admin@thanhluan.com' && password === 'admin123') {
            window.location.href = 'admin.html';
            return;
        }

        const user = db.find(u => u.email === email && u.password === password);
        if (!user) {
            showToast(t('wrong_credentials'), true);
            return;
        }
        currentUser = user;
        showToast(t('login_success'));
    }

    localStorage.setItem('perfumeCurrentMember', JSON.stringify(currentUser));
    updateHeaderUser();
    document.getElementById('auth-form').reset();
    closeAuthModal();
};

const logout = () => {
    currentUser = null;
    localStorage.removeItem('perfumeCurrentMember');
    updateHeaderUser();
    closeAuthModal();
    showToast(t('logged_out'));
};

// ==========================================
// LOGIC EXCEL (SHEETJS)
// ==========================================
const downloadSampleExcel = () => {
    const data = [
        { id: "P01", brand: "Dior", name: "Dior Sauvage EDP", sex: "nam", "Price 1": 6500, "Price 2": 9500, "Price 3": 2850, "Price 4": 0, image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80" },
        { id: "P05", brand: "Gucci", name: "Gucci Bloom", sex: "nữ", "Price 1": 7500, "Price 2": 10500, "Price 3": 3100, "Price 4": 0, image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=400&q=80" },
        { id: "P06", brand: "Jo Malone", name: "English Pear & Freesia", sex: "unisex", "Price 1": 8500, "Price 2": 12000, "Price 3": 0, "Price 4": 0, image: "https://images.unsplash.com/photo-1595425970377-c9703c486558?auto=format&fit=crop&w=400&q=80" }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "Mau_San_Pham_Thanh_Luan.xlsx");
    showToast(t('download_sample_success'));
};

const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
//Thay đổi giá trị của ô trống hoặc không hợp lệ (false) thành 0 => "liên hệ" , và thêm '000đ' vào price 1,2 vào cuối giá trị số bình thường để phù hợp với định dạng giá của website
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet);
            
            if (json.length > 0) {
                const parsePrice = (val) => {
                    if (val === undefined || val === null || val === '') return 0; // Ô trống
                    const str = String(val).replace(/,/g, '').trim();
                    if (str === '0') return 0; // Giá trị là 0
                    return Number(str + '000'); // Các giá trị số bình thường
                };

                products = json.map(row => ({
                    id: String(row.id || row.ID || row[Object.keys(row)[0]] || `P${Math.floor(Math.random()*10000)}`),
                    brand: row.brand || 'Khác',
                    name: row.name || 'Sản phẩm không tên',
                    price1: parsePrice(row['Price 1']),
                    price2: parsePrice(row['Price 2']),
                    price3: (row['Price 3'] !== undefined && row['Price 3'] !== '') ? parsePrice(row['Price 3']) : parsePrice(row['Price 4']),
                    sex: row.sex || 'unisex',
                    image: row.image || 'https://via.placeholder.com/400?text=No+Image'
                }));
                localStorage.setItem('perfumeProducts', JSON.stringify(products)); // Lưu dữ liệu vào localStorage
                displayLimit = 4; // Reset lại limit về mặc định
                renderProducts();
                showToast(t('excel_update_success'));
            } else {
                showToast(t('excel_file_empty'), true);
            }
        } catch (error) {
            console.error("Lỗi:", error);
            showToast(t('excel_invalid_format'), true);
        }
        event.target.value = ''; // Reset input
    };
    reader.readAsArrayBuffer(file);
};

// ==========================================
// KHỞI TẠO
// ==========================================
window.onload = () => {
    checkLoginState();
    applyTranslations();
    renderProducts();
};