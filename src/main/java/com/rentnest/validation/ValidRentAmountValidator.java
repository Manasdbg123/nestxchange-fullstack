package com.rentnest.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;

public class ValidRentAmountValidator implements ConstraintValidator<ValidRentAmount, BigDecimal> {

    // Define strict business rules for real estate
    private static final BigDecimal MIN_RENT = new BigDecimal("1000");
    private static final BigDecimal MAX_RENT = new BigDecimal("1000000");

    @Override
    public void initialize(ValidRentAmount constraintAnnotation) {
        // Initialization logic if we passed parameters to the annotation (not needed here)
    }

    @Override
    public boolean isValid(BigDecimal rentAmount, ConstraintValidatorContext context) {

        // 1. Let @NotNull handle null checks (separation of concerns)
        if (rentAmount == null) {
            return true;
        }

        // 2. Check minimum and maximum boundaries
        if (rentAmount.compareTo(MIN_RENT) < 0 || rentAmount.compareTo(MAX_RENT) > 0) {
            return false;
        }

        // 3. Ensure the rent is a round number (Multiple of 100)
        // e.g., 15000 is valid, 15000.50 or 15042 is invalid
        BigDecimal[] remainder = rentAmount.divideAndRemainder(new BigDecimal("100"));

        return remainder[1].compareTo(BigDecimal.ZERO) == 0;
    }
}