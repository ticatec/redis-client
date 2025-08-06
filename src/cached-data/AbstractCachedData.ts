import RedisClient from "../RedisClient";

/**
 * 键生成函数类型定义
 * @template T - 缓存对象类型
 * @param {Partial<T>} key - 部分键对象
 * @returns {string} Redis键名
 */
export type GetKey<T> = (key: Partial<T>) => string;

/**
 * 抽象缓存数据基类
 * 提供通用的缓存数据操作方法，子类需要实现具体的数据处理逻辑
 * @abstract
 * @template T - 缓存键的类型
 */
export default abstract class AbstractCachedData<T> {

    /**
     * Redis客户端实例
     * @protected
     * @type {RedisClient}
     */
    protected redisClient: RedisClient = RedisClient.getInstance();
    
    /**
     * 键名生成函数
     * @protected
     * @type GetKey<T>
     */
    protected readonly getKey: GetKey<T>;
    
    /**
     * 缓存过期时间(秒)
     * @protected
     * @type {number}
     */
    protected readonly ttl: number;

    /**
     * 构造函数
     * @protected
     * @param {GetKey<T>} getKey - 根据缓存键生成Redis键名的函数
     * @param {number} [ttl=0] - 缓存过期时间(秒)，0表示永不过期
     */
    protected constructor(getKey: GetKey<T>, ttl: number = 0) {
        this.getKey = getKey;
        this.ttl = ttl;
    }

    /**
     * 从缓存加载数据
     * @param {Partial<T>} key - 缓存键（可以是部分对象）
     * @returns {Promise<T>} 缓存的数据对象
     */
    async load(key: Partial<T>): Promise<T> {
        return await this.redisClient.getObject(this.getKey(key));
    }

    /**
     * 清除指定键的缓存数据
     * @param {Partial<T>} key - 缓存键（可以是部分对象）
     * @returns {Promise<void>}
     */
    async clean(key: Partial<T>): Promise<void> {
        await this.redisClient.del(this.getKey(key));
    }

    /**
     * 保存数据到缓存
     * @param {T} data - 要保存的完整数据对象
     * @returns {Promise<void>}
     */
    async save(data: T): Promise<void> {
        await this.redisClient.set(this.getKey(data), data, this.ttl);
    }

}