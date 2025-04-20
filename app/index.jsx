import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  return <Redirect href='/SplashScreen' />;
}
