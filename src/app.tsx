import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import {
  addCartItem,
  discoverBrands,
  discoverCategories,
  discoverProducts,
  getAddresses,
  getCart,
  getProduct,
  login,
  register,
  removeCartItem,
  updateCartItem,
} from './api/brandista'
import { ApiError } from './api/client'
import { AuthProvider, useAuth } from './auth'
import type { Address, Brand, Cart, Category, Page, Product } from './types'

function price(value: number, currency = 'PKR') {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}
function Loading() {
  return (
    <div className="feedback" role="status">
      <i className="spinner" />
      Finding lovely things…
    </div>
  )
}
function Failure({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="feedback fail" role="alert">
      <p>{message}</p>
      {retry && (
        <button className="button outline small" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  )
}
function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <span>✳</span>
      <h3>{title}</h3>
      {children}
    </div>
  )
}
function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product">
      <Link
        className="product-art"
        to={`/products/${encodeURIComponent(product.slug)}`}
        aria-label={`View ${product.name}`}
      >
        <span className="sun" />
        <span className="object" />
        <small>{product.categoryName}</small>
      </Link>
      <div className="product-meta">
        <span>{product.brandName}</span>
        <span>{price(product.price)}</span>
      </div>
      <Link className="product-name" to={`/products/${encodeURIComponent(product.slug)}`}>
        {product.name}
      </Link>
    </article>
  )
}
function Header() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const location = useLocation()
  const { account, signOut } = useAuth()
  const nav = useNavigate()
  useEffect(() => {
    setText(
      location.pathname === '/products'
        ? new URLSearchParams(location.search).get('keyword') || ''
        : '',
    )
  }, [location.pathname, location.search])
  function search(e: FormEvent) {
    e.preventDefault()
    nav(`/products${text.trim() ? `?keyword=${encodeURIComponent(text.trim())}` : ''}`)
    setOpen(false)
  }
  return (
    <header>
      <div className="utility">
        <span>Thoughtfully found. Proudly local.</span>
        <span>Made for discovering Pakistan</span>
      </div>
      <div className="wrap head">
        <button
          className="menu"
          aria-expanded={open}
          aria-controls="navigation"
          onClick={() => setOpen(!open)}
        >
          <span className="sr">Toggle menu</span>☰
        </button>
        <Link className="logo" to="/">
          brandista<span>.</span>
        </Link>
        <form className="search" role="search" onSubmit={search}>
          <label className="sr" htmlFor="q">
            Search products
          </label>
          <input
            id="q"
            maxLength={100}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Find something lovely…"
          />
          <button aria-label="Search">⌕</button>
        </form>
        <div className="head-actions">
          <Link to={account ? '/account' : '/sign-in'}>
            ♙ <span>{account ? 'Account' : 'Sign in'}</span>
          </Link>
          <Link to="/cart">
            ♧ <span>Bag</span>
          </Link>
        </div>
      </div>
      <nav id="navigation" className={open ? 'open' : ''} aria-label="Main navigation">
        <div className="wrap nav">
          <NavLink to="/products" onClick={() => setOpen(false)}>
            Shop all
          </NavLink>
          <NavLink to="/brands" onClick={() => setOpen(false)}>
            Our brands
          </NavLink>
          <NavLink to="/about" onClick={() => setOpen(false)}>
            Our story
          </NavLink>
          {account && (
            <button
              onClick={() => {
                signOut()
                setOpen(false)
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <div>
          <Link className="logo foot-logo" to="/">
            brandista<span>.</span>
          </Link>
          <p>A thoughtful place to find independent brands worth knowing.</p>
        </div>
        <div>
          <b>Explore</b>
          <Link to="/products">Shop all</Link>
          <Link to="/brands">Our brands</Link>
          <Link to="/about">Our story</Link>
        </div>
        <div>
          <b>Your Brandista</b>
          <Link to="/sign-in">Sign in</Link>
          <Link to="/account/addresses">Delivery addresses</Link>
          <Link to="/cart">Your bag</Link>
        </div>
        <small>© {new Date().getFullYear()} Brandista · Made with care in Pakistan</small>
      </div>
    </footer>
  )
}
function Shell() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/brands/:slug" element={<Info title="This brand page is coming soon." />} />
          <Route path="/sign-in" element={<Auth mode="sign-in" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/addresses"
            element={
              <ProtectedRoute>
                <Account addresses />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<Info title="Good things have good stories." />} />
          <Route path="/checkout" element={<Navigate to="/cart" replace />} />
          <Route
            path="*"
            element={<Info title="We couldn’t find that page." label="404 · Not found" />}
          />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { account } = useAuth()
  const location = useLocation()
  if (!account) {
    return (
      <Navigate to="/sign-in" replace state={{ from: `${location.pathname}${location.search}` }} />
    )
  }
  return children
}
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  )
}

function Home() {
  const [items, setItems] = useState<Product[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredBrands, setFeaturedBrands] = useState<Brand[] | null>(null)
  const [brandsError, setBrandsError] = useState('')
  const [brandsBusy, setBrandsBusy] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  async function load() {
    setBusy(true)
    setError('')
    try {
      const [p, c] = await Promise.all([
        discoverProducts(new URLSearchParams('size=4')),
        discoverCategories(),
      ])
      setItems(p.content)
      setCategories(c.content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load collection.')
    } finally {
      setBusy(false)
    }
  }
  async function loadBrands() {
    setBrandsBusy(true)
    setBrandsError('')
    try {
      setFeaturedBrands((await discoverBrands()).content.slice(0, 3))
    } catch (e) {
      setBrandsError(e instanceof Error ? e.message : 'Could not load makers.')
    } finally {
      setBrandsBusy(false)
    }
  }
  useEffect(() => {
    void load()
    void loadBrands()
  }, [])
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">A little more local</div>
            <h1>
              Good finds.
              <br />
              <em>Good stories.</em>
            </h1>
            <p>
              Meet the independent Pakistani brands making everyday things feel a little more
              special.
            </p>
            <div className="hero-ctas">
              <Link className="button" to="/products">
                Explore the collection ↗
              </Link>
              <Link className="text-link" to="/brands">
                Meet our makers
              </Link>
            </div>
            <small className="hero-note">— Small brands, big heart</small>
          </div>
          <div className="hero-art" aria-label="A sunlit terracotta still life">
            <i className="vase v1" />
            <i className="vase v2" />
            <i className="stem s1" />
            <i className="stem s2" />
            <i className="sun" />
            <small>Objects for living well</small>
          </div>
        </div>
      </section>
      <div className="trust">
        <div className="wrap">
          <span>✳ Independent labels</span>
          <span>✳ Local by nature</span>
          <span>✳ Picked with intention</span>
        </div>
      </div>
      <section className="wrap section">
        <div className="section-head">
          <div>
            <div className="eyebrow">A good place to start</div>
            <h2>Browse by feeling</h2>
          </div>
          <Link className="text-link" to="/products">
            See everything ↗
          </Link>
        </div>
        <div className="categories">
          {categories.slice(0, 5).map((c, i) => (
            <Link className={`category cat-${i}`} key={c.id} to={`/products?categoryId=${c.id}`}>
              {c.name}
              <span>↗</span>
            </Link>
          ))}
          {!categories.length && !busy && (
            <Link className="category cat-0" to="/products">
              Explore all finds ↗
            </Link>
          )}
        </div>
      </section>
      <section className="wrap section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Good people, good things</div>
            <h2>Makers to know</h2>
          </div>
          <Link className="text-link" to="/brands">
            Meet every maker ↗
          </Link>
        </div>
        {brandsBusy ? (
          <Loading />
        ) : brandsError ? (
          <Failure message={brandsError} retry={() => void loadBrands()} />
        ) : featuredBrands?.length ? (
          <div className="brand-grid">
            {featuredBrands.map((brand, i) => (
              <article className={`brand-card bc-${i}`} key={brand.id}>
                <span className="monogram">{brand.name.slice(0, 1)}</span>
                <div className="eyebrow">Independent label</div>
                <h3>{brand.name}</h3>
                <p>{brand.description || 'A local label, thoughtfully made.'}</p>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="Our maker list is taking shape">
            <p>Our first independent partners will be here soon.</p>
          </Empty>
        )}
      </section>
      <section className="section featured">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">Picked for you</div>
              <h2>Little things, loved lots</h2>
            </div>
            <Link className="text-link" to="/products">
              Shop the collection ↗
            </Link>
          </div>
          {busy ? (
            <Loading />
          ) : error ? (
            <Failure message={error} retry={() => void load()} />
          ) : items?.length ? (
            <div className="products">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty title="The shelves are getting ready">
              <p>Come back soon to meet our first independent makers.</p>
            </Empty>
          )}
        </div>
      </section>
      <section className="story">
        <div className="wrap story-inner">
          <div className="stamp">
            B<br />♥<br />P
          </div>
          <div>
            <div className="eyebrow">The Brandista feeling</div>
            <h2>
              Find a brand.
              <br />
              <em>Feel the difference.</em>
            </h2>
            <p>
              We bring thoughtful Pakistani labels together, so good things are easier to discover.
            </p>
          </div>
          <Link className="button light" to="/about">
            A little about us ↗
          </Link>
        </div>
      </section>
    </>
  )
}

function Products() {
  const [query, setQuery] = useSearchParams()
  const [data, setData] = useState<Page<Product> | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [filtersLoading, setFiltersLoading] = useState(true)
  const [filterError, setFilterError] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const keyword = query.get('keyword') || ''
  const category = query.get('categoryId') || ''
  const brand = query.get('brandId') || ''
  const sort = query.get('sort') || 'default'
  const currentPage = query.get('page') || '0'
  const load = useCallback(async () => {
    const request = ++requestId.current
    setBusy(true)
    setError('')
    const p = new URLSearchParams({ page: currentPage, size: '12', sort })
    if (keyword) p.set('keyword', keyword)
    if (category) p.set('categoryId', category)
    if (brand) p.set('brandId', brand)
    try {
      const result = await discoverProducts(p)
      if (request === requestId.current) setData(result)
    } catch (e) {
      if (request === requestId.current)
        setError(e instanceof Error ? e.message : 'Could not load products.')
    } finally {
      if (request === requestId.current) setBusy(false)
    }
  }, [brand, category, currentPage, keyword, sort])
  useEffect(() => {
    void load()
    return () => {
      requestId.current += 1
    }
  }, [load])
  async function loadFilters() {
    setFiltersLoading(true)
    setFilterError('')
    try {
      const [categoryPage, brandPage] = await Promise.all([
        discoverCategories(new URLSearchParams('size=100')),
        discoverBrands(new URLSearchParams('size=100')),
      ])
      setCategories(categoryPage.content)
      setBrands(brandPage.content)
    } catch (e) {
      setFilterError(e instanceof Error ? e.message : 'Could not load catalogue filters.')
    } finally {
      setFiltersLoading(false)
    }
  }
  useEffect(() => {
    void loadFilters()
  }, [])
  function change(key: string, value: string) {
    const next = new URLSearchParams(query)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setQuery(next)
  }
  return (
    <section className="wrap catalog">
      <Crumb current="Shop all" />
      <div className="catalog-head">
        <div>
          <div className="eyebrow">Curated, not crowded</div>
          <h1>Find your next favourite</h1>
          <p>Good things from independent Pakistani brands.</p>
        </div>
        <small>{data?.totalElements ?? '—'} finds</small>
      </div>
      {filterError && (
        <div className="filter-error" role="alert">
          <span>{filterError}</span>
          <button className="text-link" onClick={() => void loadFilters()}>
            Retry filters
          </button>
        </div>
      )}
      <div className="filters">
        <label>
          Category
          <select
            value={category}
            disabled={filtersLoading}
            onChange={(e) => change('categoryId', e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Brand
          <select
            value={brand}
            disabled={filtersLoading}
            onChange={(e) => change('brandId', e.target.value)}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(e) => change('sort', e.target.value)}>
            <option value="default">Recommended</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </div>
      {busy ? (
        <Loading />
      ) : error ? (
        <Failure message={error} retry={() => void load()} />
      ) : data?.content.length ? (
        <>
          <div className="products">
            {data.content.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="pagination">
            <button
              className="button outline"
              disabled={data.page === 0}
              onClick={() => change('page', String(data.page - 1))}
            >
              ← Previous
            </button>
            <span>
              Page {data.page + 1} of {Math.max(data.totalPages, 1)}
            </span>
            <button
              className="button outline"
              disabled={data.page + 1 >= data.totalPages}
              onClick={() => change('page', String(data.page + 1))}
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <Empty title="No finds just yet">
          <p>Try a different search or browse all categories.</p>
          <button className="button outline" onClick={() => setQuery({})}>
            Clear filters
          </button>
        </Empty>
      )}
    </section>
  )
}
function Crumb({ current }: { current: string }) {
  return (
    <div className="crumb">
      <Link to="/">Home</Link> / {current}
    </div>
  )
}
function ProductDetail() {
  const { slug = '' } = useParams()
  const [item, setItem] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [quantity, setQuantity] = useState('1')
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('')
  const { account } = useAuth()
  const requestedQuantity = Number(quantity)
  const validQuantity =
    Number.isInteger(requestedQuantity) && requestedQuantity >= 1 && requestedQuantity <= 2147483647
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setItem(null)
    setQuantity('1')
    setNotice('')
    getProduct(slug)
      .then((product) => {
        if (active) setItem(product)
      })
      .catch((e: unknown) => {
        if (!active) return
        setError(
          e instanceof ApiError && e.status === 404
            ? 'This find is no longer available.'
            : e instanceof Error
              ? e.message
              : 'Could not load this product.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug, retryCount])
  async function add() {
    if (!item) return
    if (!account) {
      setNotice('Sign in to add this to your bag.')
      return
    }
    if (!validQuantity) {
      setNotice('Enter a quantity from 1 to 2,147,483,647.')
      return
    }
    setAdding(true)
    try {
      await addCartItem(item.id, requestedQuantity)
      setNotice('Added to your bag.')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not update your bag.')
    } finally {
      setAdding(false)
    }
  }
  if (loading)
    return (
      <div className="wrap page-space">
        <Loading />
      </div>
    )
  if (error || !item)
    return (
      <div className="wrap page-space">
        <Failure
          message={error || 'Product not found.'}
          retry={() => setRetryCount((n) => n + 1)}
        />
      </div>
    )
  return (
    <section className="wrap detail">
      <Crumb current={item.name} />
      <div className="detail-grid">
        <div className="detail-art">
          <i className="sun" />
          <i className="object" />
          <small>{item.categoryName}</small>
        </div>
        <div>
          <div className="eyebrow">{item.brandName}</div>
          <h1>{item.name}</h1>
          <strong className="price">{price(item.price)}</strong>
          <p>
            {item.description || 'A thoughtful find from one of our independent Pakistani makers.'}
          </p>
          <div className="available">
            {item.availability === 'AVAILABLE'
              ? '● Available to discover'
              : '○ Currently unavailable'}
          </div>
          <label className="quantity-control">
            Quantity
            <input
              type="number"
              min="1"
              max="2147483647"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <button
            disabled={item.availability !== 'AVAILABLE' || !validQuantity || adding}
            onClick={() => void add()}
            className="button"
          >
            {adding ? 'Adding…' : 'Add to your bag ↗'}
          </button>
          {notice && (
            <p role="status" className="notice">
              {notice} {notice.startsWith('Sign in') && <Link to="/sign-in">Sign in</Link>}
            </p>
          )}
          <small className="note">
            Price and availability come from the catalogue. Checkout is not yet available.
          </small>
        </div>
      </div>
    </section>
  )
}
function Brands() {
  const [brands, setBrands] = useState<Brand[] | null>(null)
  const [error, setError] = useState('')
  async function load() {
    setError('')
    try {
      setBrands((await discoverBrands()).content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load brands.')
    }
  }
  useEffect(() => {
    void load()
  }, [])
  return (
    <section className="wrap page-space">
      <div className="eyebrow">Good people, good things</div>
      <h1 className="page-title">Meet the makers</h1>
      <p className="intro">Independent Pakistani brands with something worth sharing.</p>
      {error ? (
        <Failure message={error} retry={() => void load()} />
      ) : !brands ? (
        <Loading />
      ) : brands.length ? (
        <div className="brand-grid">
          {brands.map((b, i) => (
            <article className={`brand-card bc-${i % 4}`} key={b.id}>
              <span className="monogram">{b.name.slice(0, 1)}</span>
              <div className="eyebrow">Independent label</div>
              <h2>{b.name}</h2>
              <p>{b.description || 'A local label, thoughtfully made.'}</p>
              <Link className="text-link" to={`/brands/${encodeURIComponent(b.slug)}`}>
                Explore the brand ↗
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Our maker list is taking shape">
          <p>Our first independent partners will be here soon.</p>
        </Empty>
      )}
    </section>
  )
}
type AuthFieldErrors = { email?: string; password?: string }

function Auth({ mode }: { mode: 'sign-in' | 'register' }) {
  const isNew = mode === 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const { account, signIn } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const locationState = location.state as {
    from?: unknown
    registrationSuccess?: boolean
    email?: unknown
  } | null
  const requestedDestination =
    typeof locationState?.from === 'string' &&
    locationState.from.startsWith('/') &&
    !locationState.from.startsWith('//')
      ? locationState.from
      : '/account'
  useEffect(() => {
    if (locationState?.registrationSuccess && !isNew) {
      setSuccess('Your account is ready. Sign in to continue.')
      if (typeof locationState.email === 'string') setEmail(locationState.email)
    }
  }, [isNew, locationState?.email, locationState?.registrationSuccess])
  if (account && !isNew) return <Navigate to={requestedDestination} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const normalizedEmail = email.trim()
    const nextFieldErrors: AuthFieldErrors = {}
    if (!normalizedEmail) nextFieldErrors.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      nextFieldErrors.email = 'Enter a valid email address.'
    if (!password) nextFieldErrors.password = 'Enter your password.'
    else {
      const characterCount = Array.from(password).length
      const byteCount = new TextEncoder().encode(password).length
      if (isNew && characterCount < 12) nextFieldErrors.password = 'Use at least 12 characters.'
      else if (byteCount > 72) nextFieldErrors.password = 'Password must be at most 72 UTF-8 bytes.'
    }
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length) return

    setBusy(true)
    setError('')
    setSuccess('')
    try {
      if (isNew) {
        const r = await register(normalizedEmail, password)
        nav('/sign-in', {
          replace: true,
          state: { from: requestedDestination, registrationSuccess: true, email: r.email },
        })
      } else {
        const r = await login(normalizedEmail, password)
        if (r.account.role !== 'CUSTOMER') {
          setError('This account cannot access the Brandista customer storefront.')
          return
        }
        signIn(r.accessToken, r.account)
        nav(requestedDestination, { replace: true })
      }
    } catch (e) {
      if (e instanceof ApiError) {
        const mapped: AuthFieldErrors = {}
        for (const item of e.fieldErrors) {
          if (item.field === 'email' || item.field === 'password') mapped[item.field] = item.message
        }
        setFieldErrors(mapped)
        if (e.status === 401 && !isNew) setError('Email or password is incorrect.')
        else if (e.status === 409 && isNew)
          setError('An account with this email address already exists.')
        else if (e.status === 400 && Object.keys(mapped).length)
          setError('Please check the highlighted fields.')
        else if (e.status >= 500 || e.status === 0)
          setError('Brandista is unavailable right now. Please try again shortly.')
        else
          setError('We could not complete that request. Please review your details and try again.')
      } else setError('We could not complete that request. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="eyebrow">{isNew ? 'A good thing starts here' : 'Welcome back'}</div>
        <h1>{isNew ? 'Make yourself at home.' : 'Good to see you.'}</h1>
        <p>
          {isNew
            ? 'Create your Brandista account to keep your discoveries close.'
            : 'Sign in to pick up where you left off.'}
        </p>
        <form className="form" onSubmit={submit}>
          <label htmlFor="auth-email">
            Email address
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldErrors((current) => ({ ...current, email: '' }))
              }}
            />
            {fieldErrors.email && (
              <small id="auth-email-error" className="field-error">
                {fieldErrors.email}
              </small>
            )}
          </label>
          <div className="password-field">
            <label htmlFor="auth-password">Password</label>
            <div className="password-input-wrap">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isNew ? 'new-password' : 'current-password'}
                required
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'auth-password-error' : isNew ? 'password-hint' : undefined
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFieldErrors((current) => ({ ...current, password: '' }))
                }}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password ? (
              <small id="auth-password-error" className="field-error">
                {fieldErrors.password}
              </small>
            ) : isNew ? (
              <small id="password-hint">At least 12 characters; at most 72 UTF-8 bytes.</small>
            ) : null}
          </div>
          {error && (
            <div className="inline-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="success" role="status">
              {success}
            </div>
          )}
          <button className="button full" disabled={busy}>
            {busy ? 'One moment…' : isNew ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="auth-switch">
          {isNew ? 'Already have an account?' : 'New to Brandista?'}{' '}
          <Link to={isNew ? '/sign-in' : '/register'}>
            {isNew ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        <small className="note">
          Your access token stays in memory and clears when you sign out, refresh, or it expires.
        </small>
      </div>
    </section>
  )
}
function CartPage() {
  const { account } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function load() {
    setError('')
    try {
      setCart(await getCart())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your bag.')
    }
  }
  useEffect(() => {
    if (account) void load()
  }, [account])
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true)
    try {
      await action()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that change.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="wrap page-space">
      <div className="eyebrow">Saved for later? It’s right here</div>
      <h1 className="page-title">Your bag</h1>
      {!account ? (
        <div className="prompt">
          <p>Sign in to see your saved finds.</p>
          <Link className="button" to="/sign-in">
            Sign in to your account
          </Link>
        </div>
      ) : error ? (
        <Failure message={error} retry={() => void load()} />
      ) : !cart ? (
        <Loading />
      ) : !cart.items.length ? (
        <Empty title="Your bag is taking a little breather">
          <p>Find something lovely to bring it to life.</p>
          <Link className="button" to="/products">
            Explore the collection
          </Link>
        </Empty>
      ) : (
        <>
          <div className="cart-list">
            {cart.items.map((i) => (
              <article className="cart-row" key={i.itemId}>
                <div className="cart-thumb">
                  <i className="object" />
                </div>
                <div>
                  <small>{i.brandName}</small>
                  <h2>{i.productName}</h2>
                  {!i.available && (
                    <small className="inline-error">No longer available — please remove.</small>
                  )}
                  <label className="qty">
                    Quantity{' '}
                    <input
                      type="number"
                      min="1"
                      max="2147483647"
                      value={i.quantity}
                      disabled={busy}
                      onChange={(e) => {
                        const q = Number(e.target.value)
                        if (Number.isInteger(q) && q > 0)
                          void mutate(() => updateCartItem(i.itemId, q))
                      }}
                    />
                  </label>
                </div>
                <div className="cart-end">
                  <b>{price(i.lineSubtotal)}</b>
                  <button
                    onClick={() => void mutate(() => removeCartItem(i.itemId))}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="summary">
            <span>Estimated subtotal</span>
            <b>{price(cart.subtotal)}</b>
            <p>Prices reflect the current catalogue and may change before checkout.</p>
            <button className="button" disabled>
              Checkout is not available yet
            </button>
          </div>
        </>
      )}
      <Link className="text-link" to="/products">
        ← Keep exploring
      </Link>
    </section>
  )
}
function Account({ addresses = false }: { addresses?: boolean }) {
  const { account } = useAuth()
  const [items, setItems] = useState<Address[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (account)
      getAddresses()
        .then(setItems)
        .catch((e: unknown) =>
          setError(e instanceof Error ? e.message : 'Could not load saved addresses.'),
        )
  }, [account])
  if (!account)
    return (
      <section className="wrap page-space">
        <h1 className="page-title">Your account</h1>
        <p>Sign in to view your account.</p>
        <Link className="button" to="/sign-in">
          Sign in
        </Link>
      </section>
    )
  return (
    <section className="wrap page-space">
      <div className="eyebrow">Your Brandista</div>
      <h1 className="page-title">Hello, {account.email.split('@')[0]}.</h1>
      <p className="intro">
        Your account is ready. More profile settings are coming in a later milestone.
      </p>
      <div className="address-panel">
        <h2>{addresses ? 'Delivery addresses' : 'Your delivery addresses'}</h2>
        {error ? (
          <Failure message={error} />
        ) : !items ? (
          <Loading />
        ) : items.length ? (
          <ul>
            {items.map((a) => (
              <li key={a.id}>
                <b>{a.recipientName}</b>
                <span>
                  {a.addressLine1}
                  {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                </span>
                <span>
                  {a.city}
                  {a.province ? `, ${a.province}` : ''} {a.postalCode}
                </span>
                <span>{a.phoneNumber}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No saved addresses yet">
            <p>Address editing is not available in this foundation.</p>
          </Empty>
        )}
      </div>
    </section>
  )
}
function Info({ title, label = 'A note from Brandista' }: { title: string; label?: string }) {
  return (
    <section className="wrap page-space info">
      <div className="eyebrow">{label}</div>
      <h1 className="page-title">{title}</h1>
      <p className="intro">
        This page is part of the Brandista foundation and will be expanded in a later milestone.
      </p>
      <Link className="button outline" to="/">
        Back to home
      </Link>
    </section>
  )
}
