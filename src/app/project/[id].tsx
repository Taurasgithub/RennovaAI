import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, TextInput, View } from 'react-native';
import { DesignCompare } from '../../components/DesignPreview';
import { VendorAvatar } from '../../components/VendorCard';
import { Badge, Button, Card, EmptyState, IconButton, Row, Screen, Section, Stars, T } from '../../components/ui';
import { config } from '../../config';
import { getVendor } from '../../data/vendors';
import { dateLabel, pkr } from '../../lib/format';
import { milestoneTitle, paymentLabel, projectTitle, useT } from '../../i18n';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const confirm = (title: string, body: string, labels: { cancel: string; ok: string }, onOk: () => void) => {
  if (Platform.OS === 'web') return onOk();
  Alert.alert(title, body, [{ text: labels.cancel, style: 'cancel' }, { text: labels.ok, onPress: onOk }]);
};

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();
  const { projects, designs, depositMilestone, releaseMilestone, rateProject, addMessage } = useApp();
  const project = projects.find((p) => p.id === id);
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState('');

  if (!project) return <Screen title={t('project.title')}><EmptyState icon="alert-circle-outline" title={t('project.notFound')} body={t('project.maybeRemoved')} /></Screen>;
  const vendor = getVendor(project.vendorId);
  const design = designs.find((d) => d.id === project.designId);
  const total = project.price - project.discount;
  const title = projectTitle(project, designs);
  const confirmLabels = { cancel: t('common.cancel'), ok: t('common.confirm') };
  const released = project.milestones.filter((m) => m.status === 'released').reduce((s, m) => s + m.amount, 0);
  const inEscrow = project.milestones.filter((m) => m.status === 'in_escrow').reduce((s, m) => s + m.amount, 0);

  return (
    <Screen
      title={title}
      subtitle={t('project.booked', { date: dateLabel(project.createdAt) })}
      right={<IconButton icon="chatbubbles-outline" label={t('project.openChat')} onPress={() => router.push(`/chat/${project.id}`)} />}
    >
      {vendor && (
        <Card style={{ marginTop: spacing.sm }} onPress={() => router.push(`/vendor/${vendor.id}`)}>
          <Row gap={spacing.md}>
            <VendorAvatar vendor={vendor} size={46} />
            <View style={{ flex: 1 }}>
              <T variant="h3">{vendor.name}</T>
              <T variant="small">{t('project.timeline', { owner: vendor.owner, n: project.days })}</T>
            </View>
            <Badge label={project.status === 'completed' ? t('common.completed') : t('project.inProgress')} tone={project.status === 'completed' ? 'green' : 'amber'} />
          </Row>
          <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
            <Button title={t('project.chat')} icon="chatbubble-ellipses-outline" kind="secondary" small onPress={() => router.push(`/chat/${project.id}`)} style={{ flex: 1 }} />
            <Button title={t('project.support')} icon="logo-whatsapp" kind="secondary" small onPress={() => Linking.openURL(`https://wa.me/${config.supportWhatsApp}?text=${encodeURIComponent(t('project.supportMsg', { title }))}`).catch(() => {})} style={{ flex: 1 }} />
          </Row>
        </Card>
      )}

      <Card style={{ marginTop: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="overline">{t('project.payments')}</T>
          <T variant="caption">{paymentLabel(project.paymentMethod)}</T>
        </Row>
        <View style={styles.bar}>
          <View style={{ width: `${(released / total) * 100}%`, backgroundColor: colors.teal }} />
          <View style={{ width: `${(inEscrow / total) * 100}%`, backgroundColor: colors.amber }} />
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          <View><T variant="caption">{t('project.released')}</T><T variant="bodyStrong" style={{ color: colors.tealDark }}>{pkr(released)}</T></View>
          <View style={{ alignItems: 'center' }}><T variant="caption">{t('project.inEscrow')}</T><T variant="bodyStrong" style={{ color: colors.amberDark }}>{pkr(inEscrow)}</T></View>
          <View style={{ alignItems: 'flex-end' }}><T variant="caption">{t('project.total')}</T><T variant="bodyStrong">{pkr(total)}</T></View>
        </Row>
      </Card>

      <Section title={t('project.milestones')}>
        {project.milestones.map((m, i) => {
          const prevDone = i === 0 || project.milestones[i - 1].status === 'released';
          const icon = m.status === 'released' ? 'checkmark-circle' : m.status === 'in_escrow' ? 'lock-closed' : 'ellipse-outline';
          const tint = m.status === 'released' ? colors.success : m.status === 'in_escrow' ? colors.amber : colors.textSubtle;
          return (
            <View key={m.id} style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ alignItems: 'center' }}>
                <Ionicons name={icon} size={26} color={tint} />
                {i < project.milestones.length - 1 && <View style={[styles.rail, m.status === 'released' && { backgroundColor: colors.success }]} />}
              </View>
              <Card style={{ flex: 1, marginBottom: spacing.md }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T variant="bodyStrong" style={{ flex: 1 }}>{milestoneTitle(m)}</T>
                  <T variant="bodyStrong" style={{ color: colors.navy }}>{pkr(m.amount)}</T>
                </Row>
                <T variant="caption">
                  {m.status === 'released' ? t('project.stReleased') : m.status === 'in_escrow' ? t('project.stEscrow') : prevDone ? t('project.stReady') : t('project.stLocked')}
                </T>
                {m.status === 'in_escrow' && (
                  <Button
                    title={t('project.approve')}
                    icon="checkmark-done"
                    small
                    style={{ marginTop: spacing.md }}
                    onPress={() =>
                      confirm(t('project.releaseTitle'), t('project.releaseBody', { amount: pkr(m.amount), vendor: vendor?.name ?? t('project.theVendor') }), confirmLabels, () => {
                        releaseMilestone(project.id, m.id);
                        addMessage(project.id, { from: 'vendor', text: t('project.paidMsg', { title: milestoneTitle(m) }) });
                      })
                    }
                  />
                )}
                {m.status === 'awaiting_deposit' && prevDone && (
                  <Button title={t('project.depositBtn', { amount: pkr(m.amount) })} icon="lock-closed" kind="navy" small style={{ marginTop: spacing.md }} onPress={() => confirm(t('project.depositTitle'), t('project.depositBody', { amount: pkr(m.amount) }), confirmLabels, () => depositMilestone(project.id, m.id))} />
                )}
              </Card>
            </View>
          );
        })}
      </Section>

      {project.status === 'completed' && (
        <Card style={{ marginTop: spacing.sm, backgroundColor: project.rating ? colors.white : colors.amberSoft }}>
          {project.rating ? (
            <>
              <T variant="h3">{t('project.yourReview')}</T>
              <View style={{ marginTop: 6 }}><Stars value={project.rating} size={18} /></View>
              {!!project.review && <T variant="small" style={{ marginTop: 6, color: colors.text }}>{project.review}</T>}
            </>
          ) : (
            <>
              <T variant="h3">{t('project.howDid', { vendor: vendor?.name ?? t('project.yourVendor') })}</T>
              <T variant="small">{t('project.ratingHelps')}</T>
              <View style={{ marginVertical: spacing.md, alignItems: 'center' }}><Stars value={stars} size={34} onChange={setStars} /></View>
              <TextInput value={review} onChangeText={setReview} placeholder={t('project.reviewPh')} placeholderTextColor={colors.textSubtle} multiline style={styles.review} />
              <Button title={t('project.submit')} icon="star" kind="amber" style={{ marginTop: spacing.md }} onPress={() => rateProject(project.id, stars, review.trim())} />
            </>
          )}
        </Card>
      )}

      {design && (
        <Section title={t('project.yourDesign')}>
          <DesignCompare {...design} height={200} />
          <Button title={t('project.openDesign')} kind="ghost" small iconRight="chevron-forward" onPress={() => router.push({ pathname: '/design/result', params: { id: design.id } })} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.border, flexDirection: 'row', overflow: 'hidden', marginVertical: spacing.md },
  rail: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  review: { minHeight: 80, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: spacing.md, fontFamily: fonts.medium, color: colors.text, textAlignVertical: 'top' },
});
