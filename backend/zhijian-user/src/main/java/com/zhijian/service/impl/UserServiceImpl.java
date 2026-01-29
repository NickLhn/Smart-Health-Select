package com.zhijian.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhijian.service.UserService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.mapper.SysUserMapper;
import com.zhijian.dto.user.UserLoginDTO;
import com.zhijian.dto.user.UserQueryDTO;
import com.zhijian.dto.user.UserRegisterDTO;
import com.zhijian.dto.user.UserResetPasswordDTO;
import com.zhijian.dto.user.UserUpdateDTO;
import com.zhijian.common.util.JwtUtil;
import com.zhijian.common.util.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements UserService {

    private final SysUserMapper userMapper;
    private final RedisUtil redisUtil;

    @Override
    /**
     * 用户登录
     *
     * @param loginDTO 登录参数
     * @return 登录结果
     */
    public Result login(UserLoginDTO loginDTO) {
        SysUser user = null;

        // 手机号验证码登录
        if (StrUtil.isNotBlank(loginDTO.getMobile()) && StrUtil.isNotBlank(loginDTO.getCaptcha())) {
            // 校验验证码
            String cacheCode = redisUtil.get("sms:code:" + loginDTO.getMobile());
            if (StrUtil.isBlank(cacheCode) || !cacheCode.equals(loginDTO.getCaptcha())) {
                return Result.failed("验证码错误或已过期");
            }
            // 验证通过后删除验证码
            redisUtil.delete("sms:code:" + loginDTO.getMobile());
            
            user = getByMobile(loginDTO.getMobile());
            if (user == null) {
                 return Result.failed("用户不存在");
            }
        
        } else {
            // 账号密码登录
            String account = loginDTO.getUsername();
            // 优先根据用户名查询
            user = getByUsername(account);
            // 如果用户名查不到，尝试根据手机号查询（支持手机号+密码登录）
            if (user == null) {
                user = getByMobile(account);
            }
            
            if (user == null) {
                return Result.failed("用户不存在");
            }
            if (!BCrypt.checkpw(loginDTO.getPassword(), user.getPassword())) {
                return Result.failed("密码错误");
            }
        }

        
        // 校验角色权限
        if (StrUtil.isNotBlank(loginDTO.getRole()) && !loginDTO.getRole().equals(user.getRole())) {
            return Result.failed("角色权限不匹配，禁止登录");
        }

        if (user.getStatus() == 0) {
            return Result.failed("账号已被禁用");
        }

        // 生成真实的 JWT Token
        String token = JwtUtil.generateToken(user.getId(), user.getRole());
        
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userInfo", user);
        
        return Result.success(data, "登录成功");
    }

    @Override
    /**
     * 重置密码
     *
     * @param resetPasswordDTO 重置参数
     * @return 结果
     */
    public Result resetPassword(UserResetPasswordDTO resetPasswordDTO) {
        // 校验验证码
        String cacheCode = redisUtil.get("sms:code:" + resetPasswordDTO.getMobile());
        if (StrUtil.isBlank(cacheCode) || !cacheCode.equals(resetPasswordDTO.getCaptcha())) {
            return Result.failed("验证码错误或已过期");
        }
        // 验证通过后删除验证码
        redisUtil.delete("sms:code:" + resetPasswordDTO.getMobile());

        SysUser user = getByMobile(resetPasswordDTO.getMobile());
        if (user == null) {
            return Result.failed("用户不存在");
        }
        
        // 校验角色 (可选)
        if (StrUtil.isNotBlank(resetPasswordDTO.getRole()) && !resetPasswordDTO.getRole().equals(user.getRole())) {
            return Result.failed("用户角色不匹配");
        }

        user.setPassword(BCrypt.hashpw(resetPasswordDTO.getNewPassword(), BCrypt.gensalt()));
        this.updateById(user);
        return Result.success(null, "密码重置成功");
    }

    @Override
    /**
     * 用户注册
     *
     * @param registerDTO 注册参数
     * @return 结果
     */
    public Result register(UserRegisterDTO registerDTO) {
        // 使用 count 检查，避免 TooManyResultsException
        Long usernameCount = userMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, registerDTO.getUsername()));
        if (usernameCount > 0) {
            return Result.failed("用户名已存在");
        }
        
        Long mobileCount = userMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getMobile, registerDTO.getMobile()));
        if (mobileCount > 0) {
            return Result.failed("手机号已被注册");
        }

        try {
            SysUser user = new SysUser();
            user.setUsername(registerDTO.getUsername());
            // 密码加密
            user.setPassword(BCrypt.hashpw(registerDTO.getPassword(), BCrypt.gensalt()));
            user.setMobile(registerDTO.getMobile());
            user.setRole(registerDTO.getRole());
            user.setStatus(1); // 默认启用
            
            userMapper.insert(user);
            return Result.success(null, "注册成功");
        } catch (Exception e) {
            log.error("注册失败", e);
            return Result.failed("系统内部错误: " + e.getMessage());
        }
    }

    @Override
    /**
     * 根据用户名查询用户
     *
     * @param username 用户名
     * @return 用户实体
     */
    public SysUser getByUsername(String username) {
        // 使用 selectList 获取所有匹配的用户
        java.util.List<SysUser> users = userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)
                .orderByDesc(SysUser::getCreateTime)); // 按创建时间倒序
        
        if (users != null && !users.isEmpty()) {
            // 如果存在多个，记录警告日志并返回最新创建的那个
            if (users.size() > 1) {
                log.warn("Found {} users with username {}, returning the latest one.", users.size(), username);
            }
            return users.get(0);
        }
        return null;
    }

    /**
     * 根据手机号查询用户
     *
     * @param mobile 手机号
     * @return 用户实体
     */
    public SysUser getByMobile(String mobile) {
        // 使用 selectList 获取所有匹配的用户
        java.util.List<SysUser> users = userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getMobile, mobile)
                .orderByDesc(SysUser::getCreateTime)); // 按创建时间倒序
        
        if (users != null && !users.isEmpty()) {
            // 如果存在多个，记录警告日志并返回最新创建的那个
            if (users.size() > 1) {
                log.warn("Found {} users with mobile {}, returning the latest one.", users.size(), mobile);
            }
            return users.get(0);
        }
        return null;
    }

    @Override
    /**
     * 更新个人资料
     *
     * @param userId    用户ID
     * @param updateDTO 更新参数
     * @return 结果
     */
    public Result updateInfo(Long userId, UserUpdateDTO updateDTO) {
        SysUser user = this.getById(userId);
        if (user == null) {
            return Result.failed("用户不存在");
        }

        if (StrUtil.isNotBlank(updateDTO.getNickname())) {
            user.setNickname(updateDTO.getNickname());
        }
        if (StrUtil.isNotBlank(updateDTO.getMobile())) {
            user.setMobile(updateDTO.getMobile());
        }
        if (StrUtil.isNotBlank(updateDTO.getAvatar())) {
            user.setAvatar(updateDTO.getAvatar());
        }

        this.updateById(user);
        return Result.success(null, "修改成功");
    }

    @Override
    /**
     * 修改密码
     *
     * @param userId      用户ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     * @return 结果
     */
    public Result updatePassword(Long userId, String oldPassword, String newPassword) {
        SysUser user = this.getById(userId);
        if (user == null) {
            return Result.failed("用户不存在");
        }
        if (!BCrypt.checkpw(oldPassword, user.getPassword())) {
            return Result.failed("旧密码错误");
        }

        user.setPassword(BCrypt.hashpw(newPassword, BCrypt.gensalt()));
        this.updateById(user);
        return Result.success(null, "修改成功");
    }

    @Override
    public IPage<SysUser> pageList(UserQueryDTO query) {
        Page<SysUser> page = new Page<>(query.getPage(), query.getSize());
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        
        // 关键词搜索：用户名、昵称、手机号
        if (StrUtil.isNotBlank(query.getKeyword())) {
            wrapper.and(w -> w.like(SysUser::getUsername, query.getKeyword())
                    .or().like(SysUser::getNickname, query.getKeyword())
                    .or().like(SysUser::getMobile, query.getKeyword()));
        }
        
        // 角色筛选
        wrapper.eq(StrUtil.isNotBlank(query.getRole()), SysUser::getRole, query.getRole());
        
        // 状态筛选
        wrapper.eq(query.getStatus() != null, SysUser::getStatus, query.getStatus());
        
        wrapper.orderByDesc(SysUser::getCreateTime);
        
        IPage<SysUser> result = userMapper.selectPage(page, wrapper);
        // 脱敏处理
        result.getRecords().forEach(u -> u.setPassword(null));
        return result;
    }

    @Override
    /**
     * 更新用户状态
     *
     * @param id     用户ID
     * @param status 状态
     * @return 是否成功
     */
    public boolean updateStatus(Long id, Integer status) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        return updateById(user);
    }
}

