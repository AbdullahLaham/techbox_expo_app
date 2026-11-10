// src/hooks/useMe.ts
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { meApi, type AvatarFile } from '@/api/me';
import { homeKeys } from '@/hooks/useHome';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { tokenStorage } from '@/services/tokenStorage';
import { useAuthStore } from '@/store/useAuthStore';
import type { ChangePasswordBody, MyProfile, UpdateMyProfileBody } from '@/types/profile.contract';

export const meKeys = {
  all: ['me'] as const,
  profile: () => ['me', 'profile'] as const,
  achievements: () => ['me', 'achievements'] as const,
  certificates: () => ['me', 'certificates'] as const,
};

/** A saved profile: refresh every place that shows it. */
function profileSaved(queryClient: QueryClient, profile: MyProfile) {
  queryClient.setQueryData(meKeys.profile(), profile);
  // The header and greeting read the name from the session user.
  const user = useAuthStore.getState().user;
  if (user) {
    useAuthStore.setState({
      user: { ...user, firstName: profile.firstName ?? undefined, lastName: profile.lastName ?? undefined },
    });
  }
  void queryClient.invalidateQueries({ queryKey: homeKeys.all });
  // The enrollment form pre-fills from the same profile fields.
  void queryClient.invalidateQueries({ queryKey: ['program', 'me'] });
}

/**
 * GET /v1/me/profile. The avatar link expires after about an hour, so the profile is kept
 * for 30 minutes and refetched when the screen regains focus.
 */
export function useMyProfile() {
  const query = useQuery({ queryKey: meKeys.profile(), queryFn: meApi.profile, staleTime: 30 * 60 * 1000 });
  useRefetchOnFocus(query.refetch);
  return query;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMyProfileBody) => meApi.updateProfile(body),
    onSuccess: (profile) => profileSaved(queryClient, profile),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: AvatarFile) => meApi.uploadAvatar(file),
    onSuccess: (profile) => profileSaved(queryClient, profile),
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meApi.removeAvatar,
    onSuccess: (profile) => profileSaved(queryClient, profile),
  });
}

/** Every session ends on the server; this device keeps working with the new pair. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordBody) => meApi.changePassword(body),
    onSuccess: async ({ accessToken, refreshToken }) => {
      await tokenStorage.setTokens(accessToken, refreshToken);
    },
  });
}

/** Signs out locally once the server has ended the sessions (logout-all, account deletion). */
async function signOutHere(queryClient: QueryClient) {
  await useAuthStore.getState().logout();
  queryClient.clear();
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: meApi.logoutAll, onSuccess: () => signOutHere(queryClient) });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => meApi.deleteAccount(password),
    onSuccess: () => signOutHere(queryClient),
  });
}

export function useAchievements() {
  const query = useQuery({ queryKey: meKeys.achievements(), queryFn: meApi.achievements, staleTime: 60 * 1000 });
  useRefetchOnFocus(query.refetch);
  return query;
}

export function useMyCertificates() {
  return useQuery({ queryKey: meKeys.certificates(), queryFn: meApi.certificates, staleTime: 60 * 1000 });
}
