import type {Constructor, FactoryDefinition, Token, ValueDefinition} from "../types.js";
import type {Container} from "../container.js";
import {DefinitionBuilder} from "../builder/definition.js";
import {ClassDefinitionBuilder} from "../builder/class.js";


export function create<T>(constructor: Constructor<T>) {
  return new ClassDefinitionBuilder(constructor);
}

export function factory<T>(fn: FactoryDefinition<T>) {
  return new DefinitionBuilder(fn);
}

export function value<T>(val: T): ValueDefinition<T> {
  return val;
}

export function get(token: Token) {
  return (container: Container) => container.get(token);
}

export function singleton<T>(factory: FactoryDefinition<T>) {
  return new DefinitionBuilder(factory).singleton().build();
}