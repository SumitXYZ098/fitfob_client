import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export default function StylizedQrPassCode({ size = 220 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* White Canvas Background */}
        <Rect x="0" y="0" width="200" height="200" fill="#FFFFFF" />

        {/* Top-Left Finder Pattern */}
        <Rect x="10" y="10" width="50" height="50" rx="8" fill="#111827" />
        <Rect x="18" y="18" width="34" height="34" rx="4" fill="#FFFFFF" />
        <Rect x="26" y="26" width="18" height="18" rx="2" fill="#111827" />

        {/* Top-Right Finder Pattern */}
        <Rect x="140" y="10" width="50" height="50" rx="8" fill="#111827" />
        <Rect x="148" y="18" width="34" height="34" rx="4" fill="#FFFFFF" />
        <Rect x="156" y="26" width="18" height="18" rx="2" fill="#111827" />

        {/* Bottom-Left Finder Pattern */}
        <Rect x="10" y="140" width="50" height="50" rx="8" fill="#111827" />
        <Rect x="18" y="148" width="34" height="34" rx="4" fill="#FFFFFF" />
        <Rect x="26" y="156" width="18" height="18" rx="2" fill="#111827" />

        {/* Top modules */}
        <Rect x="70" y="15" width="8" height="8" rx="2" fill="#111827" />
        <Rect x="85" y="15" width="8" height="8" rx="2" fill="#111827" />
        <Rect x="100" y="15" width="8" height="8" rx="2" fill="#111827" />
        <Rect x="115" y="15" width="15" height="8" rx="2" fill="#111827" />

        <Rect x="70" y="30" width="15" height="8" rx="2" fill="#111827" />
        <Rect x="95" y="30" width="8" height="8" rx="2" fill="#111827" />
        <Rect x="110" y="30" width="20" height="8" rx="2" fill="#111827" />

        <Rect x="70" y="45" width="8" height="15" rx="2" fill="#111827" />
        <Rect x="90" y="45" width="15" height="8" rx="2" fill="#111827" />
        <Rect x="115" y="45" width="8" height="15" rx="2" fill="#111827" />

        {/* Mid-Left data */}
        <Rect x="15" y="70" width="8" height="15" rx="2" fill="#111827" />
        <Rect x="30" y="70" width="15" height="8" rx="2" fill="#111827" />
        <Rect x="50" y="70" width="8" height="15" rx="2" fill="#111827" />

        <Rect x="15" y="95" width="20" height="8" rx="2" fill="#111827" />
        <Rect x="45" y="95" width="12" height="18" rx="2" fill="#111827" />

        <Rect x="15" y="118" width="12" height="12" rx="2" fill="#111827" />
        <Rect x="35" y="118" width="8" height="8" rx="2" fill="#111827" />
        <Rect x="50" y="118" width="12" height="12" rx="2" fill="#111827" />

        {/* Mid-Right data */}
        <Rect x="140" y="70" width="15" height="8" rx="2" fill="#111827" />
        <Rect x="165" y="70" width="20" height="8" rx="2" fill="#111827" />

        <Rect x="140" y="85" width="8" height="18" rx="2" fill="#111827" />
        <Rect x="158" y="85" width="15" height="8" rx="2" fill="#111827" />
        <Rect x="180" y="85" width="8" height="18" rx="2" fill="#111827" />

        <Rect x="140" y="110" width="20" height="8" rx="2" fill="#111827" />
        <Rect x="170" y="110" width="15" height="18" rx="2" fill="#111827" />

        {/* Bottom modules */}
        <Rect x="70" y="140" width="18" height="8" rx="2" fill="#111827" />
        <Rect x="98" y="140" width="8" height="18" rx="2" fill="#111827" />
        <Rect x="115" y="140" width="15" height="8" rx="2" fill="#111827" />

        <Rect x="70" y="160" width="12" height="15" rx="2" fill="#111827" />
        <Rect x="90" y="165" width="18" height="8" rx="2" fill="#111827" />
        <Rect x="115" y="160" width="8" height="18" rx="2" fill="#111827" />

        <Rect x="70" y="180" width="22" height="8" rx="2" fill="#111827" />
        <Rect x="100" y="180" width="8" height="8" rx="2" fill="#111827" />
        <Rect x="118" y="180" width="12" height="8" rx="2" fill="#111827" />

        {/* Bottom-Right area */}
        <Rect x="140" y="140" width="12" height="12" rx="2" fill="#111827" />
        <Rect x="160" y="140" width="25" height="8" rx="2" fill="#111827" />

        <Rect x="140" y="160" width="18" height="8" rx="2" fill="#111827" />
        <Rect x="165" y="155" width="8" height="18" rx="2" fill="#111827" />
        <Rect x="180" y="160" width="8" height="12" rx="2" fill="#111827" />

        <Rect x="140" y="178" width="12" height="10" rx="2" fill="#111827" />
        <Rect x="160" y="178" width="28" height="10" rx="2" fill="#111827" />
      </Svg>

      {/* Center 'F' Fitfob Red Badge */}
      <View
        style={{
          position: 'absolute',
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: '#E23744',
          borderWidth: 3,
          borderColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        }}>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: -1 }}>
          F
        </Text>
      </View>
    </View>
  );
}
