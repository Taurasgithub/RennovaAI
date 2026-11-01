import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '../i18n';
import { type Language, useApp } from '../store/useApp';
import { colors, fonts, radius, shadow } from '../theme';
import { tap } from './ui';

const OPTIONS: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ur', label: 'اردو' },
];

/** Globe pill with a dropdown to switch between English and Urdu. */
export function LanguagePicker() {
  const language = useApp((s) => s.language);
  const setLanguage = useApp((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const { t } = useT();

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('lang.change')}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          tap();
          setOpen(!open);
        }}
        style={({ pressed }) => [styles.pill, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="globe-outline" size={18} color={colors.navy} />
        <Text style={[styles.pillText, language === 'ur' && styles.urdu]}>{OPTIONS.find((o) => o.id === language)?.label}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={colors.navy} />
      </Pressable>

      {open && (
        <View style={styles.menu}>
          {OPTIONS.map((o) => {
            const selected = o.id === language;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                onPress={() => {
                  tap();
                  setLanguage(o.id);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.tealMist }]}
              >
                <View style={styles.check}>{selected && <Ionicons name="checkmark" size={17} color={colors.teal} />}</View>
                <Text style={[styles.itemText, o.id === 'ur' && styles.urdu]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#BFE9E1',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.navy },
  menu: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 138,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    ...shadow.raised,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  check: { width: 24 },
  itemText: { fontFamily: fonts.medium, fontSize: 14, color: colors.navy },
  urdu: { fontFamily: fonts.urdu, fontSize: 15, lineHeight: 30 },
});
