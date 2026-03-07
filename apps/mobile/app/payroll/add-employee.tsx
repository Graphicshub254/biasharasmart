import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';

export default function AddEmployeeScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('254');
  const [idNumber, setIdNumber] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [employmentType, setEmploymentType] = useState<'casual' | 'permanent'>('casual');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!fullName || !phone || !dailyRate) {
      Alert.alert('Missing Fields', 'Please fill in name, phone, and daily rate.');
      return;
    }

    if (!phone.startsWith('254') || phone.length !== 12) {
      Alert.alert('Invalid Phone', 'Phone must be in format 254XXXXXXXXX');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/payroll/${BUSINESS_ID}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          idNumber,
          dailyRateKes: parseFloat(dailyRate),
          employmentType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save employee');
      }

      Alert.alert('Success', 'Employee added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Employee</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Kamau"
            placeholderTextColor={colors.greyMid}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="2547XXXXXXXX"
            placeholderTextColor={colors.greyMid}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ID Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="12345678"
            placeholderTextColor={colors.greyMid}
            keyboardType="numeric"
            value={idNumber}
            onChangeText={setIdNumber}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Daily Rate (KES)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1500"
            placeholderTextColor={colors.greyMid}
            keyboardType="numeric"
            value={dailyRate}
            onChangeText={setDailyRate}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Employment Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.toggleBtn, employmentType === 'casual' && styles.toggleBtnActive]}
              onPress={() => setEmploymentType('casual')}
            >
              <Text style={[styles.toggleText, employmentType === 'casual' && styles.toggleTextActive]}>Casual</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, employmentType === 'permanent' && styles.toggleBtnActive]}
              onPress={() => setEmploymentType('permanent')}
            >
              <Text style={[styles.toggleText, employmentType === 'permanent' && styles.toggleTextActive]}>Permanent</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.saveButtonText}>Save Employee</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: spacing.screenPadding,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.greyMid,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    color: colors.white,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: spacing.radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: colors.cobalt,
  },
  toggleText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.greyMid,
  },
  toggleTextActive: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.mint,
    paddingVertical: spacing.md,
    borderRadius: spacing.radius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink,
  },
});
