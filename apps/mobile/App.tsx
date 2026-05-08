import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { StatusBar } from "expo-status-bar";
import { WalletConnectScreen } from "./src/screens/WalletConnectScreen";
import {
  SKILLGUARD_IDENTITY,
  SOLANA_DEVNET_CHAIN,
  SOLANA_DEVNET_ENDPOINT,
} from "./src/wallet";

export default function App() {
  return (
    <MobileWalletProvider
      chain={SOLANA_DEVNET_CHAIN}
      endpoint={SOLANA_DEVNET_ENDPOINT}
      identity={SKILLGUARD_IDENTITY}
      commitmentOrConfig="confirmed"
    >
      <StatusBar style="light" />
      <WalletConnectScreen />
    </MobileWalletProvider>
  );
}
