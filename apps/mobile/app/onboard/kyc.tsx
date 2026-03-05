import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { colors, typography, spacing } from "@biasharasmart/ui-tokens";
import { ActionButton } from "../../src/components/ActionButton/ActionButton";
import { OnboardingStore } from "../../src/lib/onboarding-store";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type UploadState = "idle" | "picked" | "uploading" | "success" | "error";

export default function KycScreen() {
  const router = useRouter();
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [documentUrl, setDocumentUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setPickedFile(file);
      setUploadState("picked");
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("Failed to pick document");
    }
  };

  const uploadDocument = async () => {
    if (!pickedFile) return;
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
      await new Promise<void>((resolve, reject) => {
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
            } catch (e) {
              setDocumentUrl("uploaded");
              setUploadState("success");
              resolve();
            }
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", `${API_BASE}/api/onboard/submit-kyc`);
        xhr.send(formData);
      });
    } catch (e: any) {
      setUploadState("error");
      setErrorMsg(e.message ?? "Upload failed");
    }
  };

  const handleContinue = async () => {
    if (uploadState === "picked") {
      await uploadDocument();
      return;
    }
    if (uploadState !== "success") return;
    
    await OnboardingStore.saveStep("complete");
    await OnboardingStore.saveData({ kycDocumentUrl: documentUrl });
    router.push("/onboard/complete");
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={32} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Upload KYC Document</Text>
            <Text style={styles.subtitle}>Certificate of Incorporation or Business Registration</Text>
          </View>

          {uploadState === "idle" || uploadState === "error" ? (
            <TouchableOpacity 
              style={[styles.uploadArea, uploadState === "error" && styles.uploadAreaError]} 
              onPress={pickDocument}
            >
              <MaterialIcons name="upload-file" size={48} color={colors.greyMid} />
              <Text style={styles.uploadText}>Tap to select document</Text>
              <Text style={styles.uploadHint}>Accepted: PDF, JPG, PNG</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.previewCard}>
              <View style={styles.fileInfo}>
                <MaterialIcons name="description" size={32} color={colors.cobalt} />
                <View style={styles.fileNameContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>{pickedFile?.name}</Text>
                  <Text style={styles.fileSize}>{formatSize(pickedFile?.size)}</Text>
                </View>
                {uploadState === "picked" && (
                  <TouchableOpacity onPress={pickDocument}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>

              {uploadState === "uploading" && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressLabel}>Uploading...</Text>
                    <Text style={styles.progressPercent}>{progress}%</Text>
                  </View>
                </View>
              )}

              {uploadState === "success" && (
                <View style={styles.statusRow}>
                  <MaterialIcons name="check-circle" size={16} color={colors.mint} />
                  <Text style={styles.statusTextSuccess}>Document uploaded successfully</Text>
                </View>
              )}
            </View>
          )}

          {uploadState === "error" && (
            <View style={[styles.statusRow, { marginTop: spacing.md }]}>
              <MaterialIcons name="error" size={16} color={colors.red} />
              <Text style={styles.statusTextError}>{errorMsg}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.stepIndicator}>Step 4 of 4</Text>
          <ActionButton
            label={uploadState === "uploading" ? "Uploading..." : "Continue"}
            onPress={handleContinue}
            isDisabled={uploadState === "uploading" || uploadState === "idle"}
            isLoading={uploadState === "uploading"}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  container: {
    flex: 1,
    padding: spacing.screenPadding,
    justifyContent: "space-between",
  },
  backButton: {
    marginLeft: -spacing.sm,
    marginBottom: spacing.md,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  uploadArea: {
    height: 180,
    borderWidth: 2,
    borderColor: colors.greyDark,
    borderStyle: "dashed",
    borderRadius: spacing.radius.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  uploadAreaError: {
    borderColor: colors.red,
  },
  uploadText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.greyMid,
    marginTop: spacing.sm,
  },
  uploadHint: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileNameContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  fileName: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  fileSize: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
  changeText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.semibold,
    color: colors.cobalt,
  },
  progressContainer: {
    marginTop: spacing.lg,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.mint,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  progressLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
  progressPercent: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },
  statusTextSuccess: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.mint,
    marginLeft: spacing.xs,
  },
  statusTextError: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.red,
    marginLeft: spacing.xs,
  },
  footer: {
    marginBottom: spacing.lg,
  },
  stepIndicator: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
