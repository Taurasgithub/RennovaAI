import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '../../auth/AuthProvider';
import { AdminButton, AdminHeader, adminText, Panel, Pill, SectionLabel } from '../../components/admin/kit';
import { HouseAvatar } from '../../components/brand';
import { Screen, Txt } from '../../components/ui';
import { cityLabel, useT } from '../../i18n';
import { confirmAction, notify } from '../../lib/dialogs';
import { deleteAccount } from '../../services/account';
import { useApp } from '../../store/useApp';
import { admin } from '../../theme/admin';
import { fonts, spacing } from '../../theme';

/** Admin's own profile and account settings, in the console's dark style. */
export default function AdminProfileTab() {
  const { t } = useT();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { language, setLanguage } = useApp(useShallow((s) => ({ language: s.language, setLanguage: s.setLanguage })));
  const [busy, setBusy] = useState<'out' | 'delete' | null>(null);
  if (!profile) return null;

  const remove = () =>
    confirmAction(t('account.deleteTitle'), t('account.deleteBody'), { cancel: t('common.cancel'), ok: t('common.delete') }, async () => {
      setBusy('delete');
      try {
        await deleteAccount();
        router.replace('/onboarding');
      } catch (e) {
        setBusy(null);
        notify(t('account.deleteFailed'), e instanceof Error ? e.message : undefined);
      }
    }, true);

  return (
    <Screen back={false} bg={admin.background}>
      <AdminHeader kicker={t('role.admin')} title={t('admin.tabAccount')} />

      <Panel variant="raised" style={{ marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing.xl }}>
        <HouseAvatar uri={profile.avatar_url} name={profile.full_name || profile.email} size={84} bg={admin.attention} color={admin.attentionForeground} />
        <Txt style={styles.name} numberOfLines={1}>{profile.full_name || profile.email}</Txt>
        <Txt style={adminText.sub}>{[profile.job_title || t('edit.noJobTitle'), cityLabel(profile.city)].filter(Boolean).join(' · ')}</Txt>
        <View style={{ marginTop: spacing.md }}>
          <Pill label={t('role.admin')} tone="attention" icon="shield-checkmark" />
        </View>
        {!!profile.bio && <Txt style={[adminText.body, { textAlign: 'center', marginTop: spacing.md }]}>{profile.bio}</Txt>}
        <AdminButton title={t('edit.title')} icon="create-outline" variant="soft" size="sm" style={{ marginTop: spacing.lg }} onPress={() => router.push('/profile-edit')} />
      </Panel>

      <SectionLabel title={t('account.signedInAs')} />
      <Panel>
        <Txt style={adminText.title} numberOfLines={1}>{profile.email}</Txt>
        <Txt style={[adminText.caption, { marginTop: 2 }]}>{t('admin.panel')}</Txt>
      </Panel>

      <SectionLabel title={t('lang.title')} />
      <View style={styles.row}>
        <AdminButton title="English" icon="globe-outline" size="sm" variant={language === 'en' ? 'solid' : 'outline'} tone={language === 'en' ? 'primary' : 'neutral'} style={{ flex: 1 }} onPress={() => setLanguage('en')} />
        <AdminButton title="اردو" icon="globe-outline" size="sm" variant={language === 'ur' ? 'solid' : 'outline'} tone={language === 'ur' ? 'primary' : 'neutral'} style={{ flex: 1 }} onPress={() => setLanguage('ur')} />
      </View>

      <AdminButton
        title={t('account.signOut')}
        icon="log-out-outline"
        variant="outline"
        tone="neutral"
        loading={busy === 'out'}
        style={{ marginTop: spacing.xxl }}
        onPress={async () => {
          setBusy('out');
          await signOut();
          router.replace('/onboarding');
        }}
      />
      <AdminButton title={t('account.delete')} icon="trash-outline" variant="ghost" tone="danger" size="sm" loading={busy === 'delete'} style={{ marginTop: spacing.sm, alignSelf: 'center' }} onPress={remove} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.extrabold, fontSize: 22, color: admin.foreground, marginTop: spacing.md, letterSpacing: -0.4 },
  row: { flexDirection: 'row', gap: spacing.sm },
});
