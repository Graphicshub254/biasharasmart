"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AddEmployeeScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';
function AddEmployeeScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [fullName, setFullName] = (0, react_1.useState)('');
    const [phone, setPhone] = (0, react_1.useState)('254');
    const [idNumber, setIdNumber] = (0, react_1.useState)('');
    const [dailyRate, setDailyRate] = (0, react_1.useState)('');
    const [employmentType, setEmploymentType] = (0, react_1.useState)('casual');
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const handleSave = async () => {
        if (!fullName || !phone || !dailyRate) {
            react_native_1.Alert.alert('Missing Fields', 'Please fill in name, phone, and daily rate.');
            return;
        }
        if (!phone.startsWith('254') || phone.length !== 12) {
            react_native_1.Alert.alert('Invalid Phone', 'Phone must be in format 254XXXXXXXXX');
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
            react_native_1.Alert.alert('Success', 'Employee added successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
        catch (error) {
            react_native_1.Alert.alert('Error', error.message);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <vector_icons_1.Ionicons name="arrow-back" size={24} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.title}>Add Employee</react_native_1.Text>
        <react_native_1.View style={{ width: 24 }}/>
      </react_native_1.View>

      <react_native_1.ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <react_native_1.View style={styles.inputGroup}>
          <react_native_1.Text style={styles.label}>Full Name</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} placeholder="e.g. John Kamau" placeholderTextColor={ui_tokens_1.colors.greyMid} value={fullName} onChangeText={setFullName}/>
        </react_native_1.View>

        <react_native_1.View style={styles.inputGroup}>
          <react_native_1.Text style={styles.label}>Phone Number</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} placeholder="2547XXXXXXXX" placeholderTextColor={ui_tokens_1.colors.greyMid} keyboardType="phone-pad" value={phone} onChangeText={setPhone}/>
        </react_native_1.View>

        <react_native_1.View style={styles.inputGroup}>
          <react_native_1.Text style={styles.label}>ID Number (Optional)</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} placeholder="12345678" placeholderTextColor={ui_tokens_1.colors.greyMid} keyboardType="numeric" value={idNumber} onChangeText={setIdNumber}/>
        </react_native_1.View>

        <react_native_1.View style={styles.inputGroup}>
          <react_native_1.Text style={styles.label}>Daily Rate (KES)</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} placeholder="e.g. 1500" placeholderTextColor={ui_tokens_1.colors.greyMid} keyboardType="numeric" value={dailyRate} onChangeText={setDailyRate}/>
        </react_native_1.View>

        <react_native_1.View style={styles.inputGroup}>
          <react_native_1.Text style={styles.label}>Employment Type</react_native_1.Text>
          <react_native_1.View style={styles.toggleRow}>
            <react_native_1.TouchableOpacity style={[styles.toggleBtn, employmentType === 'casual' && styles.toggleBtnActive]} onPress={() => setEmploymentType('casual')}>
              <react_native_1.Text style={[styles.toggleText, employmentType === 'casual' && styles.toggleTextActive]}>Casual</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={[styles.toggleBtn, employmentType === 'permanent' && styles.toggleBtnActive]} onPress={() => setEmploymentType('permanent')}>
              <react_native_1.Text style={[styles.toggleText, employmentType === 'permanent' && styles.toggleTextActive]}>Permanent</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={submitting}>
          {submitting ? (<react_native_1.ActivityIndicator color={ui_tokens_1.colors.ink}/>) : (<react_native_1.Text style={styles.saveButtonText}>Save Employee</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>
      </react_native_1.ScrollView>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingVertical: ui_tokens_1.spacing.md,
    },
    backButton: {
        padding: ui_tokens_1.spacing.xs,
    },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    form: {
        flex: 1,
    },
    formContent: {
        padding: ui_tokens_1.spacing.screenPadding,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: ui_tokens_1.spacing.lg,
    },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.xs,
    },
    input: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        padding: ui_tokens_1.spacing.md,
        color: ui_tokens_1.colors.white,
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        padding: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: ui_tokens_1.spacing.sm,
        alignItems: 'center',
        borderRadius: ui_tokens_1.spacing.radius.sm,
    },
    toggleBtnActive: {
        backgroundColor: ui_tokens_1.colors.cobalt,
    },
    toggleText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.greyMid,
    },
    toggleTextActive: {
        color: ui_tokens_1.colors.white,
    },
    saveButton: {
        backgroundColor: ui_tokens_1.colors.mint,
        paddingVertical: ui_tokens_1.spacing.md,
        borderRadius: ui_tokens_1.spacing.radius.md,
        alignItems: 'center',
        marginTop: ui_tokens_1.spacing.xl,
    },
    saveButtonText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.ink,
    },
});
