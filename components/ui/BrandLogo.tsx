import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle, StyleProp } from 'react-native';

const lightSource = require('../../assets/logo.png');
const darkSource = require('../../assets/logo-dark.png');

interface BrandLogoProps {
  size?: number;
  dark?: boolean;
  withBackground?: boolean;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 52,
  dark = false,
  withBackground = false,
  style,
  containerStyle,
}) => {
  const source = dark ? darkSource : lightSource;
  const width = Math.round(size * 1.12);
  const height = size;

  const logoImage = (
    <Image
      source={source}
      style={[
        {
          width,
          height,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );

  if (withBackground) {
    const padding = Math.max(6, Math.round(size * 0.12));
    const borderRadius = Math.max(12, Math.round(size * 0.26));
    return (
      <View
        style={[
          styles.lightContainer,
          {
            borderRadius,
            padding,
          },
          containerStyle,
        ]}
      >
        {logoImage}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {logoImage}
    </View>
  );
};

const styles = StyleSheet.create({
  lightContainer: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
});
