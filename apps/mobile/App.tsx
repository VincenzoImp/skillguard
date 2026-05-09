import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  addSkillGuardNotificationResponseListener,
  configureSkillGuardNotificationHandler,
  readInitialNotificationActionId,
} from "./src/expoPushNotifications";
import { WalletConnectScreen } from "./src/screens/WalletConnectScreen";
import {
  SKILLGUARD_IDENTITY,
  SOLANA_DEVNET_CHAIN,
  SOLANA_DEVNET_ENDPOINT,
} from "./src/wallet";

configureSkillGuardNotificationHandler();

export default function App() {
  const [notificationActionId, setNotificationActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    readInitialNotificationActionId()
      .then((actionId) => {
        if (!cancelled && actionId) {
          setNotificationActionId(actionId);
        }
      })
      .catch(() => undefined);

    const removeListener = addSkillGuardNotificationResponseListener((actionId) => {
      setNotificationActionId(actionId);
    });

    return () => {
      cancelled = true;
      removeListener();
    };
  }, []);

  return (
    <MobileWalletProvider
      chain={SOLANA_DEVNET_CHAIN}
      endpoint={SOLANA_DEVNET_ENDPOINT}
      identity={SKILLGUARD_IDENTITY}
      commitmentOrConfig="confirmed"
    >
      <StatusBar style="light" />
      <WalletConnectScreen
        notificationActionId={notificationActionId}
        onNotificationActionHandled={() => setNotificationActionId(null)}
      />
    </MobileWalletProvider>
  );
}
