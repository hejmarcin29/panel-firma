import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2'

const memoryCost = parseInt(process.env.ARGON2_MEMORY_COST || '', 10) || 1 << 16 // 65536 KiB
const timeCost = parseInt(process.env.ARGON2_TIME_COST || '', 10) || 3
const parallelism = parseInt(process.env.ARGON2_PARALLELISM || '', 10) || 1

export async function hash(password: string) {
  return argonHash(password, {
    memoryCost,
    timeCost,
    parallelism,
  })
}

export async function verify(hashed: string, password: string) {
  return argonVerify(hashed, password)
}
