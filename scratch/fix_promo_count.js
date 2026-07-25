require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: promo, error: getErr } = await supabaseAdmin
    .from('promo_codes')
    .select('id, code, used_count')
    .eq('code', 'ADRIENTEST100')
    .maybeSingle();

  if (getErr || !promo) {
    console.error("Error finding promo code:", getErr);
    return;
  }

  console.log(`Current promo count: ${promo.used_count}`);
  const { error: updateErr } = await supabaseAdmin
    .from('promo_codes')
    .update({ used_count: 1 })
    .eq('id', promo.id);

  if (updateErr) {
    console.error("Error updating promo count:", updateErr);
  } else {
    console.log("Successfully set promo count to 1!");
  }
}

main();
