package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.MedicineCommentService;
import com.zhijian.pojo.medicine.entity.MedicineComment;
import com.zhijian.mapper.MedicineCommentMapper;
import com.zhijian.dto.medicine.MedicineCommentCreateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 药品评价服务实现类
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
public class MedicineCommentServiceImpl extends ServiceImpl<MedicineCommentMapper, MedicineComment> implements MedicineCommentService {

    /**
     * 发表评价
     *
     * @param dto 评价创建DTO
     * @return 是否成功
     */
    @Override
    public boolean createComment(MedicineCommentCreateDTO dto) {
        MedicineComment comment = new MedicineComment();
        comment.setOrderId(dto.getOrderId());
        comment.setMedicineId(dto.getMedicineId());
        comment.setUserId(dto.getUserId());
        comment.setUserName(dto.getUserName());
        comment.setUserAvatar(dto.getUserAvatar());
        comment.setStar(dto.getStar());
        comment.setContent(dto.getContent());
        comment.setImages(dto.getImages());
        
        return this.save(comment);
    }

    /**
     * 分页查询药品评价列表
     *
     * @param medicineId 药品ID
     * @param page       页码
     * @param size       每页大小
     * @return 评价列表分页结果
     */
    @Override
    public IPage<MedicineComment> pageList(Long medicineId, Integer page, Integer size) {
        Page<MedicineComment> pageParam = new Page<>(page, size);
        return this.page(pageParam, new LambdaQueryWrapper<MedicineComment>()
                .eq(MedicineComment::getMedicineId, medicineId)
                .orderByDesc(MedicineComment::getCreateTime));
    }

    /**
     * 分页查询用户自己的评价列表
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页大小
     * @return 用户评价列表分页结果
     */
    @Override
    public IPage<MedicineComment> pageListByUserId(Long userId, Integer page, Integer size) {
        return baseMapper.selectPageByUserId(new Page<>(page, size), userId);
    }

    /**
     * 分页查询商家收到的评价列表
     *
     * @param sellerId 商家ID (对应 Medicine 表中的 sellerId / User 表中的 ID)
     * @param page     页码
     * @param size     每页大小
     * @return 商家评价列表分页结果
     */
    @Override
    public IPage<MedicineComment> pageListBySellerId(Long sellerId, Integer page, Integer size) {
        // 由于 MedicineComment 表没有直接存 sellerId，我们需要通过 medicineId 关联查询
        // 或者，我们在 MedicineComment 中冗余 sellerId？
        // 考虑到 MVP，且 MedicineComment 实体没有 sellerId，我们可能需要联表查询。
        // 但 MyBatis-Plus LambdaQueryWrapper 不支持联表。
        // 方案1：先查商家的所有 medicineId，再查 comment。
        // 方案2：在 MedicineComment 中加 sellerId (需要改表结构，比较麻烦)。
        // 方案3：自定义 Mapper XML SQL。
        
        // 采用方案1：先查商家的 medicineId
        // 注入 MedicineService? 循环依赖风险。
        // 我们可以直接用 MedicineMapper
        
        // 实际上，这里我们可以简单点，假设 comment 表里没有 sellerId。
        // 为了方便，我们用自定义 SQL 比较好。但这里没有 Mapper XML。
        // 让我们看看能不能注入 MedicineMapper。
        
        // 既然在 ServiceImpl，我们可以注入 MedicineMapper。
        return baseMapper.selectPageBySellerId(new Page<>(page, size), sellerId);
    }

    @Override
    public boolean replyComment(Long id, String content) {
        MedicineComment comment = this.getById(id);
        if (comment == null) {
            throw new RuntimeException("评价不存在");
        }
        comment.setReply(content);
        comment.setReplyTime(java.time.LocalDateTime.now());
        return this.updateById(comment);
    }
}

