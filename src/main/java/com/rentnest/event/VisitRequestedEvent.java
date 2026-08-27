package com.rentnest.event;

import com.rentnest.entity.VisitSchedule;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class VisitRequestedEvent extends ApplicationEvent {

    private final VisitSchedule visitSchedule;

    public VisitRequestedEvent(Object source, VisitSchedule visitSchedule) {
        super(source);
        this.visitSchedule = visitSchedule;
    }
}