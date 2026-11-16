import type { Repositories } from '../repositories/types'

/** service が受け取る依存。Deps の一部 */
export type ServiceDeps = { repos: Repositories; clock: () => Date }
