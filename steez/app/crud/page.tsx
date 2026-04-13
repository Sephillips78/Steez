// export default function CrudPage() {
//return <div>write CRUD operations UI here</div>
// }

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function CrudPage() {
  const [activeTab, setActiveTab] = useState('insert')
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'|'warning'} | null>(null)

  // Form states
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('customer')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [categoryId, setCategoryId] = useState('1')
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [filterCat, setFilterCat] = useState('all')
  const [updateProductId, setUpdateProductId] = useState('')
  const [updatePrice, setUpdatePrice] = useState('')
  const [deleteProductId, setDeleteProductId] = useState('')
  const [wishlistUserId, setWishlistUserId] = useState('')
  const [wishlistProductId, setWishlistProductId] = useState('')
  const [orderEmail, setOrderEmail] = useState('')
  const [orderProductId, setOrderProductId] = useState('')
  const [orderQty, setOrderQty] = useState('1')
  const [orderHistory, setOrderHistory] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])
  const [updateEmail, setUpdateEmail] = useState('')
  const [updateRole, setUpdateRole] = useState('customer')

  const showMsg = (text: string, type: 'success'|'error'|'warning') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  // ── FETCH HELPERS ──────────────────────────────────────────
  async function fetchCategories() {
    const { data } = await supabase.from('category').select('*')
    if (data) setCategories(data)
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from('product')
      .select('*, category(name)')
    if (data) setProducts(data)
  }

  // ── 1. REGISTER USER ───────────────────────────────────────
  async function registerUser() {
    if (!email) return showMsg('Email is required.', 'error')
    const { error } = await supabase
      .from('users')
      .insert({ 
        user_id: crypto.randomUUID(),
        email, 
        role 
      })
    if (error) {
      if (error.code === '23505')
        showMsg('✗ An account with this email already exists. (UNIQUE constraint violation)', 'error')
      else
        showMsg(`✗ Error: ${error.message}`, 'error')
    } else {
      showMsg(`✓ User "${email}" registered successfully as ${role}.`, 'success')
      setEmail('')
    }
  }

  // ── 2. ADD PRODUCT ─────────────────────────────────────────
  async function addProduct() {
    if (!productName) return showMsg('Product name is required.', 'error')
    const price = parseFloat(productPrice)
    if (isNaN(price) || price <= 0)
      return showMsg('✗ Price must be a positive value. (CHECK constraint)', 'error')
    const { error } = await supabase
      .from('product')
      .insert({ 
        product_id: Math.floor(Math.random() * 100000),
        name: productName, 
        price, 
        category_id: parseInt(categoryId) 
      })
    if (error) {
      if (error.code === '23503')
        showMsg('✗ Invalid category. (FK constraint violation)', 'error')
      else
        showMsg(`✗ Error: ${error.message}`, 'error')
    } else {
      showMsg(`✓ Product "${productName}" added successfully.`, 'success')
      setProductName('')
      setProductPrice('')
      fetchProducts()
    }
  }

  // ── 3. PLACE ORDER ─────────────────────────────────────────
  async function placeOrder() {
    if (!orderEmail) return showMsg('User email is required.', 'error')
    const qty = parseInt(orderQty)
    if (qty < 1) return showMsg('✗ Quantity must be at least 1.', 'error')

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', orderEmail)
      .single()

    if (userError || !userData)
      return showMsg('✗ No user found with that email. Orders must link to a registered user. (FK constraint)', 'error')

    const product = products.find(p => p.product_id == parseInt(orderProductId))
    const total = product ? product.price * qty : 0

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({ 
        order_id: Math.floor(Math.random() * 100000),
        user_id: userData.user_id, 
        total_amount: total 
      })
      .select()
      .single()

    if (orderError) return showMsg(`✗ Error creating order: ${orderError.message}`, 'error')

    const { error: itemError } = await supabase
      .from('order_items')
      .insert({ 
        order_id: orderData.order_id, 
        product_id: parseInt(orderProductId), 
        quantity: qty 
      })

    if (itemError) return showMsg(`✗ Error adding item: ${itemError.message}`, 'error')

    showMsg(`✓ Order placed successfully! Total: $${total.toFixed(2)}`, 'success')
  }

 // ── 4. ADD TO WISHLIST ─────────────────────────────────────
  async function addToWishlist() {
    if (!wishlistUserId || !wishlistProductId)
      return showMsg('User ID and Product ID are required.', 'error')
    const { error } = await supabase
      .from('wishlist')
      .insert({ 
        wishlist_id: Math.floor(Math.random() * 100000),
        user_id: wishlistUserId, 
        product_id: parseInt(wishlistProductId) 
      })
    if (error) {
      if (error.code === '23505')
        showMsg('✗ This item is already in the wishlist. (UNIQUE constraint violation)', 'error')
      else if (error.code === '23503')
        showMsg('✗ Invalid user or product. (FK constraint violation)', 'error')
      else
        showMsg(`✗ Error: ${error.message}`, 'error')
    } else {
      showMsg('✓ Product added to wishlist successfully.', 'success')
    }
  }

  // ── 5. BROWSE PRODUCTS ─────────────────────────────────────
  async function browseProducts() {
    let query = supabase.from('product').select('*, category(name)')
    if (filterCat !== 'all')
      query = query.eq('category_id', parseInt(filterCat))
    const { data, error } = await query
    if (error) showMsg(`✗ Error: ${error.message}`, 'error')
    else setProducts(data || [])
  }

  // ── 6. ORDER HISTORY ───────────────────────────────────────
  async function viewOrderHistory() {
    const { data, error } = await supabase
      .from('orders')
      .select(`order_id, total_amount, created_at,
        order_items(quantity, product(name, price))`)
    if (error) showMsg(`✗ Error: ${error.message}`, 'error')
    else setOrderHistory(data || [])
  }

  // ── 7. ANALYTICS ───────────────────────────────────────────
  async function viewAnalytics() {
    const { data, error } = await supabase
      .from('order_items')
      .select('quantity, product(name, price)')
    if (error) return showMsg(`✗ Error: ${error.message}`, 'error')
    const grouped: Record<string, {name:string, total_sold:number, revenue:number}> = {}
    data?.forEach((item: any) => {
      const name = item.product?.name
      if (!grouped[name]) grouped[name] = { name, total_sold: 0, revenue: 0 }
      grouped[name].total_sold += item.quantity
      grouped[name].revenue += item.quantity * item.product?.price
    })
    setAnalytics(Object.values(grouped).sort((a,b) => b.total_sold - a.total_sold))
  }

  // ── 8. UPDATE PRICE ────────────────────────────────────────
  async function updateProductPrice() {
    const price = parseFloat(updatePrice)
    if (isNaN(price) || price <= 0)
      return showMsg('✗ Price must be a positive value. (CHECK constraint)', 'error')
    const { error } = await supabase
      .from('product')
      .update({ price })
      .eq('product_id', parseInt(updateProductId))
    if (error) showMsg(`✗ Error: ${error.message}`, 'error')
    else {
      showMsg(`✓ Price updated to $${price.toFixed(2)} successfully.`, 'success')
      fetchProducts()
    }
  }

  // ── 9. UPDATE ROLE ─────────────────────────────────────────
  async function updateUserRole() {
    if (!updateEmail) return showMsg('Email is required.', 'error')
    const { data, error } = await supabase
      .from('users')
      .update({ role: updateRole })
      .eq('email', updateEmail)
      .select()
    if (error) showMsg(`✗ Error: ${error.message}`, 'error')
    else if (!data?.length) showMsg('⚠ No user found with that email. 0 rows affected.', 'warning')
    else showMsg(`✓ User "${updateEmail}" role updated to "${updateRole}".`, 'success')
  }

  // ── 10. REMOVE FROM WISHLIST ───────────────────────────────
  async function removeFromWishlist() {
    if (!wishlistUserId || !wishlistProductId)
      return showMsg('User ID and Product ID are required.', 'error')
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', wishlistUserId)
      .eq('product_id', parseInt(wishlistProductId))
    if (error) showMsg(`✗ Error: ${error.message}`, 'error')
    else showMsg('✓ Item removed from wishlist successfully.', 'success')
  }

  // ── 11. DELETE PRODUCT ─────────────────────────────────────
  async function deleteProduct() {
    const { error } = await supabase
      .from('product')
      .delete()
      .eq('product_id', parseInt(deleteProductId))
    if (error) {
      if (error.code === '23503')
        showMsg('✗ Cannot delete — product exists in order history. (ON DELETE RESTRICT)', 'error')
      else
        showMsg(`✗ Error: ${error.message}`, 'error')
    } else {
      showMsg('✓ Product deleted successfully.', 'success')
      fetchProducts()
    }
  }

  // ── STYLES ─────────────────────────────────────────────────
  const s = {
    page: { minHeight:'100vh', background:'#0d0d0d', color:'#f0f0f0', fontFamily:'monospace', padding:'24px' },
    title: { fontSize:'1.8rem', color:'#e8ff47', letterSpacing:'4px', marginBottom:'4px' },
    sub: { color:'#777', fontSize:'0.8rem', marginBottom:'24px' },
    tabs: { display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' as const },
    tab: (active:boolean) => ({ padding:'8px 18px', borderRadius:'6px', cursor:'pointer', border:'1px solid', fontSize:'0.8rem',
      background: active ? '#e8ff47' : '#161616', color: active ? '#0d0d0d' : '#777',
      borderColor: active ? '#e8ff47' : '#2a2a2a', fontWeight: active ? 700 : 400 }),
    card: { background:'#161616', border:'1px solid #2a2a2a', borderRadius:'12px', padding:'20px', marginBottom:'16px' },
    label: { fontSize:'0.65rem', color:'#777', letterSpacing:'2px', textTransform:'uppercase' as const, marginBottom:'12px' },
    input: { background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:'6px', padding:'8px 12px',
      color:'#f0f0f0', fontSize:'0.85rem', width:'100%', marginBottom:'8px', fontFamily:'monospace' },
    select: { background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:'6px', padding:'8px 12px',
      color:'#f0f0f0', fontSize:'0.85rem', width:'100%', marginBottom:'8px', fontFamily:'monospace' },
    btn: (color:string) => ({ padding:'8px 18px', borderRadius:'6px', cursor:'pointer', border:'none',
      background: color, color: color === '#e8ff47' ? '#0d0d0d' : '#f0f0f0', fontWeight:700, fontSize:'0.82rem', marginRight:'8px' }),
    msg: (type:string) => ({ padding:'10px 14px', borderRadius:'6px', marginTop:'12px', fontSize:'0.82rem',
      background: type==='success'?'rgba(74,222,128,0.1)':type==='error'?'rgba(248,113,113,0.1)':'rgba(251,191,36,0.1)',
      color: type==='success'?'#4ade80':type==='error'?'#f87171':'#fbbf24',
      border: `1px solid ${type==='success'?'rgba(74,222,128,0.3)':type==='error'?'rgba(248,113,113,0.3)':'rgba(251,191,36,0.3)'}` }),
    table: { width:'100%', borderCollapse:'collapse' as const, fontSize:'0.8rem' },
    th: { textAlign:'left' as const, padding:'8px', color:'#777', borderBottom:'1px solid #2a2a2a', fontSize:'0.7rem' },
    td: { padding:'8px', borderBottom:'1px solid #1a1a1a', color:'#f0f0f0' },
    sql: { background:'#0a0a0a', border:'1px solid #2a2a2a', borderRadius:'6px', padding:'12px',
      fontSize:'0.73rem', color:'#8be9fd', marginBottom:'12px', overflowX:'auto' as const, whiteSpace:'pre' as const },
    h2: { fontSize:'1rem', color:'#f0f0f0', marginBottom:'4px' },
    muted: { fontSize:'0.8rem', color:'#777', marginBottom:'14px' },
  }

  const tabs = [
    { id:'insert', label:'INSERT' },
    { id:'select', label:'SELECT' },
    { id:'update', label:'UPDATE' },
    { id:'delete', label:'DELETE' },
    { id:'edge',   label:'Edge Cases' },
    { id:'rules',  label:'Business Rules' },
  ]

  return (
    <div style={s.page}>
      <div style={s.title}>STEEZ</div>
      <div style={s.sub}>CRUD Operations Panel — 451 Project</div>

      <div style={s.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={s.tab(activeTab===t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {message && <div style={s.msg(message.type)}>{message.text}</div>}

      {/* ── INSERT ── */}
      {activeTab === 'insert' && (
        <div>
          {/* Op 1 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 1 — Register User</div>
            <div style={s.muted}>FR-2: Insert a new customer into the users table.</div>
            <div style={s.sql}>{`INSERT INTO users (email, role) VALUES ('email', 'customer');`}</div>
            <div style={s.label}>UI Demo</div>
            <input style={s.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
            <select style={s.select} value={role} onChange={e=>setRole(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
            <button style={s.btn('#e8ff47')} onClick={registerUser}>Register User</button>
          </div>

          {/* Op 2 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 2 — Add Product (Admin)</div>
            <div style={s.muted}>FR-10: Admin inserts a new product linked to an existing category.</div>
            <div style={s.sql}>{`INSERT INTO product (name, price, category_id) VALUES ('name', 79.99, 1);`}</div>
            <div style={s.label}>UI Demo</div>
            <input style={s.input} placeholder="Product Name" value={productName} onChange={e=>setProductName(e.target.value)}/>
            <input style={s.input} placeholder="Price" type="number" value={productPrice} onChange={e=>setProductPrice(e.target.value)}/>
            <select style={s.select} value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
            <button style={s.btn('#e8ff47')} onClick={addProduct}>Add Product</button>
          </div>

          {/* Op 3 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 3 — Place Order</div>
            <div style={s.muted}>FR-4: Creates an order and inserts associated order items.</div>
            <div style={s.sql}>{`INSERT INTO orders (user_id, total_amount) VALUES (uuid, 79.99);\nINSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 1, 1);`}</div>
            <div style={s.label}>UI Demo</div>
            <input style={s.input} placeholder="User Email" value={orderEmail} onChange={e=>setOrderEmail(e.target.value)}/>
            <select style={s.select} value={orderProductId} onChange={e=>setOrderProductId(e.target.value)}>
              <option value="">Select Product</option>
              {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name} — ${p.price}</option>)}
            </select>
            <input style={s.input} placeholder="Quantity" type="number" value={orderQty} onChange={e=>setOrderQty(e.target.value)}/>
            <button style={s.btn('#e8ff47')} onClick={placeOrder}>Place Order</button>
          </div>

          {/* Op 4 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 4 — Add to Wishlist</div>
            <div style={s.muted}>FR-8: Saves a product to a user's wishlist.</div>
            <div style={s.sql}>{`INSERT INTO wishlist (user_id, product_id) VALUES ('uuid', 1);`}</div>
            <div style={s.label}>UI Demo</div>
            <input style={s.input} placeholder="User UUID" value={wishlistUserId} onChange={e=>setWishlistUserId(e.target.value)}/>
            <input style={s.input} placeholder="Product ID" value={wishlistProductId} onChange={e=>setWishlistProductId(e.target.value)}/>
            <button style={s.btn('#e8ff47')} onClick={addToWishlist}>Add to Wishlist</button>
          </div>
        </div>
      )}

      {/* ── SELECT ── */}
      {activeTab === 'select' && (
        <div>
          {/* Op 5 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 5 — Browse Products by Category</div>
            <div style={s.muted}>FR-3: Retrieves products joined with category names.</div>
            <div style={s.sql}>{`SELECT p.*, c.name AS category_name\nFROM product p\nJOIN category c ON p.category_id = c.category_id\nWHERE c.category_id = 1;`}</div>
            <div style={s.label}>UI Demo</div>
            <select style={s.select} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
            <button style={s.btn('#47c8ff')} onClick={browseProducts}>Search Products</button>
            {products.length > 0 && (
              <table style={{...s.table, marginTop:'12px'}}>
                <thead><tr><th style={s.th}>ID</th><th style={s.th}>Name</th><th style={s.th}>Category</th><th style={s.th}>Price</th></tr></thead>
                <tbody>{products.map(p=>(
                  <tr key={p.product_id}>
                    <td style={s.td}>{p.product_id}</td>
                    <td style={s.td}>{p.name}</td>
                    <td style={s.td}>{p.category?.name}</td>
                    <td style={s.td}>${p.price}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>

          {/* Op 6 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 6 — View Order History</div>
            <div style={s.muted}>FR-9: Retrieves all orders with product details.</div>
            <div style={s.sql}>{`SELECT o.order_id, p.name, oi.quantity, p.price\nFROM orders o\nJOIN order_items oi ON o.order_id = oi.order_id\nJOIN product p ON oi.product_id = p.product_id;`}</div>
            <button style={s.btn('#47c8ff')} onClick={viewOrderHistory}>Load Order History</button>
            {orderHistory.length > 0 && (
              <table style={{...s.table, marginTop:'12px'}}>
                <thead><tr><th style={s.th}>Order ID</th><th style={s.th}>Items</th><th style={s.th}>Total</th></tr></thead>
                <tbody>{orderHistory.map((o:any)=>(
                  <tr key={o.order_id}>
                    <td style={s.td}>{o.order_id}</td>
                    <td style={s.td}>{o.order_items?.map((i:any)=>`${i.product?.name} x${i.quantity}`).join(', ')}</td>
                    <td style={s.td}>${o.total_amount}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>

          {/* Op 7 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 7 — Product Analytics</div>
            <div style={s.muted}>FR-13: Aggregates total quantity sold per product for admin dashboard.</div>
            <div style={s.sql}>{`SELECT p.name, SUM(oi.quantity) AS total_sold,\n       SUM(oi.quantity * p.price) AS revenue\nFROM order_items oi\nJOIN product p ON oi.product_id = p.product_id\nGROUP BY p.name\nORDER BY total_sold DESC;`}</div>
            <button style={s.btn('#47c8ff')} onClick={viewAnalytics}>Load Analytics</button>
            {analytics.length > 0 && (
              <table style={{...s.table, marginTop:'12px'}}>
                <thead><tr><th style={s.th}>Product</th><th style={s.th}>Total Sold</th><th style={s.th}>Revenue</th></tr></thead>
                <tbody>{analytics.map((a,i)=>(
                  <tr key={i}>
                    <td style={s.td}>{a.name}</td>
                    <td style={s.td}>{a.total_sold}</td>
                    <td style={{...s.td, color:'#4ade80'}}>${a.revenue?.toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── UPDATE ── */}
      {activeTab === 'update' && (
        <div>
          {/* Op 8 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 8 — Update Product Price</div>
            <div style={s.muted}>FR-11: Admin modifies the price of an existing product.</div>
            <div style={s.sql}>{`UPDATE product SET price = 3.99 WHERE product_id = 1;`}</div>
            <div style={s.label}>UI Demo</div>
            <select style={s.select} value={updateProductId} onChange={e=>setUpdateProductId(e.target.value)}>
              <option value="">Select Product</option>
              {products.map(p=><option key={p.product_id} value={p.product_id}>{p.name} (current: ${p.price})</option>)}
            </select>
            <input style={s.input} placeholder="New Price" type="number" value={updatePrice} onChange={e=>setUpdatePrice(e.target.value)}/>
            <button style={s.btn('#fbbf24')} onClick={updateProductPrice}>Update Price</button>
          </div>

          {/* Op 9 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 9 — Update User Role</div>
            <div style={s.muted}>Promotes or demotes a user. CHECK constraint enforces valid roles only.</div>
            <div style={s.sql}>{`UPDATE users SET role = 'admin' WHERE email = 'user@example.com';`}</div>
            <div style={s.label}>UI Demo</div>
            <input style={s.input} placeholder="User Email" value={updateEmail} onChange={e=>setUpdateEmail(e.target.value)}/>
            <select style={s.select} value={updateRole} onChange={e=>setUpdateRole(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
            <button style={s.btn('#fbbf24')} onClick={updateUserRole}>Update Role</button>
          </div>
        </div>
      )}

      {/* ── DELETE ── */}
      {activeTab === 'delete' && (
        <div>
          {/* Op 10 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 10 — Remove from Wishlist</div>
            <div style={s.muted}>Deletes a specific product from a user's wishlist.</div>
            <div style={s.sql}>{`DELETE FROM wishlist WHERE user_id = 'uuid' AND product_id = 1;`}</div>
            <div style={s.label}>UI Demo</div>
            <input style={s.input} placeholder="User UUID" value={wishlistUserId} onChange={e=>setWishlistUserId(e.target.value)}/>
            <input style={s.input} placeholder="Product ID" value={wishlistProductId} onChange={e=>setWishlistProductId(e.target.value)}/>
            <button style={s.btn('#f87171')} onClick={removeFromWishlist}>Remove from Wishlist</button>
          </div>

          {/* Op 11 */}
          <div style={s.card}>
            <div style={s.h2}>Operation 11 — Delete Product</div>
            <div style={s.muted}>FR-12: Admin removes a product. Blocked if it exists in any order.</div>
            <div style={s.sql}>{`DELETE FROM product WHERE product_id = 1;\n-- ON DELETE RESTRICT blocks if product is in order_items`}</div>
            <div style={s.label}>UI Demo</div>
            <select style={s.select} value={deleteProductId} onChange={e=>setDeleteProductId(e.target.value)}>
              <option value="">Select Product</option>
              {products.map(p=><option key={p.product_id} value={p.product_id}>{p.name}</option>)}
            </select>
            <button style={s.btn('#f87171')} onClick={deleteProduct}>Delete Product</button>
          </div>
        </div>
      )}

      {/* ── EDGE CASES ── */}
      {activeTab === 'edge' && (
        <div>
          <div style={s.card}>
            <div style={s.h2}>Edge Case 1 — Duplicate Email</div>
            <div style={s.muted}>Registering with an existing email triggers UNIQUE constraint (error 23505).</div>
            <div style={s.sql}>{`INSERT INTO users (email, role) VALUES ('alice@example.com', 'customer');\n-- ERROR: duplicate key violates unique constraint "users_email_key"`}</div>
            <div style={{...s.msg('error'), display:'block', marginTop:'8px'}}>✗ System Response: "An account with this email already exists." — Supabase error code 23505</div>
          </div>
          <div style={s.card}>
            <div style={s.h2}>Edge Case 2 — Delete Product in Active Order</div>
            <div style={s.muted}>Deleting a product referenced by order_items triggers ON DELETE RESTRICT (error 23503).</div>
            <div style={s.sql}>{`DELETE FROM product WHERE product_id = 101;\n-- ERROR: violates foreign key constraint on table "order_items"`}</div>
            <div style={{...s.msg('error'), display:'block', marginTop:'8px'}}>✗ System Response: "Cannot delete — product exists in order history." — Supabase error code 23503</div>
          </div>
          <div style={s.card}>
            <div style={s.h2}>Edge Case 3 — Duplicate Wishlist Entry</div>
            <div style={s.muted}>Adding the same product twice to a wishlist triggers UNIQUE(user_id, product_id) (error 23505).</div>
            <div style={s.sql}>{`INSERT INTO wishlist (user_id, product_id) VALUES ('uuid', 103);\n-- ERROR: duplicate key violates unique constraint "unique_user_product"`}</div>
            <div style={{...s.msg('error'), display:'block', marginTop:'8px'}}>✗ System Response: "This item is already in your wishlist." — Supabase error code 23505</div>
          </div>
          <div style={s.card}>
            <div style={s.h2}>Edge Case 4 — Invalid Price Update</div>
            <div style={s.muted}>Setting a negative price violates CHECK(price &gt;= 0). UI validates before DB call.</div>
            <div style={s.sql}>{`UPDATE product SET price = -5.00 WHERE product_id = 101;\n-- ERROR: violates check constraint "chk_product_price"`}</div>
            <div style={{...s.msg('error'), display:'block', marginTop:'8px'}}>✗ System Response: "Price must be a positive value." — UI validation + DB CHECK constraint</div>
          </div>
        </div>
      )}

      {/* ── BUSINESS RULES ── */}
      {activeTab === 'rules' && (
        <div>
          {[
            { title:'Rule 1 — Role Validation', desc:'User role must be "admin" or "customer" only.', sql:`CONSTRAINT role_check CHECK (role IN ('admin', 'customer'))` },
            { title:'Rule 2 — Order Must Have At Least One Item', desc:'Orders cannot exist with zero items. Enforced via application check and trigger before commit.', sql:`SELECT COUNT(*) FROM order_items WHERE order_id = :id;\n-- If count = 0, rollback transaction` },
            { title:'Rule 3 — Product Price Must Be Positive', desc:'Every product must have a price greater than zero.', sql:`CONSTRAINT chk_product_price CHECK (price >= 0)` },
            { title:'Rule 4 — Product Must Belong to Valid Category', desc:'Every product must reference an existing category via FK.', sql:`CONSTRAINT fk_product_category\n  FOREIGN KEY (category_id) REFERENCES category(category_id)` },
            { title:'Rule 5 — Order Must Link to Registered User', desc:'Every order must have a valid user_id. Orphan orders are structurally impossible.', sql:`CONSTRAINT fk_orders_user\n  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE` },
          ].map((r,i) => (
            <div key={i} style={s.card}>
              <div style={s.h2}>{r.title}</div>
              <div style={s.muted}>{r.desc}</div>
              <div style={s.sql}>{r.sql}</div>
              <div style={{...s.msg('warning'), display:'block'}}>⚠ Enforced at the database level — cannot be bypassed through the UI.</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}