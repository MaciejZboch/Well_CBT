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
        mimeType: "appication/x-sqlite3",
      });
      await FileSystem.deleteAsync(exportPath, { idempotent: true });
    } catch (err) {
      console.error("Failed to export \n", err);
    }
  };

  const importDB = async () => {
    const db = await dbPromise;
    const appPath: string | null = FileSystem.documentDirectory;
    const dbPath = `${appPath}/SQLite/${DB_NAME}`;

    try {
      const result: DocumentPicker.DocumentPickerResult =
        await DocumentPicker.getDocumentAsync({
          type: "*/*", //allow all types - otherwise errors will happen, I am told
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const backupPath: string = result.assets[0].uri;

      if (!(await FileSystem.getInfoAsync(backupPath)).exists) {
        throw Error("The document doesn't exist.");
      }

      await db.execAsync("PRAGMA wal_checkpoint(FULL)"); // headlog checkpoint - to prevent losing changes currently in general file
      await db.closeAsync();
      FileSystem.deleteAsync(`${dbPath}-wal`, { idempotent: true });
      FileSystem.deleteAsync(`${dbPath}-shm`, { idempotent: true });

      await FileSystem.copyAsync({
        from: backupPath,
        to: dbPath,
      });
      //MAKE SURE backup file is actual backupfile to not wreck the app, smh

      reloadAppAsync();
    } catch (err) {
      console.error(err);
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
        {/* Auto-save exercises */}
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
