package com.cvai.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AppConfig {

    /**
     * Shared HTTP client for Gemini / YouTube / JSearch. Explicit timeouts so a hung
     * upstream can never pin a request thread forever (the default is "no timeout").
     */
    @Bean
    public RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(120_000); // multimodal CV analysis can legitimately take a while
        return RestClient.builder().requestFactory(factory).build();
    }
}
