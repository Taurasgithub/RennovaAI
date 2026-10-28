import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Header, T, tap } from '../../components/ui';
import { getVendor } from '../../data/vendors';
import { timeLabel } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const AUTO_REPLIES = [
  'Noted! I will share an update with photos by this evening.',
  'Sure, we can do that. I will adjust the plan and confirm.',
  'Our team will reach the site at 10 am. Please keep the room clear.',
  'Thank you! Materials have been ordered from our partner store.',
];

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const project = useApp((s) => s.projects.find((p) => p.id === id));
  const addMessage = useApp((s) => s.addMessage);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const replyIdx = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!project) return <View style={{ flex: 1, paddingTop: insets.top }}><Header title="Chat" /><EmptyState icon="chatbubbles-outline" title="Chat unavailable" body="This project no longer exists." /></View>;
  const vendor = getVendor(project.vendorId);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    tap();
    addMessage(project.id, { from: 'me', text: t });
    setText('');
    // TODO(go-live): replace with real-time messaging (e.g. Firebase / WebSocket). Simulated vendor reply for the beta.
    setTyping(true);
    timer.current = setTimeout(() => {
      addMessage(project.id, { from: 'vendor', text: AUTO_REPLIES[replyIdx.current++ % AUTO_REPLIES.length] });
      setTyping(false);
    }, 1400);
  };

  const data = [...project.messages].reverse();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={vendor?.name ?? 'Vendor'} subtitle={typing ? 'typing…' : `Usually replies ${vendor?.responseTime ?? 'soon'}`} />
      <FlatList
        inverted
        data={data}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        renderItem={({ item }) => {
          const mine = item.from === 'me';
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <T style={{ color: mine ? colors.white : colors.text, fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 20 }}>{item.text}</T>
              <T variant="caption" style={{ color: mine ? 'rgba(255,255,255,0.7)' : colors.textSubtle, alignSelf: 'flex-end', marginTop: 2 }}>{timeLabel(item.at)}</T>
            </View>
          );
        }}
      />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={colors.textSubtle} style={styles.input} multiline onSubmitEditing={send} />
        <Pressable accessibilityLabel="Send" onPress={send} style={[styles.send, !text.trim() && { opacity: 0.5 }]}>
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.teal, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 12, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
