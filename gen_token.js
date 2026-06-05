import { SignJWT } from 'jose';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local'});

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'TheriderySuperSecretKey2K26!!$$--secure');

async function gen() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .sign(secret);
  console.log(token);
}
gen();
