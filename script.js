// LUMI — shared site logic (login gate + cart), persisted via localStorage

/* ---------- Auth ---------- */

function getUser() {
    const raw = localStorage.getItem('lumiUser');
    return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
    return localStorage.getItem('lumiLoggedIn') === 'true';
}

function logout() {
    localStorage.removeItem('lumiLoggedIn');
    localStorage.removeItem('lumiUser');
    window.location.href = 'home.html';
}

function currentPageName() {
    const path = window.location.pathname.split('/').pop();
    return path || 'home.html';
}

function goToLogin() {
    window.location.href = 'loggine.html?redirect=' + encodeURIComponent(currentPageName());
}

/* ---------- Cart ---------- */

function getCart() {
    const raw = localStorage.getItem('lumiCart');
    return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
    localStorage.setItem('lumiCart', JSON.stringify(cart));
    renderCartCount();
}

// Called from "Add to Cart" / "Buy Now" buttons across the site.
// Shoppers must be logged in before anything can be added.
function quickAdd(name, price) {
    if (!isLoggedIn()) {
        showToast('Please log in to add items to your cart');
        setTimeout(goToLogin, 700);
        return;
    }
    const cart = getCart();
    cart.push({ name: name, price: price });
    saveCart(cart);
    showToast(name + ' added to cart');
}

/* ---------- UI helpers ---------- */

function renderCartCount() {
    const count = getCart().length;
    document.querySelectorAll('#cart-count, .cart-count-value').forEach(function (el) {
        el.textContent = count;
    });
}

function renderAccountState() {
    const el = document.getElementById('account-link');
    if (!el) return;
    const user = getUser();
    if (isLoggedIn() && user) {
        const firstName = (user.name || '').split(' ')[0] || 'Account';
        el.innerHTML = '👤 <span class="account-name">Hi, ' + firstName + '</span>';
        el.href = '#';
        el.onclick = function (e) {
            e.preventDefault();
            if (confirm('Log out of LUMI?')) logout();
        };
    } else {
        el.innerHTML = '👤 <span class="account-name">Login</span>';
        el.href = 'loggine.html?redirect=' + encodeURIComponent(currentPageName());
        el.onclick = null;
    }
}

function showToast(message) {
    let toast = document.getElementById('lumi-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lumi-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window._lumiToastTimer);
    window._lumiToastTimer = setTimeout(function () {
        toast.classList.remove('show');
    }, 2200);
}

document.addEventListener('DOMContentLoaded', function () {
    renderCartCount();
    renderAccountState();
});
