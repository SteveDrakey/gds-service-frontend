import { createContext, useContext, useState, ReactNode } from 'react';

export interface ApplicationFormData {
  fullName: string;
  email: string;
  organisation: string;
  role: string;
  serviceSummary: string;
  understoodStandards: boolean;
}

interface FormContextValue {
  data: ApplicationFormData;
  update: (update: Partial<ApplicationFormData>) => void;
  reset: () => void;
}

const defaultData: ApplicationFormData = {
  fullName: '',
  email: '',
  organisation: '',
  role: '',
  serviceSummary: '',
  understoodStandards: false
};

const FormContext = createContext<FormContextValue | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<ApplicationFormData>(defaultData);

  const update = (updateValue: Partial<ApplicationFormData>) => {
    setData((current) => ({ ...current, ...updateValue }));
  };

  const reset = () => setData(defaultData);

  return (
    <FormContext.Provider value={{ data, update, reset }}>{children}</FormContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormData must be used within a FormProvider');
  }
  return context;
};
