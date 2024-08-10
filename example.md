

```js

const [userData, emitUserData, fetchUser] = usePubSub<UserData>('USER_DATA');

```



```js

registerPubSub('USER_DATA', {
  callback: async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  transform: (data: any) => ({
    id: data.id,
    name: data.name,
    email: data.email
  }),
  defaultValue: { id: '', name: '', email: '' }
});

```