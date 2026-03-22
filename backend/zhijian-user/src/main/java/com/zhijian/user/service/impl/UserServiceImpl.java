package com.zhijian.user.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhijian.user.service.UserService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.SysUser;
import com.zhijian.user.mapper.SysUserMapper;
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

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements UserService {

    private final SysUserMapper userMapper;
    private final RedisUtil redisUtil;

    // ========================= 登录与认证 =========================

    @Override
    public Result login(UserLoginDTO loginDTO) {
        SysUser user = null;

        // 支持手机号 + 验证码登录，适合注册后快速登录和找回密码场景。
        if (StrUtil.isNotBlank(loginDTO.getMobile()) && StrUtil.isNotBlank(loginDTO.getCaptcha())) {
            String cacheCode = redisUtil.get("sms:code:" + loginDTO.getMobile());
            if (StrUtil.isBlank(cacheCode) || !cacheCode.equals(loginDTO.getCaptcha())) {
                return Result.failed("验证码错误或已过期");
            }
            redisUtil.delete("sms:code:" + loginDTO.getMobile());
            
            user = getByMobile(loginDTO.getMobile());
            if (user == null) {
                 return Result.failed("用户不存在");
            }
        
        } else {
            // 账号密码登录同时兼容“用户名登录”和“手机号登录”。
            String account = loginDTO.getUsername();
            user = getByUsername(account);
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

        // 同一个账号可能被多个端共用，这里通过 role 限制实际登录入口。
        if (StrUtil.isNotBlank(loginDTO.getRole()) && !loginDTO.getRole().equals(user.getRole())) {
            return Result.failed("角色权限不匹配，禁止登录");
        }

        if (user.getStatus() == 0) {
            return Result.failed("账号已被禁用");
        }

        // 登录成功后签发 JWT，并把用户信息一起返回给前端。
        String token = JwtUtil.generateToken(user.getId(), user.getRole());
        
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userInfo", user);
        
        return Result.success(data, "登录成功");
    }

    @Override
    public Result resetPassword(UserResetPasswordDTO resetPasswordDTO) {
        String cacheCode = redisUtil.get("sms:code:" + resetPasswordDTO.getMobile());
        if (StrUtil.isBlank(cacheCode) || !cacheCode.equals(resetPasswordDTO.getCaptcha())) {
            return Result.failed("验证码错误或已过期");
        }
        redisUtil.delete("sms:code:" + resetPasswordDTO.getMobile());

        SysUser user = getByMobile(resetPasswordDTO.getMobile());
        if (user == null) {
            return Result.failed("用户不存在");
        }
        
        // 如果前端显式传了 role，则顺带校验一下端侧身份。
        if (StrUtil.isNotBlank(resetPasswordDTO.getRole()) && !resetPasswordDTO.getRole().equals(user.getRole())) {
            return Result.failed("用户角色不匹配");
        }

        user.setPassword(BCrypt.hashpw(resetPasswordDTO.getNewPassword(), BCrypt.gensalt()));
        this.updateById(user);
        return Result.success(null, "密码重置成功");
    }

    @Override
    public Result register(UserRegisterDTO registerDTO) {
        // 注册前先做用户名和手机号唯一性校验，避免脏数据进入系统。
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

    // ========================= 用户查询与资料维护 =========================

    @Override
    public SysUser getByUsername(String username) {
        java.util.List<SysUser> users = userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)
                .orderByDesc(SysUser::getCreateTime));
        
        if (users != null && !users.isEmpty()) {
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
        java.util.List<SysUser> users = userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getMobile, mobile)
                .orderByDesc(SysUser::getCreateTime));
        
        if (users != null && !users.isEmpty()) {
            if (users.size() > 1) {
                log.warn("Found {} users with mobile {}, returning the latest one.", users.size(), mobile);
            }
            return users.get(0);
        }
        return null;
    }

    @Override
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
        
        // 管理端支持按用户名、昵称、手机号做模糊搜索。
        if (StrUtil.isNotBlank(query.getKeyword())) {
            wrapper.and(w -> w.like(SysUser::getUsername, query.getKeyword())
                    .or().like(SysUser::getNickname, query.getKeyword())
                    .or().like(SysUser::getMobile, query.getKeyword()));
        }
        
        wrapper.eq(StrUtil.isNotBlank(query.getRole()), SysUser::getRole, query.getRole());
        
        wrapper.eq(query.getStatus() != null, SysUser::getStatus, query.getStatus());
        
        wrapper.orderByDesc(SysUser::getCreateTime);
        
        IPage<SysUser> result = userMapper.selectPage(page, wrapper);
        // 列表返回前统一脱敏，避免密码字段被误传到前端。
        result.getRecords().forEach(u -> u.setPassword(null));
        return result;
    }

    @Override
    public boolean updateStatus(Long id, Integer status) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        return updateById(user);
    }
}
