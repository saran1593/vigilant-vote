import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const getFingerprint = async (): Promise<string> => {
  const fpPromise = FingerprintJS.load();
  const fp = await fpPromise;
  const result = await fp.get();
  return result.visitorId;
};
