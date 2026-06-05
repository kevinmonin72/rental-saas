import { jwtVerify, SignJWT } from 'jose';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'TheriderySuperSecretKey2K26!!$$--secure';
  return new TextEncoder().encode(secret);
};

export async function signToken(payload, expiresIn = '1d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (error) {
    return null;
  }
}
