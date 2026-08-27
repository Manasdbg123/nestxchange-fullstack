package com.rentnest.event.listener;

import com.rentnest.entity.Property;
import com.rentnest.entity.User;
import com.rentnest.event.VisitRequestedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Slf4j
public class NotificationEventListener {

    // @TransactionalEventListener ensures the email is ONLY sent if the database transaction
    // in the VisitService committed successfully.
    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleVisitRequestedEvent(VisitRequestedEvent event) {

        User requester = event.getVisitSchedule().getUser();
        Property property = event.getVisitSchedule().getProperty();
        User owner = property.getOwner();

        log.info("ASYNC THREAD START: Sending email notification...");

        // In a real application, you would integrate JavaMailSender here.
        // For now, we simulate the delay of an external API call.
        try {
            Thread.sleep(2000); // Simulating 2-second network latency

            log.info("EMAIL SENT TO OWNER ({}): '{}' has requested a visit for your property '{}' on {}",
                    owner.getEmail(),
                    requester.getName(),
                    property.getTitle(),
                    event.getVisitSchedule().getVisitDate());

        } catch (InterruptedException e) {
            log.error("Failed to send notification email", e);
            Thread.currentThread().interrupt();
        }
    }
}