package com.zhijian.service.im;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.im.entity.ImMessage;
import java.util.List;
import java.util.Map;

public interface ImService extends IService<ImMessage> {
    ImMessage sendMessage(Long fromUserId, Long toUserId, String content, Integer type);
    List<ImMessage> getHistory(Long userId1, Long userId2);
    List<Map<String, Object>> getContacts(Long userId);
    void markAsRead(Long fromUserId, Long toUserId);
}

