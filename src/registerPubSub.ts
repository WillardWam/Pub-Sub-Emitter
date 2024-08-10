import { pubSubStore, Channel } from './PubSubStore';

interface RegisterConfig<T, A extends any[]> {
  onFetch?: (...args: A) => Promise<T> | T;
  onResponseTransform?: (response: any) => T;
  defaultValue?: T;
}

export function registerPubSub<T, A extends any[]>(
  channel: Channel,
  config: RegisterConfig<T, A>
): void {
  
  if (config.onFetch) {
    pubSubStore.setCallback(channel, config.onFetch);
  }

  if (config.onResponseTransform) {
    pubSubStore.setTransform(channel, config.onResponseTransform);
  }

  if (config.defaultValue !== undefined) {
    pubSubStore.initializeData(channel, config.defaultValue);
  }

  // Optional: You can add logging or validation here
  // console.log(`Registered pub/sub for channel: ${channel}`);

  // if (!config.callback && !config.transform && config.defaultValue === undefined) {
  //   console.warn(`No configuration provided for channel: ${channel}`);
  // }
}