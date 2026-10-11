package com.badminton.modules.auth.mapper;

import com.badminton.modules.auth.mapper.fallback.UserMapperFallbackImpl;
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
