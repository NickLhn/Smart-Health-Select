package com.zhijian.application.service;

import com.zhijian.common.result.Result;
import com.zhijian.domain.user.entity.SysUser;
import com.zhijian.infrastructure.persistence.mapper.SysUserMapper;
import com.zhijian.application.service.impl.UserServiceImpl;
import com.zhijian.interfaces.dto.user.UserLoginDTO;
import com.zhijian.interfaces.dto.user.UserRegisterDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import cn.hutool.crypto.digest.BCrypt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * UserService 单元测试
 * 
 * @author TraeAI
 * @since 1.0.0
 */
public class UserServiceTest {

    @InjectMocks
    private UserServiceImpl userService;

    @Mock
    private SysUserMapper userMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("测试用户注册 - 成功")
    void testRegisterSuccess() {
        // 模拟数据库中没有该用户名
        when(userMapper.selectOne(any())).thenReturn(null);
        when(userMapper.insert(any())).thenReturn(1);

        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("testuser");
        dto.setPassword("123456");
        dto.setMobile("13800000000");
        dto.setRole("USER");

        Result result = userService.register(dto);
        
        assertEquals(200, result.getCode());
        assertEquals("注册成功", result.getMessage());
    }

    @Test
    @DisplayName("测试用户注册 - 用户名已存在")
    void testRegisterFailDuplicate() {
        // 模拟数据库中已存在该用户名
        when(userMapper.selectOne(any())).thenReturn(new SysUser());

        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setUsername("testuser");
        dto.setPassword("123456");

        Result result = userService.register(dto);
        
        assertEquals(500, result.getCode());
        assertEquals("用户名已存在", result.getMessage());
    }

    @Test
    @DisplayName("测试用户登录 - 成功")
    void testLoginSuccess() {
        // 模拟数据库中的用户
        SysUser mockUser = new SysUser();
        mockUser.setId(1L);
        mockUser.setUsername("admin");
        // 生成一个加密密码
        mockUser.setPassword(BCrypt.hashpw("123456", BCrypt.gensalt()));
        mockUser.setStatus(1);

        when(userMapper.selectOne(any())).thenReturn(mockUser);

        UserLoginDTO dto = new UserLoginDTO();
        dto.setUsername("admin");
        dto.setPassword("123456");

        Result result = userService.login(dto);
        
        assertEquals(200, result.getCode());
        assertEquals("登录成功", result.getMessage());
        assertNotNull(result.getData());
    }

    @Test
    @DisplayName("测试用户登录 - 密码错误")
    void testLoginFailWrongPassword() {
        SysUser mockUser = new SysUser();
        mockUser.setUsername("admin");
        mockUser.setPassword(BCrypt.hashpw("123456", BCrypt.gensalt()));
        mockUser.setStatus(1);

        when(userMapper.selectOne(any())).thenReturn(mockUser);

        UserLoginDTO dto = new UserLoginDTO();
        dto.setUsername("admin");
        dto.setPassword("wrongpassword");

        Result result = userService.login(dto);
        
        assertEquals(500, result.getCode());
        assertEquals("密码错误", result.getMessage());
    }
}
