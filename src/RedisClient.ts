import log4js from "@ticatec/singleton-log4js";
import Redis from "ioredis";


/**
 * Redis客户端工具
 */
export default class RedisClient {

    private static instance: RedisClient;

    protected readonly logger = log4js.getLogger('RedisClient');

    /**
     * redis实例
     * @private
     */
    private _client: Redis;

    private constructor(conf: any) {
        if (conf != null) {
            this.logger.debug('redis 服务器参数：', conf);
            this._client = new Redis(conf);
            this._client.on('error', (err) => this.logger.log('Redis Client Error', err));
            this._client.on('connect', () => this.logger.log('Connecting the redis server...'));
            this._client.on('ready', () => this.logger.log('Connected the redis server.'));
            this._client.on('end', () => this.logger.log('Connection is broken from redis server'));
            this._client.on('reconnecting', (err) => this.logger.log('Try to reconnect the redis server...'));
        } else {
            this.logger.debug('使用模拟redis');
            const MockRedis = require('ioredis-mock');
            this._client = new MockRedis();
        }
    }

    /**
     * 初始化Redis连接
     */
    public static async init(conf: any) {
        if (RedisClient.instance == null) {
            RedisClient.instance = new RedisClient(conf);
        }
    }

    get client(): Redis {
        return this._client;
    }

    public static getInstance(): RedisClient {
        return RedisClient.instance;
    }

    /**
     * 设置一个键值
     * @param key 主键
     * @param value 值
     * @param seconds 生命周期，单位秒，默认为0，永远有效
     */
    async set(key: string, value: any, seconds: number = 0): Promise<void> {
        if (typeof value == "object") {
            value = JSON.stringify(value);
        }
        if (seconds == null || seconds == 0) {
            await this._client.set(key, value);
        } else {
            await this._client.set(key, value, 'EX', seconds);
        }
    }

    /**
     * 读取键值
     * @param key
     */
    get(key): Promise<string | Buffer | number> {
        return this._client.get(key);
    }

    /**
     * 获取一个对象
     * @param key
     */
    async getObject(key): Promise<any> {
        let text = await this.get(key);
        let result = null;
        if (text != null && typeof text == "string") {
            try {
                result = JSON.parse(text);
            } catch (ex) {
                this.logger.debug(`${text} is not a json string.`);
            }
        }
        return result;
    }

    /**
     *
     * @param key
     */
    async del(key): Promise<void> {
        await this._client.del(key);
    }

    /**
     * 设置过期时间
     * @param key
     * @param seconds
     */
    async expiry(key: string, seconds: number): Promise<void> {
        await this._client.expire(key, seconds);
    }

    /**
     * 设定一个哈希对象
     * @param key
     * @param data
     * @param seconds
     */
    async hset(key: string, data: any, seconds: number = 0): Promise<void> {
        await this._client.hset(key, data);
        if (seconds != null && seconds > 0) {
            await this.expiry(key, seconds);
        }
    }

    /**
     * 获取一个子属性值
     * @param key
     * @param name
     */
    async hget(key: string, name: string): Promise<void> {
        await this._client.hget(key, name);
    }

    /**
     * 获取所有的哈希属性值
     * @param key
     */
    async hgetall(key: string): Promise<void> {
        await this._client.hgetall(key);
    }

    /**
     * 更新哈希对象中的值
     * @param key
     * @param name
     * @param value
     */
    async hsetnx(key: string, name: string, value: string | Buffer | number): Promise<void> {
        await this._client.hsetnx(key, name, value);
    }

    /**
     *
     * @param key
     * @param arr
     * @param seconds
     */
    async sadd(key: string, arr: Array<string | Buffer | number>, seconds: number): Promise<void> {
        await this._client.sadd(key, arr);
        if (seconds > 0) {
            await this.expiry(key, seconds);
        }
    }

    /**
     *
     * @param key
     */
    async scard(key: string): Promise<number> {
        return this._client.scard(key);
    }

    /**
     *
     * @param key
     * @param value
     */
    async isSetMember(key: string, value: any): Promise<boolean> {
        return await this._client.sismember(key, value) == 1;
    }

    /**
     *
     * @param key
     * @param data
     * @param seconds
     */
    async rpush(key: string, data: any, seconds: number = 0): Promise<void> {
        if (typeof data == "object") {
            data = JSON.stringify(data);
        }
        await this._client.rpush(key, data);
        if (seconds > 0) {
            await this.expiry(key, seconds);
        }
    }

    /**
     *
     * @param key
     * @param start
     * @param end
     */
    async lrange(key: string, start: number, end: number): Promise<void> {
        await this._client.lrange(key, start, end);
    }

    /**
     *
     * @param key
     * @param start
     * @param end
     */
    async lrangeObject(key: string, start: number, end: number): Promise<Array<any>> {
        let arr = await this._client.lrange(key, start, end);
        let list = [];
        for (let item of arr) {
            if (typeof item == "string") {
                try {
                    list.push(JSON.parse(item));
                } catch (ex) {
                    this.logger.warn(`${item} is not a json string`)
                }
            } else {
                list.push(item)
            }
        }
        return list;
    }

    /**
     *
     * @param key
     */
    async llen(key: string): Promise<void> {
        await this._client.llen(key);
    }

    /**
     *
     * @param key
     */
    async lpop(key: string): Promise<string> {
        return this._client.lpop(key);
    }
}