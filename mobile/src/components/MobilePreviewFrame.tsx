import React from 'react';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';

/** iPhone 14 logical size — matches common mobile viewport */
const PHONE_WIDTH = 393;
const PHONE_HEIGHT = 852;

interface Props {
  children: React.ReactNode;
}

export default function MobilePreviewFrame({ children }: Props) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const { width: screenW, height: screenH } = useWindowDimensions();
  const scale = Math.min(1, (screenW - 64) / PHONE_WIDTH, (screenH - 64) / PHONE_HEIGHT);

  return (
    <View style={styles.backdrop}>
      <View style={[styles.phone, { transform: [{ scale }] }]}>
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#FFE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-expect-error web-only
    minHeight: '100vh',
  },
  phone: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: 44,
    borderWidth: 6,
    borderColor: '#FFB7C5',
    overflow: 'hidden',
    backgroundColor: '#FFF5F8',
    // @ts-expect-error web-only
    boxShadow: '0 25px 50px -12px rgba(255, 107, 157, 0.35)',
  },
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
});
