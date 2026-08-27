package com.rentnest.repository;

import com.rentnest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Crucial for the CustomUserDetailsService
    Optional<User> findByEmail(String email);

    // Efficient boolean check before attempting to create a new user
    boolean existsByEmail(String email);
}