import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for a librarian
 * @param {Object} librarian Payload containing librarian id, name, email
 * @returns {string} JWT Token string
 */
export const generateToken = (librarian) => {
  const secret = process.env.JWT_SECRET || 'shelflife_default_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign(
    {
      id: librarian._id || librarian.id,
      name: librarian.name,
      email: librarian.email,
    },
    secret,
    { expiresIn }
  );
};

/**
 * Verify a JWT token
 * @param {string} token JWT Token string
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'shelflife_default_secret_key';
  return jwt.verify(token, secret);
};
