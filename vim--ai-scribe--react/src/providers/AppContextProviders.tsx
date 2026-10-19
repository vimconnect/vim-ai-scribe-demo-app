import type { FC, PropsWithChildren } from "react";
import { VimSdkProvider } from "./VimSdkContext";
import { NoteFormContext, useNoteForm } from "./NoteFormContext";

export const AppContextProviders: FC<PropsWithChildren> = ({ children }) => {
  const methods = useNoteForm();
  
  return (
    <VimSdkProvider>
      <NoteFormContext.Provider value={methods}>
        {children}
      </NoteFormContext.Provider>
    </VimSdkProvider>
  );
};
