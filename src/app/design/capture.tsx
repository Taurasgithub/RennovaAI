import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { notify } from '../../lib/dialogs';
import { preparePhoto } from '../../lib/images';
import { RoomIllustration } from '../../components/RoomIllustration';
import { Button, Card, Chip, IconButton, IconTile, Row, Screen, T, tap } from '../../components/ui';
import { ROOM_TYPES } from '../../data/catalog';
import { roomLabel, useT } from '../../i18n';
import { useApp } from '../../store/useApp';
import { useShallow } from 'zustand/react/shallow';
import { colors, fonts, radius, spacing } from '../../theme';

const AREA_PRESETS = [60, 120, 180, 250, 350, 500];

/** Accepts "12", "12.5" or "12,5"; anything else (or out of range) counts as not entered. */
const parseFeet = (s: string) => {
  const n = Number(s.replace(',', '.').trim());
  return s.trim() && Number.isFinite(n) && n >= 3 && n <= 200 ? n : undefined;
};

export default function Capture() {
  const router = useRouter();
  const { t } = useT();
  const { draft, updateDraft } = useApp(useShallow((s) => ({ draft: s.draft, updateDraft: s.updateDraft })));
  const [lengthText, setLengthText] = useState(draft.lengthFt ? String(draft.lengthFt) : '');
  const [widthText, setWidthText] = useState(draft.widthFt ? String(draft.widthFt) : '');

  // Both dimensions valid → area follows them. Otherwise the area stays as set by the stepper/presets.
  const setDims = (lText: string, wText: string) => {
    setLengthText(lText);
    setWidthText(wText);
    const lengthFt = parseFeet(lText);
    const widthFt = parseFeet(wText);
    if (lengthFt && widthFt) updateDraft({ lengthFt, widthFt, area: Math.max(20, Math.round(lengthFt * widthFt)) });
    else updateDraft({ lengthFt: undefined, widthFt: undefined });
  };
  // Picking an area directly means the typed dimensions no longer apply.
  const setArea = (area: number) => {
    setLengthText('');
    setWidthText('');
    updateDraft({ area, lengthFt: undefined, widthFt: undefined });
  };

  const pick = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          notify(t('capture.camNeeded'), t('capture.camNeededBody'));
          return;
        }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [4, 3] };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets[0]) updateDraft({ photoUri: await preparePhoto(res.assets[0].uri) });
    } catch (e) {
      console.warn('[capture] photo pick failed', e);
      notify(t('capture.camFail'), t('capture.camFailBody'));
    }
  };

  return (
    <Screen
      title={t('capture.title')}
      footer={<Button title={t('capture.continue')} iconRight="arrow-forward" onPress={() => router.push('/design/customize')} />}
    >
      <T variant="h1" style={{ marginTop: spacing.sm }}>{t('capture.heading')}</T>
      <T style={{ marginTop: 6 }}>{t('capture.intro')}</T>

      <View style={styles.preview}>
        {draft.photoUri ? (
          <>
            <Image source={{ uri: draft.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={{ position: 'absolute', right: 10, top: 10 }}>
              <IconButton icon="close" label={t('capture.removePhoto')} onPress={() => updateDraft({ photoUri: null })} size={34} />
            </View>
          </>
        ) : (
          <>
            <RoomIllustration worn />
            <View style={styles.sampleTag}>
              <Ionicons name="image-outline" size={13} color={colors.white} />
              <T variant="caption" style={{ color: colors.white, fontFamily: fonts.semibold }}>{t('capture.sample')}</T>
            </View>
          </>
        )}
      </View>

      <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
        {Platform.OS !== 'web' && (
          <Button title={t('capture.takePhoto')} icon="camera" onPress={() => pick('camera')} style={{ flex: 1 }} />
        )}
        <Button title={t('capture.gallery')} icon="images-outline" kind="secondary" onPress={() => pick('library')} style={{ flex: 1 }} />
      </Row>

      <Card style={{ marginTop: spacing.lg, backgroundColor: colors.tealMist }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <IconTile icon="bulb-outline" size={36} />
          <T variant="small" style={{ flex: 1 }}>
            {t('capture.tips')}
          </T>
        </Row>
      </Card>

      <T variant="h2" style={{ marginTop: spacing.xxl }}>{t('capture.roomType')}</T>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }}>
        {ROOM_TYPES.map((r) => (
          <Chip key={r.id} label={roomLabel(r.id)} icon={r.icon} selected={draft.roomTypeId === r.id} onPress={() => { setArea(r.defaultArea); updateDraft({ roomTypeId: r.id }); }} />
        ))}
      </Row>

      <T variant="h2" style={{ marginTop: spacing.xxl }}>{t('capture.floorArea')}</T>
      <T variant="small" style={{ marginTop: 4 }}>{t('capture.dimsHint')}</T>
      <Row style={{ marginTop: spacing.md, alignItems: 'flex-end' }} gap={spacing.sm}>
        <View style={{ flex: 1 }}>
          <T variant="bodyStrong" style={styles.dimLabel}>{t('capture.length')}</T>
          <View style={styles.dimBox}>
            <TextInput
              value={lengthText}
              onChangeText={(v) => setDims(v, widthText)}
              placeholder="15"
              placeholderTextColor={colors.textSubtle}
              keyboardType="decimal-pad"
              maxLength={5}
              accessibilityLabel={t('capture.length')}
              style={styles.dimInput}
            />
            <T variant="small" style={styles.dimUnit}>{t('capture.ft')}</T>
          </View>
        </View>
        <T style={styles.times}>×</T>
        <View style={{ flex: 1 }}>
          <T variant="bodyStrong" style={styles.dimLabel}>{t('capture.width')}</T>
          <View style={styles.dimBox}>
            <TextInput
              value={widthText}
              onChangeText={(v) => setDims(lengthText, v)}
              placeholder="12"
              placeholderTextColor={colors.textSubtle}
              keyboardType="decimal-pad"
              maxLength={5}
              accessibilityLabel={t('capture.width')}
              style={styles.dimInput}
            />
            <T variant="small" style={styles.dimUnit}>{t('capture.ft')}</T>
          </View>
        </View>
      </Row>
      {(!!lengthText || !!widthText) && !(draft.lengthFt && draft.widthFt) && (
        <T variant="caption" style={{ marginTop: 6, color: colors.amberDark }}>{t('capture.dimsIncomplete')}</T>
      )}
      <Row style={styles.stepper}>
        <Pressable accessibilityLabel={t('capture.decrease')} onPress={() => { tap(); setArea(Math.max(20, draft.area - 10)); }} style={styles.stepBtn}>
          <Ionicons name="remove" size={22} color={colors.navy} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T style={{ fontFamily: fonts.extrabold, fontSize: 30, color: colors.navy }}>{draft.area}</T>
          <T variant="caption">
            {draft.lengthFt && draft.widthFt ? t('capture.dimsArea', { l: draft.lengthFt, w: draft.widthFt }) : t('capture.sqftLong')}
          </T>
        </View>
        <Pressable accessibilityLabel={t('capture.increase')} onPress={() => { tap(); setArea(Math.min(5000, draft.area + 10)); }} style={styles.stepBtn}>
          <Ionicons name="add" size={22} color={colors.navy} />
        </Pressable>
      </Row>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
        {AREA_PRESETS.map((a) => (
          <Chip key={a} label={t('common.sqft', { n: a })} selected={draft.area === a && !draft.lengthFt} onPress={() => setArea(a)} />
        ))}
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { height: 240, borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.lg, backgroundColor: '#DDD' },
  sampleTag: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.overlay, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  dimLabel: { marginBottom: spacing.sm, color: colors.navy },
  dimBox: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: spacing.md },
  // minWidth: 0 stops the input overflowing its box on web (flex items default to their content width).
  dimInput: { flex: 1, minWidth: 0, height: '100%', fontFamily: fonts.bold, fontSize: 18, color: colors.navy },
  dimUnit: { color: colors.textSubtle, fontFamily: fonts.semibold },
  times: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.textSubtle, paddingBottom: 14 },
  stepper: { marginTop: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
});
