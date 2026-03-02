import * as Device from "expo-device";
import { Href, router } from "expo-router";
import React, { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import DividerLine from "@/components/global/DividerLine";
import MenuNav from "@/components/global/MenuNav";
import Text from "@/components/global/Text";
import { Colors } from "@/constants/styles/colorTheme";
import { MaterialIcons } from "@expo/vector-icons";
import AdvanceButton from "@/components/global/AdvanceButton";
import { SCREEN_WIDTH } from "@/constants/styles/values";

type ExportImportItem = {
  body: string;
  button: ReactNode;
};

type ExportImportCategory = {
  title: string;
  items: ExportImportItem[];
};

const Index = () => {
  const { t } = useTranslation(["about", "common"]);

  const exportObj: ExportImportCategory = {
    title: t(`export_import.export.header`),
    items: [
      {
        body: t(`export_import.export.body`),
        button: (
          <AdvanceButton
            title={t(`export_import.export.button`)}
            btnStyle={{
              width: 216,
              height: 45,
              backgroundColor: "#81C784",
              borderWidth: 1,
              borderColor: Colors.lightGray,
              borderRadius: 12,
            }}
            onPress={() => {}}
            icon={<MaterialIcons name="upload" size={24} color="white" />}
          />
        ),
      },
    ],
  };

  const importObj: ExportImportCategory = {
    title: t(`export_import.import.header`),
    items: [
      {
        body: t(`export_import.import.body`),
        button: (
          <AdvanceButton
            title={t(`export_import.import.button`)}
            btnStyle={{
              width: 216,
              height: 45,
              backgroundColor: "#FFD54F",
              borderWidth: 1,
              borderColor: Colors.lightGray,
              borderRadius: 12,
            }}
            onPress={() => {}}
            icon={<MaterialIcons name="download" size={24} color="white" />}
          />
        ),
      },
    ],
  };

  const settingsData = [exportObj, importObj];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <MenuNav name={t(`export_import.titleShort`)} />
      <View className="m-4 items-center">
        <Text
          className="mt-4 w-full text-left"
          style={{ fontSize: 24, fontWeight: "500" }}
        >
          {t(`export_import.title`)}
        </Text>

        <Text className="text-lg mb-8 w-full text-left" style={{fontSize: 14, fontWeight: 400, color: "#757575"}}>
        <Trans
        default={t(`export_import.description`)}
        ns="learn"
          components={{
            bold: <Text style={{ fontWeight: 700 }} />,
          }}
        >
          {t(`export_import.description`)}
        </Trans>
        </Text>

        <DividerLine width={SCREEN_WIDTH * 0.33} />

        <View className="mt-6 w-full">
          {settingsData.map((segment, indexNum: number) => (
            <View className="mb-12 items-center" key={indexNum}>
              <Text
                className="mt-2 w-full text-left"
                style={{
                  color: Colors.offBlack,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                        <Trans
        default={t(`export_import.description`)}
        ns="learn"
          components={{
            bold: <Text style={{ fontWeight: 700 }} />,
          }}
        >
           {segment.title}
        </Trans>
               
              </Text>

              <View className="w-full">
                {segment.items.map((item, itemIndex: number) => (
                  <React.Fragment key={itemIndex}>
                    <View className="w-full items-center">
                      <Text
                        className="mb-4 w-full text-left"
                        style={{ fontSize: 14, weight: 400 }}
                      >
                                                <Trans
        default={t(`export_import.description`)}
        ns="learn"
          components={{
            bold: <Text style={{ fontWeight: 700 }} />,
          }}
        >
           {item.body}
        </Trans>
                      </Text>

                      <View className="items-center">
                        {item.button}
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default Index;