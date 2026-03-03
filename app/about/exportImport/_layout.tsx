import { Stack } from 'expo-router';
import React from 'react';

const ExportImportLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="exportImport" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ExportImportLayout;
