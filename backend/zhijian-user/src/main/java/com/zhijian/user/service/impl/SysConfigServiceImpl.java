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

@Service
public class SysConfigServiceImpl extends ServiceImpl<SysConfigMapper, SysConfig> implements SysConfigService {

    @Override
    public Map<String, String> getAllConfigs() {
        // 系统配置以 key-value 形式整体返回给管理端。
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
            // configKey 就是主键，直接走 saveOrUpdate 即可覆盖已有配置。
            this.saveOrUpdate(config);
        }
    }
}
