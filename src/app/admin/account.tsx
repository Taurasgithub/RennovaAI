import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { AccountPanel } from '../../components/AccountPanel';
import { ProfileHeader } from '../../components/ProfileHeader';
import { Screen } from '../../components/ui';
import { cityLabel, useT } from '../../i18n';

/** Admin's own profile: photo, name, job title, bio, plus account settings. */
export default function AdminProfileTab() {
  const { t } = useT();
  const router = useRouter();
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <Screen back={false}>
      <ProfileHeader
        name={profile.full_name || profile.email}
        avatarUri={profile.avatar_url}
        roleLabel={t('role.admin')}
        roleTone="navy"
        lines={[profile.job_title || t('edit.noJobTitle'), cityLabel(profile.city)]}
        bio={profile.bio}
        editLabel={t('edit.title')}
        onEdit={() => router.push('/profile-edit')}
      />
      <AccountPanel />
    </Screen>
  );
}
