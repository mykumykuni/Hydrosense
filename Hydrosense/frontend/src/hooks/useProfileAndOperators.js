import { useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../utils/apiClient';
import { setAuthSession } from '../utils/authStorage';

const createEmptyProfile = () => ({
  displayName: '',
  photoDataUrl: '',
  phone: '',
  address: '',
  bio: '',
  position: '',
  emergencyContact: ''
});

export const useProfileAndOperators = ({ apiBase, authToken, isAdmin }) => {
  const [authUser, setAuthUser] = useState(null);
  const [profileDraft, setProfileDraft] = useState(createEmptyProfile);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [operators, setOperators] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [operatorSearch, setOperatorSearch] = useState('');
  const [operatorError, setOperatorError] = useState('');
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  const apiClient = useMemo(() => createApiClient(apiBase, authToken), [apiBase, authToken]);

  const applyProfile = useCallback((user) => {
    if (!user) return;
    setAuthUser(user);
    setAuthSession({ token: authToken, user });
    setProfileDraft({
      displayName: user.profile?.displayName || '',
      photoDataUrl: user.profile?.photoDataUrl || '',
      phone: user.profile?.phone || '',
      address: user.profile?.address || '',
      bio: user.profile?.bio || '',
      position: user.profile?.position || '',
      emergencyContact: user.profile?.emergencyContact || ''
    });
  }, [authToken]);

  const loadProfile = useCallback(async () => {
    try {
      const { response, data } = await apiClient.getJson('/api/profile');
      if (!response.ok || !data.ok) return;
      applyProfile(data.user);
    } catch {
      // no-op
    }
  }, [apiClient, applyProfile]);

  const saveProfile = useCallback(async () => {
    setProfileSaveError('');
    setProfileSaveMessage('');
    setProfileSaving(true);

    try {
      const { response, data } = await apiClient.patchJson('/api/profile', { payload: profileDraft });
      if (!response.ok || !data.ok) {
        setProfileSaveError(data.error || 'Unable to save profile.');
        return;
      }

      applyProfile(data.user);
      setProfileSaveMessage('Profile updated successfully.');
    } catch {
      setProfileSaveError('Network error while saving profile.');
    } finally {
      setProfileSaving(false);
    }
  }, [apiClient, applyProfile, profileDraft]);

  const loadOperators = useCallback(async (search = '') => {
    if (!isAdmin) return;
    setOperatorsLoading(true);
    setOperatorError('');

    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const { response, data } = await apiClient.getJson(`/api/operators${query}`);

      if (!response.ok || !data.ok) {
        setOperatorError(data.error || 'Unable to load operators.');
        return;
      }

      setOperators(data.operators || []);
      setPendingCount(data.pendingCount || 0);
    } catch {
      setOperatorError('Network error while loading operators.');
    } finally {
      setOperatorsLoading(false);
    }
  }, [apiClient, isAdmin]);

  const mutateOperator = useCallback(async (action, userId) => {
    try {
      const { response, data } = await apiClient.postJson('/api/operators', {
        action,
        payload: { userId }
      });

      if (!response.ok || !data.ok) {
        setOperatorError(data.error || 'Unable to update operator.');
        return;
      }

      setOperators(data.operators || []);
      setPendingCount(data.pendingCount || 0);
    } catch {
      setOperatorError('Network error while updating operator.');
    }
  }, [apiClient]);

  useEffect(() => {
    if (!authToken) return;
    loadProfile();
    if (isAdmin) loadOperators('');
  }, [authToken, isAdmin, loadProfile, loadOperators]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => {
      loadOperators(operatorSearch);
    }, 260);
    return () => clearTimeout(timer);
  }, [isAdmin, operatorSearch, loadOperators]);

  return {
    authUser,
    setAuthUser,
    profileDraft,
    setProfileDraft,
    profileSaveError,
    profileSaveMessage,
    profileSaving,
    saveProfile,
    operators,
    pendingCount,
    operatorSearch,
    setOperatorSearch,
    operatorError,
    operatorsLoading,
    mutateOperator
  };
};
