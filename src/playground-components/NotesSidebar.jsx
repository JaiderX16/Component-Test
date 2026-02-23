import React from 'react';
import { CirclePlus, Folder, FileSignature } from 'lucide-react';
import styles from './NotesSidebar.module.css';

// Utility for class names (simplified version of cn)
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Mock store for sidebar size
const useSettingStore = () => {
  // Returns the middle value (medium size) by default
  const useSideBarSize = (values) => {
    if (Array.isArray(values) && values.length >= 2) {
      return values[1]; // Return middle value if available
    }
    return values[0];
  };
  return { useSideBarSize };
};

const NotesFolder = (props) => {
  const { useSideBarSize } = useSettingStore();

  const Icon = props.icon || Folder;
  const textSizeClass = useSideBarSize(["text-xs", "text-sm", "text-base"]);
  const countSizeClass = useSideBarSize(["text-xxs", "text-xs", "text-sm"]);

  return (
    <div
      className={cn(
        styles.folderItem,
        props.active && styles.active
      )}
    >
      <Icon className={styles.icon} size={useSideBarSize([16, 18, 20])} />
      <span className={cn(styles.name, styles[textSizeClass])}>
        {props.name}
      </span>
      {props.count && (
        <span
          className={cn(
            styles.count,
            styles[countSizeClass]
          )}
        >
          {props.count}
        </span>
      )}
    </div>
  );
};

const NotesSidebar = () => {
  const { useSideBarSize } = useSettingStore();
  const headerSizeClass = useSideBarSize(["text-xxs", "text-xs", "text-sm"]);
  const newFolderSizeClass = useSideBarSize(["text-xs", "text-sm", "text-base"]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.folderList}>
        <NotesFolder name="Quick Notes" icon={FileSignature} fKey="qn" />
        <div className={styles.folderGroup}>
          <div
            className={cn(
              styles.folderHeader,
              styles[headerSizeClass]
            )}
          >
            iCloud
          </div>
          <NotesFolder name="All iClouds" fKey="aic" />
          <NotesFolder name="Notes" fKey="notes" />
          <NotesFolder name="Locked" fKey="locked" />
        </div>
      </div>
      <div className={styles.newFolder}>
        <CirclePlus size={useSideBarSize([16, 18, 20])} />
        <span className={cn(styles.name, styles[newFolderSizeClass])}>
          New Folder
        </span>
      </div>
    </div>
  );
};

export { NotesSidebar, NotesFolder };
export default NotesSidebar;
