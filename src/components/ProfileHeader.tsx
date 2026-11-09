import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import { Floor, HouseAvatar } from './brand';
import { T, tap } from './ui';

const BAND: Record<'teal' | 'amber' | 'navy', { band: string; avatar: string; initials: string }> = {
  teal: { band: colors.teal, avatar: colors.navy, initials: colors.white }, // customer
  amber: { band: colors.navy, avatar: colors.amber, initials: colors.navy }, // vendor
  navy: { band: colors.navy, avatar: colors.teal, initials: colors.white }, // admin
};

/**
 * Personal header shared by customer, vendor and admin profiles: a role-coloured band, the photo in
 * the logo's house shape standing on its floor, then name, role, details and bio.
 */
export function ProfileHeader({
  name,
  avatarUri,
  coverUri,
  roleLabel,
  roleTone,
  lines,
  bio,
  editLabel,
  onEdit,
  extra,
}: {
  name: string;
  avatarUri?: string | null;
  coverUri?: string | null;
  roleLabel: string;
  roleTone: 'teal' | 'amber' | 'navy';
  lines: string[];
  bio?: string;
  editLabel: string;
  onEdit: () => void;
  extra?: ReactNode;
}) {
  const c = BAND[roleTone];
  return (
    <View style={{ marginHorizontal: -spacing.lg }}>
      <View style={[styles.band, { backgroundColor: c.band }]}>
        {!!coverUri && <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
        <Pressable onPress={() => { tap(); onEdit(); }} accessibilityRole="button" accessibilityLabel={editLabel} style={styles.edit}>
          <Ionicons name="create-outline" size={16} color={colors.navy} />
          <T variant="small" style={{ color: colors.navy, fontFamily: fonts.bold }}>{editLabel}</T>
        </Pressable>
      </View>
      <View style={styles.avatar}>
        <HouseAvatar uri={avatarUri} name={name} size={104} bg={c.avatar} color={c.initials} ring={colors.white} />
        <Floor width={150} height={12} inset={14} />
      </View>
      <View style={styles.body}>
        <T style={styles.name}>{name}</T>
        <T variant="small" style={styles.role}>{roleLabel}</T>
        {lines.filter(Boolean).map((l) => (
          <T key={l} variant="small" style={{ marginTop: 2, textAlign: 'center' }}>{l}</T>
        ))}
        {!!bio && <T style={{ marginTop: spacing.md, color: colors.text, textAlign: 'center' }}>{bio}</T>}
        <View style={{ alignSelf: 'stretch' }}>{extra}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { height: 128, overflow: 'hidden' },
  edit: { position: 'absolute', right: spacing.lg, top: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.white, paddingHorizontal: 12, height: 34, borderRadius: 10 },
  avatar: { alignItems: 'center', marginTop: -70 },
  body: { alignItems: 'center', paddingHorizontal: spacing.lg },
  name: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.navy, letterSpacing: -0.4, marginTop: spacing.sm, textAlign: 'center' },
  role: { color: colors.tealDark, fontFamily: fonts.bold, marginTop: 2, letterSpacing: 0.4 },
});
