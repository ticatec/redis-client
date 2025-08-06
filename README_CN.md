# Ticatec Redis 客户端

[English](./README.md) ｜ 中文

[![Version](https://img.shields.io/npm/v/@ticatec/redis-client)](https://www.npmjs.com/package/@ticatec/redis-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

基于ioredis的轻量级TypeScript封装库，采用单例模式提供便捷的Redis操作方法。支持真实Redis连接和Mock Redis测试。

## 特性

- **单例模式**: 易于使用的单例Redis客户端实例
- **Mock支持**: 内置Mock Redis用于测试环境
- **TypeScript支持**: 完整的类型定义和智能提示
- **JSON序列化**: 对象的自动JSON序列化/反序列化
- **全面操作**: 支持字符串、哈希、集合和列表操作
- **缓存框架**: 抽象缓存数据管理系统
- **日志集成**: 内置log4js日志记录

## 安装

```bash
npm install @ticatec/redis-client ioredis ioredis-mock log4js
```

## 快速开始

### 基础用法

```typescript
import RedisClient from '@ticatec/redis-client';

// 初始化真实Redis连接
await RedisClient.init({
  host: '127.0.0.1',
  port: 6379,
  // ... 其他ioredis配置选项
});

const client = RedisClient.getInstance();

// 字符串操作
await client.set('key', 'value', 3600); // 设置1小时TTL
const value = await client.get('key');

// 对象操作（JSON序列化）
await client.set('user', { name: 'John', age: 30 });
const user = await client.getObject('user');
```

### 使用Mock Redis进行测试

```typescript
// 使用Mock Redis初始化（传入null）
await RedisClient.init(null);

const client = RedisClient.getInstance();
await client.set('testKey', 'testValue');
const value = await client.get('testKey');
console.log(value); // 'testValue'
```

## API 参考

### 核心方法

#### 字符串操作
- `set(key, value, seconds?)` - 设置键值对，可选TTL
- `get(key)` - 根据键获取值
- `getObject(key)` - 获取并解析JSON对象
- `del(key)` - 删除键
- `expiry(key, seconds)` - 设置过期时间

#### 哈希操作
- `hset(key, data, seconds?)` - 设置哈希字段
- `hget(key, field)` - 获取哈希字段值
- `hgetall(key)` - 获取所有哈希字段
- `hsetnx(key, field, value)` - 仅当字段不存在时设置

#### 集合操作
- `sadd(key, members, seconds)` - 向集合添加成员
- `scard(key)` - 获取集合基数
- `isSetMember(key, value)` - 检查集合成员关系

#### 列表操作
- `rpush(key, data, seconds?)` - 向列表尾部推送数据
- `lrange(key, start, end)` - 获取列表范围
- `lrangeObject(key, start, end)` - 获取列表范围并解析JSON
- `llen(key)` - 获取列表长度
- `lpop(key)` - 从列表头部弹出元素

### 缓存框架

缓存框架提供了一种简单而灵活的方式来管理缓存数据，具有自动键生成和TTL处理功能。

#### AbstractCachedData

抽象基类，用于实现缓存数据操作。它提供三个核心方法：`load()`、`save()`和`clean()`：

```typescript
import { AbstractCachedData, GetKey } from '@ticatec/redis-client';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// 使用部分键定义用户缓存，提供灵活性
class UserCache extends AbstractCachedData<User> {
  constructor() {
    // 键生成函数接受部分User对象，TTL为1小时
    super((key: Partial<User>) => `user:${key.id}`, 3600);
  }
  
  // 带缓存的获取用户数据方法
  async getUser(id: number): Promise<User | null> {
    try {
      // 尝试使用部分键从缓存加载
      const cached = await this.load({ id });
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('缓存未命中，用户:', id);
    }
    
    // 如果缓存中没有，从数据库获取
    const user = await this.fetchUserFromDatabase(id);
    if (user) {
      // 保存到缓存 - getKey函数会从user对象中提取id
      await this.save(user);
    }
    
    return user;
  }
  
  // 更新用户数据的自定义方法
  async updateUser(id: number, userData: Partial<User>): Promise<void> {
    // 在数据库中更新
    const updatedUser = await this.updateUserInDatabase(id, userData);
    
    // 用新数据更新缓存
    if (updatedUser) {
      await this.save(updatedUser);
    }
  }
  
  // 使用户缓存失效的自定义方法
  async invalidateUser(id: number): Promise<void> {
    await this.clean({ id });
  }
  
  private async fetchUserFromDatabase(id: number): Promise<User | null> {
    // 您的数据库逻辑
    return null;
  }
  
  private async updateUserInDatabase(id: number, userData: Partial<User>): Promise<User | null> {
    // 您的数据库更新逻辑
    return null;
  }
}
```

#### CachedDataManager

用于注册和检索缓存实例的单例管理器：

```typescript
import { CachedDataManager } from '@ticatec/redis-client';

// 初始化管理器
const manager = CachedDataManager.getInstance();

// 创建并注册缓存实例
const userCache = new UserCache();
manager.register(UserCache, userCache);

// 在应用程序的任何地方检索和使用缓存实例
const getUserCache = () => manager.get(UserCache);

// 在应用程序中使用
async function handleUserRequest(userId: number): Promise<User | null> {
  const cache = getUserCache();
  if (cache) {
    return await cache.getUser(userId);
  }
  return null;
}
```

#### 高级使用模式

**1. 具有不同TTL的多种缓存类型：**

```typescript
class SessionCache extends AbstractCachedData<{ sessionId: string, data: any }> {
  constructor() {
    super(key => `session:${key.sessionId}`, 1800); // 30分钟
  }
}

class ConfigCache extends AbstractCachedData<{ key: string, value: any }> {
  constructor() {
    super(key => `config:${key.key}`, 86400); // 24小时
  }
}
```

**2. 复杂场景的复合键：**

```typescript
interface UserPost {
  userId: number;
  postId: number;
  title: string;
  content: string;
}

class UserPostsCache extends AbstractCachedData<UserPost[]> {
  constructor() {
    super(
      (key: { userId: number, page: number }) => 
        `user:${key.userId}:posts:page:${key.page}`,
      3600 // 1小时
    );
  }
  
  async getUserPostsPage(userId: number, page: number): Promise<UserPost[]> {
    const key = { userId, page };
    
    try {
      return await this.load(key);
    } catch (error) {
      // 缓存未命中，从API获取
      const posts = await this.fetchPostsFromAPI(userId, page);
      await this.save(posts);
      return posts;
    }
  }
  
  private async fetchPostsFromAPI(userId: number, page: number): Promise<UserPost[]> {
    // 您的API逻辑
    return [];
  }
}
```

## 配置

### Redis配置

传入任何有效的ioredis配置对象：

```typescript
await RedisClient.init({
  host: 'localhost',
  port: 6379,
  password: 'your-password',
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});
```

### 日志配置

客户端使用log4js进行日志记录。在应用中配置日志：

```typescript
import log4js from 'log4js';

log4js.configure({
  appenders: {
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['console'], level: 'info' },
    RedisClient: { appenders: ['console'], level: 'debug' }
  }
});
```

## 错误处理

客户端提供内置的错误处理和日志记录：

- 连接错误会自动记录
- JSON解析错误会优雅处理
- Redis命令错误会传播给调用者

## 最佳实践

1. **单次初始化**: 在应用中只调用一次`RedisClient.init()`
2. **测试使用Mock**: 单元测试中始终使用`init(null)`
3. **谨慎处理JSON**: JSON数据使用`getObject()`，字符串使用`get()`
4. **设置合适的TTL**: 总是考虑为缓存数据设置过期时间
5. **使用缓存框架**: 复杂缓存逻辑请扩展`AbstractCachedData`

## 依赖

- **ioredis** (^5.3.2): Node.js的Redis客户端
- **ioredis-mock** (^8.9.0): 用于测试的Mock Redis实现
- **log4js** (对等依赖): 日志框架

## 许可证

MIT许可证。详见[LICENSE](LICENSE)文件。

## 贡献

欢迎贡献！请向[GitHub仓库](https://github.com/ticatec/redis-client)提交问题和拉取请求。

## 联系方式

- 邮箱：huili.f@gmail.com
- 仓库：https://github.com/ticatec/redis-client