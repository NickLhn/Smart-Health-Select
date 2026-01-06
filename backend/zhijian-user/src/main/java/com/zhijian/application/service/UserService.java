package com.zhijian.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.user.entity.SysUser;
import com.zhijian.interfaces.dto.user.UserLoginDTO;
import com.zhijian.interfaces.dto.user.UserQueryDTO;
import com.zhijian.interfaces.dto.user.UserRegisterDTO;
import com.zhijian.interfaces.dto.user.UserResetPasswordDTO;
import com.zhijian.interfaces.dto.user.UserUpdateDTO;

/**
 * 用户服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface UserService extends IService<SysUser> {

    /**
     * 用户登录
     * @param loginDTO 登录参数
     * @return 登录结果(包含Token)
     */
    Result login(UserLoginDTO loginDTO);

    /**
     * 用户注册
     * 
     * @param registerDTO 注册信息
     * @return 注册结果
     */
    Result register(UserRegisterDTO registerDTO);

    /**
     * 重置密码
     * 
     * @param resetPasswordDTO 重置密码信息
     * @return 结果
     */
    Result resetPassword(UserResetPasswordDTO resetPasswordDTO);

    /**
     * 根据用户名查询用户
     * @param username 用户名
     * @return 用户实体
     */
    SysUser getByUsername(String username);

    /**
     * 更新用户信息
     * @param userId 用户ID
     * @param updateDTO 更新参数
     * @return 结果
     */
    Result updateInfo(Long userId, UserUpdateDTO updateDTO);

    /**
     * 修改密码
     * @param userId 用户ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     * @return 结果
     */
    Result updatePassword(Long userId, String oldPassword, String newPassword);

    /**
     * 分页查询用户 (管理端)
     * @param query 查询参数
     * @return 分页结果
     */
    IPage<SysUser> pageList(UserQueryDTO query);

    /**
     * 更新用户状态 (管理端)
     * @param id 用户ID
     * @param status 状态
     * @return 是否成功
     */
    boolean updateStatus(Long id, Integer status);
}
