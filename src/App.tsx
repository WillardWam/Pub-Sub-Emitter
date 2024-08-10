import React, { useEffect } from 'react'
import './App.css'
import usePubSub from './hooks/usePubSub';
import { pubSubStore } from './PubSubStore';

const COUNTER_EVENT = 'COUNTER_EVENT';
type CounterEvent = { count: number };

function App() {
  // Initialize the counter data structure
  const initialCounter = pubSubStore.initializeData<CounterEvent>(COUNTER_EVENT, { count: 0 });
  
  const [state, emitEvent] = usePubSub<CounterEvent>(COUNTER_EVENT);

  const incrementCounter = () => {
    emitEvent({ count: (state?.count ?? 0) + 1 });
  };

  return (
    <div className="App">
      <h1>Event Emitter Counter</h1>
      <div>
        <span>Count: {state?.count ?? initialCounter.count}</span>
      </div>
      <div>
        <button onClick={incrementCounter}>Increment</button>
      </div>
    </div>
  )
}

export default App