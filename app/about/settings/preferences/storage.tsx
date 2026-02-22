import { reloadAppAsync } from "expo";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, Switch, View } from "react-native";
import AdvanceButton from "@/components/global/AdvanceButton";
import DividerLine from "@/components/global/DividerLine";
import MenuNav from "@/components/global/MenuNav";
import Text from "@/components/global/Text";
import { Colors } from "@/constants/styles/colorTheme";
import { SCREEN_WIDTH } from "@/constants/styles/values";
import { deleteAllDBData } from "@/db/service";
import {
  getUserSettingsData,
  handleSetExerciseAutoSaveIsActive,
  UserSettingsDataObj,
} from "@/db/settings";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as SQLite from "expo-sqlite";
import { DB_NAME, dbPromise } from "@/services/db";
import { formatDateToMonthNumAndYear } from "@/utils/dates";
import * as DocumentPicker from "expo-document-picker";

const SETTING_NAME = "storage";

const StorageSettingsPage = () => {
  const { t } = useTranslation(["about", "common"]);

  const [settingsData, setSettingsData] = useState<UserSettingsDataObj>();
  const [enableExerciseAutoSave, setEnableExerciseAutoSave] =
    useState<boolean>(false);

  const handleSaveSettings = async () => {
    await handleSetExerciseAutoSaveIsActive(enableExerciseAutoSave);
  };

  const exportDB = async () => {
    const date = new Date();
    const backupName =
      "WorryFree_DataBackup_" + formatDateToMonthNumAndYear(date, "_");

    try {
      const db = await dbPromise;
      await db.execAsync("PRAGMA wal_checkpoint(FULL)"); // headlog checkpoint - to prevent losing changes currently in general file
      const appPath: string | null = FileSystem.documentDirectory;
      const dbPath = `${appPath}/SQLite/${DB_NAME}`;
      const exportPath = `${appPath}/SQLite/${backupName}`;

      await FileSystem.copyAsync({
        from: dbPath,
        to: exportPath,
      });

      await Sharing.shareAsync(exportPath, {
        mimeType: "application/x-sqlite3",
      });

      await FileSystem.deleteAsync(exportPath, { idempotent: true });
    } catch (err) {
      console.error("Failed to export \n", err);
    }
  };

  const importDB = async () => {
    const validateWorryFreeDBFile = async (db: any) => {
      const REQUIRED_TABLES = [
        "userData",
        "userSettings",
        "seenOnboarding",
        "journalEntries",
      ];

      // Integrity check
      const integrity = await db.getFirstAsync("PRAGMA integrity_check;");
      if (!integrity || integrity.integrity_check !== "ok") {
        throw new Error("Invalid WorryFree datafile.");
      }

      // Table fingerprint validation
      const tables = await db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE type='table';`,
      );

      const tableNames = tables.map((t: any) => t.name);

      for (const table of REQUIRED_TABLES) {
        if (!tableNames.includes(table)) {
          throw new Error(`Missing required table: ${table}`);
        }
      }

      return true;
    };

    const db = await dbPromise;
    const appPath = FileSystem.documentDirectory!;
    const dbPath = `${appPath}/SQLite/${DB_NAME}`;
    const tempName = "temp_import.db";
    const tempPath = `${appPath}/SQLite/${tempName}`;

    try {
      const result: DocumentPicker.DocumentPickerResult =
        await DocumentPicker.getDocumentAsync({
          type: "*/*", //allow all types - otherwise fb files can't be picked
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) return;

      const backupPath = result.assets[0].uri;

      const fileInfo = await FileSystem.getInfoAsync(backupPath);
      if (!fileInfo.exists) {
        throw new Error("Selected file does not exist.");
      }

      // Copy to temp DB first
      await FileSystem.copyAsync({
        from: backupPath,
        to: tempPath,
      });

      // Open temp DB
      const tempDb = await SQLite.openDatabaseAsync(tempName);

      // Validate
      await validateWorryFreeDBFile(tempDb);
      await tempDb.closeAsync();

      // Safe replace
      await db.execAsync("PRAGMA wal_checkpoint(FULL)"); // ensure latest db file has all changes
      await db.closeAsync();

      await FileSystem.deleteAsync(`${dbPath}-wal`, { idempotent: true });
      await FileSystem.deleteAsync(`${dbPath}-shm`, { idempotent: true });

      await FileSystem.copyAsync({
        from: tempPath,
        to: dbPath,
      });

      // Alert success
      Alert.alert("Data successfully restored");

      reloadAppAsync();
    } catch (err) {
      console.error("Import failed:", err);
      Alert.alert(t("alerts.error"), "Invalid WorryFree data file.");
    } finally {
      await FileSystem.deleteAsync(tempPath, { idempotent: true });
    }
  };

  const handlePressDeleteAllData = () => {
    Alert.alert(
      t(`settings.${SETTING_NAME}.remove_all_alert.header`),
      t(`settings.${SETTING_NAME}.remove_all_alert.body`),
      [
        {
          text: t(`settings.${SETTING_NAME}.remove_all_alert.yes`),
          onPress: () => {
            deleteAllDBData();
            reloadAppAsync();
          },
        },
        {
          text: t(`settings.${SETTING_NAME}.remove_all_alert.no`),
          onPress: () => {
            router.back();
          },
          style: "cancel",
        },
      ],
      { cancelable: false },
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res: UserSettingsDataObj =
          (await getUserSettingsData()) as UserSettingsDataObj;
        if (res) {
          setSettingsData(res);
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
        Alert.alert(t("alerts.error"), t("alerts.error_db_fetching"));
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loadSavedSettings = () => {
      if (settingsData) {
        setEnableExerciseAutoSave(
          Boolean(settingsData.exerciseAutoSaveIsActive),
        );
      }
    };
    loadSavedSettings();
  }, [settingsData]);

  return (
    <ScrollView>
      <MenuNav
        name={t(`settings.${SETTING_NAME}.title`)}
        handleBackButtonPress={async () => {
          await handleSaveSettings();
        }}
      />
      <View className="m-4">
        <View className="mb-10 mt-10">
          <Text className="text-xl">
            {t(`settings.${SETTING_NAME}.exercises`)}
          </Text>
          <View className="mx-8 my-2 flex-row items-center justify-center py-4">
            <Text className="mx-2 text-lg">
              {t(`settings.${SETTING_NAME}.auto_save_exercises`)}
            </Text>
            <Switch
              className="mx-2"
              value={enableExerciseAutoSave}
              onValueChange={(val) => setEnableExerciseAutoSave(val)}
              ios_backgroundColor={Colors.lightGray}
              trackColor={{
                false: Colors.lightGray,
                true: Colors.darkBlue,
              }}
            />
          </View>
        </View>
        <DividerLine width={SCREEN_WIDTH * 0.5} />
        {/* Export/Import */}
        <View className="flex w-full items-center justify-center gap-4">
          <Text> Export/Import</Text>
          <AdvanceButton title="Export" onPress={() => exportDB()} />
          <AdvanceButton title="Import" onPress={() => importDB()} />
        </View>
        {/* Delete all data */}
        <View className="mt-10">
          <Text className="text-xl">
            {t(`settings.${SETTING_NAME}.remove_all_data`)}
          </Text>
          <View className="mt-4">
            <View className="mx-4 mb-10">
              <Text
                className="mb-2 mt-4 text-center text-xl"
                style={{ color: Colors.red }}
              >
                {t(`alerts.warning`, { ns: "common" })}!
              </Text>
              <Text className="mx-2 text-center">
                {t(`settings.${SETTING_NAME}.warning_message`)}
              </Text>
            </View>
            <AdvanceButton
              title={t(`settings.${SETTING_NAME}.remove_all_data`)}
              onPress={() => {
                handlePressDeleteAllData();
              }}
              btnStyle={{ backgroundColor: Colors.red }}
              icon={
                <MaterialIcons name="delete-forever" size={24} color="white" />
              }
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default StorageSettingsPage;
