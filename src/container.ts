import type {DefinitionObject, Token} from "./types.js";
import type {TokenRegistry} from "./registry/token.js";
import {DefinitionNotFoundException} from "./error.js";
import {CircularDependencyDetector} from "./helper/circularDetection.js";
import {LazyProxy} from "./helper/lazyLoading.js";

export class Container {
    private instances = new Map<symbol, any>()
    private definitions = new Map<symbol, DefinitionObject<any>>()
    private registry: TokenRegistry
    private detector: CircularDependencyDetector
    private parent?: Container

    constructor(definitions: Map<symbol, DefinitionObject<any>>, registry: TokenRegistry) {
        this.definitions = definitions;
        this.registry = registry;
        this.detector = new CircularDependencyDetector();
    }

    get<T>(token: Token<T>): T {
        const normalizedToken = this.registry.normalize(token);
        let definition = this.definitions.get(normalizedToken);

        // Fallback to parent container if definition not found
        if (!definition && this.parent) {
            return this.parent.get(token);
        }

        if (!definition) {
            throw new DefinitionNotFoundException(`No definition found for ${String(token)}`);
        }

        // Check if factory exists
        if (!definition.factory) {
            throw new DefinitionNotFoundException(`No factory defined for ${String(token)}`);
        }

        if (definition.lazy) {
            return new LazyProxy(() => definition.factory!(this)) as T
        }

        if (definition.scope === 'singleton' && this.instances.has(normalizedToken)) {
            return this.instances.get(normalizedToken) as T;
        }

        // Circular dependency detection
        this.detector.beginResolve(normalizedToken);

        try {
            const instance = definition.factory(this)

            if (definition.scope === 'singleton') {
                this.instances.set(normalizedToken, instance);
            }

            return instance as T;
        } finally {
            this.detector.endResolve(normalizedToken);
        }
    }

    // Type-safe has check
    has(token: Token): boolean {
        const normalizedToken = this.registry.normalize(token);
        return this.definitions.has(normalizedToken);
    }

    // Get multiple instances by tag
    getTagged<T = any>(tag: string): T[] {
        const instances: T[] = [];

        for (const [token, definition] of this.definitions.entries()) {
            if (definition.tags?.includes(tag)) {
                instances.push(this.get(token as any));
            }
        }

        return instances;
    }

    createScope(): Container {
        const child = new Container(this.definitions, this.registry)
        child.parent = this
        return child
    }
}