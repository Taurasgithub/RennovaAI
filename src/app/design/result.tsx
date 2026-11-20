import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { DesignCompare } from '../../components/DesignPreview';
import { Badge, Button, Card, Chip, Divider, EmptyState, IconButton, IconTile, Row, Screen, T } from '../../components/ui';
import { config } from '../../config';
import { confirmAction, notify } from '../../lib/dialogs';
import { CountUp } from '../../components/motion';
import { dropImage, keepImage } from '../../lib/images';
import { PALETTES } from '../../data/catalog';
import { ceilingLabel, cityLabel, designName, extraLabel, floorLabel, lineLabel, listJoin, paletteLabel, roomLabel, styleLabel, useT, wallLabel } from '../../i18n';
import { estimateCost } from '../../lib/estimate';
import { pkr } from '../../lib/format';
import { generateDesign } from '../../services/ai';
import { useApp } from '../../store/useApp';
import { useShallow } from 'zustand/react/shallow';
import { colors, fonts, spacing } from '../../theme';

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();
  const { designs, updateDesign, deleteDesign, user } = useApp(useShallow((s) => ({ designs: s.designs, updateDesign: s.updateDesign, deleteDesign: s.deleteDesign, user: s.user })));
  const design = designs.find((d) => d.id === id);
  const [busy, setBusy] = useState(false);

  if (!design) return <Screen title={t('result.title')}><EmptyState icon="alert-circle-outline" title={t('common.designNotFound')} body={t('common.maybeDeleted')} /></Screen>;

  const c = design.choices;
  const remaining = design.premium ? Infinity : config.freeRegenerationsPerDesign - design.regenerations;
  const city = user?.city ?? 'Sukkur';
  const name = designName(design);

  const applyChange = async (patch: Partial<typeof c>, countsAsRegen: boolean) => {
    if (countsAsRegen && remaining <= 0) {
      if (config.premiumEnabled) router.push({ pathname: '/premium', params: { designId: design.id } });
      else notify(t('result.regensUsedTitle'), t('result.regensUsed'));
      return;
    }
    const choices = { ...c, ...patch };
    setBusy(true);
    try {
      const res = await generateDesign({ ...choices, photoUri: design.photoUri }, design.regenerations + 1);
      const resultUri = await keepImage(res.uri);
      const previous = design.resultUri;
      updateDesign(design.id, {
        choices,
        resultUri,
        resultMode: res.mode,
        estimate: estimateCost(choices, city),
        regenerations: design.regenerations + (countsAsRegen ? 1 : 0),
      });
      if (previous !== resultUri) dropImage(previous);
    } catch {
      notify(t('result.regenFail'), t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  };

  const summary: [string, string][] = [
    [t('result.room'), `${roomLabel(c.roomTypeId)} · ${c.lengthFt && c.widthFt ? `${c.lengthFt} × ${c.widthFt} ft · ` : ''}${t('common.sqft', { n: c.area })}`],
    [t('result.style'), styleLabel(c.styleId)],
    [t('result.palette'), paletteLabel(c.paletteId)],
    [t('result.walls'), wallLabel(c.wallFinishId)],
    [t('result.flooring'), floorLabel(c.flooringId)],
    [t('result.ceiling'), ceilingLabel(c.ceilingId)],
  ];
  if (c.extras.length) summary.push([t('result.addons'), listJoin(c.extras.map(extraLabel))]);

  return (
    <Screen
      title={name}
      right={
        <IconButton
          icon="share-social-outline"
          label={t('result.share')}
          onPress={() =>
            Share.share({ message: t('result.shareMsg', { name, low: pkr(design.estimate.low), high: pkr(design.estimate.high) }) }).catch(() => {})
          }
        />
      }
      footer={<Button title={t('result.getQuotes')} icon="people" onPress={() => router.push({ pathname: '/compare', params: { id: design.id } })} />}
    >
      <View style={{ marginTop: spacing.sm, opacity: busy ? 0.5 : 1 }}>
        <DesignCompare {...design} height={300} />
      </View>

      <Row style={{ marginTop: spacing.md, flexWrap: 'wrap' }} gap={6}>
        {design.resultMode === 'ai' && <Badge label={t('result.aiRender')} tone="teal" icon="sparkles" />}
        {design.resultMode === 'preview' && <Badge label={t('result.previewMode')} tone="amber" icon="color-filter-outline" />}
        {design.resultMode === 'illustration' && <Badge label={t('result.sampleRoom')} tone="navy" icon="cube-outline" />}
        {design.premium && <Badge label={t('result.premium')} tone="amber" icon="star" />}
        <T variant="caption">{t('result.drag')}</T>
      </Row>
      {design.resultMode === 'preview' && (
        <T variant="small" style={{ marginTop: spacing.sm }}>
          {t('result.previewNote')}
        </T>
      )}
      {/* The sample room is drawn on the phone; only the customer's own photo goes to the AI. */}
      {design.resultMode === 'illustration' && (
        <Card style={{ marginTop: spacing.md, backgroundColor: colors.amberTint, borderColor: colors.amberTint }}>
          <T variant="bodyStrong" style={{ color: colors.navy }}>{t('result.sampleTitle')}</T>
          <T variant="small" style={{ marginTop: 4, color: colors.text }}>{t('result.sampleBody')}</T>
          <Button title={t('result.sampleCta')} kind="navy" icon="camera" small style={{ marginTop: spacing.md, alignSelf: 'flex-start' }} onPress={() => router.push('/design/capture')} />
        </Card>
      )}

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('result.tweaks')}</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: spacing.md }}>
        {PALETTES.map((p) => (
          <Chip key={p.id} label={paletteLabel(p.id)} color={p.wall} selected={c.paletteId === p.id} onPress={() => p.id !== c.paletteId && applyChange({ paletteId: p.id }, design.resultMode === 'ai')} />
        ))}
      </ScrollView>
      <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
        <Button
          title={busy ? t('result.generating') : t('result.regenerate')}
          icon="refresh"
          kind="secondary"
          loading={busy}
          onPress={() => applyChange({}, true)}
          style={{ flex: 1 }}
        />
        <Button title={t('result.editDesign')} icon="options-outline" kind="secondary" onPress={() => { useApp.getState().updateDraft({ ...c, photoUri: design.photoUri }); router.push('/design/customize'); }} style={{ flex: 1 }} />
      </Row>
      <T variant="caption" style={{ marginTop: 6, textAlign: 'center' }}>
        {design.premium ? t('result.unlimited') : t('result.regensLeft', { left: Math.max(0, remaining), total: config.freeRegenerationsPerDesign })}
      </T>

      <Card style={{ marginTop: spacing.xl }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="overline">{t('result.investment')}</T>
          <Badge label={t('common.daysApproxUpper', { n: design.estimate.days })} tone="navy" icon="time-outline" />
        </Row>
        <T style={{ fontFamily: fonts.extrabold, fontSize: 24, color: colors.navy, marginTop: spacing.sm }}>
          <CountUp value={design.estimate.low} format={pkr} /> – <CountUp value={design.estimate.high} format={pkr} />
        </T>
        <T variant="small" style={{ marginTop: 4 }}>{t('result.includes', { city: cityLabel(city) })}</T>
        <Button title={t('result.breakdown')} kind="ghost" iconRight="chevron-forward" small onPress={() => router.push({ pathname: '/design/estimate', params: { id: design.id } })} style={{ alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: 0 }} />
      </Card>

      {/* Without a paid pack (see config.premiumEnabled) everyone gets the shopping list. */}
      {!design.premium && config.premiumEnabled ? (
        <Card style={{ marginTop: spacing.lg, backgroundColor: colors.navy }} onPress={() => router.push({ pathname: '/premium', params: { designId: design.id } })}>
          <Row>
            <IconTile icon="diamond" bg="rgba(254,169,35,0.18)" color={colors.amber} />
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong" style={{ color: colors.white }}>{t('result.premiumCard', { price: pkr(config.premiumPackPrice) })}</T>
              <T variant="small" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('result.premiumCardBody')}</T>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </Row>
        </Card>
      ) : (
        <Card style={{ marginTop: spacing.lg }}>
          <T variant="h3">{t('result.shoppingList')}</T>
          {design.estimate.lines.map((l) => (
            <Row key={l.label} style={{ marginTop: spacing.sm }}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.teal} />
              <T variant="small" style={{ flex: 1 }}>{lineLabel(l)}</T>
            </Row>
          ))}
          <T variant="caption" style={{ marginTop: spacing.md }}>{t('result.partnerDiscount')}</T>
        </Card>
      )}

      <Card style={{ marginTop: spacing.lg }}>
        <T variant="h3">{t('result.brief')}</T>
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
        title={t('result.deleteDesign')}
        kind="danger"
        icon="trash-outline"
        small
        style={{ marginTop: spacing.xl }}
        onPress={() => {
          confirmAction(t('result.deleteTitle'), t('result.deleteBody'), { cancel: t('common.cancel'), ok: t('common.delete') }, () => {
            deleteDesign(design.id);
            router.back();
          }, true);
        }}
      />
    </Screen>
  );
}
