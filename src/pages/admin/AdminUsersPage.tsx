import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Search, UserCheck, Shield, Mail, MapPin, RefreshCw, UserCog, AlertCircle } from 'lucide-react';
import { adminService, AdminUserRecord } from '../../services/adminService';
import { UserRole } from '../../types/user';
import { useToast } from '../../contexts/ToastContext';
import { UserAvatar } from '../../components/common/UserAvatar';

export const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramRole = searchParams.get('role');
  const initialRole = (paramRole === 'adopter' || paramRole === 'provider' || paramRole === 'admin') ? paramRole : 'all';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'adopter' | 'provider' | 'admin'>(initialRole);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<AdminUserRecord | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('adopter');
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();
  const isLive = adminService.isLiveRealMode();

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'adopter' || r === 'provider' || r === 'admin') {
      setRoleFilter(r);
    } else if (!r) {
      setRoleFilter('all');
    }
  }, [searchParams]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers(search, roleFilter);
      setUsers(data);
    } catch (err) {
      console.warn('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleRoleFilterChange = (r: 'all' | 'adopter' | 'provider' | 'admin') => {
    setRoleFilter(r);
    if (r === 'all') {
      searchParams.delete('role');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), role: r });
    }
  };

  const handleOpenRoleModal = (u: AdminUserRecord) => {
    setTargetUser(u);
    setNewRole(u.role);
  };

  const handleConfirmRoleChange = async () => {
    if (!targetUser) return;
    setIsUpdating(true);
    try {
      const result = await adminService.changeUserRole(targetUser.id, newRole);
      if (result.success) {
        showToast(`Successfully updated role for ${targetUser.name} to ${newRole}.`, 'success');
        setTargetUser(null);
        await loadUsers();
      } else {
        showToast(result.error || 'Failed to update user role.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating user role.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-brand-950">Registered Users</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Verified Platform Registry
            </span>
          </div>
          <p className="text-xs text-brand-muted">
            Directory of registered adopters, caregivers, and administrative staff across the network.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter Tabs */}
          <div className="flex items-center bg-brand-100/60 p-1 rounded-2xl border border-brand-200 text-xs">
            {(['all', 'adopter', 'provider', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleFilterChange(r)}
                className={`px-3 py-1 rounded-xl font-semibold capitalize transition-all cursor-pointer ${
                  roleFilter === r
                    ? 'bg-surface text-brand-950 shadow-xs'
                    : 'text-brand-600 hover:text-brand-900'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, city..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-brand-200 text-xs text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
            />
          </div>

          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="p-2 rounded-2xl border border-brand-200 hover:bg-brand-50 text-brand-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-brand-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-50 border-b border-brand-200 text-brand-800 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">User Name</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Profile Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-400 font-medium">
                    No users matching search filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={u.avatarUrl}
                          name={u.name}
                          email={u.email}
                          size="md"
                          className="border border-brand-200 shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-brand-950 truncate">{u.name}</p>
                          <p className="text-[11px] text-brand-muted truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : u.role === 'provider'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-brand-100 text-brand-800 border border-brand-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-600">{u.location}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-muted">{u.joined}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleOpenRoleModal(u)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-950 hover:underline"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        <span>Manage Role</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Role Modal */}
      {targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl border border-brand-200 max-w-md w-full p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center shrink-0">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-brand-950">Update User Role</h3>
                <p className="text-xs text-brand-muted">Modify account application permissions</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 space-y-1 text-xs">
              <p className="font-bold text-brand-950">{targetUser.name}</p>
              <p className="text-brand-600">{targetUser.email}</p>
              <p className="text-brand-400">Current Role: <span className="font-semibold text-brand-800 capitalize">{targetUser.role}</span></p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-900 block">Select New Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['adopter', 'provider', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewRole(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${
                      newRole === r
                        ? 'bg-brand-950 text-white border-brand-950 shadow-xs'
                        : 'bg-surface text-brand-700 border-brand-200 hover:bg-brand-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {newRole === 'admin' && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-purple-700" />
                <span>
                  <strong>Caution:</strong> Granting Admin role gives full administrative governance privileges over the platform.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTargetUser(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRoleChange}
                disabled={isUpdating || newRole === targetUser.role}
              >
                {isUpdating ? 'Saving...' : 'Confirm Role Update'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
