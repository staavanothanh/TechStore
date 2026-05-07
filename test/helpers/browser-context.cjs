const fs = require('fs');
const path = require('path');
const vm = require('vm');

class FakeClassList {
  constructor() {
    this._set = new Set();
  }

  add(...names) {
    names.forEach(name => this._set.add(name));
  }

  remove(...names) {
    names.forEach(name => this._set.delete(name));
  }

  contains(name) {
    return this._set.has(name);
  }

  toggle(name, force) {
    if (force === true) {
      this._set.add(name);
      return true;
    }
    if (force === false) {
      this._set.delete(name);
      return false;
    }
    if (this._set.has(name)) {
      this._set.delete(name);
      return false;
    }
    this._set.add(name);
    return true;
  }
}

class FakeElement {
  constructor(id, doc) {
    this.id = id || '';
    this._doc = doc;
    this._innerHTML = '';
    this._textContent = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.dataset = {};
    this.tagName = 'DIV';
    this.style = {
      display: '',
      boxShadow: '',
      setProperty(name, value) {
        this[name] = value;
      }
    };
    this.classList = new FakeClassList();
    this._listeners = {};
    this._popupChildren = {};
  }

  set textContent(value) {
    this._textContent = String(value);
  }

  get textContent() {
    return this._textContent;
  }

  addEventListener(type, fn) {
    (this._listeners[type] ||= []).push(fn);
  }

  removeEventListener(type, fn) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter(listener => listener !== fn);
  }

  dispatchEvent(event) {
    const e = event || {};
    e.type ||= 'click';
    e.target ||= this;
    e.currentTarget = this;
    e.stopPropagation ||= function () {
      this._stopped = true;
    };
    e.preventDefault ||= function () {
      this.defaultPrevented = true;
    };
    for (const fn of [...(this._listeners[e.type] || [])]) {
      fn.call(this, e);
    }
    return !e.defaultPrevented;
  }

  click() {
    this.dispatchEvent({ type: 'click' });
  }

  closest(selector) {
    const parts = String(selector).split(',').map(s => s.trim());
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('.') && this.classList.contains(part.slice(1))) return this;
      if (part.startsWith('#') && this.id === part.slice(1)) return this;
      if (part === 'button' && this.tagName === 'BUTTON') return this;
      if (part === 'button, .qty-btn, .btn-add-cart') {
        if (this.tagName === 'BUTTON' || this.classList.contains('qty-btn') || this.classList.contains('btn-add-cart')) {
          return this;
        }
      }
    }
    return null;
  }

  querySelector(selector) {
    if (this.id !== 'product-popup') return null;
    if (!this._popupChildren[selector]) {
      const child = new FakeElement('', this._doc);
      if (selector === '.qty-value') {
        child.dataset.qty = '1';
        child.textContent = '1';
      }
      if (selector === '.qty-minus' || selector === '.qty-plus' || selector === '.detail-add-cart' || selector === '.modal-close-btn') {
        child.tagName = 'BUTTON';
      }
      this._popupChildren[selector] = child;
    }
    return this._popupChildren[selector];
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 200, height: 120 };
  }

  set innerHTML(html) {
    this._innerHTML = String(html);
    if (this.id === 'user-area') {
      this._doc.clearDynamic();
      if (this._innerHTML.includes('logout-btn')) {
        this._doc.registerDynamicButton('logout-btn');
      }
      if (this._innerHTML.includes('login-nav-btn')) {
        this._doc.registerDynamicButton('login-nav-btn');
      }
    }
    if (this.id === 'product-popup') {
      this._popupChildren = {};
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

function createStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? String(map.get(key)) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    }
  };
}

