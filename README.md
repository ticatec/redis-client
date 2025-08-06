# Ticatec Redis Client

[中文](./README_CN.md) ｜ English

[![Version](https://img.shields.io/npm/v/@ticatec/redis-client)](https://www.npmjs.com/package/@ticatec/redis-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight TypeScript wrapper around ioredis, providing convenient methods for Redis operations with singleton pattern support. Features both real Redis connections and mock Redis for testing.

## Features

- **Singleton Pattern**: Easy-to-use singleton Redis client instance
- **Mock Support**: Built-in mock Redis for testing environments
- **TypeScript Support**: Full type definitions and IntelliSense support
- **JSON Serialization**: Automatic JSON serialization/deserialization for objects
- **Comprehensive Operations**: Support for strings, hashes, sets, and lists
- **Caching Framework**: Abstract caching data management system
- **Logging Integration**: Built-in logging with log4js

## Installation

```bash
npm install @ticatec/redis-client ioredis ioredis-mock log4js
```

## Quick Start

### Basic Usage

```typescript
import RedisClient from '@ticatec/redis-client';

// Initialize with real Redis
await RedisClient.init({
  host: '127.0.0.1',
  port: 6379,
  // ... other ioredis options
});

const client = RedisClient.getInstance();

// String operations
await client.set('key', 'value', 3600); // with 1-hour TTL
const value = await client.get('key');

// Object operations with JSON serialization
await client.set('user', { name: 'John', age: 30 });
const user = await client.getObject('user');
```

### Testing with Mock Redis

```typescript
// Initialize with mock Redis (pass null)
await RedisClient.init(null);

const client = RedisClient.getInstance();
await client.set('testKey', 'testValue');
const value = await client.get('testKey');
console.log(value); // 'testValue'
```

## API Reference

### Core Methods

#### String Operations
- `set(key, value, seconds?)` - Set key-value pair with optional TTL
- `get(key)` - Get value by key
- `getObject(key)` - Get and parse JSON object
- `del(key)` - Delete key
- `expiry(key, seconds)` - Set expiration time

#### Hash Operations
- `hset(key, data, seconds?)` - Set hash fields
- `hget(key, field)` - Get hash field value
- `hgetall(key)` - Get all hash fields
- `hsetnx(key, field, value)` - Set hash field if not exists

#### Set Operations
- `sadd(key, members, seconds)` - Add members to set
- `scard(key)` - Get set cardinality
- `isSetMember(key, value)` - Check set membership

#### List Operations
- `rpush(key, data, seconds?)` - Push to list tail
- `lrange(key, start, end)` - Get list range
- `lrangeObject(key, start, end)` - Get list range and parse JSON
- `llen(key)` - Get list length
- `lpop(key)` - Pop from list head

### Caching Framework

The caching framework provides a simple and flexible way to manage cached data with automatic key generation and TTL handling.

#### AbstractCachedData

Abstract base class for implementing cached data operations. It provides three core methods: `load()`, `save()`, and `clean()`:

```typescript
import { AbstractCachedData, GetKey } from '@ticatec/redis-client';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Define a user cache using partial keys for flexibility
class UserCache extends AbstractCachedData<User> {
  constructor() {
    // Key generator function accepts partial User object and TTL (1 hour)
    super((key: Partial<User>) => `user:${key.id}`, 3600);
  }
  
  // Custom method to get user data with caching
  async getUser(id: number): Promise<User | null> {
    try {
      // Try to load from cache using partial key
      const cached = await this.load({ id });
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('Cache miss for user:', id);
    }
    
    // If not in cache, fetch from database
    const user = await this.fetchUserFromDatabase(id);
    if (user) {
      // Save to cache - the getKey function will extract id from user object
      await this.save(user);
    }
    
    return user;
  }
  
  // Custom method to update user data
  async updateUser(id: number, userData: Partial<User>): Promise<void> {
    // Update in database
    const updatedUser = await this.updateUserInDatabase(id, userData);
    
    // Update cache with new data
    if (updatedUser) {
      await this.save(updatedUser);
    }
  }
  
  // Custom method to invalidate user cache
  async invalidateUser(id: number): Promise<void> {
    await this.clean({ id });
  }
  
  private async fetchUserFromDatabase(id: number): Promise<User | null> {
    // Your database logic here
    return null;
  }
  
  private async updateUserInDatabase(id: number, userData: Partial<User>): Promise<User | null> {
    // Your database update logic here
    return null;
  }
}
```

#### CachedDataManager

Singleton manager for registering and retrieving caching instances:

```typescript
import { CachedDataManager } from '@ticatec/redis-client';

// Initialize the manager
const manager = CachedDataManager.getInstance();

// Create and register cache instances
const userCache = new UserCache();
manager.register(UserCache, userCache);

// Retrieve and use cache instances anywhere in your application
const getUserCache = () => manager.get(UserCache);

// Usage in your application
async function handleUserRequest(userId: number): Promise<User | null> {
  const cache = getUserCache();
  if (cache) {
    return await cache.getUser(userId);
  }
  return null;
}
```

#### Advanced Usage Patterns

**1. Different cache types with various TTLs:**

```typescript
class SessionCache extends AbstractCachedData<{ sessionId: string, data: any }> {
  constructor() {
    super(key => `session:${key.sessionId}`, 1800); // 30 minutes
  }
}

class ConfigCache extends AbstractCachedData<{ key: string, value: any }> {
  constructor() {
    super(key => `config:${key.key}`, 86400); // 24 hours
  }
}
```

**2. Composite keys for complex scenarios:**

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
      3600 // 1 hour
    );
  }
  
  async getUserPostsPage(userId: number, page: number): Promise<UserPost[]> {
    const key = { userId, page };
    
    try {
      return await this.load(key);
    } catch (error) {
      // Cache miss, fetch from API
      const posts = await this.fetchPostsFromAPI(userId, page);
      await this.save(posts);
      return posts;
    }
  }
  
  private async fetchPostsFromAPI(userId: number, page: number): Promise<UserPost[]> {
    // Your API logic here
    return [];
  }
}
```

## Configuration

### Redis Configuration

Pass any valid ioredis configuration object:

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

### Logging

The client uses log4js for logging. Configure logging in your application:

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

## Error Handling

The client provides built-in error handling and logging:

- Connection errors are logged automatically
- JSON parsing errors are handled gracefully
- Redis command errors are propagated to the caller

## Best Practices

1. **Initialize once**: Call `RedisClient.init()` only once in your application
2. **Use mock for tests**: Always use `init(null)` for unit tests
3. **Handle JSON carefully**: Use `getObject()` for JSON data, `get()` for strings
4. **Set appropriate TTLs**: Always consider setting expiration times for cached data
5. **Use caching framework**: Extend `AbstractCachedData` for complex caching logic

## Dependencies

- **ioredis** (^5.3.2): Redis client for Node.js
- **ioredis-mock** (^8.9.0): Mock Redis implementation for testing
- **log4js** (peer dependency): Logging framework

## License

MIT License. See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please submit issues and pull requests to the [GitHub repository](https://github.com/ticatec/redis-client).

## Contact

- Email: huili.f@gmail.com
- Repository: https://github.com/ticatec/redis-client