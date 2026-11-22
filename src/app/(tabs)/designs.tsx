import { useRouter } from 'expo-router';
import { memo } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignThumb } from '../../components/DesignPreview';
import { Badge, Button, EmptyState, Row, Screen, T, tap } from '../../components/ui';
import { designName, useT } from '../../i18n';
import { dateLabel, pkrShort } from '../../lib/format';
import { useApp, type Design } from '../../store/useApp';
import { useShallow } from 'zustand/react/shallow';
import { colors, radius, spacing } from '../../theme';

export default function Designs() {
  const router = useRouter();
  const { t } = useT();
  const { designs, resetDraft } = useApp(useShallow((s) => ({ designs: s.designs, resetDraft: s.resetDraft })));
  const start = () => {
    resetDraft();
    router.push('/design/capture');
  };

  const insets = useSafeAreaInsets();
  const open = (id: string) => {
    tap();
    router.push({ pathname: '/design/result', params: { id } });
  };

  return (
    <Screen back={false} title={t('designs.title')} right={designs.length ? <Button title={t('designs.new')} icon="add" small onPress={start} /> : undefined} scroll={false} padded={false}>
      {/* Virtualized two-column grid: thumbnails off screen aren't kept in memory. */}
      <FlatList<Design>
        data={designs}
        keyExtractor={(d) => d.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        renderItem={({ item }) => <DesignTile d={item} onOpen={open} />}
        initialNumToRender={6}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
        ListEmptyComponent={<EmptyState icon="color-palette-outline" title={t('designs.emptyTitle')} body={t('designs.emptyBody')} action={t('designs.emptyAction')} onAction={start} />}
      />
    </Screen>
  );
}

const DesignTile = memo(function DesignTile({ d, onOpen }: { d: Design; onOpen: (id: string) => void }) {
  const { t } = useT();
  return (
    <Pressable onPress={() => onOpen(d.id)} style={styles.card} accessibilityRole="button" accessibilityLabel={designName(d)}>
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
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, maxWidth: '50%', backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
});
