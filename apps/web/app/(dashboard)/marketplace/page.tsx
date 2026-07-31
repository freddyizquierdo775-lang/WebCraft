'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Eye, Search, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  seller: string;
  category: string;
  sales: number;
  rating: number;
  preview_url?: string;
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Restaurante Elegante',
    description: 'Landing page para restaurantes con menú digital y reservas',
    price_cents: 29900,
    seller: 'Diseños MX',
    category: 'Restaurante',
    sales: 42,
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Hotel Boutique',
    description: 'Template para hoteles con galería, habitaciones y booking',
    price_cents: 49900,
    seller: 'WebCraft Pro',
    category: 'Hotel',
    sales: 18,
    rating: 4.5,
  },
  {
    id: '3',
    name: 'Tienda Minimalista',
    description: 'E-commerce limpio con carrito y pasarela integrada',
    price_cents: 39900,
    seller: 'UX Studio',
    category: 'E-commerce',
    sales: 67,
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Portafolio Creativo',
    description: 'Portafolio para freelancers y agencias creativas',
    price_cents: 19900,
    seller: 'Diseños MX',
    category: 'Portafolio',
    sales: 35,
    rating: 4.6,
  },
  {
    id: '5',
    name: 'Landing Startup',
    description: 'Landing page convertible para startups y SaaS',
    price_cents: 24900,
    seller: 'WebCraft Pro',
    category: 'Tech',
    sales: 53,
    rating: 4.7,
  },
];

const CATEGORIES = ['Todos', 'Restaurante', 'Hotel', 'E-commerce', 'Portafolio', 'Tech'];

function formatPrice(cents: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
}

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [templates] = useState(MOCK_TEMPLATES);

  const filtered = templates.filter((t) => {
    const matchesCategory = category === 'Todos' || t.category === category;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-sm text-muted-foreground">
            Descubre y compra templates profesionales. Comisión plataforma: 0.5%
          </p>
        </div>
        <Button variant="outline" className="gap-1">
          <ShoppingBag className="h-4 w-4" /> Vender un template
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tpl) => (
          <Card key={tpl.id} className="group overflow-hidden transition-shadow hover:shadow-md">
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5">
              <Eye className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                  <CardDescription className="line-clamp-1 text-xs">
                    {tpl.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">{tpl.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-lg font-bold">{formatPrice(tpl.price_cents)}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    {tpl.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    {tpl.sales}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">por {tpl.seller}</span>
                <Button size="sm" className="gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Comprar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commission info */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Comisión transparente: 0.5% por venta</p>
            <p className="text-xs text-muted-foreground">
              Solo cobramos cuando vendes. Recibes el 99.5% del precio de venta. La comisión se
              calcula automáticamente en el backend.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
