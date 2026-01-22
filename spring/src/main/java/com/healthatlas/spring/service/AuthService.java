package com.healthatlas.spring.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.healthatlas.spring.dto.AuthResponse;
import com.healthatlas.spring.dto.SignInRequest;
import com.healthatlas.spring.dto.SignUpRequest;
import com.healthatlas.spring.model.User;
import com.healthatlas.spring.repository.UserRepository;
import com.healthatlas.spring.security.JwtUtil;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse signup(SignUpRequest request) {

        // ❌ email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email already in use"
            );
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        // ✅ success response
        return new AuthResponse(
                null,
                "User created successfully",
                user.getName()
        );
    }

    public AuthResponse signin(SignInRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid credentials"
                ));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid credentials"
            );
        }

        String token = jwtUtil.generateToken(user.getEmail());

        // ✅ success response
        return new AuthResponse(
                token,
                "Login successful",
                user.getName()
        );
    }
}
