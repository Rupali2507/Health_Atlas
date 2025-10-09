package com.healthatlas.spring.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()        // disable CSRF
            .authorizeHttpRequests()
            .requestMatchers("/api/csv/**").permitAll() // allow all CSV endpoints
            .anyRequest().authenticated()
            .and()
            .httpBasic().disable();  // disable basic auth

        return http.build();
    }
}
