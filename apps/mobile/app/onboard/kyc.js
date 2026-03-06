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
exports.default = KycScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const DocumentPicker = __importStar(require("expo-document-picker"));
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ActionButton_1 = require("../../src/components/ActionButton/ActionButton");
const onboarding_store_1 = require("../../src/lib/onboarding-store");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
function KycScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [pickedFile, setPickedFile] = (0, react_1.useState)(null);
    const [uploadState, setUploadState] = (0, react_1.useState)("idle");
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [documentUrl, setDocumentUrl] = (0, react_1.useState)("");
    const [errorMsg, setErrorMsg] = (0, react_1.useState)("");
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/jpeg", "image/png"],
                copyToCacheDirectory: true,
            });
            if (result.canceled)
                return;
            const file = result.assets[0];
            setPickedFile(file);
            setUploadState("picked");
            setErrorMsg("");
        }
        catch (err) {
            setErrorMsg("Failed to pick document");
        }
    };
    const uploadDocument = async () => {
        if (!pickedFile)
            return;
        setUploadState("uploading");
        setProgress(0);
        const formData = new FormData();
        // @ts-ignore - FormData expects string or Blob, but React Native expects this object for files
        formData.append("file", {
            uri: pickedFile.uri,
            name: pickedFile.name,
            type: pickedFile.mimeType ?? "application/octet-stream",
        });
        try {
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            setDocumentUrl(data.url ?? "uploaded");
                            setUploadState("success");
                            resolve();
                        }
                        catch (e) {
                            setDocumentUrl("uploaded");
                            setUploadState("success");
                            resolve();
                        }
                    }
                    else {
                        reject(new Error("Upload failed"));
                    }
                };
                xhr.onerror = () => reject(new Error("Network error"));
                xhr.open("POST", `${API_BASE}/api/onboard/submit-kyc`);
                xhr.send(formData);
            });
        }
        catch (e) {
            setUploadState("error");
            setErrorMsg(e.message ?? "Upload failed");
        }
    };
    const handleContinue = async () => {
        if (uploadState === "picked") {
            await uploadDocument();
            return;
        }
        if (uploadState !== "success")
            return;
        await onboarding_store_1.OnboardingStore.saveStep("complete");
        await onboarding_store_1.OnboardingStore.saveData({ kycDocumentUrl: documentUrl });
        router.push("/onboard/complete");
    };
    const formatSize = (bytes) => {
        if (!bytes)
            return "0 KB";
        const kb = bytes / 1024;
        if (kb < 1024)
            return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };
    return (<react_native_1.SafeAreaView style={styles.safeArea}>
      <react_native_1.View style={styles.container}>
        <react_native_1.View>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <vector_icons_1.MaterialIcons name="chevron-left" size={32} color={ui_tokens_1.colors.white}/>
          </react_native_1.TouchableOpacity>

          <react_native_1.View style={styles.headerContainer}>
            <react_native_1.Text style={styles.title}>Upload KYC Document</react_native_1.Text>
            <react_native_1.Text style={styles.subtitle}>Certificate of Incorporation or Business Registration</react_native_1.Text>
          </react_native_1.View>

          {uploadState === "idle" || uploadState === "error" ? (<react_native_1.TouchableOpacity style={[styles.uploadArea, uploadState === "error" && styles.uploadAreaError]} onPress={pickDocument}>
              <vector_icons_1.MaterialIcons name="upload-file" size={48} color={ui_tokens_1.colors.greyMid}/>
              <react_native_1.Text style={styles.uploadText}>Tap to select document</react_native_1.Text>
              <react_native_1.Text style={styles.uploadHint}>Accepted: PDF, JPG, PNG</react_native_1.Text>
            </react_native_1.TouchableOpacity>) : (<react_native_1.View style={styles.previewCard}>
              <react_native_1.View style={styles.fileInfo}>
                <vector_icons_1.MaterialIcons name="description" size={32} color={ui_tokens_1.colors.cobalt}/>
                <react_native_1.View style={styles.fileNameContainer}>
                  <react_native_1.Text style={styles.fileName} numberOfLines={1}>{pickedFile?.name}</react_native_1.Text>
                  <react_native_1.Text style={styles.fileSize}>{formatSize(pickedFile?.size)}</react_native_1.Text>
                </react_native_1.View>
                {uploadState === "picked" && (<react_native_1.TouchableOpacity onPress={pickDocument}>
                    <react_native_1.Text style={styles.changeText}>Change</react_native_1.Text>
                  </react_native_1.TouchableOpacity>)}
              </react_native_1.View>

              {uploadState === "uploading" && (<react_native_1.View style={styles.progressContainer}>
                  <react_native_1.View style={styles.progressTrack}>
                    <react_native_1.View style={[styles.progressFill, { width: `${progress}%` }]}/>
                  </react_native_1.View>
                  <react_native_1.View style={styles.progressTextRow}>
                    <react_native_1.Text style={styles.progressLabel}>Uploading...</react_native_1.Text>
                    <react_native_1.Text style={styles.progressPercent}>{progress}%</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>)}

              {uploadState === "success" && (<react_native_1.View style={styles.statusRow}>
                  <vector_icons_1.MaterialIcons name="check-circle" size={16} color={ui_tokens_1.colors.mint}/>
                  <react_native_1.Text style={styles.statusTextSuccess}>Document uploaded successfully</react_native_1.Text>
                </react_native_1.View>)}
            </react_native_1.View>)}

          {uploadState === "error" && (<react_native_1.View style={[styles.statusRow, { marginTop: ui_tokens_1.spacing.md }]}>
              <vector_icons_1.MaterialIcons name="error" size={16} color={ui_tokens_1.colors.red}/>
              <react_native_1.Text style={styles.statusTextError}>{errorMsg}</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.View>

        <react_native_1.View style={styles.footer}>
          <react_native_1.Text style={styles.stepIndicator}>Step 4 of 4</react_native_1.Text>
          <ActionButton_1.ActionButton label={uploadState === "uploading" ? "Uploading..." : "Continue"} onPress={handleContinue} isDisabled={uploadState === "uploading" || uploadState === "idle"} isLoading={uploadState === "uploading"}/>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    container: {
        flex: 1,
        padding: ui_tokens_1.spacing.screenPadding,
        justifyContent: "space-between",
    },
    backButton: {
        marginLeft: -ui_tokens_1.spacing.sm,
        marginBottom: ui_tokens_1.spacing.md,
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    headerContainer: {
        marginBottom: ui_tokens_1.spacing.xl,
    },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginBottom: ui_tokens_1.spacing.sm,
    },
    subtitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
    uploadArea: {
        height: 180,
        borderWidth: 2,
        borderColor: ui_tokens_1.colors.greyDark,
        borderStyle: "dashed",
        borderRadius: ui_tokens_1.spacing.radius.md,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.02)",
    },
    uploadAreaError: {
        borderColor: ui_tokens_1.colors.red,
    },
    uploadText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.greyMid,
        marginTop: ui_tokens_1.spacing.sm,
    },
    uploadHint: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        marginTop: 4,
    },
    previewCard: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        padding: ui_tokens_1.spacing.md,
    },
    fileInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    fileNameContainer: {
        flex: 1,
        marginLeft: ui_tokens_1.spacing.sm,
    },
    fileName: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.white,
    },
    fileSize: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
    changeText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        color: ui_tokens_1.colors.cobalt,
    },
    progressContainer: {
        marginTop: ui_tokens_1.spacing.lg,
    },
    progressTrack: {
        height: 6,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: ui_tokens_1.colors.mint,
    },
    progressTextRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: ui_tokens_1.spacing.sm,
    },
    progressLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
    progressPercent: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: ui_tokens_1.spacing.md,
    },
    statusTextSuccess: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.mint,
        marginLeft: ui_tokens_1.spacing.xs,
    },
    statusTextError: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.red,
        marginLeft: ui_tokens_1.spacing.xs,
    },
    footer: {
        marginBottom: ui_tokens_1.spacing.lg,
    },
    stepIndicator: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        textAlign: "center",
        marginBottom: ui_tokens_1.spacing.md,
    },
});
