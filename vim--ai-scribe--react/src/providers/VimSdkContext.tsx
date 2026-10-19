import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { initVimSDK, type VimSDK } from "@vimconnect/app-sdk";

export const VimSdkContext = createContext<VimSDK>({} as VimSDK);

export const useVimSdkContext = () => {
  return useContext(VimSdkContext);
};

export const VimSdkProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [vimSdk, setVimSdk] = useState<VimSDK | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const disposed = useRef(false);

  useEffect(() => {
    disposed.current = false;
    initVimSDK()
      .then((sdk) => {
        if (!disposed.current) setVimSdk(sdk);
      })
      .catch((initError: unknown) => {
        if (disposed.current) return;
        setError(
          initError instanceof Error ? initError : new Error(String(initError))
        );
      });
    return () => {
      disposed.current = true;
    };
  }, []);

  if (error) {
    return <div role="alert">Vim SDK failed to load: {error.message}</div>;
  }

  if (!vimSdk) {
    return <div>Loading VimSDK...</div>;
  }

  return (
    <VimSdkContext.Provider value={vimSdk}>{children}</VimSdkContext.Provider>
  );
};
