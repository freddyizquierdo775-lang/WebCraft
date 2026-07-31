'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, DollarSign, Edit3, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  price_cents: number;
  stock: number;
  is_active: boolean;
}

interface Order {
  id: string;
  customer_email: string;
  status: string;
  total_cents: number;
  created_at: string;
}

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Camiseta WebCraft', price_cents: 29900, stock: 50, is_active: true },
  { id: '2', name: 'Taza Personalizada', price_cents: 15900, stock: 30, is_active: true },
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    customer_email: 'cliente@email.com',
    status: 'paid',
    total_cents: 45800,
    created_at: '2026-07-30T12:00:00Z',
  },
  {
    id: 'o2',
    customer_email: 'otro@email.com',
    status: 'shipped',
    total_cents: 29900,
    created_at: '2026-07-28T09:00:00Z',
  },
];

function formatPrice(cents: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
}

export default function EcommerceDashboard() {
  const [products] = useState(MOCK_PRODUCTS);
  const [orders] = useState(MOCK_ORDERS);

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_cents, 0);
  const pendingOrders = orders.filter((o) => o.status === 'paid').length;
  const totalProducts = products.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tienda</h2>
        <p className="text-sm text-muted-foreground">Gestiona productos, pedidos e inventario</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Ingresos totales', value: formatPrice(totalRevenue), icon: DollarSign },
          { label: 'Pedidos pendientes', value: String(pendingOrders), icon: Clock },
          { label: 'Productos activos', value: String(totalProducts), icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="gap-1">
            <Package className="h-4 w-4" /> Productos
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1">
            <ShoppingCart className="h-4 w-4" /> Pedidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          </div>
          <div className="space-y-3">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(p.price_cents)} · Stock: {p.stock}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.is_active ? 'default' : 'secondary'}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <div className="space-y-3">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{o.customer_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString('es-MX')} ·{' '}
                      {formatPrice(o.total_cents)}
                    </p>
                  </div>
                  <Badge variant={o.status === 'paid' ? 'default' : 'secondary'}>
                    {o.status === 'paid' ? 'Pagado' : o.status === 'shipped' ? 'Enviado' : o.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
