package com.example.chat.controller;

import java.util.Map;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.chat.DTO.PasswordChangeRequest;
import com.example.chat.DTO.UserProfileResponse;
import com.example.chat.DTO.UserProfileUpdateRequest;
import com.example.chat.service.UserProfileService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/profile")
public class UserProfileController {
    @Autowired
    private UserProfileService userProfileService;

    // get my profile 
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile() {
        return ResponseEntity.ok(userProfileService.getMyProfile());
    }

    // update my profile 
    @PutMapping("/update")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UserProfileUpdateRequest request) {
        return ResponseEntity.ok(userProfileService.updateProfile(request));
    }

    // change password
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody PasswordChangeRequest request){
        String message = userProfileService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    // forgot password
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestParam String email){
        String  message = userProfileService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
        @RequestParam String email,
        @RequestParam String otp,
        @RequestParam String newPassword
    ){
        String message = userProfileService.resetPassword(email, otp, newPassword);
        return ResponseEntity.ok(Map.of("message",message));
    }
    
    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(userProfileService.getUserById(userId));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        return ResponseEntity.ok(userProfileService.getAllUsers());
    }

    @GetMapping("/connections")
    public ResponseEntity<List<UserProfileResponse>> getConnectedUsers() {
        return ResponseEntity.ok(userProfileService.getConnectedUsers());
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<UserProfileResponse>> searchUsers(@RequestParam(defaultValue = "") String query) {
        return ResponseEntity.ok(userProfileService.searchUsers(query));
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<List<UserProfileResponse>> getIncomingRequests() {
        return ResponseEntity.ok(userProfileService.getIncomingRequests());
    }

    @PostMapping("/requests/{userId}")
    public ResponseEntity<UserProfileResponse> sendFollowRequest(@PathVariable Long userId) {
        return ResponseEntity.ok(userProfileService.sendFollowRequest(userId));
    }

    @PostMapping("/requests/{userId}/accept")
    public ResponseEntity<UserProfileResponse> acceptFollowRequest(@PathVariable Long userId) {
        return ResponseEntity.ok(userProfileService.acceptFollowRequest(userId));
    }

    @PostMapping("/presence/ping")
    public ResponseEntity<Map<String, String>> markPresenceOnline() {
        userProfileService.markCurrentUserOnline();
        return ResponseEntity.ok(Map.of("message", "presence updated"));
    }

    @PostMapping("/presence/offline")
    public ResponseEntity<Map<String, String>> markPresenceOffline() {
        userProfileService.markCurrentUserOffline();
        return ResponseEntity.ok(Map.of("message", "presence updated"));
    }
}
