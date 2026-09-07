export interface PreferenceRepository {
  getHideFinancialValues(): Promise<boolean>;
  setHideFinancialValues(hidden: boolean): Promise<void>;
}
