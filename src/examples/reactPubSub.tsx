import React, { useEffect } from "react";
import "./App.css";
import { registerPubSub, usePubSub } from "pubsub-emitter-io";

const USER_DATA_2 = "USER_DATA_2";

type CounterEvent = {
  count: number;
  userId: string;
  timestamp: number;
  action: 'increment' | 'decrement' | 'reset';
};

type FetcherArgs = [userId: string];

function App() {
  registerPubSub<CounterEvent, FetcherArgs>(USER_DATA_2, {
    onFetch: async (userId) => {
      console.log("fetcher", userId);
      
      const response = await fetch("https://jsonplaceholder.typicode.com/todos/1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      
      // Transform the fetched data into a CounterEvent
      return {
        count: data.id,
        userId: userId,
        timestamp: Date.now(),
        action: 'increment'
      };
    },
    onResponseTransform: (response: any) => {
      // If needed, transform the response here
      return response as CounterEvent;
    },
    defaultValue: {
      count: 0,
      userId: '',
      timestamp: Date.now(),
      action: 'reset'
    }
  });

  const [response, emitter, fetcher] = usePubSub<CounterEvent, FetcherArgs>(USER_DATA_2);

  const makeCall = async () => {
    if (fetcher) {
      await fetcher("user123" + Math.random());
      // No need to manually emit, as it's handled in the hook
    }
  };

  useEffect(() => {
    makeCall();
  }, []);

  return (
    <div className="App">
      <h1>Event Emitter</h1>
      <div>
        {response && (
          <p>
            Count: {response.count}, User: {response.userId}, Action: {response.action}
          </p>
        )}
      </div>
      <div>
        <button onClick={makeCall}>Fetch and Emit</button>
      </div>
    </div>
  );
}

export default App;