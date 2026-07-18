import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId: '...' }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
};
