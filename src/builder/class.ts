import type {Constructor, DefinitionObject, Token} from "../types.js";
import type {Container} from "../container.js";

/**
 * Builder for class-based definitions with dependency injection.
 * Supports both manual injection and autowiring.
 *
 * @example
 * // Manual injection
 * new ClassDefinitionBuilder(Database)
 *   .inject('db.config', LoggerService)
 *   .singleton()
 *   .build()
 *
 * @example
 * // Autowiring (requires metadata)
 * new ClassDefinitionBuilder(UserService)
 *   .autowire()
 *   .singleton()
 *   .build()
 */
export class ClassDefinitionBuilder<T> {
  private readonly definition: DefinitionObject<T>
  private dependencies: Token[] = []
  private useAutowire = false

  constructor(private readonly constructor: Constructor<T>) {
    // Default factory that creates instance with no dependencies
    this.definition = {
      factory: (container: Container) => new this.constructor(),
      scope: 'transient'
    }
  }

  /**
   * Specify dependencies to inject into the constructor.
   * Dependencies are resolved in order and passed as constructor arguments.
   *
   * @example
   * builder.inject('config', Database, LoggerService)
   * // Results in: new MyClass(container.get('config'), container.get(Database), container.get(LoggerService))
   */
  inject(...dependencies: Token[]): this {
    this.dependencies = dependencies
    this.useAutowire = false

    // Update factory to resolve and inject dependencies
    this.definition.factory = (container: Container) => {
      const resolvedDeps = dependencies.map(dep => container.get(dep))
      return new this.constructor(...resolvedDeps)
    }

    return this
  }

  /**
   * Enable autowiring for this class.
   * Requires decorator metadata (experimental feature).
   * Falls back to no-args constructor if metadata is not available.
   */
  autowire(): this {
    this.useAutowire = true

    this.definition.factory = (container: Container) => {
      // Check for reflect-metadata decorators
      const metadata = getConstructorMetadata(this.constructor)

      if (metadata && metadata.length > 0) {
        const resolvedDeps = metadata.map(token => container.get(token))
        return new this.constructor(...resolvedDeps)
      }

      // No metadata found, create with no args
      return new this.constructor()
    }

    return this
  }

  /**
   * Set scope to singleton (one instance shared across all requests)
   */
  singleton(): this {
    this.definition.scope = 'singleton'
    return this
  }

  /**
   * Set scope to transient (new instance on every request)
   */
  transient(): this {
    this.definition.scope = 'transient'
    return this
  }

  /**
   * Enable lazy initialization (instance created on first property access)
   */
  lazy(): this {
    this.definition.lazy = true
    return this
  }

  /**
   * Add tags for grouping and batch retrieval
   */
  tag(...tags: string[]): this {
    this.definition.tags = [...(this.definition.tags || []), ...tags]
    return this
  }

  /**
   * Register cleanup callback invoked when instance is destroyed
   */
  onDestroy(callback: (instance: T) => void | Promise<void>): this {
    this.definition.onDestroy = callback
    return this
  }

  /**
   * Build and return the final definition object
   */
  build(): DefinitionObject<T> {
    return this.definition
  }
}

/**
 * Metadata key for storing constructor parameter types.
 * Compatible with TypeScript's emitDecoratorMetadata.
 */
const DESIGN_PARAM_TYPES = 'design:paramtypes'

/**
 * Get constructor parameter metadata if available.
 * Requires reflect-metadata and decorators on the class.
 */
function getConstructorMetadata<T>(constructor: Constructor<T>): Token[] | undefined {
  // Check if Reflect.getMetadata is available (from reflect-metadata package)
  if (typeof Reflect !== 'undefined' && 'getMetadata' in Reflect) {
    const metadata = (Reflect as any).getMetadata(DESIGN_PARAM_TYPES, constructor)
    return metadata as Token[] | undefined
  }

  return undefined
}
