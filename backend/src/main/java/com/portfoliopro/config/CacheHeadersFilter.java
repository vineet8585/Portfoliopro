package com.portfoliopro.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.regex.Pattern;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CacheHeadersFilter extends OncePerRequestFilter {
    private static final Pattern HASHED_ASSET = Pattern.compile(".*[.-][A-Za-z0-9_-]{8,}\\.(js|css|woff2?|png|svg|webp)$", Pattern.CASE_INSENSITIVE);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/api/")) {
            response.setHeader("Cache-Control", "no-store");
        } else if (path.equals("/") || path.endsWith("/index.html")) {
            response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (HASHED_ASSET.matcher(path).matches()) {
            response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (path.contains(".")) {
            response.setHeader("Cache-Control", "public, max-age=60, must-revalidate");
        }
        chain.doFilter(request, response);
    }
}
