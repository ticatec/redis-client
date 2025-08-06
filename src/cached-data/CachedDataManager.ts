import AbstractCachedData from "./AbstractCachedData";

/**
 * 缓存数据构造函数类型
 * @template T - 缓存数据类型
 */
type CachedDataConstructor = new (...args: any[]) => AbstractCachedData<any>;

/**
 * 缓存数据管理器
 * 使用单例模式管理不同类型的缓存数据实例
 * 提供统一的注册和获取接口
 * @class CachedDataManager
 * @since 0.1.3
 */
export default class CachedDataManager {

    /**
     * 存储缓存实例的Map
     * @protected
     * @type {Map<CachedDataConstructor, AbstractCachedData<any>>}
     */
    protected map: Map<CachedDataConstructor, AbstractCachedData<any>>;
    
    /**
     * 单例实例
     * @private
     * @static
     * @type {CachedDataManager}
     */
    private static instance: CachedDataManager;

    /**
     * 获取CachedDataManager单例实例
     * @static
     * @returns {CachedDataManager} CachedDataManager实例
     */
    static getInstance(): CachedDataManager {
        if (CachedDataManager.instance == null) {
            CachedDataManager.instance = new CachedDataManager();
        }
        return CachedDataManager.instance;
    }

    /**
     * 私有构造函数，确保单例模式
     * @private
     */
    private constructor() {
        this.map = new Map<CachedDataConstructor, AbstractCachedData<any>>();
    }


    /**
     * 注册缓存数据实例
     * 将缓存数据类的构造函数和对应的实例进行关联注册
     * @param {CachedDataConstructor} ctor - 缓存数据类的构造函数
     * @param {AbstractCachedData<any>} instance - 缓存数据实例
     * @returns {void}
     */
    register(ctor: CachedDataConstructor, instance: AbstractCachedData<any>): void {
        this.map.set(ctor, instance);
    }
    

    /**
     * 获取指定类型的缓存数据实例
     * 根据构造函数获取对应的缓存实例，支持类型推断
     * @template T - 缓存数据类型，必须继承AbstractCachedData
     * @param {CachedDataConstructor} ctor - 缓存数据类的构造函数
     * @returns {T | undefined} 缓存数据实例，不存在时返回undefined
     */
    get<T extends AbstractCachedData<any>>(ctor: CachedDataConstructor): T | undefined {
        return this.map.get(ctor) as T | undefined;
    }
    
    

}