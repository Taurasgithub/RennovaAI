import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, Share, View } from 'react-native';
import { DesignCompare } from '../../components/DesignPreview';
import { Badge, Button, Card, Chip, Divider, EmptyState, IconButton, IconTile, Row, Screen, T } from '../../components/ui';
import { config } from '../../config';
import { CEILINGS, EXTRAS, FLOORING, PALETTES, ROOM_TYPES, STYLES, WALL_FINISHES, findById } from '../../data/catalog';
import { estimateCost } from '../../lib/estimate';
import { pkr } from '../../lib/format';
import { generateDesign } from '../../services/ai';
import { useApp } from '../../store/useApp';
import { colors, fonts, spacing } from '../../theme';

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { designs, updateDesign, deleteDesign, user } = useApp();
  const design = designs.find((d) => d.id === id);
  const [busy, setBusy] = useState(false);

  if (!design) return <Screen title="Design"><EmptyState icon="alert-circle-outline" title="Design not found" body="It may have been deleted." /></Screen>;

  const c = design.choices;
  const remaining = design.premium ? Infinity : config.freeRegenerationsPerDesign - design.regenerations;
  const city = user?.city ?? 'Sukkur';

  const applyChange = async (patch: Partial<typeof c>, countsAsRegen: boolean) => {
    if (countsAsRegen && remaining <= 0) {
      router.push({ pathname: '/premium', params: { designId: design.id } });
      return;
    }
    const choices = { ...c, ...patch };
    setBusy(true);
    try {
      const res = await generateDesign({ ...choices, photoUri: design.photoUri }, design.regenerations + 1);
      updateDesign(design.id, {
        choices,
        resultUri: res.uri,
        resultMode: res.mode,
        estimate: estimateCost(choices, city),
        regenerations: design.regenerations + (countsAsRegen ? 1 : 0),
      });
    } catch (e) {
      Alert.alert('Could not regenerate', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const summary: [string, string][] = [
    ['Room', `${findById(ROOM_TYPES, c.roomTypeId).label} · ${c.area} sq ft`],
    ['Style', findById(STYLES, c.styleId).label],
    ['Palette', findById(PALETTES, c.paletteId).label],
    ['Walls', findById(WALL_FINISHES, c.wallFinishId).label],
    ['Flooring', findById(FLOORING, c.flooringId).label],
    ['Ceiling', findById(CEILINGS, c.ceilingId).label],
  ];
  if (c.extras.length) summary.push(['Add-ons', c.extras.map((e) => EXTRAS.find((x) => x.id === e)?.label).filter(Boolean).join(', ')]);

  return (
    <Screen
      title={design.name}
      right={
        <IconButton
          icon="share-social-outline"
          label="Share design"
          onPress={() =>
            Share.share({ message: `My ${design.name} on RennovaAI — estimated ${pkr(design.estimate.low)}–${pkr(design.estimate.high)}. See it before you build it!` }).catch(() => {})
          }
        />
      }
      footer={<Button title="Get quotes from vendors" icon="people" onPress={() => router.push({ pathname: '/compare', params: { id: design.id } })} />}
    >
      <View style={{ marginTop: spacing.sm, opacity: busy ? 0.5 : 1 }}>
        <DesignCompare {...design} height={300} />
      </View>

      <Row style={{ marginTop: spacing.md, flexWrap: 'wrap' }} gap={6}>
        {design.resultMode === 'ai' && <Badge label="AI RENDER" tone="teal" icon="sparkles" />}
        {design.resultMode === 'preview' && <Badge label="PREVIEW MODE" tone="amber" icon="color-filter-outline" />}
        {design.resultMode === 'illustration' && <Badge label="SAMPLE ROOM" tone="navy" icon="cube-outline" />}
        {design.premium && <Badge label="PREMIUM" tone="amber" icon="star" />}
        <T variant="caption">Drag the handle to compare</T>
      </Row>
      {design.resultMode === 'preview' && (
        <T variant="small" style={{ marginTop: spacing.sm }}>
          This is an on-device colour preview of your photo. Photorealistic AI renders are produced when the RennovaAI AI server is connected.
        </T>
      )}

      <T variant="h2" style={{ marginTop: spacing.xl }}>Quick tweaks</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: spacing.md }}>
        {PALETTES.map((p) => (
          <Chip key={p.id} label={p.label} color={p.wall} selected={c.paletteId === p.id} onPress={() => p.id !== c.paletteId && applyChange({ paletteId: p.id }, design.resultMode === 'ai')} />
        ))}
      </ScrollView>
      <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
        <Button
          title={busy ? 'Generating…' : 'Regenerate'}
          icon="refresh"
          kind="secondary"
          loading={busy}
          onPress={() => applyChange({}, true)}
          style={{ flex: 1 }}
        />
        <Button title="Edit design" icon="options-outline" kind="secondary" onPress={() => { useApp.getState().updateDraft({ ...c, photoUri: design.photoUri }); router.push('/design/customize'); }} style={{ flex: 1 }} />
      </Row>
      <T variant="caption" style={{ marginTop: 6, textAlign: 'center' }}>
        {design.premium ? 'Unlimited regenerations (Premium Design Pack)' : `${Math.max(0, remaining)} of ${config.freeRegenerationsPerDesign} free regenerations left`}
      </T>

      <Card style={{ marginTop: spacing.xl }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="overline">Estimated investment</T>
          <Badge label={`~${design.estimate.days} DAYS`} tone="navy" icon="time-outline" />
        </Row>
        <T style={{ fontFamily: fonts.extrabold, fontSize: 24, color: colors.navy, marginTop: spacing.sm }}>
          {pkr(design.estimate.low)} – {pkr(design.estimate.high)}
        </T>
        <T variant="small" style={{ marginTop: 4 }}>Includes materials & labour in {city}. Final price is confirmed by your chosen vendor.</T>
        <Button title="View full breakdown" kind="ghost" iconRight="chevron-forward" small onPress={() => router.push({ pathname: '/design/estimate', params: { id: design.id } })} style={{ alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: 0 }} />
      </Card>

      {!design.premium ? (
        <Card style={{ marginTop: spacing.lg, backgroundColor: colors.navy }} onPress={() => router.push({ pathname: '/premium', params: { designId: design.id } })}>
          <Row>
            <IconTile icon="diamond" bg="rgba(254,169,35,0.18)" color={colors.amber} />
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong" style={{ color: colors.white }}>Premium Design Pack · {pkr(config.premiumPackPrice)}</T>
              <T variant="small" style={{ color: 'rgba(255,255,255,0.75)' }}>Unlimited regenerations, HD export & material shopping list</T>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </Row>
        </Card>
      ) : (
        <Card style={{ marginTop: spacing.lg }}>
          <T variant="h3">Material shopping list</T>
          {design.estimate.lines.map((l) => (
            <Row key={l.label} style={{ marginTop: spacing.sm }}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.teal} />
              <T variant="small" style={{ flex: 1 }}>{l.label}</T>
            </Row>
          ))}
          <T variant="caption" style={{ marginTop: spacing.md }}>Partner paint & hardware stores will offer discounts on this list.</T>
        </Card>
      )}

      <Card style={{ marginTop: spacing.lg }}>
        <T variant="h3">Design brief</T>
        {summary.map(([k, v], i) => (
          <View key={k}>
            {i > 0 && <Divider style={{ marginVertical: spacing.sm }} />}
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <T variant="small">{k}</T>
              <T variant="bodyStrong" style={{ flex: 1, textAlign: 'right', marginLeft: spacing.lg }}>{v}</T>
            </Row>
          </View>
        ))}
        {!!c.notes && <T variant="small" style={{ marginTop: spacing.md, fontStyle: 'italic' }}>“{c.notes}”</T>}
      </Card>

      <Button
        title="Delete design"
        kind="danger"
        icon="trash-outline"
        small
        style={{ marginTop: spacing.xl }}
        onPress={() => {
          const go = () => {
            deleteDesign(design.id);
            router.back();
          };
          if (Platform.OS === 'web') go();
          else Alert.alert('Delete design?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: go }]);
        }}
      />
    </Screen>
  );
}
