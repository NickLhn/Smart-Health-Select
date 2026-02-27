package com.zhijian.user.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.user.service.SysConfigService;
import com.zhijian.pojo.user.entity.SysConfig;
import com.zhijian.user.mapper.SysConfigMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 系统配置服务实现类
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Service
public class SysConfigServiceImpl extends ServiceImpl<SysConfigMapper, SysConfig> implements SysConfigService {

    @Override
    public Map<String, String> getAllConfigs() {
        List<SysConfig> list = this.list();
        if (list == null || list.isEmpty()) {
            return new HashMap<>();
        }
        return list.stream().collect(Collectors.toMap(SysConfig::getConfigKey, SysConfig::getConfigValue));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateConfigs(Map<String, String> configs) {
        if (configs == null || configs.isEmpty()) {
            return;
        }
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            SysConfig config = new SysConfig();
            config.setConfigKey(entry.getKey());
            config.setConfigValue(entry.getValue());
            // 如果存在则更新，不存在则插入(saveOrUpdate需要主键，这里configKey是主键)
            this.saveOrUpdate(config);
        }
    }
}

