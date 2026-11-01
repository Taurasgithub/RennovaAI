import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { DesignThumb } from '../../components/DesignPreview';
import { Badge, Card, EmptyState, Row, Screen, T } from '../../components/ui';
import { getVendor } from '../../data/vendors';
import { projectTitle, useT } from '../../i18n';
import { pkr } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, spacing } from '../../theme';

export default function Projects() {
  const router = useRouter();
  const { t } = useT();
  const { projects, designs, resetDraft } = useApp();

  return (
    <Screen back={false} title={t('projects.title')}>
      {projects.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          title={t('projects.emptyTitle')}
          body={t('projects.emptyBody')}
          action={t('projects.emptyAction')}
          onAction={() => { resetDraft(); router.push('/design/capture'); }}
        />
      ) : (
        projects.map((p) => {
          const v = getVendor(p.vendorId);
          const d = designs.find((x) => x.id === p.designId);
          const done = p.milestones.filter((m) => m.status === 'released').length;
          return (
            <Card key={p.id} style={{ marginTop: spacing.md }} onPress={() => router.push(`/project/${p.id}`)}>
              <Row gap={spacing.md}>
                {d ? <DesignThumb {...d} size={64} /> : <View style={{ width: 64 }} />}
                <View style={{ flex: 1 }}>
                  <T variant="h3" numberOfLines={1}>{projectTitle(p, designs)}</T>
                  <T variant="small" numberOfLines={1}>{v?.name}</T>
                  <Row style={{ marginTop: 6 }} gap={6}>
                    <Badge label={p.status === 'completed' ? t('common.completed') : t('projects.stages', { done, total: p.milestones.length })} tone={p.status === 'completed' ? 'green' : 'amber'} />
                    <T variant="caption">{pkr(p.price - p.discount)}</T>
                  </Row>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
              </Row>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: spacing.md, overflow: 'hidden' }}>
                <View style={{ width: `${(done / p.milestones.length) * 100}%`, height: 6, backgroundColor: colors.teal }} />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
