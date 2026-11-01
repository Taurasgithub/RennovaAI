import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Chip, Field, IconTile, Row, Screen, Section, T, tap, type IconName } from '../../components/ui';
import { config } from '../../config';
import { useAuth } from '../../auth/AuthProvider';
import { AccountPanel } from '../../components/AccountPanel';
import { cityLabel, useT } from '../../i18n';
import { aiServerConfigured } from '../../services/ai';
import { useApp } from '../../store/useApp';
import { colors, fonts, spacing } from '../../theme';

function Item({ icon, label, detail, onPress }: { icon: IconName; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
      <IconTile icon={icon} size={38} />
      <View style={{ flex: 1 }}>
        <T variant="bodyStrong">{label}</T>
        {!!detail && <T variant="caption">{detail}</T>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const { t } = useT();
  const auth = useAuth();
  const { user, setUser, designs, projects, vendorApplication, resetAll, language, setLanguage } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  // With accounts on, profile edits are saved to the account (which also updates the local copy).
  const saveUser = (u: { name: string; phone: string; city: string }) => {
    if (auth.enabled) auth.updateProfile({ full_name: u.name, phone: u.phone, city: u.city });
    else setUser(u);
  };

  const save = () => {
    if (!user) return;
    saveUser({ ...user, name: name.trim() || user.name, phone: phone.trim() });
    setEditing(false);
  };

  const reset = () => {
    const go = () => {
      resetAll();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') go();
    else Alert.alert(t('profile.deleteTitle'), t('profile.deleteBody'), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: go }]);
  };

  const initials = (user?.name ?? 'R').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen back={false} title={t('profile.title')}>
      <Card style={{ marginTop: spacing.sm }}>
        <Row gap={spacing.md}>
          <View style={styles.avatar}><T style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 22 }}>{initials}</T></View>
          <View style={{ flex: 1 }}>
            <T variant="h2">{user?.name}</T>
            <T variant="small">{user?.phone || t('profile.noPhone')} · {cityLabel(user?.city ?? '')}</T>
          </View>
          <Button title={editing ? t('common.cancel') : t('common.edit')} kind="secondary" small onPress={() => setEditing(!editing)} />
        </Row>
        {editing && (
          <>
            <Field label={t('profile.name')} value={name} onChangeText={setName} autoCapitalize="words" />
            <Field label={t('profile.mobile')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="03XX XXXXXXX" />
            <Button title={t('common.save')} onPress={save} style={{ marginTop: spacing.lg }} />
          </>
        )}
        <Row style={{ marginTop: spacing.lg }} gap={spacing.sm}>
          <View style={styles.stat}><T variant="h2" style={{ color: colors.tealDark }}>{designs.length}</T><T variant="caption">{t('profile.statDesigns')}</T></View>
          <View style={styles.stat}><T variant="h2" style={{ color: colors.tealDark }}>{projects.length}</T><T variant="caption">{t('profile.statProjects')}</T></View>
          <View style={styles.stat}><T variant="h2" style={{ color: colors.tealDark }}>{designs.filter((d) => d.premium).length}</T><T variant="caption">{t('profile.statPremium')}</T></View>
        </Row>
      </Card>

      <Section title={t('lang.title')}>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          <Chip label="English" icon="globe-outline" selected={language === 'en'} onPress={() => setLanguage('en')} />
          <Chip label="اردو" icon="globe-outline" selected={language === 'ur'} onPress={() => setLanguage('ur')} />
        </Row>
      </Section>

      <Section title={t('profile.city')}>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          {config.cities.map((c) => <Chip key={c} label={cityLabel(c)} icon="location-outline" selected={user?.city === c} onPress={() => user && saveUser({ ...user, city: c })} />)}
        </Row>
      </Section>

      {/* With accounts on, vendors register with a separate vendor account instead. */}
      {!auth.enabled && (
        <Card style={{ marginTop: spacing.xl, backgroundColor: colors.navy }} onPress={() => router.push('/vendor-signup')}>
          <Row>
            <IconTile icon="briefcase" bg="rgba(10,180,154,0.2)" color={colors.teal} />
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong" style={{ color: colors.white }}>{vendorApplication ? t('profile.vendorApp') : t('profile.areVendor')}</T>
              <T variant="small" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {vendorApplication ? t('profile.vendorStep', { name: vendorApplication.businessName, step: vendorApplication.step }) : t('profile.vendorJoin')}
              </T>
            </View>
            {vendorApplication ? <Badge label={t('common.inReview')} tone="amber" /> : <Ionicons name="chevron-forward" size={20} color={colors.white} />}
          </Row>
        </Card>
      )}

      <Section title={t('profile.account')}>
        <Card style={{ paddingVertical: spacing.sm }}>
          <Item icon="diamond-outline" label={t('profile.premium')} detail={t('profile.premiumDetail')} onPress={() => router.push('/premium')} />
          <Item icon="logo-whatsapp" label={t('profile.help')} detail={t('profile.helpHours')} onPress={() => Linking.openURL(`https://wa.me/${config.supportWhatsApp}`).catch(() => {})} />
          <Item icon="mail-outline" label={t('profile.email')} detail={config.supportEmail} onPress={() => Linking.openURL(`mailto:${config.supportEmail}`).catch(() => {})} />
          <Item icon="document-text-outline" label={t('profile.privacy')} onPress={() => Linking.openURL(config.privacyPolicyUrl).catch(() => {})} />
          <Item icon="reader-outline" label={t('profile.terms')} onPress={() => Linking.openURL(config.termsUrl).catch(() => {})} />
        </Card>
      </Section>

      {auth.enabled ? (
        <AccountPanel showLanguage={false} />
      ) : (
        <Button title={t('profile.deleteData')} kind="danger" icon="trash-outline" onPress={reset} style={{ marginTop: spacing.xl }} />
      )}

      <View style={{ alignItems: 'center', marginTop: spacing.xxl }}>
        <Image source={require('../../../assets/images/logo.png')} style={{ width: 110, height: 90 }} contentFit="contain" />
        <T variant="caption" style={{ marginTop: spacing.sm }}>
          {t('profile.version', { v: Constants.expoConfig?.version ?? '1.0.0', engine: aiServerConfigured() ? t('profile.engineOn') : t('profile.engineOff') })}
        </T>
        <T variant="caption">{t('profile.madeIn')}</T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, alignItems: 'center', backgroundColor: colors.tealMist, borderRadius: 12, paddingVertical: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
});