function createDocument() {
  const elements = new Map();
  const dynamic = new Map();

  const doc = {
    _listeners: {},
    addEventListener(type, fn) {
      (this._listeners[type] ||= []).push(fn);
    },
    dispatchEvent(event) {
      const e = event || {};
      e.type ||= 'click';
      e.target ||= null;
      e.currentTarget = this;
      for (const fn of [...(this._listeners[e.type] || [])]) {
        fn.call(this, e);
      }
    },
    createElement(tag) {
      const el = new FakeElement('', doc);
      el.tagName = String(tag).toUpperCase();
      return el;
    },
    getElementById(id) {
      return elements.get(id) || dynamic.get(id) || null;
    },
    querySelectorAll(selector) {
      if (selector === '.sidebar-item[data-page]') return doc._navItems || [];
      if (selector === '.filter-item[data-category]') return doc._filterItems || [];
      if (selector === '.product-card') return [];
      if (selector === '.page-btn') return [];
      if (selector === '.cart-qty-minus') return [];
      if (selector === '.cart-qty-plus') return [];
      if (selector === '.cart-item-remove') return [];
      return [];
    },
    register(id) {
      const el = new FakeElement(id, doc);
      elements.set(id, el);
      return el;
    },
    registerDynamicButton(id) {
      const el = new FakeElement(id, doc);
      el.tagName = 'BUTTON';
      dynamic.set(id, el);
      return el;
    },
    clearDynamic() {
      dynamic.clear();
    }
  };

  [
    'sidebar',
    'cart-sidebar-trigger',
    'sidebar-cart-badge',
    'user-area',
    'cart-sidebar',
    'close-cart',
    'cart-items',
    'cart-total-amount',
    'checkout-btn',
    'detail-overlay',
    'product-popup',
    'product-grid',
    'loading-indicator',
    'pagination',
    'search-input',
    'search-btn',
    'sort-select',
    'success-modal',
    'checkout-modal',
    'checkout-confirm-btn',
    'checkout-cancel-btn',
    'cart-overlay',
    'login-form',
    'username',
    'password',
    'remember-me',
    'login-error'
  ].forEach(id => doc.register(id));

  doc._navItems = ['home', 'cart'].map((page, index) => {
    const el = doc.register(`nav-${index}`);
    el.classList.add('sidebar-item');
    el.dataset.page = page;
    return el;
  });

  doc._filterItems = ['all', 'smartphone', 'laptop', 'desktop', 'accessory'].map((category, index) => {
    const el = doc.register(`filter-${index}`);
    el.classList.add('filter-item');
    el.dataset.category = category;
    return el;
  });

  return { doc, elements, dynamic };
}

function makeFetch(rootDir) {
  return async function fetch(url) {
    const clean = String(url).replace(/^\.\//, '');
    const file = path.join(rootDir, clean);
    return {
      ok: true,
      async json() {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    };
  };
}

function createBrowserContext(rootDir) {
  const { doc } = createDocument();
  const sessionStorage = createStorage();
  const localStorage = createStorage();

  const context = {
    console,
    Date,
    Math,
    JSON,
    Promise,
    setTimeout,
    clearTimeout,
    parseInt,
    parseFloat,
    isNaN,
    requestAnimationFrame: fn => {
      fn();
      return 1;
    },
    cancelAnimationFrame: () => {},
    alert: msg => {
      context.__alerts.push(msg);
    },
    fetch: makeFetch(rootDir),
    IntersectionObserver: class {
      constructor(cb) {
        this.cb = cb;
      }
      observe() {}
      unobserve() {}
    },
    document: doc,
    window: null,
    self: null,
    globalThis: null,
    location: { href: 'http://localhost/index.html' },
    sessionStorage,
    localStorage,
    __alerts: []
  };

  context.window = context;
  context.self = context;
  context.globalThis = context;

  vm.createContext(context);

  [
    'sidebar',
    'sidebarCartTrigger',
    'sidebarCartBadge',
    'userArea',
    'cartSidebar',
    'closeCartBtn',
    'cartItemsContainer',
    'cartTotalAmount',
    'checkoutBtn',
    'detailOverlay',
    'productPopup',
    'productGrid',
    'loadingEl',
    'paginationEl',
    'searchInput',
    'searchBtn',
    'sortSelect',
    'successModal',
    'checkoutModal'
  ].forEach(name => {
    const idMap = {
      sidebar: 'sidebar',
      sidebarCartTrigger: 'cart-sidebar-trigger',
      sidebarCartBadge: 'sidebar-cart-badge',
      userArea: 'user-area',
      cartSidebar: 'cart-sidebar',
      closeCartBtn: 'close-cart',
      cartItemsContainer: 'cart-items',
      cartTotalAmount: 'cart-total-amount',
      checkoutBtn: 'checkout-btn',
      detailOverlay: 'detail-overlay',
      productPopup: 'product-popup',
      productGrid: 'product-grid',
      loadingEl: 'loading-indicator',
      paginationEl: 'pagination',
      searchInput: 'search-input',
      searchBtn: 'search-btn',
      sortSelect: 'sort-select',
      successModal: 'success-modal',
      checkoutModal: 'checkout-modal'
    };
    context[name] = doc.getElementById(idMap[name]);
  });

  context.navItems = doc._navItems;
  context.filterItems = doc._filterItems;
  context.allProducts = [];
  context.shuffledProducts = [];
  context.currentPage = 1;
  context.selectedCategories = [];
  context.searchQuery = '';
  context.sortBy = null;
  context.cart = [];

  return context;
}

function loadScripts(context, files) {
  for (const file of files) {
    const code = fs.readFileSync(path.join(context.__rootDir, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  }
}

module.exports = {
  createBrowserContext,
  loadScripts
};
