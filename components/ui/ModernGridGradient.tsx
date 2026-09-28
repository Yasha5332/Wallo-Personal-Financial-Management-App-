import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  Pattern,
  Path,
  Circle,
  Rect,
  LinearGradient as SvgLinearGradient,
  Stop,
  Mask,
} from 'react-native-svg';

interface ModernGridGradientProps {
  style?: ViewStyle;
}

export const ModernGridGradient: React.FC<ModernGridGradientProps> = ({ style }) => {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.container, style]}>
      {/* 1. Deep Space Midnight Base Gradient */}
      <LinearGradient
        colors={['#050811', '#0A0F20', '#101733', '#161F42']}
        locations={[0, 0.32, 0.7, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Aurora Glow Mesh Elements (Vibrant Electric Violet, Cyber Cyan & Vivid Emerald) */}
      {/* Electric Indigo/Violet Radiance (Top Right) */}
      <View
        style={{
          position: 'absolute',
          top: -60,
          right: -50,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: '#6366F1',
          opacity: 0.24,
        }}
      />

      {/* Vivid Neon Emerald/Mint Glow (Illuminating the logo) */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          left: -40,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: '#10B981',
          opacity: 0.22,
        }}
      />

      {/* Cyber Cyan Ambient Core (Upper Center) */}
      <View
        style={{
          position: 'absolute',
          top: -30,
          left: '32%',
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: '#06B6D4',
          opacity: 0.18,
        }}
      />

      {/* Electric Purple Ambient Flare (Right Center) */}
      <View
        style={{
          position: 'absolute',
          top: 90,
          right: 0,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: '#8B5CF6',
          opacity: 0.16,
        }}
      />

      {/* 3. Crisp Developer-Grade Tech Grid (32px Cell) */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern
            id="modern-tech-grid"
            width={32}
            height={32}
            patternUnits="userSpaceOnUse"
          >
            {/* Modern Indigo/Slate Grid Lines */}
            <Path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#818CF8"
              strokeWidth={0.8}
              strokeOpacity={0.18}
            />
            {/* Luminous Intersection Crosshair Dots */}
            <Circle cx={0} cy={0} r={1.25} fill="#A5B4FC" fillOpacity={0.5} />
          </Pattern>

          {/* Smooth Vertical Dissolve Mask */}
          <SvgLinearGradient id="gridVerticalFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
            <Stop offset="0.48" stopColor="#FFFFFF" stopOpacity={0.65} />
            <Stop offset="0.8" stopColor="#FFFFFF" stopOpacity={0.2} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0} />
          </SvgLinearGradient>

          <Mask id="gridMask">
            <Rect width="100%" height="100%" fill="url(#gridVerticalFade)" />
          </Mask>
        </Defs>

        {/* Masked Grid Layer */}
        <Rect
          width="100%"
          height="100%"
          fill="url(#modern-tech-grid)"
          mask="url(#gridMask)"
        />
      </Svg>

      {/* 4. Bottom Vignette for Crisp Card Transition */}
      <LinearGradient
        colors={['transparent', 'rgba(5, 8, 17, 0.5)']}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
