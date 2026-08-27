package com.rentnest.scheduler;

import com.rentnest.entity.VisitSchedule;
import com.rentnest.repository.VisitScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class VisitStatusScheduler {

    private final VisitScheduleRepository visitRepository;

    /**
     * This cron expression means: Run at 2:00 AM every single day.
     * It prevents the database from being bogged down by stale visit requests.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void expireOldPendingVisits() {
        log.info("Starting scheduled job: Sweeping for pending visits older than 48 hours...");

        // Calculate the threshold time (48 hours ago)
        LocalDateTime thresholdDate = LocalDateTime.now().minusHours(48);

        // Fetch all visits that are still PENDING and were created before the threshold date
        List<VisitSchedule> expiredVisits = visitRepository.findByStatusAndCreatedAtBefore(
                VisitSchedule.VisitStatus.PENDING, thresholdDate);

        if (!expiredVisits.isEmpty()) {
            // Update the status of all fetched visits
            expiredVisits.forEach(visit -> visit.setStatus(VisitSchedule.VisitStatus.EXPIRED));

            // Save them back to the database in a batch
            visitRepository.saveAll(expiredVisits);

            log.info("Scheduled job complete. Successfully expired {} stale visit requests.", expiredVisits.size());
        } else {
            log.info("Scheduled job complete. No pending visits found to expire.");
        }
    }
}