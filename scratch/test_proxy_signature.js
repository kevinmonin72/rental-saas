const crypto = require('crypto');

function verifyShopifyProxySignature(searchParams, clientSecret) {
  const signature = searchParams.get('signature');
  if (!signature) return false;

  const params = {};
  searchParams.forEach((value, key) => {
    if (key !== 'signature') {
      params[key] = value;
    }
  });

  const sortedKeys = Object.keys(params).sort();
  const inputString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('');

  console.log('Concatenated signature input string:', inputString);

  const calculatedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(inputString)
    .digest('hex');

  console.log('Calculated signature:', calculatedSignature);
  console.log('Received signature:', signature);

  return calculatedSignature === signature;
}

// Unit Test
const secret = 'my_shopify_app_secret_key';
const searchParams = new URLSearchParams();
searchParams.append('shop', 'shop-theridery.myshopify.com');
searchParams.append('path_prefix', '/apps/espace-client');
searchParams.append('timestamp', '1414424361');
searchParams.append('logged_in_customer_id', '123456789');

// Calculate expected signature manually
// Sorted keys: logged_in_customer_id, path_prefix, shop, timestamp
// String: logged_in_customer_id=123456789path_prefix=/apps/espace-clientshop=shop-theridery.myshopify.comtimestamp=1414424361
const expectedString = 'logged_in_customer_id=123456789path_prefix=/apps/espace-clientshop=shop-theridery.myshopify.comtimestamp=1414424361';
const mockSignature = crypto.createHmac('sha256', secret).update(expectedString).digest('hex');
searchParams.append('signature', mockSignature);

console.log('--- Testing Verification ---');
const isValid = verifyShopifyProxySignature(searchParams, secret);
console.log('Signature is valid?', isValid);
if (isValid) {
  console.log('SUCCESS: Signature validation verified!');
} else {
  console.error('FAILURE: Signature validation failed!');
}
