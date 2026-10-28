import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { RoomIllustration } from '../../components/RoomIllustration';
import { Button, Card, Chip, IconButton, IconTile, Row, Screen, T, tap } from '../../components/ui';
import { ROOM_TYPES } from '../../data/catalog';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const AREA_PRESETS = [60, 120, 180, 250, 350, 500];

export default function Capture() {
  const router = useRouter();
  const { draft, updateDraft } = useApp();

  const pick = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph your room, or choose a photo from your gallery.');
          return;
        }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [4, 3] };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets[0]) updateDraft({ photoUri: res.assets[0].uri });
    } catch {
      Alert.alert('Could not open camera', 'Please try choosing a photo from your gallery instead.');
    }
  };

  return (
    <Screen
      title="Step 1 of 3 · Scan"
      footer={<Button title="Continue to design" iconRight="arrow-forward" onPress={() => router.push('/design/customize')} />}
    >
      <T variant="h1" style={{ marginTop: spacing.sm }}>Photograph your room</T>
      <T style={{ marginTop: 6 }}>Stand in a corner and capture as much of the room as possible in good daylight.</T>

      <View style={styles.preview}>
        {draft.photoUri ? (
          <>
            <Image source={{ uri: draft.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={{ position: 'absolute', right: 10, top: 10 }}>
              <IconButton icon="close" label="Remove photo" onPress={() => updateDraft({ photoUri: null })} size={34} />
            </View>
          </>
        ) : (
          <>
            <RoomIllustration worn />
            <View style={styles.sampleTag}>
              <Ionicons name="image-outline" size={13} color={colors.white} />
              <T variant="caption" style={{ color: colors.white, fontFamily: fonts.semibold }}>Sample room — add your own photo below</T>
            </View>
          </>
        )}
      </View>

      <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
        {Platform.OS !== 'web' && (
          <Button title="Take photo" icon="camera" onPress={() => pick('camera')} style={{ flex: 1 }} />
        )}
        <Button title="Gallery" icon="images-outline" kind="secondary" onPress={() => pick('library')} style={{ flex: 1 }} />
      </Row>

      <Card style={{ marginTop: spacing.lg, backgroundColor: colors.tealMist }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <IconTile icon="bulb-outline" size={36} />
          <T variant="small" style={{ flex: 1 }}>
            Tips: switch on the lights, open curtains, and keep the camera at chest height. Clear clutter for the most accurate AI preview.
          </T>
        </Row>
      </Card>

      <T variant="h2" style={{ marginTop: spacing.xxl }}>Room type</T>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }}>
        {ROOM_TYPES.map((r) => (
          <Chip key={r.id} label={r.label} icon={r.icon} selected={draft.roomTypeId === r.id} onPress={() => updateDraft({ roomTypeId: r.id, area: r.defaultArea })} />
        ))}
      </Row>

      <T variant="h2" style={{ marginTop: spacing.xxl }}>Floor area</T>
      <T variant="small" style={{ marginTop: 4 }}>Used by the cost engine. A 12×15 ft room is 180 sq ft.</T>
      <Row style={styles.stepper}>
        <Pressable accessibilityLabel="Decrease area" onPress={() => { tap(); updateDraft({ area: Math.max(20, draft.area - 10) }); }} style={styles.stepBtn}>
          <Ionicons name="remove" size={22} color={colors.navy} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T style={{ fontFamily: fonts.extrabold, fontSize: 30, color: colors.navy }}>{draft.area}</T>
          <T variant="caption">square feet</T>
        </View>
        <Pressable accessibilityLabel="Increase area" onPress={() => { tap(); updateDraft({ area: Math.min(5000, draft.area + 10) }); }} style={styles.stepBtn}>
          <Ionicons name="add" size={22} color={colors.navy} />
        </Pressable>
      </Row>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
        {AREA_PRESETS.map((a) => (
          <Chip key={a} label={`${a} sq ft`} selected={draft.area === a} onPress={() => updateDraft({ area: a })} />
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
