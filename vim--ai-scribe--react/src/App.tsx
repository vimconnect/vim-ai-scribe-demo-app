import { useEffect } from "react";
import { useVimSdkContext } from "./providers/VimSdkContext";
import { AiScribeDemo } from "./components/organisms/ai-scribe-demo/AiScribeDemo";
import "globals";

const useExploreNotification = () => {
  const vimSdk = useVimSdkContext();

  useEffect(() => {
    try {
      vimSdk.hub.pushNotification.show({
        text: `Explore the <b>Vim AI Scribe Demo</b> app to view SDK capabilities, grab app code, and unlock opportunities`,
        notificationId: crypto.randomUUID(),
        actionButtons: {
          rightButton: {
            text: "Explore app",
            buttonStyle: "PRIMARY",
            openAppButton: true,
            callback: () => {},
          },
        },
      });
    } catch (e) {
      console.error("failed to show push notification", e);
    }
  }, [vimSdk.hub.pushNotification]);
};

const useSetAppEnabled = () => {
  const vimSdk = useVimSdkContext();

  useEffect(() => {
    vimSdk.hub.setActivationStatus("ENABLED");
  }, [vimSdk]);
};

export const App = () => {
  useExploreNotification();
  useSetAppEnabled();

  return (
    <div className="w-full h-screen">
      <AiScribeDemo />
    </div>
  );
};
