package com.zhijian.service;

import com.zhijian.dto.statistics.DashboardDataDTO;

public interface StatisticsService {
    /**
     * 获取管理端仪表盘数据
     */
    DashboardDataDTO getAdminDashboardData();
}

