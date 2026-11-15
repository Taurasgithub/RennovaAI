import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useT, type TKey } from '../i18n';
import { confirmAction, notify } from '../lib/dialogs';
import type { Role } from '../lib/supabase';
import { deleteAccount } from '../services/account';
import { useApp } from '../store/useApp';
import { useShallow } from 'zustand/react/shallow';
import { colors, spacing } from '../theme';
import { Badge, Button, Card, Chip, Row, Section, T } from './ui';

export const ROLE_LABEL: Record<Role, TKey> = { customer: 'role.customer', vendor: 'role.vendor', admin: 'role.admin' };
export const ROLE_TONE: Record<Role, 'teal' | 'amber' | 'navy'> = { customer: 'teal', vendor: 'amber', admin: 'navy' };

/** Signed-in account: email, role, language, sign-out and account deletion. Shared by the vendor hub, admin panel and customer profile. */
export function AccountPanel({ showLanguage = true }: { showLanguage?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { language, setLanguage } = useApp(useShallow((s) => ({ language: s.language, setLanguage: s.setLanguage })));
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (!profile) return null;

  return (
    <View>
      <Card style={{ marginTop: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="overline">{t('account.signedInAs')}</T>
          <Badge label={t(ROLE_LABEL[profile.role]).toUpperCase()} tone={ROLE_TONE[profile.role]} />
        </Row>
        <T variant="h3" style={{ marginTop: spacing.sm }}>{profile.full_name || profile.email}</T>
        <T variant="small">{profile.email}</T>
      </Card>

      {showLanguage && (
        <Section title={t('lang.title')}>
          <Row style={{ flexWrap: 'wrap' }} gap={6}>
            <Chip label="English" icon="globe-outline" selected={language === 'en'} onPress={() => setLanguage('en')} />
            <Chip label="اردو" icon="globe-outline" selected={language === 'ur'} onPress={() => setLanguage('ur')} />
          </Row>
        </Section>
      )}

      <Button
        title={t('account.signOut')}
        kind="secondary"
        icon="log-out-outline"
        loading={busy}
        style={{ marginTop: spacing.xl, borderColor: colors.border }}
        onPress={async () => {
          setBusy(true);
          await signOut();
          router.replace('/onboarding');
        }}
      />
      {/* Required by Google Play: people who can create an account must be able to delete it in the app. */}
      <Button
        title={t('account.delete')}
        kind="danger"
        icon="trash-outline"
        small
        loading={deleting}
        style={{ marginTop: spacing.md, alignSelf: 'center' }}
        onPress={() =>
          confirmAction(t('account.deleteTitle'), t('account.deleteBody'), { cancel: t('common.cancel'), ok: t('common.delete') }, async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              router.replace('/onboarding');
            } catch (e) {
              setDeleting(false);
              notify(t('account.deleteFailed'), e instanceof Error ? e.message : undefined);
            }
          }, true)
        }
      />
    </View>
  );
}
