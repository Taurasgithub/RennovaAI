import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthProvider';
import { KEYBOARD_BEHAVIOR } from '../../components/keyboard';
import { EmptyState, Header, T, tap } from '../../components/ui';
import { projectTitle, useT } from '../../i18n';
import { notify } from '../../lib/dialogs';
import { timeLabel } from '../../lib/format';
import { useBookings } from '../../services/bookings';
import { colors, fonts, radius, spacing } from '../../theme';

/** Chat between a booking's customer and vendor. Messages arrive live (Supabase Realtime). */
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const me = useAuth().session?.user.id ?? null;
  const booking = useBookings((s) => s.bookings.find((b) => b.id === id));
  const messages = useBookings((s) => (id ? s.messages[id] : undefined));
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id && me) useBookings.getState().loadMessages(id).catch(() => {});
  }, [id, me]);

  if (!booking) return <View style={{ flex: 1, paddingTop: insets.top }}><Header title={t('chat.title')} /><EmptyState icon="chatbubbles-outline" title={t('chat.unavailable')} body={t('chat.gone')} /></View>;
  const isVendor = booking.vendorId === me;
  const other = isVendor ? booking.customerName || t('project.customer') : booking.vendorName || t('chat.vendor');
  const closed = booking.status === 'declined' || booking.status === 'cancelled';

  const send = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    tap();
    setSending(true);
    try {
      await useBookings.getState().send(booking.id, msg);
      setText('');
    } catch (e) {
      notify(t('chat.failed'), e instanceof Error ? e.message : undefined);
    } finally {
      setSending(false);
    }
  };

  const data = [...(messages ?? [])].reverse();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }} behavior={KEYBOARD_BEHAVIOR}>
      <Header title={other} subtitle={projectTitle(booking)} />
      {!messages ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <FlatList
          inverted
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, flexGrow: 1 }}
          ListEmptyComponent={<T variant="small" style={styles.empty}>{t('chat.empty', { name: other })}</T>}
          renderItem={({ item }) => {
            const mine = item.senderId === me;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <T style={{ color: mine ? colors.white : colors.text, fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 20 }}>{item.body}</T>
                <T variant="caption" style={{ color: mine ? 'rgba(255,255,255,0.7)' : colors.textSubtle, alignSelf: 'flex-end', marginTop: 2 }}>{timeLabel(item.createdAt)}</T>
              </View>
            );
          }}
        />
      )}
      {closed ? (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.md), justifyContent: 'center' }]}>
          <T variant="small" style={{ paddingVertical: spacing.sm }}>{t('chat.closed')}</T>
        </View>
      ) : (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <TextInput value={text} onChangeText={setText} placeholder={t('chat.placeholder')} placeholderTextColor={colors.textSubtle} style={styles.input} multiline maxLength={2000} />
          <Pressable accessibilityRole="button" accessibilityLabel={t('chat.send')} onPress={send} style={[styles.send, (!text.trim() || sending) && { opacity: 0.5 }]}>
            {sending ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name="send" size={18} color={colors.white} />}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.teal, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  // The list is inverted, so this sits at the bottom of the screen.
  empty: { textAlign: 'center', marginTop: 'auto', paddingHorizontal: spacing.xl, transform: [{ scaleY: -1 }] },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 12, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
