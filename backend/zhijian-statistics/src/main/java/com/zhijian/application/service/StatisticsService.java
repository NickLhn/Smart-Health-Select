package com.zhijian.application.service;

import com.zhijian.interfaces.dto.statistics.DashboardDataDTO;

public interface StatisticsService {
    /**
     * 获取管理端仪表盘数据
     */
    DashboardDataDTO getAdminDashboardData();
}
