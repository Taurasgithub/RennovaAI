import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { PALETTES, findById } from '../data/catalog';
import type { DesignChoices } from '../lib/estimate';
import type { ResultMode } from '../store/useApp';
import { BeforeAfter } from './BeforeAfter';
import { RoomIllustration } from './RoomIllustration';

type Props = {
  choices: DesignChoices;
  photoUri: string | null;
  resultUri: string | null;
  resultMode: ResultMode;
};

/** The renovated ("after") view for any result mode. */
export function AfterView({ choices, photoUri, resultUri, resultMode }: Props) {
  if (resultMode === 'ai' && resultUri) {
    return <Image source={{ uri: resultUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />;
  }
  if (photoUri) {
    // On-device preview: recolour the user's photo with the chosen palette.
    const pal = findById(PALETTES, choices.paletteId);
    return (
      <View style={StyleSheet.absoluteFill}>
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: pal.wall, opacity: 0.42, mixBlendMode: 'multiply' }]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: pal.wall, opacity: 0.14 }]} />
        <LinearGradient colors={['rgba(255,226,168,0.35)', 'transparent']} style={[StyleSheet.absoluteFill, { height: '45%' }]} />
        <LinearGradient colors={['transparent', pal.accent + '55']} style={StyleSheet.absoluteFill} />
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFill}>
      <RoomIllustration {...choices} />
    </View>
  );
}

export function BeforeView({ choices, photoUri }: Pick<Props, 'choices' | 'photoUri'>) {
  if (photoUri) return <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />;
  return (
    <View style={StyleSheet.absoluteFill}>
      <RoomIllustration {...choices} worn />
    </View>
  );
}

export function DesignCompare(props: Props & { height?: number }) {
  return <BeforeAfter height={props.height} before={<BeforeView {...props} />} after={<AfterView {...props} />} />;
}

export function DesignThumb(props: Props & { size?: number; height?: number; radius?: number }) {
  return (
    <View style={{ width: props.size ?? '100%', height: props.height ?? props.size ?? 120, borderRadius: props.radius ?? 12, overflow: 'hidden', backgroundColor: '#EEE' }}>
      <AfterView {...props} />
    </View>
  );
}
