import type {Constructor, Definition, DefinitionObject, FactoryDefinition, Token} from "../types.js";
import {TokenRegistry} from "../registry/token.js";
import {ContainerCompiledError} from "../error.js";
import {Container} from "../container.js";

export class ContainerBuilder {
  private definitions = new Map<symbol, DefinitionObject<any>>()
  private registry = new TokenRegistry()
  private compiled = false

  set<T>(token: Token<T>, definition: Definition<T>): this {
    if (this.compiled) {
      throw new ContainerCompiledError("Cannot modify compiled container")
    }

    const normalizeToken = this.registry.normalize(token)
    const normalizeDefinition = this.normalizeDefinition(definition)

    this.definitions.set(normalizeToken, normalizeDefinition)

    return this
  }

  /**
   * Build and return the compiled container.
   * Once built, the builder becomes immutable.
   */
  build(): Container {
    this.compiled = true
    return new Container(this.definitions, this.registry)
  }

  private normalizeDefinition<T>(definition: Definition<T>): DefinitionObject<T> {
    // If it's already a definition object, return it
    if (typeof definition === 'object' && definition !== null && 'factory' in definition) {
      return definition as DefinitionObject<T>;
    }

    // If it's a function (factory or class)
    if (typeof definition === 'function') {
      // Check if it's a constructor
      if (definition.prototype && definition.prototype.constructor === definition) {
        // It's a class - autowire it
        return {
          factory: autowire(definition as Constructor<T>),
          scope: 'transient'
        };
      }
      // It's a factory function
      return {
        factory: definition as FactoryDefinition<T>,
        scope: 'transient'
      };
    }

    // It's a value
    return {
      factory: () => definition as T,
      scope: 'singleton' // Values are always singleton
    };
  }
}

/**
 * Creates a factory function that autowires a class constructor.
 * Attempts to resolve dependencies using reflect-metadata if available.
 * Falls back to no-args instantiation if metadata is not present.
 */
function autowire<T>(constructor: Constructor<T>): FactoryDefinition<T> {
  return (container: Container) => {
    // Check for reflect-metadata decorators
    const metadata = getConstructorMetadata(constructor);

    if (metadata && metadata.length > 0) {
      const resolvedDeps = metadata.map(token => container.get(token));
      return new constructor(...resolvedDeps);
    }

    // No metadata found, create with no args
    return new constructor();
  };
}

/**
 * Metadata key for storing constructor parameter types.
 * Compatible with TypeScript's emitDecoratorMetadata.
 */
const DESIGN_PARAM_TYPES = 'design:paramtypes';

/**
 * Get constructor parameter metadata if available.
 * Requires reflect-metadata and decorators on the class.
 */
function getConstructorMetadata<T>(constructor: Constructor<T>): Token[] | undefined {
  // Check if Reflect.getMetadata is available (from reflect-metadata package)
  if (typeof Reflect !== 'undefined' && 'getMetadata' in Reflect) {
    const metadata = (Reflect as any).getMetadata(DESIGN_PARAM_TYPES, constructor);
    return metadata as Token[] | undefined;
  }

  return undefined;
}