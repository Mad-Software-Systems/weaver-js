import {CircularDependencyError} from "../error.js";

/**
 * Detection system for circular dependencies.
 * It enables the users with circular dependency protection out of the box
 */
export class CircularDependencyDetector {
  private resolving = new Set<symbol>()

  beginResolve(token: symbol): void {
    if (this.resolving.has(token)) {
      const chain = Array.from(this.resolving).map(t => t.toString()).join(' -> ')
      throw new CircularDependencyError(`Circular dependency detected: ${chain} -> ${token.toString()}`)
    }
    this.resolving.add(token)
  }

  endResolve(token: symbol): void {
    this.resolving.delete(token)
  }
}