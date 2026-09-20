package com.nestxchange.service;

public interface EmailService {

    /** Fire-and-forget: a failed send must never block or fail the caller's request. */
    void send(String toEmail, String subject, String htmlBody);
}
