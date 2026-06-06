import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

// The secret key used to sign the token from Shopify.
// This MUST match the secret used in the Shopify Liquid code.
const SHOPIFY_SSO_SECRET = process.env.SHOPIFY_SSO_SECRET || 'ridery_super_secret_sso_key_2024';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const email = searchParams.get('email');
  const firstName = searchParams.get('first_name') || '';
  const lastName = searchParams.get('last_name') || '';
  const timestamp = searchParams.get('timestamp');
  const signature = searchParams.get('signature');
  const redirectUrl = searchParams.get('redirect') || '/espace-client';

  // 1. Validate required parameters
  if (!email || !timestamp || !signature) {
    return new NextResponse("Paramètres manquants pour la connexion sécurisée.", { status: 400 });
  }

  // 2. Prevent replay attacks (token valid for 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const tokenTime = parseInt(timestamp, 10);
  if (Math.abs(now - tokenTime) > 300) {
    return new NextResponse("Le lien de connexion a expiré (validité de 5 minutes). Veuillez rafraîchir votre page Shopify.", { status: 403 });
  }

  // 3. Verify the signature
  // We reconstruct the string that was signed in Shopify: email + timestamp
  const payloadToSign = `${email}${timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', SHOPIFY_SSO_SECRET)
    .update(payloadToSign)
    .digest('hex');

  if (signature !== expectedSignature) {
    return new NextResponse("Signature invalide. Tentative de connexion refusée.", { status: 403 });
  }

  // 4. Signature is VALID. We now need to log the user into Supabase.
  try {
    // Check if user exists in Supabase Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    let user = null;
    if (users) {
      user = users.find(u => u.email === email);
    }

    if (!user) {
      // User doesn't exist in Supabase yet, we create them automatically
      // We generate a strong random password since they will always use SSO
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true, // Auto-confirm
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (createError) throw createError;
      user = newUser.user;

      // Also create the customer profile in the 'customers' table
      const newId = crypto.randomUUID();
      await supabaseAdmin.from('customers').insert([{
        id: newId,
        email: email,
        first_name: firstName,
        last_name: lastName
      }]);
    }

    // 5. Generate a session for this user
    // To seamlessly log them in on the client side, we can generate a magic link
    // or just set the session directly if we use Supabase Auth on the server.
    // For Next.js App Router, the easiest way is to redirect to the client with a magic token, 
    // BUT generating a PKCE link is safer.
    
    // Actually, we can generate a temporary password reset link, which logs them in automatically when visited.
    // However, generating a link and returning it via redirect is simpler:
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rental-saas-seven.vercel.app'}${redirectUrl}`
      }
    });

    if (linkError) throw linkError;

    // Redirect the user to the generated magic link.
    // Supabase will automatically log them in and redirect them to the final URL.
    return NextResponse.redirect(new URL(linkData.properties.action_link));

  } catch (error) {
    console.error("SSO Bridge Error:", error);
    return new NextResponse("Erreur interne lors de la création de la session.", { status: 500 });
  }
}
