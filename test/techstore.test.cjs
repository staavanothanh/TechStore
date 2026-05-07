const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { createBrowserContext, loadScripts } = require('./helpers/browser-context.cjs');

const ROOT = path.resolve(__dirname, '..');

function buildAppContext() {
  const ctx = createBrowserContext(ROOT);
  ctx.__rootDir = ROOT;
  loadScripts(ctx, [
    'js/effects.js',
    'js/auth-ui.js',
    'js/products.js',
    'js/cart.js',
    'js/ui.js',
    'js/modal.js',
    'js/main.js'
  ]);
  return ctx;
}

function loadLoginContext() {
  const ctx = createBrowserContext(ROOT);
  ctx.__rootDir = ROOT;
  loadScripts(ctx, ['js/auth.js']);
  return ctx;
}

test('syntax: all js files parse', async () => {
  const files = [
    'js/auth-ui.js',
    'js/auth.js',
    'js/cart.js',
    'js/effects.js',
    'js/main.js',
    'js/modal.js',
    'js/products.js',
    'js/ui.js'
  ];
  for (const file of files) {
    new vm.Script(fs.readFileSync(path.join(ROOT, file), 'utf8'), { filename: file });
  }
});

test('products: filtering and sorting', () => {
  const ctx = buildAppContext();
  ctx.allProducts = [
    { key: 'smartphone-1', category: 'smartphone', name: 'Alpha Phone', price: '10.000 đ' },
    { key: 'laptop-2', category: 'laptop', name: 'Beta Laptop', price: '20.000 đ' },
    { key: 'desktop-3', category: 'desktop', name: 'Gamma PC', price: '15.000 đ' }
  ];
  ctx.shuffledProducts = ctx.allProducts.slice();
  ctx.selectedCategories = ['laptop', 'desktop'];
  ctx.searchQuery = 'a';
  ctx.sortBy = 'name-desc';
  assert.deepStrictEqual(Array.from(ctx.getProcessedProducts(), p => p.name), ['Gamma PC', 'Beta Laptop']);
});

test('products: shuffle cache and persistence', () => {
  const ctx = buildAppContext();
  ctx.allProducts = [
    { key: 'a', name: 'A' },
    { key: 'b', name: 'B' },
    { key: 'c', name: 'C' }
  ];
  ctx.Math.random = () => 0;
  const shuffled = ctx.getShuffledProducts(true);
  assert.equal(shuffled.length, 3);
  assert.ok(ctx.localStorage.getItem('shuffledProducts'));
  const cached = ctx.getShuffledProducts();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(cached)), JSON.parse(JSON.stringify(shuffled)));
});

test('ui: renderPage uses paging and empty-state correctly', () => {
  const ctx = buildAppContext();
  ctx.allProducts = [
    { key: 'smartphone-1', category: 'smartphone', name: 'Alpha Phone', price: '10.000 đ', image: 'a.jpg' },
    { key: 'laptop-2', category: 'laptop', name: 'Beta Laptop', price: '20.000 đ', image: 'b.jpg' },
    { key: 'desktop-3', category: 'desktop', name: 'Gamma PC', price: '15.000 đ', image: 'c.jpg' },
    { key: 'accessory-4', category: 'accessory', name: 'Delta Mouse', price: '5.000 đ', image: 'd.jpg' },
    { key: 'accessory-5', category: 'accessory', name: 'Epsilon Keycap', price: '7.000 đ', image: 'e.jpg' },
    { key: 'accessory-6', category: 'accessory', name: 'Zeta Pad', price: '8.000 đ', image: 'f.jpg' },
    { key: 'accessory-7', category: 'accessory', name: 'Eta Dock', price: '9.000 đ', image: 'g.jpg' },
    { key: 'accessory-8', category: 'accessory', name: 'Theta Hub', price: '11.000 đ', image: 'h.jpg' },
    { key: 'accessory-9', category: 'accessory', name: 'Iota Cable', price: '4.000 đ', image: 'i.jpg' },
    { key: 'accessory-10', category: 'accessory', name: 'Kappa Stand', price: '12.000 đ', image: 'j.jpg' },
    { key: 'accessory-11', category: 'accessory', name: 'Lambda Case', price: '13.000 đ', image: 'k.jpg' },
    { key: 'accessory-12', category: 'accessory', name: 'Mu Charger', price: '14.000 đ', image: 'l.jpg' },
    { key: 'accessory-13', category: 'accessory', name: 'Nu Fan', price: '6.000 đ', image: 'm.jpg' },
    { key: 'accessory-14', category: 'accessory', name: 'Xi Light', price: '3.000 đ', image: 'n.jpg' },
    { key: 'accessory-15', category: 'accessory', name: 'Omicron Cover', price: '15.000 đ', image: 'o.jpg' },
    { key: 'accessory-16', category: 'accessory', name: 'Pi Mat', price: '16.000 đ', image: 'p.jpg' },
    { key: 'accessory-17', category: 'accessory', name: 'Rho Grip', price: '17.000 đ', image: 'q.jpg' },
    { key: 'accessory-18', category: 'accessory', name: 'Sigma Clip', price: '18.000 đ', image: 'r.jpg' },
    { key: 'accessory-19', category: 'accessory', name: 'Tau Kit', price: '19.000 đ', image: 's.jpg' },
    { key: 'accessory-20', category: 'accessory', name: 'Upsilon Tool', price: '20.000 đ', image: 't.jpg' },
    { key: 'accessory-21', category: 'accessory', name: 'Phi Tray', price: '21.000 đ', image: 'u.jpg' }
  ];
  ctx.shuffledProducts = ctx.allProducts.slice();
  ctx.renderPage(2);
  assert.equal(ctx.currentPage, 2);
  assert.match(ctx.productGrid.innerHTML, /Phi Tray/);
  ctx.selectedCategories = ['tablet'];
  ctx.renderPage(1);
  assert.match(ctx.productGrid.innerHTML, /Không tìm thấy sản phẩm nào|Khong tim thay san pham nao/i);
});

