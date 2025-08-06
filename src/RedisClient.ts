import Redis from "ioredis";
import log4js from "log4js";

/**
 * Redis客户端工具 - 基于ioredis的轻量级封装
 * 提供单例模式的Redis客户端，支持真实Redis和Mock Redis切换
 * @class RedisClient
 */
export default class RedisClient {

    private static instance: RedisClient;

    protected readonly logger = log4js.getLogger('RedisClient');

    /**
     * Redis客户端实例
     * @private
     * @type {Redis}
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
     * @static
     * @param {any} conf - Redis配置参数，传入null时使用Mock Redis
     * @returns {Promise<void>}
     */
    public static async init(conf: any) {
        if (RedisClient.instance == null) {
            RedisClient.instance = new RedisClient(conf);
        }
    }

    /**
     * 获取Redis客户端实例
     * @readonly
     * @type {Redis}
     * @returns {Redis} ioredis客户端实例
     */
    get client(): Redis {
        return this._client;
    }

    /**
     * 获取RedisClient单例实例
     * @static
     * @returns {RedisClient} RedisClient实例
     * @throws {Error} 如果未先调用init方法初始化
     */
    public static getInstance(): RedisClient {
        return RedisClient.instance;
    }

    /**
     * 设置一个键值对
     * @param {string} key - Redis键名
     * @param {any} value - 要存储的值，对象类型会自动JSON序列化
     * @param {number} [seconds=0] - 过期时间(秒)，0表示永不过期
     * @returns {Promise<void>}
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
     * 获取指定键的值
     * @param {string} key - Redis键名
     * @returns {Promise<string | Buffer | number | null>} 键对应的值，不存在时返回null
     */
    get(key: string): Promise<string | Buffer | number> {
        return this._client.get(key);
    }

    /**
     * 获取指定键的值并解析为JSON对象
     * @param {string} key - Redis键名
     * @returns {Promise<any>} 解析后的对象，解析失败或不存在时返回null
     */
    async getObject(key: string): Promise<any> {
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
     * 删除指定的键
     * @param {string} key - 要删除的Redis键名
     * @returns {Promise<void>}
     */
    async del(key: string): Promise<void> {
        await this._client.del(key);
    }

    /**
     * 设置键的过期时间
     * @param {string} key - Redis键名
     * @param {number} seconds - 过期时间(秒)
     * @returns {Promise<void>}
     */
    async expiry(key: string, seconds: number): Promise<void> {
        await this._client.expire(key, seconds);
    }

    /**
     * 设置哈希表字段
     * @param {string} key - Redis键名
     * @param {any} data - 哈希表数据对象
     * @param {number} [seconds=0] - 过期时间(秒)，0表示永不过期
     * @returns {Promise<void>}
     */
    async hset(key: string, data: any, seconds: number = 0): Promise<void> {
        await this._client.hset(key, data);
        if (seconds != null && seconds > 0) {
            await this.expiry(key, seconds);
        }
    }

    /**
     * 获取哈希表中指定字段的值
     * @param {string} key - Redis键名
     * @param {string} name - 哈希表字段名
     * @returns {Promise<string | null>} 字段值，不存在时返回null
     */
    async hget(key: string, name: string): Promise<string | null> {
        return this._client.hget(key, name);
    }

    /**
     * 获取哈希表中所有字段和值
     * @param {string} key - Redis键名
     * @returns {Promise<Record<string, string>>} 包含所有字段和值的对象
     */
    async hgetall(key: string): Promise<Record<string, string>> {
        return this._client.hgetall(key);
    }

    /**
     * 仅在字段不存在时设置哈希表字段值
     * @param {string} key - Redis键名
     * @param {string} name - 哈希表字段名
     * @param {string | Buffer | number} value - 字段值
     * @returns {Promise<void>}
     */
    async hsetnx(key: string, name: string, value: string | Buffer | number): Promise<void> {
        await this._client.hsetnx(key, name, value);
    }

    /**
     * 向集合添加成员
     * @param {string} key - Redis键名
     * @param {Array<string | Buffer | number>} arr - 要添加的成员数组
     * @param {number} seconds - 过期时间(秒)，大于0时设置过期时间
     * @returns {Promise<void>}
     */
    async sadd(key: string, arr: Array<string | Buffer | number>, seconds: number): Promise<void> {
        await this._client.sadd(key, arr);
        if (seconds > 0) {
            await this.expiry(key, seconds);
        }
    }

    /**
     * 获取集合中成员的数量
     * @param {string} key - Redis键名
     * @returns {Promise<number>} 集合成员数量
     */
    async scard(key: string): Promise<number> {
        return this._client.scard(key);
    }

    /**
     * 检查值是否为集合成员
     * @param {string} key - Redis键名
     * @param {any} value - 要检查的值
     * @returns {Promise<boolean>} 是否为集合成员
     */
    async isSetMember(key: string, value: any): Promise<boolean> {
        return await this._client.sismember(key, value) == 1;
    }

    /**
     * 向列表尾部添加元素
     * @param {string} key - Redis键名
     * @param {any} data - 要添加的数据，对象类型会自动JSON序列化
     * @param {number} [seconds=0] - 过期时间(秒)，0表示永不过期
     * @returns {Promise<void>}
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
     * 获取列表指定范围的元素
     * @param {string} key - Redis键名
     * @param {number} start - 开始索引
     * @param {number} end - 结束索引(-1表示最后一个元素)
     * @returns {Promise<string[]>} 指定范围的元素数组
     */
    async lrange(key: string, start: number, end: number): Promise<string[]> {
        return this._client.lrange(key, start, end);
    }

    /**
     * 获取列表指定范围的元素并解析为JSON对象
     * @param {string} key - Redis键名
     * @param {number} start - 开始索引
     * @param {number} end - 结束索引(-1表示最后一个元素)
     * @returns {Promise<Array<any>>} 解析后的对象数组
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
     * 获取列表长度
     * @param {string} key - Redis键名
     * @returns {Promise<number>} 列表长度
     */
    async llen(key: string): Promise<number> {
        return this._client.llen(key);
    }

    /**
     * 移除并返回列表的第一个元素
     * @param {string} key - Redis键名
     * @returns {Promise<string | null>} 被移除的元素，列表为空时返回null
     */
    async lpop(key: string): Promise<string> {
        return this._client.lpop(key);
    }
}