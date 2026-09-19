package com.nestxchange.dto.request;

import com.nestxchange.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Please enter your full name")
    @Size(min = 2, max = 80, message = "Name must be between 2 and 80 characters")
    private String name;

    @NotBlank(message = "Please enter your email address")
    @Email(message = "Please enter a valid email address")
    @Size(max = 160, message = "Email address is too long")
    private String email;

    @NotBlank(message = "Please choose a password")
    @Size(min = 8, max = 72, message = "Password must be at least 8 characters")
    @Pattern(regexp = ".*[A-Za-z].*", message = "Password must contain at least one letter")
    @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one number")
    private String password;

    @Pattern(regexp = "^$|^[6-9]\\d{9}$", message = "Please enter a valid 10-digit Indian mobile number")
    private String phone;

    /**
     * What the visitor is signing up as.
     *
     * <p>This is deliberately NOT the full {@link Role} enum. It previously was,
     * which meant anyone could POST {@code "role": "ADMIN"} to the open
     * registration endpoint and mint themselves an administrator account.
     * Restricting the wire type makes that escalation impossible to express.
     */
    @Builder.Default
    private AccountType accountType = AccountType.TENANT;

    public enum AccountType {
        TENANT(Role.TENANT),
        OWNER(Role.OWNER);

        private final Role role;

        AccountType(Role role) {
            this.role = role;
        }

        public Role toRole() {
            return role;
        }
    }

    /** Never returns an elevated role, whatever the client sent. */
    public Role resolveRole() {
        return (accountType == null ? AccountType.TENANT : accountType).toRole();
    }
}
