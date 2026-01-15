export class LazyProxy<T extends object> {
  private instance?: T

  constructor(private factory: () => T) {
    const self = this; // Capture LazyProxy instance context
    return new Proxy({} as T, {
      get(target, prop, receiver) {
        if (!self.instance) {
          self.instance = self.factory()
        }

        return (self.instance as any)[prop]
      }
    })
  }
}