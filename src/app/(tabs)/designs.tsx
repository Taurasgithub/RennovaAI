import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { DesignThumb } from '../../components/DesignPreview';
import { Badge, Button, EmptyState, Row, Screen, T, tap } from '../../components/ui';
import { dateLabel, pkrShort } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, radius, spacing } from '../../theme';

export default function Designs() {
  const router = useRouter();
  const { designs, resetDraft } = useApp();
  const start = () => {
    resetDraft();
    router.push('/design/capture');
  };

  return (
    <Screen back={false} title="My designs" right={designs.length ? <Button title="New" icon="add" small onPress={start} /> : undefined}>
      {designs.length === 0 ? (
        <EmptyState icon="color-palette-outline" title="No designs yet" body="Photograph a room and RennovaAI will show you how it could look — with a cost estimate." action="Create your first design" onAction={start} />
      ) : (
        <View style={styles.grid}>
          {designs.map((d) => (
            <Pressable key={d.id} onPress={() => { tap(); router.push({ pathname: '/design/result', params: { id: d.id } }); }} style={styles.card}>
              <DesignThumb {...d} height={130} radius={0} />
              <View style={{ padding: spacing.md }}>
                <T variant="bodyStrong" numberOfLines={1}>{d.name}</T>
                <T variant="caption">{dateLabel(d.createdAt)}</T>
                <Row style={{ marginTop: 6 }} gap={4}>
                  <Badge label={pkrShort(d.estimate.mid).toUpperCase()} tone="navy" />
                  {d.premium && <Badge label="PRO" tone="amber" />}
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
