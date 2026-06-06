import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { GENERIC_EQUIPMENTS } from '../../../../lib/catalog';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const { data: dbEquipments, error } = await supabaseAdmin.from('equipment').select('*').like('reference', 'LOK-%');
    if (error) throw error;

    const missingGenerics = [];
    const updatePromises = [];

    for (const item of GENERIC_EQUIPMENTS) {
      const match = dbEquipments.find(e => e.reference === item.reference);
      if (!match) {
        missingGenerics.push({
          id: uuidv4(),
          reference: item.reference,
          name: item.name,
          category: item.category,
          quantity: item.quantity
        });
      } else if (match.quantity !== item.quantity) {
        updatePromises.push(
          supabaseAdmin.from('equipment').update({ quantity: item.quantity }).eq('id', match.id)
        );
      }
    }

    if (missingGenerics.length > 0) {
      await supabaseAdmin.from('equipment').insert(missingGenerics);
    }
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    return NextResponse.json({ success: true, synced: missingGenerics.length + updatePromises.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
