import { compare, hash } from "bcrypt";

const SALT_ROUNDS = 12;

export const hashPassword = (password: string) => hash(password, SALT_ROUNDS);
export const verifyPassword = (password: string, storedHash: string) => compare(password, storedHash);
