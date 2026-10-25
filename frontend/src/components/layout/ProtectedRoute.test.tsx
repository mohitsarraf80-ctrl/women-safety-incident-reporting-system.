import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../types/api';
import { ProtectedRoute } from './ProtectedRoute';

const auth = vi.hoisted(() => ({
  current: { user: null as User | null, initialising: false },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => auth.current,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<div>admin area</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/dashboard" element={<div>citizen dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function userWithRole(role: User['role']): User {
  return {
    id: 1,
    displayName: 'Test',
    email: 'test@example.com',
    role,
    roleLabel: role,
    createdAt: new Date().toISOString(),
  };
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    auth.current = { user: null, initialising: false };
  });

  it('redirects unauthenticated visitors to the login page', () => {
    renderAt('/admin');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('redirects a citizen away from an admin-only route', () => {
    auth.current = { user: userWithRole('CITIZEN'), initialising: false };
    renderAt('/admin');
    expect(screen.getByText('citizen dashboard')).toBeInTheDocument();
  });

  it('allows an administrator through', () => {
    auth.current = { user: userWithRole('ADMIN'), initialising: false };
    renderAt('/admin');
    expect(screen.getByText('admin area')).toBeInTheDocument();
  });
});
