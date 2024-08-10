# pubsub-emitter-io

`pubsub-emitter-io` is a lightweight and flexible pub/sub (publish-subscribe) library for React applications. It provides a simple way to manage state and handle asynchronous operations across your application.

## Installation

```bash
npm install pubsub-emitter-io
```
or
```bash
yarn add pubsub-emitter-io
```

## Features

- Simple and intuitive API
- Supports both synchronous and asynchronous operations
- Provides hooks for easy integration with React components
- Allows for custom data transformations
- Includes TypeScript support
- Flexible hook return values for optimized usage

## Basic Usage

This library provides three main ways to use the pub/sub functionality:

1. Direct use of `pubSubStore`
2. `useAsyncPubSub` hook for async operations
3. `usePubSub` hook for flexible synchronous and asynchronous operations

### Example 1: Using pubSubStore Directly

```jsx
import { pubSubStore } from "pubsub-emitter-io";
import { useEffect, useState } from "react";

const ON_ACTION_GET_USER_PROFILE = "ON_ACTION_GET_USER_PROFILE";

export function UserProfileComponent() {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const listener = (user) => {
      setUserProfile(user);
    };
    pubSubStore.on(ON_ACTION_GET_USER_PROFILE, listener);
    return () => {
      pubSubStore.off(ON_ACTION_GET_USER_PROFILE, listener);
    };
  }, []);

  const emitUserProfile = () => {
    pubSubStore.emit(ON_ACTION_GET_USER_PROFILE, {
      name: "John",
      lastName: "Doe",
      credits: (userProfile?.credits || 0) + 1
    });
  };

  return (
    <div>
      <h2>User Profile</h2>
      <button onClick={emitUserProfile}>Get User Profile</button>
      {userProfile && (
        <pre>{JSON.stringify(userProfile, null, 2)}</pre>
      )}
    </div>
  );
}
```

### Example 2: Using useAsyncPubSub Hook

```jsx
import { useAsyncPubSub } from "pubsub-emitter-io";
import { useEffect } from "react";

const ON_ACTION_GET_USER_PROFILE = "ON_ACTION_GET_USER_PROFILE";

export function UserProfileComponent() {
  const [user, fetchAccount] = useAsyncPubSub(ON_ACTION_GET_USER_PROFILE, {
    defaultValue: { loading: false, error: false, data: null },
    fetchCallback: async () => {
      // Simulate an async operation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { id: 1, name: "John Doe", email: "john@example.com" };
    },
  });

  const { loading = false, error = false, data } = user;

  useEffect(() => {
    fetchAccount();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Account Data</h2>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={fetchAccount}>Refresh Account Data</button>
    </div>
  );
}
```

### Example 3: Using Flexible usePubSub Hook

```jsx
import { usePubSub, registerPubSub } from "pubsub-emitter-io";
import { useEffect } from "react";

const USER_PROFILE = "USER_PROFILE";

// Register the channel with custom fetch and transform
registerPubSub(USER_PROFILE, {
  onFetch: async (userId) => {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    return response.json();
  },
  onResponseTransform: (data) => ({
    id: data.id,
    name: data.name,
    email: data.email,
  }),
  defaultValue: { id: 0, name: "", email: "" },
});

export function UserProfileComponent({ userId }) {
  // Use all features: data, emitter, and fetcher
  const [user, emitUser, fetchUser] = usePubSub(USER_PROFILE);

  useEffect(() => {
    if (fetchUser) fetchUser(userId);
  }, [userId]);

  const updateEmail = (newEmail) => {
    emitUser({ ...user, email: newEmail });
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>User Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <button onClick={() => updateEmail("newemail@example.com")}>
        Update Email
      </button>
    </div>
  );
}

// Component that only needs to display data
export function UserDisplay() {
  const [user] = usePubSub(USER_PROFILE, ["response"]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h3>User Info</h3>
      <p>Name: {user.name}</p>
    </div>
  );
}

// Component that only needs to fetch data
export function FetchUserButton({ userId }) {
  const [fetchUser] = usePubSub(USER_PROFILE, ["fetcher"]);

  const handleClick = () => {
    if (fetchUser) fetchUser(userId);
  };

  return <button onClick={handleClick}>Fetch User</button>;
}
```

## API Reference

### pubSubStore
- `on(channel: string, listener: Function)`: Subscribe to a channel
- `off(channel: string, listener: Function)`: Unsubscribe from a channel
- `emit(channel: string, data: any)`: Emit data to a channel

### useAsyncPubSub
```typescript
useAsyncPubSub<T, A extends any[]>(
  channel: string,
  config: {
    defaultValue: T;
    fetchCallback?: (...args: A) => Promise<T>;
    responseModifier?: (response: any) => T;
  },
  isSync?: boolean
): [T, (...args: A) => Promise<T | null>, (overrideOrNewData: Partial<T> | T) => T]
```

### usePubSub
```typescript
usePubSub<T, A extends any[]>(
  channel: string,
  selector?: Array<'response' | 'emitter' | 'fetcher'>
): [T | undefined, (data: T) => void, ((...args: A) => Promise<T | null>) | undefined]
```

### registerPubSub
```typescript
registerPubSub<T, A extends any[]>(
  channel: string,
  config: {
    onFetch?: (...args: A) => Promise<T> | T;
    onResponseTransform?: (response: any) => T;
    defaultValue?: T;
  }
): void
```

## Advanced Usage

### Custom Data Transformations

You can use the `registerPubSub` function to set up custom data transformations:

```typescript
import { registerPubSub } from "pubsub-emitter-io";

registerPubSub("USER_DATA", {
  onFetch: async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  onResponseTransform: (data: any) => ({
    id: data.id,
    name: data.name,
    email: data.email
  }),
  defaultValue: { id: "", name: "", email: "" }
});
```

### Using with TypeScript

The library is written in TypeScript and provides type definitions out of the box. Here's an example of how to use it with TypeScript:

```typescript
import { usePubSub } from "pubsub-emitter-io";

interface UserData {
  id: string;
  name: string;
  email: string;
}

function UserComponent() {
  const [userData, emitUserData, fetchUserData] = usePubSub<UserData, [string]>("USER_DATA");
  // ... rest of the component
}
```

### Optimizing Component Renders

You can optimize your components by only selecting the parts of the `usePubSub` hook that you need:

```typescript
function UserDisplay() {
  // Only get the response, don't need emitter or fetcher
  const [user] = usePubSub<UserData>("USER_DATA", ["response"]);
  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}

function UserUpdater() {
  // Only get the emitter, don't need response or fetcher
  const [, emitUser] = usePubSub<UserData>("USER_DATA", ["emitter"]);
  const updateUser = () => {
    emitUser({ id: "1", name: "John Doe", email: "john@example.com" });
  };
  return <button onClick={updateUser}>Update User</button>;
}

function UserFetcher({ userId }: { userId: string }) {
  // Only get the fetcher, don't need response or emitter
  const [, , fetchUser] = usePubSub<UserData, [string]>("USER_DATA", ["fetcher"]);
  const handleFetch = () => {
    if (fetchUser) fetchUser(userId);
  };
  return <button onClick={handleFetch}>Fetch User</button>;
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.