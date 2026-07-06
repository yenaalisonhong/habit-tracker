import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YearWrappedModal from './YearWrappedModal';
import { useTracker } from '../context/TrackerContext';
import { toDateStr } from '../utils/dates';
import { isYearEndDay, YEAR_WRAPPED_KEY } from '../utils/year-wrapped';

export default function YearWrappedGate() {
  const { hydrated } = useTracker();
  const [visible, setVisible] = useState(false);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    async function check() {
      const todayStr = toDateStr(new Date());
      if (!isYearEndDay(todayStr)) return;

      const wrappedYear = new Date().getFullYear();
      const seen = await AsyncStorage.getItem(YEAR_WRAPPED_KEY(wrappedYear));
      if (seen === '1') return;

      setYear(wrappedYear);
      setVisible(true);
    }

    check();
  }, [hydrated]);

  async function handleClose() {
    if (year !== null) {
      await AsyncStorage.setItem(YEAR_WRAPPED_KEY(year), '1');
    }
    setVisible(false);
  }

  if (year === null) return null;

  return (
    <YearWrappedModal year={year} visible={visible} onClose={handleClose} />
  );
}
