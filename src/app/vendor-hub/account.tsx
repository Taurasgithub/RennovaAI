import { AccountPanel } from '../../components/AccountPanel';
import { Screen } from '../../components/ui';
import { useT } from '../../i18n';

export default function VendorAccount() {
  const { t } = useT();
  return (
    <Screen back={false} title={t('vendorHub.tabAccount')}>
      <AccountPanel />
    </Screen>
  );
}
