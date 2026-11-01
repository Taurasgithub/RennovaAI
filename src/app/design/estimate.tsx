import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Badge, Button, Card, Divider, EmptyState, Row, Screen, T } from '../../components/ui';
import { SERVICE_ICONS } from '../../data/catalog';
import { cityLabel, designName, lineLabel, serviceLabel, useT } from '../../i18n';
import { pkr } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

export default function EstimateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();
  const design = useApp((s) => s.designs.find((d) => d.id === id));
  const city = useApp((s) => s.user?.city ?? 'Sukkur');
  if (!design) return <Screen title={t('estimate.screenTitle')}><EmptyState icon="alert-circle-outline" title={t('common.designNotFound')} body={t('common.maybeDeleted')} /></Screen>;
  const e = design.estimate;
  const max = Math.max(...e.lines.map((l) => l.amount));

  return (
    <Screen title={t('estimate.title')} subtitle={designName(design)} footer={<Button title={t('estimate.findVendors')} icon="people" onPress={() => router.push({ pathname: '/compare', params: { id: design.id } })} />}>
      <Card style={{ marginTop: spacing.sm, backgroundColor: colors.navy }}>
        <T variant="overline" style={{ color: colors.amber }}>{t('estimate.range')}</T>
        <T style={{ fontFamily: fonts.extrabold, fontSize: 28, color: colors.white, marginTop: spacing.sm }}>{pkr(e.low)}</T>
        <T style={{ fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.75)' }}>{t('estimate.to', { amount: pkr(e.high) })}</T>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: spacing.lg }}>
          <View style={{ position: 'absolute', left: '12%', right: '10%', top: 0, bottom: 0, borderRadius: 4, backgroundColor: colors.teal }} />
          <View style={{ position: 'absolute', left: '45%', top: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.amber, borderWidth: 3, borderColor: colors.navy }} />
        </View>
        <Row style={{ justifyContent: 'space-between', marginTop: spacing.sm }}>
          <T variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('estimate.budget')}</T>
          <T variant="caption" style={{ color: colors.amber, fontFamily: fonts.bold }}>{t('estimate.typical', { amount: pkr(e.mid) })}</T>
          <T variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('estimate.premium')}</T>
        </Row>
      </Card>

      <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
        <Card style={{ flex: 1 }}>
          <Ionicons name="time-outline" size={20} color={colors.teal} />
          <T variant="h2" style={{ marginTop: 4 }}>{t('common.daysApprox', { n: e.days })}</T>
          <T variant="caption">{t('estimate.duration')}</T>
        </Card>
        <Card style={{ flex: 1 }}>
          <Ionicons name="resize-outline" size={20} color={colors.teal} />
          <T variant="h2" style={{ marginTop: 4 }}>{t('common.sqft', { n: e.wallArea })}</T>
          <T variant="caption">{t('estimate.wallArea')}</T>
        </Card>
      </Row>

      <Card style={{ marginTop: spacing.md }}>
        <T variant="h3">{t('estimate.breakdown')}</T>
        {e.lines.map((l, i) => (
          <View key={l.label}>
            {i > 0 && <Divider style={{ marginVertical: spacing.sm }} />}
            <Row style={{ alignItems: 'flex-start' }}>
              <Ionicons name={SERVICE_ICONS[l.service]} size={18} color={colors.tealDark} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <T variant="small" style={{ color: colors.text }}>{lineLabel(l)}</T>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.tealSoft, marginTop: 6 }}>
                  <View style={{ width: `${(l.amount / max) * 100}%`, height: 5, borderRadius: radius.sm, backgroundColor: colors.teal }} />
                </View>
              </View>
              <T variant="bodyStrong" style={{ marginLeft: spacing.sm }}>{pkr(l.amount)}</T>
            </Row>
          </View>
        ))}
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="bodyStrong">{t('estimate.total')}</T>
          <T variant="h3" style={{ color: colors.navy }}>{pkr(e.mid)}</T>
        </Row>
      </Card>

      <T variant="h3" style={{ marginTop: spacing.xl }}>{t('estimate.trades')}</T>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.sm }} gap={6}>
        {e.services.map((s) => <Badge key={s} label={serviceLabel(s).toUpperCase()} tone="teal" icon={SERVICE_ICONS[s]} />)}
      </Row>

      <T variant="caption" style={{ marginTop: spacing.xl }}>
        {t('estimate.disclaimer', { city: cityLabel(city) })}
      </T>
    </Screen>
  );
}
