import React, { useState, useEffect } from 'react';
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
import { CO2_KG_PER_KWH_KENYA } from '@biasharasmart/shared-types';

const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';
const API_URL = 'http://localhost:3000/api';

interface Asset {
  id: string;
  assetName: string;
  assetType: string;
}

export default function LogReadingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [form, setForm] = useState({
    readingDate: new Date().toISOString().split('T')[0],
    kwhGenerated: '',
    evKmCharged: '',
    cleanCookingMeals: '',
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch(`${API_URL}/carbon/${BUSINESS_ID}/assets`);
      const data = await res.json();
      setAssets(data);
      if (data.length > 0) setSelectedAssetId(data[0].id);
    } catch (err) {
      console.error('Error fetching assets:', err);
    }
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const calculateAvoided = () => {
    if (!selectedAsset) return 0;
    if (selectedAsset.assetType === 'SOLAR') {
      return (parseFloat(form.kwhGenerated) || 0) * CO2_KG_PER_KWH_KENYA;
    }
    if (selectedAsset.assetType === 'EV') {
      return (parseFloat(form.evKmCharged) || 0) * 0.21;
    }
    if (selectedAsset.assetType === 'CLEAN_COOKING') {
      return (parseInt(form.cleanCookingMeals) || 0) * 0.8;
    }
    return 0;
  };

  const handleSave = async () => {
    if (!selectedAssetId) {
      Alert.alert('Error', 'Please select an asset');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/carbon/${BUSINESS_ID}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAssetId,
          readingDate: form.readingDate,
          kwhGenerated: form.kwhGenerated ? parseFloat(form.kwhGenerated) : null,
          evKmCharged: form.evKmCharged ? parseFloat(form.evKmCharged) : null,
          cleanCookingMeals: form.cleanCookingMeals ? parseInt(form.cleanCookingMeals) : null,
        }),
      });

      if (res.ok) {
        Alert.alert(
          'Success', 
          'Reading logged! Would you like to recalculate your monthly dividend?',
          [
            { text: 'Later', onPress: () => router.back() },
            { 
              text: 'Calculate Now', 
              onPress: async () => {
                const now = new Date();
                await fetch(`${API_URL}/carbon/${BUSINESS_ID}/calculate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ month: now.getMonth() + 1, year: now.getFullYear() }),
                });
                router.back();
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to save reading');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not log reading. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Select Asset</Text>
      <View style={styles.assetList}>
        {assets.map((asset) => (
          <TouchableOpacity
            key={asset.id}
            style={[
              styles.assetCard,
              selectedAssetId === asset.id && styles.assetCardActive,
            ]}
            onPress={() => setSelectedAssetId(asset.id)}
          >
            <Text style={[
              styles.assetName,
              selectedAssetId === asset.id && styles.assetNameActive
            ]}>
              {asset.assetName}
            </Text>
            <Text style={styles.assetType}>{asset.assetType}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Reading Date</Text>
      <TextInput
        style={styles.input}
        value={form.readingDate}
        onChangeText={(val) => setForm({ ...form, readingDate: val })}
      />

      {selectedAsset?.assetType === 'SOLAR' && (
        <>
          <Text style={styles.label}>kWh Generated</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 12.5"
            placeholderTextColor={colors.greyMid}
            value={form.kwhGenerated}
            onChangeText={(val) => setForm({ ...form, kwhGenerated: val })}
          />
        </>
      )}

      {selectedAsset?.assetType === 'EV' && (
        <>
          <Text style={styles.label}>km Charged</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 45"
            placeholderTextColor={colors.greyMid}
            value={form.evKmCharged}
            onChangeText={(val) => setForm({ ...form, evKmCharged: val })}
          />
        </>
      )}

      {selectedAsset?.assetType === 'CLEAN_COOKING' && (
        <>
          <Text style={styles.label}>Number of Meals</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 3"
            placeholderTextColor={colors.greyMid}
            value={form.cleanCookingMeals}
            onChangeText={(val) => setForm({ ...form, cleanCookingMeals: val })}
          />
        </>
      )}

      <View style={styles.avoidedCard}>
        <MaterialIcons name="eco" size={24} color={colors.mint} />
        <View>
          <Text style={styles.avoidedLabel}>Estimated CO2 Avoided</Text>
          <Text style={styles.avoidedValue}>{calculateAvoided().toFixed(3)} kg</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save Reading</Text>
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
  assetList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  assetCard: {
    backgroundColor: colors.greyDark,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  assetCardActive: {
    borderColor: colors.mint,
    backgroundColor: 'rgba(52, 199, 189, 0.1)',
  },
  assetName: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  assetNameActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  assetType: {
    fontSize: 10,
    color: colors.greyMid,
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    color: colors.white,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
  },
  avoidedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(52, 199, 189, 0.1)',
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 189, 0.2)',
  },
  avoidedLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 10,
    color: colors.mint,
  },
  avoidedValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
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
