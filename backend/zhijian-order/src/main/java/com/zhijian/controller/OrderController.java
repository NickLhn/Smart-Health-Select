package com.zhijian.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.service.OrderService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.Order;
import com.zhijian.dto.order.OrderAuditDTO;
import com.zhijian.dto.order.OrderCommentDTO;
import com.zhijian.dto.order.OrderCreateDTO;
import com.zhijian.dto.order.OrderCreateFromCartDTO;
import com.zhijian.dto.order.OrderQueryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "订单管理")
@RestController
@RequestMapping("/orders")
public class OrderController {

    @Resource
    private OrderService orderService;

    // ========================= 用户侧下单与查询 =========================

    // 直接创建订单主要用于非购物车场景，例如单商品立即购买。
    @Operation(summary = "创建订单")
    @PostMapping("/create")
    public Result createOrder(@Valid @RequestBody OrderCreateDTO createDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return orderService.createOrder(createDTO, userId);
    }

    // 从购物车拆分生成订单时，后端会按店铺等规则返回多个订单 ID。
    @Operation(summary = "从购物车创建订单")
    @PostMapping("/createFromCart")
    public Result<List<Long>> createFromCart(@RequestBody @Valid OrderCreateFromCartDTO createDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return orderService.createOrderFromCart(createDTO, userId);
    }

