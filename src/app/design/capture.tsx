import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { RoomIllustration } from '../../components/RoomIllustration';
import { Button, Card, Chip, IconButton, IconTile, Row, Screen, T, tap } from '../../components/ui';
import { ROOM_TYPES } from '../../data/catalog';
import { roomLabel, useT } from '../../i18n';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const AREA_PRESETS = [60, 120, 180, 250, 350, 500];

export default function Capture() {
  const router = useRouter();
  const { t } = useT();
  const { draft, updateDraft } = useApp();

  const pick = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(t('capture.camNeeded'), t('capture.camNeededBody'));
          return;
        }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [4, 3] };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets[0]) updateDraft({ photoUri: res.assets[0].uri });
    } catch {
      Alert.alert(t('capture.camFail'), t('capture.camFailBody'));
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
          <Chip key={r.id} label={roomLabel(r.id)} icon={r.icon} selected={draft.roomTypeId === r.id} onPress={() => updateDraft({ roomTypeId: r.id, area: r.defaultArea })} />
        ))}
      </Row>

      <T variant="h2" style={{ marginTop: spacing.xxl }}>{t('capture.floorArea')}</T>
      <T variant="small" style={{ marginTop: 4 }}>{t('capture.areaHint')}</T>
      <Row style={styles.stepper}>
        <Pressable accessibilityLabel={t('capture.decrease')} onPress={() => { tap(); updateDraft({ area: Math.max(20, draft.area - 10) }); }} style={styles.stepBtn}>
          <Ionicons name="remove" size={22} color={colors.navy} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T style={{ fontFamily: fonts.extrabold, fontSize: 30, color: colors.navy }}>{draft.area}</T>
          <T variant="caption">{t('capture.sqftLong')}</T>
        </View>
        <Pressable accessibilityLabel={t('capture.increase')} onPress={() => { tap(); updateDraft({ area: Math.min(5000, draft.area + 10) }); }} style={styles.stepBtn}>
          <Ionicons name="add" size={22} color={colors.navy} />
        </Pressable>
      </Row>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
        {AREA_PRESETS.map((a) => (
          <Chip key={a} label={t('common.sqft', { n: a })} selected={draft.area === a} onPress={() => updateDraft({ area: a })} />
        ))}
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { height: 240, borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.lg, backgroundColor: '#DDD' },
  sampleTag: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.overlay, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  stepper: { marginTop: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
});
