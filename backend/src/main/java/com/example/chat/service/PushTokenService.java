package com.example.chat.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.chat.DTO.PushTokenRequest;
import com.example.chat.entity.PushToken;
import com.example.chat.entity.User;
import com.example.chat.exception.BusinessException;
import com.example.chat.repository.PushTokenRepository;
import com.example.chat.repository.UserRepository;

@Service
public class PushTokenService {

    @Autowired
    private PushTokenRepository pushTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileService userProfileService;

    @Transactional
    public void registerCurrentUserToken(PushTokenRequest request) {
        String currentUserEmail = userProfileService.getCurrentUserEmail();
        User user = userRepository.findByEmail(currentUserEmail)
            .orElseThrow(() -> new BusinessException("User not found"));

        String normalizedToken = request.getToken().trim();
        PushToken pushToken = pushTokenRepository.findByToken(normalizedToken).orElseGet(PushToken::new);

        pushToken.setUser(user);
        pushToken.setToken(normalizedToken);
        pushToken.setUserAgent(request.getUserAgent());
        pushToken.setLastSeenAt(LocalDateTime.now());

        pushTokenRepository.save(pushToken);
    }

    @Transactional
    public void unregisterCurrentUserToken(String token) {
        String normalizedToken = token == null ? "" : token.trim();
        if (normalizedToken.isBlank()) {
            return;
        }

        String currentUserEmail = userProfileService.getCurrentUserEmail();
        pushTokenRepository.findByToken(normalizedToken).ifPresent((pushToken) -> {
            if (pushToken.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
                pushTokenRepository.delete(pushToken);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<String> getTokensForUser(String email) {
        return pushTokenRepository.findAllByUserEmail(email).stream()
            .map(PushToken::getToken)
            .distinct()
            .toList();
    }

    @Transactional
    public void deleteToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        pushTokenRepository.findByToken(token.trim()).ifPresent(pushTokenRepository::delete);
    }
}
