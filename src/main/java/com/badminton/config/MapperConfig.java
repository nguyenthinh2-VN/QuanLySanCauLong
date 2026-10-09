package com.badminton.config;

import com.badminton.mapper.UserMapper;
import com.badminton.mapper.fallback.UserMapperFallbackImpl;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MapperConfig {

    @Bean
    @ConditionalOnMissingBean(UserMapper.class)
    public UserMapper userMapper() {
        return new UserMapperFallbackImpl();
    }
}
