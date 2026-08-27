package com.rentnest.service.impl;

import com.rentnest.dto.request.VisitScheduleRequest;
import com.rentnest.dto.response.VisitResponse;
import com.rentnest.entity.Property;
import com.rentnest.entity.User;
import com.rentnest.entity.VisitSchedule;
import com.rentnest.event.VisitRequestedEvent;
import com.rentnest.exception.BusinessValidationException;
import com.rentnest.exception.ResourceNotFoundException;
import com.rentnest.exception.UnauthorizedAccessException;
import com.rentnest.mapper.VisitMapper;
import com.rentnest.repository.PropertyRepository;
import com.rentnest.repository.UserRepository;
import com.rentnest.repository.VisitScheduleRepository;
import com.rentnest.service.VisitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitServiceImpl implements VisitService {

    /** Owners need some notice; a request for 20 minutes from now helps nobody. */
    private static final int MIN_NOTICE_HOURS = 2;
    private static final int MAX_LEAD_DAYS = 60;

    private static final Set<Property.PropertyStatus> VISITABLE_STATUSES =
            Set.of(Property.PropertyStatus.AVAILABLE, Property.PropertyStatus.ACTIVE);

    private final VisitScheduleRepository visitRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final VisitMapper visitMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public VisitResponse scheduleVisit(VisitScheduleRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Property property = propertyRepository.findByIdWithOwner(request.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", request.getPropertyId()));

        if (property.getOwner().getId().equals(userId)) {
            throw new BusinessValidationException("You cannot request a visit to your own listing.");
        }

        if (!VISITABLE_STATUSES.contains(property.getStatus())) {
            throw new BusinessValidationException("This property is no longer accepting visits.");
        }

        assertVisitWindowIsSane(request.getVisitDate());

        boolean alreadyRequested = visitRepository.existsByUserIdAndPropertyIdAndStatus(
                userId, property.getId(), VisitSchedule.VisitStatus.PENDING);
        if (alreadyRequested) {
            throw new BusinessValidationException(
                    "You already have a pending visit request for this property.");
        }

        VisitSchedule visit = visitRepository.save(VisitSchedule.builder()
                .user(user)
                .property(property)
                .visitDate(request.getVisitDate())
                .status(VisitSchedule.VisitStatus.PENDING)
                .build());

        // Published, not sent inline: the notification listener runs after commit
        // on a separate thread, so a slow mail server never delays this response.
        eventPublisher.publishEvent(new VisitRequestedEvent(this, visit));

        log.info("Visit request id={} raised by user id={} for listing id={}",
                visit.getId(), userId, property.getId());

        return visitMapper.toResponse(visit, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitResponse> getUserVisits(Long userId) {
        return visitRepository.findByUserIdWithProperty(userId).stream()
                .sorted(Comparator.comparing(VisitSchedule::getVisitDate).reversed())
                // The requester already knows who they are; no visitor block needed.
                .map(visit -> visitMapper.toResponse(visit, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitResponse> getOwnerVisits(Long ownerId, boolean pendingOnly) {
        List<VisitSchedule> visits = pendingOnly
                ? visitRepository.findPendingVisitsForOwner(ownerId)
                : visitRepository.findAllVisitsForOwner(ownerId);

        return visits.stream()
                .sorted(Comparator.comparing(VisitSchedule::getVisitDate))
                // The owner needs the requester's contact details to arrange the viewing.
                .map(visit -> visitMapper.toResponse(visit, true))
                .toList();
    }

    @Override
    @Transactional
    public VisitResponse updateVisitStatus(Long visitId, VisitSchedule.VisitStatus status, Long ownerId) {
        if (status == VisitSchedule.VisitStatus.PENDING || status == VisitSchedule.VisitStatus.EXPIRED) {
            // EXPIRED is set by the nightly sweep; PENDING is the initial state.
            // Neither is something an owner may assign by hand.
            throw new BusinessValidationException("A visit request can only be accepted or rejected.");
        }

        VisitSchedule visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("VisitSchedule", "id", visitId));

        if (!visit.getProperty().getOwner().getId().equals(ownerId)) {
            log.warn("Blocked attempt by user id={} to decide visit id={}", ownerId, visitId);
            throw new UnauthorizedAccessException("You do not have permission to update this visit request.");
        }

        if (visit.getStatus() != VisitSchedule.VisitStatus.PENDING) {
            throw new BusinessValidationException(
                    "This request has already been " + visit.getStatus().name().toLowerCase() + ".");
        }

        visit.setStatus(status);
        return visitMapper.toResponse(visitRepository.save(visit), true);
    }

    @Override
    @Transactional
    public void cancelVisit(Long visitId, Long userId) {
        VisitSchedule visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("VisitSchedule", "id", visitId));

        if (!visit.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You can only withdraw your own visit requests.");
        }

        if (visit.getStatus() != VisitSchedule.VisitStatus.PENDING) {
            throw new BusinessValidationException("Only a pending request can be withdrawn.");
        }

        visitRepository.delete(visit);
    }

    private void assertVisitWindowIsSane(LocalDateTime visitDate) {
        LocalDateTime now = LocalDateTime.now();

        if (visitDate.isBefore(now.plusHours(MIN_NOTICE_HOURS))) {
            throw new BusinessValidationException(
                    "Please pick a slot at least " + MIN_NOTICE_HOURS + " hours from now.");
        }

        if (visitDate.isAfter(now.plusDays(MAX_LEAD_DAYS))) {
            throw new BusinessValidationException(
                    "Visits can only be booked up to " + MAX_LEAD_DAYS + " days ahead.");
        }
    }
}
