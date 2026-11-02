import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { VendorCard } from '../../components/VendorCard';
import { Badge, Chip, EmptyState, Row, Screen, T } from '../../components/ui';
import { config } from '../../config';
import { SERVICE_ICONS, SERVICE_TYPES, type ServiceType } from '../../data/catalog';
import { useMarketplace } from '../../data/marketplace';
import { VENDORS } from '../../data/vendors';
import { cityLabel, serviceLabel, useT } from '../../i18n';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

export default function Vendors() {
  const router = useRouter();
  const accountVendors = useMarketplace((s) => s.accountVendors);
  const loadMarketplace = useMarketplace((s) => s.load);
  useFocusEffect(
    useCallback(() => {
      loadMarketplace();
    }, [loadMarketplace]),
  );
  const { t } = useT();
  const userCity = useApp((s) => s.user?.city ?? 'Sukkur');
  const [city, setCity] = useState<string>(userCity);
  const [service, setService] = useState<ServiceType | null>(null);
  const [q, setQ] = useState('');

  const list = useMemo(
    () =>
      [...accountVendors, ...VENDORS].filter((v) => v.city === city)
        .filter((v) => !service || v.services.includes(service))
        .filter((v) => !q || [v.name, v.area, ...v.services, ...v.services.map(serviceLabel)].join(' ').toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => Number(b.pro) - Number(a.pro) || b.rating - a.rating),
    // t: serviceLabel depends on the language, so the search follows it too.
    [accountVendors, city, service, q, t],
  );

  return (
    <Screen back={false} title={t('vendors.title')} subtitle={t('vendors.subtitle')} padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textSubtle} />
          <TextInput value={q} onChangeText={setQ} placeholder={t('vendors.search')} placeholderTextColor={colors.textSubtle} style={styles.searchInput} />
        </View>
        <Row style={{ marginTop: spacing.md }} gap={6}>
          {config.cities.map((c) => <Chip key={c} label={cityLabel(c)} icon="location-outline" selected={city === c} onPress={() => setCity(c)} />)}
        </Row>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 6, paddingVertical: spacing.md }}>
        <Chip label={t('vendors.allTrades')} selected={!service} onPress={() => setService(null)} />
        {SERVICE_TYPES.map((s) => <Chip key={s} label={serviceLabel(s)} icon={SERVICE_ICONS[s]} selected={service === s} onPress={() => setService(service === s ? null : s)} />)}
      </ScrollView>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: spacing.md }}>
          <T variant="small" style={{ fontFamily: fonts.semibold }}>{t('vendors.count', { n: list.length, city: cityLabel(city) })}</T>
          <Badge label={t('vendors.beta')} tone="gray" />
        </Row>
        {list.length === 0 ? (
          <EmptyState icon="people-outline" title={t('vendors.emptyTitle')} body={t('vendors.emptyBody')} />
        ) : (
          list.map((v) => <VendorCard key={v.id} vendor={v} onPress={() => router.push(`/vendor/${v.id}`)} />)
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 48, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  searchInput: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
});
