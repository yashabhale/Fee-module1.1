import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  return await bcryptjs.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcryptjs.compare(plainPassword, hashedPassword);
};
