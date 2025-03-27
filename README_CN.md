# Ticatec Redis Client

这是一个围绕 ioredis 的轻量级封装器，提供用于与 Redis 服务器交互的便捷方法。它还包括用于测试目的的模拟 Redis 实例支持。

## 安装

```bash
npm install @ticatec/redis-client ioredis ioredis-mock @ticatec/singleton-log4js
```

## 用法

### 初始化

首先，您需要使用您的 Redis 服务器配置初始化 Redis 客户端。

```typescript
import RedisClient from '@ticatec/redis-client';

async function main() {
  const redisConfig = {
    host: '127.0.0.1',
    port: 6379,
    // ... 其他 ioredis 选项
  };

  await RedisClient.init(redisConfig);

  const redisClient = RedisClient.getInstance().client;
  // 现在你可以使用 redisClient 实例了
}

main();

// 或者使用 MockRedis 进行测试
async function test() {
  await RedisClient.init(null); // 使用 null 初始化将使用模拟 redis
  const redisClient = RedisClient.getInstance().client;
  await redisClient.set('testKey', 'testValue');
  const value = await redisClient.get('testKey');
  console.log(value); // testValue
}

test();
```

### 方法

#### `set(key: string, value: any, seconds: number = 0): Promise<void>`

在 Redis 中设置键值对。如果值是对象，它将被字符串化为 JSON。

- `key`: 要设置的键。
- `value`: 要设置的值。
- `seconds`: 过期时间，以秒为单位（可选，默认为 0，表示永不过期）。

```typescript
const redisClient = RedisClient.getInstance().client;
await RedisClient.getInstance().set('myKey', 'myValue', 60);
await RedisClient.getInstance().set('myObject', { name: 'example' }, 120);
```

#### `get(key: string): Promise<string | Buffer | number>`

获取给定键的值。

```typescript
const value = await RedisClient.getInstance().get('myKey');
console.log(value);
```

#### `getObject(key: string): Promise<any>`

获取给定键的值并将其解析为 JSON 对象。

```typescript
const obj = await RedisClient.getInstance().getObject('myObject');
console.log(obj);
```

#### `del(key: string): Promise<void>`

删除一个键。

```typescript
await RedisClient.getInstance().del('myKey');
```

#### `expiry(key: string, seconds: number): Promise<void>`

设置键的过期时间。

```typescript
await RedisClient.getInstance().expiry('myKey', 30);
```

#### `hset(key: string, data: any, seconds: number = 0): Promise<void>`

设置哈希字段。

```typescript
await RedisClient.getInstance().hset('myHash', { field1: 'value1', field2: 'value2' }, 60);
```

#### `hget(key: string, name: string): Promise<void>`

获取哈希字段。

```typescript
await RedisClient.getInstance().hget('myHash', 'field1');
```

#### `hgetall(key: string): Promise<void>`

获取所有哈希字段。

```typescript
await RedisClient.getInstance().hgetall('myHash');
```

#### `hsetnx(key: string, name: string, value: string | Buffer | number): Promise<void>`

如果哈希字段不存在，则设置它。

```typescript
await RedisClient.getInstance().hsetnx('myHash', 'field3', 'value3');
```

#### `sadd(key: string, arr: Array<string | Buffer | number>, seconds: number): Promise<void>`

向集合中添加成员。

```typescript
await RedisClient.getInstance().sadd('mySet', ['member1', 'member2'], 60);
```

#### `scard(key: string): Promise<number>`

获取集合的基数。

```typescript
const cardinality = await RedisClient.getInstance().scard('mySet');
console.log(cardinality);
```

#### `isSetMember(key: string, value: any): Promise<boolean>`

检查值是否是集合的成员。

```typescript
const isMember = await RedisClient.getInstance().isSetMember('mySet', 'member1');
console.log(isMember);
```

#### `rpush(key: string, data: any, seconds: number = 0): Promise<void>`

将值追加到列表。

```typescript
await RedisClient.getInstance().rpush('myList', 'item1', 60);
await RedisClient.getInstance().rpush('myList', { name: 'item2' }, 120);
```

#### `lrange(key: string, start: number, end: number): Promise<void>`

从列表中获取一系列元素。

```typescript
await RedisClient.getInstance().lrange('myList', 0, -1);
```

#### `lrangeObject(key: string, start: number, end: number): Promise<Array<any>>`

从列表中获取一系列元素并解析 JSON 元素。

```typescript
const list = await RedisClient.getInstance().lrangeObject('myList', 0, -1);
console.log(list);
```

#### `llen(key: string): Promise<void>`

获取列表的长度。

```typescript
await RedisClient.getInstance().llen('myList');
```

#### `lpop(key: string): Promise<string>`

删除并返回列表的第一个元素。

```typescript
const firstItem = await RedisClient.getInstance().lpop('myList');
console.log(firstItem);
```


## 贡献

欢迎提交 issue 和 pull request。

## 版权信息

Copyright © 2023 Ticatec。保留所有权利。

本类库遵循 MIT 许可证发布。有关许可证的详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 联系方式

huili.f@gmail.com

https://github.com/ticatec/redis-client