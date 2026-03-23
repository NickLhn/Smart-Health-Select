package com.zhijian.service.im;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.im.entity.ImMessage;

import java.util.List;
import java.util.Map;

/**
 * 即时通讯服务接口。
 */
public interface ImService extends IService<ImMessage> {

    /**
     * 发送消息。
     *
     * @param fromUserId 发送方用户 ID
     * @param toUserId 接收方用户 ID
     * @param content 消息内容
     * @param type 消息类型
     * @return 消息实体
     */
    ImMessage sendMessage(Long fromUserId, Long toUserId, String content, Integer type);

    /**
     * 获取会话历史。
     *
     * @param userId1 用户 ID
     * @param userId2 用户 ID
     * @return 消息列表
     */
    List<ImMessage> getHistory(Long userId1, Long userId2);

    /**
     * 获取联系人列表。
     *
     * @param userId 用户 ID
     * @return 联系人列表
     */
    List<Map<String, Object>> getContacts(Long userId);

    /**
     * 标记消息为已读。
     *
     * @param fromUserId 发送方用户 ID
     * @param toUserId 接收方用户 ID
     */
    void markAsRead(Long fromUserId, Long toUserId);
}
