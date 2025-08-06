import RedisClient from "./RedisClient";
import AbstractCachedData from "./cached-data/AbstractCachedData";
import CachedDataManager from "./cached-data/CachedDataManager";

// 主要导出
export default RedisClient;

// 缓存框架导出
export {
    AbstractCachedData,
    CachedDataManager
};