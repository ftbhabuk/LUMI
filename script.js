var LUMI = (function () {

  /* ---------- Auth ---------- */

  function getUser() {
    var raw = localStorage.getItem('lumiUser');
    return raw ? JSON.parse(raw) : null;
  }

  function isLoggedIn() {
    return localStorage.getItem('lumiLoggedIn') === 'true';
  }

  function logout() {
    localStorage.removeItem('lumiLoggedIn');
    localStorage.removeItem('lumiUser');
    window.location.href = 'index.html';
  }

  function currentPageName() {
    var path = window.location.pathname.split('/').pop();
    return path || 'index.html';
  }

  function goToLogin() {
    window.location.href = 'loggine.html?redirect=' + encodeURIComponent(currentPageName());
  }

  /* ---------- Cart (with quantity support) ---------- */

  function getCart() {
    var raw = localStorage.getItem('lumiCart');
    return raw ? JSON.parse(raw) : [];
  }

  function saveCart(cart) {
    localStorage.setItem('lumiCart', JSON.stringify(cart));
    renderCartCount();
    renderCartPage && renderCartPage();
  }

  function getCartCount() {
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].qty || 1;
    }
    return count;
  }

  function getCartTotal() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += cart[i].price * (cart[i].qty || 1);
    }
    return total;
  }

  function quickAdd(name, price) {
    if (!isLoggedIn()) {
      showToast('Please log in to add items to your cart');
      setTimeout(goToLogin, 700);
      return;
    }
    var cart = getCart();
    var found = false;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].name === name) {
        cart[i].qty = (cart[i].qty || 1) + 1;
        found = true;
        break;
      }
    }
    if (!found) {
      cart.push({ name: name, price: price, qty: 1 });
    }
    saveCart(cart);
    showToast(name + ' added to cart');
  }

  function removeFromCart(index) {
    var cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartPage && renderCartPage();
  }

  function updateCartQuantity(index, qty) {
    var cart = getCart();
    if (qty < 1) {
      cart.splice(index, 1);
    } else {
      cart[index].qty = qty;
    }
    saveCart(cart);
    renderCartPage && renderCartPage();
  }

  /* ---------- Wishlist ---------- */

  function getWishlist() {
    var raw = localStorage.getItem('lumiWishlist');
    return raw ? JSON.parse(raw) : [];
  }

  function saveWishlist(list) {
    localStorage.setItem('lumiWishlist', JSON.stringify(list));
  }

  function toggleWishlist(name) {
    var list = getWishlist();
    var idx = list.indexOf(name);
    if (idx === -1) {
      list.push(name);
    } else {
      list.splice(idx, 1);
    }
    saveWishlist(list);
    renderWishlistButtons();
    return idx === -1;
  }

  function isWishlisted(name) {
    return getWishlist().indexOf(name) !== -1;
  }

  function renderWishlistButtons() {
    var selectors = document.querySelectorAll('.bookmark-btn');
    for (var i = 0; i < selectors.length; i++) {
      var el = selectors[i];
      var name = el.getAttribute('data-product');
      if (name && isWishlisted(name)) {
        el.classList.add('active');
      } else if (name) {
        el.classList.remove('active');
      }
    }
  }

  /* ---------- Search overlay ---------- */

  var searchData = [];

  function openSearchOverlay() {
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    if (!overlay) return;
    overlay.classList.add('search-visible');
    document.body.classList.add('no-scroll');
    if (input) { input.value = ''; input.focus(); }
    if (results) results.innerHTML = '';
  }

  function initSearch(products) {
    searchData = products || [];
    var openBtn = document.getElementById('search-open');
    var closeBtn = document.getElementById('search-close');
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var navSearch = document.getElementById('nav-search-input');
    var mobileSearch = document.getElementById('mobile-search-input');
    if (!overlay) return;

    if (openBtn) {
      openBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openSearchOverlay();
      });
    }
    if (navSearch) {
      var searchWrap = navSearch.closest('.nav-search');
      var dropdown = document.createElement('div');
      dropdown.className = 'search-dropdown';
      searchWrap.appendChild(dropdown);
      navSearch.addEventListener('input', function () {
        var q = navSearch.value.toLowerCase().trim();
        if (!q) { dropdown.innerHTML = ''; dropdown.classList.remove('active'); return; }
        var matches = [];
        for (var i = 0; i < searchData.length; i++) {
          if (searchData[i].name.toLowerCase().indexOf(q) !== -1) {
            matches.push(searchData[i]);
          }
        }
        if (matches.length === 0) {
          dropdown.innerHTML = '<div class="search-dropdown-empty">No products found</div>';
        } else {
          var html = '';
          for (var j = 0; j < matches.length; j++) {
            html += '<a href="Go_to_shopping.html" class="search-dropdown-item">' +
              '<span class="search-dropdown-name">' + matches[j].name + '</span>' +
              '<span class="search-dropdown-price">$' + matches[j].price + '</span>' +
              '</a>';
          }
          dropdown.innerHTML = html;
        }
        dropdown.classList.add('active');
      });
      navSearch.addEventListener('blur', function () {
        setTimeout(function () { dropdown.classList.remove('active'); }, 200);
      });
      navSearch.addEventListener('focus', function () {
        if (navSearch.value.trim()) { dropdown.classList.add('active'); }
      });
    }
    if (mobileSearch) {
      var mobileWrap = mobileSearch.closest('.mobile-search-wrap');
      var mobileDropdown = document.createElement('div');
      mobileDropdown.className = 'search-dropdown';
      mobileWrap.appendChild(mobileDropdown);
      mobileSearch.addEventListener('input', function () {
        var q = mobileSearch.value.toLowerCase().trim();
        if (!q) { mobileDropdown.innerHTML = ''; mobileDropdown.classList.remove('active'); return; }
        var matches = [];
        for (var i = 0; i < searchData.length; i++) {
          if (searchData[i].name.toLowerCase().indexOf(q) !== -1) {
            matches.push(searchData[i]);
          }
        }
        if (matches.length === 0) {
          mobileDropdown.innerHTML = '<div class="search-dropdown-empty">No products found</div>';
        } else {
          var html = '';
          for (var j = 0; j < matches.length; j++) {
            html += '<a href="Go_to_shopping.html" class="search-dropdown-item">' +
              '<span class="search-dropdown-name">' + matches[j].name + '</span>' +
              '<span class="search-dropdown-price">$' + matches[j].price + '</span>' +
              '</a>';
          }
          mobileDropdown.innerHTML = html;
        }
        mobileDropdown.classList.add('active');
      });
      mobileSearch.addEventListener('blur', function () {
        setTimeout(function () { mobileDropdown.classList.remove('active'); }, 200);
      });
      mobileSearch.addEventListener('focus', function () {
        if (mobileSearch.value.trim()) { mobileDropdown.classList.add('active'); }
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        overlay.classList.remove('search-visible');
        document.body.classList.remove('no-scroll');
      });
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.classList.remove('search-visible');
        document.body.classList.remove('no-scroll');
      }
    });
    if (input) {
      input.addEventListener('input', function () {
        var q = input.value.toLowerCase().trim();
        if (!q || !results) { results.innerHTML = ''; return; }
        var matches = [];
        for (var i = 0; i < searchData.length; i++) {
          if (searchData[i].name.toLowerCase().indexOf(q) !== -1) {
            matches.push(searchData[i]);
          }
        }
        if (matches.length === 0) {
          results.innerHTML = '<div class="search-empty">No products found</div>';
        } else {
          var html = '';
          for (var j = 0; j < matches.length; j++) {
            html += '<a href="Go_to_shopping.html" class="search-result-item">' +
              '<span class="search-result-name">' + matches[j].name + '</span>' +
              '<span class="search-result-price">$' + matches[j].price + '</span>' +
              '</a>';
          }
          results.innerHTML = html;
        }
      });
    }
  }

  /* ---------- Product filtering (shop page) ---------- */

  function initFilters() {
    var filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;
    var cards = document.querySelectorAll('.catalog-grid .product-card');

    function applyFilter(cat) {
      for (var j = 0; j < filterBtns.length; j++) {
        filterBtns[j].classList.remove('filter-active');
        if (filterBtns[j].getAttribute('data-filter') === cat) {
          filterBtns[j].classList.add('filter-active');
        }
      }
      for (var k = 0; k < cards.length; k++) {
        if (cat === 'all' || cards[k].getAttribute('data-category') === cat) {
          cards[k].style.display = '';
        } else {
          cards[k].style.display = 'none';
        }
      }
    }

    var params = new URLSearchParams(window.location.search);
    var urlFilter = params.get('filter');
    if (urlFilter) {
      applyFilter(urlFilter);
    }

    for (var i = 0; i < filterBtns.length; i++) {
      filterBtns[i].addEventListener('click', function () {
        var cat = this.getAttribute('data-filter');
        applyFilter(cat);
      });
    }
  }

  /* ---------- Newsletter ---------- */

  function initNewsletter() {
    var forms = document.querySelectorAll('.newsletter-form');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function (e) {
        e.preventDefault();
        var input = this.querySelector('input');
        if (input && input.value.trim()) {
          showToast('Thanks for subscribing!');
          input.value = '';
        }
      });
    }
  }

  /* ---------- UI helpers ---------- */

  function renderCartCount() {
    var count = getCartCount();
    var els = document.querySelectorAll('#cart-count');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = count;
    }
  }

  function renderAccountState() {
    var el = document.getElementById('account-link');
    if (!el) return;
    var user = getUser();
    if (isLoggedIn() && user) {
      var firstName = (user.name || '').split(' ')[0] || 'Account';
      el.innerHTML = '\u25cf <span class="account-name">Hi, ' + firstName + '</span>';
      el.href = '#';
      el.onclick = function (e) {
        e.preventDefault();
        if (confirm('Log out of LUMI?')) logout();
      };
    } else {
      el.innerHTML = '\u25cf <span class="account-name">Login</span>';
      el.href = 'login.html?redirect=' + encodeURIComponent(currentPageName());
      el.onclick = null;
    }
  }

  var renderCartPage = null;

  function registerCartRenderer(fn) {
    renderCartPage = fn;
  }

  function showToast(message) {
    var toast = document.getElementById('lumi-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lumi-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'show';
    clearTimeout(window._lumiToastTimer);
    window._lumiToastTimer = setTimeout(function () {
      toast.className = '';
    }, 2400);
  }

  /* ---------- Init ---------- */

  function attachWishlistHandlers() {
    var btns = document.querySelectorAll('.bookmark-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function (e) {
        e.preventDefault();
        var name = this.getAttribute('data-product');
        if (name) {
          var added = toggleWishlist(name);
          showToast(added ? name + ' saved' : name + ' removed');
        }
      });
    }
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('visible');
            obs.unobserve(entries[i].target);
          }
        }
      }, { threshold: 0.15 });
      for (var j = 0; j < els.length; j++) {
        obs.observe(els[j]);
      }
    } else {
      for (var k = 0; k < els.length; k++) {
        els[k].classList.add('visible');
      }
    }
  }

  function initTabs() {
    var tabBtns = document.querySelectorAll('.tab-btn');
    var allCards = document.querySelectorAll('.tab-grid .product-card');
    var shopLink = document.querySelector('.tab-shop-link a');
    if (!tabBtns.length) return;

    var activeTab = 'new-arrivals';

    function updateShopLink(tab) {
      if (!shopLink) return;
      var label = tab === 'new-arrivals' ? 'New Arrivals' : 'Best Sellers';
      shopLink.textContent = 'Shop ' + label + ' \u2192';
    }

    for (var i = 0; i < tabBtns.length; i++) {
      tabBtns[i].addEventListener('click', function () {
        var tab = this.getAttribute('data-tab');
        if (tab === activeTab) return;
        activeTab = tab;

        for (var j = 0; j < tabBtns.length; j++) {
          tabBtns[j].classList.remove('tab-active');
        }
        this.classList.add('tab-active');
        updateShopLink(tab);

        for (var k = 0; k < allCards.length; k++) {
          var match = allCards[k].getAttribute('data-tab-group') === tab;
          if (match) {
            allCards[k].style.display = '';
            allCards[k].style.opacity = '0';
            allCards[k].style.transform = 'translateY(8px)';
            (function (card) {
              requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                  card.style.opacity = '1';
                  card.style.transform = 'translateY(0)';
                });
              });
            })(allCards[k]);
          } else {
            allCards[k].style.display = 'none';
          }
        }
      });
    }
  }

  function initScrollArrows() {
    var leftBtn = document.getElementById('tab-scroll-left');
    var rightBtn = document.getElementById('tab-scroll-right');
    var grid = document.getElementById('tab-grid');
    if (!leftBtn || !rightBtn || !grid) return;

    leftBtn.addEventListener('click', function () {
      grid.scrollBy({ left: -300, behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', function () {
      grid.scrollBy({ left: 300, behavior: 'smooth' });
    });
  }

  function initQA() {
    var items = document.querySelectorAll('.qa-item');
    for (var i = 0; i < items.length; i++) {
      var btn = items[i].querySelector('.qa-question');
      btn.addEventListener('click', function () {
        var parent = this.parentNode;
        var isActive = parent.classList.contains('active');
        for (var j = 0; j < items.length; j++) {
          items[j].classList.remove('active');
        }
        if (!isActive) {
          parent.classList.add('active');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderCartCount();
    renderAccountState();
    renderWishlistButtons();
    attachWishlistHandlers();
    initNewsletter();
    initFilters();
    initReveal();
    initTabs();
    initScrollArrows();
    initQA();

    if (sessionStorage.getItem('lumiJustLoggedIn')) {
      sessionStorage.removeItem('lumiJustLoggedIn');
      var user = getUser();
      if (user) {
        showToast('Welcome, ' + user.name.split(' ')[0] + '!');
      }
    }
  });

  window.quickAdd = quickAdd;
  window.showToast = showToast;
  window.LUMI = LUMI;

  /* ---------- Mobile menu toggle ---------- */
  function initMobileMenu() {
    var toggle = document.getElementById('nav-toggle');
    var close = document.getElementById('mobile-close');
    var menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;
    function openMenu() { document.body.classList.add('mobile-menu-open'); }
    function closeMenu() { document.body.classList.remove('mobile-menu-open'); }
    toggle.addEventListener('click', openMenu);
    if (close) close.addEventListener('click', closeMenu);
    menu.addEventListener('click', function (e) {
      if (e.target === menu) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }
  initMobileMenu();

  return {
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    logout: logout,
    currentPageName: currentPageName,
    goToLogin: goToLogin,
    getCart: getCart,
    saveCart: saveCart,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal,
    quickAdd: quickAdd,
    removeFromCart: removeFromCart,
    updateCartQuantity: updateCartQuantity,
    getWishlist: getWishlist,
    toggleWishlist: toggleWishlist,
    isWishlisted: isWishlisted,
    renderWishlistButtons: renderWishlistButtons,
    initSearch: initSearch,
    initFilters: initFilters,
    registerCartRenderer: registerCartRenderer,
    showToast: showToast,
    renderCartCount: renderCartCount,
    renderAccountState: renderAccountState
  };

})();

/* ---------- Showcase scroll ---------- */
(function () {
    const track = document.getElementById('showcase-track');
    const btnLeft = document.getElementById('showcase-scroll-left');
    const btnRight = document.getElementById('showcase-scroll-right');
    if (!track || !btnLeft || !btnRight) return;

    const scrollAmount = () => track.clientWidth * 0.8;

    btnLeft.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });
    btnRight.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });
})();
