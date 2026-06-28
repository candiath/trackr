import { hashPassword } from '../src/lib/auth';

/**
 * Generates the value for AUTH_PASSWORD_HASH.
 *
 *   npm run auth:hash -- "your password"
 *
 * Copy the printed line into apps/api/.env. The plaintext password never touches
 * the repo or the database — only this scrypt hash is stored.
 */
const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run auth:hash -- "<password>"');
  process.exit(1);
}

hashPassword(password).then((hash) => {
  console.log(`AUTH_PASSWORD_HASH="${hash}"`);
});
