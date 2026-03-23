package com.zhijian.user.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.user.entity.SysConfig;
import java.util.Map;

/**
 * 系统配置服务接口
 */
public interface SysConfigService extends IService<SysConfig> {

    /**
     * 获取所有配置(Map形式)
     * @return Map<Key, Value>
     */
    Map<String, String> getAllConfigs();

    /**
     * 更新配置
     * @param configs Map<Key, Value>
     */
    void updateConfigs(Map<String, String> configs);
}

