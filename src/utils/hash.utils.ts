import * as argon2 from "argon2";
// import { compareSync, genSaltSync, hashSync } from "bcrypt";
import { ARGON2_MEMORY_COST, ARGON2_TIME_COST } from "../configs/env.configs";
import { logger } from "../configs/logger.configs";

// Argon2 configuration with recommended parameters
const argon2Options: argon2.Options = {
  type: argon2.argon2id, // Recommended variant for password hashing
  memoryCost: Number(ARGON2_MEMORY_COST), // 64 MiB memory cost
  timeCost: Number(ARGON2_TIME_COST), // Number of iterations
  parallelism: 1, // Single thread
  hashLength: 32, // 32-byte hash
};

export const argon2HashPassword = async (password: string) => {
  const source = "HASH PASSWORD UTIL FUNC";
  logger.info(`Hashing password`, { source });

  const hashedPassword = await argon2.hash(password, argon2Options);

  logger.info(`Password hashing completed`, { source });

  return hashedPassword;
};

export const argon2ComparePassword = async (plain: string, hashed: string) => {
  const source = "COMPARE PASSWORD UTIL FUNC";

  logger.info(`Comparing password`, { source, plain, hashed });

  const isMatch = await argon2.verify(hashed, plain);

  logger.info(`Password comparison completed`, {
    source,
    isMatch,
  });

  return isMatch;
};

/* const saltRounds = 15;

export const bcryptHashPassword = (password: string) => {
  const source = "HASH PASSWORD UTIL FUNC";
  logger.info(`Hashing password`, { source });

  const salt = genSaltSync(saltRounds);
  const hashedPassword = hashSync(password, salt);

  logger.info(`Password hashing completed`, { source });

  return hashedPassword;
};

export const bcryptComparePassword = (plain: string, hashed: string) => {
  const source = "COMPARE PASSWORD UTIL FUNC";
  logger.info(`Comparing password`, { source, plain, hashed });

  const isMatch = compareSync(plain, hashed);

  logger.info(`Password comparison completed`, {
    source,
    isMatch
  });

  return isMatch;
};
 */
/* const argon2 = require('argon2');

const argon2Options = {
    type: argon2.argon2id, // Use Argon2id for balanced security
    memoryCost: 2 ** 16,   // 64 MiB of memory
    timeCost: 3,           // 3 iterations
    parallelism: 1,        // Single thread
    hashLength: 32,        // 32-byte hash
    saltLength: 16         // 16-byte salt (optional, default)
};

require('dotenv').config();
const argon2Options = {
    type: argon2.argon2id,
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 2 ** 16,
    timeCost: parseInt(process.env.ARGON2_TIME_COST) || 3,
    parallelism: 1,
    hashLength: 32
}; */
