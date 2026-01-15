class BaseError extends Error {meta: any
    constructor(message: string, meta?: any) {
        super(message)
        this.name = this.constructor.name
        this.meta = meta
    }
}

export class InvalidTokenType extends BaseError {
    constructor(message: string, meta?: any) {
        super(message, meta)
    }
}

export class DefinitionNotFoundException extends BaseError {
    constructor(message: string, meta?: any) {
        super(message, meta)
    }
}

export class ContainerCompiledError extends BaseError {
    constructor(message: string, meta?: any) {
        super(message, meta);
    }
}

export class CircularDependencyError extends BaseError {
    constructor(message: string, meta?: any) {
        super(message, meta);
    }
}