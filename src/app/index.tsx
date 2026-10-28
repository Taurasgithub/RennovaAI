import { Redirect } from 'expo-router';
import { useApp } from '../store/useApp';

export default function Index() {
  const onboarded = useApp((s) => s.onboarded && !!s.user);
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
