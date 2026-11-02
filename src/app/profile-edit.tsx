import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAuth, type ProfilePatch, type VendorPatch } from '../auth/AuthProvider';
import { Avatar } from '../components/Avatar';
import { Button, Card, Chip, Field, Row, Screen, Section, T, tap } from '../components/ui';
import { config } from '../config';
import { SERVICE_ICONS, SERVICE_TYPES, STYLES, type ServiceType } from '../data/catalog';
import { budgetLabel, cityLabel, serviceLabel, styleLabel, useT } from '../i18n';
import { pickImage, uploadImage, type Bucket } from '../lib/media';
import { BUDGET_RANGES, type BudgetRange } from '../lib/supabase';
import { useApp } from '../store/useApp';
import { colors, radius, spacing } from '../theme';

const MAX_STYLES = 3;
const MAX_PHOTOS = 8;

const isLocal = (uri: string | null | undefined) => !!uri && !/^https?:\/\//.test(uri);
const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

/** Edit your own profile. Shows the fields for your role: customer preferences, vendor business profile, admin title. */
export default function ProfileEdit() {
  const { t } = useT();
  const router = useRouter();
  const auth = useAuth();
  const { user, setUser } = useApp();
  const role = auth.enabled ? auth.profile?.role ?? 'customer' : 'customer';
  const p = auth.profile;
  const v = auth.vendor;

  // Personal (all roles). Customers in on-device mode read from the local store.
  const [avatar, setAvatar] = useState<string | null>(p?.avatar_url ?? user?.avatarUri ?? null);
  const [name, setName] = useState(p?.full_name ?? user?.name ?? '');
  const [phone, setPhone] = useState(p?.phone ?? user?.phone ?? '');
  const [city, setCity] = useState(p?.city ?? user?.city ?? 'Sukkur');
  const [bio, setBio] = useState(p?.bio ?? user?.bio ?? '');
  // Customer
  const [area, setArea] = useState(p?.area ?? user?.area ?? '');
  const [styles_, setStyles] = useState<string[]>(p?.preferred_styles ?? user?.preferredStyles ?? []);
  const [budget, setBudget] = useState<BudgetRange | null>(p?.budget_range ?? user?.budget ?? null);
  // Admin
  const [jobTitle, setJobTitle] = useState(p?.job_title ?? '');
  // Vendor business profile
  const [logo, setLogo] = useState<string | null>(v?.logo_url ?? null);
  const [cover, setCover] = useState<string | null>(v?.cover_url ?? null);
  const [business, setBusiness] = useState(v?.business_name ?? '');
  const [services, setServices] = useState<ServiceType[]>((v?.services as ServiceType[] | undefined) ?? []);
  const [areas, setAreas] = useState((v?.service_areas ?? []).join(', '));
  const [hours, setHours] = useState(v?.working_hours ?? '');
  const [whatsapp, setWhatsapp] = useState(v?.whatsapp ?? '');
  const [about, setAbout] = useState(v?.about ?? '');
  const [photos, setPhotos] = useState<string[]>(v?.portfolio_urls ?? []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleStyle = (id: string) =>
    setStyles(styles_.includes(id) ? styles_.filter((s) => s !== id) : styles_.length < MAX_STYLES ? [...styles_, id] : styles_);

  const save = async () => {
    if (name.trim().length < 2) return setError(t('edit.nameRequired'));
    setError('');
    setSaving(true);
    try {
      if (!auth.enabled) {
        setUser({ name: name.trim(), phone: phone.trim(), city, avatarUri: avatar, bio: bio.trim(), area: area.trim(), preferredStyles: styles_, budget });
        router.back();
        return;
      }
      const uid = p!.id;
      // New photos are still local files: upload them and keep the public URLs.
      const up = async (bucket: Bucket, label: string, uri: string | null) => (uri && isLocal(uri) ? uploadImage(bucket, uid, label, uri) : uri);

      const patch: ProfilePatch = { full_name: name.trim(), phone: phone.trim(), city, bio: bio.trim(), avatar_url: await up('avatars', 'avatar', avatar) };
      if (role === 'customer') Object.assign(patch, { area: area.trim(), preferred_styles: styles_, budget_range: budget });
      if (role === 'admin') patch.job_title = jobTitle.trim();
      const err = await auth.updateProfile(patch);
      if (err) throw new Error(err);

      if (role === 'vendor' && v) {
        const portfolio = await Promise.all(photos.map((uri, i) => up('vendor-media', `portfolio-${i}`, uri)));
        const vpatch: VendorPatch = {
          business_name: business.trim() || v.business_name,
          services,
          service_areas: splitList(areas),
          working_hours: hours.trim(),
          whatsapp: whatsapp.trim(),
          about: about.trim(),
          logo_url: await up('vendor-media', 'logo', logo),
          cover_url: await up('vendor-media', 'cover', cover),
          portfolio_urls: portfolio.filter((x): x is string => !!x),
        };
        const verr = await auth.updateVendor(vpatch);
        if (verr) throw new Error(verr);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  };

  const choose = async (set: (u: string) => void, aspect: [number, number]) => {
    const uri = await pickImage(aspect);
    if (uri) set(uri);
  };

  return (
    <Screen
      title={t('edit.title')}
      footer={
        <View>
          {!!error && <T variant="small" style={{ color: colors.danger, marginBottom: spacing.sm }}>{error}</T>}
          <Button title={t('common.save')} icon="checkmark" loading={saving} onPress={save} />
        </View>
      }
    >
      {/* Photo */}
      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Pressable onPress={() => choose(setAvatar, [1, 1])} accessibilityRole="button" accessibilityLabel={t('edit.changePhoto')}>
          <Avatar uri={avatar} name={name || 'R'} size={104} round />
          <View style={styles.cam}><Ionicons name="camera" size={16} color={colors.white} /></View>
        </Pressable>
        <Row gap={spacing.md} style={{ marginTop: spacing.sm }}>
          <Button title={t('edit.changePhoto')} kind="ghost" small onPress={() => choose(setAvatar, [1, 1])} />
          {!!avatar && <Button title={t('edit.removePhoto')} kind="ghost" small onPress={() => setAvatar(null)} />}
        </Row>
      </View>

      <Section title={t('edit.personal')} style={{ marginTop: spacing.lg }}>
        <Field label={t('profile.name')} value={name} onChangeText={setName} autoCapitalize="words" placeholder={t('ob.namePh')} />
        <Field label={t('profile.mobile')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="03XX XXXXXXX" maxLength={13} />
        <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('profile.city')}</T>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          {config.cities.map((c) => <Chip key={c} label={cityLabel(c)} icon="location-outline" selected={city === c} onPress={() => setCity(c)} />)}
        </Row>
        {role === 'admin' && <Field label={t('edit.jobTitle')} value={jobTitle} onChangeText={setJobTitle} placeholder={t('edit.jobTitlePh')} />}
        <Field label={t('edit.bio')} value={bio} onChangeText={setBio} multiline maxLength={200} placeholder={t(role === 'vendor' ? 'edit.bioVendorPh' : role === 'admin' ? 'edit.bioAdminPh' : 'edit.bioPh')} />
      </Section>

      {role === 'customer' && (
        <Section title={t('edit.preferences')}>
          <Field label={t('edit.area')} value={area} onChangeText={setArea} placeholder={t('edit.areaPh')} />
          <T variant="bodyStrong" style={{ marginTop: spacing.lg }}>{t('edit.styles')}</T>
          <T variant="caption" style={{ marginBottom: spacing.sm }}>{t('edit.stylesHint', { n: MAX_STYLES })}</T>
          <Row style={{ flexWrap: 'wrap' }} gap={6}>
            {STYLES.map((s) => <Chip key={s.id} label={styleLabel(s.id)} color={s.furniture} selected={styles_.includes(s.id)} onPress={() => toggleStyle(s.id)} />)}
          </Row>
          <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('edit.budget')}</T>
          <Row style={{ flexWrap: 'wrap' }} gap={6}>
            {BUDGET_RANGES.map((b) => <Chip key={b} label={budgetLabel(b)} selected={budget === b} onPress={() => setBudget(budget === b ? null : b)} />)}
          </Row>
        </Section>
      )}

      {role === 'vendor' &&
        (v ? (
          <Section title={t('edit.business')}>
            <T variant="caption">{t('edit.businessHint')}</T>
            <T variant="bodyStrong" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>{t('edit.cover')}</T>
            <Pressable onPress={() => choose(setCover, [16, 9])} style={styles.coverPick} accessibilityRole="button" accessibilityLabel={t('edit.cover')}>
              {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="image-outline" size={28} color={colors.tealDark} />}
            </Pressable>
            <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
              <Pressable onPress={() => choose(setLogo, [1, 1])} accessibilityRole="button" accessibilityLabel={t('edit.logo')}>
                <Avatar uri={logo} name={business || name} size={64} bg={colors.navy} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{t('edit.logo')}</T>
                <Button title={t('edit.changePhoto')} kind="ghost" small style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => choose(setLogo, [1, 1])} />
              </View>
            </Row>
            <Field label={t('signup.business')} value={business} onChangeText={setBusiness} />
            <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('signup.services')}</T>
            <Row style={{ flexWrap: 'wrap' }} gap={6}>
              {SERVICE_TYPES.map((s) => (
                <Chip key={s} label={serviceLabel(s)} icon={SERVICE_ICONS[s]} selected={services.includes(s)} onPress={() => setServices(services.includes(s) ? services.filter((x) => x !== s) : [...services, s])} />
              ))}
            </Row>
            <Field label={t('edit.areas')} value={areas} onChangeText={setAreas} placeholder={t('edit.areasPh')} hint={t('edit.areasHint')} />
            <Field label={t('edit.hours')} value={hours} onChangeText={setHours} placeholder={t('edit.hoursPh')} />
            <Field label={t('edit.whatsapp')} value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="03XX XXXXXXX" maxLength={13} />
            <Field label={t('signup.about')} value={about} onChangeText={setAbout} multiline maxLength={400} placeholder={t('signup.aboutPh')} />

            <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('edit.portfolio', { n: photos.length, max: MAX_PHOTOS })}</T>
            <Row style={{ flexWrap: 'wrap' }}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photo}>
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <Pressable onPress={() => { tap(); setPhotos(photos.filter((x) => x !== uri)); }} style={styles.remove} accessibilityLabel={t('edit.removePhoto')} hitSlop={6}>
                    <Ionicons name="close" size={14} color={colors.white} />
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable onPress={() => choose((u) => setPhotos([...photos, u]), [4, 3])} style={[styles.photo, styles.addPhoto]} accessibilityLabel={t('signup.addPhotos')}>
                  <Ionicons name="add" size={26} color={colors.tealDark} />
                </Pressable>
              )}
            </Row>
            <Button title={t('edit.preview')} kind="secondary" icon="eye-outline" style={{ marginTop: spacing.lg }} onPress={() => router.push({ pathname: '/vendor/[id]', params: { id: v.user_id, preview: '1' } })} />
          </Section>
        ) : (
          <Card style={{ marginTop: spacing.xl, backgroundColor: colors.amberSoft }}>
            <T variant="bodyStrong">{t('vendorHub.startTitle')}</T>
            <T variant="small" style={{ marginTop: 4 }}>{t('edit.applyFirst')}</T>
            <Button title={t('vendorHub.startCta')} small style={{ marginTop: spacing.md, alignSelf: 'flex-start' }} onPress={() => router.push('/vendor-signup')} />
          </Card>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cam: { position: 'absolute', right: 2, bottom: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  coverPick: { height: 130, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.teal },
  photo: { width: 84, height: 84, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.border },
  addPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.teal },
  remove: { position: 'absolute', right: 4, top: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});
