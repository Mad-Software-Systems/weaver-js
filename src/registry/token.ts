import type {Token} from "./../types.js";
import {InvalidTokenType} from "./../error.js";

export class TokenRegistry {
    private tokens = new Map<any, symbol>()

    normalize(token: Token): symbol {
        const tokenType = typeof token

        if (tokenType !== 'symbol' && tokenType !== 'string' && tokenType !== 'function') {
            throw new InvalidTokenType(`Invalid token type '${tokenType}'`)
        }

        if (typeof token === 'string') {
            if (!this.tokens.has(token)) {
                this.tokens.set(token, Symbol.for(token))
            }

            return this.tokens.get(token)!
        }

        if (typeof token === 'function') {
            if (!token.prototype) {
                throw new InvalidTokenType(`${token} is not a constructor - missing prototype`)
            }

            if (!this.tokens.has(token)) {
                const name = token.name || 'Anonymous'
                this.tokens.set(token, Symbol.for(`class:${name}`))
            }

            return this.tokens.get(token)!
        }

        return token
    }
}