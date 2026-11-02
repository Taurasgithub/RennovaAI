import { Image } from 'expo-image';
import { View } from 'react-native';
import { colors, fonts } from '../theme';
import { T } from './ui';

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'R';

/** Profile photo, or initials on a coloured tile when there is none. */
export function Avatar({ uri, name, size = 52, bg = colors.teal, round }: { uri?: string | null; name: string; size?: number; bg?: string; round?: boolean }) {
  const r = round ? size / 2 : size * 0.3;
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.border }} contentFit="cover" transition={150} />;
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <T style={{ color: colors.white, fontFamily: fonts.bold, fontSize: size * 0.36 }}>{initialsOf(name)}</T>
    </View>
  );
}
