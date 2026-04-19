import { useState, useEffect, useRef } from 'react';
import type { ArchiveItem, UnifiedMeasurement } from '../types/vaf';

const STORAGE_KEY_ARCHIVE = 'vector_analyzer_archive_v1';

interface UseArchiveReturn {
  archiveItems: ArchiveItem[];
  isArchiveOpen: boolean;
  setIsArchiveOpen: (open: boolean) => void;
  saveHint: string;
  handleSaveToArchive: (params: SaveParams) => void;
  handleLoadFromArchive: (item: ArchiveItem, onLoad: (item: ArchiveItem) => void) => void;
  handleDeleteFromArchive: (id: string, onConfirm: () => void) => void;
  handleExportArchive: () => void;
}

interface SaveParams {
  data: UnifiedMeasurement;
}

export function useArchive(): UseArchiveReturn {
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ARCHIVE);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [saveHint, setSaveHint] = useState('');
  const saveHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ARCHIVE, JSON.stringify(archiveItems));
  }, [archiveItems]);

  useEffect(() => {
    return () => {
      if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current);
    };
  }, []);

  const handleSaveToArchive = ({ data }: SaveParams) => {
    const timestamp = new Date().toISOString();
    let title = data.objectName || 'Новий замір';
    if (data.feeder) title += ` (${data.feeder})`;
    if (!data.objectName && !data.feeder) {
      title = `Замір ${new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
    }

    const newItem: ArchiveItem = {
      id: timestamp,
      title,
      date: new Date().toLocaleDateString('uk-UA'),
      data,
    };

    setArchiveItems((prev) => [...prev, newItem]);
    if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current);
    setSaveHint('Збережено!');
    saveHintTimerRef.current = setTimeout(() => {
      saveHintTimerRef.current = null;
      setSaveHint('');
    }, 2500);
  };

  const handleLoadFromArchive = (item: ArchiveItem, onLoad: (item: ArchiveItem) => void) => {
    onLoad(item);
    setIsArchiveOpen(false);
  };

  const handleDeleteFromArchive = (id: string, onConfirm: () => void) => {
    setArchiveItems((prev) => prev.filter((x) => x.id !== id));
    onConfirm();
  };

  const handleExportArchive = () => {
    const blob = new Blob([JSON.stringify(archiveItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VectorAnalyzer_Archive_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    archiveItems,
    isArchiveOpen,
    setIsArchiveOpen,
    saveHint,
    handleSaveToArchive,
    handleLoadFromArchive,
    handleDeleteFromArchive,
    handleExportArchive,
  };
}