    // 运费试算通常发生在提交订单前，用于给前端做最终金额确认。
    @Operation(summary = "计算运费")
    @PostMapping("/calculateFreight")
    public Result<BigDecimal> calculateFreight(@RequestBody @Valid OrderCreateFromCartDTO dto) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(orderService.calculateFreight(dto, userId));
    }

    // 用户侧订单列表。
    @Operation(summary = "我的订单列表 (用户)")
    @GetMapping("/list")
    public Result<IPage<Order>> list(OrderQueryDTO queryDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(orderService.pageList(queryDTO, userId));
    }

    // 商家侧订单列表。
    @Operation(summary = "商家订单列表")
    @GetMapping("/seller/list")
    public Result<IPage<Order>> sellerList(OrderQueryDTO queryDTO) {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        // 校验角色
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("无权操作：非商家账号");
        }
        return Result.success(orderService.pageListSeller(queryDTO, sellerId));
    }

    // 用户完成订单后可直接通过订单接口提交评价，避免额外跳转独立评论模块。
    @Operation(summary = "评价订单")
    @PostMapping("/comment")
    public Result<Boolean> commentOrder(@RequestBody @Valid OrderCommentDTO dto) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        boolean success = orderService.commentOrder(dto.getOrderId(), dto.getStar(), dto.getContent(), dto.getImages(), userId);
        return success ? Result.success(true) : Result.failed("评价失败");
    }

    // 管理端订单列表。
    @Operation(summary = "管理员订单列表")
    @GetMapping("/admin/list")
    public Result<IPage<Order>> adminList(OrderQueryDTO queryDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 校验角色
        if (!"ADMIN".equals(UserContext.getRole())) {
            return Result.failed("无权操作：非管理员账号");
        }
        return Result.success(orderService.pageListAdmin(queryDTO));
    }

    // 订单详情接口会在 service 层按角色做进一步权限控制。
    @Operation(summary = "订单详情")
    @GetMapping("/{id}")
    public Result<Order> detail(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(orderService.getDetail(id, userId));
    }

    // 当前项目采用模拟支付，便于教学演示完整订单流转。
    @Operation(summary = "支付订单 (模拟)")
    @PostMapping("/{id}/pay")
    public Result pay(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        boolean success = orderService.payOrder(id, userId);
        return success ? Result.success(null, "支付成功") : Result.failed("支付失败");
    }

    // ========================= 商家与用户订单流转 =========================

    // 发货后订单会进入配送或待收货流程，是商家端的核心操作之一。
    @Operation(summary = "商家发货")
    @PostMapping("/{id}/ship")
    public Result ship(@PathVariable Long id) {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        // 校验角色是否为商家
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("无权操作：非商家账号");
        }
        
        boolean success = orderService.shipOrder(id, sellerId);
        return success ? Result.success(null, "发货成功") : Result.failed("发货失败");
    }

    @Operation(summary = "确认收货")
    @PostMapping("/{id}/receive")
    public Result receive(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        boolean success = orderService.receiveOrder(id, userId);
        return success ? Result.success(null, "收货成功") : Result.failed("收货失败");
    }

    // 药师、管理员和商家都可以查看待审核订单，但查询范围不同。
    @Operation(summary = "待审核订单列表 (药师/商家)")
    @GetMapping("/audit/list")
    public Result<IPage<Order>> auditList(OrderQueryDTO queryDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        String role = UserContext.getRole();
        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return Result.failed("无权操作");
        }
        
        if ("SELLER".equals(role)) {
            queryDTO.setSellerId(userId);
        }
        
        return Result.success(orderService.pageAuditList(queryDTO));
    }

    // 这组审核接口覆盖处方审核、取消订单、退款申请和退款处理等高风险流转。
    @Operation(summary = "审核订单 (药师/商家)")
    @PostMapping("/audit")
    public Result audit(@Valid @RequestBody OrderAuditDTO auditDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        String role = UserContext.getRole();
        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return Result.failed("无权操作");
        }
        
        if ("SELLER".equals(role)) {
            // 商家只能审核自己店铺下的订单。
            Order order = orderService.getById(auditDTO.getOrderId());
            if (order == null) {
                return Result.failed("订单不存在");
            }
            if (!userId.equals(order.getSellerId())) {
                return Result.failed("无权审核此订单");
            }
        }
        
        boolean success = orderService.auditOrder(auditDTO.getOrderId(), auditDTO.getPass(), auditDTO.getReason());
        return success ? Result.success(null, "审核完成") : Result.failed("审核失败");
    }

    @Operation(summary = "取消订单")
    @PostMapping("/{id}/cancel")
    public Result cancel(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 先通过详情查询触发 service 层的归属校验。
        orderService.getDetail(id, userId);
        
        boolean success = orderService.cancelOrder(id);
        return success ? Result.success(null, "取消成功") : Result.failed("取消失败");
    }

    @Operation(summary = "申请退款")
    @PostMapping("/{id}/refund")
    public Result applyRefund(@PathVariable Long id, @RequestBody Map<String, String> params) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        // 申请售后前先确认订单确实属于当前用户。
        orderService.getDetail(id, userId);
        
        String reason = params.get("reason");
        boolean success = orderService.applyRefund(id, reason);
        return success ? Result.success(null, "申请成功") : Result.failed("申请失败");
    }

    @Operation(summary = "处理退款 (商家)")
    @PostMapping("/{id}/refund/process")
    public Result processRefund(@PathVariable Long id, @RequestBody Map<String, Object> params) {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("无权操作");
        }
        
        Integer status = (Integer) params.get("status");
        String remark = (String) params.get("remark");
        // 前端约定 status=1 表示同意退款，其他值按拒绝处理。
        boolean agree = status != null && status == 1;
        
        boolean success = orderService.processRefund(id, agree, remark);
        return success ? Result.success(null, "处理完成") : Result.failed("处理失败");
    }

    @Operation(summary = "审核订单 (URL参数)")
    @PostMapping("/{id}/audit")
    public Result auditWithId(@PathVariable Long id, @RequestBody Map<String, Object> params) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        String role = UserContext.getRole();
        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return Result.failed("无权操作");
        }
        
        if ("SELLER".equals(role)) {
            // 商家只能审核自己店铺下的订单。
            Order order = orderService.getById(id);
            if (order == null) {
                return Result.failed("订单不存在");
            }
            if (!userId.equals(order.getSellerId())) {
                return Result.failed("无权审核此订单");
            }
        }
        
        Integer status = (Integer) params.get("status");
        String reason = (String) params.get("reason");
        // 前端约定 status=1 表示审核通过，其他值按拒绝处理。
        boolean pass = status != null && status == 1;
        
        boolean success = orderService.auditOrder(id, pass, reason);
        return success ? Result.success(null, "审核完成") : Result.failed("审核失败");
    }
}
