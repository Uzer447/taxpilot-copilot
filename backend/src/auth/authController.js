import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../shared/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Missing email or password' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
