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

@Service
@RequiredArgsConstructor
public class MedicineCommentServiceImpl extends ServiceImpl<MedicineCommentMapper, MedicineComment> implements MedicineCommentService {

    @Override
    public boolean createComment(MedicineCommentCreateDTO dto) {
        // 把评价 DTO 落成数据库实体。
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

    @Override
    public IPage<MedicineComment> pageList(Long medicineId, Integer page, Integer size) {
        // 按药品分页查看评价，默认按时间倒序。
        Page<MedicineComment> pageParam = new Page<>(page, size);
        return this.page(pageParam, new LambdaQueryWrapper<MedicineComment>()
                .eq(MedicineComment::getMedicineId, medicineId)
                .orderByDesc(MedicineComment::getCreateTime));
    }

    @Override
    public IPage<MedicineComment> pageListByUserId(Long userId, Integer page, Integer size) {
        return baseMapper.selectPageByUserId(new Page<>(page, size), userId);
    }

    @Override
    public IPage<MedicineComment> pageListBySellerId(Long sellerId, Integer page, Integer size) {
        // 商家评价列表通过自定义 SQL 按 sellerId 做联查。
        return baseMapper.selectPageBySellerId(new Page<>(page, size), sellerId);
    }

    @Override
    public boolean replyComment(Long id, String content) {
        // 商家回复评价时补上回复时间，便于前端展示。
        MedicineComment comment = this.getById(id);
        if (comment == null) {
            throw new RuntimeException("评价不存在");
        }
        comment.setReply(content);
        comment.setReplyTime(java.time.LocalDateTime.now());
        return this.updateById(comment);
    }
}
