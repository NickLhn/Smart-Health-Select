package com.zhijian.controller.im;

import com.zhijian.service.im.ImService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.im.entity.ImMessage;
import com.zhijian.common.context.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;
import java.util.List;
import java.util.Map;

/**
 * 即时通讯控制器。
 */
@Tag(name = "即时通讯")
@RestController
@RequestMapping("/im")
public class ImController {

    @Resource
    private ImService imService;

    @Operation(summary = "发送消息")
    @PostMapping("/send")
    public Result<ImMessage> send(@RequestBody Map<String, Object> params) {
        Long currentUserId = UserContext.getUserId();
        if (currentUserId == null) return Result.failed("未登录");

        // 发送消息时 fromUserId 始终取当前登录用户，避免前端伪造发送方。
        Long toUserId = Long.valueOf(params.get("toUserId").toString());
        String content = (String) params.get("content");
        Integer type = params.containsKey("type") ? (Integer) params.get("type") : 0;

        return Result.success(imService.sendMessage(currentUserId, toUserId, content, type));
    }

    @Operation(summary = "获取历史消息")
    @GetMapping("/history")
    public Result<List<ImMessage>> history(@RequestParam Long targetUserId) {
        Long currentUserId = UserContext.getUserId();
        if (currentUserId == null) return Result.failed("未登录");

        // 查看会话历史时顺手把对方发给我的未读消息标成已读。
        imService.markAsRead(targetUserId, currentUserId);

        return Result.success(imService.getHistory(currentUserId, targetUserId));
    }

    @Operation(summary = "获取联系人列表")
    @GetMapping("/contacts")
    public Result<List<Map<String, Object>>> contacts() {
        Long currentUserId = UserContext.getUserId();
        if (currentUserId == null) return Result.failed("未登录");

        return Result.success(imService.getContacts(currentUserId));
    }
}
