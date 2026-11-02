import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';
import { Avatar } from './Avatar';
import { Badge, Button, T } from './ui';

/** Personal header shared by customer, vendor and admin profiles: cover, avatar, name, role, details and bio. */
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
  return (
    <View style={styles.card}>
      <View style={styles.cover}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <LinearGradient colors={[colors.teal, colors.tealDeep, colors.navy]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarRing}>
            <Avatar uri={avatarUri} name={name} size={84} round />
          </View>
          <Button title={editLabel} kind="secondary" icon="create-outline" small onPress={onEdit} style={{ marginBottom: 4 }} />
        </View>
        <T variant="h1" style={{ marginTop: spacing.sm }}>{name}</T>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <Badge label={roleLabel} tone={roleTone} />
        </View>
        {lines.filter(Boolean).map((l) => (
          <T key={l} variant="small" style={{ marginTop: 4 }}>{l}</T>
        ))}
        {!!bio && <T style={{ marginTop: spacing.md, color: colors.text }}>{bio}</T>}
        {extra}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.sm, borderRadius: radius.xl, backgroundColor: colors.white, overflow: 'hidden', ...shadow.card },
  cover: { height: 110, backgroundColor: colors.tealSoft },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -42 },
  avatarRing: { borderWidth: 4, borderColor: colors.white, borderRadius: 50, backgroundColor: colors.white },
});
