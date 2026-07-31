import { supabaseAdmin } from '../../config/supabase.js';

// ─── Product types ─────────────────────────────────────────
export interface ShopProduct {
  id: string;
  project_id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface ShopOrder {
  id: string;
  project_id: string;
  customer_email: string;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  total_cents: number;
  items: OrderItem[];
  payment_provider: string;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price_cents: number;
}

// ─── Products CRUD ─────────────────────────────────────────
export async function getProducts(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from('shop_products')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(
  projectId: string,
  product: {
    name: string;
    description?: string;
    price_cents: number;
    currency?: string;
    image_url?: string;
    stock?: number;
  },
) {
  const { data, error } = await supabaseAdmin
    .from('shop_products')
    .insert({
      project_id: projectId,
      name: product.name,
      description: product.description || null,
      price_cents: product.price_cents,
      currency: product.currency || 'MXN',
      image_url: product.image_url || null,
      stock: product.stock || 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProduct(productId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('shop_products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProduct(productId: string) {
  const { error } = await supabaseAdmin.from('shop_products').delete().eq('id', productId);

  if (error) throw new Error(error.message);
}

// ─── Orders ────────────────────────────────────────────────
export async function getOrders(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from('shop_orders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Commission calculation (0.5% — backend only) ──────────
export function calculateCommission(totalCents: number): number {
  return Math.round(totalCents * 0.005); // 0.5%
}

export function calculateNetAmount(totalCents: number): number {
  return totalCents - calculateCommission(totalCents);
}
