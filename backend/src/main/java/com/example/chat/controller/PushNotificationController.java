package com.example.chat.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.chat.DTO.PushTokenRequest;
import com.example.chat.service.PushTokenService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/push")
public class PushNotificationController {

    @Autowired
    private PushTokenService pushTokenService;

    @PostMapping("/tokens")
    public ResponseEntity<Map<String, String>> registerToken(@Valid @RequestBody PushTokenRequest request) {
        pushTokenService.registerCurrentUserToken(request);
        return ResponseEntity.ok(Map.of("message", "Push token registered successfully"));
    }

    @DeleteMapping("/tokens")
    public ResponseEntity<Map<String, String>> unregisterToken(@RequestParam String token) {
        pushTokenService.unregisterCurrentUserToken(token);
        return ResponseEntity.ok(Map.of("message", "Push token removed successfully"));
    }
}
