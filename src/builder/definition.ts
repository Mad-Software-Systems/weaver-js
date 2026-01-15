import type {DefinitionObject, FactoryDefinition} from "../types.js";

export class DefinitionBuilder<T> {
  private readonly definition: DefinitionObject<T>

  constructor(factory: FactoryDefinition<T>) {
    this.definition = {
      factory,
      scope: "transient"
    }
  }

  singleton(): this {
    this.definition.scope = 'singleton'
    return this
  }

  transient(): this {
    this.definition.scope = 'transient'
    return this
  }

  lazy(): this {
    this.definition.lazy = true
    return this
  }

  tag(...tags: string[]): this {
    this.definition.tags = [...(this.definition.tags || []), ...tags]
    return this
  }

  onDestroy(callback: (instance: T) => void | Promise<void>) {
    this.definition.onDestroy = callback
    return this
  }

  build(): DefinitionObject<T> {
    return this.definition
  }
}