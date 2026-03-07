import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import { SHIF_RATE, NSSF_TIER_1_MAX, NSSF_TIER_1_RATE, NSSF_TIER_2_MAX, NSSF_TIER_2_RATE } from '@biasharasmart/shared-types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';

interface Employee {
  id: string;
  fullName: string;
  dailyRateKes: number;
}

interface PayrollEntry {
  employeeId: string;
  fullName: string;
  dailyRateKes: number;
  daysWorked: string;
  selected: boolean;
}

export default function RunPayrollScreen() {
  const router = useRouter();
  const { selectedEmployeeId } = useLocalSearchParams<{ selectedEmployeeId?: string }>();
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payroll/${BUSINESS_ID}/employees`);
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data: Employee[] = await res.json();
      
      const initialEntries = data.map(emp => ({
        employeeId: emp.id,
        fullName: emp.fullName,
        dailyRateKes: emp.dailyRateKes,
        daysWorked: '1',
        selected: emp.id === selectedEmployeeId,
      }));
      setEntries(initialEntries);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const toggleSelect = (id: string) => {
    setEntries(prev => prev.map(e => 
      e.employeeId === id ? { ...e, selected: !e.selected } : e
    ));
  };

  const updateDays = (id: string, days: string) => {
    setEntries(prev => prev.map(e => 
      e.employeeId === id ? { ...e, daysWorked: days } : e
    ));
  };

  const calculateDeductions = (grossKes: number) => {
    const shif = +(grossKes * SHIF_RATE).toFixed(2);
    let nssf = 0;
    if (grossKes <= NSSF_TIER_1_MAX) {
      nssf = +(grossKes * NSSF_TIER_1_RATE).toFixed(2);
    } else if (grossKes <= NSSF_TIER_2_MAX) {
      nssf = +(NSSF_TIER_1_MAX * NSSF_TIER_1_RATE + (grossKes - NSSF_TIER_1_MAX) * NSSF_TIER_2_RATE).toFixed(2);
    } else {
      nssf = +(NSSF_TIER_1_MAX * NSSF_TIER_1_RATE + (NSSF_TIER_2_MAX - NSSF_TIER_1_MAX) * NSSF_TIER_2_RATE).toFixed(2);
    }
    return { shif, nssf, net: +(grossKes - shif - nssf).toFixed(2) };
  };

  const selectedEntries = entries.filter(e => e.selected);
  const totals = selectedEntries.reduce((acc, e) => {
    const gross = e.dailyRateKes * parseFloat(e.daysWorked || '0');
    const { shif, nssf, net } = calculateDeductions(gross);
    return {
      gross: acc.gross + gross,
      shif: acc.shif + shif,
      nssf: acc.nssf + nssf,
      net: acc.net + net,
    };
  }, { gross: 0, shif: 0, nssf: 0, net: 0 });

  const handlePayAll = async () => {
    if (selectedEntries.length === 0) {
      Alert.alert('No Selection', 'Please select at least one employee to pay.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date,
        entries: selectedEntries.map(e => ({
          employeeId: e.employeeId,
          daysWorked: parseFloat(e.daysWorked),
        })),
      };

      const res = await fetch(`${API_BASE}/api/payroll/${BUSINESS_ID}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to run payroll');
      
      const data = await res.json();
      Alert.alert('Success', `Paid ${data.results.length} employees. Total Net: KES ${data.totalNet.toLocaleString()}`, [
        { text: 'View Receipt', onPress: () => router.replace('/payroll') }
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
        <Text style={styles.title}>Run Payroll</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Payment Date:</Text>
        <Text style={styles.dateValue}>{date}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.mint} />
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {entries.map(item => {
            const gross = item.dailyRateKes * parseFloat(item.daysWorked || '0');
            const { shif, nssf, net } = calculateDeductions(gross);
            
            return (
              <View key={item.employeeId} style={[styles.entryCard, item.selected && styles.entryCardSelected]}>
                <TouchableOpacity 
                  style={styles.entryHeader} 
                  onPress={() => toggleSelect(item.employeeId)}
                >
                  <Ionicons 
                    name={item.selected ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={item.selected ? colors.mint : colors.greyMid} 
                  />
                  <Text style={styles.employeeName}>{item.fullName}</Text>
                  <Text style={styles.dailyRate}>@{item.dailyRateKes}/day</Text>
                </TouchableOpacity>

                {item.selected && (
                  <View style={styles.entryDetails}>
                    <View style={styles.daysInputRow}>
                      <Text style={styles.detailLabel}>Days worked:</Text>
                      <TextInput
                        style={styles.daysInput}
                        value={item.daysWorked}
                        onChangeText={(v) => updateDays(item.employeeId, v)}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                    
                    <View style={styles.deductionsTable}>
                      <View style={styles.deductionRow}>
                        <Text style={styles.deductionLabel}>Gross</Text>
                        <Text style={styles.deductionValue}>KES {gross.toFixed(2)}</Text>
                      </View>
                      <View style={styles.deductionRow}>
                        <Text style={styles.deductionLabel}>SHIF (2.75%)</Text>
                        <Text style={styles.deductionValue}>- KES {shif.toFixed(2)}</Text>
                      </View>
                      <View style={styles.deductionRow}>
                        <Text style={styles.deductionLabel}>NSSF (Tier 1+2)</Text>
                        <Text style={styles.deductionValue}>- KES {nssf.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.deductionRow, styles.netRow]}>
                        <Text style={styles.netLabel}>Net Pay</Text>
                        <Text style={styles.netValue}>KES {net.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Net Disbursement</Text>
          <Text style={styles.summaryValue}>KES {totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>
        <TouchableOpacity 
          style={styles.payAllButton}
          onPress={handlePayAll}
          disabled={submitting || selectedEntries.length === 0}
        >
          {submitting ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.payAllButtonText}>Pay {selectedEntries.length} Employees</Text>
          )}
        </TouchableOpacity>
      </View>
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
  dateRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  dateLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  dateValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  entryCard: {
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  entryCardSelected: {
    borderColor: colors.mint,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeName: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  dailyRate: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
  },
  entryDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.greyMid + '33',
  },
  daysInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.white,
  },
  daysInput: {
    backgroundColor: colors.ink,
    borderRadius: spacing.radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    color: colors.white,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    width: 60,
    textAlign: 'center',
  },
  deductionsTable: {
    backgroundColor: colors.ink,
    padding: spacing.md,
    borderRadius: spacing.radius.sm,
  },
  deductionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  deductionLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
  },
  deductionValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.white,
  },
  netRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.greyMid + '33',
  },
  netLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  netValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  summary: {
    padding: spacing.screenPadding,
    backgroundColor: colors.greyDark,
    borderTopLeftRadius: spacing.radius.xl,
    borderTopRightRadius: spacing.radius.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  summaryValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  payAllButton: {
    backgroundColor: colors.mint,
    paddingVertical: spacing.md,
    borderRadius: spacing.radius.md,
    alignItems: 'center',
  },
  payAllButtonText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink,
  },
});
