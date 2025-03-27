
# Ticatec Redis Client

This is a lightweight wrapper around ioredis, providing convenient methods for interacting with a Redis server. It also includes support for a mock Redis instance for testing purposes.

## Installation

```bash
npm install @ticatec/redis-client ioredis ioredis-mock @ticatec/singleton-log4js
```

## Usage

### Initialization

First, you need to initialize the Redis client with your Redis server configuration.

```typescript
import RedisClient from '@ticatec/redis-client';

async function main() {
  const redisConfig = {
    host: '127.0.0.1',
    port: 6379,
    // ... other ioredis options
  };

  await RedisClient.init(redisConfig);

  const redisClient = RedisClient.getInstance().client;
  // Now you can use the redisClient instance
}

main();

//Or use MockRedis for testing
async function test(){
    await RedisClient.init(null); //init with null will use mock redis
    const redisClient = RedisClient.getInstance().client;
    await redisClient.set('testKey', 'testValue');
    const value = await redisClient.get('testKey');
    console.log(value); // testValue
}

test();
```

### Methods

#### `set(key: string, value: any, seconds: number = 0): Promise<void>`

Sets a key-value pair in Redis. If the value is an object, it will be stringified as JSON.

-   `key`: The key to set.
-   `value`: The value to set.
-   `seconds`: The expiration time in seconds (optional, defaults to 0 for no expiration).

```typescript
const redisClient = RedisClient.getInstance().client;
await RedisClient.getInstance().set('myKey', 'myValue', 60);
await RedisClient.getInstance().set('myObject', { name: 'example' }, 120);
```

#### `get(key: string): Promise<string | Buffer | number>`

Gets the value for a given key.

```typescript
const value = await RedisClient.getInstance().get('myKey');
console.log(value);
```

#### `getObject(key: string): Promise<any>`

Gets the value for a given key and parses it as a JSON object.

```typescript
const obj = await RedisClient.getInstance().getObject('myObject');
console.log(obj);
```

#### `del(key: string): Promise<void>`

Deletes a key.

```typescript
await RedisClient.getInstance().del('myKey');
```

#### `expiry(key: string, seconds: number): Promise<void>`

Sets the expiration time for a key.

```typescript
await RedisClient.getInstance().expiry('myKey', 30);
```

#### `hset(key: string, data: any, seconds: number = 0): Promise<void>`

Sets a hash field.

```typescript
await RedisClient.getInstance().hset('myHash', { field1: 'value1', field2: 'value2' }, 60);
```

#### `hget(key: string, name: string): Promise<void>`

Gets a hash field.

```typescript
await RedisClient.getInstance().hget('myHash', 'field1');
```

#### `hgetall(key: string): Promise<void>`

Gets all hash fields.

```typescript
await RedisClient.getInstance().hgetall('myHash');
```

#### `hsetnx(key: string, name: string, value: string | Buffer | number): Promise<void>`

Sets a hash field if it does not exist.

```typescript
await RedisClient.getInstance().hsetnx('myHash', 'field3', 'value3');
```

#### `sadd(key: string, arr: Array<string | Buffer | number>, seconds: number): Promise<void>`

Adds members to a set.

```typescript
await RedisClient.getInstance().sadd('mySet', ['member1', 'member2'], 60);
```

#### `scard(key: string): Promise<number>`

Gets the cardinality of a set.

```typescript
const cardinality = await RedisClient.getInstance().scard('mySet');
console.log(cardinality);
```

#### `isSetMember(key: string, value: any): Promise<boolean>`

Checks if a value is a member of a set.

```typescript
const isMember = await RedisClient.getInstance().isSetMember('mySet', 'member1');
console.log(isMember);
```

#### `rpush(key: string, data: any, seconds: number = 0): Promise<void>`

Appends a value to a list.

```typescript
await RedisClient.getInstance().rpush('myList', 'item1', 60);
await RedisClient.getInstance().rpush('myList', { name: 'item2' }, 120);
```

#### `lrange(key: string, start: number, end: number): Promise<void>`

Gets a range of elements from a list.

```typescript
await RedisClient.getInstance().lrange('myList', 0, -1);
```

#### `lrangeObject(key: string, start: number, end: number): Promise<Array<any>>`

Gets a range of elements from a list and parses JSON elements.

```typescript
const list = await RedisClient.getInstance().lrangeObject('myList', 0, -1);
console.log(list);
```

#### `llen(key: string): Promise<void>`

Gets the length of a list.

```typescript
await RedisClient.getInstance().llen('myList');
```

#### `lpop(key: string): Promise<string>`

Removes and returns the first element of a list.

```typescript
const firstItem = await RedisClient.getInstance().lpop('myList');
console.log(firstItem);
```


## Contribution

Contributions are welcome! Please submit issues and pull requests.

## License

Copyright © 2023 Ticatec. All rights reserved.

This library is released under the MIT license. For details, see the [LICENSE](LICENSE) file.

## Contact

huili.f@gmail.com

https://github.com/ticatec/redis-client

