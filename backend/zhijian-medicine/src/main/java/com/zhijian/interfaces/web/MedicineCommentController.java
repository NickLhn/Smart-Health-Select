package com.zhijian.interfaces.web;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.application.service.MedicineCommentService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.medicine.entity.MedicineComment;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Tag(name = "药品评价")
@RestController
@RequestMapping("/medicine/comment")
@RequiredArgsConstructor
@Slf4j
/**
 * 药品评价控制器
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public class MedicineCommentController {

    private final MedicineCommentService commentService;
    private final com.zhijian.application.service.MerchantService merchantService;

    /**
     * 查看药品评价
     *
     * @param medicineId 药品ID
     * @param page       页码
     * @param size       每页大小
     * @return 评价列表分页结果
     */
    @Operation(summary = "查看药品评价")
    @GetMapping("/list/{medicineId}")
    public Result<IPage<MedicineComment>> list(@PathVariable Long medicineId,
                                               @RequestParam(defaultValue = "1") Integer page,
                                               @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(commentService.pageList(medicineId, page, size));
    }

    /**
     * 查看我的评价 (用户)
     *
     * @param page 页码
     * @param size 每页大小
     * @return 我的评价列表分页结果
     */
    @Operation(summary = "查看我的评价 (用户)")
    @GetMapping("/my")
    public Result<IPage<MedicineComment>> myComments(@RequestParam(defaultValue = "1") Integer page,
                                                     @RequestParam(defaultValue = "10") Integer size) {
        Long userId = com.zhijian.common.context.UserContext.getUserId();
        log.info("查询我的评价, userId: {}", userId);
        if (userId == null) {
            return Result.failed("请先登录");
        }
        IPage<MedicineComment> result = commentService.pageListByUserId(userId, page, size);
        log.info("查询我的评价结果, total: {}, records: {}", result.getTotal(), result.getRecords().size());
        return Result.success(result);
    }

    /**
     * 查看商家的评价 (商家)
     *
     * @param page 页码
     * @param size 每页大小
     * @return 商家评价列表分页结果
     */
    @Operation(summary = "查看商家的评价 (商家)")
    @GetMapping("/merchant")
    public Result<IPage<MedicineComment>> merchantComments(@RequestParam(defaultValue = "1") Integer page,
                                                           @RequestParam(defaultValue = "10") Integer size) {
        Long userId = com.zhijian.common.context.UserContext.getUserId();
        log.info("查询商家评价, userId: {}", userId);
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(com.zhijian.common.context.UserContext.getRole())) {
            return Result.failed("无权操作");
        }
        
        // 校验商家信息是否存在
        com.zhijian.domain.user.entity.Merchant merchant = merchantService.getByUserId(userId);
        if (merchant == null) {
            return Result.failed("商家信息不存在");
        }
        
        // 注意：Medicine表中sellerId存储的是商家的userId，所以这里传入userId
        IPage<MedicineComment> result = commentService.pageListBySellerId(userId, page, size);
        log.info("查询商家评价结果, total: {}, records: {}", result.getTotal(), result.getRecords().size());
        return Result.success(result);
    }

    /**
     * 调试接口：查看所有评价
     */
    @GetMapping("/debug/all")
    public Result<List<MedicineComment>> debugAll() {
        return Result.success(commentService.list());
    }

    @Operation(summary = "回复评价 (商家)")
    @PostMapping("/reply/{id}")
    public Result reply(@PathVariable Long id, @RequestBody Map<String, String> params) {
        Long userId = com.zhijian.common.context.UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(com.zhijian.common.context.UserContext.getRole())) {
            return Result.failed("无权操作");
        }
        
        String content = params.get("reply");
        
        boolean success = commentService.replyComment(id, content);
        return success ? Result.success(null, "回复成功") : Result.failed("回复失败");
    }
}
