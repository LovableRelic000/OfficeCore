import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, Radii, Spacing } from './tokens';

const LAYOUT_STYLE_KEYS = new Set([
  'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight',
  'alignSelf', 'zIndex', 'position', 'top', 'bottom', 'left', 'right'
]);

function splitStyles(style?: StyleProp<ViewStyle>) {
  if (!style) return { outerStyle: undefined, innerStyle: undefined };
  const flat = StyleSheet.flatten(style) || {};
  const outerStyle: ViewStyle = {};
  const innerStyle: ViewStyle = {};

  for (const [key, value] of Object.entries(flat)) {
    if (LAYOUT_STYLE_KEYS.has(key)) {
      (outerStyle as any)[key] = value;
    } else {
      (innerStyle as any)[key] = value;
    }
  }
  return { outerStyle, innerStyle };
}

interface NeuCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  onPress?: () => void;
}

export function NeuCard({ children, style, padding = Spacing.md, onPress }: NeuCardProps) {
  const { outerStyle, innerStyle } = splitStyles(style);

  const cardBody = (
    <View style={[styles.cardShadowLight, { borderRadius: Radii.lg }]}>
      <View style={[styles.cardShadowDark, { borderRadius: Radii.lg }]}>
        <View style={[styles.cardInner, { padding, borderRadius: Radii.lg }, innerStyle]}>
          {children}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={outerStyle}>
        {cardBody}
      </TouchableOpacity>
    );
  }
  return <View style={outerStyle}>{cardBody}</View>;
}

interface NeuButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  active?: boolean;
}

export function NeuButton({ children, onPress, style, textStyle, active = false }: NeuButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isInset = active || pressed;
  const { outerStyle, innerStyle } = splitStyles(style);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={outerStyle}
    >
      <View style={[isInset ? styles.btnInset : styles.btnShadowLight, { borderRadius: Radii.md }]}>
        <View style={[isInset ? null : styles.btnShadowDark, { borderRadius: Radii.md }]}>
          <View style={[styles.btnInner, isInset && styles.btnInnerPressed, innerStyle]}>
            {typeof children === 'string' ? (
              <Text style={[styles.btnText, isInset && styles.btnTextActive, textStyle]}>
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface NeuPrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export function NeuPrimaryButton({ title, onPress, style, textStyle, disabled = false }: NeuPrimaryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryBtn, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={[styles.primaryBtnText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

interface NeuToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export function NeuToggle({ value, onValueChange }: NeuToggleProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onValueChange(!value)}
      style={[styles.toggleTrack, value && styles.toggleTrackActive]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </TouchableOpacity>
  );
}

interface NeuInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  secureTextEntry?: boolean;
  keyboardType?: any;
}

export function NeuInput({
  value,
  onChangeText,
  placeholder,
  style,
  secureTextEntry,
  keyboardType,
}: NeuInputProps) {
  return (
    <View style={[styles.inputWell, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={styles.inputText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
    </View>
  );
}

interface NeuProgressRingProps {
  physical: number; // 0 - 100
  mental: number;   // 0 - 100
  caffeine: number; // 0 - 100
  overall: number;  // 0 - 100
  size?: number;
}

export function NeuProgressRing({
  physical,
  mental,
  caffeine,
  overall,
  size = 200,
}: NeuProgressRingProps) {
  const strokeWidth = 12;
  const center = size / 2;

  // Radii for concentric circles: Physical (outer), Mental (middle), Caffeine (inner)
  const rPhysical = center - strokeWidth;
  const rMental = rPhysical - strokeWidth - 6;
  const rCaffeine = rMental - strokeWidth - 6;

  const circPhysical = 2 * Math.PI * rPhysical;
  const circMental = 2 * Math.PI * rMental;
  const circCaffeine = 2 * Math.PI * rCaffeine;

  const strokeDashPhysical = (Math.min(100, Math.max(0, physical)) / 100) * circPhysical;
  const strokeDashMental = (Math.min(100, Math.max(0, mental)) / 100) * circMental;
  const strokeDashCaffeine = (Math.min(100, Math.max(0, caffeine)) / 100) * circCaffeine;

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Physical Track & Arc */}
          <Circle
            cx={center}
            cy={center}
            r={rPhysical}
            stroke={Colors.surfaceDeep}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={rPhysical}
            stroke={Colors.bandGreen}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeDashPhysical} ${circPhysical}`}
            strokeLinecap="round"
            fill="none"
          />

          {/* Mental Track & Arc */}
          <Circle
            cx={center}
            cy={center}
            r={rMental}
            stroke={Colors.surfaceDeep}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={rMental}
            stroke={Colors.accent}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeDashMental} ${circMental}`}
            strokeLinecap="round"
            fill="none"
          />

          {/* Caffeine Track & Arc */}
          <Circle
            cx={center}
            cy={center}
            r={rCaffeine}
            stroke={Colors.surfaceDeep}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={rCaffeine}
            stroke={Colors.bandAmber}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeDashCaffeine} ${circCaffeine}`}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={styles.ringCenterText}>
        <Text style={styles.ringScore}>{overall}</Text>
        <Text style={styles.ringLabel}>ENERGÍA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadowLight: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    width: '100%',
  },
  cardShadowDark: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 7,
    elevation: 3,
    width: '100%',
  },
  cardInner: {
    backgroundColor: Colors.surface,
    width: '100%',
  },
  btnShadowLight: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.85,
    shadowRadius: 5,
    width: '100%',
  },
  btnShadowDark: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 2,
    width: '100%',
  },
  btnInset: {
    backgroundColor: Colors.surfaceDeep,
    width: '100%',
  },
  btnInner: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnInnerPressed: {
    backgroundColor: Colors.surfaceDeep,
  },
  btnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  btnTextActive: {
    color: Colors.accent,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  toggleTrack: {
    width: 54,
    height: 30,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceDeep,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: Colors.surfaceDeep,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: Radii.circle,
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 24 }],
    backgroundColor: Colors.accent,
  },
  inputWell: {
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  ringLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginTop: 2,
  },
});

