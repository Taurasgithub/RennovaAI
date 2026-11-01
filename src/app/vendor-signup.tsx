import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { Badge, Button, Card, Chip, Field, IconTile, Row, Screen, T } from '../components/ui';
import { config } from '../config';
import { SERVICE_ICONS, SERVICE_TYPES, type ServiceType } from '../data/catalog';
import { dateLabel } from '../lib/format';
import { cityLabel, serviceLabel, useT, type TKey } from '../i18n';
import { supabase, type VendorStatus } from '../lib/supabase';
import { useApp } from '../store/useApp';
import { colors, radius, spacing } from '../theme';

const STEPS: [TKey, TKey][] = [
  ['signup.step1', 'signup.step1.body'],
  ['signup.step2', 'signup.step2.body'],
  ['signup.step3', 'signup.step3.body'],
  ['signup.step4', 'signup.step4.body'],
];

type Application = { businessName: string; submittedAt: string; city: string; step: number; status: VendorStatus; note: string | null };

const STATUS: Record<VendorStatus, { label: TKey; tone: 'amber' | 'green' | 'gray'; icon: 'hourglass-outline' | 'shield-checkmark' | 'alert-circle-outline' }> = {
  pending: { label: 'common.inReview', tone: 'amber', icon: 'hourglass-outline' },
  approved: { label: 'vendorHub.approved', tone: 'green', icon: 'shield-checkmark' },
  rejected: { label: 'vendorHub.rejected', tone: 'gray', icon: 'alert-circle-outline' },
};

