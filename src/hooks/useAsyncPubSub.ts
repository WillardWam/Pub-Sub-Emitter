import { useState, useEffect } from 'react';
import { pubSubStore, Channel } from '../PubSubStore';

interface Config<T, A extends any[]> {
  defaultValue: T;
  fetchCallback?: (...args: A) => Promise<T> | T;
  transformResponse?: (response: any) => T;
}

type ReFetcher<T, A extends any[]> = (...args: A) => Promise<T | null>;
type UpdateData<T> = (overrideOrNewData: Partial<T> | T) => T;

export function useAsyncPubSub<T, A extends any[], IsSync extends boolean = false>(
  channel: Channel,
  config: Config<T, A> = { defaultValue: {} as T },
  isSync: IsSync = false as IsSync
): IsSync extends true ? [ReFetcher<T, A>, UpdateData<T>] : [T, ReFetcher<T, A>, UpdateData<T>] {
  const [data, setData] = useState<T>(pubSubStore.store.get(channel) || config.defaultValue);

  useEffect(() => {
    const listener = (newData: T) => {
      setData(newData);
    };

    const unsubscribe = pubSubStore.on<T>(channel, listener);

    return () => {
      unsubscribe();
    };
  }, [channel]);

  const reFetcher: ReFetcher<T, A> = (...args) => {

    if (!config.fetchCallback) return Promise.resolve(pubSubStore.getData<T>(channel));
    if (pubSubStore.isTestEnvironment) return Promise.resolve(pubSubStore.getData<T>(channel));
  

    return new Promise((resolve, reject) => {
      // Type guard to ensure fetchCallback is defined
      if (config.fetchCallback) {
        pubSubStore.executeWithStateAsync(
          channel,
          config.fetchCallback,
          resolve,
          reject,
          ...args
        );
      } else {
        reject(new Error('fetchCallback is not defined'));
      }
    });
  };

  const updateData: UpdateData<T> = (overrideOrNewData) => {
    pubSubStore.addData<T>(channel, overrideOrNewData as T);
    return pubSubStore.getData<T>(channel);
  };

  return (isSync ? [reFetcher, updateData] : [data, reFetcher, updateData]) as any;
}

export default useAsyncPubSub;