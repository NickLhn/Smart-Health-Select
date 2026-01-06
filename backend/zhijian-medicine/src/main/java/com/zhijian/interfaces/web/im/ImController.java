package com.zhijian.interfaces.web.im;

import com.zhijian.application.service.im.ImService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.im.entity.ImMessage;
import com.zhijian.common.context.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;
import java.util.List;
import java.util.Map;

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
