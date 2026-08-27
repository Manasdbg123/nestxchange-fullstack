package com.rentnest.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Documented
@Constraint(validatedBy = ValidRentAmountValidator.class)
@Target({ FIELD, PARAMETER })
@Retention(RUNTIME)
public @interface ValidRentAmount {

    // Default error message if validation fails
    String message() default "Rent amount must be a positive multiple of 100 and within reasonable limits (1,000 - 1,000,000).";

    // Required by Spring Validation to group constraints (leave empty)
    Class<?>[] groups() default {};

    // Required by Spring Validation to carry metadata (leave empty)
    Class<? extends Payload>[] payload() default {};
}