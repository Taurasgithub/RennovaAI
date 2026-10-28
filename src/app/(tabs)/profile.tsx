import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Chip, Field, IconTile, Row, Screen, Section, T, tap, type IconName } from '../../components/ui';
import { config } from '../../config';
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
  const { user, setUser, designs, projects, vendorApplication, resetAll } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const save = () => {
    if (!user) return;
    setUser({ ...user, name: name.trim() || user.name, phone: phone.trim() });
    setEditing(false);
  };

  const reset = () => {
    const go = () => {
      resetAll();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') go();
    else Alert.alert('Delete all my data?', 'This removes your profile, designs and projects from this device.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: go }]);
  };

  const initials = (user?.name ?? 'R').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen back={false} title="Profile">
      <Card style={{ marginTop: spacing.sm }}>
        <Row gap={spacing.md}>
          <View style={styles.avatar}><T style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 22 }}>{initials}</T></View>
          <View style={{ flex: 1 }}>
            <T variant="h2">{user?.name}</T>
            <T variant="small">{user?.phone || 'No phone added'} · {user?.city}</T>
          </View>
          <Button title={editing ? 'Cancel' : 'Edit'} kind="secondary" small onPress={() => setEditing(!editing)} />
        </Row>
        {editing && (
          <>
            <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="03XX XXXXXXX" />
            <Button title="Save" onPress={save} style={{ marginTop: spacing.lg }} />
          </>
        )}
        <Row style={{ marginTop: spacing.lg }} gap={spacing.sm}>
          <View style={styles.stat}><T variant="h2" style={{ color: colors.tealDark }}>{designs.length}</T><T variant="caption">Designs</T></View>
          <View style={styles.stat}><T variant="h2" style={{ color: colors.tealDark }}>{projects.length}</T><T variant="caption">Projects</T></View>
          <View style={styles.stat}><T variant="h2" style={{ color: colors.tealDark }}>{designs.filter((d) => d.premium).length}</T><T variant="caption">Premium packs</T></View>
        </Row>
      </Card>

      <Section title="City">
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          {config.cities.map((c) => <Chip key={c} label={c} icon="location-outline" selected={user?.city === c} onPress={() => user && setUser({ ...user, city: c })} />)}
        </Row>
      </Section>

      <Card style={{ marginTop: spacing.xl, backgroundColor: colors.navy }} onPress={() => router.push('/vendor-signup')}>
        <Row>
          <IconTile icon="briefcase" bg="rgba(10,180,154,0.2)" color={colors.teal} />
          <View style={{ flex: 1 }}>
            <T variant="bodyStrong" style={{ color: colors.white }}>{vendorApplication ? 'Your vendor application' : 'Are you a vendor?'}</T>
            <T variant="small" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {vendorApplication ? `${vendorApplication.businessName} · verification step ${vendorApplication.step} of 4` : 'Join free and get qualified renovation leads.'}
            </T>
          </View>
          {vendorApplication ? <Badge label="IN REVIEW" tone="amber" /> : <Ionicons name="chevron-forward" size={20} color={colors.white} />}
        </Row>
      </Card>

      <Section title="Account">
        <Card style={{ paddingVertical: spacing.sm }}>
          <Item icon="diamond-outline" label="Premium Design Pack" detail="Unlimited regenerations, HD export, shopping list" onPress={() => router.push('/premium')} />
          <Item icon="logo-whatsapp" label="Help & support" detail="9 am – 9 pm, 7 days" onPress={() => Linking.openURL(`https://wa.me/${config.supportWhatsApp}`).catch(() => {})} />
          <Item icon="mail-outline" label="Email us" detail={config.supportEmail} onPress={() => Linking.openURL(`mailto:${config.supportEmail}`).catch(() => {})} />
          <Item icon="document-text-outline" label="Privacy policy" onPress={() => Linking.openURL(config.privacyPolicyUrl).catch(() => {})} />
          <Item icon="reader-outline" label="Terms of service" onPress={() => Linking.openURL(config.termsUrl).catch(() => {})} />
        </Card>
      </Section>

      <Button title="Delete my data & sign out" kind="danger" icon="trash-outline" onPress={reset} style={{ marginTop: spacing.xl }} />

      <View style={{ alignItems: 'center', marginTop: spacing.xxl }}>
        <Image source={require('../../../assets/images/logo.png')} style={{ width: 110, height: 90 }} contentFit="contain" />
        <T variant="caption" style={{ marginTop: spacing.sm }}>
          Version {Constants.expoConfig?.version ?? '1.0.0'} · AI engine: {aiServerConfigured() ? 'connected' : 'on-device preview'}
        </T>
        <T variant="caption">Made in Sukkur 🇵🇰</T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, alignItems: 'center', backgroundColor: colors.tealMist, borderRadius: 12, paddingVertical: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
});
