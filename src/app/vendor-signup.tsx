import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Chip, Field, IconTile, Row, Screen, T } from '../components/ui';
import { config } from '../config';
import { SERVICE_ICONS, SERVICE_TYPES, type ServiceType } from '../data/catalog';
import { dateLabel } from '../lib/format';
import { useApp } from '../store/useApp';
import { colors, radius, spacing } from '../theme';

const STEPS = [
  ['CNIC & phone check', 'Our field agent verifies your CNIC in person'],
  ['Portfolio review', 'We review photos of your past work'],
  ['Two customer references', 'We call two previous customers'],
  ['Orientation', 'A short session on RennovaAI standards'],
] as const;

export default function VendorSignup() {
  const { vendorApplication: app, submitVendorApplication, user } = useApp();
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState<string>(user?.city ?? 'Sukkur');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [years, setYears] = useState('');
  const [about, setAbout] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  if (app) {
    return (
      <Screen title="Vendor application">
        <Card style={{ marginTop: spacing.sm, backgroundColor: colors.tealMist }}>
          <Row>
            <IconTile icon="hourglass-outline" bg={colors.white} />
            <View style={{ flex: 1 }}>
              <T variant="h3">{app.businessName}</T>
              <T variant="small">Submitted {dateLabel(app.submittedAt)} · {app.city}</T>
            </View>
            <Badge label="IN REVIEW" tone="amber" />
          </Row>
        </Card>
        <T variant="h2" style={{ marginTop: spacing.xl }}>Verification progress</T>
        {STEPS.map(([t, b], i) => {
          const done = i < app.step - 1;
          const current = i === app.step - 1;
          return (
            <Row key={t} style={{ marginTop: spacing.md, alignItems: 'flex-start' }}>
              <Ionicons name={done ? 'checkmark-circle' : current ? 'time' : 'ellipse-outline'} size={24} color={done ? colors.success : current ? colors.amber : colors.textSubtle} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{t}</T>
                <T variant="small">{current ? 'In progress — we will WhatsApp you within 48 hours.' : b}</T>
              </View>
            </Row>
          );
        })}
        <Card style={{ marginTop: spacing.xl }}>
          <T variant="h3">Launch offer</T>
          <T variant="small" style={{ marginTop: 4 }}>The first 100 vendors pay 0% commission for three months. After that: 8–12% per booked project, or Vendor Pro at PKR 2,000/month for featured placement and priority leads.</T>
        </Card>
      </Screen>
    );
  }

  const valid = businessName.trim().length > 2 && ownerName.trim().length > 1 && phone.trim().length >= 10 && services.length > 0;

  const addPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: 6 });
    if (!res.canceled) setPhotos([...photos, ...res.assets.map((a) => a.uri)].slice(0, 6));
  };

  return (
    <Screen
      title="Become a vendor"
      footer={
        <Button
          title="Submit for verification"
          icon="shield-checkmark"
          disabled={!valid}
          onPress={() => submitVendorApplication({ businessName: businessName.trim(), ownerName: ownerName.trim(), phone: phone.trim(), city, services, years, about: about.trim(), photos })}
        />
      }
    >
      <T variant="h1" style={{ marginTop: spacing.sm }}>Grow your business with RennovaAI</T>
      <T style={{ marginTop: 6 }}>Free registration, a verified badge and qualified leads from customers who have already seen their design.</T>

      <Field label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="e.g. Indus Paint Works" />
      <Field label="Owner name" value={ownerName} onChangeText={setOwnerName} autoCapitalize="words" />
      <Field label="Mobile / WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="03XX XXXXXXX" maxLength={13} />

      <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>City</T>
      <Row style={{ flexWrap: 'wrap' }} gap={6}>
        {config.cities.map((c) => <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />)}
      </Row>

      <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Services you offer</T>
      <Row style={{ flexWrap: 'wrap' }} gap={6}>
        {SERVICE_TYPES.map((s) => (
          <Chip key={s} label={s} icon={SERVICE_ICONS[s]} selected={services.includes(s)} onPress={() => setServices(services.includes(s) ? services.filter((x) => x !== s) : [...services, s])} />
        ))}
      </Row>

      <Field label="Years of experience" value={years} onChangeText={setYears} keyboardType="number-pad" maxLength={2} />
      <Field label="About your work" value={about} onChangeText={setAbout} multiline placeholder="Specialities, team size, areas you cover" maxLength={400} />

      <T variant="bodyStrong" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Portfolio photos</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {photos.map((p) => (
          <View key={p} style={styles.photo}>
            <Image source={{ uri: p }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
        ))}
        {photos.length < 6 && (
          <Pressable onPress={addPhoto} style={[styles.photo, styles.addPhoto]} accessibilityLabel="Add portfolio photos">
            <Ionicons name="add" size={26} color={colors.tealDark} />
          </Pressable>
        )}
      </Row>
      <T variant="caption" style={{ marginTop: spacing.sm }}>Your CNIC is verified in person by our field agent — we never ask you to upload it in the app.</T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: 84, height: 84, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.border },
  addPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.teal },
});
