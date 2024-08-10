import { useEffect, useState, useCallback } from 'react';
import { pubSubStore, Channel } from '../PubSubStore';

type PubSubReturnType<T, A extends any[] = any[]> = [
  T | undefined,
  (data: T) => void,
  ((...args: A) => Promise<T | null>) | undefined
];

type ReturnKeys = 'response' | 'emitter' | 'fetcher';

export function usePubSub<T, A extends any[] = any[]>(
  channel: Channel,
  selector: ReturnKeys[] = ['response', 'emitter', 'fetcher'],
  autoFetchArgs?: A
): PubSubReturnType<T, A> {
  const [response, setResponse] = useState<T | undefined>(pubSubStore.getData<T>(channel));

  useEffect(() => {
    const eventHandler = (data: T) => {
      setResponse(data);
    };

    pubSubStore.on<T>(channel, eventHandler);

    return () => {
      pubSubStore.off<T>(channel, eventHandler);
    };
  }, [channel]);

  const emitter = useCallback(
    (data: T) => {
      pubSubStore.emit<T>(channel, data);
    },
    [channel]
  );

  const fetcher = pubSubStore.getCallback<T, A>(channel);

  const wrappedFetchCallback = useCallback(
    (...args: A): Promise<T | null> => {
      if (!fetcher) return Promise.resolve(null);

      const result = fetcher(...args);
      const resultPromise = result instanceof Promise ? result : Promise.resolve(result);

      return resultPromise.then((data) => {
        if (data !== null) {
          emitter(data);
        }
        return data;
      });
    },
    [fetcher, emitter]
  );

  useEffect(() => {
    if (autoFetchArgs) {
      wrappedFetchCallback(...autoFetchArgs);
    }
  }, [wrappedFetchCallback, autoFetchArgs]);

  const returnValue: PubSubReturnType<T, A> = [
    selector.includes('response') ? response : undefined,
    selector.includes('emitter') ? emitter : (() => {}),
    selector.includes('fetcher') ? wrappedFetchCallback : undefined
  ];

  return returnValue;
}

export default usePubSub;