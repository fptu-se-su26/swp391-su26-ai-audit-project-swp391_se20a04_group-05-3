package com.greenlife.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${greenlife.jwt.secret}")
    private String secretKey;

    @Value("${greenlife.jwt.reset-secret}")
    private String resetSecretKey;

    @Value("${greenlife.jwt.expiration}")
    private long jwtExpiration;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret key must be at least 256 bits (32 bytes) long");
        }
        byte[] resetKeyBytes = Decoders.BASE64.decode(resetSecretKey);
        if (resetKeyBytes.length < 32) {
            throw new IllegalStateException("JWT reset secret key must be at least 256 bits (32 bytes) long");
        }
    }

    public String generatePasswordResetToken(com.greenlife.user.entity.User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("passHash", user.getPasswordHash());

        byte[] keyBytes = Decoders.BASE64.decode(resetSecretKey);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail())
                .issuer("greenlife")
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 180000)) // 3 minutes
                .signWith(key)
                .compact();
    }

    public String extractEmailFromResetToken(String token) {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(resetSecretKey);
            SecretKey key = Keys.hmacShaKeyFor(keyBytes);

            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer("greenlife")
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (Exception e) {
            throw new com.greenlife.exception.CustomException("Invalid or expired password reset token",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }
    }

    public void verifyPasswordResetToken(String token, String currentDbPasswordHash) {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(resetSecretKey);
            SecretKey key = Keys.hmacShaKeyFor(keyBytes);

            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer("greenlife")
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // Check expiration
            if (claims.getExpiration().before(new Date())) {
                throw new com.greenlife.exception.CustomException("Password reset token has expired",
                        org.springframework.http.HttpStatus.BAD_REQUEST);
            }

            // Check one-time use claim
            String tokenPassHash = claims.get("passHash", String.class);
            if (tokenPassHash == null || !tokenPassHash.equals(currentDbPasswordHash)) {
                throw new com.greenlife.exception.CustomException(
                        "Password reset token is invalid or has already been used",
                        org.springframework.http.HttpStatus.BAD_REQUEST);
            }
        } catch (com.greenlife.exception.CustomException ce) {
            throw ce;
        } catch (Exception e) {
            throw new com.greenlife.exception.CustomException("Invalid or expired password reset token",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }
    }

    @SuppressWarnings("null")
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration) {
        return Jwts
                .builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuer("greenlife")
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    @SuppressWarnings("null")
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parser()
                .verifyWith(getSignInKey())
                .requireIssuer("greenlife")
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