export default function VendorSignup() {
  const { t } = useT();
  const auth = useAuth();
  const { vendorApplication: local, submitVendorApplication, user } = useApp();
  const remote = auth.enabled ? auth.vendor : null;
  // With accounts on the application lives in Supabase; otherwise it stays on this device.
  const app: Application | null = auth.enabled
    ? remote && { businessName: remote.business_name, submittedAt: remote.submitted_at, city: remote.city, step: remote.verification_step, status: remote.status, note: remote.review_note }
    : local && { businessName: local.businessName, submittedAt: local.submittedAt, city: local.city, step: local.step, status: 'pending', note: null };

  const [editing, setEditing] = useState(false);
  const [businessName, setBusinessName] = useState(remote?.business_name ?? '');
  const [ownerName, setOwnerName] = useState(remote?.owner_name ?? user?.name ?? auth.profile?.full_name ?? '');
  const [phone, setPhone] = useState(remote?.phone ?? user?.phone ?? auth.profile?.phone ?? '');
  const [city, setCity] = useState<string>(remote?.city ?? user?.city ?? auth.profile?.city ?? 'Sukkur');
  const [services, setServices] = useState<ServiceType[]>((remote?.services as ServiceType[] | undefined) ?? []);
  const [years, setYears] = useState(remote?.years_experience != null ? String(remote.years_experience) : '');
  const [about, setAbout] = useState(remote?.about ?? '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (app && !editing) {
    const st = STATUS[app.status];
    const approved = app.status === 'approved';
    return (
      <Screen title={t('signup.appTitle')}>
        <Card style={{ marginTop: spacing.sm, backgroundColor: colors.tealMist }}>
          <Row>
            <IconTile icon={st.icon} bg={colors.white} />
            <View style={{ flex: 1 }}>
              <T variant="h3">{app.businessName}</T>
              <T variant="small">{t('signup.submitted', { date: dateLabel(app.submittedAt), city: cityLabel(app.city) })}</T>
            </View>
            <Badge label={t(st.label)} tone={st.tone} />
          </Row>
          {app.status === 'rejected' && (
            <>
              <T variant="small" style={{ marginTop: spacing.md, color: colors.text }}>{app.note || t('vendorHub.rejectedBody')}</T>
              <Button title={t('vendorHub.resubmit')} icon="create-outline" small style={{ marginTop: spacing.md, alignSelf: 'flex-start' }} onPress={() => setEditing(true)} />
            </>
          )}
        </Card>
        <T variant="h2" style={{ marginTop: spacing.xl }}>{t('signup.progress')}</T>
        {STEPS.map(([title, body], i) => {
          const done = approved || i < app.step - 1;
          const current = !approved && i === app.step - 1;
          return (
            <Row key={title} style={{ marginTop: spacing.md, alignItems: 'flex-start' }}>
              <Ionicons name={done ? 'checkmark-circle' : current ? 'time' : 'ellipse-outline'} size={24} color={done ? colors.success : current ? colors.amber : colors.textSubtle} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{t(title)}</T>
                <T variant="small">{current ? t('signup.inProgress') : t(body)}</T>
              </View>
            </Row>
          );
        })}
        <Card style={{ marginTop: spacing.xl }}>
          <T variant="h3">{t('signup.offer')}</T>
          <T variant="small" style={{ marginTop: 4 }}>{t('signup.offerBody')}</T>
        </Card>
      </Screen>
    );
  }

  const valid = businessName.trim().length > 2 && ownerName.trim().length > 1 && phone.trim().length >= 10 && services.length > 0;

  const submit = async () => {
    if (!auth.enabled) {
      submitVendorApplication({ businessName: businessName.trim(), ownerName: ownerName.trim(), phone: phone.trim(), city, services, years, about: about.trim(), photos });
      return;
    }
    if (!auth.profile) return;
    setSaving(true);
    setError('');
    // TODO(go-live): upload portfolio photos to Supabase Storage; they are not sent yet.
    const { error: err } = await supabase.from('vendor_profiles').upsert({
      user_id: auth.profile.id,
      business_name: businessName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      city,
      services,
      years_experience: years ? Number(years) : null,
      about: about.trim(),
    });
    setSaving(false);
    if (err) return setError(err.message);
    await auth.refresh();
    setEditing(false);
  };

  const addPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: 6 });
    if (!res.canceled) setPhotos([...photos, ...res.assets.map((a) => a.uri)].slice(0, 6));
  };

  return (
    <Screen
      title={t('signup.title')}
      footer={
        <View>
          {!!error && <T variant="small" style={{ color: colors.danger, marginBottom: spacing.sm }}>{error}</T>}
          <Button title={t(editing ? 'vendorHub.resubmit' : 'signup.submit')} icon="shield-checkmark" disabled={!valid} loading={saving} onPress={submit} />
        </View>
      }
    >
      <T variant="h1" style={{ marginTop: spacing.sm }}>{t('signup.heading')}</T>
      <T style={{ marginTop: 6 }}>{t('signup.intro')}</T>

      <Field label={t('signup.business')} value={businessName} onChangeText={setBusinessName} placeholder={t('signup.businessPh')} />
      <Field label={t('signup.owner')} value={ownerName} onChangeText={setOwnerName} autoCapitalize="words" />
      <Field label={t('signup.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="03XX XXXXXXX" maxLength={13} />

      <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('signup.city')}</T>
      <Row style={{ flexWrap: 'wrap' }} gap={6}>
        {config.cities.map((c) => <Chip key={c} label={cityLabel(c)} selected={city === c} onPress={() => setCity(c)} />)}
      </Row>

      <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('signup.services')}</T>
      <Row style={{ flexWrap: 'wrap' }} gap={6}>
        {SERVICE_TYPES.map((s) => (
          <Chip key={s} label={serviceLabel(s)} icon={SERVICE_ICONS[s]} selected={services.includes(s)} onPress={() => setServices(services.includes(s) ? services.filter((x) => x !== s) : [...services, s])} />
        ))}
      </Row>

      <Field label={t('signup.years')} value={years} onChangeText={setYears} keyboardType="number-pad" maxLength={2} />
      <Field label={t('signup.about')} value={about} onChangeText={setAbout} multiline placeholder={t('signup.aboutPh')} maxLength={400} />

      <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('signup.photos')}</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {photos.map((p) => (
          <View key={p} style={styles.photo}>
            <Image source={{ uri: p }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
        ))}
        {photos.length < 6 && (
          <Pressable onPress={addPhoto} style={[styles.photo, styles.addPhoto]} accessibilityLabel={t('signup.addPhotos')}>
            <Ionicons name="add" size={26} color={colors.tealDark} />
          </Pressable>
        )}
      </Row>
      <T variant="caption" style={{ marginTop: spacing.sm }}>{t('signup.cnic')}</T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: 84, height: 84, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.border },
  addPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.teal },
});
