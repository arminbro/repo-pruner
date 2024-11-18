export function calculateDaysOld(lastCommitDate: string): number {
  const now = new Date();
  const lastCommit = new Date(lastCommitDate);
  const diffTime = now.getTime() - lastCommit.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

  return diffDays;
}

export function calculateThresholdDate(inactiveDays: number) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - inactiveDays);

  return thresholdDate;
}
