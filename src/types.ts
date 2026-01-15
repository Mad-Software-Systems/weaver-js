import type {Container} from "./container.js";

export type Constructor<T> = new (...args: any[]) => T
export type AbstractConstructor<T> = abstract new (...args: any[]) => T

/**
 * Token type definition.
 * A token can be anything that uniquely identifies a dependency
 * supported token types are string, symbol, Constructor and AbstractConstructor.
 */
export type Token<T = any> =
    | string                        // 'db.connection', 'config.api.url'
    | symbol                        // Symbol.for('Logger')
    | Constructor<T>                // class Database {}
    | AbstractConstructor<T>        // abstract class Repository {}

export type inferToken<T> = T extends Constructor<infer U> ? U : T

export type FactoryDefinition<T> = (container: Container) => T
export type ValueDefinition<T> = T
export type ClassDefinition<T> = Constructor<T>
export type AsyncFactoryDefinition<T> = (container: Container) => Promise<T>

export type Definition<T> =
    | FactoryDefinition<T>
    | ValueDefinition<T>
    | ClassDefinition<T>
    | AsyncFactoryDefinition<T>
    | DefinitionObject<T>

export interface DefinitionObject<T> {
    factory?: FactoryDefinition<T> | AsyncFactoryDefinition<T>
    scope?: 'singleton' | 'transient' | 'request'
    tags?: string[]
    lazy?: boolean
    onDestroy?: (instance: T) => void | Promise<void>
}