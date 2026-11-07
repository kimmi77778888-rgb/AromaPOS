package com.example.demo.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * SecurityHeadersFilter
 * Injects essential defense-in-depth HTTP security headers into every API response
 * to protect against clickjacking, MIME-sniffing, XSS, and unauthorized caching.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (response instanceof HttpServletResponse httpResponse) {
            // Anti-MIME sniffing: Prevents browser from interpreting files as something else
            httpResponse.setHeader("X-Content-Type-Options", "nosniff");

            // Anti-Clickjacking: Disallow embedding in external frames
            httpResponse.setHeader("X-Frame-Options", "DENY");

            // Browser-level XSS protection filter
            httpResponse.setHeader("X-XSS-Protection", "1; mode=block");

            // Referrer policy
            httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

            // Prevent caching of sensitive financial & POS API endpoints
            if (request instanceof HttpServletRequest httpRequest) {
                String uri = httpRequest.getRequestURI();
                if (uri != null && uri.startsWith("/api/")) {
                    httpResponse.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
                    httpResponse.setHeader("Pragma", "no-cache");
                    httpResponse.setHeader("Expires", "0");
                }
            }
        }

        chain.doFilter(request, response);
    }
}
