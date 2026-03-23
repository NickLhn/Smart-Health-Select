package com.zhijian.service.im.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.im.ImService;
import com.zhijian.pojo.im.entity.ImMessage;
import com.zhijian.mapper.im.ImMessageMapper;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 即时通讯服务实现类。
 */
@Service
public class ImServiceImpl extends ServiceImpl<ImMessageMapper, ImMessage> implements ImService {

    @Override
    public ImMessage sendMessage(Long fromUserId, Long toUserId, String content, Integer type) {
        // 发送消息时默认把未读状态置为 0。
        ImMessage message = new ImMessage();
        message.setFromUserId(fromUserId);
        message.setToUserId(toUserId);
        message.setContent(content);
        message.setType(type);
        message.setReadStatus(0);
        this.save(message);
        return message;
    }

    @Override
    public List<ImMessage> getHistory(Long userId1, Long userId2) {
        // 会话历史按时间升序返回，便于前端直接渲染聊天顺序。
        return this.list(new LambdaQueryWrapper<ImMessage>()
                .and(w -> w.eq(ImMessage::getFromUserId, userId1).eq(ImMessage::getToUserId, userId2))
                .or(w -> w.eq(ImMessage::getFromUserId, userId2).eq(ImMessage::getToUserId, userId1))
                .orderByAsc(ImMessage::getCreateTime));
    }

    @Override
    public List<Map<String, Object>> getContacts(Long userId) {
        // 联系人列表由“我发过的人”和“给我发过的人”两部分合并得到。
        List<ImMessage> sent = this.list(new LambdaQueryWrapper<ImMessage>()
                .eq(ImMessage::getFromUserId, userId)
                .groupBy(ImMessage::getToUserId)
                .select(ImMessage::getToUserId));
                
        List<ImMessage> received = this.list(new LambdaQueryWrapper<ImMessage>()
                .eq(ImMessage::getToUserId, userId)
                .groupBy(ImMessage::getFromUserId)
                .select(ImMessage::getFromUserId));
        
        Set<Long> contactIds = new HashSet<>();
        sent.forEach(m -> contactIds.add(m.getToUserId()));
        received.forEach(m -> contactIds.add(m.getFromUserId()));
        
        return contactIds.stream().map(id -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", id);
            // 当前联系人名称仍然是兜底占位值，后续可以再补真实昵称查询。
            map.put("name", "用户 " + id);
            map.put("avatar", "");
            
            // 每个联系人补最后一条消息和未读数。
            ImMessage lastMsg = this.getOne(new LambdaQueryWrapper<ImMessage>()
                    .and(w -> w.eq(ImMessage::getFromUserId, userId).eq(ImMessage::getToUserId, id))
                    .or(w -> w.eq(ImMessage::getFromUserId, id).eq(ImMessage::getToUserId, userId))
                    .orderByDesc(ImMessage::getCreateTime)
                    .last("LIMIT 1"));
            
            if (lastMsg != null) {
                map.put("lastMessage", lastMsg.getContent());
                map.put("lastTime", lastMsg.getCreateTime());
                map.put("unreadCount", this.count(new LambdaQueryWrapper<ImMessage>()
                        .eq(ImMessage::getFromUserId, id)
                        .eq(ImMessage::getToUserId, userId)
                        .eq(ImMessage::getReadStatus, 0)));
            }
            
            return map;
        }).collect(Collectors.toList());
    }
    
    @Override
    public void markAsRead(Long fromUserId, Long toUserId) {
        // 把某个联系人发来的未读消息全部标记为已读。
        this.update(new LambdaUpdateWrapper<ImMessage>()
                .eq(ImMessage::getFromUserId, fromUserId)
                .eq(ImMessage::getToUserId, toUserId)
                .eq(ImMessage::getReadStatus, 0)
                .set(ImMessage::getReadStatus, 1));
    }
}
