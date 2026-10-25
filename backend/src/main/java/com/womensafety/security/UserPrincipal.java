package com.womensafety.security;

import com.womensafety.entity.User;
import com.womensafety.enums.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Authenticated principal used for both the login flow and JWT-authenticated requests.
 * Controllers receive it through {@code @AuthenticationPrincipal}.
 */
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String displayName;
    private final String passwordHash;
    private final UserRole role;
    private final boolean enabled;

    private UserPrincipal(Long id, String email, String displayName, String passwordHash,
                          UserRole role, boolean enabled) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.role = role;
        this.enabled = enabled;
    }

    public static UserPrincipal from(User user) {
        return new UserPrincipal(user.getId(), user.getEmail(), user.getDisplayName(),
                user.getPasswordHash(), user.getRole(), user.isActive());
    }

    /** Principal reconstructed from a JWT (no password hash available). */
    public static UserPrincipal fromToken(Long id, String email, String displayName, UserRole role) {
        return new UserPrincipal(id, email, displayName, "", role, true);
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public UserRole getRole() {
        return role;
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    public boolean isResponder() {
        return role == UserRole.RESPONDER;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return enabled;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
