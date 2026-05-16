package com.example.chat.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.chat.DTO.PasswordChangeRequest;
import com.example.chat.DTO.UserProfileResponse;
import com.example.chat.DTO.UserProfileUpdateRequest;
import com.example.chat.entity.User;
import com.example.chat.entity.UserConnection;
import com.example.chat.entity.UserConnection.ConnectionStatus;
import com.example.chat.exception.BusinessException;
import com.example.chat.repository.UserConnectionRepository;
import com.example.chat.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class UserProfileService {
    private static final String RESET_OTP_PREFIX = "reset-otp:";
    private static final String RESET_RATE_LIMIT_PREFIX = "reset-ratelimit:";
    private static final int RESET_OTP_EXPIRY_MINUTES = 10;
    private static final int RESET_RATE_LIMIT_SECONDS = 60;
    private static final Duration ONLINE_WINDOW = Duration.ofSeconds(45);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserConnectionRepository userConnectionRepository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    private record RelationshipFlags(boolean connected, boolean requestSent, boolean requestReceived) {
        private static RelationshipFlags none() {
            return new RelationshipFlags(false, false, false);
        }
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("User not found"));
    }

    public String getCurrentUserEmail() {
        return getCurrentUser().getEmail();
    }

    public UserProfileResponse getMyProfile() {
        User user = getCurrentUser();
        return convertToResponse(user, RelationshipFlags.none(), true);
    }

    @Transactional
    public UserProfileResponse updateProfile(UserProfileUpdateRequest request) {
        User user = getCurrentUser();

        if (request.getName() != null && !request.getName().isEmpty()) {
            user.setName(request.getName());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        userRepository.save(user);
        return convertToResponse(user, RelationshipFlags.none(), true);
    }

    @Transactional
    public String changePassword(PasswordChangeRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException("current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return "password changed successfully";
    }

    public String forgotPassword(String email) {
        userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("User not found with this email"));

        String rateLimitKey = RESET_RATE_LIMIT_PREFIX + email;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(rateLimitKey))) {
            throw new BusinessException("Please wait 60 seconds before requesting another OTP");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        redisTemplate.opsForValue().set(
            RESET_OTP_PREFIX + email,
            otp,
            Duration.ofMinutes(RESET_OTP_EXPIRY_MINUTES)
        );
        redisTemplate.opsForValue().set(
            rateLimitKey,
            "1",
            Duration.ofSeconds(RESET_RATE_LIMIT_SECONDS)
        );

        emailService.sendPasswordResetOtp(email, otp);
        return "Password reset OTP sent to your email";
    }

    @Transactional
    public String resetPassword(String email, String otp, String newpassword) {
        String savedOtp = redisTemplate.opsForValue().get(RESET_OTP_PREFIX + email);
        if (savedOtp == null) {
            throw new BusinessException("OTP expired or not found. Please request a new OTP.");
        }

        if (!savedOtp.equals(otp)) {
            throw new BusinessException("Invalid OTP");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("User not found"));
        user.setPassword(passwordEncoder.encode(newpassword));
        userRepository.save(user);
        redisTemplate.delete(RESET_OTP_PREFIX + email);

        return "Password reset successfully";
    }

    @Transactional
    public void updateLastlogin(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setLastloginAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    public UserProfileResponse getUserById(Long id) {
        User currentUser = getCurrentUser();
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("user not found"));
        return convertToResponse(user, buildRelationshipFlags(currentUser, user), true);
    }

    public List<UserProfileResponse> getAllUsers() {
        User currentUser = getCurrentUser();
        Map<Long, RelationshipFlags> relationshipMap = buildRelationshipMap(currentUser);

        return userRepository.findAll().stream()
            .filter(User::isVerified)
            .filter(user -> !user.getEmail().equalsIgnoreCase(currentUser.getEmail()))
            .map(user -> convertToResponse(
                user,
                relationshipMap.getOrDefault(user.getId(), RelationshipFlags.none()),
                false
            ))
            .toList();
    }

    public List<UserProfileResponse> getConnectedUsers() {
        User currentUser = getCurrentUser();
        Map<Long, RelationshipFlags> relationshipMap = buildRelationshipMap(currentUser);

        return userRepository.findAll().stream()
            .filter(User::isVerified)
            .filter(user -> !user.getEmail().equalsIgnoreCase(currentUser.getEmail()))
            .filter(user -> relationshipMap.getOrDefault(user.getId(), RelationshipFlags.none()).connected())
            .map(user -> convertToResponse(
                user,
                relationshipMap.getOrDefault(user.getId(), RelationshipFlags.none()),
                false
            ))
            .toList();
    }

    public List<UserProfileResponse> searchUsers(String query) {
        User currentUser = getCurrentUser();
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        Map<Long, RelationshipFlags> relationshipMap = buildRelationshipMap(currentUser);

        return userRepository.findAll().stream()
            .filter(User::isVerified)
            .filter(user -> !user.getEmail().equalsIgnoreCase(currentUser.getEmail()))
            .filter(user -> matchesSearch(user, normalizedQuery))
            .filter(user -> !relationshipMap.getOrDefault(user.getId(), RelationshipFlags.none()).connected())
            .map(user -> convertToResponse(
                user,
                relationshipMap.getOrDefault(user.getId(), RelationshipFlags.none()),
                false
            ))
            .toList();
    }

    public List<UserProfileResponse> getIncomingRequests() {
        User currentUser = getCurrentUser();

        return userConnectionRepository.findByRecipientAndStatus(currentUser, ConnectionStatus.PENDING).stream()
            .map(connection -> convertToResponse(
                connection.getRequester(),
                new RelationshipFlags(false, false, true),
                false
            ))
            .toList();
    }

    @Transactional
    public UserProfileResponse sendFollowRequest(Long targetUserId) {
        User currentUser = getCurrentUser();
        User targetUser = userRepository.findById(targetUserId)
            .orElseThrow(() -> new BusinessException("User not found"));

        if (currentUser.getId().equals(targetUser.getId())) {
            throw new BusinessException("You cannot connect with yourself");
        }

        if (!targetUser.isVerified()) {
            throw new BusinessException("You can only connect with verified users");
        }

        Optional<UserConnection> existingRelationship =
            userConnectionRepository.findRelationshipBetween(currentUser, targetUser);

        if (existingRelationship.isPresent()) {
            UserConnection relationship = existingRelationship.get();

            if (relationship.getStatus() == ConnectionStatus.ACCEPTED) {
                throw new BusinessException("You are already connected with this user");
            }

            if (relationship.getRequester().getId().equals(currentUser.getId())) {
                throw new BusinessException("Connection request already sent");
            }

            throw new BusinessException("This user has already sent you a request. Please accept it.");
        }

        UserConnection newConnection = new UserConnection();
        newConnection.setRequester(currentUser);
        newConnection.setRecipient(targetUser);
        newConnection.setStatus(ConnectionStatus.PENDING);
        userConnectionRepository.save(newConnection);

        return convertToResponse(targetUser, new RelationshipFlags(false, true, false), false);
    }

    @Transactional
    public UserProfileResponse acceptFollowRequest(Long requesterUserId) {
        User currentUser = getCurrentUser();
        User requesterUser = userRepository.findById(requesterUserId)
            .orElseThrow(() -> new BusinessException("User not found"));

        UserConnection connection = userConnectionRepository.findRelationshipBetween(currentUser, requesterUser)
            .orElseThrow(() -> new BusinessException("No pending request found for this user"));

        if (connection.getStatus() == ConnectionStatus.ACCEPTED) {
            return convertToResponse(requesterUser, new RelationshipFlags(true, false, false), false);
        }

        if (!connection.getRequester().getId().equals(requesterUser.getId())
                || !connection.getRecipient().getId().equals(currentUser.getId())) {
            throw new BusinessException("You can only accept requests sent to you");
        }

        connection.setStatus(ConnectionStatus.ACCEPTED);
        connection.setRespondedAt(LocalDateTime.now());
        userConnectionRepository.save(connection);

        return convertToResponse(requesterUser, new RelationshipFlags(true, false, false), false);
    }

    public void assertUsersConnected(String otherEmail) {
        assertUsersConnected(getCurrentUserEmail(), otherEmail);
    }

    public void assertUsersConnected(String currentUserEmail, String otherEmail) {
        if (!areUsersConnected(currentUserEmail, otherEmail)) {
            throw new BusinessException("You can chat only with connected users");
        }
    }

    public boolean areUsersConnected(String firstEmail, String secondEmail) {
        if (firstEmail == null || secondEmail == null || firstEmail.equalsIgnoreCase(secondEmail)) {
            return false;
        }

        User firstUser = userRepository.findByEmail(firstEmail)
            .orElseThrow(() -> new BusinessException("User not found"));
        User secondUser = userRepository.findByEmail(secondEmail)
            .orElseThrow(() -> new BusinessException("User not found"));

        return userConnectionRepository.findRelationshipBetween(firstUser, secondUser)
            .map(connection -> connection.getStatus() == ConnectionStatus.ACCEPTED)
            .orElse(false);
    }

    @Transactional
    public void markCurrentUserOnline() {
        User user = getCurrentUser();
        user.setActive(true);
        user.setLastloginAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void markCurrentUserOffline() {
        User user = getCurrentUser();
        user.setActive(false);
        userRepository.save(user);
    }

    private boolean matchesSearch(User user, String normalizedQuery) {
        if (normalizedQuery.isBlank()) {
            return true;
        }

        return (user.getName() != null && user.getName().toLowerCase(Locale.ROOT).contains(normalizedQuery))
            || user.getEmail().toLowerCase(Locale.ROOT).contains(normalizedQuery);
    }

    private Map<Long, RelationshipFlags> buildRelationshipMap(User currentUser) {
        Map<Long, RelationshipFlags> relationshipMap = new HashMap<>();

        userConnectionRepository.findByRequesterOrRecipient(currentUser, currentUser).forEach(connection -> {
            User otherUser = connection.getRequester().getId().equals(currentUser.getId())
                ? connection.getRecipient()
                : connection.getRequester();

            RelationshipFlags flags;
            if (connection.getStatus() == ConnectionStatus.ACCEPTED) {
                flags = new RelationshipFlags(true, false, false);
            } else if (connection.getRequester().getId().equals(currentUser.getId())) {
                flags = new RelationshipFlags(false, true, false);
            } else {
                flags = new RelationshipFlags(false, false, true);
            }

            relationshipMap.put(otherUser.getId(), flags);
        });

        return relationshipMap;
    }

    private RelationshipFlags buildRelationshipFlags(User currentUser, User otherUser) {
        if (currentUser.getId().equals(otherUser.getId())) {
            return RelationshipFlags.none();
        }

        return userConnectionRepository.findRelationshipBetween(currentUser, otherUser)
            .map(connection -> {
                if (connection.getStatus() == ConnectionStatus.ACCEPTED) {
                    return new RelationshipFlags(true, false, false);
                }

                if (connection.getRequester().getId().equals(currentUser.getId())) {
                    return new RelationshipFlags(false, true, false);
                }

                return new RelationshipFlags(false, false, true);
            })
            .orElse(RelationshipFlags.none());
    }

    private boolean isUserOnline(User user) {
        if (!user.isActive() || user.getLastloginAt() == null) {
            return false;
        }

        return user.getLastloginAt().isAfter(LocalDateTime.now().minus(ONLINE_WINDOW));
    }

    private long getConnectionCountForUser(User user) {
        return userConnectionRepository.countByUserAndStatus(user, ConnectionStatus.ACCEPTED);
    }

    private UserProfileResponse convertToResponse(
        User user,
        RelationshipFlags relationshipFlags,
        boolean includeConnectionCounts
    ) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setBio(user.getBio());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setVerified(user.isVerified());
        response.setActive(isUserOnline(user));
        response.setConnected(relationshipFlags.connected());
        response.setRequestSent(relationshipFlags.requestSent());
        response.setRequestReceived(relationshipFlags.requestReceived());

        if (includeConnectionCounts) {
            long connectionCount = getConnectionCountForUser(user);
            response.setFollowersCount(connectionCount);
            response.setFollowingCount(connectionCount);
        }

        response.setLastloginAt(user.getLastloginAt());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}
