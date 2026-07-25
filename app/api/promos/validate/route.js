import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export async function POST(req) {
  try {
    const { code, email } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code manquant.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('type', 'location')
      .maybeSingle();

    if (error || !data) return NextResponse.json({ error: 'Code promo invalide.' }, { status: 400 });
    
    if (!data.is_active) {
      return NextResponse.json({ error: 'Ce code promo est inactif.' }, { status: 400 });
    }
    
    if (data.max_uses && data.used_count >= data.max_uses) {
      return NextResponse.json({ error: "Ce code promo a atteint son nombre maximum d'utilisations." }, { status: 400 });
    }
    
    if (data.target_email && (!email || data.target_email.toLowerCase() !== email.toLowerCase())) {
      return NextResponse.json({ error: "Ce code promo n'est pas valide pour cette adresse email." }, { status: 400 });
    }

    return NextResponse.json({ success: true, promo: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
