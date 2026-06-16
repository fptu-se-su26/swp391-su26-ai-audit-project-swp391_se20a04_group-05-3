package com.greenlife.service;

import com.greenlife.dto.*;
import com.greenlife.entity.Role;
import com.greenlife.entity.User;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.RoleRepository;
import com.greenlife.repository.UserRepository;
import com.greenlife.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate role for public registration
        String requestedRole = request.getRole().toUpperCase();
        if (!"CUSTOMER".equals(requestedRole) && !"STORE_OWNER".equals(requestedRole)) {
            throw new CustomException("Đăng ký vai trò này không được phép trên hệ thống công cộng", HttpStatus.BAD_REQUEST);
        }

        // Check unique email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException("Email đã được sử dụng bởi tài khoản khác", HttpStatus.BAD_REQUEST);
        }

        // Get Role entity
        Role roleEntity = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new CustomException("Vai trò " + requestedRole + " không tồn tại trong hệ thống", HttpStatus.BAD_REQUEST));

        // Create User entity
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(roleEntity)
                .status("ACTIVE") // Both CUSTOMER and STORE_OWNER are active by default
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String jwtToken = jwtService.generateToken(savedUser);

        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToUserResponse(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find user first to check status
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không chính xác"));

        // Check status
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new CustomException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", HttpStatus.FORBIDDEN);
        }

        // Authenticate
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }

        // Generate JWT token
        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToUserResponse(user))
                .build();
    }

    public UserResponse getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .emailVerified(user.getEmailVerified())
                .build();
    }
}
