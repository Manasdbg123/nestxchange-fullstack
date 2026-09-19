package com.nestxchange.service;

import com.nestxchange.dto.request.VisitScheduleRequest;
import com.nestxchange.dto.response.VisitResponse;
import com.nestxchange.entity.VisitSchedule;

import java.util.List;

public interface VisitService {

    VisitResponse scheduleVisit(VisitScheduleRequest request, Long userId);

    /** Visits the caller has requested, newest first. */
    List<VisitResponse> getUserVisits(Long userId);

    /** Visit requests raised against listings the caller owns. */
    List<VisitResponse> getOwnerVisits(Long ownerId, boolean pendingOnly);

    VisitResponse updateVisitStatus(Long visitId, VisitSchedule.VisitStatus status, Long ownerId);

    /** Lets a requester withdraw their own pending request. */
    void cancelVisit(Long visitId, Long userId);
}
