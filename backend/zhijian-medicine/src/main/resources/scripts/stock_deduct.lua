-- 扣减库存 Lua 脚本
-- KEYS[1]: 商品库存Key
-- ARGV[1]: 扣减数量
-- 返回值: 1 成功, 0 失败(库存不足), -1 失败(Key不存在)

if (redis.call('exists', KEYS[1]) == 1) then
    local stock = tonumber(redis.call('get', KEYS[1]))
    local count = tonumber(ARGV[1])
    if (stock >= count) then
        redis.call('decrby', KEYS[1], count)
        return 1
    else
        return 0
    end
else
    return -1
end