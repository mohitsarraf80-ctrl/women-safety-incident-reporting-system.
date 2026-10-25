package com.womensafety.security;

import com.womensafety.entity.User;
import com.womensafety.exception.ApiException;
import com.womensafety.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** Convenience accessor for the authenticated account behind the current request. */
@Component
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public CurrentUserProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<UserPrincipal> principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    public User requireUser() {
        UserPrincipal principal = principal().orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                "unauthenticated", "You must be signed in to perform this action.") {
        });
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "unauthenticated",
                        "The signed-in account no longer exists.") {
                });
    }

    public Optional<User> user() {
        return principal().flatMap(p -> userRepository.findById(p.getId()));
    }
}