test('cart: add, change and remove updates state', () => {
  const ctx = buildAppContext();
  ctx.allProducts = [
    { key: 'smartphone-1', category: 'smartphone', name: 'Alpha Phone', price: '10.000 đ', image: 'a.jpg' }
  ];
  ctx.addToCart('smartphone-1', 2);
  ctx.addToCart('smartphone-1', 1);
  assert.equal(ctx.cart[0].quantity, 3);
  assert.equal(ctx.sidebarCartBadge.textContent, '3');
  assert.equal(ctx.cartTotalAmount.textContent, '30.000 đ');
  ctx.changeCartQuantity('smartphone-1', -3);
  assert.equal(ctx.cart.length, 0);
  assert.equal(ctx.sidebarCartBadge.style.display, 'none');
});

test('auth ui: login button, logout and auth guard', () => {
  const ctx = buildAppContext();
  ctx.sessionStorage.clear();
  ctx.location.href = 'http://localhost/index.html';
  ctx.updateAuthUI();
  assert.match(ctx.userArea.innerHTML, /login-nav-btn/);
  ctx.document.getElementById('login-nav-btn').dispatchEvent({ type: 'click' });
  assert.equal(ctx.sessionStorage.getItem('redirectAfterLogin'), 'http://localhost/index.html');
  assert.equal(ctx.location.href, 'login.html');
  ctx.sessionStorage.setItem('isLoggedIn', 'true');
  ctx.sessionStorage.setItem('currentUser', JSON.stringify({ fullName: 'Tester' }));
  ctx.updateAuthUI();
  assert.match(ctx.userArea.innerHTML, /logout-btn/);
  ctx.document.getElementById('logout-btn').dispatchEvent({ type: 'click' });
  assert.equal(ctx.location.href, 'login.html');
  assert.equal(ctx.sessionStorage.getItem('isLoggedIn'), null);
});

test('modal: open and close cleans overlay listener', () => {
  const ctx = buildAppContext();
  ctx.openProductDetail({
    key: 'smartphone-1',
    name: 'Alpha Phone',
    price: '10.000 đ',
    image: 'a.jpg'
  });
  assert.equal(ctx.detailOverlay.classList.contains('hidden'), false);
  ctx.closeProductDetail();
  assert.equal(ctx.detailOverlay.classList.contains('hidden'), true);
  assert.equal((ctx.detailOverlay._listeners.click || []).length, 0);
});

test('effects: mouse tracking updates CSS vars and shadow', () => {
  const ctx = buildAppContext();
  const card = ctx.document.createElement('div');
  card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 });
  ctx.handleMouseMove({ currentTarget: card, clientX: 100, clientY: 100 });
  assert.equal(card.style['--mouse-x'], '100px');
  assert.equal(card.style['--mouse-y'], '100px');
  assert.match(card.style.boxShadow, /0 20px 40px/);
  ctx.handleMouseLeave({ currentTarget: card });
  assert.equal(card.style.boxShadow, 'none');
});

test('login: valid credentials set session and remember-me', async () => {
  const ctx = loadLoginContext();
  await new Promise(resolve => setImmediate(resolve));
  ctx.document.getElementById('username').value = 'admin';
  ctx.document.getElementById('password').value = 'admin123';
  ctx.document.getElementById('remember-me').checked = true;
  ctx.document.getElementById('login-form').dispatchEvent({ type: 'submit' });
  const currentUser = JSON.parse(ctx.sessionStorage.getItem('currentUser'));
  assert.equal(ctx.sessionStorage.getItem('isLoggedIn'), 'true');
  assert.equal(currentUser.username, 'admin');
  assert.equal(ctx.localStorage.getItem('rememberedUser') !== null, true);
  assert.equal(ctx.location.href, 'index.html');
});
