import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';
const API_URL = 'http://localhost:3000/api';

const ASSET_TYPES = [
  { label: 'Solar Panel', value: 'SOLAR', icon: 'wb-sunny' },
  { label: 'EV Charger', value: 'EV', icon: 'ev-station' },
  { label: 'Clean Cooking', value: 'CLEAN_COOKING', icon: 'restaurant' },
  { label: 'Wind Turbine', value: 'WIND', icon: 'air' },
];

export default function AddAssetScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    assetType: 'SOLAR',
    assetName: '',
    capacityKw: '',
    installationDate: new Date().toISOString().split('T')[0],
    etimsItemCode: '',
  });

  const handleSave = async () => {
    if (!form.assetName) {
      Alert.alert('Error', 'Please enter an asset name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/carbon/${BUSINESS_ID}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capacityKw: form.capacityKw ? parseFloat(form.capacityKw) : null,
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Green asset registered successfully');
        router.back();
      } else {
        throw new Error('Failed to save asset');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not register asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Asset Type</Text>
      <View style={styles.typeGrid}>
        {ASSET_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeCard,
              form.assetType === type.value && styles.typeCardActive,
            ]}
            onPress={() => setForm({ ...form, assetType: type.value })}
          >
            <MaterialIcons 
              name={type.icon as any} 
              size={24} 
              color={form.assetType === type.value ? colors.white : colors.greyMid} 
            />
            <Text style={[
              styles.typeLabel,
              form.assetType === type.value && styles.typeLabelActive
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Asset Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Workshop Solar Array"
        placeholderTextColor={colors.greyMid}
        value={form.assetName}
        onChangeText={(val) => setForm({ ...form, assetName: val })}
      />

      <Text style={styles.label}>Capacity (kW)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 5.5"
        placeholderTextColor={colors.greyMid}
        keyboardType="numeric"
        value={form.capacityKw}
        onChangeText={(val) => setForm({ ...form, capacityKw: val })}
      />

      <Text style={styles.label}>Installation Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.greyMid}
        value={form.installationDate}
        onChangeText={(val) => setForm({ ...form, installationDate: val })}
      />

      <Text style={styles.label}>eTIMS Item Code (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="KRA Item Code"
        placeholderTextColor={colors.greyMid}
        value={form.etimsItemCode}
        onChangeText={(val) => setForm({ ...form, etimsItemCode: val })}
      />

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Register Asset</Text>
        )}
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    padding: spacing.screenPadding,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  typeCard: {
    width: '47%',
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: colors.mint,
    backgroundColor: 'rgba(52, 199, 189, 0.1)',
  },
  typeLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 12,
    color: colors.greyMid,
    marginTop: spacing.xs,
  },
  typeLabelActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  input: {
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    color: colors.white,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
  },
  saveButton: {
    backgroundColor: colors.mint,
    borderRadius: spacing.radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
