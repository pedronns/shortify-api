import { randomBytes } from 'crypto'

const configuredSecret = process.env.JWT_SECRET?.trim()

if (!configuredSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured in production')
}

export const jwtSecret = configuredSecret ?? randomBytes(32).toString('hex')
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'