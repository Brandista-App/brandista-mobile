import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import { login } from './api/brandista'
import { apiRequest, jsonBody } from './api/client'
import type { Brand, Category, Page, Product } from './types'

type AdminBrand = Brand & { status: 'ACTIVE' | 'INACTIVE' }
type AdminProduct = Product & { publicationStatus: string }
type AdminAccount = { id: number; email: string; role: string; status: string; brandIds: number[] }
const fail = (error: unknown) => (error instanceof Error ? error.message : 'The request failed.')
const fields = (form: HTMLFormElement) => Object.fromEntries(new FormData(form))

export function AdminLogin() {
  const { account, signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (account && account.role !== 'CUSTOMER') return <Navigate to="/admin" replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = fields(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const response = await login(String(data['email']), String(data['password']))
      if (response.account.role === 'CUSTOMER')
        throw new Error('Use the customer sign-in page for this account.')
      signIn(response.accessToken, response.account)
      navigate('/admin')
    } catch (e) {
      setError(fail(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="admin-panel">
      <h1>Administration sign in</h1>
      <p>For platform and assigned brand administrators.</p>
      <form onSubmit={submit} className="admin-form">
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="button" disabled={busy}>
          Sign in
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      <Link to="/sign-in">Customer sign in</Link>
    </section>
  )
}

export function AdminDashboard() {
  const { account, signOut } = useAuth()
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [brandEditing, setBrandEditing] = useState<AdminBrand | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const platform = account?.role === 'SUPER_ADMIN' || account?.role === 'ADMIN'
  const superAdmin = account?.role === 'SUPER_ADMIN'
  const load = useCallback(async () => {
    // Traverse catalogue pages so existing catalogues are never silently truncated.
    async function allPages<T>(path: string) {
      const values: T[] = []
      for (let page = 0; ; page++) {
        const result = await apiRequest<Page<T>>(`${path}?page=${page}&size=100`)
        values.push(...result.content)
        if (page + 1 >= result.totalPages) return values
      }
    }
    const [b, c, p, a] = await Promise.all([
      apiRequest<AdminBrand[]>('/admin/brands'),
      allPages<Category>('/categories'),
      allPages<AdminProduct>('/admin/products'),
      superAdmin ? apiRequest<AdminAccount[]>('/admin/accounts') : Promise.resolve([]),
    ])
    setBrands(b)
    setCategories(c)
    setProducts(p)
    setAccounts(a)
  }, [superAdmin])
  useEffect(() => {
    if (account && account.role !== 'CUSTOMER') load().catch((e) => setError(fail(e)))
  }, [account, load])
  if (!account || account.role === 'CUSTOMER') return <Navigate to="/admin/login" replace />
  async function action(work: () => Promise<unknown>, message: string) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await work()
      await load()
      setNotice(message)
    } catch (e) {
      setError(fail(e))
    } finally {
      setBusy(false)
    }
  }
  const write = (path: string, method: string, body?: unknown) =>
    apiRequest(path, { method, ...(body === undefined ? {} : { body: jsonBody(body) }) })
  function saveBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = fields(form)
    void action(async () => {
      await write(
        brandEditing ? `/admin/brands/${brandEditing.id}` : '/admin/brands',
        brandEditing ? 'PUT' : 'POST',
        data,
      )
      setBrandEditing(null)
      form.reset()
    }, 'Brand saved.')
  }
  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = fields(form)
    void action(async () => {
      await write(
        editing ? `/admin/products/${editing.id}` : '/admin/products',
        editing ? 'PUT' : 'POST',
        {
          ...data,
          brandId: Number(data['brandId']),
          categoryId: Number(data['categoryId']),
          price: Number(data['price']),
        },
      )
      setEditing(null)
      form.reset()
    }, 'Product saved. Publish it when ready for customers.')
  }
  function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = fields(form)
    const brandIds = new FormData(form).getAll('brandIds').map(Number)
    void action(async () => {
      await write('/admin/accounts', 'POST', {
        email: data['email'],
        password: data['password'],
        role: data['role'],
        brandIds: data['role'] === 'SUPER_ADMIN' ? [] : brandIds,
      })
      form.reset()
    }, 'Admin account created. Share credentials privately with the intended administrator.')
  }
  return (
    <section className="admin-panel">
      <h1>Marketplace administration</h1>
      <p>
        {account.email} · {account.role} <button onClick={signOut}>Sign out</button> ·{' '}
        <Link to="/products">View storefront</Link>
      </p>
      {error && (
        <p role="alert">
          {error}{' '}
          <button disabled={busy} onClick={() => void action(load, 'Refreshed.')}>
            Retry
          </button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <fieldset disabled={busy}>
        <legend>Brands</legend>
        {brands.length === 0 && <p>No assigned brands yet.</p>}
        <ul>
          {brands.map((b) => (
            <li key={b.id}>
              {b.name} · {b.status}
              {platform && (
                <>
                  {' '}
                  <button onClick={() => setBrandEditing(b)}>Edit</button>{' '}
                  <button
                    onClick={() =>
                      void action(
                        () => write(`/admin/brands/${b.id}/deactivate`, 'PATCH'),
                        'Brand deactivated. Its products are hidden from discovery.',
                      )
                    }
                  >
                    Deactivate
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        {platform && (
          <form key={brandEditing?.id ?? 'new-brand'} onSubmit={saveBrand} className="admin-form">
            <h2>{brandEditing ? 'Edit brand' : 'Create brand'}</h2>
            <label>
              Name
              <input name="name" maxLength={150} required defaultValue={brandEditing?.name} />
            </label>
            <label>
              Slug
              <input
                name="slug"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={160}
                required
                defaultValue={brandEditing?.slug}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                maxLength={2000}
                defaultValue={brandEditing?.description ?? ''}
              />
            </label>
            {brandEditing && (
              <label>
                Status
                <select name="status" defaultValue={brandEditing.status}>
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                </select>
              </label>
            )}
            <button className="button">Save brand</button>
            {brandEditing && (
              <button type="button" onClick={() => setBrandEditing(null)}>
                Cancel
              </button>
            )}
          </form>
        )}
      </fieldset>
      {platform && (
        <fieldset disabled={busy}>
          <legend>Categories</legend>
          <p>Create an active category before adding products.</p>
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              const data = fields(form)
              void action(async () => {
                await write('/admin/categories', 'POST', data)
                form.reset()
              }, 'Category created.')
            }}
          >
            <label>
              Name
              <input name="name" required maxLength={150} />
            </label>
            <label>
              Slug
              <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
            </label>
            <button className="button">Create category</button>
          </form>
        </fieldset>
      )}
      {superAdmin && (
        <fieldset disabled={busy}>
          <legend>Administrator access</legend>
          <p>
            Create an account, then share its credentials privately. This form does not send an
            email invitation.
          </p>
          <form onSubmit={createAccount} className="admin-form">
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Initial password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
            <label>
              Role
              <select name="role">
                <option>BRAND_ADMIN</option>
                <option>SUPER_ADMIN</option>
              </select>
            </label>
            <label>
              Assigned brands (brand admins)
              <select name="brandIds" multiple size={Math.min(6, Math.max(3, brands.length))}>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button">Create administrator</button>
          </form>
          {accounts.map((a) => (
            <article key={a.id}>
              <h3>{a.email}</h3>
              <p>
                {a.role} · {a.status}
              </p>
              <button
                onClick={() =>
                  void action(
                    () =>
                      write(`/admin/accounts/${a.id}/status`, 'PATCH', {
                        status: a.status === 'ENABLED' ? 'DISABLED' : 'ENABLED',
                      }),
                    'Account status changed.',
                  )
                }
              >
                {a.status === 'ENABLED' ? 'Disable' : 'Enable'}
              </button>
              {a.role === 'BRAND_ADMIN' && (
                <form
                  className="admin-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const ids = new FormData(e.currentTarget).getAll('brandIds').map(Number)
                    void action(
                      () => write(`/admin/accounts/${a.id}/brands`, 'PUT', { brandIds: ids }),
                      'Assignments saved.',
                    )
                  }}
                >
                  <label>
                    Assigned brands
                    <select
                      name="brandIds"
                      multiple
                      defaultValue={a.brandIds.map(String)}
                      key={a.brandIds.join(',')}
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button>Save assignments</button>
                </form>
              )}
            </article>
          ))}
        </fieldset>
      )}
      <fieldset disabled={busy}>
        <legend>Catalogue</legend>
        <form key={editing?.id ?? 'new-product'} onSubmit={saveProduct} className="admin-form">
          <h2>{editing ? 'Edit product' : 'Create product'}</h2>
          <label>
            Name
            <input name="name" required maxLength={150} defaultValue={editing?.name} />
          </label>
          <label>
            Slug
            <input
              name="slug"
              required
              maxLength={160}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={editing?.slug}
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              maxLength={4000}
              defaultValue={editing?.description ?? ''}
            />
          </label>
          <label>
            Brand
            <select name="brandId" required defaultValue={editing?.brandId}>
              {brands
                .filter((b) => b.status === 'ACTIVE')
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Category
            <select name="categoryId" required defaultValue={editing?.categoryId}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Price (PKR)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={editing?.price}
            />
          </label>
          <label>
            Availability
            <select name="availability" defaultValue={editing?.availability ?? 'AVAILABLE'}>
              <option>AVAILABLE</option>
              <option>UNAVAILABLE</option>
            </select>
          </label>
          <button className="button" disabled={!brands.length || !categories.length}>
            Save product
          </button>
          {editing && (
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </form>
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> · {p.brandName} · {p.publicationStatus} · PKR {p.price}
              {p.publicationStatus !== 'DEACTIVATED' && (
                <>
                  {' '}
                  <button onClick={() => setEditing(p)}>Edit</button>
                  {['publish', 'unpublish', 'deactivate'].map((operation) => (
                    <button
                      key={operation}
                      onClick={() =>
                        void action(
                          () => write(`/admin/products/${p.id}/${operation}`, 'PATCH'),
                          `Product ${operation} completed.`,
                        )
                      }
                    >
                      {operation}
                    </button>
                  ))}
                </>
              )}
            </li>
          ))}
        </ul>
      </fieldset>
    </section>
  )
}
