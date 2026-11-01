import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { DesignThumb } from '../../components/DesignPreview';
import { Badge, Button, EmptyState, Row, Screen, T, tap } from '../../components/ui';
import { designName, useT } from '../../i18n';
import { dateLabel, pkrShort } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, radius, spacing } from '../../theme';

export default function Designs() {
  const router = useRouter();
  const { t } = useT();
  const { designs, resetDraft } = useApp();
  const start = () => {
    resetDraft();
    router.push('/design/capture');
  };

  return (
    <Screen back={false} title={t('designs.title')} right={designs.length ? <Button title={t('designs.new')} icon="add" small onPress={start} /> : undefined}>
      {designs.length === 0 ? (
        <EmptyState icon="color-palette-outline" title={t('designs.emptyTitle')} body={t('designs.emptyBody')} action={t('designs.emptyAction')} onAction={start} />
      ) : (
        <View style={styles.grid}>
          {designs.map((d) => (
            <Pressable key={d.id} onPress={() => { tap(); router.push({ pathname: '/design/result', params: { id: d.id } }); }} style={styles.card}>
              <DesignThumb {...d} height={130} radius={0} />
              <View style={{ padding: spacing.md }}>
                <T variant="bodyStrong" numberOfLines={1}>{designName(d)}</T>
                <T variant="caption">{dateLabel(d.createdAt)}</T>
                <Row style={{ marginTop: 6 }} gap={4}>
                  <Badge label={pkrShort(d.estimate.mid).toUpperCase()} tone="navy" />
                  {d.premium && <Badge label={t('designs.pro')} tone="amber" />}
                </Row>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  card: { width: '47.5%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
});
