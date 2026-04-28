import jwt from 'jsonwebtoken';
import logger from './logger.js';

export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
  } catch (error) {
    logger.error(`Token verification error: ${error.message}`);
    throw new Error('Invalid or expired token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret');
  } catch (error) {
    logger.error(`Refresh token verification error: ${error.message}`);
    throw new Error('Invalid or expired refresh token');
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
