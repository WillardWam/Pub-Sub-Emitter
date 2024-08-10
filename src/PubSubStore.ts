export type Channel = string;

export class PubSubStore {
  private static instance: PubSubStore;
  private events: Record<string, Array<(data: any) => void>> = {};
  public store: Map<string, any> = new Map();
  public isTestEnvironment: boolean = false;
  private callbacks: Map<Channel, (...args: any[]) => Promise<any> | any> = new Map();
  private transforms: Map<Channel, (response: any) => any> = new Map();

  constructor() {
    if (PubSubStore.instance) {
      return PubSubStore.instance;
    }
    this.events = {};
    this.store = new Map();
    this.callbacks = new Map();
    this.transforms = new Map();
    
    PubSubStore.instance = this;
  }

  on<T>(channel: Channel, listener: (data: T) => void): () => void {
    if (!this.events[channel]) {
      this.events[channel] = [];
    }
    this.events[channel].push(listener);
    if (this.store.has(channel)) {
      listener(this.store.get(channel));
    }
    return () => {
      this.off(channel, listener);
    };
  }

  off<T>(channel: Channel, listener: (data: T) => void): void {
    if (!this.events[channel]) return;
    this.events[channel] = this.events[channel].filter(l => l !== listener);
  }

  emit<T>(channel: Channel, data: Partial<T>, cache = true): void {
    if (cache) {
      const prev = this.store.get(channel) || {};
      const newData = { ...prev, ...data };
      if (JSON.stringify(newData) === JSON.stringify(prev)) {
        return;
      }
      this.store.set(channel, newData);
    }
    if (!this.events[channel]) return;
    this.events[channel].forEach(listener => listener(this.store.get(channel)));
  }

  clear(channel: Channel): void {
    if (this.store.has(channel)) {
      this.store.delete(channel);
    }
  }

  setCallback<T, A extends any[]>(channel: Channel, callback: (...args: A) => Promise<T> | T): void {
    this.callbacks.set(channel, callback);
  }

  
  getCallback<T, A extends any[]>(channel: Channel): ((...args: A) => Promise<T> | T) | undefined {
    const callback = this.callbacks.get(channel) as ((...args: A) => Promise<T> | T) | undefined;

    if (this.isTestEnvironment && this.store.has(channel)) {
      return (...args: A): Promise<T> => {
        const existingData = this.store.get(channel);
        return Promise.resolve(existingData as T);
      };
    }
    
    return callback;
  }


  setTransform<T>(channel: Channel, transform: (response: any) => T): void {
    this.transforms.set(channel, transform);
  }

  getTransform<T>(channel: Channel): ((response: any) => T) | undefined {
    return this.transforms.get(channel) as ((response: any) => T) | undefined;
  }

  executeWithStateAsync<T, A extends any[]>(
    channel: Channel,
    callback: (...args: A) => Promise<any> | any,
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void,
    ...args: A
  ): void {
    // Check if we're in a test environment and if there's existing data
    if (this.isTestEnvironment && this.store.has(channel)) {
      const existingData = this.store.get(channel);
      resolve(existingData as T);
      return;
    }

    this.addData(channel, { loading: true, error: false, hasLoaded: false });

    const transform = this.getTransform<T>(channel);

    const processResponse = (data: any): T => {
      const processedData = transform ? transform(data) : data;
      return { loading: false, error: false, hasLoaded: true, ...processedData } as T;
    };

    const handleError = (error: Error): T => ({
      loading: false,
      error: error.message || 'An error occurred',
      hasLoaded: true,
    } as T);

    try {
      const result = callback(...args);
      if (result instanceof Promise) {
        result
          .then(data => {
            const processedData: any = processResponse(data);
            this.addData(channel, processedData);
            resolve(processedData);
          })
          .catch(error => {
            const errorData: any = handleError(error);
            this.addData(channel, errorData);
            resolve(errorData);
          });
      } else {
        const processedData: any = processResponse(result);
        this.addData(channel, processedData);
        resolve(processedData);
      }
    } catch (error) {
      const errorData: any = handleError(error as Error);
      this.addData(channel, errorData);
      resolve(errorData);
    }
  }


  addData<T>(channel: Channel, data: Partial<T>): void {
    if (!this.store.has(channel)) {
      this.store.set(channel, {});
    }
    const prevData = this.store.get(channel);
    const newData = { ...prevData, ...data };
    this.store.set(channel, newData);
    if (this.events[channel]) {
      this.events[channel].forEach(listener => listener(newData));
    }
  }

  getData<T>(channel: Channel): T {
    return (this.store.get(channel) || {}) as T;
  }

  initializeData<T>(channel: Channel, defaultValue: T): T {
    if (!this.store.has(channel)) {
      this.store.set(channel, defaultValue);
    }
    return this.getData<T>(channel);
  }
}

export const pubSubStore = new PubSubStore();

if (typeof window !== 'undefined') {
  (window as any).pubSubStore = (window as any).pubSubStore || pubSubStore;
}

declare global {
  interface Window {
    eventE: PubSubStore;
  }
}