
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  hint?: string;
  isDisabled?: boolean;
  secureTextEntry?: boolean;
  maxLength?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder, keyboardType = 'default',
  error, hint, isDisabled = false, secureTextEntry = false, maxLength,
}) => {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.red : focused ? colors.cobalt : colors.greyDark;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.greyMid}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={!isDisabled}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.medium,
    color: colors.greyMid,
    marginBottom: spacing.xs,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    height: spacing.touchTarget,
    backgroundColor: colors.greyDark,
    borderWidth: 1.5, borderRadius: spacing.radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.white,
  },
  error: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.red, marginTop: 4,
  },
  hint: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid, marginTop: 4,
  },
});
