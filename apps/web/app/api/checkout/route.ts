import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const { packageId, successUrl, cancelUrl } = await request.json();
    if (!packageId)
      return NextResponse.json({ success: false, error: 'packageId requerido' }, { status: 400 });

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token)
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

    // biome-ignore lint/style/noNonNullAssertion: env required
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, // biome-ignore lint/style/noNonNullAssertion
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // biome-ignore lint/style/noNonNullAssertion
    );

    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user)
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });

    const { data: pkg } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .single();
    if (!pkg)
      return NextResponse.json({ success: false, error: 'Paquete no encontrado' }, { status: 404 });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (pkg.currency as string).toLowerCase(),
            product_data: { name: pkg.name as string },
            unit_amount: pkg.price_cents as number,
          },
          quantity: 1,
        },
      ],
      metadata: { user_id: user.id, package_id: packageId, credits: String(pkg.credits) },
      success_url: successUrl || `${request.headers.get('origin')}/billing?success=true`,
      cancel_url: cancelUrl || `${request.headers.get('origin')}/billing?canceled=true`,
    });

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
