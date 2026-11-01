import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AfterView } from '../../components/DesignPreview';
import { Badge, Button, Chip, Field, Row, Screen, T, tap } from '../../components/ui';
import { CEILINGS, EXTRAS, FLOORING, PALETTES, STYLES, WALL_FINISHES } from '../../data/catalog';
import { estimateCost } from '../../lib/estimate';
import { pkrRangeShort } from '../../lib/format';
import { ceilingLabel, extraLabel, floorLabel, paletteLabel, serviceLabel, styleBlurb, styleLabel, useT, wallLabel } from '../../i18n';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <T variant="h2" style={{ marginBottom: spacing.md }}>{title}</T>
      {children}
    </View>
  );
}

export default function Customize() {
  const router = useRouter();
  const { t } = useT();
  const { draft, updateDraft, user } = useApp();
  const est = estimateCost(draft, user?.city ?? 'Sukkur');

  const toggleExtra = (id: string) =>
    updateDraft({ extras: draft.extras.includes(id) ? draft.extras.filter((e) => e !== id) : [...draft.extras, id] });

  return (
    <Screen
      title={t('customize.title')}
      footer={
        <Row gap={spacing.md}>
          <View style={{ flex: 1 }}>
            <T variant="caption">{t('customize.range')}</T>
            <T variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.navy }}>{pkrRangeShort(est.low, est.high)}</T>
          </View>
          <Button title={t('customize.generate')} icon="sparkles" kind="amber" onPress={() => router.push('/design/generate')} style={{ flex: 1.3 }} />
        </Row>
      }
    >
      <View style={styles.preview}>
        <AfterView choices={draft} photoUri={draft.photoUri} resultUri={null} resultMode={draft.photoUri ? 'preview' : 'illustration'} />
        <View style={styles.live}>
          <View style={styles.liveDot} />
          <T variant="caption" style={{ color: colors.white, fontFamily: fonts.bold }}>{t('customize.live')}</T>
        </View>
      </View>

      <Group title={t('customize.style')}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
          {STYLES.map((s) => {
            const sel = draft.styleId === s.id;
            return (
              <Pressable key={s.id} onPress={() => { tap(); updateDraft({ styleId: s.id }); }} style={[styles.styleCard, sel && styles.selected]}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={[styles.styleSwatch, { backgroundColor: s.furniture }]} />
                  {sel && <Ionicons name="checkmark-circle" size={20} color={colors.teal} />}
                </Row>
                <T variant="bodyStrong" style={{ marginTop: spacing.sm }}>{styleLabel(s.id)}</T>
                <T variant="caption" numberOfLines={2}>{styleBlurb(s.id)}</T>
              </Pressable>
            );
          })}
        </ScrollView>
      </Group>

      <Group title={t('customize.palette')}>
        <View style={styles.paletteGrid}>
          {PALETTES.map((p) => {
            const sel = draft.paletteId === p.id;
            return (
              <Pressable key={p.id} accessibilityLabel={paletteLabel(p.id)} onPress={() => { tap(); updateDraft({ paletteId: p.id }); }} style={[styles.palette, sel && styles.selected]}>
                <View style={styles.paletteSwatch}>
                  <View style={{ flex: 3, backgroundColor: p.wall }} />
                  <View style={{ flex: 1, backgroundColor: p.accent }} />
                  <View style={{ flex: 1, backgroundColor: p.trim }} />
                </View>
                <T variant="caption" numberOfLines={1} style={{ color: colors.navy, fontFamily: fonts.semibold, marginTop: 6 }}>{paletteLabel(p.id)}</T>
              </Pressable>
            );
          })}
        </View>
      </Group>

      <Group title={t('customize.wall')}>
        <Row style={{ flexWrap: 'wrap' }}>
          {WALL_FINISHES.map((m) => (
            <Chip key={m.id} label={wallLabel(m.id)} selected={draft.wallFinishId === m.id} onPress={() => updateDraft({ wallFinishId: m.id })} />
          ))}
        </Row>
      </Group>

      <Group title={t('customize.flooring')}>
        <Row style={{ flexWrap: 'wrap' }}>
          {FLOORING.map((m) => (
            <Chip key={m.id} label={floorLabel(m.id)} color={m.colour} selected={draft.flooringId === m.id} onPress={() => updateDraft({ flooringId: m.id })} />
          ))}
        </Row>
      </Group>

      <Group title={t('customize.ceiling')}>
        <Row style={{ flexWrap: 'wrap' }}>
          {CEILINGS.map((m) => (
            <Chip key={m.id} label={ceilingLabel(m.id)} selected={draft.ceilingId === m.id} onPress={() => updateDraft({ ceilingId: m.id })} />
          ))}
        </Row>
      </Group>

      <Group title={t('customize.addons')}>
        {EXTRAS.map((x) => {
          const on = draft.extras.includes(x.id);
          return (
            <Pressable key={x.id} onPress={() => { tap(); toggleExtra(x.id); }} style={[styles.extra, on && styles.selected]}>
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.teal : colors.textSubtle} />
              <T variant="bodyStrong" style={{ flex: 1 }}>{extraLabel(x.id)}</T>
              <Badge label={serviceLabel(x.service).toUpperCase()} tone="gray" />
            </Pressable>
          );
        })}
      </Group>

      <Field
        label={t('customize.notes')}
        value={draft.notes}
        onChangeText={(notes) => updateDraft({ notes })}
        placeholder={t('customize.notesPh')}
        multiline
        maxLength={300}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { height: 220, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#DDD', marginTop: spacing.sm },
  live: { position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.overlay, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.amber },
  styleCard: { width: 148, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border },
  styleSwatch: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  selected: { borderColor: colors.teal, backgroundColor: colors.tealMist },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  palette: { width: '23.5%', flexGrow: 1, padding: 6, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  paletteSwatch: { height: 44, borderRadius: 8, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  extra: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, marginBottom: spacing.sm },
});
