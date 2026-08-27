package com.rentnest.security;

import com.rentnest.entity.User;
import com.rentnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Must be UsernameNotFoundException rather than a generic 404: the
        // DaoAuthenticationProvider is configured to swallow it into a plain
        // BadCredentialsException so failed logins cannot enumerate accounts.
        User user = userRepository.findByEmail(normalise(email))
                .orElseThrow(() -> new UsernameNotFoundException("No account found for the supplied credentials"));

        return new UserPrincipal(user);
    }

    /** Used by the JWT filter, whose token subject is the user id rather than the email. */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("No account found for id " + id));

        return new UserPrincipal(user);
    }

    private String normalise(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
